/**
 * 😂 MEME CORNER COLLECTION
 * ------------------------------------------------------------------
 * Every meme here is an ORIGINAL design drawn with the app's own
 * pet illustrations — no copyrighted images, no hotlinks, nothing
 * that can break. Inspired by the Pinterest study-meme genre
 * ("me 24h before the exam", "resting my eyes", "academic weapon"…).
 *
 * Adding a meme: copy any object below, give it a unique `id`, done.
 *
 * Using an external image instead: set `image` to a file you placed in
 * /public/memes/ (e.g. 'memes/sleepy-cat.webp') and fill in `credit`
 * with the creator + licence link. Only use images you have the right
 * to reuse (CC0 / CC-BY / your own photos / explicit permission).
 */
import type { Activity, Mood, Species } from '../lib/types';

export type MemeTag = 'study' | 'procrastination' | 'motivation' | 'exam' | 'break' | 'latenight';

export interface MemePanel {
  species: Species;
  mood: Mood;
  activity?: Activity;
  label?: string;
}

export interface Meme {
  id: string;
  tags: MemeTag[];
  /** Caption above the picture. */
  top?: string;
  /** Caption below the picture (classic meme bottom text). */
  bottom?: string;
  /** One pet (classic) or two pets side by side (comparison meme). */
  panels: MemePanel[];
  /** Little emoji stickers floating around the pet. */
  stickers?: string[];
  /** Background tint: 'blush' | 'lavender' | 'peach' | 'sky' | 'sage' | 'cream' | 'night'. */
  bg: 'blush' | 'lavender' | 'peach' | 'sky' | 'sage' | 'cream' | 'night';
  /** Optional licensed external image (see header). */
  image?: string;
  credit?: { name: string; url: string; license: string };
}

