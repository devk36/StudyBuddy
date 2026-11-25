import { useEffect, useState } from 'react';
import type { Route } from '../lib/router';
import { useApp } from '../lib/store';
import { useRoom } from '../lib/room';

const links: { page: Route['page']; href: string; label: string; short: string; ico: string }[] = [
  { page: 'home', href: '#/', label: 'Home', short: 'Home', ico: '🏡' },
  { page: 'study', href: '#/study', label: 'Study Room', short: 'Study', ico: '📚' },
  { page: 'room', href: '#/room', label: 'Shared Room', short: 'Together', ico: '🫂' },
  { page: 'memes', href: '#/memes', label: 'Meme Corner', short: 'Memes', ico: '😂' },
  { page: 'achievements', href: '#/achievements', label: 'Achievements', short: 'Badges', ico: '🏆' },
  { page: 'shop', href: '#/shop', label: 'Pet Shop', short: 'Shop', ico: '🐾' },
  { page: 'settings', href: '#/settings', label: 'Settings', short: 'Settings', ico: '⚙️' },
];

export function Nav({ route }: { route: Route }) {
  const s = useApp();
  const room = useRoom();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [route.page]);
  useEffect(() => {
    if (!more) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMore(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [more]);
  const cur = (p: Route['page']) => (route.page === p ? 'page' : undefined);
  const badge = (p: Route['page']) => (p === 'room' && room.unread > 0 ? <span className="dot-badge">{room.unread > 9 ? '9+' : room.unread}</span> : null);
  const moreActive = ['achievements', 'shop', 'settings'].includes(route.page);

  return (
    <>
      <header className="topbar">
        <a href="#/" className="logo" aria-label="Study Paws home">
          <span className="logo__paw" aria-hidden>🐾</span>
          <span>Study Paws</span>
        </a>
        <nav className="nav-desktop" aria-label="Main">
          {links.map((l) => (
            <a key={l.page} href={l.href} aria-current={cur(l.page)}>
              <span aria-hidden>{l.ico}</span> {l.label}
              {badge(l.page)}
            </a>
          ))}
        </nav>
        <div className="topbar__right">
          {room.status === 'joined' && (
            <a href="#/room" className="badge-pill" title="Connected to your shared room" style={{ background: 'var(--sage)', color: 'var(--ink)', textDecoration: 'none' }}>
              <span aria-hidden>{room.live ? '🟢' : '🟡'}</span> together
            </a>
          )}
          <a href="#/shop" className="coins" aria-label={`${s.pet.coins} paw coins — open the pet shop`}>
            🪙 {s.pet.coins}
          </a>
        </div>
      </header>

      <nav className="nav-mobile" aria-label="Main">
        {links.slice(0, 4).map((l) => (
          <a key={l.page} href={l.href} aria-current={cur(l.page)}>
            <span className="ico" aria-hidden>{l.ico}</span>
            {l.short}
            {badge(l.page)}
          </a>
        ))}
        <button aria-expanded={more} aria-current={moreActive ? 'page' : undefined} onClick={() => setMore(true)}>
          <span className="ico" aria-hidden>✨</span>
          More
        </button>
      </nav>

      {more && (
        <>
          <div className="sheet-backdrop" onClick={() => setMore(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="More pages">
            <div className="sheet__grip" />
            <div className="sheet__links">
              {links.slice(4).map((l) => (
                <a key={l.page} href={l.href} aria-current={cur(l.page)}>
                  <span className="ico" aria-hidden>{l.ico}</span>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
