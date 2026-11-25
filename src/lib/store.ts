/**
 * App state: one small store persisted to localStorage (solo mode works with
 * zero backend). Components read it with useApp(); actions live in actions.ts.
 */
import { useSyncExternalStore } from 'react';
import { personalize } from '../config/personalize';
import { defaultDurations, newTimer } from './timer';
import type { CheckinMood, DayStat, Durations, Slot, Species, ThemeId, TimerState } from './types';

export interface ProfileOverrides {
  friendName?: string;
  yourName?: string;
  petName?: string;
  species?: Species;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  note?: string;
  roomName?: string;
}

export interface Settings {
  durations: Durations;
  autoStartBreaks: boolean;
  autoStartStudy: boolean;
  sound: boolean;
  volume: number;
  notifications: boolean;
  theme: ThemeId;
  memePopups: boolean;
  focusHideMemes: boolean;
  focusHideMessages: boolean;
  dailyGoal: number; // minutes
  reduceMotion: boolean;
}

export interface AppState {
  v: 1;
  welcomed: boolean;
  profile: ProfileOverrides;
  settings: Settings;
  timer: TimerState;
  pet: {
    coins: number;
    owned: string[];
    equipped: Partial<Record<Slot, string>>;
    lastFedAt: number;
    pets: number;
  };
  stats: {
    history: Record<string, DayStat>;
    totalSessions: number;
    totalMinutes: number;
    credited: string[];
    unlocked: Record<string, number>;
    lastSessionHour: number | null;
    comeback: boolean;
    sharedSessions: number;
    fullCycles: number;
    goalRewardDays: string[];
  };
  favorites: string[];
  checkin: { day: string; mood: CheckinMood } | null;
  challenge: { day: string; text: string; done: boolean } | null;
  ambient: Record<string, number>;
  room: { lastCode: string | null; displayName: string };
}

const KEY = 'study-paws:v1';

export function defaultState(): AppState {
  return {
    v: 1,
    welcomed: false,
    profile: {},
    settings: {
      durations: { ...defaultDurations },
      autoStartBreaks: true,
      autoStartStudy: false,
      sound: true,
      volume: 0.6,
      notifications: false,
      theme: 'bedroom',
      memePopups: true,
      focusHideMemes: true,
      focusHideMessages: false,
      dailyGoal: 120,
      reduceMotion: false,
    },
    timer: newTimer(defaultDurations),
    pet: { coins: 0, owned: [], equipped: {}, lastFedAt: Date.now(), pets: 0 },
    stats: {
      history: {},
      totalSessions: 0,
      totalMinutes: 0,
      credited: [],
      unlocked: {},
      lastSessionHour: null,
      comeback: false,
      sharedSessions: 0,
      fullCycles: 0,
      goalRewardDays: [],
    },
    favorites: [],
    checkin: null,
    challenge: null,
    ambient: {},
    room: { lastCode: null, displayName: '' },
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Merge saved data onto defaults so new fields added in updates always exist. */
function hydrate(raw: unknown): AppState {
  const d = defaultState();
  if (!isObj(raw)) return d;
  const out = { ...d } as Record<string, unknown>;
  for (const k of Object.keys(d) as (keyof AppState)[]) {
    const dv = d[k] as unknown;
    const rv = raw[k];
    if (rv === undefined) continue;
    if (isObj(dv) && isObj(rv) && k !== 'timer') {
      out[k] = { ...dv, ...rv };
      if (k === 'settings') {
        (out[k] as Settings).durations = { ...d.settings.durations, ...(isObj(rv.durations) ? rv.durations : {}) };
      }
    } else out[k] = rv;
  }
  const s = out as unknown as AppState;
  if (!isObj(s.timer) || typeof (s.timer as TimerState).remainingMs !== 'number') s.timer = d.timer;
  return s;
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return hydrate(JSON.parse(raw));
  } catch {
    /* private mode / corrupted — start fresh */
  }
  return defaultState();
}

let state: AppState = load();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persistNow() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

export function getState(): AppState {
  return state;
}

export function setState(update: (s: AppState) => AppState, persistImmediately = false): void {
  const next = update(state);
  if (next === state) return;
  state = next;
  listeners.forEach((l) => l());
  if (persistImmediately) persistNow();
  else {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 250);
  }
}

/** Re-read localStorage (another tab may have changed it). */
export function syncFromStorage(): void {
  const fresh = load();
  state = fresh;
  listeners.forEach((l) => l());
}

export function resetAll(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  state = defaultState();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) syncFromStorage();
  });
  window.addEventListener('pagehide', persistNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistNow();
  });
}

/** Effective profile = personalize.ts defaults + the friend's own edits. */
export function profileOf(s: AppState) {
  return {
    friendName: s.profile.friendName || personalize.friendName,
    yourName: s.profile.yourName || personalize.yourName,
    petName: s.profile.petName || personalize.petName,
    species: s.profile.species || personalize.defaultPet,
    welcomeTitle: s.profile.welcomeTitle || personalize.welcomeTitle,
    welcomeSubtitle: s.profile.welcomeSubtitle || personalize.welcomeSubtitle,
    note: s.profile.note || personalize.note,
    roomName: s.profile.roomName || personalize.roomName,
  };
}

export function todayStat(s: AppState, key: string): DayStat {
  return s.stats.history[key] ?? { minutes: 0, sessions: 0, skips: 0 };
}
