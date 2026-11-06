// renders each talk voice (src/voices.js) saying a sample line, timed like the talk's typing, to WAV files: node tools/voice-previews.cjs <out dir> (after node build.mjs)
const { chromium } = require('playwright'); const fs = require('fs');
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file:///home/user/manatorium/index.html'); await p.waitForFunction(() => typeof VOX !== 'undefined' && typeof G !== 'undefined');
  const lines = {
    grubnose: 'Hand over the rafters! Me and my bucket are moving in.', gloop: 'My children are NOT for popping, dearie. Blub.',
    wyrm: 'Ssso. The little castle thinks it can stand against the ash.', ringmaster: 'Ladies and goblins! The greatest siege on earth!',
    sporebaron: 'The Fungal Court is now in session. The sentence: compost.', matriarch: 'You are cold, little castle. Not cold enough.',
    trashpaw: 'Mine, mine, mine, all of this is mine! Shiny!', colossus: 'TARGET ACQUIRED. RAFTERS DETECTED. COMMENCING SIEGE.',
    pinchbeard: 'Arr, hand over yer gold or I pinch ye, matey!', goosegod: 'HOOOONK. (Translation: Every bird in the realm stands behind me.)',
    shardgoose: 'HONK. (Translation: The twelve shards. They are MINE.)',
  };
  const heroes = ['heroic', 'cheerful', 'angry', 'cowardly', 'wise', 'deranged', 'lazy', 'vain'].map(t => [t, { hero: 'katharine', temper: t }]);
  const jobs = Object.entries(lines).map(([k, l]) => [k, k, l]).concat(heroes.map(([t, v]) => ['hero-' + t, v, 'Hold the walls, everyone! We can do this, I think.']));
  for (const [name, voice, text] of jobs) {
    const b64 = await p.evaluate(async ([voice, text]) => {
      const sr = 44100; let t = 0.15; const times = [];
      for (let n = 1; n <= text.length; n++) { const ch = text[n - 1]; if (VOX.due(voice, ch, n) && !(/[.!?]/.test(ch) && /[.!?]/.test(text[n] || ''))) times.push([t, ch, n, text[n] || ' ']); t += (/[.!?]/.test(ch) ? 160 : /,/.test(ch) ? 80 : 22) / 1000; }
      const ac = new OfflineAudioContext(1, Math.ceil((t + 0.8) * sr), sr), m = ac.createGain(); m.gain.value = 0.32 * 0.9; m.connect(ac.destination);
      const v = voiceFor(voice); for (const [tt, ch, n, nx] of times) VOX.render(ac, m, tt, v, ch, n, nx);
      const buf = await ac.startRendering(), d = buf.getChannelData(0); let peak = 0, ss = 0, nn = 0; for (const x of d) { peak = Math.max(peak, Math.abs(x)); if (Math.abs(x) > 1e-4) { ss += x * x; nn++; } } const rms = Math.sqrt(ss / (nn || 1));
      const g = Math.min(4, 0.8 / (peak || 1)); // normalise a little for the preview
      const ab = new ArrayBuffer(44 + d.length * 2), dv = new DataView(ab); const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); dv.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, d.length * 2, true);
      for (let i = 0; i < d.length; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i] * g)) * 32767, true);
      let s = ''; const u = new Uint8Array(ab); for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return [btoa(s), peak, rms];
    }, [voice, text]);
    fs.writeFileSync(`${out}/${name}.wav`, Buffer.from(b64[0], 'base64')); console.log(name, "peak", b64[1].toFixed(3), "rms", (b64[2]*1000).toFixed(1));
  }
  await b.close();
})();
