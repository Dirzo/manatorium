// Talk voices (Cam 2026-11-04): every boss babbles in its own silly gibberish voice while its speech bubble types out,
// one little sound per syllable, Animal Crossing style. The pitch of a syllable comes from its letter, so the same word
// always "sounds" the same. Heroes get a softer voice set by their temper. Voice SFX only: music stays off.
// VOX.say(voice, ch, i) plays the syllable for character ch (the i-th letter of the line) on the game's SFX bus.
// VOX.render(...) does the same into any AudioContext, which tools/voice-previews.cjs uses to write preview files.

// a voice: f base pitch (Hz), wave, steps (semitones the letters pick from), every (a syllable every n letters),
// dur (seconds), slide (pitch at the end of the syllable, x f), vib [rate Hz, cents], trem [rate Hz, depth 0..1],
// filt [type, Hz, Q], sub (octave-down sine level), breath [level, Hz, Q] of noise, jit (random pitch wobble),
// vol, and two hooks: extra(c) for anything else on a syllable, punct(c) for . ! ? and the end of a line.
const VOICES = {
  // the Goblin King: a nasal, squeaky, very pleased with himself jabber, and a big wet snort at every full stop
  grubnose: { f: 330, wave: 'square', steps: [0, 3, 7, 10, 12, 5], every: 2, dur: 0.07, slide: 1.12, filt: ['bandpass', 1500, 4], jit: 0.08, vol: 0.45,
    punct: c => { c.noise(0.16, 0.22, 260, 0, 1.2); c.tone(120, 0.14, 'sawtooth', 0.06, 0.6); } },
  // Mother Gloop: every syllable is a bubble going "bloop" upward, and big blubs on the vowels
  gloop: { f: 190, wave: 'sine', steps: [0, 4, 7, 2, 9], every: 2, dur: 0.09, slide: 2.4, filt: ['lowpass', 1400, 1], jit: 0.12, vol: 0.12,
    extra: c => { if (c.vowel) c.tone(c.f * 0.5, 0.12, 'sine', 0.12, 3.2, 0.03); },
    punct: c => { for (let i = 0; i < 3; i++) c.tone(220 + i * 140, 0.07, 'sine', 0.12, 2.6, i * 0.06); } },
  // Vexmora the Ashen Wyrm: a slow, deep, rumbling drone that hisses its esses
  wyrm: { f: 72, wave: 'sawtooth', steps: [0, 1, 3, -2, 5], every: 3, dur: 0.16, slide: 0.92, filt: ['lowpass', 520, 2], sub: 0.6, breath: [0.05, 300, 0.7], jit: 0.03, vol: 0.13,
    extra: c => { if (/[sz]/.test(c.ch)) c.noise(0.22, 0.12, 5200, 0, 1.5); },
    punct: c => { c.noise(0.5, 0.12, 700, 0, 0.5); c.tone(55, 0.45, 'sawtooth', 0.12, 0.7); } },
  // Ringmaster Malgoth: a showman swooping up and down like he's announcing the next act, ta-da at every "!"
  ringmaster: { f: 200, wave: 'triangle', steps: [0, 7, 12, 4, 9, 16], every: 2, dur: 0.1, slide: c => c.i % 2 ? 0.7 : 1.45, vib: [6, 40], filt: ['lowpass', 2600, 1], jit: 0.04, vol: 0.15,
    punct: c => { if (c.ch === '!') { c.tone(523, 0.1, 'square', 0.06); c.tone(784, 0.22, 'square', 0.06, 1, 0.1); } } },
  // the Spore Baron: a posh, quavery old aristocrat, with a little puff of spores now and then
  sporebaron: { f: 250, wave: 'triangle', steps: [0, 2, 5, 7, 4], every: 3, dur: 0.12, slide: 0.94, vib: [8, 90], filt: ['bandpass', 1100, 2], jit: 0.03, vol: 0.6,
    extra: c => { if (c.i % 7 === 3) c.noise(0.12, 0.05, 7000, 0.04, 1); },
    punct: c => { c.tone(c.f * 1.5, 0.2, 'triangle', 0.08, 0.8); c.noise(0.25, 0.06, 6000, 0.08, 0.8); } },
  // the Yeti Matriarch: a big hoarse growl that shivers, "brrrr", with a huff of frosty breath
  matriarch: { f: 105, wave: 'sawtooth', steps: [0, 3, 5, 7, -2], every: 3, dur: 0.15, slide: 0.88, trem: [24, 0.7], filt: ['lowpass', 900, 3], sub: 0.4, breath: [0.08, 1200, 0.6], jit: 0.05, vol: 0.18,
    punct: c => c.noise(0.35, 0.16, 900, 0, 0.6) },
  // Big Mama Trashpaw: a raccoon chittering a mile a minute, two tiny chirps per syllable
  trashpaw: { f: 720, wave: 'square', steps: [0, 2, 5, 7, 9, 12], every: 2, dur: 0.035, slide: 1.3, filt: ['bandpass', 2400, 3], jit: 0.15, vol: 0.3,
    extra: c => c.tone(c.f * 1.2, 0.03, 'square', 0.05, 1.4, 0.045),
    punct: c => { for (let i = 0; i < 4; i++) c.tone(900 + i * 120, 0.03, 'square', 0.05, 1.3, i * 0.04); } },
  // the Brass Colossus: a beeping robot on two notes, with a ring-modulated buzz and a "boop-beep" at the end of a line
  colossus: { f: 140, wave: 'square', steps: [0, 0, 7, 0, 12], every: 2, dur: 0.06, slide: 1, trem: [60, 1], filt: ['lowpass', 1800, 6], jit: 0, vol: 0.2,
    punct: c => { c.tone(880, 0.07, 'square', 0.05); c.tone(440, 0.12, 'square', 0.05, 1, 0.08); } },
  // Captain Pinchbeard: a gargly pirate "arrr" with a crab click between words
  pinchbeard: { f: 150, wave: 'sawtooth', steps: [0, 5, 3, 7, -5], every: 3, dur: 0.12, slide: 0.8, trem: [32, 0.8], filt: ['lowpass', 1300, 2], sub: 0.3, jit: 0.06, vol: 0.22,
    extra: c => { if (c.next === ' ') { c.noise(0.025, 0.2, 4200, 0.1, 4); c.noise(0.025, 0.2, 3600, 0.15, 4); } },
    punct: c => { c.tone(160, 0.35, 'sawtooth', 0.1, 0.6); } },
  // the Eternal Goose: HONK. Every syllable is a honk.
  goosegod: { f: 300, wave: 'sawtooth', steps: [0, 2, -3, 5, 0], every: 3, dur: 0.11, slide: 0.82, filt: ['bandpass', 950, 5], sub: 0.15, jit: 0.06, vol: 0.4,
    punct: c => { c.tone(330, 0.28, 'sawtooth', 0.12, 0.75); c.noise(0.2, 0.08, 1500, 0, 2); } },
  // the Shard-Crowned Goose: the same honk, crystal-clinking from all twelve shards it wears
  shardgoose: { f: 280, wave: 'sawtooth', steps: [0, 3, -2, 5, 7], every: 3, dur: 0.12, slide: 0.8, filt: ['bandpass', 900, 5], sub: 0.2, jit: 0.05, vol: 0.29,
    extra: c => c.tone(2200 + (c.code % 5) * 330, 0.18, 'sine', 0.035, 1, 0.02),
    punct: c => { c.tone(300, 0.3, 'sawtooth', 0.12, 0.7); [2637, 3136, 3951].forEach((f, i) => c.tone(f, 0.25, 'sine', 0.03, 1, 0.05 + i * 0.06)); } },
};
// heroes: a gentler voice, tinted by temper (the hero's own pitch is set by their name, see voiceFor)
const TEMPER_VOX = {
  heroic: { wave: 'triangle', slide: 1.05 }, honorable: { wave: 'triangle', slide: 0.97, f: -2 },
  cheerful: { wave: 'triangle', slide: 1.35, f: 3, every: 2 }, optimistic: { wave: 'sine', slide: 1.3, f: 4, every: 2 },
  wholesome: { wave: 'sine', slide: 1.1, f: 2, vib: [5, 20] }, loyal: { wave: 'triangle', slide: 1, f: -1 },
  zealous: { wave: 'square', slide: 1.08, filt: ['lowpass', 1600, 2], vol: 0.07 }, wise: { wave: 'sine', slide: 0.92, f: -5, every: 4, dur: 0.11, vib: [4, 25] },
  angry: { wave: 'square', slide: 0.85, f: -3, filt: ['lowpass', 1100, 3], vol: 0.08 }, deranged: { wave: 'square', steps: [0, 11, -6, 15, 3, 20], jit: 0.2, vol: 0.09, filt: ['lowpass', 2200, 1] },
  greedy: { wave: 'square', filt: ['bandpass', 1400, 4], slide: 1.1, vol: 0.08 }, cowardly: { wave: 'sine', f: 6, trem: [14, 0.6], slide: 1.2, dur: 0.05 },
  vain: { wave: 'triangle', vib: [7, 60], slide: 1.15, f: 2 }, cruel: { wave: 'sawtooth', f: -4, slide: 0.9, filt: ['lowpass', 1000, 2], vol: 0.08 },
  paranoid: { wave: 'triangle', every: 1, dur: 0.035, jit: 0.12, f: 3 }, lazy: { wave: 'sine', slide: 0.7, every: 4, dur: 0.16, f: -3 },
};
const HERO_VOX = { wave: 'triangle', steps: [0, 2, 4, 7, 9], every: 3, dur: 0.07, slide: 1.05, filt: ['lowpass', 2400, 1], jit: 0.05, vol: 0.13 };
function voxHash(s) { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
// the voice for a speaker: a boss id, or { hero, temper, ghost } for a hero, or { visitor: key }
function voiceFor(who) {
  if (who && who.wave) return who; // already a voice
  if (typeof who === 'string') return VOICES[who] || VOICES.grubnose;
  if (who.visitor) { const id = who.visitor.replace(/^e:/, ''); if (VOICES[id]) return VOICES[id];
    return Object.assign({}, HERO_VOX, { f: 240 + voxHash(who.visitor) % 160, wave: 'square', filt: ['bandpass', 1300, 3], vol: 0.07 }); }
  const T = TEMPER_VOX[who.temper] || TEMPER_VOX.heroic, base = 190 + voxHash(who.hero) % 170;
  const v = Object.assign({}, HERO_VOX, T, { f: base * Math.pow(2, (T.f || 0) / 12) });
  // a fallen legend's ghost: the same voice, hollow and wavering, sliding down
  if (who.ghost) Object.assign(v, { wave: 'sine', vib: [5, 120], slide: 0.75, dur: 0.16, every: 3, filt: ['lowpass', 900, 1], vol: 0.12 });
  return v;
}
const VOX = {
  bus: null,
  // the game's SFX bus: voices go through their own gain so they sit under the rest of the fx
  ready() { if (!SFX.on || !SFX.ctx || SFX.ctx.state !== 'running') return false; if (!this.bus) { this.bus = SFX.ctx.createGain(); this.bus.gain.value = 0.9; this.bus.connect(SFX.master); } return true; },
  // ch: the letter just typed, i: its index in the line, next: the letter after it
  say(voice, ch, i, next) { if (!this.ready()) return; this.render(SFX.ctx, this.bus, SFX.ctx.currentTime, voice, ch, i, next, SFX.noise); },
  // true when the i-th letter of a line gets a syllable in this voice
  due(voice, ch, i) { const v = voiceFor(voice); return /[.!?]/.test(ch) ? !!v.punct : /[a-z0-9]/i.test(ch) && i % (v.every || 3) === 0; },
  render(ac, dest, t0, voice, ch, i, next = '', noiseBuf = null) {
    const v = voiceFor(voice), lc = (ch || '').toLowerCase(), code = lc.charCodeAt(0) || 97;
    const tone = (f, dur, type = 'sine', vol = 0.1, slide = 1, delay = 0, mods = null) => {
      const t = t0 + delay, o = ac.createOscillator(), g = ac.createGain(); let out = o;
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(25, f * slide), t + dur);
      if (mods && mods.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = mods.vib[0]; lg.gain.value = mods.vib[1]; l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(t + dur + 0.03); }
      if (mods && mods.filt) { const fl = ac.createBiquadFilter(); fl.type = mods.filt[0]; fl.frequency.value = mods.filt[1]; fl.Q.value = mods.filt[2]; out.connect(fl); out = fl; }
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.012, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      if (mods && mods.trem) { const l = ac.createOscillator(), lg = ac.createGain(), tg = ac.createGain(); l.frequency.value = mods.trem[0]; lg.gain.value = mods.trem[1] / 2; tg.gain.value = 1 - mods.trem[1] / 2; l.connect(lg); lg.connect(tg.gain); out.connect(tg); out = tg; l.start(t); l.stop(t + dur + 0.03); }
      out.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.03);
    };
    const noise = (dur, vol, freq, delay = 0, q = 1) => {
      if (!noiseBuf) { const len = ac.sampleRate * 0.5; noiseBuf = ac.createBuffer(1, len, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let k = 0; k < len; k++) d[k] = Math.random() * 2 - 1; }
      const t = t0 + delay, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; fl.type = 'bandpass'; fl.frequency.value = freq; fl.Q.value = q;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.03);
    };
    const steps = v.steps || [0], st = steps[(code * 7 + (code >> 2)) % steps.length];
    const f = v.f * Math.pow(2, st / 12) * (1 + (Math.random() * 2 - 1) * (v.jit || 0));
    const vowel = /[aeiouy]/.test(lc), c = { ch: lc, i, code, f, vowel, next, tone, noise };
    if (/[.!?]/.test(lc)) { if (v.punct) v.punct(c); return; }
    const dur = v.dur * (vowel ? 1.25 : 1), slide = typeof v.slide === 'function' ? v.slide(c) : v.slide || 1;
    // vowels open the formant a little, so the babble has some shape to it
    const filt = v.filt ? [v.filt[0], v.filt[1] * (vowel ? 1.15 : 0.9), v.filt[2]] : null;
    tone(f, dur, v.wave, v.vol, slide, 0, { vib: v.vib, trem: v.trem, filt });
    if (v.sub) tone(f / 2, dur * 1.1, 'sine', v.vol * v.sub, slide);
    if (v.breath) noise(dur, v.breath[0], v.breath[1], 0, v.breath[2]);
    if (v.extra) v.extra(c);
  },
};
