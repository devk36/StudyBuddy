import { useEffect, useRef, useState } from 'react';
import { quickMessages, reactionEmojis } from '../content/messages';
import { emit } from '../lib/events';
import { useNow } from '../lib/hooks';
import { inviteLink, navigate } from '../lib/router';
import {
  connect,
  leaveRoom,
  markRead,
  roomGoals,
  roomTimer,
  sendMessage,
  sendReaction,
  serverNow,
  useRoom,
  type Member,
  type PresenceInfo,
  type RoomRow,
} from '../lib/room';
import { getState, profileOf, setState, useApp } from '../lib/store';
import { isSupabaseConfigured } from '../lib/supabase';
import type { Activity, Mood } from '../lib/types';
import { copyText, dayKey, fmtMinutes } from '../lib/util';
import { Modal } from '../components/Bits';
import { Companion } from '../components/Companion';
import { FocusMode } from '../components/FocusMode';
import { Pet, PetAvatar } from '../components/Pet';
import { Scene } from '../components/Scene';
import { TimerControls, TimerDial } from '../components/Timer';

const statusText: Record<string, string> = { studying: '📚 studying', break: '☕ on a break', paused: '⏸ paused', idle: '🌙 hanging out', offline: '💤 offline' };

function friendPetState(p?: PresenceInfo): { mood: Mood; activity: Activity } {
  if (!p) return { mood: 'sleepy', activity: 'sleeping' };
  if (p.status === 'studying') return { mood: 'focused', activity: 'reading' };
  if (p.status === 'break') return { mood: 'sleepy', activity: 'sleeping' };
  if (p.status === 'paused') return { mood: 'confused', activity: 'idle' };
  return { mood: 'happy', activity: 'idle' };
}

function SetupNeeded() {
  return (
    <div className="card card--lavender tape setup">
      <h2>🔌 Shared rooms need a tiny bit of setup</h2>
      <p>
        Studying together syncs a timer, presence and reactions between two devices in real time, so it needs a small (free)
        backend. Everything else — the timer, your pet, memes, goals and achievements — already works in solo mode.
      </p>
      <ol>
        <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a>.</li>
        <li>Run <code>supabase/schema.sql</code> in the SQL editor.</li>
        <li>Enable <strong>Anonymous sign-ins</strong> (Authentication → Providers).</li>
        <li>Put your project URL and anon key in <code>.env</code> (or GitHub repository secrets) and rebuild.</li>
      </ol>
      <p className="tiny muted">Full step-by-step guide in the README → “Shared rooms (Supabase)”.</p>
    </div>
  );
}

