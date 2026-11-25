/**
 * Everything the pet says, grouped by context.
 * Add, remove or rewrite lines freely — `{friend}`, `{you}`, `{pet}` are replaced at runtime.
 */
export type MessageContext =
  | 'idle'
  | 'notStarted'
  | 'studyStart'
  | 'studying'
  | 'sleepyStudy'
  | 'paused'
  | 'sessionDone'
  | 'break'
  | 'longBreak'
  | 'fourSessions'
  | 'goalReached'
  | 'skipping'
  | 'procrastinating'
  | 'hungry'
  | 'petted'
  | 'annoyed'
  | 'fed'
  | 'coffee'
  | 'milk'
  | 'friendReaction'
  | 'welcomeBack';

export const petMessages: Record<MessageContext, string[]> = {
  idle: [
    "Okay bestie, let's lock in.",
    'One page at a time, okay? 🥺',
    'We are academic weapons. Tiny academic weapons.',
    'I believe in you. Even if your syllabus is terrifying.',
    "I have no idea what you're studying but I'm supporting you.",
    'You are doing better than you think.',
    'The academic comeback starts RIGHT NOW.',
    'You can do this. I brought emotional support paws.',
  ],
  notStarted: [
    'Bestie, the syllabus is not going to defeat itself.',
    'Stop staring at me and open your book.',
    "Let's finish this before we become one with the bed.",
    'Just ONE session. I will hold your hand. Paw. Whatever.',
  ],
  studyStart: [
    'Okay, no distractions. We are locked in. 🔒',
    "I'll stay awake with you. Probably.",
    'No thoughts. Just studying.',
    'Phone face down. Brain face up.',
  ],
  studying: [
    'No thoughts. Just studying.',
    'Shhh… I am reading too. (I am looking at the pictures.)',
    'You are doing amazing. Keep going.',
    'Focus mode: activated. Snacks: pending.',
    'This page is scared of you.',
    'One more paragraph. I believe in you.',
  ],
  sleepyStudy: [
    'I am… so… focused… *yawn*',
    "We've been at it a while. I'm proud. And sleepy.",
    "My eyes are closed but my brain is open. Kind of.",
  ],
  paused: [
    'Paused? Okay. I will guard the timer.',
    'Take your time. The book will wait (unfortunately).',
    '*taps paw* …ready when you are.',
  ],
  sessionDone: [
    'You studied for {mins} minutes?! I am SO proud of you.',
    'WE DID SOMETHING. WE ACTUALLY DID SOMETHING.',
    'Session complete! You deserve a treat. I also deserve a treat.',
    'Look at you go. Tiny scholar energy.',
  ],
  break: [
    'Your brain deserves a little break.',
    'Break time. Our brains are legally unavailable.',
    'Stretch, drink water, look at something far away 👀',
    '*curls up* wake me when it is study time…',
  ],
  longBreak: [
    'Long break! Go touch some grass. Or a blanket. 🌿',
    'You earned this one. I am napping for all 15 minutes.',
  ],
  fourSessions: [
    'Academic weapon status unlocked. ⚔️',
    'FOUR SESSIONS?! Throwing a tiny party right now 🎉',
  ],
  goalReached: [
    'Look at you. Actually getting your life together. Iconic.',
    'DAILY GOAL DONE. I am crying happy kitty tears.',
    'Goal: crushed. Pet: proud. Snacks: earned.',
  ],
  skipping: [
    'Skipping again? I am literally a {species} and somehow more productive.',
    'I am not judging you. Okay, maybe a little.',
    "That's the second skip. I'm writing this down. 📝",
  ],
  procrastinating: [
    'The book is open. The brain is not.',
    "I see you scrolling. I'm not mad. I'm just disappointed.",
    'Five more minutes of looking at me, then we study. Deal?',
  ],
  hungry: [
    'Is it snack o’clock? It feels like snack o’clock.',
    'I could study better with a tiny treat… just saying 🥺',
  ],
  petted: [
    '*purrrrr* okay, okay, one more pat.',
    'Hehe. That tickles.',
    'I love you. Now go study. ❤️',
    '*happy wiggle*',
  ],
  annoyed: [
    'Okay that is ENOUGH pats. Open the book.',
    'I am a professional study buddy, not a stress ball.',
    '*pretends to be asleep so you stop*',
  ],
  fed: [
    'Nom nom nom. Brain fuel acquired.',
    'One more session and then we get snacks. Oh wait. We just did.',
    'Thank you!! This is the best day of my life (again).',
  ],
  coffee: [
    'I AM SO AWAKE. WHAT ARE WE STUDYING. I CAN SEE SOUNDS.',
    'Coffee?! I am now legally a productivity machine ☕',
  ],
  milk: [
    'Warm milk… so cozy… *slow blink*',
    'Mmm. Calm, focused, and slightly milky.',
  ],
  friendReaction: [
    '{name} sent you something! I think they love you 🥹',
    '{name} is cheering for you!',
  ],
  welcomeBack: [
    'You came back!! I missed you so much.',
    "Oh hi {friend}! Ready for a cozy little session?",
  ],
};

export const encouragements = [
  'Small progress is still progress. 🌱',
  'You are not behind. You are on your own timeline.',
  "Future {friend} is going to be SO grateful for this.",
  'One page. That’s it. Then we’ll see.',
  'Being tired and still trying? That’s strength.',
  'You don’t need to be perfect. You just need to start.',
  'Hard things become easy things with practice. Promise.',
  'Rest is part of the plan, not a failure of it.',
  'Your brain is literally growing right now. Wild.',
  'You are allowed to be proud of tiny wins.',
  'The exam does not know who it’s dealing with.',
  'Deep breath. Shoulders down. You’ve got this.',
];

export const fortunes = [
  'Your future self is thanking you.',
  'You are closer than you think.',
  'Small progress is still progress.',
  "Today's effort will become tomorrow's confidence.",
  'A surprise A+ is in your future. (Some studying required.)',
  'The answer you are looking for is in chapter 7.',
  'You will remember this formula at exactly the right moment.',
  'Lucky numbers: 25, 5, 25, 5, 15.',
  'A cup of tea and one finished page will change your evening.',
  'Someone is very proud of you today. (It’s me. And a cat.)',
  'You will find a pen that actually works. Treasure it.',
  'Consistency beats intensity. You’re building something.',
];

export const challenges = [
  'Study for 10 minutes without touching your phone. 📵',
  'Finish one page. Just one. 📄',
  'Review five flashcards. 🗂️',
  'Write down three important points from today. ✍️',
  'Complete one small task you’ve been avoiding. ✅',
  'Take a break and drink a full glass of water. 💧',
  'Explain one concept out loud like you’re teaching the pet. 🐾',
  'Tidy your desk for 2 minutes, then start a session. 🧹',
  'Make a tiny to-do list with only three things. 📝',
  'Re-solve one problem you got wrong before. 🔁',
];

export const quickMessages = [
  'You got this.',
  'Keep going!',
  'Proud of you.',
  'Take a break.',
  'One more session?',
  'Sending virtual hugs.',
  "I'm studying too!",
  "Don't give up.",
  "We're doing this together.",
];

export const reactionEmojis = ['❤️', '🐱', '🐶', '🫂', '✨', '☕', '📚', '🥹', '💪', '😭', '🐾', '⭐'] as const;
