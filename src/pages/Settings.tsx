import { useState } from 'react';
import { personalize } from '../config/personalize';
import { updateProfile, updateSettings } from '../lib/actions';
import { emit } from '../lib/events';
import { notificationsSupported, requestNotifications } from '../lib/notify';
import { getState, profileOf, resetAll, setState, useApp, type ProfileOverrides } from '../lib/store';
import { isSupabaseConfigured } from '../lib/supabase';
import type { Species } from '../lib/types';
import { ThemePicker } from '../components/Bits';
import { Pet } from '../components/Pet';

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const commit = () => {
    const v = Math.round(Number(draft));
    if (Number.isFinite(v) && v >= min && v <= max) onChange(v);
    else setDraft(String(value));
  };
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" type="number" inputMode="numeric" min={min} max={max} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} />
    </label>
  );
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="switch">
      <span>
        {label}
        {hint && <span className="tiny muted" style={{ display: 'block', fontWeight: 600 }}>{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Settings() {
  const s = useApp();
  const prof = profileOf(s);
  const d = s.settings.durations;
  const [draft, setDraft] = useState<ProfileOverrides>({ ...prof });
  const setDur = (k: keyof typeof d, v: number) => updateSettings({ durations: { ...d, [k]: v } });

  const saveProfile = () => {
    const clean: ProfileOverrides = {};
    (Object.keys(draft) as (keyof ProfileOverrides)[]).forEach((k) => {
      const v = draft[k];
      if (typeof v === 'string') (clean as Record<string, string>)[k] = v.trim().slice(0, k === 'note' ? 600 : 120);
    });
    updateProfile(clean);
    emit('toast', { kind: 'info', title: 'Saved! ✨', emoji: '💾' });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `study-paws-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <div className="settings">
      <div className="page-head">
        <div>
          <h1>Settings ⚙️</h1>
          <p className="sub">make it yours</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="card card--blush">
          <h2>🐾 Companion</h2>
          <div className="pick-pet" role="radiogroup" aria-label="Companion species" style={{ margin: '10px 0' }}>
            {(['cat', 'dog', 'bunny'] as Species[]).map((sp) => (
              <button key={sp} role="radio" aria-checked={prof.species === sp} className={`pick-pet__opt ${prof.species === sp ? 'is-on' : ''}`} onClick={() => updateProfile({ species: sp })}>
                <Pet species={sp} mood={prof.species === sp ? 'excited' : 'happy'} size={84} still />
                <span>{sp === 'cat' ? 'Kitty' : sp === 'dog' ? 'Puppy' : 'Bunny'}</span>
              </button>
            ))}
          </div>
          <label className="field">
            <span>Pet’s name</span>
            <input className="input" maxLength={24} value={draft.petName ?? ''} onChange={(e) => setDraft({ ...draft, petName: e.target.value })} onBlur={saveProfile} />
          </label>
        </section>

        <section className="card card--lavender">
          <h2>⏱ Timer</h2>
          <div className="form-grid">
            <NumberField label="Study (min)" value={d.study} min={1} max={180} onChange={(v) => setDur('study', v)} />
            <NumberField label="Short break (min)" value={d.short} min={1} max={60} onChange={(v) => setDur('short', v)} />
            <NumberField label="Long break (min)" value={d.long} min={1} max={90} onChange={(v) => setDur('long', v)} />
            <NumberField label="Long break every" value={d.longEvery} min={2} max={12} onChange={(v) => setDur('longEvery', v)} />
          </div>
          <Toggle label="Auto-start breaks" checked={s.settings.autoStartBreaks} onChange={(v) => updateSettings({ autoStartBreaks: v })} />
          <Toggle label="Auto-start study sessions" checked={s.settings.autoStartStudy} onChange={(v) => updateSettings({ autoStartStudy: v })} />
          <p className="tiny muted">Duration changes apply to the next session (or right away if the timer isn’t running).</p>
        </section>

        <section className="card card--sky">
          <h2>🔔 Sounds & alerts</h2>
          <Toggle label="Timer & reaction sounds" checked={s.settings.sound} onChange={(v) => updateSettings({ sound: v })} />
          <label className="field">
            <span>Sound volume</span>
            <input type="range" min={0.05} max={1} step={0.05} value={s.settings.volume} onChange={(e) => updateSettings({ volume: Number(e.target.value) })} />
          </label>
          <Toggle
            label="Browser notifications"
            hint={notificationsSupported() ? 'Pings you when a session ends while you’re in another tab.' : 'Not supported here (on iPhone: Share → Add to Home Screen first).'}
            checked={s.settings.notifications}
            onChange={async (v) => {
              if (!v) return updateSettings({ notifications: false });
              const ok = await requestNotifications();
              updateSettings({ notifications: ok });
              if (!ok) emit('toast', { kind: 'info', title: 'Notifications are blocked by the browser', body: 'You can allow them in your browser’s site settings.', emoji: '🔕' });
            }}
          />
        </section>

        <section className="card card--sage">
          <h2>🎧 Focus & fun</h2>
          <Toggle label="Contextual meme pop-ups" checked={s.settings.memePopups} onChange={(v) => updateSettings({ memePopups: v })} />
          <Toggle label="Hide memes in focus mode" checked={s.settings.focusHideMemes} onChange={(v) => updateSettings({ focusHideMemes: v })} />
          <Toggle label="Hide messages in focus mode" hint="Pet chatter + friend messages stay quiet; reactions still arrive in the feed." checked={s.settings.focusHideMessages} onChange={(v) => updateSettings({ focusHideMessages: v })} />
          <Toggle label="Reduce motion" hint="Also follows your system setting automatically." checked={s.settings.reduceMotion} onChange={(v) => updateSettings({ reduceMotion: v })} />
        </section>

        <section className="card card--peach wide">
          <h2>🎨 Room theme</h2>
          <ThemePicker />
        </section>

        <section className="card wide">
          <h2>💌 Personal touches</h2>
          <p className="tiny muted">Defaults come from <code>src/config/personalize.ts</code>. Edits here are saved on this device.</p>
          <div className="form-grid">
            <label className="field"><span>Your name (friend)</span><input className="input" maxLength={40} value={draft.friendName ?? ''} onChange={(e) => setDraft({ ...draft, friendName: e.target.value })} /></label>
            <label className="field"><span>Gift from</span><input className="input" maxLength={40} value={draft.yourName ?? ''} onChange={(e) => setDraft({ ...draft, yourName: e.target.value })} /></label>
            <label className="field"><span>Default room name</span><input className="input" maxLength={60} value={draft.roomName ?? ''} onChange={(e) => setDraft({ ...draft, roomName: e.target.value })} /></label>
            <label className="field"><span>Name shown in shared rooms</span><input className="input" maxLength={30} value={s.room.displayName} placeholder={prof.friendName} onChange={(e) => setState((x) => ({ ...x, room: { ...x.room, displayName: e.target.value.slice(0, 30) } }))} /></label>
          </div>
          <label className="field" style={{ marginTop: 10 }}><span>Welcome title</span><input className="input" maxLength={120} value={draft.welcomeTitle ?? ''} onChange={(e) => setDraft({ ...draft, welcomeTitle: e.target.value })} /></label>
          <label className="field" style={{ marginTop: 10 }}><span>Welcome message</span><input className="input" maxLength={120} value={draft.welcomeSubtitle ?? ''} onChange={(e) => setDraft({ ...draft, welcomeSubtitle: e.target.value })} /></label>
          <label className="field" style={{ marginTop: 10 }}><span>The little note</span><textarea className="input" maxLength={600} value={draft.note ?? ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></label>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn btn--primary" onClick={saveProfile}>💾 Save</button>
            <button className="btn btn--ghost" onClick={() => { setDraft({ ...personalize, species: undefined }); updateProfile({ friendName: '', yourName: '', welcomeTitle: '', welcomeSubtitle: '', note: '', roomName: '', petName: '' }); }}>Restore defaults</button>
            <button className="btn btn--lavender" onClick={() => setState((x) => ({ ...x, welcomed: false }), true)}>🎁 Replay the welcome</button>
          </div>
        </section>

        <section className="card wide">
          <h2>🗂 Your data</h2>
          <p className="muted tiny">
            Everything is stored in this browser (localStorage). {isSupabaseConfigured ? 'Shared rooms use an anonymous account — no email or personal info.' : 'Shared rooms are not configured in this build.'}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn--sm" onClick={exportData}>⬇️ Download backup</button>
            <label className="btn btn--sm">
              ⬆️ Restore backup
              <input
                type="file"
                accept="application/json"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const data = JSON.parse(await f.text());
                    if (data?.v !== 1) throw new Error('bad file');
                    localStorage.setItem('study-paws:v1', JSON.stringify(data));
                    location.reload();
                  } catch {
                    emit('toast', { kind: 'info', title: 'That file doesn’t look like a Study Paws backup', emoji: '⚠️' });
                  }
                }}
              />
            </label>
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => {
                if (confirm('Reset everything? Stats, coins, achievements and settings on this device will be erased.')) {
                  resetAll();
                  location.hash = '#/';
                }
              }}
            >
              🧹 Reset everything
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
