import { achievements } from '../content/achievements';
import { memeMoments } from '../content/memes';
import { shopItems, type ShopItem } from '../content/shop';
import { chime } from './audio';
import { emit } from './events';
import { notify } from './notify';
import { newlyUnlocked } from './progress';
import { getState, profileOf, setState, syncFromStorage, type AppState, type Settings } from './store';
import * as T from './timer';
import type { CheckinMood, Slot, TimerMode } from './types';
import { dayKey, daysBetween, pick } from './util';
import { challenges } from '../content/messages';

const sound = (k: Parameters<typeof chime>[0]) => {
  const s = getState().settings;
  if (s.sound) chime(k, s.volume);
};

export const playSound = sound;

/** Contextual meme popup (respects settings; Toasts component decides focus-mode hiding). */
export function memeMoment(moment: keyof typeof memeMoments) {
  if (!getState().settings.memePopups) return;
  emit('meme', { moment });
}

function unlockAchievements() {
  const ids = newlyUnlocked(getState());
  if (!ids.length) return;
  const now = Date.now();
  setState((s) => ({
    ...s,
    stats: { ...s.stats, unlocked: { ...s.stats.unlocked, ...Object.fromEntries(ids.map((id) => [id, now])) } },
    pet: { ...s.pet, coins: s.pet.coins + 5 * ids.length },
  }), true);
  ids.forEach((id, i) => {
    const a = achievements.find((x) => x.id === id);
    if (!a) return;
    setTimeout(() => {
      emit('toast', { kind: 'achievement', title: a.name, body: a.description, emoji: a.emoji });
      emit('confetti', { amount: 60 });
      sound('achievement');
    }, i * 1600);
  });
}

/**
 * Credit study time. `sessionId` makes this idempotent across refreshes,
 * multiple tabs and shared-room double events.
 */
export function creditStudy(opts: { sessionId: string; minutes: number; countSession: boolean; shared?: boolean; completedCycle?: boolean }) {
  syncFromStorage(); // another tab may have credited this already
  const s0 = getState();
  if (s0.stats.credited.includes(opts.sessionId)) return;
  const today = dayKey();
  const minutes = Math.max(0, Math.round(opts.minutes * 10) / 10);
  if (minutes <= 0 && !opts.countSession) return;

  const prevDay = s0.stats.history[today];
  const hadToday = (prevDay?.sessions ?? 0) > 0;
  const prevActive = Object.keys(s0.stats.history)
    .filter((k) => k < today && s0.stats.history[k].sessions > 0)
    .sort()
    .pop();
  const goal = s0.settings.dailyGoal;
  const beforeMin = prevDay?.minutes ?? 0;

  setState((s) => {
    const d = s.stats.history[today] ?? { minutes: 0, sessions: 0, skips: 0 };
    const nd = { ...d, minutes: d.minutes + minutes, sessions: d.sessions + (opts.countSession ? 1 : 0) };
    const reachedGoal = beforeMin < goal && nd.minutes >= goal && !s.stats.goalRewardDays.includes(today);
    return {
      ...s,
      stats: {
        ...s.stats,
        history: { ...s.stats.history, [today]: nd },
        totalMinutes: s.stats.totalMinutes + minutes,
        totalSessions: s.stats.totalSessions + (opts.countSession ? 1 : 0),
        credited: [...s.stats.credited, opts.sessionId].slice(-200),
        lastSessionHour: opts.countSession ? new Date().getHours() : s.stats.lastSessionHour,
        comeback: s.stats.comeback || (opts.countSession && !hadToday && !!prevActive && daysBetween(prevActive, today) >= 3),
        sharedSessions: s.stats.sharedSessions + (opts.shared && opts.countSession ? 1 : 0),
        fullCycles: s.stats.fullCycles + (opts.completedCycle ? 1 : 0),
        goalRewardDays: reachedGoal ? [...s.stats.goalRewardDays, today].slice(-60) : s.stats.goalRewardDays,
      },
      pet: { ...s.pet, coins: s.pet.coins + (opts.countSession ? 10 : 0) + (reachedGoal ? 25 : 0) },
    };
  }, true);

  const after = getState();
  const afterMin = after.stats.history[today]?.minutes ?? 0;
  if (opts.countSession) emit('toast', { kind: 'coins', title: '+10 paw coins', emoji: '🪙' });
  if (beforeMin < goal && afterMin >= goal) {
    setTimeout(() => {
      emit('pet', { mood: 'proud', activity: 'celebrating', message: pick(['Look at you. Actually getting your life together. Iconic.', 'DAILY GOAL DONE. I am crying happy tears.']), ms: 9000, anim: 'jump' });
      emit('confetti', { amount: 120 });
      memeMoment('goalReached');
    }, 2500);
  }
  unlockAchievements();
}

