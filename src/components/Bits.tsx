import { useEffect, useRef, useState, type ReactNode } from 'react';
import { themes } from '../content/themes';
import { updateSettings } from '../lib/actions';
import { computeStreak, lastDays } from '../lib/progress';
import { todayStat, useApp } from '../lib/store';
import { dayKey, fmtMinutes } from '../lib/util';

export function GoalCard({ compact = false }: { compact?: boolean }) {
  const s = useApp();
  const t = todayStat(s, dayKey());
  const goal = s.settings.dailyGoal;
  const pct = Math.min(100, (t.minutes / goal) * 100);
  const [custom, setCustom] = useState('');
  const presets = [30, 60, 120, 180];
  return (
    <div className="card card--sage goal-card">
      <div className="spread">
        <h2>🎯 Today’s goal</h2>
        <span className="badge-pill">{pct >= 100 ? 'done! 🎉' : `${Math.round(pct)}%`}</span>
      </div>
      <p className="goal-card__nums">
        <strong>{fmtMinutes(t.minutes)}</strong> <span className="muted">of {fmtMinutes(goal)}</span>
      </p>
      <div className="progress progress--sage" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Daily goal progress">
        <i style={{ width: `${pct}%` }} />
      </div>
      <p className="tiny muted" style={{ marginTop: 6 }}>
        {t.sessions} session{t.sessions === 1 ? '' : 's'} today · 🔥 {computeStreak(s.stats.history)}-day streak
      </p>
      {!compact && (
        <div className="row" style={{ marginTop: 12 }} role="group" aria-label="Choose daily goal">
          {presets.map((m) => (
            <button key={m} className="chip" aria-pressed={goal === m} onClick={() => updateSettings({ dailyGoal: m })}>
              {fmtMinutes(m)}
            </button>
          ))}
          <form
            className="row"
            style={{ gap: 6 }}
            onSubmit={(e) => {
              e.preventDefault();
              const v = Math.round(Number(custom));
              if (v >= 10 && v <= 960) {
                updateSettings({ dailyGoal: v });
                setCustom('');
              }
            }}
          >
            <input className="input" style={{ width: 92, minHeight: 36, padding: '4px 10px' }} inputMode="numeric" type="number" min={10} max={960} placeholder="min" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Custom goal in minutes" />
            <button className="btn btn--sm" type="submit" disabled={!custom}>Set</button>
          </form>
        </div>
      )}
    </div>
  );
}

export function WeekChart() {
  const s = useApp();
  const days = lastDays(s.stats.history, 7);
  const max = Math.max(s.settings.dailyGoal, ...days.map((d) => d.minutes), 1);
  const today = dayKey();
  return (
    <div className="week" role="img" aria-label={`Minutes studied in the last 7 days: ${days.map((d) => Math.round(d.minutes)).join(', ')}`}>
      {days.map((d) => {
        const [y, m, dd] = d.key.split('-').map(Number);
        const wd = new Date(y, m - 1, dd).toLocaleDateString(undefined, { weekday: 'narrow' });
        return (
          <div key={d.key} className={`week__col ${d.key === today ? 'is-today' : ''}`}>
            <div className="week__bar">
              <i style={{ height: `${Math.max(d.minutes ? 6 : 0, (d.minutes / max) * 100)}%` }} />
            </div>
            <span className="week__lbl">{d.sessions > 0 ? '🐾' : wd}</span>
          </div>
        );
      })}
      <div className="week__goal" style={{ bottom: `calc(${(s.settings.dailyGoal / max) * 100}% * 0.78 + 22px)` }} aria-hidden>
        <span>goal</span>
      </div>
    </div>
  );
}

export function ThemePicker() {
  const s = useApp();
  return (
    <div className="row theme-picker" role="radiogroup" aria-label="Room theme">
      {themes.map((t) => (
        <button key={t.id} role="radio" aria-checked={s.settings.theme === t.id} className="chip" aria-pressed={s.settings.theme === t.id} title={t.blurb} onClick={() => updateSettings({ theme: t.id })}>
          <span aria-hidden>{t.emoji}</span> {t.name}
        </button>
      ))}
    </div>
  );
}

export function Modal({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={label} ref={ref} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
