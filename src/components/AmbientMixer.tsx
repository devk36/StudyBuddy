import { useEffect, useState } from 'react';
import { ambientSounds, audioSupported, onAmbientChange, playAmbient, playingAmbient, setAmbientVolume, stopAllAmbient, stopAmbient, unlockAudio } from '../lib/audio';
import { getState, setState, useApp } from '../lib/store';

export function AmbientMixer({ compact = false }: { compact?: boolean }) {
  const s = useApp();
  const [playing, setPlaying] = useState(playingAmbient);
  useEffect(() => {
    const off = onAmbientChange(() => setPlaying(playingAmbient()));
    return () => {
      off();
    };
  }, []);

  if (!audioSupported()) return <p className="muted">Your browser doesn’t support Web Audio, so ambient sounds are unavailable.</p>;

  const vol = (id: string) => s.ambient[id] ?? 0.5;
  const setVol = (id: string, v: number) => {
    setState((x) => ({ ...x, ambient: { ...x.ambient, [id]: v } }));
    setAmbientVolume(id, v);
  };
  const toggle = (id: string) => {
    unlockAudio();
    if (playing.has(id)) stopAmbient(id);
    else playAmbient(id, getState().ambient[id] ?? 0.5);
  };

  return (
    <div className={`mixer ${compact ? 'mixer--compact' : ''}`}>
      <div className="mixer__grid">
        {ambientSounds.map((a) => {
          const on = playing.has(a.id);
          return (
            <div key={a.id} className={`mixer__item ${on ? 'is-on' : ''}`}>
              <button className="mixer__toggle" aria-pressed={on} onClick={() => toggle(a.id)}>
                <span className="mixer__emoji" aria-hidden>{a.emoji}</span>
                <span>{a.name}</span>
                {on && <span className="mixer__eq" aria-hidden><i /><i /><i /></span>}
              </button>
              {on && (
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={vol(a.id)}
                  onChange={(e) => setVol(a.id, Number(e.target.value))}
                  aria-label={`${a.name} volume`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="spread" style={{ marginTop: 10 }}>
        <p className="tiny muted">Mix as many as you like. All sounds are generated live — nothing to download.</p>
        {playing.size > 0 && (
          <button className="btn btn--sm" onClick={stopAllAmbient}>
            🔇 Stop all
          </button>
        )}
      </div>
    </div>
  );
}
