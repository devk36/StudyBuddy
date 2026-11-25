import type { ReactNode } from 'react';
import * as T from '../lib/timer';
import type { TimerMode, TimerState } from '../lib/types';
import { fmtClock } from '../lib/util';
import './timer.css';

const modeColor: Record<TimerMode, string> = { study: '#F09AB0', short: '#9FD08F', long: '#B6A2EE' };

export function TimerDial({ timer, now, longEvery, size = 280 }: { timer: TimerState; now: number; longEvery: number; size?: number }) {
  const r = 108;
  const circ = 2 * Math.PI * r;
  const prog = T.progress(timer, now);
  const ang = prog * 2 * Math.PI - Math.PI / 2;
  const px = 130 + r * Math.cos(ang);
  const py = 130 + r * Math.sin(ang);
  const rem = T.remaining(timer, now);
  const color = modeColor[timer.mode];
  const dots = Math.max(2, Math.min(12, longEvery));
  return (
    <div className={`dial dial--${timer.mode} ${timer.status === 'running' ? 'is-running' : ''}`} style={{ width: size, maxWidth: '100%' }}>
      <svg viewBox="0 0 260 260" role="timer" aria-label={`${T.modeLabel[timer.mode]}: ${fmtClock(rem)} remaining${timer.status === 'paused' ? ', paused' : ''}`}>
        <circle cx={130} cy={130} r={126} fill="#FFFDF8" stroke="#5A4250" strokeWidth={4} />
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * 2 * Math.PI;
          const long = i % 5 === 0;
          const r1 = long ? 86 : 90;
          return (
            <line key={i} x1={130 + r1 * Math.cos(a)} y1={130 + r1 * Math.sin(a)} x2={130 + 95 * Math.cos(a)} y2={130 + 95 * Math.sin(a)} stroke="#5A4250" strokeOpacity={long ? 0.35 : 0.14} strokeWidth={long ? 3 : 2} strokeLinecap="round" />
          );
        })}
        <circle cx={130} cy={130} r={r} fill="none" stroke="#F3ECEF" strokeWidth={17} />
        <circle
          className="dial__progress"
          cx={130}
          cy={130}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={17}
          strokeLinecap="round"
          strokeDasharray={`${circ * prog} ${circ}`}
          transform="rotate(-90 130 130)"
        />
        <g transform={`translate(${px} ${py})`} className="dial__paw">
          <circle r={14} fill="#FFFDF8" stroke="#5A4250" strokeWidth={3} />
          <g fill="#5A4250">
            <ellipse cx={0} cy={3} rx={4.6} ry={3.8} />
            <circle cx={-5} cy={-3} r={1.9} />
            <circle cx={-1.7} cy={-5.8} r={1.9} />
            <circle cx={1.7} cy={-5.8} r={1.9} />
            <circle cx={5} cy={-3} r={1.9} />
          </g>
        </g>
      </svg>
      <div className="dial__center">
        <div className="dial__mode hand">
          {T.modeLabel[timer.mode]} {T.modeEmoji[timer.mode]}
        </div>
        <div className="dial__time" aria-hidden="true">{fmtClock(rem)}</div>
        <div className="dial__dots" aria-label={`${Math.min(timer.cycle, dots)} of ${dots} sessions done this cycle`}>
          {Array.from({ length: dots }, (_, i) => (
            <span key={i} className={i < timer.cycle ? 'on' : i === timer.cycle && timer.mode === 'study' ? 'now' : ''}>🐾</span>
          ))}
        </div>
        {timer.status === 'paused' && <div className="dial__paused">paused</div>}
      </div>
    </div>
  );
}

export function TimerControls({
  timer,
  onStart,
  onPause,
  onReset,
  onSkip,
  onSwitch,
  extra,
}: {
  timer: TimerState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSwitch: (m: TimerMode) => void;
  extra?: ReactNode;
}) {
  const running = timer.status === 'running';
  const label = running ? 'Pause' : timer.status === 'paused' ? 'Resume' : timer.mode === 'study' ? 'Start studying' : 'Start break';
  return (
    <div className="timer-controls">
      <div className="timer-modes" role="group" aria-label="Session type">
        {(['study', 'short', 'long'] as TimerMode[]).map((m) => (
          <button key={m} className="chip" aria-pressed={timer.mode === m} onClick={() => timer.mode !== m && onSwitch(m)}>
            {T.modeEmoji[m]} {m === 'study' ? 'Study' : m === 'short' ? 'Short break' : 'Long break'}
          </button>
        ))}
      </div>
      <div className="timer-buttons">
        <button className="btn btn--icon" onClick={onReset} aria-label="Reset timer" title="Reset">
          ↺
        </button>
        <button className={`btn btn--lg ${running ? 'btn--butter' : 'btn--primary'} timer-main`} onClick={running ? onPause : onStart}>
          {running ? '⏸' : '▶'} {label}
        </button>
        <button className="btn btn--icon" onClick={onSkip} aria-label={timer.mode === 'study' ? 'Skip to break' : 'Skip break'} title="Skip">
          ⏭
        </button>
      </div>
      {extra}
    </div>
  );
}
