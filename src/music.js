// ----- Castle defense theme (Cam 2026-10-22) -----
// A procedural chiptune march played on the SFX audio context: no audio files, so the single-file build stays small.
// One 16-bar tune (A: the march, B: a bouncy goofy answer) arranged four ways and switched at bar lines:
//   calm  title, keep and drafts: flute lead, pizzicato oom-pah, woodblock
//   siege battle: square lead, pumping bass, arpeggios, marching drums and snare rolls
//   boss  boss sieges and the goose finale: same tune in harmonic minor, saw bass, drone, toms
//   talk  boss talk scenes: calm, ducked under the dialogue blips
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
const MUS_BPM = { calm: 104, talk: 100, siege: 132, boss: 140 };

const MUSIC = {
  ctx: null, out: null, live: false, vol: 0.5, mood: null, bar: 0, step: 0, nextT: 0, timer: 0,
  // called once the splash and intro are done; the scheduler waits for the first tap to unlock audio
  start() { this.live = true; if (!this.timer) this.timer = setInterval(() => this.tick(), 30); },
  setVol(v) { this.vol = v; if (this.out) this.out.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.08); },
  level() { return this.vol * 0.6 * (this.mood === 'talk' ? 0.45 : 1); },
  init() {
    const c = this.ctx = SFX.ctx; this.out = c.createGain(); this.out.gain.value = 0; this.out.connect(c.destination);
    // the lead sings through a soft lowpass and a little echo
    this.lead = c.createBiquadFilter(); this.lead.type = 'lowpass'; this.lead.frequency.value = 3200; this.lead.connect(this.out);
    this.echo = c.createDelay(1); this.fb = c.createGain(); this.fb.gain.value = 0.28; const wet = c.createGain(); wet.gain.value = 0.2;
    this.lead.connect(this.echo); this.echo.connect(this.fb); this.fb.connect(this.echo); this.echo.connect(wet); wet.connect(this.out);
    this.low = c.createBiquadFilter(); this.low.type = 'lowpass'; this.low.frequency.value = 900; this.low.connect(this.out);
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
    if (this.nextT < now - 0.1) { this.nextT = now + 0.06; this.step = 0; this.mood = null; }
    while (this.nextT < now + 0.16) {
      if (this.step === 0) {
        const m = this.pickMood();
        // a new mood restarts the tune from the top so each scene opens on the march
        if (m !== this.mood) { if (!(this.mood === 'calm' && m === 'talk' || this.mood === 'talk' && m === 'calm')) this.bar = 0; this.mood = m; }
        this.out.gain.setTargetAtTime(this.level(), this.nextT, 0.15);
        this.spb = 60 / MUS_BPM[m] / 4; this.echo.delayTime.setValueAtTime(this.spb * 3, this.nextT);
        this.lead.frequency.setValueAtTime(m === 'siege' ? 2600 : m === 'boss' ? 2000 : 1800, this.nextT);
      }
      this.play(this.bar, this.step, this.nextT, this.mood);
      this.nextT += this.spb * (this.step % 2 ? 0.94 : 1.06); // a touch of swing keeps it bouncy
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
    // lead
    for (const [st, d, len] of MUS_MEL[bar]) if (st === s) {
      if (calm) this.note(H(d, 0), t, len * spb * 1.1, 'triangle', 0.2, this.lead, len > 2);
      else { this.note(H(d, 0), t, len * spb * 0.9, 'square', minor ? 0.055 : 0.06, this.lead, len > 3); if (bar >= 8 && !minor) this.note(H(d - 2, 0), t, len * spb * 0.9, 'triangle', 0.07, this.lead); }
    }
    // bass and accompaniment
    if (calm) {
      if (s === 0) this.note(H(root, -2), t, spb * 3, 'triangle', 0.26, this.low);
      if (s === 8) this.note(H(root + 4, -2), t, spb * 3, 'triangle', 0.24, this.low);
      if (s === 4 || s === 12) for (const k of [0, 2, 4]) this.note(H(root + k, -1), t, spb * 1.2, 'triangle', 0.035);
      if (s === 4 || s === 12) this.note(1250, t, 0.035, 'sine', 0.05);
      if (s % 4 === 2) this.noise(t, 0.04, 0.025, 'highpass', 6500);
      return;
    }
    if (s % 2 === 0) this.note(H(root + (s % 4 === 2 && !minor ? 7 : 0), -2), t, spb * 1.6, minor ? 'sawtooth' : 'square', minor ? 0.11 : 0.09, this.low);
    if (minor && s === 0) this.note(H(root, -3), t, spb * 15, 'sawtooth', 0.06, this.low);
    // sparkly arpeggio over the chord
    this.note(H(root + [0, 2, 4, 7][s % 4], 1), t, spb * 0.7, 'square', minor ? 0.014 : 0.018, this.lead);
    // drums
    const roll = bar % 4 === 3 && s >= 12;
    if (s % 4 === 0 && (minor || s % 8 === 0 || bar % 2 && s === 12)) this.kick(t, 0.5);
    if ((s === 4 || s === 12) && !roll) this.snare(t, 0.16);
    if (roll) this.snare(t, 0.06 + (s - 12) * 0.03);
    if (minor ? true : s % 2 === 0) this.noise(t, 0.03, s % 4 === 2 ? 0.05 : 0.03, 'highpass', 7500);
    if (minor && bar % 4 === 3 && s >= 8 && s % 2 === 0) this.tom(t, [220, 180, 150, 120][(s - 8) / 2], 0.3);
  },
};
