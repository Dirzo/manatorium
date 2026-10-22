// ----- Castle defense theme (Cam 2026-10-22) -----
// A procedural tune played on the SFX audio context: no audio files, so the single-file build stays small.
// Cam: a soft flute base, with trumpets to begin and end sieges. One 16-bar tune (A: the march, B: a bouncy answer)
// played by a breathy flute over plucked bass, arranged per mood and switched at bar lines:
//   calm  title, keep and drafts: flute, pizzicato oom-pah, woodblock
//   siege battle: flute with a harp ripple, soft frame drum and shaker
//   boss  boss sieges and the goose finale: the tune in harmonic minor over a low drone and toms
//   talk  boss talk scenes: calm, ducked under the dialogue blips
// fanfare() is the brass: a heraldic call when a siege begins, a flourish on victory, a droopy one on defeat.
// Cam 2026-10-22: switched off, it wasn't the sound he wanted; a recorded track will replace it. true brings it back.
const MUSIC_ON = false;
const MUS_MAJOR = [0, 2, 4, 5, 7, 9, 11], MUS_MINOR = [0, 2, 3, 5, 7, 8, 11];
// melody: per bar, [step, scale degree from C4, length in 16ths]
const MUS_MEL = [
  [[0, 4, 2], [2, 4, 2], [4, 7, 4], [8, 6, 2], [10, 7, 2], [12, 9, 4]],
  [[0, 8, 2], [2, 7, 2], [4, 6, 4], [8, 4, 4], [12, 6, 2], [14, 8, 2]],
  [[0, 7, 3], [3, 5, 1], [4, 7, 2], [6, 9, 2], [8, 11, 4], [12, 9, 4]],
  [[0, 10, 2], [2, 9, 2], [4, 8, 2], [6, 7, 2], [8, 5, 6], [14, 4, 2]],
  [[0, 4, 2], [2, 4, 2], [4, 7, 4], [8, 6, 2], [10, 7, 2], [12, 9, 4]],
  [[0, 8, 2], [2, 9, 2], [4, 11, 4], [8, 8, 4], [12, 6, 2], [14, 4, 2]],
  [[0, 5, 2], [2, 7, 2], [4, 10, 4], [8, 8, 2], [10, 9, 2], [12, 8, 2], [14, 6, 2]],
  [[0, 7, 6], [8, 4, 1], [10, 4, 1], [12, 7, 3]],
  [[0, 10, 1], [2, 10, 1], [3, 9, 1], [4, 10, 2], [6, 12, 2], [8, 10, 2], [10, 9, 2], [12, 7, 4]],
  [[0, 9, 1], [2, 9, 1], [3, 8, 1], [4, 9, 2], [6, 11, 2], [8, 9, 2], [10, 7, 2], [12, 4, 4]],
  [[0, 8, 2], [2, 10, 2], [4, 12, 2], [6, 10, 2], [8, 8, 2], [10, 5, 2], [12, 8, 4]],
  [[0, 6, 2], [2, 8, 2], [4, 11, 4], [8, 10, 1], [9, 11, 1], [10, 12, 2], [12, 11, 4]],
  [[0, 10, 1], [2, 10, 1], [3, 9, 1], [4, 10, 2], [6, 12, 2], [8, 10, 2], [10, 9, 2], [12, 7, 4]],
  [[0, 9, 1], [2, 9, 1], [3, 8, 1], [4, 9, 2], [6, 11, 2], [8, 14, 4], [12, 11, 4]],
  [[0, 12, 2], [2, 10, 2], [4, 8, 2], [6, 12, 2], [8, 11, 2], [10, 8, 2], [12, 6, 2], [14, 4, 2]],
  [[0, 7, 3], [4, 4, 1], [6, 7, 1], [8, 11, 1], [10, 14, 5]],
];
// chord roots (scale degrees) per half bar
const MUS_CHORDS = [[0, 0], [4, 4], [5, 5], [3, 3], [0, 0], [4, 4], [3, 4], [0, 0], [3, 3], [0, 0], [1, 1], [4, 4], [3, 3], [0, 0], [1, 4], [0, 0]];
const MUS_BPM = { calm: 100, talk: 96, siege: 116, boss: 120 };
// trumpet calls: [eighth, semitones from C4, length in eighths]
const MUS_FANFARE = {
  begin: [[0, 7, 1], [1, 7, 1], [2, 7, 1], [3, 12, 3], [6, 7, 1], [7, 12, 1], [8, 16, 1], [9, 19, 6], [9, 16, 6], [9, 12, 6]],
  boss: [[0, 0, 1], [1, 0, 1], [2, 0, 1], [3, 3, 3], [6, 2, 1], [7, -1, 1], [8, 0, 6], [8, -5, 6], [8, -12, 6]],
  win: [[0, 7, 1], [1, 12, 1], [2, 16, 1], [3, 19, 3], [6, 16, 1], [7, 19, 1], [8, 24, 6], [8, 19, 6], [8, 16, 6]],
  lose: [[0, 7, 2], [2, 6, 2], [4, 5, 2], [6, 4, 7]],
};

