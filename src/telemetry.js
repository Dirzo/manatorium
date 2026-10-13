// ===== Playtest tracking: runs, notes (typed or spoken), auto-captured errors =====
// Everything goes to the artifact's shared db so Claude can read it back; falls back to this device when db is absent.
const LOCAL_TEL = 'manatorium.tel.v1';
const TEL = {
  db: null, user: null, assets: null, me: null, ready: false, chains: {}, cur: null, errs: 0, local: [],
  async init() {
    REC.init();
    try { this.local = JSON.parse(localStorage.getItem(LOCAL_TEL) || '[]'); } catch (e) { this.local = []; }
    window.addEventListener('error', e => this.error(e.message, e.error && e.error.stack));
    window.addEventListener('unhandledrejection', e => this.error('Unhandled promise: ' + ((e.reason && e.reason.message) || e.reason), e.reason && e.reason.stack));
    if (!window.claude || !window.claude.use) return;
    try {
      const [db, user, assets] = await Promise.all([claude.use('db'), claude.use('user'), claude.use('assets')]);
      this.db = db; this.user = user; this.assets = assets;
      if (user) { try { this.me = await user.id(); } catch (e) { } }
      this.ready = !!db;
      if (db && this.local.length) this.flushLocal();
      UI.recBadge();
    } catch (e) { }
  },
  keepLocal(col, data) { this.local.push({ col, data }); this.local = this.local.slice(-60); try { localStorage.setItem(LOCAL_TEL, JSON.stringify(this.local)); } catch (e) { } },
  async flushLocal() { const q = this.local; this.local = []; try { localStorage.setItem(LOCAL_TEL, '[]'); } catch (e) { }
    for (const r of q) { try { if (r.path) await this.db.doc(r.path).set(r.data); else await this.db.collection(r.col).add(r.data); } catch (e) { } } },
  // serialize writes per doc; newest data wins
  write(path, data, merge) {
    if (!this.db) { const prev = this.local.find(r => r.path === path); this.local = this.local.filter(r => r.path !== path); this.local.push({ path, data: merge && prev ? Object.assign({}, prev.data, data) : data }); this.local = this.local.slice(-60); try { localStorage.setItem(LOCAL_TEL, JSON.stringify(this.local)); } catch (e) { } return; }
    const prev = this.chains[path] || Promise.resolve();
    this.chains[path] = prev.then(() => merge ? this.db.doc(path).update(data).catch(() => this.db.doc(path).set(data)) : this.db.doc(path).set(data)).catch(e => console.warn('db write', e && e.code));
  },
  add(col, data) { if (!this.db) { this.keepLocal(col, data); return Promise.resolve(null); } return this.db.collection(col).add(data).catch(e => { this.keepLocal(col, data); return null; }); },

  heroSummary(run) { return run.roster.map(h => ({ id: h.id, lv: h.level, el: h.el || null, rolls: h.rolls, items: heroItems(run, h).map(it => it.parts.join('+')), placed: !!h.place })); },
  runStart(run) {
    this.cur = { runId: run.runId, events: [] };
    this.write('playtests/' + run.runId, { runId: run.runId, by: this.me, build: VERSION, startedAt: new Date(run.startedAt).toISOString(), status: 'live', reached: 1, sieges: [], heroes: [], device: { w: innerWidth, h: innerHeight, touch: 'ontouchstart' in window, ua: navigator.userAgent.slice(0, 120) } });
  },
  event(type, data) { if (!this.cur || !G.run || this.cur.runId !== G.run.runId) this.cur = { runId: G.run && G.run.runId, events: [] }; this.cur.events.push({ t: type, s: G.run ? G.run.siege : 0, ...data }); if (this.cur.events.length > 300) this.cur.events.shift(); },
  siege(run, rep) {
    REC.flush('siege ' + rep.siege);
    const row = { s: rep.siege, gold: rep.gold, kills: rep.kills, castleLost: Math.round(rep.castleLost), castleHp: Math.round(run.castle.hp), secs: Math.round(rep.time || 0), heroes: rep.heroes.map(h => ({ id: h.id, alive: h.alive, xp: h.xp, lv: h.toLv, dmg: Math.round(h.dmg) })), drops: rep.drops };
    run.telSieges = (run.telSieges || []).concat([row]).slice(-80);
    this.write('playtests/' + run.runId, { reached: run.siege, sieges: run.telSieges, heroes: this.heroSummary(run), gold: run.gold, castleEl: run.castleEl, techs: Object.keys(run.tech), events: this.cur && this.cur.runId === run.runId ? this.cur.events.slice(-150) : [], updatedAt: new Date().toISOString() }, true);
  },
  runEnd(run, cause) {
    if (!run || !run.runId) return;
    REC.flush('end ' + cause);
    this.write('playtests/' + run.runId, { status: 'ended', cause, reached: run.siege, endedAt: new Date().toISOString(), heroes: this.heroSummary(run), castleEl: run.castleEl, techs: Object.keys(run.tech), stats: { kills: run.stats.kills, gold: run.stats.gold, bosses: run.stats.bosses }, events: this.cur && this.cur.runId === run.runId ? this.cur.events.slice(-150) : [] }, true);
  },
  context() {
    const run = G.run; if (!run) return {};
    return { runId: G.hasRun ? run.runId : null, siege: run.siege, phase: G.phase, gold: run.gold, castle: Math.round(run.castle.hp) + '/' + run.castle.max, castleEl: run.castleEl, heroes: this.heroSummary(run), page: UI.page, build: VERSION };
  },
  error(msg, stack) {
    if (this.errs++ > 8 || !msg) return;
    console.warn('captured', msg);
    this.add('feedback', { kind: 'error', text: String(msg).slice(0, 400), stack: String(stack || '').slice(0, 1500), at: new Date().toISOString(), by: this.me, status: 'open', auto: true, ctx: this.context() });
  },
  note(kind, text, transcript, audioId) {
    return this.add('feedback', { kind, text: text.slice(0, 4000), transcript: (transcript || '').slice(0, 4000), audioId: audioId || null, at: new Date().toISOString(), by: this.me, status: 'open', ctx: this.context() });
  },
};