export function checkAchievements() {
  unlockAchievements();
}

function recordSkip() {
  const today = dayKey();
  setState((s) => {
    const d = s.stats.history[today] ?? { minutes: 0, sessions: 0, skips: 0 };
    return { ...s, stats: { ...s.stats, history: { ...s.stats.history, [today]: { ...d, skips: d.skips + 1 } } } };
  });
}

// ---------- solo timer ----------

const settings = () => getState().settings;
const setTimer = (fn: (t: AppState['timer']) => AppState['timer']) =>
  setState((s) => ({ ...s, timer: fn(s.timer) }), true);

export function soloStart() {
  const t = getState().timer;
  const fresh = t.status === 'idle';
  setTimer((x) => T.start(x, Date.now()));
  if (fresh) onPhaseStarted(getState().timer.mode);
}

export function soloPause() {
  setTimer((x) => T.pause(x, Date.now()));
  emit('pet', { mood: 'confused', message: 'Paused? Okay. I will guard the timer.', ms: 4000 });
}

/** Credit partial focus time when leaving a study phase early. */
function creditPartial(t: AppState['timer'], shared = false) {
  if (t.mode !== 'study' || t.status === 'idle') return;
  const ms = T.elapsedMs(t, Date.now());
  if (ms >= 60_000) creditStudy({ sessionId: `${t.sessionId}-partial`, minutes: ms / 60_000, countSession: false, shared });
}

export function soloReset() {
  const t = getState().timer;
  creditPartial(t);
  setTimer((x) => T.reset(x, settings().durations));
}

export function soloSkip() {
  const t = getState().timer;
  creditPartial(t);
  if (t.mode === 'study') {
    recordSkip();
    if (t.skipsInRow + 1 >= 2) {
      emit('pet', { mood: 'disappointed', message: 'Skipping again? I am literally a pet and somehow more productive.', ms: 7000, anim: 'wiggle' });
      memeMoment('skipping');
    } else emit('pet', { mood: 'annoyed', message: 'I am not judging you. Okay, maybe a little.', ms: 5000 });
  }
  setTimer((x) => T.skip(x, settings().durations));
}

export function soloSwitch(mode: TimerMode) {
  const t = getState().timer;
  creditPartial(t);
  setTimer((x) => T.switchMode(x, mode, settings().durations));
}

export function soloStartCustom(minutes: number) {
  setTimer((x) => T.startCustom(x, minutes, Date.now()));
  onPhaseStarted('study');
}

export function onPhaseStarted(mode: TimerMode) {
  if (mode === 'study') {
    emit('pet', { mood: 'focused', activity: 'reading', message: pick(['Okay, no distractions. We are locked in. 🔒', "I'll stay awake with you. Probably.", 'No thoughts. Just studying.']), ms: 6000 });
    memeMoment('studyStart');
  } else {
    memeMoment('break');
  }
}

/** Called after any phase completes (solo or shared). */
export function onPhaseFinished(f: T.Finished, nextMode: TimerMode) {
  const name = profileOf(getState()).petName;
  if (f.mode === 'study') {
    sound('done');
    const mins = Math.round(f.durationMs / 60000);
    notify(`${name} says: session done! 🎉`, `You studied ${mins} minutes. ${nextMode === 'long' ? 'Long break time 🌿' : 'Take a little break ☕'}`);
    if (f.completedCycle) {
      emit('pet', { mood: 'proud', activity: 'celebrating', message: 'Academic weapon status unlocked. ⚔️ Tiny party!!', ms: 10000, anim: 'jump' });
      emit('confetti', { amount: 150 });
      memeMoment('fourSessions');
    } else {
      emit('pet', { mood: 'excited', activity: 'celebrating', message: `You studied for ${mins} minutes?! I am SO proud of you.`, ms: 8000, anim: 'jump' });
      emit('confetti', { amount: 70 });
      memeMoment('sessionDone');
    }
  } else {
    sound('break');
    notify(`Break's over 🐾`, `${name} is ready for the next session whenever you are.`);
    emit('pet', { mood: 'motivational', message: 'Break over! One more session and then we get snacks.', ms: 6000, anim: 'bounce' });
  }
}

