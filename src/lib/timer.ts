/**
 * Pure, timestamp-based Pomodoro engine shared by the solo timer and the
 * shared-room timer. Nothing here counts down by decrementing — the remaining
 * time is always `endsAt - now`, so refreshes, background tabs and two
 * different devices all agree.
 */
import type { Durations, TimerMode, TimerState } from './types';
import { uid } from './util';

export const defaultDurations: Durations = { study: 25, short: 5, long: 15, longEvery: 4 };

export function phaseMs(mode: TimerMode, d: Durations): number {
  const min = mode === 'study' ? d.study : mode === 'short' ? d.short : d.long;
  return Math.round(min * 60_000);
}

export function newTimer(d: Durations, mode: TimerMode = 'study', keep?: Pick<TimerState, 'cycle' | 'skipsInRow'>): TimerState {
  const ms = phaseMs(mode, d);
  return {
    mode,
    status: 'idle',
    endsAt: null,
    remainingMs: ms,
    durationMs: ms,
    startedAt: null,
    cycle: keep?.cycle ?? 0,
    sessionId: `${mode}-${uid(8)}`,
    skipsInRow: keep?.skipsInRow ?? 0,
  };
}

export function remaining(t: TimerState, now: number): number {
  if (t.status === 'running' && t.endsAt != null) return Math.max(0, t.endsAt - now);
  return Math.max(0, t.remainingMs);
}

export function progress(t: TimerState, now: number): number {
  if (!t.durationMs) return 0;
  return Math.min(1, Math.max(0, 1 - remaining(t, now) / t.durationMs));
}

export function elapsedMs(t: TimerState, now: number): number {
  return Math.max(0, t.durationMs - remaining(t, now));
}

export function isDue(t: TimerState, now: number): boolean {
  return t.status === 'running' && t.endsAt != null && now >= t.endsAt;
}

export function start(t: TimerState, now: number): TimerState {
  if (t.status === 'running') return t;
  const rem = t.remainingMs > 0 ? t.remainingMs : t.durationMs;
  return {
    ...t,
    status: 'running',
    endsAt: now + rem,
    startedAt: t.startedAt ?? now,
    remainingMs: rem,
  };
}

export function pause(t: TimerState, now: number): TimerState {
  if (t.status !== 'running') return t;
  return { ...t, status: 'paused', remainingMs: remaining(t, now), endsAt: null };
}

export function reset(t: TimerState, d: Durations): TimerState {
  return newTimer(d, t.mode, t);
}

export function switchMode(t: TimerState, mode: TimerMode, d: Durations): TimerState {
  return newTimer(d, mode, { cycle: mode === 'long' ? t.cycle : t.cycle, skipsInRow: t.skipsInRow });
}

/** Start a one-off study block of a custom length (mood check-in plans). */
export function startCustom(t: TimerState, minutes: number, now: number): TimerState {
  const ms = Math.round(minutes * 60_000);
  return {
    ...newTimer({ study: minutes, short: 5, long: 15, longEvery: 4 }, 'study', t),
    durationMs: ms,
    remainingMs: ms,
    status: 'running',
    endsAt: now + ms,
    startedAt: now,
  };
}

export interface Finished {
  mode: TimerMode;
  sessionId: string;
  durationMs: number;
  cycleAfter: number;
  completedCycle: boolean;
}

/** Phase reached zero → next phase (auto-started if requested and not stale). */
export function complete(
  t: TimerState,
  d: Durations,
  now: number,
  autoBreak: boolean,
  autoStudy: boolean,
): { next: TimerState; finished: Finished } {
  let cycle = t.cycle;
  let nextMode: TimerMode;
  let completedCycle = false;
  if (t.mode === 'study') {
    cycle += 1;
    if (cycle >= d.longEvery) {
      nextMode = 'long';
      completedCycle = true;
    } else nextMode = 'short';
  } else {
    if (t.mode === 'long') cycle = 0;
    nextMode = 'study';
  }
  let next = newTimer(d, nextMode, { cycle, skipsInRow: t.mode === 'study' ? 0 : t.skipsInRow });
  const stale = t.endsAt != null && now - t.endsAt > 60_000; // finished while the app was closed
  const auto = nextMode === 'study' ? autoStudy : autoBreak;
  if (auto && !stale) next = start(next, now);
  return {
    next,
    finished: { mode: t.mode, sessionId: t.sessionId, durationMs: t.durationMs, cycleAfter: cycle, completedCycle },
  };
}

/** Skip the current phase without completing it. */
export function skip(t: TimerState, d: Durations): TimerState {
  if (t.mode === 'study') {
    return newTimer(d, t.cycle >= d.longEvery ? 'long' : 'short', { cycle: t.cycle, skipsInRow: t.skipsInRow + 1 });
  }
  return newTimer(d, 'study', { cycle: t.mode === 'long' ? 0 : t.cycle, skipsInRow: t.skipsInRow });
}

export const modeLabel: Record<TimerMode, string> = {
  study: 'study time',
  short: 'short break',
  long: 'long break',
};

export const modeEmoji: Record<TimerMode, string> = { study: '✏️', short: '☕', long: '🌿' };