export const memes: Meme[] = [
  {
    id: 'locked-in',
    tags: ['study', 'motivation'],
    top: 'okay. no distractions.',
    bottom: 'we are LOCKED IN 🔒',
    panels: [{ species: 'cat', mood: 'focused', activity: 'reading' }],
    stickers: ['📚', '✏️'],
    bg: 'lavender',
  },
  {
    id: 'did-something',
    tags: ['study', 'motivation'],
    top: 'me after finishing ONE pomodoro',
    bottom: 'WE DID SOMETHING. WE ACTUALLY DID SOMETHING.',
    panels: [{ species: 'dog', mood: 'excited', activity: 'celebrating' }],
    stickers: ['🎉', '✨'],
    bg: 'peach',
  },
  {
    id: 'legally-unavailable',
    tags: ['break'],
    top: 'break time',
    bottom: 'our brains are legally unavailable',
    panels: [{ species: 'cat', mood: 'sleepy', activity: 'sleeping' }],
    stickers: ['💤', '☁️'],
    bg: 'sky',
  },
  {
    id: 'book-open-brain-not',
    tags: ['procrastination', 'study'],
    top: 'the book is open.',
    bottom: 'the brain is not.',
    panels: [{ species: 'bunny', mood: 'confused', activity: 'reading' }],
    stickers: ['❓', '🫠'],
    bg: 'cream',
  },
  {
    id: 'academic-weapon',
    tags: ['motivation', 'study'],
    top: '4 sessions done',
    bottom: 'academic weapon status: UNLOCKED ⚔️',
    panels: [{ species: 'cat', mood: 'proud', activity: 'celebrating' }],
    stickers: ['⚔️', '🏆', '✨'],
    bg: 'blush',
  },
  {
    id: 'syllabus',
    tags: ['procrastination'],
    top: 'bestie,',
    bottom: 'the syllabus is not going to defeat itself',
    panels: [{ species: 'dog', mood: 'disappointed' }],
    stickers: ['📄', '😤'],
    bg: 'peach',
  },
  {
    id: 'skipping-again',
    tags: ['procrastination'],
    top: 'skipping again?',
    bottom: 'i am literally a cat and somehow more productive',
    panels: [{ species: 'cat', mood: 'annoyed', activity: 'reading' }],
    stickers: ['😾', '⏭️'],
    bg: 'lavender',
  },
  {
    id: 'life-together',
    tags: ['motivation'],
    top: 'look at you.',
    bottom: 'actually getting your life together. iconic.',
    panels: [{ species: 'bunny', mood: 'proud' }],
    stickers: ['💅', '✨', '🎯'],
    bg: 'sage',
  },
  {
    id: '9am-vs-2am',
    tags: ['latenight', 'study'],
    top: 'me studying',
    panels: [
      { species: 'cat', mood: 'focused', activity: 'reading', label: '9:00 am' },
      { species: 'cat', mood: 'sleepy', activity: 'reading', label: '2:47 am' },
    ],
    bg: 'night',
  },
  {
    id: '24h-before',
    tags: ['exam'],
    top: 'me 24 hours before the exam',
    bottom: 'reading the textbook for the first time like it’s a thriller novel',
    panels: [{ species: 'dog', mood: 'excited', activity: 'reading' }],
    stickers: ['😱', '📖', '⏰'],
    bg: 'blush',
  },
  {
    id: 'resting-eyes',
    tags: ['latenight', 'study'],
    top: 'i’m not sleeping',
    bottom: 'i’m resting my eyes so the information can absorb',
    panels: [{ species: 'cat', mood: 'sleepy', activity: 'sleeping' }],
    stickers: ['📚', '💤'],
    bg: 'night',
  },
  {
    id: 'everything-except',
    tags: ['procrastination'],
    top: 'things i did instead of studying:',
    bottom: 'cleaned my room, reorganised my pens, learned about octopuses',
    panels: [{ species: 'bunny', mood: 'happy' }],
    stickers: ['🧹', '🖊️', '🐙'],
    bg: 'sky',
  },
  {
    id: 'no-idea',
    tags: ['exam', 'study'],
    top: 'me looking at question 3',
    bottom: 'i have no idea what i’m doing but i’m doing it with confidence',
    panels: [{ species: 'dog', mood: 'confused' }],
    stickers: ['❓', '🤔', '❓'],
    bg: 'cream',
  },
  {
    id: 'need-a-break',
    tags: ['break'],
    top: 'studied for 12 minutes',
    bottom: 'i think i deserve a 3 hour break',
    panels: [{ species: 'dog', mood: 'lazy', activity: 'sleeping' }],
    stickers: ['🛋️', '🍿'],
    bg: 'peach',
  },
  {
    id: 'emotional-support',
    tags: ['motivation'],
    top: 'you can do this',
    bottom: 'i brought emotional support paws 🐾',
    panels: [{ species: 'cat', mood: 'motivational' }],
    stickers: ['🐾', '💗'],
    bg: 'blush',
  },
  {
    id: 'exam-panic',
    tags: ['exam'],
    top: 'teacher: “this won’t be on the exam”',
    bottom: 'the exam:',
    panels: [{ species: 'bunny', mood: 'disappointed' }],
    stickers: ['📝', '💀'],
    bg: 'lavender',
  },
  {
    id: 'one-page',
    tags: ['motivation', 'study'],
    top: 'the plan:',
    bottom: 'one page at a time, okay? 🥺',
    panels: [{ species: 'bunny', mood: 'happy', activity: 'reading' }],
    stickers: ['🌷', '📄'],
    bg: 'sage',
  },
  {
    id: 'coffee-machine',
    tags: ['latenight', 'study'],
    top: 'coffee #4',
    bottom: 'i can see sounds now. what were we studying.',
    panels: [{ species: 'dog', mood: 'excited', activity: 'coffee' }],
    stickers: ['☕', '☕', '⚡'],
    bg: 'night',
  },
  {
    id: 'before-vs-after-results',
    tags: ['exam'],
    top: 'checking exam results',
    panels: [
      { species: 'cat', mood: 'confused', label: 'before' },
      { species: 'cat', mood: 'excited', activity: 'celebrating', label: 'it’s a pass' },
    ],
    bg: 'peach',
  },
  {
    id: 'judging',
    tags: ['procrastination'],
    top: 'when you pick up your phone mid-session',
    bottom: 'i’m not judging you. okay, maybe a little.',
    panels: [{ species: 'cat', mood: 'annoyed' }],
    stickers: ['📱', '👀'],
    bg: 'cream',
  },
  {
    id: 'become-one-with-bed',
    tags: ['latenight', 'procrastination'],
    top: 'let’s finish this',
    bottom: 'before we become one with the bed',
    panels: [{ species: 'bunny', mood: 'sleepy', activity: 'reading' }],
    stickers: ['🛏️', '🌙'],
    bg: 'night',
  },
  {
    id: 'comeback',
    tags: ['motivation'],
    top: 'after 3 days of not studying',
    bottom: 'the academic comeback starts RIGHT NOW',
    panels: [{ species: 'dog', mood: 'motivational', activity: 'reading' }],
    stickers: ['🔥', '💪'],
    bg: 'blush',
  },
  {
    id: 'pictures-only',
    tags: ['study'],
    top: 'me “reading” the chapter',
    bottom: 'looking at the pictures. absorbing vibes.',
    panels: [{ species: 'cat', mood: 'happy', activity: 'reading' }],
    stickers: ['🖼️', '✨'],
    bg: 'sky',
  },
  {
    id: 'group-project',
    tags: ['study'],
    top: 'studying together',
    panels: [
      { species: 'cat', mood: 'focused', activity: 'reading', label: 'you' },
      { species: 'dog', mood: 'focused', activity: 'reading', label: 'bestie' },
    ],
    bottom: 'two brains, zero distractions',
    bg: 'lavender',
  },
  {
    id: 'snack-motivation',
    tags: ['motivation', 'break'],
    top: 'one more session',
    bottom: 'and then we get snacks 🍪',
    panels: [{ species: 'dog', mood: 'hungry' }],
    stickers: ['🍪', '🧁'],
    bg: 'peach',
  },
  {
    id: 'deadline',
    tags: ['exam', 'latenight'],
    top: 'the assignment is due at 11:59',
    bottom: 'it is 11:41. we are calm. we are fine.',
    panels: [{ species: 'bunny', mood: 'focused', activity: 'coffee' }],
    stickers: ['⏰', '🔥'],
    bg: 'cream',
  },
  {
    id: 'better-than-you-think',
    tags: ['motivation'],
    top: 'a reminder:',
    bottom: 'you are doing better than you think 🫶',
    panels: [{ species: 'cat', mood: 'blush' }],
    stickers: ['💗', '🌸'],
    bg: 'sage',
  },
  {
    id: 'brain-full',
    tags: ['study', 'break'],
    top: 'my brain after one chapter',
    bottom: 'storage full. please delete a song lyric.',
    panels: [{ species: 'bunny', mood: 'confused', activity: 'sleeping' }],
    stickers: ['🧠', '💾'],
    bg: 'sky',
  },
];

/** Which memes may pop up for which app moment. */
export const memeMoments: Record<string, string[]> = {
  studyStart: ['locked-in', 'one-page', 'group-project'],
  sessionDone: ['did-something', 'pictures-only', 'better-than-you-think'],
  break: ['legally-unavailable', 'need-a-break', 'brain-full'],
  procrastinating: ['book-open-brain-not', 'everything-except', 'judging'],
  fourSessions: ['academic-weapon'],
  notStarted: ['syllabus', 'become-one-with-bed'],
  skipping: ['skipping-again'],
  goalReached: ['life-together', 'snack-motivation'],
  lateNight: ['resting-eyes', '9am-vs-2am', 'coffee-machine'],
};
