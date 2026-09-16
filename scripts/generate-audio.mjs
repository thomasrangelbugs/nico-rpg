/**
 * Gera trilhas e SFX em MP3 (sons suaves).
 * Contorna bug conhecido do lamejs (MPEGMode global).
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { createHash } from 'crypto';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'public', 'assets', 'audio');
mkdirSync(OUT, { recursive: true });

// Patch lamejs globals
const MPEGMode = require('lamejs/src/js/MPEGMode.js');
const Lame = require('lamejs/src/js/Lame.js');
const BitStream = require('lamejs/src/js/BitStream.js');
globalThis.MPEGMode = MPEGMode;
globalThis.Lame = Lame;
globalThis.BitStream = BitStream;
const lamejs = require('lamejs');

const SR = 22050;

function encodeMp3(samples, bitrate = 96) {
  const mp3encoder = new lamejs.Mp3Encoder(1, SR, bitrate);
  const block = 1152;
  const parts = [];
  const int16 = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    int16[i] = (s * 32767) | 0;
  }
  for (let i = 0; i < int16.length; i += block) {
    const chunk = int16.subarray(i, Math.min(i + block, int16.length));
    const buf = mp3encoder.encodeBuffer(chunk);
    if (buf.length) parts.push(Buffer.from(buf));
  }
  const end = mp3encoder.flush();
  if (end.length) parts.push(Buffer.from(end));
  return Buffer.concat(parts);
}

function save(name, samples, bitrate = 96) {
  const buf = encodeMp3(samples, bitrate);
  writeFileSync(join(OUT, name), buf);
  console.log('wrote', name, (buf.length / 1024).toFixed(1) + 'kb');
}

function env(t, a, d, sus, r, dur) {
  if (t < a) return t / Math.max(0.0001, a);
  if (t < a + d) return 1 - (1 - sus) * ((t - a) / Math.max(0.0001, d));
  if (t < dur - r) return sus;
  if (t < dur) return sus * (1 - (t - (dur - r)) / Math.max(0.0001, r));
  return 0;
}

function tone(freq, dur, vol = 0.2, type = 'soft') {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = env(t, 0.02, 0.08, 0.7, 0.12, dur);
    let w = Math.sin(2 * Math.PI * freq * t);
    if (type === 'soft') {
      w =
        Math.sin(2 * Math.PI * freq * t) * 0.7 +
        Math.sin(2 * Math.PI * freq * 2 * t) * 0.2 +
        Math.sin(2 * Math.PI * freq * 3 * t) * 0.1;
    }
    if (type === 'pad') {
      w =
        Math.sin(2 * Math.PI * freq * t) * 0.5 +
        Math.sin(2 * Math.PI * (freq * 1.005) * t) * 0.3 +
        Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.2;
    }
    out[i] = w * e * vol;
  }
  return out;
}

function mix(...tracks) {
  let len = 0;
  for (const t of tracks) len = Math.max(len, t.length);
  const out = new Float32Array(len);
  for (const t of tracks) for (let i = 0; i < t.length; i++) out[i] += t[i];
  let peak = 0.001;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  const g = 0.85 / peak;
  for (let i = 0; i < out.length; i++) out[i] *= g;
  return out;
}

function place(base, clip, atSec) {
  const start = Math.floor(atSec * SR);
  const out = new Float32Array(Math.max(base.length, start + clip.length));
  out.set(base, 0);
  for (let i = 0; i < clip.length; i++) out[start + i] += clip[i];
  return out;
}

function loopMusic(pattern, bpm, bars) {
  const beat = 60 / bpm;
  let acc = new Float32Array(0);
  let t = 0;
  for (let b = 0; b < bars; b++) {
    for (const note of pattern) {
      const [freq, beats, vol] = note;
      const dur = beats * beat;
      if (freq > 0) acc = place(acc, tone(freq, dur * 0.92, vol ?? 0.18, 'soft'), t);
      t += dur;
    }
  }
  const padLen = Math.floor(t * SR);
  const pad = new Float32Array(padLen);
  for (let i = 0; i < padLen; i++) {
    const tt = i / SR;
    pad[i] = Math.sin(2 * Math.PI * 110 * tt) * 0.035 + Math.sin(2 * Math.PI * 164.8 * tt) * 0.025;
  }
  return mix(acc, pad);
}

const C4 = 261.63,
  D4 = 293.66,
  E4 = 329.63,
  G4 = 392.0,
  A4 = 440.0,
  B4 = 493.88,
  C5 = 523.25,
  E5 = 659.25;

save(
  'music_menu.mp3',
  loopMusic(
    [
      [E4, 1, 0.16],
      [G4, 1, 0.16],
      [A4, 1, 0.18],
      [G4, 1, 0.16],
      [E4, 1, 0.15],
      [D4, 1, 0.15],
      [C4, 2, 0.18],
      [D4, 1, 0.15],
      [E4, 1, 0.16],
      [G4, 2, 0.18],
      [0, 1],
      [A4, 1, 0.14],
    ],
    78,
    3
  )
);

save(
  'music_battle.mp3',
  loopMusic(
    [
      [E4, 0.5, 0.17],
      [E4, 0.5, 0.12],
      [G4, 0.5, 0.17],
      [A4, 0.5, 0.18],
      [B4, 1, 0.2],
      [A4, 0.5, 0.16],
      [G4, 0.5, 0.16],
      [E4, 1, 0.18],
      [D4, 0.5, 0.14],
      [E4, 0.5, 0.16],
      [G4, 1, 0.18],
      [A4, 1, 0.2],
      [C5, 1, 0.18],
      [B4, 1, 0.17],
    ],
    112,
    3
  )
);

save(
  'music_levelup.mp3',
  mix(
    place(new Float32Array(0), tone(C5, 0.22, 0.22), 0),
    place(new Float32Array(0), tone(E5, 0.22, 0.22), 0.16),
    place(new Float32Array(0), tone(G4, 0.3, 0.2), 0.32),
    place(new Float32Array(0), tone(C5, 0.5, 0.24), 0.5)
  )
);

save(
  'music_dead.mp3',
  mix(
    place(new Float32Array(0), tone(A4, 0.45, 0.18, 'pad'), 0),
    place(new Float32Array(0), tone(E4, 0.55, 0.16, 'pad'), 0.35),
    place(new Float32Array(0), tone(C4, 0.9, 0.2, 'pad'), 0.8)
  )
);

function sfxWhoosh(dur = 0.1, f0 = 600, f1 = 180) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = f0 + (f1 - f0) * (t / dur);
    out[i] = Math.sin(2 * Math.PI * f * t) * env(t, 0.005, 0.03, 0.5, 0.05, dur) * 0.35;
  }
  return out;
}

function sfxNoise(dur, vol = 0.2) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (Math.random() * 2 - 1) * env(t, 0.001, 0.02, 0.3, 0.04, dur) * vol;
  }
  return out;
}

save('sfx_hit.mp3', mix(sfxWhoosh(0.09, 420, 140), sfxNoise(0.05, 0.1)), 64);
save('sfx_hurt.mp3', mix(tone(120, 0.16, 0.28, 'pad'), sfxNoise(0.1, 0.18)), 64);
save('sfx_pickup.mp3', mix(tone(880, 0.07, 0.2), tone(1320, 0.09, 0.14)), 64);
save('sfx_level.mp3', mix(tone(523, 0.12, 0.2), tone(659, 0.15, 0.2), tone(784, 0.3, 0.22)), 64);
save('sfx_select.mp3', tone(660, 0.07, 0.22), 64);
save('sfx_start.mp3', mix(tone(330, 0.18, 0.2), tone(494, 0.3, 0.22)), 64);

// sanity: files look like mp3 (ID3 or frame sync)
for (const f of ['music_menu.mp3', 'sfx_hit.mp3']) {
  const p = join(OUT, f);
  if (!existsSync(p)) throw new Error('missing ' + f);
  const head = readFileSync(p).subarray(0, 3);
  const ok = head[0] === 0xff || head.toString() === 'ID3';
  console.log('check', f, ok ? 'mp3-ok' : 'WARN', 'sha', createHash('md5').update(readFileSync(p)).digest('hex').slice(0, 8));
}

console.log('MP3 audio ready');
