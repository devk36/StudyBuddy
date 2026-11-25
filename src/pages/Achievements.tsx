import { achievements } from '../content/achievements';
import { computeStreak } from '../lib/progress';
import { useApp } from '../lib/store';
import { fmtMinutes } from '../lib/util';
import { GoalCard, WeekChart } from '../components/Bits';

export function Achievements() {
  const s = useApp();
  const streak = computeStreak(s.stats.history);
  const unlocked = achievements.filter((a) => s.stats.unlocked[a.id]).length;
  const best = Object.values(s.stats.history).reduce((m, d) => Math.max(m, d.minutes), 0);
  return (
    <div className="achievements">
      <div className="page-head">
        <div>
          <h1>Achievements 🏆</h1>
          <p className="sub">tiny trophies for big effort</p>
        </div>
        <span className="badge-pill" style={{ fontSize: '1rem' }}>{unlocked} / {achievements.length} unlocked</span>
      </div>

      <div className="stat-strip">
        <div className="card card--peach stat-big"><span>🔥</span><strong>{streak}</strong><em>day streak</em></div>
        <div className="card card--lavender stat-big"><span>🐾</span><strong>{s.stats.totalSessions}</strong><em>sessions</em></div>
        <div className="card card--sky stat-big"><span>⏱</span><strong>{fmtMinutes(s.stats.totalMinutes)}</strong><em>total focus</em></div>
        <div className="card card--butter stat-big"><span>⭐</span><strong>{fmtMinutes(best)}</strong><em>best day</em></div>
      </div>

      <div className="ach-top">
        <GoalCard />
        <div className="card">
          <h2>📈 Last 7 days</h2>
          <WeekChart />
        </div>
      </div>

      <div className="badges">
        {achievements.map((a) => {
          const at = s.stats.unlocked[a.id];
          return (
            <div key={a.id} className={`badge badge--${a.color} ${at ? 'is-on' : ''}`}>
              <div className="badge__medal" aria-hidden>{at ? a.emoji : '🔒'}</div>
              <h3>{a.name}</h3>
              <p>{a.description}</p>
              <span className="badge__when">{at ? `unlocked ${new Date(at).toLocaleDateString()}` : 'locked'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
