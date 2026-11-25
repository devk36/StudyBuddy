/**
 * 🫂 Shared study rooms (Supabase Realtime).
 *
 * Source of truth: the `rooms` row in Postgres (timer, goals, version).
 * • Timer writes use optimistic concurrency (`version`) via update_room_timer.
 * • Every client computes the countdown from `endsAt` + a server-clock offset,
 *   so all devices show the same time even if their clocks disagree.
 * • Presence (who's online + studying/break) and reactions/messages travel
 *   over a PRIVATE broadcast channel only room members can join.
 * • Room state changes arrive via postgres_changes AND a broadcast nudge,
 *   with a refetch on reconnect / tab focus as a safety net.
 *
 * The connection lives app-wide, so your friend still sees you online while
 * you browse memes, and their hugs float onto whichever page you're on.
 */
import { useSyncExternalStore } from 'react';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { reactionEmojis } from '../content/messages';
import { creditStudy, equippedList, onPhaseFinished, onPhaseStarted, playSound } from './actions';
import { shopItems } from '../content/shop';
import { emit } from './events';
import { computeStreak } from './progress';
import { getState, profileOf, setState, todayStat } from './store';
import { ensureSession, getSupabase } from './supabase';
import * as T from './timer';
import type { Durations, Species, TimerMode, TimerState } from './types';
import { dayKey, uid } from './util';
import { getUi } from './ui';

export interface SharedTimer extends TimerState {
  d: Durations;
  autoBreak: boolean;
  autoStudy: boolean;
}

export interface RoomGoal {
  id: string;
  text: string;
  done: boolean;
  by?: string;
}

export interface RoomRow {
  id: string;
  code: string;
  name: string;
  timer: SharedTimer;
  goals: RoomGoal[];
  daily_goal_minutes: number;
  version: number;
  updated_at: string;
}

export interface MemberStats {
  streak?: number;
  todayMinutes?: number;
  todaySessions?: number;
  day?: string;
}

export interface Member {
  user_id: string;
  display_name: string;
  pet: Species;
  stats: MemberStats;
  last_seen: string;
}

export type PresenceStatus = 'studying' | 'break' | 'idle' | 'paused';

export interface PresenceInfo {
  userId: string;
  name: string;
  pet: Species;
  status: PresenceStatus;
  focus: boolean;
  /** equipped accessory ids (so my friend sees my pet's outfit) */
  acc: string[];
  at: number;
}

export interface FeedItem {
  id: string;
  from: string;
  name: string;
  text?: string;
  emoji?: string;
  at: number;
  mine: boolean;
}

export interface RoomState {
  status: 'idle' | 'connecting' | 'joined' | 'error';
  error: string | null;
  room: RoomRow | null;
  members: Member[];
  online: Record<string, PresenceInfo>;
  feed: FeedItem[];
  me: string | null;
  live: boolean;
  unread: number;
}

let rs: RoomState = { status: 'idle', error: null, room: null, members: [], online: {}, feed: [], me: null, live: false, unread: 0 };
const listeners = new Set<() => void>();
const set = (patch: Partial<RoomState>) => {
  rs = { ...rs, ...patch };
  listeners.forEach((l) => l());
};
export const getRoom = () => rs;
export function useRoom(): RoomState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getRoom,
    getRoom,
  );
}

let sb: SupabaseClient | null = null;
let channel: RealtimeChannel | null = null;
let dbChannel: RealtimeChannel | null = null;
let clockOffset = 0;
let lastPresenceKey = '';
const observed = new Set<string>();
const finishedHandled = new Set<string>();
const advanceTried = new Set<string>();

/** Server-corrected "now" for shared countdowns. */
export const serverNow = () => Date.now() + clockOffset;

export function sharedDefaults(): SharedTimer {
  const d = { ...getState().settings.durations };
  return { ...T.newTimer(d), d, autoBreak: true, autoStudy: false };
}

function normalizeRoom(raw: Record<string, unknown>): RoomRow {
  const r = raw as unknown as RoomRow;
  const timer = (r.timer && typeof r.timer === 'object' && 'mode' in r.timer ? r.timer : sharedDefaults()) as SharedTimer;
  if (!timer.d) timer.d = { ...getState().settings.durations };
  return { ...r, timer, goals: Array.isArray(r.goals) ? r.goals : [] };
}