const MUSIC = {
  ctx: null, out: null, live: false, vol: 0.5, mood: null, bar: 0, step: 0, nextT: 0, timer: 0, hold: 0,
  // called once the splash and intro are done; the scheduler waits for the first tap to unlock audio
  start() { if (!MUSIC_ON) return; this.live = true; if (!this.timer) this.timer = setInterval(() => this.tick(), 30); },
  setVol(v) { this.vol = v; if (this.out) { this.out.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.08); this.fan.gain.setTargetAtTime(v * 0.9, this.ctx.currentTime, 0.08); } },
  level() { return this.vol * 0.6 * (this.mood === 'talk' ? 0.45 : 1); },
  init() {
    const c = this.ctx = SFX.ctx; this.out = c.createGain(); this.out.gain.value = 0; this.out.connect(c.destination);
    // the lead sings through a soft lowpass and a little echo
    this.lead = c.createBiquadFilter(); this.lead.type = 'lowpass'; this.lead.frequency.value = 3200; this.lead.connect(this.out);
    this.echo = c.createDelay(1); this.fb = c.createGain(); this.fb.gain.value = 0.28; const wet = c.createGain(); wet.gain.value = 0.2;
    this.lead.connect(this.echo); this.echo.connect(this.fb); this.fb.connect(this.echo); this.echo.connect(wet); wet.connect(this.out);
    this.low = c.createBiquadFilter(); this.low.type = 'lowpass'; this.low.frequency.value = 900; this.low.connect(this.out);
    // the brass has its own bus so the flute can duck under it
    this.fan = c.createGain(); this.fan.gain.value = this.vol * 0.9; this.fan.connect(c.destination); this.fan.connect(this.echo);
  },
  // trumpets: returns false when music is off so the caller can fall back to its own sound effect
  fanfare(kind) {
    if (!this.live || this.vol <= 0 || !SFX.ctx || SFX.ctx.state !== 'running') return false;
    if (!this.ctx) this.init();
    const c = this.ctx, t = c.currentTime + 0.05, e = kind === 'lose' ? 0.24 : 0.15, notes = MUS_FANFARE[kind];
    let end = 0; for (const [at, semi, len] of notes) { this.brass(261.63 * Math.pow(2, semi / 12), t + at * e, len * e * 0.92, kind === 'lose' && at === 6); end = Math.max(end, (at + len) * e); }
    // the flute steps aside and comes back from the top of the tune
    this.hold = t + end + 0.35; this.out.gain.cancelScheduledValues(t); this.out.gain.setTargetAtTime(0.0001, c.currentTime, 0.05);
    this.nextT = this.hold; this.step = 0; this.bar = 0;
    return true;
  },
  brass(f, t, dur, droop) {
    const c = this.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(f * 1.5, t); lp.frequency.exponentialRampToValueAtTime(f * 7, t + 0.05); lp.frequency.exponentialRampToValueAtTime(f * 4, t + 0.2);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.03); g.gain.setTargetAtTime(0.065, t + 0.06, 0.1); g.gain.setValueAtTime(0.065, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    lp.connect(g); g.connect(this.fan);
    for (const det of [-5, 5]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.detune.value = det;
      o.frequency.setValueAtTime(f * 0.96, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.04); // the lip scoop
      if (droop) o.frequency.exponentialRampToValueAtTime(f * 0.94, t + dur); // wah-wah-waaah
      if (dur > 0.4) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = droop ? 6.5 : 5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * (droop ? 0.03 : 0.012), t + 0.3); l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
      o.connect(lp); o.start(t); o.stop(t + dur + 0.1);
    }
  },
  pickMood() {
    if (typeof TALKUI !== 'undefined' && TALKUI.on) return 'talk';
    if (G.phase === 'finale') return 'boss';
    if (G.phase === 'siege') return G.run && (isBossSiege(G.run.siege) || G.run.siege >= FINAL_SIEGE) ? 'boss' : 'siege';
    if (typeof TOWER !== 'undefined' && TOWER.on) return 'siege';
    return 'calm';
  },
  tick() {
    if (!this.live || !SFX.ctx || SFX.ctx.state !== 'running') return;
    if (!this.ctx) this.init();
    const c = this.ctx, now = c.currentTime;
    if (this.vol <= 0 || document.hidden) { this.nextT = 0; return; }
    // a throttled background tab or a fresh start: pick up from the next bar line instead of rushing to catch up
    if (this.nextT < now - 0.1 && now > this.hold) { this.nextT = now + 0.06; this.step = 0; this.mood = null; }
    while (this.nextT < now + 0.16) {
      if (this.step === 0) {
        const m = this.pickMood();
        // a new mood restarts the tune from the top so each scene opens on the march
        if (m !== this.mood) { if (!(this.mood === 'calm' && m === 'talk' || this.mood === 'talk' && m === 'calm')) this.bar = 0; this.mood = m; }
        this.out.gain.setTargetAtTime(this.level(), this.nextT, 0.15);
        this.spb = 60 / MUS_BPM[m] / 4; this.echo.delayTime.setValueAtTime(this.spb * 3, this.nextT);
        this.lead.frequency.setValueAtTime(m === 'boss' ? 1800 : 2400, this.nextT);
      }
      this.play(this.bar, this.step, this.nextT, this.mood);
      this.nextT += this.spb * (this.step % 2 ? 0.95 : 1.05); // a touch of swing keeps it bouncy
      if (++this.step === 16) { this.step = 0; this.bar = (this.bar + 1) % 16; }
    }
  },
  hz(deg, oct, minor) { const sc = minor ? MUS_MINOR : MUS_MAJOR, o = Math.floor(deg / 7); return 261.63 * Math.pow(2, oct + o + sc[deg - o * 7] / 12); },
  note(f, t, dur, type, vol, dest, vib) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.08); l.stop(t + dur + 0.05); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.setValueAtTime(vol, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.out); o.start(t); o.stop(t + dur + 0.02);
  },
  // breathy flute: a sine with a whisper of triangle, a soft attack, delayed vibrato and a puff of air
  flute(f, t, dur, vol) {
    const c = this.ctx, g = c.createGain(); g.connect(this.lead);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.045); g.gain.setTargetAtTime(vol * 0.8, t + 0.06, 0.15); g.gain.setValueAtTime(vol * 0.8, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(dur > 0.3 ? f * 0.01 : 0, t + 0.25); l.connect(lg); l.start(t); l.stop(t + dur + 0.1);
    for (const [type, mul, v] of [['sine', 1, 1], ['triangle', 2, 0.12]]) { const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = f * mul; lg.connect(o.frequency); og.gain.value = v; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.1); }
    const s = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain(); s.buffer = SFX.noise; bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3;
    ng.gain.setValueAtTime(vol * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); s.connect(bp); bp.connect(ng); ng.connect(this.lead); s.start(t, Math.random() * 0.3); s.stop(t + 0.1);
  },
  pluck(f, t, dur, vol, dest) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(dest || this.out); o.start(t); o.stop(t + dur + 0.02); },
  noise(t, dur, vol, type, freq) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = SFX.noise; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.out); s.start(t, Math.random() * 0.3); s.stop(t + dur + 0.02);
  },
  kick(t, v) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.18); },
  snare(t, v) { this.noise(t, 0.12, v, 'highpass', 1400); this.note(190, t, 0.07, 'triangle', v * 0.6); },
  tom(t, f, v) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.18); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.24); },
  play(bar, s, t, mood) {
    const minor = mood === 'boss', calm = mood === 'calm' || mood === 'talk', spb = this.spb;
    const root = MUS_CHORDS[bar][s < 8 ? 0 : 1], H = (d, o) => this.hz(d, o, minor);
    // the flute carries the tune; in the B half of a siege a second flute hums a third below
    for (const [st, d, len] of MUS_MEL[bar]) if (st === s) {
      this.flute(H(d, 0), t, len * spb * 1.05, minor ? 0.13 : 0.15);
      if (mood === 'siege' && bar >= 8) this.flute(H(d - 2, 0), t, len * spb * 1.05, 0.06);
    }
    // plucked oom-pah bass
    if (s === 0) this.pluck(H(root, -2), t, spb * 4, 0.3, this.low);
    if (s === 8) this.pluck(H(root + (minor ? 0 : 4), -2), t, spb * 4, 0.26, this.low);
    if (!minor && (s === 4 || s === 12)) for (const k of [0, 2, 4]) this.pluck(H(root + k, -1), t, spb * 1.5, 0.04);
    if (calm) {
      if (s === 4 || s === 12) this.note(1250, t, 0.035, 'sine', 0.05);
      if (s % 4 === 2) this.noise(t, 0.04, 0.02, 'highpass', 6500);
      return;
    }
    if (minor) {
      if (s === 0) this.note(H(root, -3), t, spb * 15, 'triangle', 0.12, this.low);
      if (s === 0 || s === 6 || s === 8) this.tom(t, 110, 0.28);
      if (bar % 4 === 3 && s >= 8 && s % 2 === 0) this.tom(t, [196, 165, 147, 123][(s - 8) / 2], 0.24);
      if (s % 2 === 0) this.noise(t, 0.05, 0.02, 'highpass', 6000);
      return;
    }
    // siege: a harp ripple, a soft frame drum and a shaker
    if (s % 2 === 0) this.pluck(H(root + [0, 2, 4, 7, 9, 7, 4, 2][s / 2], 1), t, spb * 2, 0.035, this.lead);
    if (s === 0 || s === 8 || bar % 2 && s === 14) this.kick(t, 0.28);
    if (s === 4 || s === 12) this.noise(t, 0.09, 0.05, 'bandpass', 900);
    if (s % 2 === 0) this.noise(t, 0.05, s % 4 === 2 ? 0.035 : 0.02, 'highpass', 6000);
  },
};