// ----- automatic capture: every click and key, plus a microphone recording per siege -----
const REC = {
  t0: performance.now(), log: [], stream: null, rec: null, chunks: [], sr: null, said: '', state: 'off', seg: 0, asked: false,
  init() {
    const opts = { capture: true, passive: true };
    document.addEventListener('pointerdown', e => this.click(e), opts);
    document.addEventListener('keydown', e => { if (e.repeat) return; this.push({ k: 'key', key: e.key }); }, opts);
    document.addEventListener('visibilitychange', () => { this.push({ k: document.hidden ? 'hidden' : 'visible' }); if (document.hidden) this.flush('hidden'); });
    window.addEventListener('pagehide', () => this.flush('leave'));
  },
  push(ev) { ev.t = Math.round(performance.now() - this.t0); ev.ph = G.phase; ev.s = G.run ? G.run.siege : 0; this.log.push(ev); if (this.log.length > 4000) this.log.shift(); },
  click(e) {
    const el = e.target && e.target.closest ? e.target.closest('button,[data-act],[data-pick],[data-opt],canvas,.hcard,a,summary,select,textarea') : null;
    const ev = { k: 'click', x: Math.round(e.clientX), y: Math.round(e.clientY) };
    if (el) {
      if (el.id) ev.id = el.id;
      if (el.dataset) { if (el.dataset.act) ev.act = el.dataset.act + (el.dataset.arg ? ':' + el.dataset.arg : ''); if (el.dataset.pick) ev.pick = +el.dataset.pick; if (el.dataset.opt) ev.opt = +el.dataset.opt; if (el.dataset.page) ev.page = el.dataset.page; if (el.dataset.uid) ev.uid = el.dataset.uid; }
      if (el.tagName === 'CANVAS') { const r = el.getBoundingClientRect(); ev.cx = Math.round((e.clientX - r.left) * W / r.width); ev.cy = Math.round((e.clientY - r.top) * H / r.height); }
      const txt = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' '); if (txt && el.tagName !== 'CANVAS') ev.txt = txt.slice(0, 40);
    }
    if (UI.page) ev.drawer = UI.page;
    this.push(ev);
    if (!this.asked && G.run) this.startMic();
  },
  // mic starts on the first click (browsers need a gesture) and records one clip per siege
  async startMic() {
    this.asked = true; this.state = 'asking'; UI.recBadge();
    try { this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { this.stream = null; this.state = 'blocked'; this.push({ k: 'mic', ok: false, why: String(e && e.name || e) }); }
    if (this.stream && window.MediaRecorder) { this.state = 'on'; this.push({ k: 'mic', ok: true }); this.newSegment(); }
    else if (this.state !== 'blocked') this.state = 'blocked';
    this.startSpeech(); UI.recBadge();
  },
  newSegment() {
    if (!this.stream) return;
    const mt = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    try { this.rec = new MediaRecorder(this.stream, mt ? { mimeType: mt, audioBitsPerSecond: 24000 } : undefined); } catch (e) { this.rec = null; return; }
    this.chunks = []; this.rec.ondataavailable = e => e.data.size && this.chunks.push(e.data); this.rec.start(5000);
  },
  startSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR || this.sr) return;
    try { const r = new SR(); r.continuous = true; r.interimResults = false; r.lang = navigator.language || 'en-US';
      r.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) { const t = e.results[i][0].transcript.trim(); if (t) { this.said += t + ' '; this.push({ k: 'said', txt: t.slice(0, 300) }); } } };
      r.onend = () => { if (this.sr && !document.hidden) { try { r.start(); } catch (e) { } } };
      r.onerror = ev => { if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') this.sr = null; };
      r.start(); this.sr = r; } catch (e) { this.sr = null; }
  },
  // close the current clip and log, and save them under the run
  async flush(why) {
    const run = G.run; if (!run || !G.hasRun || !run.runId) return;
    const seg = ++this.seg, log = this.log.splice(0), said = this.said; this.said = '';
    let blob = null;
    if (this.rec && this.rec.state !== 'inactive') { const r = this.rec; this.rec = null; blob = await new Promise(res => { r.onstop = () => res(new Blob(this.chunks, { type: r.mimeType || 'audio/webm' })); try { r.stop(); } catch (e) { res(null); } }); if (why !== 'leave' && why !== 'hidden') this.newSegment(); else if (why === 'hidden') this.newSegment(); }
    let audioId = null;
    if (blob && blob.size > 2000 && TEL.assets) { try { audioId = (await TEL.assets.upload(new Blob([blob], { type: 'video/webm' }), { type: 'video/webm' })).id; } catch (e) { this.push({ k: 'mic-upload-failed' }); } }
    if (!log.length && !audioId) return;
    TEL.write(`playtests/${run.runId}/clips/${String(seg).padStart(3, '0')}`, { seg, why, siege: run.siege, at: new Date().toISOString(), build: VERSION, audioId, secs: blob ? null : 0, transcript: said.trim().slice(0, 8000), log });
  },
};

