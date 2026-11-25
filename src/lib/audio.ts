/**
 * 🎧 All sound in Study Paws is synthesized live with the Web Audio API:
 * no audio files, no licences to worry about, nothing to download.
 *
 * - chime(): little UI sounds (timer done, break, achievement, reactions)
 * - setAmbient(): a mixable ambience engine (rain, fireplace, café, …)
 *
 * Audio never autoplays: the context is only created/resumed after a user gesture.
 */

type Ctx = AudioContext;
let ctx: Ctx | null = null;
let ambientBus: GainNode | null = null;
let fxBus: GainNode | null = null;
const bufferCache = new Map<string, AudioBuffer>();

function getCtx(): Ctx | null {
  if (ctx) return ctx;
  const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  try {
    ctx = new C();
  } catch {
    return null;
  }
  ambientBus = ctx.createGain();
  ambientBus.gain.value = 0.9;
  ambientBus.connect(ctx.destination);
  fxBus = ctx.createGain();
  fxBus.connect(ctx.destination);
  return ctx;
}

/** Call from a user gesture (we do it on the first tap/click/keypress). */
export function unlockAudio(): void {
  try {
    // iOS 17+: play even when the ring/silent switch is on.
    const nav = navigator as unknown as { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = 'playback';
  } catch {
    /* ignore */
  }
  const c = getCtx();
  if (!c) return;
  if (c.state !== 'running') void c.resume().catch(() => {});
  // iOS Safari needs a sound started inside the gesture to fully unlock.
  try {
    const b = c.createBuffer(1, 1, 22050);
    const s = c.createBufferSource();
    s.buffer = b;
    s.connect(c.destination);
    s.start(0);
  } catch {
    /* ignore */
  }
}

export const audioSupported = () =>
  typeof window !== 'undefined' && !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);

// ---------- building blocks ----------

function noise(c: Ctx, kind: 'white' | 'pink' | 'brown', seconds = 4): AudioBuffer {
  const key = `${kind}-${seconds}`;
  const cached = bufferCache.get(key);
  if (cached) return cached;
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'white') d[i] = w * 0.5;
    else if (kind === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    } else {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  // crossfade the loop seam
  const fade = Math.min(2000, len / 4);
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    d[len - fade + i] = d[len - fade + i] * (1 - t) + d[i] * t;
  }
  bufferCache.set(key, buf);
  return buf;
}

function filter(c: Ctx, type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function gainNode(c: Ctx, v: number): GainNode {
  const g = c.createGain();
  g.gain.value = v;
  return g;
}

/** Looping noise bed through a chain of filters. */
function bed(c: Ctx, out: AudioNode, kind: 'white' | 'pink' | 'brown', chain: AudioNode[], level: number) {
  const src = c.createBufferSource();
  src.buffer = noise(c, kind);
  src.loop = true;
  const g = gainNode(c, level);
  let node: AudioNode = src;
  for (const n of chain) {
    node.connect(n);
    node = n;
  }
  node.connect(g).connect(out);
  src.start(0, Math.random() * 3);
  return { src, gain: g };
}

function burst(
  c: Ctx,
  out: AudioNode,
  o: { at: number; dur: number; freq: number; q?: number; gain: number; type?: BiquadFilterType; attack?: number },
) {
  const s = c.createBufferSource();
  s.buffer = noise(c, 'white', 1);
  const f = filter(c, o.type ?? 'bandpass', o.freq, o.q ?? 1);
  const g = c.createGain();
  const a = o.attack ?? 0.002;
  g.gain.setValueAtTime(0.0001, o.at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), o.at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, o.at + o.dur);
  s.connect(f).connect(g).connect(out);
  s.start(o.at, Math.random() * 0.8);
  s.stop(o.at + o.dur + 0.05);
}

function tone(
  c: Ctx,
  out: AudioNode,
  o: { at: number; freq: number; dur: number; gain: number; type?: OscillatorType; attack?: number; freqEnd?: number; detune?: number },
) {
  const osc = c.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, o.at);
  if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, o.at + o.dur * 0.9);
  if (o.detune) osc.detune.value = o.detune;
  const g = c.createGain();
  const a = o.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, o.at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), o.at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, o.at + o.dur);
  osc.connect(g).connect(out);
  osc.start(o.at);
  osc.stop(o.at + o.dur + 0.05);
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// ---------- UI chimes ----------

