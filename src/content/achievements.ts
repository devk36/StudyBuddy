/**
 * 🏆 Achievements. Add one by appending an object with a `test(ctx)` function.
 * `ctx` is computed in src/lib/achievements.ts.
 */
export interface AchievementCtx {
  todayMinutes: number;
  todaySessions: number;
  totalSessions: number;
  totalMinutes: number;
  streak: number;
  goalMinutes: number;
  lastSessionHour: number | null;
  comeback: boolean;
  sharedSessions: number;
  pets: number;
  fullCycles: number;
}

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  color: 'blush' | 'lavender' | 'peach' | 'sky' | 'sage' | 'butter';
  test: (c: AchievementCtx) => boolean;
}

export const achievements: Achievement[] = [
  { id: 'tiny-scholar', emoji: '🐾', name: 'Tiny Scholar', description: 'Finish your very first study session.', color: 'blush', test: (c) => c.totalSessions >= 1 },
  { id: 'warming-up', emoji: '☕', name: 'Warming Up', description: 'Study 30 minutes in one day.', color: 'peach', test: (c) => c.todayMinutes >= 30 },
  { id: 'hour-power', emoji: '⏳', name: 'Hour of Power', description: 'Study a full hour in one day.', color: 'sky', test: (c) => c.todayMinutes >= 60 },
  { id: 'triple-treat', emoji: '🍡', name: 'Triple Treat', description: 'Complete 3 sessions in one day.', color: 'lavender', test: (c) => c.todaySessions >= 3 },
  { id: 'focus-monster', emoji: '👾', name: 'Focus Monster', description: 'Complete 5 sessions in one day.', color: 'sage', test: (c) => c.todaySessions >= 5 },
  { id: 'goal-getter', emoji: '🎯', name: 'Goal Getter', description: 'Reach your daily study goal.', color: 'butter', test: (c) => c.todayMinutes >= c.goalMinutes },
  { id: 'academic-weapon', emoji: '⚔️', name: 'Academic Weapon', description: 'Finish a full cycle of sessions and earn a long break.', color: 'blush', test: (c) => c.fullCycles >= 1 },
  { id: 'sleep-deprived-genius', emoji: '🌙', name: 'Sleep Deprived Genius', description: 'Finish a session between 11pm and 4am.', color: 'lavender', test: (c) => c.lastSessionHour !== null && (c.lastSessionHour >= 23 || c.lastSessionHour < 4) },
  { id: 'early-bird', emoji: '🌅', name: 'Early Bird', description: 'Finish a session between 5am and 8am.', color: 'peach', test: (c) => c.lastSessionHour !== null && c.lastSessionHour >= 5 && c.lastSessionHour < 8 },
  { id: 'streak-3', emoji: '🔥', name: 'On a Roll', description: 'Study 3 days in a row.', color: 'peach', test: (c) => c.streak >= 3 },
  { id: 'streak-7', emoji: '👑', name: 'Consistency Queen/King', description: 'Study 7 days in a row.', color: 'butter', test: (c) => c.streak >= 7 },
  { id: 'streak-30', emoji: '🏆', name: 'Study Paws Champion', description: 'A 30-day streak. Legendary.', color: 'blush', test: (c) => c.streak >= 30 },
  { id: 'comeback', emoji: '🌱', name: 'The Comeback Kid', description: 'Come back after 2+ days away and finish a session.', color: 'sage', test: (c) => c.comeback },
  { id: 'better-together', emoji: '🫂', name: 'Better Together', description: 'Finish a session in a shared room.', color: 'sky', test: (c) => c.sharedSessions >= 1 },
  { id: 'pet-lover', emoji: '💕', name: 'Certified Pet Lover', description: 'Pet your companion 50 times.', color: 'blush', test: (c) => c.pets >= 50 },
  { id: 'library-legend', emoji: '📚', name: 'Library Legend', description: 'Complete 25 sessions in total.', color: 'lavender', test: (c) => c.totalSessions >= 25 },
  { id: 'ten-hours', emoji: '💯', name: 'Ten Hour Club', description: 'Study 10 hours in total.', color: 'sky', test: (c) => c.totalMinutes >= 600 },
];
