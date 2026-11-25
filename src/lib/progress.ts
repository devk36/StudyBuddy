import { achievements, type AchievementCtx } from '../content/achievements';
import type { AppState } from './store';
import { addDays, dayKey } from './util';

/** Consecutive days (ending today, or yesterday if today has nothing yet) with ≥1 session. */
export function computeStreak(history: AppState['stats']['history'], today = dayKey()): number {
  const has = (k: string) => (history[k]?.sessions ?? 0) > 0;
  let cursor = has(today) ? today : addDays(today, -1);
  let n = 0;
  while (has(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function achievementCtx(s: AppState): AchievementCtx {
  const t = s.stats.history[dayKey()] ?? { minutes: 0, sessions: 0, skips: 0 };
  return {
    todayMinutes: t.minutes,
    todaySessions: t.sessions,
    totalSessions: s.stats.totalSessions,
    totalMinutes: s.stats.totalMinutes,
    streak: computeStreak(s.stats.history),
    goalMinutes: s.settings.dailyGoal,
    lastSessionHour: s.stats.lastSessionHour,
    comeback: s.stats.comeback,
    sharedSessions: s.stats.sharedSessions,
    pets: s.pet.pets,
    fullCycles: s.stats.fullCycles,
  };
}

/** Returns ids of achievements that are newly satisfied. */
export function newlyUnlocked(s: AppState): string[] {
  const ctx = achievementCtx(s);
  return achievements.filter((a) => !s.stats.unlocked[a.id] && a.test(ctx)).map((a) => a.id);
}

/** Last N days for the little weekly chart. */
export function lastDays(history: AppState['stats']['history'], n: number) {
  const today = dayKey();
  return Array.from({ length: n }, (_, i) => {
    const k = addDays(today, i - (n - 1));
    return { key: k, minutes: history[k]?.minutes ?? 0, sessions: history[k]?.sessions ?? 0 };
  });
}