export type ChimeKind = 'done' | 'break' | 'achievement' | 'pop' | 'boop' | 'coin';

export function chime(kind: ChimeKind, volume = 0.6): void {
  const c = getCtx();
  if (!c || !fxBus || volume <= 0) return;
  if (c.state !== 'running') void c.resume().catch(() => {});
  const out = c.createGain();
  out.gain.value = volume;
  out.connect(fxBus);
  const t = c.currentTime + 0.02;
  const bell = (f: number, at: number, g = 0.22, d = 1.4) => {
    tone(c, out, { at, freq: f, dur: d, gain: g, type: 'sine' });
    tone(c, out, { at, freq: f * 2, dur: d * 0.6, gain: g * 0.25, type: 'sine' });
    tone(c, out, { at, freq: f * 3.01, dur: d * 0.3, gain: g * 0.08, type: 'sine' });
  };
  switch (kind) {
    case 'done':
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, t + i * 0.13));
      break;
    case 'break':
      [783.99, 659.25, 523.25].forEach((f, i) => bell(f, t + i * 0.16, 0.18));
      break;
    case 'achievement':
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) => bell(f, t + i * 0.07, 0.14, 0.9));
      bell(2637, t + 0.32, 0.08, 1.2);
      break;
    case 'pop':
      tone(c, out, { at: t, freq: 520, freqEnd: 980, dur: 0.09, gain: 0.18 });
      break;
    case 'boop':
      tone(c, out, { at: t, freq: 880, dur: 0.12, gain: 0.12, type: 'triangle' });
      tone(c, out, { at: t + 0.1, freq: 1174.7, dur: 0.18, gain: 0.12, type: 'triangle' });
      break;
    case 'coin':
      tone(c, out, { at: t, freq: 987.8, dur: 0.08, gain: 0.12, type: 'square' });
      tone(c, out, { at: t + 0.07, freq: 1318.5, dur: 0.3, gain: 0.1, type: 'square' });
      break;
  }
  setTimeout(() => out.disconnect(), 3000);
}

// ---------- ambience generators ----------

type Generator = (c: Ctx, out: GainNode) => () => void;