/** Run every tick from the app root: finishes the solo phase when it's due. */
export function soloTick(now: number) {
  const t = getState().timer;
  if (!T.isDue(t, now)) return;
  syncFromStorage();
  const fresh = getState().timer;
  if (!T.isDue(fresh, now)) return;
  const s = settings();
  const { next, finished } = T.complete(fresh, s.durations, now, s.autoStartBreaks, s.autoStartStudy);
  setTimer(() => next);
  if (finished.mode === 'study') {
    creditStudy({ sessionId: finished.sessionId, minutes: finished.durationMs / 60000, countSession: true, completedCycle: finished.completedCycle });
  }
  onPhaseFinished(finished, next.mode);
}

// ---------- settings / profile ----------

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => {
    const settingsNext = { ...s.settings, ...patch };
    let timer = s.timer;
    // keep an idle timer in sync with new durations
    if (patch.durations && timer.status === 'idle') timer = T.reset(timer, settingsNext.durations);
    return { ...s, settings: settingsNext, timer };
  }, true);
  if (patch.dailyGoal) unlockAchievements();
}

export function updateProfile(patch: AppState['profile']) {
  setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }), true);
}

export function finishWelcome() {
  setState((s) => ({ ...s, welcomed: true }), true);
}

// ---------- pet ----------

export function recordPet() {
  setState((s) => ({ ...s, pet: { ...s.pet, pets: s.pet.pets + 1 } }));
  const p = getState().pet.pets;
  if (p === 50) unlockAchievements();
}

export function feed(_kind: 'snack' | 'coffee' | 'milk' | 'cookie') {
  setState((s) => ({ ...s, pet: { ...s.pet, lastFedAt: Date.now() } }), true);
  sound('pop');
}

export function buyItem(item: ShopItem): boolean {
  const s = getState();
  if (s.pet.owned.includes(item.id) || s.pet.coins < item.cost) return false;
  setState((x) => ({
    ...x,
    pet: { ...x.pet, coins: x.pet.coins - item.cost, owned: [...x.pet.owned, item.id], equipped: { ...x.pet.equipped, [item.slot]: item.id } },
  }), true);
  sound('coin');
  emit('pet', { mood: 'excited', message: item.reaction, ms: 6000, anim: 'jump' });
  emit('confetti', { amount: 40 });
  return true;
}

export function toggleEquip(item: ShopItem) {
  setState((s) => {
    const eq = { ...s.pet.equipped };
    if (eq[item.slot] === item.id) delete eq[item.slot];
    else eq[item.slot] = item.id;
    return { ...s, pet: { ...s.pet, equipped: eq } };
  }, true);
}

export const itemById = (id: string) => shopItems.find((i) => i.id === id);
export const equippedList = (eq: Partial<Record<Slot, string>>) => Object.values(eq).filter(Boolean) as string[];

// ---------- memes, check-in, challenges ----------

export function toggleFavorite(id: string) {
  setState((s) => ({
    ...s,
    favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
  }), true);
}

export function checkIn(mood: CheckinMood) {
  setState((s) => ({ ...s, checkin: { day: dayKey(), mood } }), true);
}

export function newChallenge() {
  const prev = getState().challenge;
  let text = pick(challenges);
  if (prev && challenges.length > 1) while (text === prev.text) text = pick(challenges);
  setState((s) => ({ ...s, challenge: { day: dayKey(), text, done: false } }), true);
}

export function completeChallenge() {
  const c = getState().challenge;
  if (!c || c.done) return;
  setState((s) => ({ ...s, challenge: s.challenge && { ...s.challenge, done: true }, pet: { ...s.pet, coins: s.pet.coins + 5 } }), true);
  sound('coin');
  emit('toast', { kind: 'coins', title: 'Challenge done! +5 paw coins', emoji: '✅' });
  emit('pet', { mood: 'proud', message: 'Challenge complete! You are unstoppable.', ms: 5000, anim: 'jump' });
}