function Lobby({ code }: { code?: string }) {
  const s = useApp();
  const room = useRoom();
  const prof = profileOf(s);
  const [name, setName] = useState(s.room.displayName || prof.friendName);
  const [roomName, setRoomName] = useState(prof.roomName);
  const [joinCode, setJoinCode] = useState(code ?? '');
  const busy = room.status === 'connecting';

  const saveName = () => setState((x) => ({ ...x, room: { ...x.room, displayName: name.trim().slice(0, 30) } }), true);

  return (
    <div className="lobby">
      <div className="card tape lobby__intro">
        <div className="lobby__pets" aria-hidden>
          <Pet species={prof.species} mood="excited" size={120} still />
          <span className="lobby__heart">💗</span>
          <Pet species={prof.species === 'dog' ? 'cat' : 'dog'} mood="happy" size={120} still />
        </div>
        <h2>Study together, from anywhere</h2>
        <p className="muted">One of you creates a room and sends the invite link. You’ll share a timer, see each other’s status, send hugs, and keep each other going.</p>
        <label className="field" style={{ maxWidth: 360, margin: '10px auto 0', textAlign: 'left' }}>
          <span>Your name in the room</span>
          <input className="input" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
        </label>
      </div>

      {room.error && (
        <p className="card card--blush" role="alert">
          {room.error}
        </p>
      )}

      <div className="lobby__grid">
        <form
          className="card card--peach"
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
            void connect({ createName: roomName.trim().slice(0, 60) || prof.roomName });
          }}
        >
          <h2>🏡 Create a room</h2>
          <label className="field">
            <span>Room name</span>
            <input className="input" value={roomName} maxLength={60} onChange={(e) => setRoomName(e.target.value)} />
          </label>
          <button className="btn btn--primary" type="submit" disabled={busy || !name.trim()} style={{ marginTop: 12 }}>
            {busy ? 'Opening the door…' : '✨ Create room'}
          </button>
        </form>
        <form
          className="card card--sky"
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
            const c = joinCode.trim().toLowerCase().replace(/.*#\/room\//, '').replace(/[^a-z0-9]/g, '');
            if (c) void connect({ code: c });
          }}
        >
          <h2>🚪 Join with a code</h2>
          <label className="field">
            <span>Invite code or link</span>
            <input className="input" value={joinCode} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="e.g. mk4p9qzt2a" onChange={(e) => setJoinCode(e.target.value)} />
          </label>
          <button className="btn btn--lavender" type="submit" disabled={busy || !joinCode.trim() || !name.trim()} style={{ marginTop: 12 }}>
            {busy ? 'Knocking…' : '🫂 Join room'}
          </button>
          {s.room.lastCode && !code && (
            <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={() => void connect({ code: s.room.lastCode! })}>
              ↩ Rejoin your last room
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function DurationsModal({ room, onClose }: { room: RoomRow; onClose: () => void }) {
  const t = room.timer;
  const [d, setD] = useState({ ...t.d });
  const [autoBreak, setAutoBreak] = useState(t.autoBreak);
  const [autoStudy, setAutoStudy] = useState(t.autoStudy);
  const num = (k: keyof typeof d, min: number, max: number, label: string) => (
    <label className="field">
      <span>{label}</span>
      <input className="input" type="number" inputMode="numeric" min={min} max={max} value={d[k]} onChange={(e) => setD({ ...d, [k]: Math.max(min, Math.min(max, Math.round(Number(e.target.value) || min))) })} />
    </label>
  );
  return (
    <Modal onClose={onClose} label="Shared timer settings">
      <div className="card">
        <h2>⏱ Shared timer settings</h2>
        <p className="muted tiny">Changes apply to everyone in the room.</p>
        <div className="form-grid">
          {num('study', 1, 180, 'Study (min)')}
          {num('short', 1, 60, 'Short break (min)')}
          {num('long', 1, 90, 'Long break (min)')}
          {num('longEvery', 2, 12, 'Long break every')}
        </div>
        <label className="switch"><span>Auto-start breaks</span><input type="checkbox" checked={autoBreak} onChange={(e) => setAutoBreak(e.target.checked)} /></label>
        <label className="switch"><span>Auto-start study sessions</span><input type="checkbox" checked={autoStudy} onChange={(e) => setAutoStudy(e.target.checked)} /></label>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => { void roomTimer.setDurations(d, autoBreak, autoStudy); onClose(); }}>Save</button>
        </div>
      </div>
    </Modal>
  );
}

function InRoom() {
  const s = useApp();
  const room = useRoom();
  const r = room.room!;
  useNow(250);
  const now = serverNow();
  const [focus, setFocus] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [goal, setGoal] = useState('');
  const [copied, setCopied] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);
  const prof = profileOf(s);
  const today = dayKey();

  useEffect(() => {
    markRead();
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [room.feed.length]);

  const friends = room.members.filter((m) => m.user_id !== room.me);
  const meMember = room.members.find((m) => m.user_id === room.me);
  const stat = (m: Member) => (m.stats?.day === today ? m.stats : { ...m.stats, todayMinutes: 0, todaySessions: 0 });
  const togetherMin = room.members.reduce((a, m) => a + (stat(m).todayMinutes ?? 0), 0);
  const roomGoalPct = Math.min(100, (togetherMin / r.daily_goal_minutes) * 100);
  const link = inviteLink(r.code);

  const flash = (t: string) => {
    setCopied(t);
    setTimeout(() => setCopied(''), 1800);
  };
  const share = async () => {
    const text = `Come study with me on Study Paws 🐾 Room code: ${r.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Study with me 🐾', text, url: link });
        return;
      } catch {
        /* cancelled */
      }
    }
    if (await copyText(link)) flash('Invite link copied!');
  };

  return (
    <div className="inroom">
      <div className="card room-head">
        <div>
          <p className="label">{room.live ? '🟢 connected' : '🟡 reconnecting…'}</p>
          <h2 className="room-head__name">{r.name}</h2>
        </div>
        <div className="row">
          <button className="chip" onClick={async () => (await copyText(r.code)) && flash('Code copied!')} aria-label={`Room code ${r.code}, copy`}>
            🔑 <code>{r.code}</code>
          </button>
          <button className="btn btn--sm btn--blush" onClick={share}>💌 Invite</button>
          <button className="btn btn--sm btn--ghost" onClick={async () => (await copyText(link)) && flash('Invite link copied!')}>🔗 Copy link</button>
          <button
            className="btn btn--sm btn--ghost"
            onClick={() => {
              if (confirm('Leave this room? You can rejoin with the code as long as someone is still in it.')) {
                void leaveRoom();
                navigate('/room', true);
              }
            }}
          >
            🚪 Leave
          </button>
        </div>
        {copied && <span className="room-head__copied" role="status">{copied}</span>}
      </div>

      <div className="room-grid">
        <Scene theme={s.settings.theme} className="room-scene">
          <div className="room-pets">
            <div className="room-pets__me">
              <Companion timer={r.timer} now={now} size={180} showName={false} />
              <span className="room-pets__tag">{meMember?.display_name ?? 'you'}</span>
            </div>
            {friends.slice(0, 3).map((f) => {
              const p = room.online[f.user_id];
              const st = friendPetState(p);
              return (
                <div key={f.user_id} className={`room-pets__friend ${p ? '' : 'is-offline'}`}>
                  <Pet species={f.pet} mood={st.mood} activity={st.activity} size={150} title={`${f.display_name}'s ${f.pet}`} accessories={p?.acc ?? []} />
                  <span className="room-pets__tag">{f.display_name}</span>
                </div>
              );
            })}
          </div>
        </Scene>

        <div className="card timer-card tape tape--sage">
          <TimerDial timer={r.timer} now={now} longEvery={r.timer.d.longEvery} />
          <TimerControls
            timer={r.timer}
            onStart={() => void roomTimer.start()}
            onPause={() => void roomTimer.pause()}
            onReset={() => void roomTimer.reset()}
            onSkip={() => void roomTimer.skip()}
            onSwitch={(m) => void roomTimer.switchTo(m)}
            extra={
              <div className="row" style={{ justifyContent: 'center' }}>
                <button className="btn btn--sm btn--lavender" onClick={() => setFocus(true)}>🎧 Focus mode</button>
                <button className="btn btn--sm" onClick={() => setSettingsOpen(true)}>⏱ Timer settings</button>
              </div>
            }
          />
          <p className="tiny muted" style={{ textAlign: 'center' }}>Shared timer — anyone in the room can start, pause or skip.</p>
        </div>
      </div>

      <div className="room-lower">
        <div className="card card--sky">
          <h2>🫂 In this room</h2>
          <ul className="people">
            {room.members.map((m) => {
              const p = room.online[m.user_id];
              const st = stat(m);
              const status = p ? p.status : 'offline';
              return (
                <li key={m.user_id} className={`person ${p ? 'is-online' : ''}`}>
                  <PetAvatar species={m.pet} mood={p ? (status === 'studying' ? 'focused' : 'happy') : 'sleepy'} />
                  <div className="person__info">
                    <strong>
                      {m.display_name} {m.user_id === room.me && <span className="muted tiny">(you)</span>}
                    </strong>
                    <span className={`person__status person__status--${status}`}>
                      <i aria-hidden /> {statusText[status]}
                      {p?.focus ? ' · 🎧 focus' : ''}
                    </span>
                  </div>
                  <div className="person__stats">
                    <span title="streak">🔥 {st.streak ?? 0}</span>
                    <span title="studied today">⏱ {fmtMinutes(st.todayMinutes ?? 0)}</span>
                    <span title="sessions today">🐾 {st.todaySessions ?? 0}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          {friends.length === 0 && (
            <p className="muted tiny">
              It’s just you (and {prof.petName}) for now. Send the invite link — your friend will pop up here the moment they join.
            </p>
          )}
        </div>

        <div className="card card--blush">
          <h2>💌 Cheer each other on</h2>
          <div className="reactions" role="group" aria-label="Send a reaction">
            {reactionEmojis.map((e) => (
              <button key={e} className="reaction" onClick={() => sendReaction(e)} aria-label={`Send ${e}`} disabled={!room.live}>
                {e}
              </button>
            ))}
          </div>
          <div className="row quick-msgs" role="group" aria-label="Quick messages">
            {quickMessages.map((q) => (
              <button key={q} className="chip" onClick={() => sendMessage(q)} disabled={!room.live}>
                {q}
              </button>
            ))}
          </div>
          <form
            className="row msg-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (sendMessage(msg)) setMsg('');
            }}
          >
            <input className="input" value={msg} maxLength={120} placeholder="Write something sweet…" onChange={(e) => setMsg(e.target.value)} aria-label="Message" />
            <button className="btn btn--primary" type="submit" disabled={!msg.trim() || !room.live}>Send</button>
          </form>
          <div className="feed" ref={feedRef} aria-live="polite">
            {room.feed.length === 0 && <p className="muted tiny">Reactions and messages appear here (they’re not stored anywhere).</p>}
            {room.feed.map((f) => (
              <div key={f.id} className={`feed__item ${f.mine ? 'is-mine' : ''}`}>
                <span className="feed__name">{f.mine ? 'you' : f.name}</span>
                <span className={f.emoji ? 'feed__emoji' : 'feed__text'}>{f.emoji ?? f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card card--sage">
          <div className="spread">
            <h2>✅ Shared goals</h2>
            <span className="badge-pill">{r.goals.filter((g) => g.done).length}/{r.goals.length}</span>
          </div>
          <div style={{ margin: '8px 0 14px' }}>
            <div className="spread tiny">
              <strong>Together today: {fmtMinutes(togetherMin)}</strong>
              <span className="muted">room goal {fmtMinutes(r.daily_goal_minutes)}</span>
            </div>
            <div className="progress progress--lavender" role="progressbar" aria-valuenow={Math.round(roomGoalPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Shared daily goal">
              <i style={{ width: `${roomGoalPct}%` }} />
            </div>
            <div className="row" style={{ marginTop: 8, gap: 6 }}>
              {[60, 120, 240, 360].map((m) => (
                <button key={m} className="chip" aria-pressed={r.daily_goal_minutes === m} onClick={() => void roomGoals.setDaily(m)}>
                  {fmtMinutes(m)}
                </button>
              ))}
            </div>
          </div>
          <ul className="goals">
            {r.goals.map((g) => (
              <li key={g.id} className={g.done ? 'is-done' : ''}>
                <label>
                  <input type="checkbox" checked={g.done} onChange={() => {
                    void roomGoals.toggle(g.id);
                    if (!g.done) emit('confetti', { amount: 30 });
                  }} />
                  <span>{g.text}</span>
                </label>
                {g.by && <span className="tiny muted">{g.by}</span>}
                <button className="btn btn--ghost btn--sm btn--icon" onClick={() => void roomGoals.remove(g.id)} aria-label={`Remove goal ${g.text}`}>✕</button>
              </li>
            ))}
          </ul>
          <form
            className="row msg-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (goal.trim()) {
                void roomGoals.add(goal.trim());
                setGoal('');
              }
            }}
          >
            <input className="input" value={goal} maxLength={120} placeholder="e.g. Finish chapter 4" onChange={(e) => setGoal(e.target.value)} aria-label="New shared goal" />
            <button className="btn btn--sage" type="submit" disabled={!goal.trim()}>Add</button>
          </form>
        </div>
      </div>

      {settingsOpen && <DurationsModal room={r} onClose={() => setSettingsOpen(false)} />}
      {focus && (
        <FocusMode
          timer={r.timer}
          now={now}
          longEvery={r.timer.d.longEvery}
          onStart={() => void roomTimer.start()}
          onPause={() => void roomTimer.pause()}
          onExit={() => setFocus(false)}
          label={r.name}
        />
      )}
      <p className="tiny" style={{ textAlign: 'center', marginTop: 16, color: 'var(--page-ink-soft)' }}>
        Tip: your pet keeps you company here too — pet them, they love it.
      </p>
    </div>
  );
}

export function SharedRoom({ code }: { code?: string }) {
  const room = useRoom();
  const attempted = useRef<string | null>(null);

  // arriving via invite link → join automatically (once per code)
  useEffect(() => {
    if (!isSupabaseConfigured || !code) return;
    if (room.room?.code === code || room.status === 'connecting') return;
    if (attempted.current === code) return;
    attempted.current = code;
    const name = getState().room.displayName;
    if (!name) return; // let them type their name first
    void connect({ code });
  }, [code, room.room?.code, room.status]);

  // keep the URL pointing at the current room so refresh rejoins it
  useEffect(() => {
    if (room.room && code !== room.room.code) navigate(`/room/${room.room.code}`, true);
  }, [room.room, code]);

  return (
    <div className="shared">
      <div className="page-head">
        <div>
          <h1>Shared Room 🫂</h1>
          <p className="sub">two brains, approximately zero distractions</p>
        </div>
      </div>
      {!isSupabaseConfigured ? <SetupNeeded /> : room.room && room.status === 'joined' ? <InRoom /> : <Lobby code={code} />}
    </div>
  );
}