// ----- optional typed note (N key) -----
const NOTE_KINDS = [['bug', 'Bug'], ['gripe', 'Gripe'], ['balance', 'Balance'], ['idea', 'Idea'], ['fun', 'Made me laugh']];
const NOTES = {
  kind: 'bug', rec: null, chunks: [], blob: null, sr: null, transcript: '', unsub: null, items: [], wasPaused: false,
  open() {
    const el = $('notes'); if (!el.hidden) return;
    this.wasPaused = G.paused; G.paused = true; this.blob = null; this.transcript = '';
    el.hidden = false; this.render();
    this.subscribe();
  },
  close() { this.stopRec(); $('notes').hidden = true; G.paused = this.wasPaused; },
  render() {
    const c = TEL.context();
    $('notes').innerHTML = `<div class="panel" role="dialog" aria-label="Playtest notes">
      <div class="row between"><div><span class="eyebrow">Playtest log · ${esc(VERSION)}</span><h2>Leave a note</h2></div><button class="btn small ghost" id="nClose">Close <kbd>Esc</kbd></button></div>
      <p class="note" style="margin:0">Notes are saved with a snapshot of where you are (siege ${c.siege || '-'}, ${esc(c.phase || 'title')}, ${(c.heroes || []).length} heroes), so Claude can find and fix it later. ${TEL.ready ? '' : '<b>Saved on this device for now.</b>'}</p>
      <div class="kinds">${NOTE_KINDS.map(([k, n]) => `<button class="btn small" data-kind="${k}" aria-pressed="${this.kind === k}">${n}</button>`).join('')}</div>
      <textarea id="nText" placeholder="What happened? What felt off? What should change?"></textarea>
      <div class="microw"><button class="btn small" id="nMic"><img class="px" src="${iconURL('mic', 2)}" alt="">Record a voice note</button><span id="nMicState" class="note"></span><audio id="nAudio" controls hidden style="height:30px;max-width:100%"></audio></div>
      <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn primary" id="nSave">Save note</button></div>
      <div class="group-title">Recent notes</div><div class="nlist" id="nList"></div></div>`;
    const p = $('notes');
    p.onclick = e => { if (e.target === p) this.close(); };
    p.onkeydown = e => { if (e.key === 'Escape') { e.stopPropagation(); this.close(); } };
    $('nClose').onclick = () => this.close();
    p.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { this.kind = b.dataset.kind; p.querySelectorAll('[data-kind]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    $('nMic').onclick = () => this.rec ? this.stopRec() : this.startRec();
    $('nSave').onclick = () => this.save();
    setTimeout(() => $('nText').focus(), 30);
    this.renderList();
  },
  renderList() {
    const l = $('nList'); if (!l) return;
    const items = this.items.length ? this.items : TEL.local.filter(r => r.col === 'feedback').map(r => r.data).reverse();
    if (!items.length) { l.innerHTML = '<p class="note">No notes yet.</p>'; return; }
    l.innerHTML = items.slice(0, 25).map(n => `<div class="nitem"><header><span><span class="k ${esc(n.kind)}">${esc(n.kind)}</span> ${n.ctx && n.ctx.siege ? 'siege ' + n.ctx.siege : ''}</span><span>${esc((n.at || '').slice(0, 16).replace('T', ' '))}${n.status === 'fixed' ? ' · fixed' : ''}</span></header><div class="${n.status === 'fixed' ? 'done' : ''}">${esc(n.text || n.transcript || '(voice note)')}</div>${n.reply ? `<div class="note" style="color:var(--mint)">Claude: ${esc(n.reply)}</div>` : ''}</div>`).join('');
  },
  subscribe() {
    if (!TEL.db || this.unsub) return;
    try { this.unsub = TEL.db.collection('feedback').orderBy('at', 'desc').limit(25).onSnapshot(s => { this.items = s.docs.map(d => d.data()); this.renderList(); }, () => { }); } catch (e) { }
  },
  async startRec() {
    const st = $('nMicState'); st.textContent = 'Asking for the microphone…';
    let stream = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { stream = null; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!stream && !SR) { st.textContent = 'The microphone is blocked in this view. Try your keyboard’s dictation key, or open the game in its own tab.'; return; }
    this.chunks = []; this.blob = null;
    if (stream && window.MediaRecorder) {
      const mt = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
      this.rec = new MediaRecorder(stream, mt ? { mimeType: mt } : undefined);
      this.rec.ondataavailable = e => e.data.size && this.chunks.push(e.data);
      this.rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); this.blob = new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' }); const a = $('nAudio'); if (a) { a.src = URL.createObjectURL(this.blob); a.hidden = false; } this.rec = null; this.micUI(false); };
      this.rec.start();
    } else this.rec = { stop: () => { this.rec = null; this.micUI(false); } };
    if (SR) { try { const r = new SR(); r.continuous = true; r.interimResults = true; r.lang = navigator.language || 'en-US';
      let fin = ''; r.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' '; else interim += e.results[i][0].transcript; } this.transcript = fin.trim(); const t = $('nText'); if (t) t.value = (this.baseText ? this.baseText + ' ' : '') + (fin + interim).trim(); };
      r.onerror = () => { }; this.baseText = $('nText').value.trim(); r.start(); this.sr = r; } catch (e) { this.sr = null; } }
    this.micUI(true);
  },
  stopRec() { if (this.sr) { try { this.sr.stop(); } catch (e) { } this.sr = null; } if (this.rec) { try { this.rec.stop(); } catch (e) { this.rec = null; } } },
  micUI(on) { const b = $('nMic'), st = $('nMicState'); if (!b) return; b.classList.toggle('rec', on); b.innerHTML = on ? '<span class="dot"></span>Stop recording' : `<img class="px" src="${iconURL('mic', 2)}" alt="">${this.blob ? 'Record again' : 'Record a voice note'}`;
    st.textContent = on ? (this.sr ? 'Listening. Your words appear in the note as you speak.' : 'Recording…') : (this.blob ? 'Voice note ready. It saves with the note.' : ''); },
  async save() {
    this.stopRec(); await new Promise(r => setTimeout(r, this.rec ? 300 : 0));
    const text = $('nText').value.trim(); if (!text && !this.blob) { UI.toast('Write or record something first.', true); return; }
    $('nSave').disabled = true; let audioId = null;
    if (this.blob && TEL.assets) { try { const r = await TEL.assets.upload(new Blob([this.blob], { type: 'video/webm' }), { type: 'video/webm' }); audioId = r.id; } catch (e) { UI.toast('The voice clip could not upload; the text is saved.', true); } }
    await TEL.note(this.kind, text, this.transcript, audioId);
    UI.toast(TEL.ready ? 'Note saved to the playtest log.' : 'Note saved on this device.'); SFX.play('buy');
    this.blob = null; this.transcript = ''; $('nText').value = ''; $('nSave').disabled = false; const a = $('nAudio'); if (a) a.hidden = true; this.micUI(false);
    if (!TEL.ready) this.renderList();
  },
};
