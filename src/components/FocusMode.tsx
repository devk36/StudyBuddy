import { useEffect, useRef, useState } from 'react';
import { encouragements } from '../content/messages';
import { profileOf, todayStat, useApp } from '../lib/store';
import type { TimerState } from '../lib/types';
import { setUi } from '../lib/ui';
import { dayKey, fill, fmtMinutes, pick } from '../lib/util';
import { Companion } from './Companion';
import { TimerDial } from './Timer';
import './focus.css';

const fsSupported = () => typeof document !== 'undefined' && !!(document.fullscreenEnabled || (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled);

export function FocusMode({
  timer,
  now,
  longEvery,
  onStart,
  onPause,
  onExit,
  label,
}: {
  timer: TimerState;
  now: number;
  longEvery: number;
  onStart: () => void;
  onPause: () => void;
  onExit: () => void;
  label?: string;
}) {
  const s = useApp();
  const prof = profileOf(s);
  const root = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  const [line, setLine] = useState(() => fill(pick(encouragements), { friend: prof.friendName }));
  const today = todayStat(s, dayKey());
  const goalPct = Math.min(100, (today.minutes / s.settings.dailyGoal) * 100);

  // latest handlers without re-running the mount effect every tick
  const handlers = useRef({ onExit, onPause, onStart, running: timer.status === 'running' });
  handlers.current = { onExit, onPause, onStart, running: timer.status === 'running' };

  useEffect(() => {
    setUi({ focus: true });
    document.body.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => {
      const h = handlers.current;
      if (e.key === 'Escape' && !document.fullscreenElement) h.onExit();
      if (e.key === ' ' && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault();
        if (h.running) h.onPause();
        else h.onStart();
      }
    };
    window.addEventListener('keydown', key);
    const fsChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fsChange);
    return () => {
      setUi({ focus: false });
      document.body.style.overflow = '';
      window.removeEventListener('keydown', key);
      document.removeEventListener('fullscreenchange', fsChange);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (s.settings.focusHideMessages) return;
    const id = setInterval(() => setLine(fill(pick(encouragements), { friend: prof.friendName })), 90_000);
    return () => clearInterval(id);
  }, [s.settings.focusHideMessages, prof.friendName]);

  const toggleFs = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      /* not allowed */
    }
  };

  const running = timer.status === 'running';
  return (
    <div className="focus" ref={root} role="dialog" aria-modal="true" aria-label="Focus mode">
      <div className="focus__top">
        <span className="badge-pill">🎧 focus mode{label ? ` · ${label}` : ''}</span>
        <div className="row">
          {fsSupported() && (
            <button className="btn btn--sm" onClick={toggleFs} aria-label={isFs ? 'Exit fullscreen' : 'Enter fullscreen'}>
              {isFs ? '🗗' : '⛶'} <span className="hide-sm">{isFs ? 'Exit fullscreen' : 'Fullscreen'}</span>
            </button>
          )}
          <button className="btn btn--sm" onClick={onExit}>
            ✕ <span className="hide-sm">Exit focus</span>
          </button>
        </div>
      </div>
      <div className="focus__body">
        <TimerDial timer={timer} now={now} longEvery={longEvery} size={340} />
        <div className="focus__side">
          <Companion timer={timer} now={now} size={150} quiet={s.settings.focusHideMessages} showName={false} />
          <button className={`btn btn--lg ${running ? 'btn--butter' : 'btn--primary'}`} onClick={running ? onPause : onStart}>
            {running ? '⏸ Pause' : timer.status === 'paused' ? '▶ Resume' : '▶ Start'}
          </button>
        </div>
      </div>
      <div className="focus__bottom">
        <div className="focus__goal">
          <div className="spread tiny">
            <span>today: {fmtMinutes(today.minutes)}</span>
            <span>goal: {fmtMinutes(s.settings.dailyGoal)}</span>
          </div>
          <div className="progress progress--sage" aria-label={`Daily goal ${Math.round(goalPct)}%`}>
            <i style={{ width: `${goalPct}%` }} />
          </div>
        </div>
        {!s.settings.focusHideMessages && <p className="focus__line hand">{line}</p>}
      </div>
    </div>
  );
}
