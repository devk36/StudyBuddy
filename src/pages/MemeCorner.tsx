import { useCallback, useEffect, useMemo, useState } from 'react';
import { memes, type Meme } from '../content/memes';
import { playSound, toggleFavorite } from '../lib/actions';
import { emit } from '../lib/events';
import { navigate } from '../lib/router';
import { useApp } from '../lib/store';
import { copyText } from '../lib/util';
import { Modal } from '../components/Bits';
import { MemeArt } from '../components/MemeCard';

type Filter = 'all' | 'favorites' | 'study' | 'procrastination' | 'motivation' | 'exam' | 'break' | 'latenight' | 'cat' | 'dog' | 'bunny';

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: '✨ All' },
  { id: 'favorites', label: '💗 Favorites' },
  { id: 'study', label: '📚 Study' },
  { id: 'procrastination', label: '🫠 Procrastination' },
  { id: 'motivation', label: '💪 Motivation' },
  { id: 'exam', label: '📝 Exams' },
  { id: 'break', label: '☕ Breaks' },
  { id: 'latenight', label: '🌙 Late night' },
  { id: 'cat', label: '🐱 Cats' },
  { id: 'dog', label: '🐶 Dogs' },
  { id: 'bunny', label: '🐰 Bunnies' },
];

function matches(m: Meme, f: Filter, favs: string[]) {
  if (f === 'all') return true;
  if (f === 'favorites') return favs.includes(m.id);
  if (f === 'cat' || f === 'dog' || f === 'bunny') return m.panels.some((p) => p.species === f);
  return m.tags.includes(f);
}

export function MemeCorner({ openId }: { openId?: string }) {
  const s = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const list = useMemo(() => memes.filter((m) => matches(m, filter, s.favorites)), [filter, s.favorites]);
  const open = openId ? memes.find((m) => m.id === openId) : undefined;
  const nav = open && list.some((m) => m.id === open.id) ? list : memes;
  const idx = open ? nav.findIndex((m) => m.id === open.id) : -1;

  const show = useCallback((m: Meme) => navigate(`/memes/${m.id}`, true), []);
  const close = useCallback(() => navigate('/memes', true), []);
  const step = useCallback(
    (d: number) => {
      if (idx < 0) return;
      show(nav[(idx + d + nav.length) % nav.length]);
      playSound('pop');
    },
    [idx, nav, show],
  );
  const random = () => {
    const pool = list.length ? list : memes;
    let m = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) while (m.id === open?.id) m = pool[Math.floor(Math.random() * pool.length)];
    show(m);
    playSound('boop');
  };

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open, step]);

  const share = async (m: Meme) => {
    const url = `${location.href.split('#')[0]}#/memes/${m.id}`;
    const text = [m.top, m.bottom].filter(Boolean).join(' … ');
    if (navigator.share) {
      try {
        await navigator.share({ title: 'A study meme for you 🐾', text, url });
        return;
      } catch {
        /* cancelled — fall back to copy */
      }
    }
    if (await copyText(`${text}\n${url}`)) emit('toast', { kind: 'info', title: 'Meme link copied — go send it!', emoji: '🔗' });
  };

  const fav = (m: Meme) => {
    const was = s.favorites.includes(m.id);
    toggleFavorite(m.id);
    if (!was) emit('float', { emoji: '💗', count: 6 });
    playSound('pop');
  };

  return (
    <div className="memes">
      <div className="page-head">
        <div>
          <h1>Meme Corner 😂</h1>
          <p className="sub">certified study memes, hand-drawn by the pets</p>
        </div>
        <button className="btn btn--butter" onClick={random}>🎲 Random meme</button>
      </div>

      <div className="filters" role="group" aria-label="Filter memes">
        {filters.map((f) => (
          <button key={f.id} className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
            {f.id === 'favorites' && s.favorites.length > 0 && <span className="muted"> {s.favorites.length}</span>}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card empty">
          <p className="hand" style={{ fontSize: '1.6rem' }}>No favorites yet 🥺</p>
          <p className="muted">Tap the heart on any meme to save it here.</p>
        </div>
      ) : (
        <div className="masonry">
          {list.map((m, i) => (
            <article key={m.id} className="pin" style={{ ['--tilt' as string]: `${((i * 37) % 5) - 2}deg` }}>
              <button className="pin__open" onClick={() => show(m)} aria-label={`Open meme: ${m.top ?? ''} ${m.bottom ?? ''}`}>
                <MemeArt meme={m} />
              </button>
              <div className="pin__bar">
                <button className={`pin__fav ${s.favorites.includes(m.id) ? 'is-on' : ''}`} onClick={() => fav(m)} aria-pressed={s.favorites.includes(m.id)} aria-label="Favorite">
                  {s.favorites.includes(m.id) ? '💗' : '🤍'}
                </button>
                <span className="pin__tags">{m.tags.map((t) => `#${t}`).join(' ')}</span>
                <button className="pin__share" onClick={() => share(m)} aria-label="Share meme">↗</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="tiny" style={{ textAlign: 'center', marginTop: 20, color: 'var(--page-ink-soft)' }}>
        All memes are original Study Paws drawings inspired by the Pinterest study-meme genre — no borrowed images. Add your own in <code>src/content/memes.ts</code>.
      </p>

      {open && (
        <Modal onClose={close} label="Meme viewer">
          <div className="viewer">
            <MemeArt meme={open} size="big" />
            <div className="viewer__bar">
              <button className="btn btn--icon" onClick={() => step(-1)} aria-label="Previous meme">←</button>
              <button className={`btn ${s.favorites.includes(open.id) ? 'btn--blush' : ''}`} onClick={() => fav(open)} aria-pressed={s.favorites.includes(open.id)}>
                {s.favorites.includes(open.id) ? '💗 Saved' : '🤍 Favorite'}
              </button>
              <button className="btn" onClick={() => share(open)}>↗ Share</button>
              <button className="btn btn--icon" onClick={() => step(1)} aria-label="Next meme">→</button>
            </div>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn btn--sm btn--butter" onClick={random}>🎲 Random</button>
              <button className="btn btn--sm btn--ghost" onClick={close}>Close</button>
            </div>
            <p className="tiny muted" style={{ textAlign: 'center' }}>{idx + 1} / {nav.length} · use ← → keys</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
