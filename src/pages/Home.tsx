import { useState } from 'react';
import { personalize } from '../config/personalize';
import { encouragements, fortunes } from '../content/messages';
import { checkinMoods } from '../content/moods';
import { memes } from '../content/memes';
import { checkIn, completeChallenge, newChallenge, playSound, soloStartCustom } from '../lib/actions';
import { emit } from '../lib/events';
import { useNow } from '../lib/hooks';
import { computeStreak } from '../lib/progress';
import { navigate } from '../lib/router';
import { profileOf, todayStat, useApp } from '../lib/store';
import type { CheckinMood } from '../lib/types';
import { dayKey, fill, fmtMinutes, pick } from '../lib/util';
import { Companion } from '../components/Companion';
import { GoalCard, WeekChart } from '../components/Bits';
import { MemeArt } from '../components/MemeCard';
import { isSupabaseConfigured } from '../lib/supabase';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Hello, night owl';
}

export function Home() {
  const s = useApp();
  const now = useNow(1000);
  const prof = profileOf(s);
  const today = dayKey();
  const t = todayStat(s, today);
  const streak = computeStreak(s.stats.history);
  const [cookie, setCookie] = useState<'whole' | 'cracked'>('whole');
  const [fortune, setFortune] = useState('');
  const checkin = s.checkin?.day === today ? s.checkin.mood : null;
  const challenge = s.challenge?.day === today ? s.challenge : null;
  const memeOfDay = memes[Number(today.replace(/-/g, '')) % memes.length];

  const crack = () => {
    playSound('pop');
    if (cookie === 'cracked') {
      setCookie('whole');
      setFortune('');
      return;
    }
    setCookie('cracked');
    setFortune(pick(fortunes));
  };

  const encourage = () => {
    const pool = Math.random() < 0.25 ? personalize.personalMessages : encouragements;
    emit('pet', { mood: 'motivational', message: fill(pick(pool), { friend: prof.friendName, you: prof.yourName }), ms: 7000, anim: 'bounce' });
    emit('float', { emoji: pick(['💗', '✨', '🌸', '⭐']), count: 10 });
    playSound('boop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tryPlan = (mood: CheckinMood) => {
    soloStartCustom(checkinMoods[mood].minutes);
    navigate('/study');
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__text">
          <p className="hero__hi hand">
            {greeting()}, {prof.friendName}! ☁️
          </p>
          <h1>{prof.welcomeTitle}</h1>
          <p className="hero__sub">{prof.welcomeSubtitle}</p>
          <div className="hero__stats">
            <div className="stat">
              <span className="stat__n">{fmtMinutes(t.minutes)}</span>
              <span className="stat__l">studied today</span>
            </div>
            <div className="stat">
              <span className="stat__n">🔥 {streak}</span>
              <span className="stat__l">day streak</span>
            </div>
            <div className="stat">
              <span className="stat__n">{t.sessions}</span>
              <span className="stat__l">sessions</span>
            </div>
          </div>
          <div className="row">
            <a className="btn btn--primary btn--lg" href="#/study">
              📚 Start studying
            </a>
            <a className="btn btn--lavender btn--lg" href="#/room">
              🫂 Study together
            </a>
          </div>
        </div>
        <div className="hero__pet">
          <div className="hero__blob" aria-hidden />
          <Companion timer={s.timer} now={now} size={230} showActions idleContext={t.sessions === 0 ? 'notStarted' : 'idle'} />
        </div>
      </section>

      <section className="card card--peach tape note-card">
        <p className="label">a little note from {prof.yourName} 💌</p>
        <p className="note-card__text hand">{prof.note}</p>
      </section>

      <section className="home-grid">
        <div className="card card--lavender">
          <h2>💭 How are you feeling?</h2>
          <p className="muted tiny">Check in and I’ll suggest a plan that fits.</p>
          <div className="mood-grid" role="group" aria-label="Mood check-in">
            {(Object.keys(checkinMoods) as CheckinMood[]).map((m) => (
              <button key={m} className="chip" aria-pressed={checkin === m} onClick={() => { checkIn(m); playSound('pop'); }}>
                {checkinMoods[m].emoji} {checkinMoods[m].label}
              </button>
            ))}
          </div>
          {checkin && (
            <div className="plan">
              <p><strong>{checkinMoods[checkin].reply}</strong></p>
              <p className="muted">{checkinMoods[checkin].plan}</p>
              <button className="btn btn--primary btn--sm" onClick={() => tryPlan(checkin)}>
                ▶ Start a {checkinMoods[checkin].minutes}-minute session
              </button>
            </div>
          )}
        </div>

        <GoalCard />

        <div className="card card--butter fortune">
          <h2>🥠 Fortune cookie</h2>
          <button className={`cookie ${cookie === 'cracked' ? 'is-cracked' : ''}`} onClick={crack} aria-label={cookie === 'cracked' ? 'Get another fortune cookie' : 'Crack open the fortune cookie'}>
            <span className="cookie__l">🥠</span>
            {cookie === 'cracked' && <span className="cookie__r">🥠</span>}
          </button>
          {fortune ? (
            <p className="fortune__slip" role="status">“{fortune}”</p>
          ) : (
            <p className="muted tiny">Tap the cookie for a study fortune.</p>
          )}
        </div>

        <div className="card card--blush">
          <h2>🎲 Tiny challenge</h2>
          {challenge ? (
            <>
              <p className={`challenge ${challenge.done ? 'is-done' : ''}`}>{challenge.text}</p>
              <div className="row">
                {!challenge.done ? (
                  <button className="btn btn--sage btn--sm" onClick={completeChallenge}>✅ Done! (+5 🪙)</button>
                ) : (
                  <span className="badge-pill">completed ✨</span>
                )}
                <button className="btn btn--sm" onClick={newChallenge}>🔀 Another</button>
              </div>
            </>
          ) : (
            <>
              <p className="muted">Small, doable, slightly heroic.</p>
              <button className="btn btn--primary btn--sm" onClick={newChallenge}>Give me a challenge</button>
            </>
          )}
        </div>

        <div className="card card--sky">
          <h2>📈 This week</h2>
          <WeekChart />
          <button className="btn btn--sm btn--butter" style={{ marginTop: 12 }} onClick={encourage}>
            💗 Encourage me
          </button>
        </div>

        <a className="card meme-day" href={`#/memes/${memeOfDay.id}`} aria-label="Meme of the day — open Meme Corner">
          <h2>😂 Meme of the day</h2>
          <MemeArt meme={memeOfDay} size="mini" />
        </a>
      </section>

      {!isSupabaseConfigured && (
        <p className="tiny" style={{ textAlign: 'center', marginTop: 18, color: 'var(--page-ink-soft)' }}>
          Solo mode — everything saves on this device. Shared rooms light up once the backend is configured (see README).
        </p>
      )}
    </div>
  );
}
