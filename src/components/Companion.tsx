import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { personalize } from '../config/personalize';
import { petMessages, type MessageContext } from '../content/messages';
import { shopItems, snacks } from '../content/shop';
import { equippedList, feed, playSound, recordPet } from '../lib/actions';
import { on, type AppEvents } from '../lib/events';
import { profileOf, todayStat, useApp } from '../lib/store';
import * as T from '../lib/timer';
import type { Activity, Mood, Species, TimerState } from '../lib/types';
import { dayKey, fill, pick } from '../lib/util';
import { Pet } from './Pet';

interface Props {
  /** The timer the pet should react to (solo or shared). */
  timer?: TimerState | null;
  now?: number;
  size?: number;
  showName?: boolean;
  showActions?: boolean;
  /** hide the speech bubble (focus mode option) */
  quiet?: boolean;
  /** pin a context (e.g. home page "notStarted" nudges) */
  idleContext?: MessageContext;
  species?: Species;
  className?: string;
}

interface Reaction {
  mood?: Mood;
  activity?: Activity;
  anim?: string;
  until: number;
  snack?: string;
}

function derive(timer: TimerState | null | undefined, now: number, opts: { hungry: boolean; goalDone: boolean; studiedToday: boolean }) {
  if (timer?.status === 'running') {
    if (timer.mode === 'study') {
      const elapsedMin = T.elapsedMs(timer, now) / 60000;
      if (elapsedMin > 40) return { mood: 'sleepy' as Mood, activity: 'reading' as Activity, ctx: 'sleepyStudy' as MessageContext };
      return { mood: 'focused' as Mood, activity: 'reading' as Activity, ctx: 'studying' as MessageContext };
    }
    return { mood: 'sleepy' as Mood, activity: 'sleeping' as Activity, ctx: (timer.mode === 'long' ? 'longBreak' : 'break') as MessageContext };
  }
  if (timer?.status === 'paused') return { mood: 'confused' as Mood, activity: 'idle' as Activity, ctx: 'paused' as MessageContext };
  if (timer && timer.skipsInRow >= 2) return { mood: 'disappointed' as Mood, activity: 'idle' as Activity, ctx: 'skipping' as MessageContext };
  if (opts.hungry) return { mood: 'hungry' as Mood, activity: 'idle' as Activity, ctx: 'hungry' as MessageContext };
  if (opts.goalDone) return { mood: 'proud' as Mood, activity: 'idle' as Activity, ctx: 'goalReached' as MessageContext };
  if (!opts.studiedToday) return { mood: 'motivational' as Mood, activity: 'idle' as Activity, ctx: 'notStarted' as MessageContext };
  return { mood: 'happy' as Mood, activity: 'idle' as Activity, ctx: 'idle' as MessageContext };
}

const clickLadder: { mood: Mood; anim: string; activity?: Activity; ctx: MessageContext }[] = [
  { mood: 'purr', anim: 'purr', ctx: 'petted' },
  { mood: 'happy', anim: 'bounce', ctx: 'petted' },
  { mood: 'blush', anim: 'bounce', ctx: 'petted' },
  { mood: 'excited', anim: 'jump', ctx: 'petted' },
  { mood: 'excited', anim: 'jump', ctx: 'petted' },
  { mood: 'annoyed', anim: 'wiggle', ctx: 'annoyed' },
  { mood: 'annoyed', anim: 'wiggle', ctx: 'annoyed' },
  { mood: 'sleepy', anim: 'purr', activity: 'sleeping', ctx: 'annoyed' },
];

