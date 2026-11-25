export type Species = 'cat' | 'dog' | 'bunny';

export type Mood =
  | 'happy'
  | 'sleepy'
  | 'focused'
  | 'excited'
  | 'hungry'
  | 'proud'
  | 'lazy'
  | 'confused'
  | 'motivational'
  | 'disappointed'
  | 'annoyed'
  | 'blush'
  | 'purr';

export type Activity = 'idle' | 'reading' | 'sleeping' | 'celebrating' | 'coffee' | 'eating';

export type Slot = 'head' | 'ears' | 'face' | 'neck' | 'back';

export type ThemeId = 'bedroom' | 'rainy' | 'library' | 'night' | 'spring';

export type TimerMode = 'study' | 'short' | 'long';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface Durations {
  study: number; // minutes
  short: number;
  long: number;
  longEvery: number;
}

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  /** epoch ms when the current phase ends (only while running) */
  endsAt: number | null;
  /** ms left while paused / idle */
  remainingMs: number;
  /** total ms of the current phase */
  durationMs: number;
  /** epoch ms when the phase was first started */
  startedAt: number | null;
  /** completed study sessions in the current cycle (resets after long break) */
  cycle: number;
  /** unique id of the current phase run — used to avoid double-crediting */
  sessionId: string;
  /** how many study sessions were skipped in a row */
  skipsInRow: number;
}

export interface DayStat {
  minutes: number;
  sessions: number;
  skips: number;
}

export type CheckinMood = 'happy' | 'tired' | 'stressed' | 'motivated' | 'overwhelmed' | 'sleepy';
