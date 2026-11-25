/**
 * ✏️  PERSONALIZE STUDY PAWS HERE
 * ------------------------------------------------------------------
 * This is the only file you need to edit to make the gift yours.
 * Everything here is plain text — change it, save, rebuild, deploy.
 *
 * (Your friend can also tweak names later in Settings ⚙️ — those
 *  changes are saved in their browser and override these defaults.)
 */

export const personalize = {
  /** The person receiving this gift. */
  friendName: 'Siya',

  /** You! Shown as the person who made the gift. */
  yourName: 'Masti',

  /** The companion's name and default species ('cat' | 'dog' | 'bunny'). */
  petName: 'Mochi',
  defaultPet: 'cat' as 'cat' | 'dog' | 'bunny',

  /** Default name for a new shared room. */
  roomName: 'Our Little Study Corner',

  /** Welcome screen — the very first thing your friend sees. */
  welcomeTitle: 'Welcome to our little study corner ☁️',
  welcomeSubtitle:
    'Made for two brains, approximately zero distractions, and one very hardworking pet.',

  /** The handwritten note inside the gift envelope. */
  note:
    "This little corner of the internet is yours. Whenever studying feels boring, overwhelming, or lonely, come here. We'll do one page, one session, one tiny step at a time.",

  /** Signature under the note. `{you}` is replaced with yourName. */
  signature: 'with love (and snacks), {you}',

  /**
   * Personal messages sprinkled in among the pet's chatter
   * and the "encourage me" button. Use `{friend}` and `{you}` placeholders.
   */
  personalMessages: [
    '{you} says: I am so proud of you, {friend}. Like, so proud.',
    'Reminder from {you}: drink water and fix your posture 💧',
    '{friend}, you have survived 100% of your hardest days so far.',
    "{you} believes in you. That's legally binding now.",
    'Inside joke placeholder — replace me with one only you two get 🤭',
  ],
};

export type Personalize = typeof personalize;