function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message || String(e);
  if (/room not found/i.test(msg)) return "Hmm, we couldn't find that room. Double-check the code? 🔍";
  if (/room is full/i.test(msg)) return 'That room is full (6 friends max).';
  if (/too many rooms/i.test(msg)) return 'Whoa, lots of rooms! Please wait a bit before creating another.';
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "Can't reach the server — are you online?";
  return msg;
}

async function syncClock() {
  if (!sb) return;
  try {
    const t0 = Date.now();
    const { data, error } = await sb.rpc('server_now');
    const t1 = Date.now();
    if (!error && typeof data === 'number' && t1 - t0 < 3000) clockOffset = data - (t0 + t1) / 2;
  } catch {
    /* keep previous offset */
  }
}

function applyRoom(raw: Record<string, unknown> | null | undefined) {
  if (!raw || !rs.room || raw.id !== rs.room.id) return;
  const r = normalizeRoom(raw);
  if (r.version < rs.room.version) return;
  const prev = rs.room.timer;
  set({ room: r });
  // My friend pressed start on an idle phase → my pet reacts too.
  // (My own starts are applied optimistically, so prev is already running.)
  if (prev.status === 'idle' && r.timer.status === 'running' && r.timer.sessionId === prev.sessionId) {
    onPhaseStarted(r.timer.mode);
  }
}

async function refetchRoom() {
  if (!sb || !rs.room) return;
  const { data } = await sb.from('rooms').select('*').eq('id', rs.room.id).maybeSingle();
  if (data) applyRoom(data);
}

async function refetchMembers() {
  if (!sb || !rs.room) return;
  const { data } = await sb
    .from('room_members')
    .select('user_id, display_name, pet, stats, last_seen')
    .eq('room_id', rs.room.id)
    .order('joined_at');
  if (data) set({ members: data as Member[] });
}

const okEmoji = new Set<string>(reactionEmojis);
const okAcc = new Set<string>(shopItems.map((i) => i.id));
const okPet = new Set<string>(['cat', 'dog', 'bunny']);
const okStatus = new Set<string>(['studying', 'break', 'idle', 'paused']);
const clean = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f]/g, '').slice(0, max) : '');

function pushFeed(item: FeedItem) {
  const onRoomPage = location.hash.startsWith('#/room');
  set({ feed: [...rs.feed, item].slice(-40), unread: item.mine || onRoomPage ? rs.unread : rs.unread + 1 });
}

function receive(kind: 'reaction' | 'message', payload: Record<string, unknown>) {
  const from = clean(payload.from, 64);
  const name = clean(payload.name, 30) || 'Friend';
  if (!from || from === rs.me) return;
  const quiet = getUi().focus && getState().settings.focusHideMessages;
  if (kind === 'reaction') {
    const emoji = clean(payload.emoji, 8);
    if (!okEmoji.has(emoji)) return;
    pushFeed({ id: uid(), from, name, emoji, at: Date.now(), mine: false });
    if (!quiet) {
      emit('float', { emoji, count: 14, from: name });
      playSound('boop');
      emit('pet', { mood: 'blush', message: `${name} sent you ${emoji}! I think they love you 🥹`, ms: 5000, anim: 'bounce' });
    }
  } else {
    const text = clean(payload.text, 120).trim();
    if (!text) return;
    pushFeed({ id: uid(), from, name, text, at: Date.now(), mine: false });
    if (!quiet) {
      playSound('boop');
      emit('toast', { kind: 'info', title: `${name}: “${text}”`, emoji: '💌' });
      emit('pet', { mood: 'happy', message: `${name} says: ${text}`, ms: 6000, anim: 'bounce' });
    }
  }
}