function every(ms: number, fn: () => void) {
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

const generators: Record<string, Generator> = {
  rain(c, out) {
    const a = bed(c, out, 'pink', [filter(c, 'highpass', 350), filter(c, 'lowpass', 6500)], 0.75);
    const b = bed(c, out, 'white', [filter(c, 'bandpass', 2600, 0.6)], 0.12);
    const stop = every(110, () => {
      const t = c.currentTime + 0.05;
      b.gain.gain.setTargetAtTime(rand(0.05, 0.2), t, 0.08);
      if (Math.random() < 0.45) burst(c, out, { at: t + rand(0, 0.1), dur: rand(0.01, 0.04), freq: rand(1500, 4500), q: 3, gain: rand(0.05, 0.22) });
    });
    return () => {
      stop();
      a.src.stop();
      b.src.stop();
    };
  },
  fireplace(c, out) {
    const a = bed(c, out, 'brown', [filter(c, 'lowpass', 420)], 0.9);
    const stop = every(70, () => {
      const t = c.currentTime + 0.05;
      if (Math.random() < 0.28) burst(c, out, { at: t + rand(0, 0.06), dur: rand(0.004, 0.03), freq: rand(1200, 5000), q: 0.8, type: 'highpass', gain: rand(0.08, 0.45) });
      if (Math.random() < 0.02) burst(c, out, { at: t, dur: 0.08, freq: 300, q: 1, gain: 0.25 });
    });
    return () => {
      stop();
      a.src.stop();
    };
  },
  cafe(c, out) {
    const m = bed(c, out, 'brown', [filter(c, 'bandpass', 520, 0.6)], 0.55);
    const h = bed(c, out, 'pink', [filter(c, 'bandpass', 1400, 0.9)], 0.08);
    const s1 = every(380, () => {
      const t = c.currentTime + 0.05;
      m.gain.gain.setTargetAtTime(rand(0.35, 0.7), t, 0.25);
      h.gain.gain.setTargetAtTime(rand(0.04, 0.12), t, 0.2);
    });
    const s2 = every(1000, () => {
      if (Math.random() < 0.22) {
        const t = c.currentTime + 0.05;
        const f = rand(2400, 3600);
        tone(c, out, { at: t, freq: f, dur: 0.5, gain: 0.03 });
        tone(c, out, { at: t, freq: f * 1.51, dur: 0.35, gain: 0.015 });
        if (Math.random() < 0.5) tone(c, out, { at: t + 0.12, freq: f * 1.1, dur: 0.4, gain: 0.02 });
      }
    });
    return () => {
      s1();
      s2();
      m.src.stop();
      h.src.stop();
    };
  },
  library(c, out) {
    const a = bed(c, out, 'brown', [filter(c, 'lowpass', 260)], 0.5);
    const b = bed(c, out, 'pink', [filter(c, 'lowpass', 1100)], 0.035);
    const stop = every(1000, () => {
      if (Math.random() < 0.11) {
        const t = c.currentTime + 0.05;
        burst(c, out, { at: t, dur: 0.38, freq: rand(1600, 2600), q: 0.5, gain: 0.09, attack: 0.06 });
        burst(c, out, { at: t + 0.22, dur: 0.2, freq: 3000, q: 0.6, gain: 0.05, attack: 0.03 });
      }
    });
    return () => {
      stop();
      a.src.stop();
      b.src.stop();
    };
  },
  forest(c, out) {
    const lp = filter(c, 'lowpass', 900, 0.4);
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const depth = gainNode(c, 450);
    lfo.connect(depth).connect(lp.frequency);
    lfo.start();
    const a = bed(c, out, 'pink', [lp], 0.4);
    const stop = every(900, () => {
      if (Math.random() < 0.4) {
        let t = c.currentTime + 0.05;
        const base = rand(2300, 3800);
        const n = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n; i++) {
          tone(c, out, { at: t, freq: base * rand(0.9, 1.1), freqEnd: base * rand(1.15, 1.45), dur: rand(0.06, 0.12), gain: 0.045, attack: 0.01 });
          t += rand(0.09, 0.18);
        }
      }
    });
    return () => {
      stop();
      lfo.stop();
      a.src.stop();
    };
  },
  night(c, out) {
    const a = bed(c, out, 'brown', [filter(c, 'lowpass', 320)], 0.28);
    const cricket = (f: number, gain: number) => {
      const t = c.currentTime + 0.05;
      const pulses = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < pulses; i++) tone(c, out, { at: t + i * 0.045, freq: f, dur: 0.028, gain, attack: 0.004 });
    };
    const s1 = every(950, () => cricket(4600, 0.022));
    const s2 = every(1330, () => Math.random() < 0.8 && cricket(4250, 0.014));
    return () => {
      s1();
      s2();
      a.src.stop();
    };
  },
  keyboard(c, out) {
    let typingUntil = 0;
    let pauseUntil = 0;
    let next = 0;
    const stop = every(40, () => {
      const now = c.currentTime;
      if (now < pauseUntil) return;
      if (now > typingUntil) {
        typingUntil = now + rand(2, 6);
        pauseUntil = now + rand(0.8, 3);
        return;
      }
      if (now < next) return;
      const t = now + 0.03;
      const space = Math.random() < 0.12;
      burst(c, out, { at: t, dur: space ? 0.03 : rand(0.01, 0.018), freq: space ? 1800 : rand(2800, 4600), q: 1.4, gain: rand(0.12, 0.3) });
      tone(c, out, { at: t, freq: space ? 140 : 190, dur: 0.025, gain: 0.04 });
      next = now + rand(0.07, 0.2);
    });
    return stop;
  },
  white(c, out) {
    const a = bed(c, out, 'white', [filter(c, 'lowpass', 8000)], 0.32);
    return () => a.src.stop();
  },
  lofi(c, out) {
    const bpm = 72;
    const eighth = 60 / bpm / 2;
    const chords = [
      [53, 57, 60, 64],
      [52, 55, 59, 62],
      [50, 53, 57, 60],
      [48, 52, 55, 59],
    ];
    const melodyNotes = [72, 74, 76, 79, 81, 84];
    const padFilter = filter(c, 'lowpass', 1300, 0.5);
    const padOut = gainNode(c, 1);
    padFilter.connect(padOut).connect(out);
    const crackle = bed(c, out, 'pink', [filter(c, 'highpass', 2200)], 0.012);
    let step = 0;
    let nextTime = c.currentTime + 0.1;
    const schedule = () => {
      while (nextTime < c.currentTime + 1.2) {
        const t = nextTime;
        const bar = Math.floor(step / 8) % chords.length;
        const inBar = step % 8;
        const chord = chords[bar];
        if (inBar === 0) {
          for (const n of chord) {
            tone(c, padFilter, { at: t, freq: midi(n), dur: eighth * 8.2, gain: 0.03, attack: 0.08 });
            tone(c, padFilter, { at: t, freq: midi(n), dur: eighth * 8.2, gain: 0.018, attack: 0.1, type: 'triangle', detune: 6 });
          }
        }
        if (inBar === 0 || inBar === 4) {
          tone(c, out, { at: t, freq: midi(chord[0] - 12), dur: 0.7, gain: 0.1 });
          tone(c, out, { at: t, freq: 110, freqEnd: 45, dur: 0.18, gain: 0.32 });
        }
        if (inBar === 2 || inBar === 6) burst(c, out, { at: t, dur: 0.14, freq: 1900, q: 0.7, gain: 0.07 });
        const swing = inBar % 2 === 1 ? eighth * 0.16 : 0;
        burst(c, out, { at: t + swing, dur: 0.035, freq: 7500, type: 'highpass', gain: inBar % 2 ? 0.018 : 0.028 });
        if (Math.random() < 0.22) tone(c, out, { at: t + swing, freq: midi(melodyNotes[Math.floor(Math.random() * melodyNotes.length)]), dur: 0.6, gain: 0.03, type: 'triangle', attack: 0.02 });
        if (Math.random() < 0.15) burst(c, out, { at: t + rand(0, eighth), dur: 0.006, freq: 3000, type: 'highpass', gain: 0.05 });
        nextTime += eighth;
        step++;
      }
    };
    schedule();
    const stop = every(200, schedule);
    return () => {
      stop();
      crackle.src.stop();
      setTimeout(() => padOut.disconnect(), 2000);
    };
  },
};

