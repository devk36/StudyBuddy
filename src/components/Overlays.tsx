/** Global overlay layer: toasts, contextual meme pop-ups, floating reactions, confetti. */
import { useEffect, useRef, useState } from 'react';
import { memeMoments, memes, type Meme } from '../content/memes';
import { on } from '../lib/events';
import { getState } from '../lib/store';
import { getUi, useUi } from '../lib/ui';
import { pick, prefersReducedMotion } from '../lib/util';
import { navigate } from '../lib/router';
import { MemeArt } from './MemeCard';
import './overlays.css';

interface Toast {
  id: number;
  kind: string;
  title: string;
  body?: string;
  emoji?: string;
}

export function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [meme, setMeme] = useState<{ meme: Meme; key: number } | null>(null);
  const lastMeme = useRef(0);
  const memeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ui = useUi();

  useEffect(() => {
    const offToast = on('toast', (t) => {
      const id = Date.now() + Math.random();
      setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
      setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.kind === 'achievement' ? 5200 : 3400);
    });
    const offMeme = on('meme', ({ moment }) => {
      const s = getState();
      if (!s.settings.memePopups) return;
      if (getUi().focus && s.settings.focusHideMemes) return;
      const special = moment === 'fourSessions' || moment === 'goalReached';
      if (!special && Date.now() - lastMeme.current < 25_000) return;
      const hour = new Date().getHours();
      const ids = (hour >= 23 || hour < 4) && Math.random() < 0.4 ? memeMoments.lateNight : memeMoments[moment];
      if (!ids?.length) return;
      const m = memes.find((x) => x.id === pick(ids));
      if (!m) return;
      lastMeme.current = Date.now();
      setMeme({ meme: m, key: Date.now() });
      if (memeTimer.current) clearTimeout(memeTimer.current);
      memeTimer.current = setTimeout(() => setMeme(null), 7000);
    });
    return () => {
      offToast();
      offMeme();
      if (memeTimer.current) clearTimeout(memeTimer.current);
    };
  }, []);

  // entering focus mode hides any visible meme if configured
  useEffect(() => {
    if (ui.focus && getState().settings.focusHideMemes) setMeme(null);
  }, [ui.focus]);

  return (
    <>
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`} role="status">
            {t.emoji && <span className="toast__emoji">{t.emoji}</span>}
            <div>
              {t.kind === 'achievement' && <div className="toast__kicker">Achievement unlocked!</div>}
              <div className="toast__title">{t.title}</div>
              {t.body && <div className="toast__body">{t.body}</div>}
            </div>
          </div>
        ))}
      </div>
      {meme && (
        <div className="meme-pop" key={meme.key}>
          <button className="meme-pop__close btn btn--sm btn--icon" onClick={() => setMeme(null)} aria-label="Close meme">
            ✕
          </button>
          <button className="meme-pop__card" onClick={() => { setMeme(null); navigate(`/memes/${meme.meme.id}`); }} aria-label="Open in Meme Corner">
            <MemeArt meme={meme.meme} size="mini" />
          </button>
        </div>
      )}
    </>
  );
}

interface Floater {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  dur: number;
  size: number;
  drift: number;
}

export function Floaters() {
  const [items, setItems] = useState<Floater[]>([]);
  const [label, setLabel] = useState<{ text: string; key: number } | null>(null);
  const [confetti, setConfetti] = useState<{ id: number; pieces: { x: number; c: string; d: number; r: number; s: number; w: number }[] } | null>(null);

  useEffect(() => {
    const offFloat = on('float', ({ emoji, count = 10, from }) => {
      const reduce = prefersReducedMotion() || getState().settings.reduceMotion;
      const n = reduce ? 1 : Math.min(count, 20);
      const batch: Floater[] = Array.from({ length: n }, (_, i) => ({
        id: Date.now() + i + Math.random(),
        emoji,
        x: 5 + Math.random() * 90,
        delay: Math.random() * 0.9,
        dur: 2.6 + Math.random() * 1.8,
        size: 1.6 + Math.random() * 1.6,
        drift: -40 + Math.random() * 80,
      }));
      setItems((xs) => [...xs, ...batch].slice(-60));
      setTimeout(() => setItems((xs) => xs.filter((x) => !batch.includes(x))), 5200);
      if (from) {
        const key = Date.now();
        setLabel({ text: `${from} sent ${emoji}`, key });
        setTimeout(() => setLabel((l) => (l?.key === key ? null : l)), 3500);
      }
    });
    const offConfetti = on('confetti', ({ amount = 80 }) => {
      if (prefersReducedMotion() || getState().settings.reduceMotion) return;
      const colors = ['#F7C6CF', '#D9CCF5', '#FFD8C0', '#C6E0F5', '#CDE3C4', '#FFE8A6', '#F09AB0'];
      const id = Date.now();
      setConfetti({
        id,
        pieces: Array.from({ length: Math.min(amount, 160) }, () => ({
          x: Math.random() * 100,
          c: colors[Math.floor(Math.random() * colors.length)],
          d: Math.random() * 0.6,
          r: Math.random() * 720 - 360,
          s: 2.2 + Math.random() * 1.8,
          w: 6 + Math.random() * 7,
        })),
      });
      setTimeout(() => setConfetti((c) => (c?.id === id ? null : c)), 4600);
    });
    return () => {
      offFloat();
      offConfetti();
    };
  }, []);

  return (
    <div className="fx-layer" aria-hidden="true">
      {items.map((f) => (
        <span
          key={f.id}
          className="floater"
          style={{ left: `${f.x}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s`, fontSize: `${f.size}rem`, ['--drift' as string]: `${f.drift}px` }}
        >
          {f.emoji}
        </span>
      ))}
      {label && (
        <div className="float-label" key={label.key}>
          💌 {label.text}
        </div>
      )}
      {confetti &&
        confetti.pieces.map((p, i) => (
          <i
            key={`${confetti.id}-${i}`}
            className="confetti"
            style={{ left: `${p.x}%`, background: p.c, animationDelay: `${p.d}s`, animationDuration: `${p.s}s`, width: p.w, height: p.w * 0.55, ['--rot' as string]: `${p.r}deg` }}
          />
        ))}
    </div>
  );
}
