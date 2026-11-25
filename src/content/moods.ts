/** 💭 Mood check-in responses. `minutes` is the suggested study block. */
import type { CheckinMood } from '../lib/types';

export const checkinMoods: Record<CheckinMood, { emoji: string; label: string; reply: string; plan: string; minutes: number }> = {
  happy: { emoji: '😊', label: 'Happy', reply: 'Love that for us! Let’s ride this good energy.', plan: 'Two classic 25-minute sessions with a snack break in between.', minutes: 25 },
  motivated: { emoji: '🔥', label: 'Motivated', reply: 'Academic weapon mode detected. Let’s go!', plan: 'A deep 45-minute focus block. Phone in another room.', minutes: 45 },
  tired: { emoji: '🥱', label: 'Tired', reply: 'That’s okay. Tired brains still count.', plan: 'A gentle 15-minute session on something easy, then rest.', minutes: 15 },
  sleepy: { emoji: '😴', label: 'Sleepy', reply: 'Splash some water on your face, I’ll wait 💧', plan: 'A 15-minute review session — re-read notes, no new topics.', minutes: 15 },
  stressed: { emoji: '😣', label: 'Stressed', reply: 'Deep breath in… and out. We’ll make it smaller.', plan: 'Write down the 3 most important things, then one 20-minute session on the first.', minutes: 20 },
  overwhelmed: { emoji: '🫠', label: 'Overwhelmed', reply: 'Too much at once? Then we do just one tiny thing.', plan: 'A 10-minute mini-session. Just open the book. That’s the whole goal.', minutes: 10 },
};