export const ambientSounds = [
  { id: 'rain', name: 'Rain', emoji: '🌧️' },
  { id: 'fireplace', name: 'Fireplace', emoji: '🔥' },
  { id: 'cafe', name: 'Coffee shop', emoji: '☕' },
  { id: 'library', name: 'Library', emoji: '📚' },
  { id: 'forest', name: 'Forest', emoji: '🌲' },
  { id: 'night', name: 'Night', emoji: '🦗' },
  { id: 'keyboard', name: 'Typing', emoji: '⌨️' },
  { id: 'lofi', name: 'Soft lo-fi', emoji: '🎶' },
  { id: 'white', name: 'White noise', emoji: '🌫️' },
] as const;

interface Voice {
  gain: GainNode;
  stop: () => void;
}
const voices = new Map<string, Voice>();
const voiceListeners = new Set<() => void>();

export function onAmbientChange(fn: () => void): () => void {
  voiceListeners.add(fn);
  return () => {
    voiceListeners.delete(fn);
  };
}
export const playingAmbient = () => new Set(voices.keys());

export function playAmbient(id: string, volume: number): boolean {
  const c = getCtx();
  if (!c || !ambientBus) return false;
  if (c.state !== 'running') void c.resume().catch(() => {});
  const existing = voices.get(id);
  if (existing) {
    existing.gain.gain.setTargetAtTime(volume, c.currentTime, 0.1);
    return true;
  }
  const gen = generators[id];
  if (!gen) return false;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.setTargetAtTime(volume, c.currentTime, 0.4);
  g.connect(ambientBus);
  const stop = gen(c, g);
  voices.set(id, { gain: g, stop });
  voiceListeners.forEach((l) => l());
  return true;
}

export function setAmbientVolume(id: string, volume: number) {
  const v = voices.get(id);
  if (v && ctx) v.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.08);
}

export function stopAmbient(id: string) {
  const v = voices.get(id);
  if (!v || !ctx) return;
  voices.delete(id);
  v.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
  setTimeout(() => {
    try {
      v.stop();
    } catch {
      /* already stopped */
    }
    v.gain.disconnect();
  }, 1200);
  voiceListeners.forEach((l) => l());
}

export function stopAllAmbient() {
  [...voices.keys()].forEach(stopAmbient);
}
