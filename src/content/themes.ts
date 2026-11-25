/**
 * 🎨 Study room themes. The illustration for each lives in src/components/Scene.tsx.
 * To add a theme: add an entry here, add the id to ThemeId in src/lib/types.ts,
 * then add its colours + decor branch in Scene.tsx.
 */
import type { ThemeId } from '../lib/types';

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  emoji: string;
  blurb: string;
  /** colours used by the page around the scene */
  pageBg: string;
  dark: boolean;
}

export const themes: ThemeInfo[] = [
  { id: 'bedroom', name: 'Cozy Bedroom', emoji: '🛏️', blurb: 'Warm lamp, soft blankets, a sleepy kitty.', pageBg: '#FFF4EA', dark: false },
  { id: 'rainy', name: 'Rainy Day', emoji: '🌧️', blurb: 'Rain on the window, hot coffee.', pageBg: '#EEF3F8', dark: false },
  { id: 'library', name: 'Library', emoji: '📚', blurb: 'Tall bookshelves and peaceful quiet.', pageBg: '#F7F0E6', dark: false },
  { id: 'night', name: 'Night Study', emoji: '🌙', blurb: 'Moon, stars and one glowing lamp.', pageBg: '#262443', dark: true },
  { id: 'spring', name: 'Spring Garden', emoji: '🌷', blurb: 'Flowers, sunshine, birdsong.', pageBg: '#F1F7EC', dark: false },
];

export const themeById = (id: ThemeId) => themes.find((t) => t.id === id) ?? themes[0];
