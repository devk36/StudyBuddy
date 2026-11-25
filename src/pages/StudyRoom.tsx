import { useEffect, useRef, useState } from 'react';
import { memeMoment, soloPause, soloReset, soloSkip, soloStart, soloSwitch, updateSettings } from '../lib/actions';
import { emit } from '../lib/events';
import { useNow } from '../lib/hooks';
import { notificationsSupported, requestNotifications } from '../lib/notify';
import { todayStat, useApp } from '../lib/store';
import { dayKey, fmtMinutes } from '../lib/util';
import { AmbientMixer } from '../components/AmbientMixer';
import { GoalCard, ThemePicker } from '../components/Bits';
import { Companion } from '../components/Companion';
import { FocusMode } from '../components/FocusMode';
import { Scene } from '../components/Scene';
import { TimerControls, TimerDial } from '../components/Timer';

export function StudyRoom() {
  const s = useApp();
  const now = useNow(250);
  const [focus, setFocus] = useState(false);
  const t = s.timer;
  const today = todayStat(s, dayKey());
  const idleSince = useRef(Date.now());

  // procrastination nudge: timer idle on the study page for 5 minutes
  useEffect(() => {
    idleSince.current = Date.now();
    if (t.status !== 'idle') return;
    const id = setInterval(() => {
      if (Date.now() - idleSince.current > 5 * 60_000 && document.visibilityState === 'visible') {
        idleSince.current = Date.now() + 15 * 60_000; // then quiet for a while
        emit('pet', { mood: 'disappointed', message: 'The book is open. The brain is not. 👀', ms: 7000, anim: 'wiggle' });
        memeMoment('procrastinating');
      }
    }, 15_000);
    return () => clearInterval(id);
  }, [t.status, t.sessionId]);

  const needsPermission = s.settings.notifications && notificationsSupported() && Notification.permission === 'default';

  return (
    <div className="study">
      <div className="page-head">
        <div>
          <h1>Study Room 📚</h1>
          <p className="sub">your cozy little desk</p>
        </div>
        <ThemePicker />
      </div>

      <div className="study-grid">
        <Scene theme={s.settings.theme}>
          <div className="scene-pet">
            <Companion timer={t} now={now} size={220} showName={false} />
          </div>
        </Scene>

        <div className="card timer-card tape tape--lavender">
          <TimerDial timer={t} now={now} longEvery={s.settings.durations.longEvery} />
          <TimerControls
            timer={t}
            onStart={soloStart}
            onPause={soloPause}
            onReset={soloReset}
            onSkip={soloSkip}
            onSwitch={soloSwitch}
            extra={
              <div className="row" style={{ justifyContent: 'center' }}>
                <button className="btn btn--sm btn--lavender" onClick={() => setFocus(true)}>
                  🎧 Focus mode
                </button>
                <a className="btn btn--sm" href="#/settings">
                  ⚙️ Timer settings
                </a>
              </div>
            }
          />
          <div className="timer-stats">
            <div>
              <strong>{fmtMinutes(today.minutes)}</strong>
              <span>focus today</span>
            </div>
            <div>
              <strong>{today.sessions}</strong>
              <span>sessions today</span>
            </div>
            <div>
              <strong>{s.stats.totalSessions}</strong>
              <span>all-time</span>
            </div>
          </div>
          {needsPermission && (
            <button className="btn btn--sm btn--butter" onClick={() => requestNotifications().then((ok) => !ok && updateSettings({ notifications: false }))}>
              🔔 Allow notifications for timer alerts
            </button>
          )}
        </div>
      </div>

      <div className="study-lower">
        <GoalCard />
        <div className="card card--peach">
          <h2>🎧 Ambient sounds</h2>
          <p className="muted tiny" style={{ marginBottom: 10 }}>Nothing plays until you tap. Tip: rain + lo-fi is elite.</p>
          <AmbientMixer />
        </div>
      </div>

      {focus && (
        <FocusMode
          timer={t}
          now={now}
          longEvery={s.settings.durations.longEvery}
          onStart={soloStart}
          onPause={soloPause}
          onExit={() => setFocus(false)}
        />
      )}
    </div>
  );
}
