/** Ephemeral UI flags shared across components (not persisted). */
import { useSyncExternalStore } from 'react';

interface Ui {
  focus: boolean;
}
let ui: Ui = { focus: false };
const ls = new Set<() => void>();
export const getUi = () => ui;
export function setUi(p: Partial<Ui>) {
  ui = { ...ui, ...p };
  ls.forEach((l) => l());
}
export function useUi(): Ui {
  return useSyncExternalStore(
    (l) => {
      ls.add(l);
      return () => ls.delete(l);
    },
    getUi,
    getUi,
  );
}
