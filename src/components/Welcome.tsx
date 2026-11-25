import { useState } from 'react';
import { personalize } from '../config/personalize';
import { finishWelcome, playSound, updateProfile } from '../lib/actions';
import { unlockAudio } from '../lib/audio';
import { emit } from '../lib/events';
import { profileOf, useApp } from '../lib/store';
import type { Species } from '../lib/types';
import { fill } from '../lib/util';
import { Pet } from './Pet';
import './welcome.css';

/** The gift-opening experience shown on first visit (replayable from Settings). */
export function Welcome() {
  const s = useApp();
  const prof = profileOf(s);
  const [step, setStep] = useState(0);
  const [species, setSpecies] = useState<Species>(prof.species);
  const [petName, setPetName] = useState(prof.petName);

  const open = () => {
    unlockAudio();
    playSound('achievement');
    emit('confetti', { amount: 90 });
    setStep(1);
  };
  const done = () => {
    updateProfile({ species, petName: petName.trim().slice(0, 24) || personalize.petName });
    finishWelcome();
    playSound('done');
    emit('confetti', { amount: 120 });
  };

  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="welcome__deco" aria-hidden>
        <span>☁️</span><span>✨</span><span>🌸</span><span>⭐</span><span>💗</span><span>🐾</span>
      </div>
      {step === 0 && (
        <button className="envelope" onClick={open} aria-label="Open your gift">
          <span className="envelope__to hand">for {prof.friendName} 💌</span>
          <span className="envelope__body">
            <span className="envelope__flap" />
            <span className="envelope__seal">🐾</span>
          </span>
          <span className="envelope__hint">tap to open</span>
        </button>
      )}
      {step === 1 && (
        <div className="letter card tape">
          <h1>{prof.welcomeTitle}</h1>
          <p className="letter__sub">{prof.welcomeSubtitle}</p>
          <div className="letter__pets" aria-hidden>
            <Pet species="cat" mood="happy" size={92} still />
            <Pet species="dog" mood="excited" size={92} still />
            <Pet species="bunny" mood="blush" size={92} still />
          </div>
          <p className="letter__note hand">{prof.note}</p>
          <p className="letter__sig hand">— {fill(personalize.signature, { you: prof.yourName })}</p>
          <button className="btn btn--primary btn--lg" onClick={() => setStep(2)}>
            Meet your study buddy →
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="letter card tape tape--lavender">
          <h2>Choose your companion</h2>
          <p className="muted">They’ll study with you, nap during breaks, and judge you (lovingly) when you skip.</p>
          <div className="pick-pet" role="radiogroup" aria-label="Companion">
            {(['cat', 'dog', 'bunny'] as Species[]).map((sp) => (
              <button key={sp} role="radio" aria-checked={species === sp} className={`pick-pet__opt ${species === sp ? 'is-on' : ''}`} onClick={() => { setSpecies(sp); playSound('pop'); }}>
                <Pet species={sp} mood={species === sp ? 'excited' : 'happy'} size={104} still={species !== sp} />
                <span>{sp === 'cat' ? 'Kitty' : sp === 'dog' ? 'Puppy' : 'Bunny'}</span>
              </button>
            ))}
          </div>
          <label className="field" style={{ width: '100%', maxWidth: 320 }}>
            <span>Their name</span>
            <input className="input" value={petName} maxLength={24} onChange={(e) => setPetName(e.target.value)} />
          </label>
          <button className="btn btn--primary btn--lg" onClick={done}>
            Let’s study together 🐾
          </button>
        </div>
      )}
    </div>
  );
}
