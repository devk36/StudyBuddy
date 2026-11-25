/**
 * Hash router: #/study, #/room/abc123 … Hash URLs work on GitHub Pages
 * (static hosting) without any 404.html redirect tricks.
 */
import { useSyncExternalStore } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'study' }
  | { page: 'room'; code?: string }
  | { page: 'memes'; id?: string }
  | { page: 'achievements' }
  | { page: 'shop' }
  | { page: 'settings' };

export function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  switch (parts[0]) {
    case 'study':
      return { page: 'study' };
    case 'room':
      return { page: 'room', code: parts[1]?.toLowerCase().replace(/[^a-z0-9]/g, '') || undefined };
    case 'memes':
      return { page: 'memes', id: parts[1] };
    case 'achievements':
      return { page: 'achievements' };
    case 'shop':
      return { page: 'shop' };
    case 'settings':
      return { page: 'settings' };
    default:
      return { page: 'home' };
  }
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};
const getHash = () => window.location.hash;

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, getHash);
  return parse(hash);
}

export function navigate(path: string, replace = false) {
  const h = '#' + (path.startsWith('/') ? path : '/' + path);
  if (replace) history.replaceState(null, '', h);
  else if (location.hash !== h) location.hash = h;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function inviteLink(code: string): string {
  const base = location.href.split('#')[0];
  return `${base}#/room/${code}`;
}
