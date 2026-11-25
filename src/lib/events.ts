/** Tiny typed event bus for transient UI moments (pet reactions, toasts, floaters). */
import type { Activity, Mood } from './types';

export interface AppEvents {
  pet: { mood?: Mood; activity?: Activity; message?: string; ms?: number; anim?: 'bounce' | 'wiggle' | 'purr' | 'jump' };
  toast: { id?: string; kind: 'achievement' | 'info' | 'coins'; title: string; body?: string; emoji?: string };
  meme: { moment: string };
  float: { emoji: string; count?: number; from?: string };
  confetti: { amount?: number };
}

type Handler<K extends keyof AppEvents> = (p: AppEvents[K]) => void;
const handlers: { [K in keyof AppEvents]?: Set<Handler<K>> } = {};

export function on<K extends keyof AppEvents>(type: K, fn: Handler<K>): () => void {
  const set = (handlers[type] ??= new Set() as never) as Set<Handler<K>>;
  set.add(fn);
  return () => set.delete(fn);
}

export function emit<K extends keyof AppEvents>(type: K, payload: AppEvents[K]): void {
  const set = handlers[type] as Set<Handler<K>> | undefined;
  set?.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.warn('[study-paws] event handler failed', e);
    }
  });
}
