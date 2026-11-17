/* Galaxy – rondleiding, betere chat (gelezen, typen, foto, spraak), echtheidscheck, badges en reeksen,
   video-intro, meldingen over de feed en meldingen voor de beheerder. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const T = m => { try { toast(m) } catch (e) { } };
  const nl = () => { try { return (typeof LANG === 'undefined' ? 'nl' : LANG) === 'nl' } catch (e) { return true } };
  const t = (a, b) => nl() ? a : b;
  const net = () => window.GLXNET || {};
  const db = () => net().db;
  const uid = () => net().uid;
  const I = (n, s) => window.GLXICON ? GLXICON(n, s) : '';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const buzz = p => { try { if (localStorage.glxHaptics !== '0' && navigator.vibrate) navigator.vibrate(p) } catch (e) { } };
  const script = src => new Promise((ok, no) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s) });
  let nsfwModel = null;
  async function nsfw(src) {
    if (!nsfwModel) { await script('vendor/nsfw/nsfwjs.min.js'); await script('vendor/nsfw/model.min.js'); await script('vendor/nsfw/group1-shard1of1.min.js'); nsfwModel = await window.nsfwjs.load('MobileNetV2') }
    const c = document.createElement('canvas'); c.width = c.height = 224; c.getContext('2d').drawImage(src, 0, 0, 224, 224);
    const p = {}; (await nsfwModel.classify(c)).forEach(x => p[x.className] = x.probability); return p;
  }
  const naked = p => (p.Porn || 0) + (p.Hentai || 0) > .5;

  const css = document.createElement('style');
  css.textContent = `
#glxTour{position:fixed;inset:0;z-index:450;background:radial-gradient(120% 80% at 50% 0%,#3b0764 0%,#07061a 65%);color:#fff;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top) + 18px) 22px calc(env(safe-area-inset-bottom) + 22px)}
#glxTour .sk{align-self:flex-end;background:none;border:0;color:#fffb;font:inherit;font-size:14px;padding:6px}
#glxTour .pg{flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:14px}
#glxTour .art{width:200px;height:200px;margin:0 auto 8px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#8b5cf666,#1e1b4b);border:1px solid #ffffff1f;color:#f5f3ff;overflow:hidden}
#glxTour .art .gi{width:84px;height:84px;stroke-width:1.3}
#glxTour .art img{width:100%;height:100%;object-fit:cover;object-position:50% 12%}
#glxTour h2{font-family:Syne,inherit;font-size:28px;line-height:1.1;margin:0;text-wrap:balance}
#glxTour p{margin:0 auto;max-width:330px;font-size:16px;line-height:1.45;color:#e9e5ffcc}
#glxTour .dots{display:flex;gap:6px;justify-content:center;margin:18px 0}
#glxTour .dots i{width:7px;height:7px;border-radius:9px;background:#ffffff40;transition:width .3s}
#glxTour .dots i.on{width:22px;background:#fff}
#glxTour .go{border:0;border-radius:16px;padding:15px;font:inherit;font-size:16px;font-weight:700;color:#fff;background:linear-gradient(135deg,#8b5cf6,#ec4899)}
.cmMedia{display:block;max-width:220px;border-radius:12px;margin:2px 0 4px}
.cmAudio{width:220px;max-width:100%;height:38px;margin:2px 0}
#gcTyping{height:18px;font-size:12px;color:var(--mut);padding:0 4px}
.gcTool{flex:none;width:44px;height:44px;border-radius:14px;border:1px solid var(--line);background:var(--card2);color:var(--txt);display:grid;place-items:center;padding:0}
.gcTool .gi{width:20px;height:20px}
.gcTool.rec{background:#be123c;border-color:#fb7185;animation:gcPulse 1s infinite}
@keyframes gcPulse{50%{box-shadow:0 0 0 6px #fb718533}}
.bdg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.bdg div{border-radius:16px;padding:12px 6px;text-align:center;background:var(--card);border:1px solid var(--line);font-size:12px;line-height:1.3}
.bdg div b{display:block;font-size:30px;line-height:1.2;margin-bottom:4px}
.bdg div.off{opacity:.38;filter:grayscale(1)}
.bdg div small{display:block;color:var(--mut);font-size:11px;margin-top:3px}
.realTick{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#0ea5e9;color:#fff;font-size:11px;font-weight:800;vertical-align:2px;margin-left:4px}
#socProf{display:flex;gap:8px;margin-bottom:12px}
#socProf button{flex:1;border-radius:16px;padding:12px 10px;background:var(--card);border:1px solid var(--line);color:var(--txt);font:inherit;text-align:left;display:flex;flex-direction:column;gap:2px}
#socProf button b{font-size:15px}#socProf button span{font-size:12px;color:var(--mut)}
.vidBox{position:relative;border-radius:18px;overflow:hidden;background:#000;margin:10px 0}
.vidBox video{display:block;width:100%;max-height:60vh;object-fit:cover}
@media (prefers-reduced-motion:reduce){.gcTool.rec{animation:none}#glxTour .dots i{transition:none}}`;
  document.head.appendChild(css);

  const EXTRA = { camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13.5" r="3.5"/>', mic: '<rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>', wave: '<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v6M16 10.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-12.3 4.6L4.4 15.3a1.6 1.6 0 0 1 2.4-2.1L7 13.5V11"/>', shield: '<path d="M12 3 19.5 6v5.5c0 4.7-3.2 7.9-7.5 9.5-4.3-1.6-7.5-4.8-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/>' };
  const ic = (n, s) => EXTRA[n] ? `<svg class="gi" viewBox="0 0 24 24" width="${s || 20}" height="${s || 20}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EXTRA[n]}</svg>` : I(n, s);

  /* ==================== 2. rondleiding voor nieuwe gebruikers ==================== */
  const PAGES = () => [
    ['map', t('Echte mensen, op een live kaart', 'Real people, on a live map'), t('Je ziet wie er in je buurt is. Nooit je exacte plek: alleen een zone van een paar straten, en pas na 15 minuten.', 'See who\'s nearby. Never your exact spot: only a zone of a few streets, and only after 15 minutes.')],
    ['me', t('Dit ben jij', 'This is you'), t('Je 3D-figuurtje loopt op de kaart in jouw plaats. Pas het aan in je profiel: kleren, haar, stijl.', 'Your 3D figure walks the map for you. Style it in your profile.')],
    ['wave', t('Zwaai. Zwaait de ander terug, dan is het een match', 'Wave. Wave back = match'), t('Pas dan kunnen jullie chatten, foto\'s zien en een date plannen. Niemand kan je zomaar een bericht sturen.', 'Only then can you chat, see photos and plan a date. Nobody can message you out of the blue.')],
    ['shield', t('Veilig, altijd', 'Safe, always'), t('Galaxy is alleen voor 18+. Meld of blokkeer iemand met één tik, en gebruik "Veilig thuis" na een date.', 'Galaxy is 18+ only. Report or block in one tap, and use "Safe home" after a date.')]
  ];
  let tp = 0;
  function tour(force) {
    if (!force) { try { if (localStorage.glxTour) return } catch (e) { return } }
    if ($('glxTour')) return; tp = 0;
    document.body.insertAdjacentHTML('beforeend', `<div id="glxTour" role="dialog" aria-modal="true" aria-label="${t('Welkom bij Galaxy', 'Welcome to Galaxy')}"><button class="sk" type="button" onclick="GLXSOC._tourEnd()">${t('Overslaan', 'Skip')}</button><div class="pg" id="tPg"></div><div class="dots">${PAGES().map(() => '<i></i>').join('')}</div><button class="go" id="tGo" type="button" onclick="GLXSOC._tourNext()"></button></div>`);
    drawTour();
  }
  async function drawTour() {
    const P = PAGES()[tp], pg = $('tPg'); if (!pg) return;
    let art = P[0] === 'me' ? '<span id="tMe">' + I('figure', 84) + '</span>' : P[0] === 'wave' ? ic('wave', 84) : P[0] === 'shield' ? ic('shield', 84) : I('map', 84);
    pg.innerHTML = `<div class="art">${art}</div><h2>${P[1]}</h2><p>${P[2]}</p>`;
    document.querySelectorAll('#glxTour .dots i').forEach((d, k) => d.classList.toggle('on', k === tp));
    $('tGo').textContent = tp === PAGES().length - 1 ? t('Naar de kaart', 'Go to the map') : t('Volgende', 'Next');
    if (P[0] === 'me' && window.GLXAV) { try { const u = (GLXAV.image && GLXAV.image()) || await GLXAV.thumb(GLXAV.config(), 'me', 2); const m = $('tMe'); if (u && m) m.outerHTML = `<img src="${u}" alt="">` } catch (e) { } }
  }
  function tourNext() { buzz(10); if (tp < PAGES().length - 1) { tp++; drawTour() } else tourEnd(true) }
  function tourEnd(toMap) { try { localStorage.glxTour = '1' } catch (e) { } const x = $('glxTour'); if (x) x.remove(); if (toMap) try { go('map') } catch (e) { } }
  /* starten zodra de inlogpoort weg is en je profiel er is */
  function tourWatch() {
    let n = 0; const iv = setInterval(() => {
      n++; if (n > 600) return clearInterval(iv);
      const gate = $('glxGate'); const ready = !gate && uid() && net().state === 'verbonden';
      if (ready) { clearInterval(iv); setTimeout(() => tour(), 800) }
    }, 1000);
  }

  /* ==================== 3. meldingen over de feed (per toestel) ==================== */
  async function feedPush(onoff) {
    try {
      const reg = await navigator.serviceWorker.ready, s = await reg.pushManager.getSubscription();
      if (!s || !db()) return T(t('Zet eerst meldingen aan', 'Turn on notifications first'));
      const r = await db().rpc('set_feed_push', { ep: s.endpoint, onoff }); if (r.error) throw r.error;
      localStorage.glxFeedPush = onoff ? '1' : '0'; drawFeedRow(); buzz(20);
      T(onoff ? t('Je krijgt meldingen over de feed', 'Feed notifications on') : t('Geen meldingen meer over de feed', 'Feed notifications off'));
    } catch (e) { T(t('Dat lukte niet. Probeer opnieuw.', 'That did not work. Try again.')) }
  }
  function drawFeedRow() {
    const r = $('feedPushRow'), n = $('nearRow'); if (!r) return; r.style.display = n && n.style.display !== 'none' ? '' : 'none';
    const on = localStorage.glxFeedPush !== '0'; const b = r.querySelector('button'); if (b) { b.textContent = on ? t('Aan', 'On') : t('Uit', 'Off'); b.classList.toggle('on', on) }
  }
  function feedRowHook() {
    const n = $('nearRow'); if (!n || $('feedPushRow')) { drawFeedRow(); return }
    n.insertAdjacentHTML('afterend', `<div class="set" id="feedPushRow" style="display:none"><span>📰 ${t('Meldingen over de feed: matches die posten, de vraag van de avond, café-acties', 'Feed notifications: matches posting, question of the night, bar deals')}</span><button class="btn sm ghost" onclick="GLXSOC.feedPush(localStorage.glxFeedPush==='0')">…</button></div>`);
    drawFeedRow();
  }

  /* links uit meldingen */
  function links() {
    const q = location.search; const clean = () => { try { history.replaceState(null, '', location.pathname) } catch (e) { } };
    if (/[?&]feed=1/.test(q)) { clean(); setTimeout(() => { try { go('feed') } catch (e) { } }, 900) }
    if (/[?&]badges=1/.test(q)) { clean(); setTimeout(() => badges(), 1500) }
    if (/[?&]verify=1/.test(q)) { clean(); setTimeout(() => verify(), 1500) }
  }

  /* ==================== 4. chat: foto, spraak, typen, gelezen ==================== */
  let typCh = null, typT = null, lastTyp = 0;
  const pairKey = o => [uid(), o].sort().join('-');
  function chatOpen(o) {
    chatClose(); const d = db(); if (!d || !o) return;
    try {
      typCh = d.channel('glx-typ-' + pairKey(o), { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'typ' }, m => { if (!m.payload || m.payload.u !== o) return; const el = $('gcTyping'); if (!el) return; el.textContent = (net().nameOf(o) || t('Je match', 'Your match')) + ' ' + t('is aan het typen…', 'is typing…'); clearTimeout(typT); typT = setTimeout(() => { const e = $('gcTyping'); if (e) e.textContent = '' }, 3500) })
        .on('broadcast', { event: 'read' }, () => { try { net().reloadMsgs && net().reloadMsgs(true) } catch (e) { } })
        .subscribe();
    } catch (e) { }
    const i = $('gcIn'); if (i) i.addEventListener('input', () => { if (Date.now() - lastTyp > 2000 && typCh) { lastTyp = Date.now(); try { typCh.send({ type: 'broadcast', event: 'typ', payload: { u: uid() } }) } catch (e) { } } });
  }
  function chatClose() { if (typCh) { try { db() && db().removeChannel(typCh) } catch (e) { } typCh = null } }
  function chatReadPing() { if (typCh) try { typCh.send({ type: 'broadcast', event: 'read', payload: { u: uid() } }) } catch (e) { } }

  /* bestanden in de chat tonen (tijdelijke links, 1 uur) */
  const signed = {};
  async function chatMedia(box) {
    const d = db(); if (!d || !box) return;
    for (const el of box.querySelectorAll('[data-cm]')) {
      const p = el.dataset.cm; if (el.dataset.ok) continue; el.dataset.ok = 1;
      try { if (!signed[p]) { const r = await d.storage.from('chat').createSignedUrl(p, 3600); signed[p] = r.data && r.data.signedUrl } if (signed[p]) el.src = signed[p] } catch (e) { }
    }
  }
  async function sendMedia(kind, blob, ext) {
    const o = net().chatWith, d = db(); if (!o || !d) return;
    const path = `${uid()}/${o}/${Date.now()}.${ext}`;
    T(t('Versturen…', 'Sending…'));
    const up = await d.storage.from('chat').upload(path, blob, { contentType: blob.type || (kind === 'photo' ? 'image/jpeg' : 'audio/webm') });
    if (up.error) return T(t('Versturen lukte niet', 'Could not send'));
    const r = await d.from('messages').insert({ sender: uid(), to_id: o, kind, media: path, body: kind === 'photo' ? '📷 ' + t('Foto', 'Photo') : '🎙️ ' + t('Spraakbericht', 'Voice message') });
    if (r.error) { await d.storage.from('chat').remove([path]); return T(t('Versturen lukte niet. Misschien zijn jullie geen match meer.', 'Could not send.')) }
    buzz(12); try { net().reloadMsgs && net().reloadMsgs(true) } catch (e) { }
  }
  function chatPhoto() {
    const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
    f.onchange = async () => {
      const file = f.files && f.files[0]; if (!file) return;
      try {
        const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file) });
        const k = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        T(t('Foto controleren…', 'Checking photo…'));
        try { if (naked(await nsfw(c))) return T(t('Naaktfoto\'s kan je niet versturen in Galaxy', 'Nude photos can\'t be sent in Galaxy')) } catch (e) { }
        const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', .82)); sendMedia('photo', blob, 'jpg');
      } catch (e) { T(t('Die foto kon niet geopend worden', 'Could not open that photo')) }
    };
    f.click();
  }
  let rec = null;
  async function chatVoice(btn) {
    if (rec) { rec.stop(); return }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(x => window.MediaRecorder && MediaRecorder.isTypeSupported(x)) || '';
      const mr = new MediaRecorder(st, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined), parts = []; rec = mr;
      mr.ondataavailable = e => e.data.size && parts.push(e.data);
      mr.onstop = () => { st.getTracks().forEach(x => x.stop()); rec = null; clearTimeout(mr._t); if (btn) { btn.classList.remove('rec'); btn.innerHTML = ic('mic') }
        const blob = new Blob(parts, { type: (mr.mimeType || 'audio/webm').split(';')[0] }); if (blob.size > 1500) sendMedia('voice', blob, /mp4/.test(blob.type) ? 'm4a' : 'webm') };
      mr.start(); mr._t = setTimeout(() => { try { mr.stop() } catch (e) { } }, 60000);
      if (btn) { btn.classList.add('rec'); btn.innerHTML = ic('stop') } buzz(20); T(t('Opnemen… tik opnieuw om te versturen (max 1 min)', 'Recording… tap again to send (max 1 min)'));
    } catch (e) { T(t('Geen toegang tot je microfoon', 'No microphone access')) }
  }

  /* ==================== 5. echtheidscheck ==================== */
  const POSES = () => [[1, '✌️', t('Maak een peace-teken naast je gezicht', 'Make a peace sign next to your face')], [2, '👍', t('Steek je duim omhoog naast je gezicht', 'Thumbs up next to your face')],
  [3, '☝️', t('Wijs met één vinger naar boven', 'Point one finger up')], [4, '🤚', t('Hou je open hand naast je gezicht', 'Open hand next to your face')],
  [5, '👌', t('Maak een OK-teken naast je gezicht', 'Make an OK sign next to your face')], [6, '🤙', t('Maak een "bel me"-gebaar', 'Make a "call me" gesture')]];
  let vPose = null;
  async function verify() {
    const d = db(); if (!d) return T(t('Nog niet verbonden', 'Not connected yet'));
    let st = {}; try { st = (await d.rpc('verify_status')).data || {} } catch (e) { }
    if (st.real) return xs(t('Echtheidscheck', 'Verification'), `<div class="box" style="text-align:center"><b style="font-size:46px;display:block">✅</b><h3 style="margin:6px 0">${t('Je bent geverifieerd', 'You\'re verified')}</h3><p class="sub">${t('Anderen zien een blauw vinkje naast je naam. Dat geeft vertrouwen: mensen weten dat je echt bent.', 'Others see a blue tick next to your name.')}</p></div>`, false);
    const rq = st.request;
    if (rq && rq.status === 'pending') return xs(t('Echtheidscheck', 'Verification'), `<div class="box" style="text-align:center"><b style="font-size:46px;display:block">⏳</b><h3 style="margin:6px 0">${t('We bekijken je selfie', 'We\'re checking your selfie')}</h3><p class="sub">${t('Meestal binnen 24 uur. Je krijgt een melding zodra het klaar is.', 'Usually within 24 hours. You\'ll get a notification.')}</p></div>`, false);
    vPose = POSES()[Math.floor(Math.random() * POSES().length)];
    xs(t('Echtheidscheck', 'Verification'), `${rq && rq.status === 'rejected' ? `<div class="box" style="border-color:#fb7185"><b>${t('Vorige poging niet goedgekeurd', 'Previous attempt not approved')}</b>${rq.note ? `<p class="sub" style="margin:4px 0 0">${esc(rq.note)}</p>` : ''}</div>` : ''}
<p class="sub" style="margin-top:0">${t('Neem een selfie waarop je dit gebaar doet. Een mens van het Galaxy-team vergelijkt ze en geeft je daarna een blauw vinkje. Je selfie ziet verder niemand en wordt na de controle gewist.', 'Take a selfie doing this gesture. A Galaxy team member checks it and gives you a blue tick. Nobody else sees your selfie and it\'s deleted after review.')}</p>
<div class="box" style="text-align:center"><b style="font-size:72px;display:block;line-height:1.1">${vPose[1]}</b><p style="margin:6px 0 0;font-size:16px;font-weight:600">${vPose[2]}</p></div>
<button class="btn" style="width:100%;margin-top:12px" onclick="GLXSOC._verifyShoot()">📸 ${t('Selfie nemen', 'Take selfie')}</button>`, false);
  }
  function verifyShoot() {
    const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.setAttribute('capture', 'user');
    f.onchange = async () => {
      const file = f.files && f.files[0]; if (!file) return; const d = db();
      try {
        const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file) });
        const k = Math.min(1, 1100 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', .85)), path = uid() + '/' + Date.now() + '.jpg';
        T(t('Uploaden…', 'Uploading…'));
        const up = await d.storage.from('verify').upload(path, blob, { contentType: 'image/jpeg' }); if (up.error) throw up.error;
        const r = await d.rpc('verify_submit', { p_path: path, p_pose: vPose[0] }); if (r.error) throw r.error;
        buzz([20, 60, 20]); try { closeO('xV') } catch (e) { } T(t('Verstuurd! Je krijgt een melding zodra we het bekeken hebben.', 'Sent! We\'ll notify you after review.'));
      } catch (e) { T(t('Versturen lukte niet. Probeer opnieuw.', 'Could not send. Try again.')) }
    };
    f.click();
  }

  /* ==================== 6. badges en reeksen ==================== */
  const BADGES = () => [
    ['real', '✅', t('Echt', 'Real'), t('Selfie-check gedaan', 'Selfie check done')], ['age18', '🔞', t('18+ gecontroleerd', 'Age checked'), t('Leeftijdscontrole', 'Age check')],
    ['wave', '👋', t('Eerste zwaai', 'First wave'), t('Zwaai naar iemand', 'Wave at someone')], ['match', '💜', t('Eerste match', 'First match'), t('Iemand zwaait terug', 'Someone waves back')],
    ['checkin1', '📍', t('Ingecheckt', 'Checked in'), t('Check in op een plek', 'Check in somewhere')], ['checkin5', '🗺️', t('Ontdekker', 'Explorer'), t('5 keer inchecken', '5 check-ins')],
    ['avond', '🎉', t('Galaxy-avond', 'Galaxy night'), t('Check in op een avond', 'Check in at a night')], ['date', '🥂', t('Eerste date', 'First date'), t('Een date bevestigd', 'A confirmed date')],
    ['safe', '🛡️', t('Veilig thuis', 'Safe home'), t('Veilig-thuis gebruikt', 'Used safe home')], ['invite', '🎁', t('Ambassadeur', 'Ambassador'), t('Een vriend uitgenodigd', 'Invited a friend')],
    ['story', '📸', t('Verteller', 'Storyteller'), t('Eerste verhaal', 'First story')], ['streak3', '🔥', t('3 dagen', '3 days'), t('3 dagen op rij geantwoord', '3 days in a row')],
    ['streak7', '⚡', t('Een week', 'A week'), t('7 dagen op rij', '7 days in a row')], ['streak30', '🌟', t('Een maand', 'A month'), t('30 dagen op rij', '30 days in a row')]
  ];
  let mine = null;
  async function loadMine() { const d = db(); if (!d) return null; try { const r = await d.rpc('my_badges'); if (!r.error) mine = r.data } catch (e) { } return mine }
  async function badges() {
    await loadMine(); const has = new Set((mine && mine.badges) || []);
    xs('🏅 ' + t('Badges', 'Badges'), `<div class="box" style="display:flex;align-items:center;gap:14px"><b style="font-size:40px">🔥</b><div><b style="font-size:18px">${(mine && mine.streak) || 0} ${t('dagen op rij', 'days in a row')}</b><div class="sub">${mine && mine.answeredToday ? t('Vandaag al geantwoord. Kom morgen terug!', 'Answered today. Come back tomorrow!') : t('Beantwoord de vraag van de avond om je reeks te houden.', 'Answer the question of the night to keep your streak.')}${mine && mine.best ? ' · ' + t('record', 'best') + ': ' + mine.best : ''}</div></div></div>
<div class="bdg" style="margin-top:12px">${BADGES().map(b => `<div class="${has.has(b[0]) ? '' : 'off'}"><b>${b[1]}</b>${b[2]}<small>${b[3]}</small></div>`).join('')}</div>
<p class="sub" style="font-size:12px">${t('Anderen zien je badges op je profiel.', 'Others see your badges on your profile.')}</p>`, false);
  }
  const streakChip = () => mine && mine.streak ? `<span style="margin-left:auto;font-weight:700">🔥 ${mine.streak}</span>` : '';

  /* je eigen profiel: knoppen voor badges, echtheid en video */
  function profileRow() {
    const v = $('v-profile'); if (!v || !v.classList.contains('on')) return;
    if (!$('socProf')) {
      const a = $('avProf'); const html = `<div id="socProf"><button type="button" onclick="GLXSOC.badges()"><b>🏅 ${t('Badges', 'Badges')}</b><span id="spB">${t('Bekijk', 'View')}</span></button><button type="button" onclick="GLXSOC.verify()"><b>✅ ${t('Echt', 'Real')}</b><span id="spV">${t('Krijg je vinkje', 'Get your tick')}</span></button><button type="button" onclick="GLXSOC.video()"><b>🎬 ${t('Video', 'Video')}</b><span id="spVd">${t('Video-intro', 'Video intro')}</span></button></div>`;
      if (a) a.insertAdjacentHTML('afterend', html); else v.insertAdjacentHTML('afterbegin', html);
      loadMine().then(m => { if (!m) return; const b = $('spB'), r = $('spV'); if (b) b.textContent = (m.badges || []).length + ' ' + t('verdiend', 'earned') + (m.streak ? ' · 🔥 ' + m.streak : ''); if (r && m.real) r.textContent = t('Geverifieerd', 'Verified') });
    }
  }

  /* andermans profiel: vinkje, badges, video */
  async function onOther(c) {
    const sh = $('xSheet'); if (!sh || !c) return;
    if (c.real) { const h = sh.querySelector('h2'); if (h && !h.querySelector('.realTick')) h.insertAdjacentHTML('beforeend', `<span class="realTick" title="${t('Echt: selfie gecontroleerd', 'Real: selfie checked')}" aria-label="${t('Geverifieerd', 'Verified')}">✓</span>`) }
    const B = BADGES(), list = (c.badges || []).map(k => B.find(b => b[0] === k)).filter(Boolean);
    if ((list.length || c.streak) && !$('ooBadges')) {
      const html = `<div id="ooBadges" style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${c.streak ? `<span class="pill">🔥 ${c.streak} ${t('dagen', 'days')}</span>` : ''}${list.slice(0, 8).map(b => `<span class="pill" title="${esc(b[3])}">${b[1]} ${esc(b[2])}</span>`).join('')}</div>`;
      const anchor = $('exVoiceBtn') || sh.querySelector('h2'); if (anchor) anchor.insertAdjacentHTML('afterend', html);
    }
    if (c.video && !$('ooVideo')) {
      const anchor = $('ooBadges') || $('exVoiceBtn') || sh.querySelector('h2'); if (!anchor) return;
      anchor.insertAdjacentHTML('afterend', `<div class="vidBox" id="ooVideo"><video playsinline controls preload="metadata" aria-label="${t('Video-intro van', 'Video intro of')} ${esc(c.name)}"></video></div>`);
      try { const r = await db().storage.from('video').createSignedUrl(c.video.split('?')[0], 900); const vd = $('ooVideo') && $('ooVideo').querySelector('video'); if (vd && r.data) vd.src = r.data.signedUrl } catch (e) { }
    } else if (c.hasVideo && !c.video && !$('ooVideo')) {
      const anchor = $('ooBadges') || sh.querySelector('h2'); if (anchor) anchor.insertAdjacentHTML('afterend', `<p class="sub" id="ooVideo">🎬 ${t('Heeft een video-intro. Zichtbaar zodra jullie een match zijn.', 'Has a video intro. Visible once you match.')}</p>`);
    }
  }

  /* ==================== video-intro op je profiel ==================== */
  let vRec = null, vBlob = null, vStream = null, vFrames = [];
  async function video() {
    const d = db(); if (!d) return T(t('Nog niet verbonden', 'Not connected yet'));
    let card = null; try { card = (await d.rpc('profile_card', { target: uid() })).data } catch (e) { }
    const has = card && card.hasVideo, vis = (card && card.videoVis) || 'matches';
    xs('🎬 ' + t('Video-intro', 'Video intro'), `<p class="sub" style="margin-top:0">${t('Max. 15 seconden. Zeg hallo, vertel wat je graag doet. Echte video\'s geven veel meer matches dan foto\'s.', 'Max 15 seconds. Say hi, tell what you like doing.')}</p>
<div class="vidBox"><video id="vdPrev" playsinline muted style="transform:scaleX(-1)"></video></div>
<div id="vdTime" class="sub" style="text-align:center;min-height:20px"></div>
<div style="display:flex;gap:8px"><button class="btn" id="vdRec" style="flex:1" onclick="GLXSOC._vRec()">⏺ ${t('Opnemen', 'Record')}</button><button class="btn ghost" style="flex:1" onclick="GLXSOC._vPick()">📁 ${t('Kies video', 'Pick video')}</button></div>
<div style="margin-top:12px"><div style="font-size:14px;margin-bottom:6px">${t('Wie mag je video zien?', 'Who can see your video?')}</div><div style="display:flex;gap:6px">
<button class="btn sm ghost vdVis ${vis === 'matches' ? 'on' : ''}" data-v="matches" style="flex:1" onclick="GLXSOC._vVis(this)">💜 ${t('Alleen matches', 'Matches only')}</button>
<button class="btn sm ghost vdVis ${vis === 'iedereen' ? 'on' : ''}" data-v="iedereen" style="flex:1" onclick="GLXSOC._vVis(this)">✨ ${t('Iedereen in de buurt', 'Everyone nearby')}</button></div></div>
<button class="btn" id="vdSave" style="width:100%;margin-top:12px;display:none" onclick="GLXSOC._vSave()">✅ ${t('Opslaan op mijn profiel', 'Save to my profile')}</button>
${has ? `<button class="btn ghost" style="width:100%;margin-top:8px" onclick="GLXSOC._vDel()">🗑️ ${t('Mijn video verwijderen', 'Delete my video')}</button>` : ''}
<style>.vdVis.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent}</style>`, false);
    vBlob = null;
    if (has) { try { const r = await d.storage.from('video').createSignedUrl(uid() + '/intro', 600); const p = $('vdPrev'); if (p && r.data) { p.src = r.data.signedUrl; p.muted = false; p.controls = true; p.style.transform = '' } } catch (e) { } }
  }
  function vVis(b) { document.querySelectorAll('.vdVis').forEach(x => x.classList.toggle('on', x === b)); if (!vBlob) save(true) }
  async function vRecord() {
    if (vRec) { vRec.stop(); return }
    try {
      vStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 640 } }, audio: true });
      const p = $('vdPrev'); p.srcObject = vStream; p.muted = true; p.controls = false; p.style.transform = 'scaleX(-1)'; await p.play();
      const type = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4', 'video/webm'].find(x => MediaRecorder.isTypeSupported(x)) || '';
      const mr = new MediaRecorder(vStream, Object.assign({ videoBitsPerSecond: 900000, audioBitsPerSecond: 48000 }, type ? { mimeType: type } : {})), parts = []; vRec = mr; vFrames = [];
      mr.ondataavailable = e => e.data.size && parts.push(e.data);
      const t0 = Date.now(), tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); const el = $('vdTime'); if (el) el.textContent = '⏺ ' + s + ' / 15 s'; if ([2, 7, 12].includes(s) && vFrames.length < 3) grab(p) }, 250);
      mr.onstop = () => {
        clearInterval(tick); clearTimeout(mr._t); vRec = null; vStream.getTracks().forEach(x => x.stop());
        vBlob = new Blob(parts, { type: (mr.mimeType || 'video/webm').split(';')[0] });
        const pv = $('vdPrev'); if (pv) { pv.srcObject = null; pv.src = URL.createObjectURL(vBlob); pv.muted = false; pv.controls = true; pv.style.transform = '' }
        const b = $('vdRec'); if (b) b.textContent = '⏺ ' + t('Opnieuw', 'Again'); const s = $('vdSave'); if (s) s.style.display = ''; const el = $('vdTime'); if (el) el.textContent = t('Bekijk je video en sla op.', 'Check your video, then save.');
      };
      mr.start(); mr._t = setTimeout(() => { try { mr.stop() } catch (e) { } }, 15000);
      const b = $('vdRec'); if (b) b.textContent = '⏹ ' + t('Stop', 'Stop'); buzz(20);
    } catch (e) { T(t('Geen toegang tot je camera', 'No camera access')) }
  }
  function grab(v) { try { const c = document.createElement('canvas'); c.width = 224; c.height = 224; c.getContext('2d').drawImage(v, 0, 0, 224, 224); vFrames.push(c) } catch (e) { } }
  function vPick() {
    const f = document.createElement('input'); f.type = 'file'; f.accept = 'video/*';
    f.onchange = () => {
      const file = f.files && f.files[0]; if (!file) return;
      if (file.size > 6e6) return T(t('Te groot: max. 6 MB (ongeveer 15 seconden)', 'Too big: max 6 MB'));
      const p = $('vdPrev'); p.srcObject = null; p.src = URL.createObjectURL(file); p.muted = false; p.controls = true; p.style.transform = '';
      p.onloadedmetadata = async () => {
        if (p.duration > 16.5) { vBlob = null; return T(t('Te lang: max. 15 seconden', 'Too long: max 15 seconds')) }
        vBlob = file; vFrames = [];
        for (const at of [.15, .5, .85]) { await new Promise(ok => { p.onseeked = ok; p.currentTime = p.duration * at }); grab(p) } p.currentTime = 0;
        const s = $('vdSave'); if (s) s.style.display = '';
      };
    };
    f.click();
  }
  async function save(onlyVis) {
    const d = db(), vis = (document.querySelector('.vdVis.on') || {}).dataset ? document.querySelector('.vdVis.on').dataset.v : 'matches';
    if (onlyVis) { try { const c = (await d.rpc('profile_card', { target: uid() })).data; if (c && c.hasVideo) { await d.rpc('set_video', { has: true, vis }); T(t('Opgeslagen', 'Saved')) } } catch (e) { } return }
    if (!vBlob) return; const b = $('vdSave'); if (b) { b.disabled = true; b.textContent = t('Video controleren…', 'Checking video…') }
    try { for (const fr of vFrames) { if (naked(await nsfw(fr))) { if (b) { b.disabled = false; b.textContent = '✅ ' + t('Opslaan op mijn profiel', 'Save to my profile') } return T(t('Deze video lijkt naakt of seksueel en kan niet geplaatst worden', 'This video looks sexual and can\'t be posted')) } } } catch (e) { }
    if (b) b.textContent = t('Uploaden…', 'Uploading…');
    const type = (vBlob.type || 'video/webm').split(';')[0];
    const up = await d.storage.from('video').upload(uid() + '/intro', vBlob, { upsert: true, contentType: type });
    if (up.error) { if (b) { b.disabled = false; b.textContent = '✅ ' + t('Opslaan op mijn profiel', 'Save to my profile') } return T(/size|large|groot/i.test(up.error.message) ? t('Video te groot', 'Video too big') : t('Uploaden lukte niet', 'Upload failed')) }
    await d.rpc('set_video', { has: true, vis }); buzz([20, 60, 20]); try { closeO('xV') } catch (e) { } T('🎬 ' + t('Je video-intro staat op je profiel', 'Your video intro is on your profile'));
  }
  async function vDel() {
    if (!confirm(t('Je video-intro verwijderen?', 'Delete your video intro?'))) return; const d = db();
    await d.storage.from('video').remove([uid() + '/intro']); await d.rpc('set_video', { has: false }); try { closeO('xV') } catch (e) { } T(t('Verwijderd', 'Deleted'));
  }

  window.GLXSOC = {
    tour: () => tour(true), feedPush, badges, verify, video, streakChip, loadMine, chatOpen, chatClose, chatMedia, chatPhoto, chatVoice, chatReadPing, onOther,
    _tourNext: tourNext, _tourEnd: tourEnd, _verifyShoot: verifyShoot, _vRec: vRecord, _vPick: vPick, _vSave: () => save(false), _vVis: vVis, _vDel: vDel
  };

  /* Galaxy Extra-tegels */
  try { if (typeof HUB !== 'undefined' && !HUB.some(h => h[2] === 'GLXSOC.video()')) HUB.unshift(['🎬', 'Video-intro', 'GLXSOC.video()'], ['🪪', 'Echtheidscheck', 'GLXSOC.verify()'], ['🏅', 'Badges', 'GLXSOC.badges()']) } catch (e) { }
  /* haak op andermans profiel */
  const hookOther = () => { const E = window.GLXEXTRA; if (!E || E._socHook) return; const o = E.onProfile; E.onProfile = function (c) { try { o && o.apply(this, arguments) } catch (e) { } onOther(c) }; E._socHook = 1 };

  function run() { try { hookOther(); feedRowHook(); profileRow() } catch (e) { } }
  const boot = () => {
    links(); tourWatch(); run(); setTimeout(loadMine, 4000);
    new MutationObserver(() => { clearTimeout(boot.t); boot.t = setTimeout(run, 120) }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