async function openChannels(roomId: string, accessToken: string) {
  if (!sb) return;
  await closeChannels();
  try {
    await sb.realtime.setAuth(accessToken);
  } catch {
    /* older clients set it automatically */
  }
  const me = rs.me!;
  const ch = sb.channel(`room:${roomId}`, {
    config: { private: true, presence: { key: me }, broadcast: { self: false } },
  });
  ch.on('presence', { event: 'sync' }, () => {
    const state = ch.presenceState<PresenceInfo>();
    const online: Record<string, PresenceInfo> = {};
    for (const [key, metas] of Object.entries(state)) {
      const m = metas[metas.length - 1];
      if (m)
        online[key] = {
          userId: key,
          name: clean(m.name, 30),
          pet: okPet.has(m.pet) ? m.pet : 'cat',
          status: okStatus.has(m.status) ? m.status : 'idle',
          focus: !!m.focus,
          acc: Array.isArray(m.acc) ? m.acc.filter((a) => okAcc.has(a)).slice(0, 6) : [],
          at: Number(m.at) || 0,
        };
    }
    set({ online });
  });
  ch.on('presence', { event: 'join' }, ({ key }) => {
    if (key !== rs.me) {
      void refetchMembers();
      const name = rs.members.find((m) => m.user_id === key)?.display_name;
      if (name) emit('pet', { mood: 'excited', message: `${name} is here! Study party 🎉`, ms: 5000, anim: 'jump' });
    }
  });
  ch.on('broadcast', { event: 'reaction' }, ({ payload }) => receive('reaction', payload));
  ch.on('broadcast', { event: 'message' }, ({ payload }) => receive('message', payload));
  ch.on('broadcast', { event: 'room' }, ({ payload }) => applyRoom(payload?.room));
  ch.on('broadcast', { event: 'members' }, () => void refetchMembers());
  ch.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      set({ live: true });
      lastPresenceKey = '';
      updatePresence();
      void refetchRoom();
      void refetchMembers();
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      set({ live: false });
    }
  });
  channel = ch;

  // Separate channel for DB change events: if the realtime publication isn't
  // set up, the broadcast channel above still keeps everyone in sync.
  const db = sb.channel(`db-room-${roomId}`);
  db.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (p) =>
    applyRoom(p.new as Record<string, unknown>),
  );
  db.on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` }, () =>
    void refetchMembers(),
  );
  db.subscribe();
  dbChannel = db;
}

async function closeChannels() {
  const chs = [channel, dbChannel].filter(Boolean) as RealtimeChannel[];
  channel = null;
  dbChannel = null;
  for (const c of chs) {
    try {
      await c.untrack();
    } catch {
      /* ignore */
    }
    try {
      await sb?.removeChannel(c);
    } catch {
      /* ignore */
    }
  }
}

function myName() {
  const s = getState();
  return (s.room.displayName || profileOf(s).friendName).slice(0, 30);
}

/** Create a new room (code = undefined) or join an existing one. */
export async function connect(opts: { code?: string; createName?: string }) {
  set({ status: 'connecting', error: null });
  try {
    sb = await getSupabase();
    const session = await ensureSession(sb);
    set({ me: session.user.id });
    await syncClock();
    const s = getState();
    const pet = profileOf(s).species;
    let res;
    if (opts.createName !== undefined) {
      res = await sb.rpc('create_room', { p_name: opts.createName, p_display_name: myName(), p_pet: pet, p_timer: sharedDefaults() });
    } else {
      res = await sb.rpc('join_room', { p_code: (opts.code || '').toLowerCase().trim(), p_display_name: myName(), p_pet: pet });
    }
    if (res.error) throw res.error;
    const room = normalizeRoom(res.data as Record<string, unknown>);
    observed.clear();
    set({ room, status: 'joined', feed: [], unread: 0 });
    setState((x) => ({ ...x, room: { ...x.room, lastCode: room.code } }), true);
    await refetchMembers();
    await openChannels(room.id, session.access_token);
    void pushMyStats(true);
    return room;
  } catch (e) {
    set({ status: 'error', error: friendlyError(e), room: null, live: false });
    return null;
  }
}

export async function disconnect() {
  await closeChannels();
  set({ status: 'idle', room: null, members: [], online: {}, live: false, feed: [], unread: 0 });
}

export async function leaveRoom() {
  const r = rs.room;
  if (sb && r) {
    try {
      await sb.rpc('leave_room', { p_room: r.id });
      channel?.send({ type: 'broadcast', event: 'members', payload: {} });
    } catch {
      /* leaving offline is fine */
    }
  }
  setState((x) => ({ ...x, room: { ...x.room, lastCode: null } }), true);
  await disconnect();
}

// ---------- shared timer ----------

async function writeTimer(next: SharedTimer, expected: number) {
  if (!sb || !rs.room) return false;
  const { data, error } = await sb.rpc('update_room_timer', { p_room: rs.room.id, p_expected: expected, p_timer: next });
  if (error) {
    emit('toast', { kind: 'info', title: "Couldn't update the shared timer", body: friendlyError(error), emoji: '⚠️' });
    await refetchRoom();
    return false;
  }
  if (!data) {
    await refetchRoom(); // someone changed it first — take theirs
    return false;
  }
  applyRoom(data as Record<string, unknown>);
  channel?.send({ type: 'broadcast', event: 'room', payload: { room: data } });
  return true;
}

type TimerFn = (t: SharedTimer, now: number) => TimerState;

export async function mutateTimer(fn: TimerFn, opts?: { started?: boolean }) {
  const r = rs.room;
  if (!r) return;
  const now = serverNow();
  const base = fn(r.timer, now);
  const next: SharedTimer = { ...base, d: r.timer.d, autoBreak: r.timer.autoBreak, autoStudy: r.timer.autoStudy };
  // optimistic UI
  set({ room: { ...r, timer: next } });
  const ok = await writeTimer(next, r.version);
  if (ok && opts?.started) onPhaseStarted(next.mode);
}

export const roomTimer = {
  start: () => mutateTimer((t, now) => T.start(t, now), { started: rs.room?.timer.status === 'idle' }),
  pause: () => mutateTimer((t, now) => T.pause(t, now)),
  reset: () => {
    creditPartialShared();
    return mutateTimer((t) => T.reset(t, t.d));
  },
  skip: () => {
    creditPartialShared();
    return mutateTimer((t) => T.skip(t, t.d));
  },
  switchTo: (mode: TimerMode) => {
    creditPartialShared();
    return mutateTimer((t) => T.switchMode(t, mode, t.d));
  },
  setDurations: async (d: Durations, autoBreak: boolean, autoStudy: boolean) => {
    const r = rs.room;
    if (!r) return;
    const base = r.timer.status === 'idle' ? T.newTimer(d, r.timer.mode, r.timer) : r.timer;
    const next: SharedTimer = { ...base, d, autoBreak, autoStudy };
    set({ room: { ...r, timer: next } });
    await writeTimer(next, r.version);
  },
};

function creditPartialShared() {
  const t = rs.room?.timer;
  if (!t || t.mode !== 'study' || t.status === 'idle') return;
  const ms = T.elapsedMs(t, serverNow());
  if (ms >= 60_000) creditStudy({ sessionId: `room-${t.sessionId}-partial`, minutes: ms / 60_000, countSession: false, shared: true });
}

/** Called every tick from the app root while in a room. */
export function roomTick() {
  const r = rs.room;
  if (!r || rs.status !== 'joined') return;
  const t = r.timer;
  const now = serverNow();
  if (t.status === 'running' && T.remaining(t, now) > 1000) observed.add(t.sessionId);
  if (!T.isDue(t, now)) return;

  const { next, finished } = T.complete(t, t.d, now, t.autoBreak, t.autoStudy);
  if (!finishedHandled.has(t.sessionId)) {
    finishedHandled.add(t.sessionId);
    if (t.mode === 'study' && observed.has(t.sessionId)) {
      creditStudy({ sessionId: `room-${t.sessionId}`, minutes: t.durationMs / 60000, countSession: true, shared: true, completedCycle: finished.completedCycle });
    }
    if (observed.has(t.sessionId)) onPhaseFinished(finished, next.mode);
  }
  const attemptKey = `${t.sessionId}@${r.version}`;
  if (advanceTried.has(attemptKey)) return;
  advanceTried.add(attemptKey);
  const full: SharedTimer = { ...next, d: t.d, autoBreak: t.autoBreak, autoStudy: t.autoStudy };
  // small jitter so two clients don't collide every time
  setTimeout(() => {
    if (rs.room && rs.room.version === r.version && rs.room.timer.sessionId === t.sessionId) void writeTimer(full, r.version);
  }, Math.random() * 700);
}

// ---------- goals ----------

async function goalRpc(fn: string, args: Record<string, unknown>) {
  if (!sb || !rs.room) return;
  const { data, error } = await sb.rpc(fn, { p_room: rs.room.id, ...args });
  if (error) {
    emit('toast', { kind: 'info', title: 'Hmm, that didn’t save', body: friendlyError(error), emoji: '⚠️' });
    return;
  }
  applyRoom(data as Record<string, unknown>);
  channel?.send({ type: 'broadcast', event: 'room', payload: { room: data } });
}

export const roomGoals = {
  add: (text: string) => goalRpc('add_room_goal', { p_text: text.slice(0, 120) }),
  toggle: (id: string) => goalRpc('toggle_room_goal', { p_goal: id }),
  remove: (id: string) => goalRpc('remove_room_goal', { p_goal: id }),
  setDaily: (minutes: number) => goalRpc('set_room_daily_goal', { p_minutes: Math.round(minutes) }),
};

// ---------- reactions & messages ----------

let lastSend = 0;
export function sendReaction(emoji: string) {
  if (!channel || !okEmoji.has(emoji) || Date.now() - lastSend < 350) return;
  lastSend = Date.now();
  const name = myName();
  channel.send({ type: 'broadcast', event: 'reaction', payload: { from: rs.me, name, emoji } });
  pushFeed({ id: uid(), from: rs.me!, name, emoji, at: Date.now(), mine: true });
  emit('float', { emoji, count: 5 });
  playSound('pop');
}

let lastMsg = 0;
export function sendMessage(text: string): boolean {
  const clean2 = text.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 120);
  if (!channel || !clean2 || Date.now() - lastMsg < 1500) return false;
  lastMsg = Date.now();
  const name = myName();
  channel.send({ type: 'broadcast', event: 'message', payload: { from: rs.me, name, text: clean2 } });
  pushFeed({ id: uid(), from: rs.me!, name, text: clean2, at: Date.now(), mine: true });
  playSound('pop');
  return true;
}

export function markRead() {
  if (rs.unread) set({ unread: 0 });
}

// ---------- presence & stats ----------

export function myStatus(): PresenceStatus {
  const t = rs.room?.timer;
  if (!t) return 'idle';
  if (t.status === 'paused') return 'paused';
  if (t.status !== 'running') return 'idle';
  return t.mode === 'study' ? 'studying' : 'break';
}

export function updatePresence() {
  if (!channel || !rs.me || !rs.live) return;
  const s = getState();
  const info: PresenceInfo = {
    userId: rs.me,
    name: myName(),
    pet: profileOf(s).species,
    status: myStatus(),
    focus: getUi().focus,
    acc: equippedList(s.pet.equipped),
    at: Date.now(),
  };
  const key = `${info.name}|${info.pet}|${info.status}|${info.focus}|${info.acc.join(',')}`;
  if (key === lastPresenceKey) return;
  lastPresenceKey = key;
  void channel.track(info);
}

let lastStatsKey = '';
export async function pushMyStats(force = false) {
  if (!sb || !rs.room) return;
  const s = getState();
  const day = dayKey();
  const t = todayStat(s, day);
  const stats: MemberStats = { streak: computeStreak(s.stats.history), todayMinutes: Math.round(t.minutes), todaySessions: t.sessions, day };
  const key = JSON.stringify(stats) + myName() + profileOf(s).species;
  if (!force && key === lastStatsKey) return;
  lastStatsKey = key;
  const { error } = await sb.rpc('update_my_member', { p_room: rs.room.id, p_display_name: myName(), p_pet: profileOf(s).species, p_stats: stats });
  if (!error) channel?.send({ type: 'broadcast', event: 'members', payload: {} });
}

/** Resync when the tab comes back (mobile Safari suspends sockets in the background). */
export function onVisible() {
  if (rs.status !== 'joined') return;
  void syncClock();
  void refetchRoom();
  void refetchMembers();
}