export function Companion({ timer, now = Date.now(), size = 210, showName = true, showActions = false, quiet = false, idleContext, species: speciesProp, className = '' }: Props) {
  const s = useApp();
  const prof = profileOf(s);
  const species = speciesProp ?? prof.species;
  const today = todayStat(s, dayKey());
  const hungry = now - s.pet.lastFedAt > 4 * 3600_000;
  const base = derive(timer, now, { hungry, goalDone: today.minutes >= s.settings.dailyGoal, studiedToday: today.sessions > 0 });
  const ctx = timer?.status === 'idle' && idleContext && base.ctx === 'idle' ? idleContext : base.ctx;

  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [message, setMessage] = useState('');
  const [msgKey, setMsgKey] = useState(0);
  const [pops, setPops] = useState<{ id: number; x: number; e: string }[]>([]);
  const clicks = useRef<{ n: number; last: number }>({ n: 0, last: 0 });
  const lastFeed = useRef(0);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vars = useMemo(
    () => ({ friend: prof.friendName, you: prof.yourName, pet: prof.petName, species, mins: Math.round((timer?.durationMs ?? 1500000) / 60000) }),
    [prof.friendName, prof.yourName, prof.petName, species, timer?.durationMs],
  );

  const say = useCallback((text: string) => {
    setMessage(fill(text, vars));
    setMsgKey((k) => k + 1);
  }, [vars]);

  const sayFrom = useCallback(
    (c: MessageContext) => {
      let pool = petMessages[c];
      if ((c === 'idle' || c === 'notStarted') && Math.random() < 0.2 && personalize.personalMessages.length) pool = personalize.personalMessages;
      say(pick(pool));
    },
    [say],
  );

  const react = useCallback((r: Omit<Reaction, 'until'>, ms = 4000) => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setReaction({ ...r, until: Date.now() + ms });
    reactionTimer.current = setTimeout(() => setReaction(null), ms);
  }, []);

  useEffect(() => () => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
  }, []);

  // contextual message: on context change + rotate every 40s
  useEffect(() => {
    sayFrom(ctx);
    const id = setInterval(() => sayFrom(ctx), 40_000);
    return () => clearInterval(id);
  }, [ctx, sayFrom]);

  // global pet events (session done, friend's hug, purchases…)
  useEffect(
    () =>
      on('pet', (e: AppEvents['pet']) => {
        react({ mood: e.mood, activity: e.activity, anim: e.anim }, e.ms ?? 4000);
        if (e.message) say(e.message);
      }),
    [react, say],
  );

  const pop = (e: string, count = 1) => {
    const items = Array.from({ length: count }, (_, i) => ({ id: Date.now() + i + Math.random(), x: 30 + Math.random() * 40, e }));
    setPops((p) => [...p, ...items].slice(-12));
    setTimeout(() => setPops((p) => p.filter((x) => !items.includes(x))), 1300);
  };

  const onPet = () => {
    const nowMs = Date.now();
    const c = clicks.current;
    c.n = nowMs - c.last < 2500 ? c.n + 1 : 0;
    c.last = nowMs;
    const step = clickLadder[Math.min(c.n, clickLadder.length - 1)];
    react({ mood: step.mood, anim: step.anim, activity: step.activity }, step.activity === 'sleeping' ? 5000 : 2600);
    if (step.activity === 'sleeping') say('*pretends to be asleep so you stop*');
    else sayFrom(step.ctx);
    pop(step.mood === 'annoyed' ? '💢' : pick(['💗', '💕', '✨', '🐾']));
    recordPet();
    playSound('pop');
  };

  const onAccessory = (id: string, e: MouseEvent) => {
    const item = shopItems.find((i) => i.id === id);
    const el = (e.target as Element).closest('.pet-acc');
    if (el) {
      el.classList.remove('is-poked');
      void (el as HTMLElement).getBoundingClientRect();
      el.classList.add('is-poked');
    }
    react({ mood: 'proud', anim: 'bounce' }, 3000);
    if (item) say(item.reaction);
    playSound('pop');
  };

  const doFeed = (kind: 'snack' | 'cookie' | 'coffee' | 'milk') => {
    if (Date.now() - lastFeed.current < 1200) return;
    lastFeed.current = Date.now();
    feed(kind);
    if (kind === 'coffee') {
      react({ mood: 'excited', activity: 'coffee', anim: 'jump' }, 5000);
      sayFrom('coffee');
      pop('⚡', 2);
    } else if (kind === 'milk') {
      react({ mood: 'purr', activity: 'coffee' }, 5000);
      sayFrom('milk');
      pop('🥛');
    } else {
      const emoji = kind === 'cookie' ? '🍪' : snacks[species].emoji;
      react({ mood: 'happy', activity: 'eating', snack: emoji, anim: 'bounce' }, 2400);
      setTimeout(() => react({ mood: 'blush' }, 2500), 2400);
      sayFrom('fed');
      pop('💗', 2);
    }
  };

  const active = reaction && reaction.until > Date.now() ? reaction : null;
  const mood = active?.mood ?? base.mood;
  const activity = active?.activity ?? base.activity;

  return (
    <div className={`companion ${className}`}>
      {!quiet && message && (
        <div className="bubble" key={msgKey} role="status" aria-live="polite">
          {message}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <button type="button" className="companion__pet" onClick={onPet} aria-label={`Pet ${prof.petName}`}>
          <Pet
            species={species}
            mood={mood}
            activity={activity}
            accessories={equippedList(s.pet.equipped)}
            anim={active?.anim}
            snack={active?.snack}
            size={size}
            onAccessoryClick={onAccessory}
            title={`${prof.petName} the ${species}, feeling ${mood}`}
            key={active?.anim ? `a-${active.until}` : 'still'}
          />
        </button>
        {pops.map((p) => (
          <span key={p.id} className="pet-pop" style={{ left: `${p.x}%` }} aria-hidden>
            {p.e}
          </span>
        ))}
      </div>
      {showName && <div className="companion__name">{prof.petName}</div>}
      {showActions && (
        <div className="pet-actions" role="group" aria-label="Care for your pet">
          <button className="btn btn--sm btn--peach" onClick={() => doFeed('snack')}>{snacks[species].emoji} Treat</button>
          <button className="btn btn--sm btn--butter" onClick={() => doFeed('cookie')}>🍪 Cookie</button>
          <button className="btn btn--sm btn--sky" onClick={() => doFeed('milk')}>🥛 Milk</button>
          <button className="btn btn--sm btn--lavender" onClick={() => doFeed('coffee')}>☕ Coffee</button>
        </div>
      )}
    </div>
  );
}
