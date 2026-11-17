/* Galaxy – extra's:
   🎁 vrienden uitnodigen · 🎉 Galaxy-avonden in cafés (agenda, inchecken met QR) · 🎙️ spraakintro
   💃 emotes van je figuur op de kaart · 🌙 "uit vanavond" · 🛡️ veilig-thuis-check · ✅ leeftijdsbadge */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = m => { try { toast(m) } catch (e) { } };
  const nl = () => { try { return (typeof LANG === 'undefined' ? 'nl' : LANG) === 'nl' } catch (e) { return true } };
  const t = (a, b) => window.GLXL ? GLXL(a, b) : (nl() ? a : b);
  const net = () => window.GLXNET || {};
  const db = () => net().db;
  const uid = () => net().uid;
  const HOME = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  const buzz = p => { try { if (localStorage.glxHaptics !== '0' && navigator.vibrate) navigator.vibrate(p) } catch (e) { } };
  const strip = k => { try { const u = new URL(location.href); u.searchParams.delete(k); history.replaceState(null, '', u.pathname + (u.search || '') + u.hash) } catch (e) { } };
  const fmt = d => new Date(d).toLocaleString(nl() ? 'nl-BE' : undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const hm = d => new Date(d).toLocaleTimeString(nl() ? 'nl-BE' : undefined, { hour: '2-digit', minute: '2-digit' });
  const ready = () => { if (db()) return true; T(t('Even geduld: Galaxy maakt nog verbinding.', 'One moment: Galaxy is still connecting.')); return false };

  /* links van buitenaf: ?ref=CODE (uitnodiging), ?ev=<id> (QR van het café), ?safe=1 (veilig-thuis-melding) */
  let pendingEv = null, wantSafe = false, wantEvents = false;
  try {
    const q = new URLSearchParams(location.search);
    const r = (q.get('ref') || '').toUpperCase(); if (/^[A-Z2-9]{6}$/.test(r)) { localStorage.glxRef = r; strip('ref') }
    const e = q.get('ev') || ''; if (/^[0-9a-f-]{36}$/i.test(e)) { pendingEv = e; strip('ev') }
    if (q.get('safe') === '1') { wantSafe = true; strip('safe') }
    if (q.get('events') === '1') { wantEvents = true; strip('events') }
  } catch (e) { }

  const css = document.createElement('style');
  css.textContent = `
.exCard{background:var(--card,#16123a);border:1px solid var(--line,#2a2560);border-radius:18px;padding:14px;margin-bottom:10px}
.exRow{display:flex;justify-content:space-between;align-items:center;gap:10px}
.exBig{font-size:30px;font-weight:800;letter-spacing:2px;font-family:Syne,sans-serif}
.exChips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.exChip{padding:7px 12px;border-radius:99px;border:1px solid var(--line,#2a2560);background:transparent;color:inherit;font:inherit;font-size:13px}
.exChip.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent;color:#fff}
.exPill{display:inline-block;font-size:12px;padding:3px 9px;border-radius:99px;background:#8b5cf633}
#exSafeBar{position:fixed;left:10px;right:10px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:60;background:linear-gradient(135deg,#0f766e,#155e75);color:#fff;border-radius:16px;padding:10px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px #0008;font-size:13px}
#exSafeBar button{flex:none}
.exRec{width:84px;height:84px;border-radius:50%;border:0;background:linear-gradient(135deg,#ef4444,#ec4899);color:#fff;font-size:30px;margin:8px auto;display:block}
.exRec.on{animation:exPulse 1s infinite}@keyframes exPulse{50%{transform:scale(1.08);box-shadow:0 0 0 12px #ec489933}}
.exHeart{position:absolute;left:50%;bottom:120px;font-size:26px;pointer-events:none;animation:exUp 2.2s ease-out forwards}
@keyframes exUp{0%{opacity:0;transform:translate(-50%,0) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),-140px) scale(1.2)}}
.exEvPin{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:20px;background:linear-gradient(135deg,#8b5cf6,#ec4899);border:2px solid #fff;box-shadow:0 6px 18px #0008;cursor:pointer}
.exOut{padding:4px 8px;border-radius:99px;background:#1e1b4b;border:1px solid #fbbf24;color:#fde68a;font-size:12px;font-weight:700;box-shadow:0 0 18px #fbbf2466;white-space:nowrap;pointer-events:none}
.exVoice{display:flex;align-items:center;gap:10px;width:100%;margin-top:10px}
.exTicket{text-align:center;padding:22px 16px;border-radius:22px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff}
.exTicket .clock{font-size:34px;font-weight:800;font-variant-numeric:tabular-nums;margin-top:6px}
@media (prefers-reduced-motion:reduce){.exRec.on,.exHeart{animation:none}}`;
  document.head.appendChild(css);

  /* ==================== 🎁 vrienden uitnodigen ==================== */
  async function rewards() {
    try { const r = await db().rpc('my_ref'); if (r.data && r.data.new_coins > 0) { setCoins(r.data.new_coins); buzz([20, 60, 30]); T('🎁 +' + r.data.new_coins + ' ' + t('munten voor een uitnodiging!', 'coins for an invite!')) } return r.data } catch (e) { return null }
  }
  async function claimRef() {
    const code = localStorage.glxRef; if (!code || !db()) return;
    try {
      const r = await db().rpc('claim_ref', { code }); if (r.error) return; localStorage.removeItem('glxRef');
      if (r.data && r.data.ok) { await rewards(); T('🎁 ' + t('Welkom! Je kreeg 50 munten via ', 'Welcome! You got 50 coins via ') + (r.data.name || t('je vriend', 'your friend'))) }
    } catch (e) { }
  }
  async function invite() {
    if (!ready()) return; const r = await rewards() || {}; const link = HOME() + '?ref=' + (r.code || '');
    xs('🎁 ' + t('Vrienden uitnodigen', 'Invite friends'), `
<div class="exCard" style="text-align:center"><p class="sub">${t('Jouw code', 'Your code')}</p><div class="exBig">${esc(r.code || '…')}</div>
<p style="margin-top:8px">${t('Elke vriend die met jouw link of code begint: <b>jullie krijgen allebei 50 munten</b>.', 'Every friend who starts with your link or code: <b>you both get 50 coins</b>.')}</p>
<p class="sub" style="margin-top:6px">${t('Al binnengebracht', 'Brought in so far')}: <b>${r.friends || 0}</b> · ${t('max. 20 beloningen', 'max. 20 rewards')}</p></div>
<button class="btn" style="width:100%" onclick="GLXEXTRA._share()">📤 ${t('Deel je uitnodiging', 'Share your invite')}</button>
<button class="btn ghost" style="width:100%;margin-top:8px" onclick="GLXEXTRA._copy()">📋 ${t('Kopieer link', 'Copy link')}</button>
<div class="exCard" style="margin-top:14px"><b>${t('Kreeg jij een code van een vriend?', 'Got a code from a friend?')}</b><p class="sub" style="margin:4px 0 8px">${t('Kan tot 14 dagen nadat je je profiel maakte.', 'Possible up to 14 days after you made your profile.')}</p>
<div class="exRow"><input class="fld" id="exRefIn" maxlength="6" placeholder="ABC234" style="margin:0;text-transform:uppercase;letter-spacing:2px"><button class="btn sm" onclick="GLXEXTRA._claim()">${t('Gebruik', 'Use')}</button></div></div>`, false);
    window.GLXEXTRA._link = link;
  }
  async function shareInvite() {
    const link = window.GLXEXTRA._link, txt = t('Kom ook op Galaxy! Ontmoet mensen in de buurt op een live kaart, met je eigen 3D-figuur. Met mijn link krijgen we allebei 50 munten ✦ ', 'Join me on Galaxy! Meet people nearby on a live map with your own 3D figure. With my link we both get 50 coins ✦ ') + link;
    try { if (navigator.share) await navigator.share({ title: 'Galaxy', text: txt }); else window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener') } catch (e) { }
  }
  async function claimTyped() {
    const v = (($('exRefIn') || {}).value || '').trim().toUpperCase(); if (!/^[A-Z2-9]{6}$/.test(v)) return T(t('Een code heeft 6 tekens', 'A code has 6 characters'));
    const r = await db().rpc('claim_ref', { code: v }); const d = r.data || {};
    if (d.ok) { await rewards(); T('🎁 ' + t('Gelukt! Jij en ', 'Done! You and ') + (d.name || '') + t(' krijgen 50 munten', ' get 50 coins')); invite() }
    else T({ al: t('Je gebruikte al een code', 'You already used a code'), te_laat: t('Dit kan alleen in je eerste 14 dagen', 'Only possible in your first 14 days'), onbekend: t('Die code bestaat niet', 'That code does not exist') }[d.why] || t('Dat lukte niet', 'That did not work'));
  }

  /* ==================== 🎉 Galaxy-avonden ==================== */
  let events = [], evMarkers = [];
  async function loadEvents() { try { const r = await db().rpc('upcoming_events'); events = (r.data || []).map(x => x.upcoming_events || x); drawEvMarkers() } catch (e) { } return events }
  const live = e => Date.now() >= new Date(e.starts_at) - 36e5 && Date.now() <= new Date(e.ends_at);
  async function agenda() {
    if (!ready()) return; await loadEvents();
    const card = e => `<div class="exCard"><div class="exRow"><b style="font-size:17px">🎉 ${esc(e.venue)}</b>${live(e) ? '<span class="exPill" style="background:#16a34a55">● ' + t('nu bezig', 'happening now') + '</span>' : ''}</div>
<p style="margin-top:6px">📅 ${esc(fmt(e.starts_at))} – ${esc(hm(e.ends_at))}</p>${e.address ? `<p class="sub">📍 ${esc(e.address)}</p>` : ''}
${e.offer ? `<p style="margin-top:6px">🎁 ${t('Wie incheckt', 'Check in and get')}: <b>${esc(e.offer)}</b></p>` : ''}${e.note ? `<p class="sub" style="margin-top:4px">${esc(e.note)}</p>` : ''}
<p class="sub" style="margin-top:6px">👥 ${e.going} ${t(e.going === 1 ? 'persoon gaat' : 'mensen gaan', e.going === 1 ? 'person going' : 'people going')}</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
${e.checked_in ? `<button class="btn sm" onclick="GLXEXTRA._ticket('${e.id}')">🎟️ ${t('Mijn incheck', 'My check-in')}</button>` : live(e) ? `<button class="btn sm" onclick="GLXEXTRA._checkin('${e.id}')">✅ ${t('Ik ben er: inchecken', "I'm here: check in")}</button>` : `<button class="btn sm${e.me_going ? ' ghost' : ''}" onclick="GLXEXTRA._going('${e.id}',${!e.me_going})">${e.me_going ? '✓ ' + t('Ik ga', "I'm going") : '🙋 ' + t('Ik ga!', "I'll go!")}</button>`}
<button class="btn sm ghost" onclick="GLXEXTRA._show('${e.id}')">🗺️ ${t('Op de kaart', 'On the map')}</button></div></div>`;
    xs('🎉 ' + t('Galaxy-avonden', 'Galaxy nights'), (events.length ? events.map(card).join('') : `<div class="exCard" style="text-align:center"><div style="font-size:40px">🌙</div><p>${t('Nog geen Galaxy-avonden gepland.', 'No Galaxy nights planned yet.')}</p><p class="sub" style="margin-top:6px">${t('Ken je een café dat wil meedoen? Mail', 'Know a bar that wants to join? Email')} galaxy.app.xv@gmail.com</p></div>`) +
      `<p class="sub" style="margin-top:6px">${t('Ter plaatse scan je de QR-code van het café om in te checken. Anderen zien alleen hoeveel mensen gaan, nooit wie.', 'At the bar, scan its QR code to check in. Others only see how many people go, never who.')}</p>`, false);
  }
  async function going(id, yes) {
    const r = yes ? await db().from('event_going').insert({ event_id: id }) : await db().from('event_going').delete().eq('event_id', id).eq('user_id', uid());
    if (r.error && r.error.code !== '23505') return T(t('Dat lukte niet', 'That did not work')); buzz(10); agenda();
  }
  async function checkin(id) {
    if (!db()) { pendingEv = id; return }
    const r = await db().rpc('event_checkin', { ev: id }); const d = r.data || {};
    if (!d.ok) return T({ te_vroeg: t('Inchecken kan vanaf een uur voor de start', 'Check-in opens one hour before the start'), voorbij: t('Deze Galaxy-avond is voorbij', 'This Galaxy night is over'), onbekend: t('Deze avond bestaat niet meer', 'This night no longer exists') }[d.why] || t('Inchecken lukte niet', 'Check-in failed'));
    buzz([30, 60, 30, 60, 60]); await loadEvents(); ticket(id, d);
  }
  let tickT = null;
  function ticket(id, d) {
    const e = events.find(x => x.id === id) || {}; d = d || {};
    xs('🎟️ ' + t('Ingecheckt', 'Checked in'), `<div class="exTicket"><div style="font-size:15px;opacity:.9">${t('Ingecheckt bij', 'Checked in at')}</div><div style="font-size:26px;font-weight:800;margin-top:4px">${esc(d.venue || e.venue || '')}</div>
<div class="clock" id="exClock">${hm(new Date())}</div><div style="font-size:12px;opacity:.85">${t('live klok: zo zien ze aan de bar dat het geen screenshot is', 'live clock: shows the bar it is not a screenshot')}</div>
${(d.offer || e.offer) ? `<div style="margin-top:14px;padding:12px;border-radius:14px;background:#ffffff26"><div style="font-size:12px;opacity:.9">${t('Toon dit aan de bar', 'Show this at the bar')}</div><div style="font-size:20px;font-weight:800">🎁 ${esc(d.offer || e.offer)}</div></div>` : ''}</div>
<button class="btn" style="width:100%;margin-top:12px" onclick="GLXEXTRA._ice('${id}')">🧊 ${t('IJsbrekers van de avond', "Tonight's icebreakers")}</button>
<button class="btn ghost" style="width:100%;margin-top:8px" onclick="closeO('xV');go('map')">🗺️ ${t('Zie wie er is', "See who's here")}</button>`, false);
    clearInterval(tickT); tickT = setInterval(() => { const c = $('exClock'); if (!c) return clearInterval(tickT); const n = new Date(); c.textContent = n.toLocaleTimeString(nl() ? 'nl-BE' : undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }, 1000);
  }
  function showEv(id) {
    const e = events.find(x => x.id === id), m = window.GLXMAP && GLXMAP.map; if (!e) return;
    try { closeO('xV') } catch (x) { } try { go('map') } catch (x) { }
    setTimeout(() => { const mm = window.GLXMAP && GLXMAP.map; if (mm) mm.flyTo({ center: [e.lng, e.lat], zoom: 16.5, pitch: 55 }) }, 400);
  }
  function drawEvMarkers() {
    const m = window.GLXMAP && GLXMAP.map; if (!m || !window.maplibregl) return;
    evMarkers.forEach(x => x.remove()); evMarkers = [];
    events.forEach(e => {
      const el = document.createElement('button'); el.className = 'exEvPin'; el.type = 'button'; el.setAttribute('aria-label', 'Galaxy-avond ' + e.venue); el.textContent = '🎉';
      el.onclick = ev => { ev.stopPropagation(); agenda() };
      evMarkers.push(new maplibregl.Marker({ element: el }).setLngLat([e.lng, e.lat]).addTo(m));
    });
  }

  /* ==================== 🎙️ spraakintro ==================== */
  let rec = null, chunks = [], recBlob = null, recT = null;
  function voice() {
    if (!ready()) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) return T(t('Je toestel kan hier geen geluid opnemen', 'Your device cannot record audio here'));
    xs('🎙️ ' + t('Spraakintro', 'Voice intro'), `<p class="sub">${t('Zeg in maximaal 15 seconden wie je bent of waar je zin in hebt. Matches en mensen in de buurt kunnen het beluisteren op je profiel.', 'Say who you are or what you feel like, in up to 15 seconds. Matches and people nearby can listen on your profile.')}</p>
<button class="exRec" id="exRec" aria-label="${t('Opnemen', 'Record')}" onclick="GLXEXTRA._rec()">🎙️</button>
<p style="text-align:center;font-size:20px;font-weight:800" id="exRecT">0:15</p>
<div id="exRecDone" style="display:none"><audio id="exRecA" controls style="width:100%"></audio>
<button class="btn" style="width:100%;margin-top:10px" onclick="GLXEXTRA._saveVoice()">✅ ${t('Op mijn profiel zetten', 'Put on my profile')}</button></div>
<button class="btn sm ghost" style="width:100%;margin-top:10px;color:#fb7185" onclick="GLXEXTRA._delVoice()">🗑️ ${t('Mijn spraakintro verwijderen', 'Delete my voice intro')}</button>
<p class="sub" style="font-size:12px;margin-top:8px">${t('Geen beledigingen of seksuele inhoud: zulke intro’s worden verwijderd en kunnen tot een schorsing leiden.', 'No insults or sexual content: such intros are removed and can lead to suspension.')}</p>`, false);
  }
  async function recToggle() {
    const b = $('exRec');
    if (rec && rec.state === 'recording') { rec.stop(); return }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find(x => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x)) || '';
      rec = new MediaRecorder(s, type ? { mimeType: type, audioBitsPerSecond: 48000 } : undefined); chunks = [];
      rec.ondataavailable = e => e.data.size && chunks.push(e.data);
      rec.onstop = () => { s.getTracks().forEach(x => x.stop()); clearInterval(recT); b && b.classList.remove('on'); if (b) b.textContent = '🎙️'; recBlob = new Blob(chunks, { type: (rec.mimeType || 'audio/webm').split(';')[0] }); const a = $('exRecA'); if (a) { a.src = URL.createObjectURL(recBlob); $('exRecDone').style.display = '' } };
      rec.start(); b.classList.add('on'); b.textContent = '⏹️'; let left = 15; $('exRecT').textContent = '0:15';
      recT = setInterval(() => { left--; const el = $('exRecT'); if (el) el.textContent = '0:' + String(Math.max(0, left)).padStart(2, '0'); if (left <= 0 && rec.state === 'recording') rec.stop() }, 1000);
    } catch (e) { T(t('Geef Galaxy toegang tot je microfoon om op te nemen', 'Allow microphone access to record')) }
  }
  async function saveVoice() {
    if (!recBlob || recBlob.size < 2000) return T(t('Neem eerst iets op', 'Record something first'));
    if (recBlob.size > 600000) return T(t('Te lang, probeer korter', 'Too long, try shorter'));
    const up = await db().storage.from('voice').upload(uid() + '/intro', recBlob, { upsert: true, contentType: recBlob.type || 'audio/webm' });
    if (up.error) return T(t('Opslaan lukte niet', 'Saving failed'));
    await db().rpc('set_voice', { has: true }); buzz([20, 60, 30]); T('🎙️ ' + t('Je spraakintro staat op je profiel', 'Your voice intro is on your profile')); try { closeO('xV') } catch (e) { }
  }
  async function delVoice() {
    if (!confirm(t('Je spraakintro verwijderen?', 'Delete your voice intro?'))) return;
    await db().storage.from('voice').remove([uid() + '/intro']); await db().rpc('set_voice', { has: false }); T(t('Verwijderd', 'Deleted')); try { closeO('xV') } catch (e) { }
  }
  let playing = null;
  async function play(path, btn) {
    try {
      if (playing) { playing.pause(); playing = null; if (btn) btn.textContent = '▶️ ' + t('Beluister de spraakintro', 'Play voice intro'); return }
      const r = await db().storage.from('voice').createSignedUrl(path.split('?')[0], 300); if (r.error) throw r.error;
      playing = new Audio(r.data.signedUrl); playing.onended = () => { playing = null; if (btn) btn.textContent = '▶️ ' + t('Beluister de spraakintro', 'Play voice intro') };
      await playing.play(); if (btn) btn.textContent = '⏸️ ' + t('Stop', 'Stop');
    } catch (e) { playing = null; T(t('Afspelen lukte niet', 'Playback failed')) }
  }
  function onProfile(c) {
    const sh = $('xSheet'); if (!sh || !c) return; showPhoto(c);
    if (c.voice && !$('exVoiceBtn')) {
      const h = sh.querySelector('h2,h3,.pHead') || sh.firstElementChild;
      const html = `<button class="btn ghost exVoice" id="exVoiceBtn" type="button">▶️ ${t('Beluister de spraakintro', 'Play voice intro')}</button>`;
      if (h) h.insertAdjacentHTML('afterend', html); else sh.insertAdjacentHTML('afterbegin', html);
      $('exVoiceBtn').onclick = function () { play(c.voice, this) };
    }
  }

  /* ==================== 💃 emotes op de kaart ==================== */
  function hearts() {
    const mk = window.GLXMAP && GLXMAP.meMarker, el = mk && mk.getElement && mk.getElement(); if (!el) return;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    for (let i = 0; i < 6; i++) setTimeout(() => { const h = document.createElement('span'); h.className = 'exHeart'; h.textContent = ['💖', '💜', '✨'][i % 3]; h.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px'); el.appendChild(h); setTimeout(() => h.remove(), 2300) }, i * 160);
  }
  function emote(n) {
    const av = window.GLXMAP && GLXMAP.av; try { closeO('xV') } catch (e) { }
    if (!av || !av.emote) { try { go('map') } catch (e) { } return T(t('Open de kaart om je figuur te zien', 'Open the map to see your figure')) }
    av.emote(n === 'heart' ? 'wave' : n); if (n === 'heart') hearts(); buzz(n === 'dance' ? [30, 80, 30, 80, 30] : [20, 60, 20]);
  }
  function emotes() {
    xs('💃 ' + t('Laat je figuur iets doen', 'Make your figure do something'), `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
<button class="btn ghost" style="padding:16px 6px" onclick="GLXEXTRA.emote('wave')"><div style="font-size:30px">👋</div>${t('Zwaaien', 'Wave')}</button>
<button class="btn ghost" style="padding:16px 6px" onclick="GLXEXTRA.emote('dance')"><div style="font-size:30px">💃</div>${t('Dansen', 'Dance')}</button>
<button class="btn ghost" style="padding:16px 6px" onclick="GLXEXTRA.emote('heart')"><div style="font-size:30px">💖</div>${t('Hartjes', 'Hearts')}</button></div>`, false);
  }

  /* ==================== 🌙 uit vanavond ==================== */
  let myOut = null, outPick = { h: 4, note: '' }, outMarkers = [], outT = null;
  const NOTES = () => [t('Zin in een pintje', 'Up for a drink'), t('Ik ga dansen', 'Going dancing'), t('Iets eten', 'Grabbing food'), t('Open voor alles', 'Open to anything')];
  async function loadOut() { try { const r = await db().from('profiles').select('out_until,out_note').eq('id', uid()).maybeSingle(); myOut = r.data && r.data.out_until && new Date(r.data.out_until) > new Date() ? r.data : null } catch (e) { } return myOut }
  async function out() {
    if (!ready()) return; await loadOut();
    xs('🌙 ' + t('Uit vanavond', 'Out tonight'), myOut ? `<div class="exCard" style="text-align:center;border-color:#fbbf24"><div style="font-size:40px">🌙</div><b>${t('Je staat op "uit vanavond"', 'You are "out tonight"')}</b><p class="sub" style="margin-top:4px">${t('tot', 'until')} ${esc(hm(myOut.out_until))}${myOut.out_note ? ' · ' + esc(myOut.out_note) : ''}</p></div>
<button class="btn ghost" style="width:100%" onclick="GLXEXTRA._out(0)">${t('Stop', 'Stop')}</button>` : `<p class="sub">${t('Laat mensen in de buurt zien dat je vanavond uit bent en open staat om iemand te ontmoeten. Op de kaart gloeit je zone, op je profiel staat een badge. Je exacte plek blijft geheim.', 'Show people nearby you are out tonight and open to meeting someone. Your zone glows on the map and your profile gets a badge. Your exact spot stays secret.')}</p>
<div class="sub" style="margin-top:12px">${t('Waar heb je zin in?', 'What are you up for?')}</div><div class="exChips">${NOTES().map(n => `<button class="exChip${outPick.note === n ? ' on' : ''}" onclick="GLXEXTRA._outNote(this,'${esc(n)}')">${esc(n)}</button>`).join('')}</div>
<div class="sub" style="margin-top:12px">${t('Hoe lang?', 'How long?')}</div><div class="exChips">${[2, 4, 6].map(h => `<button class="exChip${outPick.h === h ? ' on' : ''}" onclick="GLXEXTRA._outH(this,${h})">${h} ${t('uur', 'hours')}</button>`).join('')}</div>
<button class="btn" style="width:100%;margin-top:16px" onclick="GLXEXTRA._out(1)">🌙 ${t('Ik ben uit vanavond', "I'm out tonight")}</button>`, false);
  }
  async function setOut(on) {
    const r = await db().rpc('set_out', on ? { hours: outPick.h, note: outPick.note || null } : { hours: 0 });
    if (r.error) return T(t('Dat lukte niet', 'That did not work'));
    buzz(20); T(on ? '🌙 ' + t('Je bent "uit vanavond"', 'You are "out tonight"') : t('"Uit vanavond" staat uit', '"Out tonight" is off')); try { closeO('xV') } catch (e) { } loadOut();
  }
  async function outZones() {
    const m = window.GLXMAP && GLXMAP.map; if (!m || !db() || !window.maplibregl) return;
    if (m.getZoom() < 11) { outMarkers.forEach(x => x.remove()); outMarkers = []; return }
    try {
      const b = m.getBounds(), r = await db().rpc('out_zones', { min_lat: b.getSouth(), min_lng: b.getWest(), max_lat: b.getNorth(), max_lng: b.getEast() });
      outMarkers.forEach(x => x.remove()); outMarkers = [];
      (r.data || []).map(x => x.out_zones || x).forEach(z => { const el = document.createElement('div'); el.className = 'exOut'; el.textContent = '🌙 ' + z.n + ' ' + t('uit', 'out'); outMarkers.push(new maplibregl.Marker({ element: el, offset: [0, -70] }).setLngLat([z.lng, z.lat]).addTo(m)) });
    } catch (e) { }
  }

  /* ==================== 🛡️ veilig-thuis-check ==================== */
  let safeCur = null;
  async function loadSafe() { try { const r = await db().rpc('safe_mine'); safeCur = r.data || null } catch (e) { } drawSafeBar(); return safeCur }
  function drawSafeBar() {
    let b = $('exSafeBar');
    if (!safeCur) { if (b) b.remove(); return }
    if (!b) { document.body.insertAdjacentHTML('beforeend', '<div id="exSafeBar" role="status"></div>'); b = $('exSafeBar') }
    const late = new Date(safeCur.due_at) < new Date();
    b.style.background = late ? 'linear-gradient(135deg,#b45309,#be123c)' : '';
    b.innerHTML = `<span style="font-size:20px">🛡️</span><span style="flex:1">${late ? t('<b>Ben je veilig thuis?</b>', '<b>Are you home safe?</b>') : t('Veilig-thuis-check tot', 'Home-safe check until') + ' <b>' + esc(hm(safeCur.due_at)) + '</b>'}${safeCur.contact_name ? '<br><span style="opacity:.85">' + t('Contact', 'Contact') + ': ' + esc(safeCur.contact_name) + '</span>' : ''}</span><button class="btn sm" onclick="GLXEXTRA._safeDone()">✅ ${t('Veilig thuis', 'Home safe')}</button>`;
  }
  async function safeOpen(due) {
    if (!ready()) return; await loadSafe();
    let ms = []; try { const r = await db().rpc('my_matches'); ms = (r.data || []).map(x => x.my_matches || x).filter(Boolean) } catch (e) { }
    const d = due ? new Date(due) : new Date(Date.now() + 3 * 36e5); const loc = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    xs('🛡️ ' + t('Veilig-thuis-check', 'Home-safe check'), `<p class="sub">${t('Op het uur dat je kiest, vraagt Galaxy of je veilig thuis bent. Meld je je 20 minuten later nog niet, dan krijgt je contactpersoon een melding.', 'At the time you pick, Galaxy asks if you are home safe. If you have not answered 20 minutes later, your contact gets a notification.')}</p>
<label class="sub" style="display:block;margin-top:12px">${t('Ik ben thuis rond', "I'll be home around")}</label><input class="fld" id="exSafeT" type="datetime-local" value="${loc}" style="margin:4px 0 0">
<label class="sub" style="display:block;margin-top:12px">${t('Contactpersoon in Galaxy (een van je matches)', 'Contact in Galaxy (one of your matches)')}</label>
<select class="fld" id="exSafeC" style="margin:4px 0 0"><option value="">${t('Geen: alleen een herinnering voor mezelf', 'None: only a reminder for me')}</option>${ms.map(m => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select>
<label style="display:flex;gap:10px;align-items:center;margin-top:12px;font-size:14px"><input type="checkbox" id="exSafeW" checked style="accent-color:#ec4899"> ${t('Stuur ook een vriend(in) buiten Galaxy een berichtje', 'Also send a friend outside Galaxy a message')}</label>
<button class="btn" style="width:100%;margin-top:16px" onclick="GLXEXTRA._safeStart()">🛡️ ${t('Start de check', 'Start the check')}</button>
<p class="sub" style="font-size:11px;margin-top:8px">${t('Werkt het best met meldingen aan. Bij acuut gevaar: bel 112.', 'Works best with notifications on. In danger: call 112.')}</p>`, false);
  }
  async function safeStart() {
    const v = ($('exSafeT') || {}).value, c = ($('exSafeC') || {}).value || null, w = ($('exSafeW') || {}).checked; const due = new Date(v);
    if (!v || isNaN(due) || due < new Date(Date.now() + 5 * 6e4)) return T(t('Kies een uur minstens 5 minuten later', 'Pick a time at least 5 minutes from now'));
    if (due > new Date(Date.now() + 23 * 36e5)) return T(t('Maximaal 23 uur vooruit', 'Max 23 hours ahead'));
    const r = await db().rpc('safe_start', { due: due.toISOString(), contact: c, note: null });
    if (r.error) return T(t('Starten lukte niet', 'Could not start'));
    buzz([20, 60, 30]); T('🛡️ ' + t('Check gestart tot', 'Check started until') + ' ' + hm(due)); try { closeO('xV') } catch (e) { } loadSafe();
    if (!('Notification' in window) || Notification.permission !== 'granted') setTimeout(() => T(t('Tip: zet meldingen aan in Instellingen, dan krijg je de herinnering ook als de app dicht is', 'Tip: turn on notifications in Settings so you get the reminder when the app is closed')), 2500);
    if (w) { const txt = t(`Hey! Ik heb een date. Ik laat je rond ${hm(due)} weten dat ik veilig thuis ben. Hoor je niets van me, bel me dan even 💜`, `Hey! I have a date. I'll let you know around ${hm(due)} that I'm home safe. If you don't hear from me, please call 💜`); try { if (navigator.share) await navigator.share({ text: txt }); else window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener') } catch (e) { } }
  }
  async function safeDone() {
    await db().rpc('safe_done'); safeCur = null; drawSafeBar(); buzz([20, 60, 30]); T('💜 ' + t('Fijn dat je veilig thuis bent!', 'Glad you are home safe!'));
  }
  /* knop in een bevestigde date erbij zetten */
  function hookDate() {
    const sh = $('xSheet'); if (!sh || $('exSafeDateBtn')) return;
    const b = sh.querySelector('[onclick^="GLXDATE._safe"]'); if (!b) return;
    const card = b.closest('.dpCard') || b.parentElement;
    card.insertAdjacentHTML('beforeend', `<button class="btn sm" id="exSafeDateBtn" style="width:100%;margin-top:8px">🛡️ ${t('Veilig-thuis-check starten', 'Start home-safe check')}</button>`);
    $('exSafeDateBtn').onclick = () => safeOpen(null);
  }

  /* ==================== 🧊 ijsbrekers op een Galaxy-avond ==================== */
  const QS = () => nl() ? ['Wat is het beste concert waar je ooit was?', 'Welk liedje zet jij op als het feest begint?', 'Wat is jouw verborgen talent?', 'Welke plek in België moet iedereen eens zien?', 'Wat zou je doen met een vrije dag morgen?', 'Wat is het raarste wat je ooit at?', 'Welke serie kan je eindeloos herbekijken?', 'Ben je meer van de zee of van de bergen?', 'Wat is je beste reisverhaal?', 'Welk spel win jij altijd?']
    : ['Best concert you ever went to?', 'Which song do you play when the party starts?', 'What is your hidden talent?', 'Which place should everyone visit once?', 'What would you do with a free day tomorrow?', 'Weirdest thing you ever ate?', 'Which series could you rewatch forever?', 'Beach or mountains?', 'Your best travel story?', 'Which game do you always win?'];
  const BINGO = () => nl() ? ['al eens in Japan was', 'een hond heeft', 'een instrument speelt', 'vandaag jarig is of deze maand', 'dezelfde favoriete serie heeft', 'in een andere stad woont', 'kan koken', 'graag danst', 'deze week sportte']
    : ['has been to Japan', 'has a dog', 'plays an instrument', 'has a birthday this month', 'likes the same series', 'lives in another city', 'can cook', 'loves dancing', 'did sports this week'];
  const hsh = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h };
  function ice(id) {
    const qs = QS(), q = qs[hsh(id + new Date().toDateString()) % qs.length], key = 'glxBingo_' + id; let got = []; try { got = JSON.parse(localStorage[key] || '[]') } catch (e) { }
    const all = BINGO();
    xs('🧊 ' + t('IJsbrekers van de avond', "Tonight's icebreakers"), `<div class="exCard" style="text-align:center"><div class="sub">${t('Vraag van de avond', 'Question of the night')}</div><p style="font-size:20px;font-weight:800;margin-top:6px">${esc(q)}</p><p class="sub" style="margin-top:6px">${t('Iedereen die incheckte, ziet dezelfde vraag. Een makkelijk begin van een gesprek.', 'Everyone who checked in sees the same question. An easy way to start talking.')}</p></div>
<div class="exCard"><b>🎯 Galaxy-bingo</b><p class="sub" style="margin:4px 0 10px">${t('Zoek iemand die…', 'Find someone who…')} ${t('Tik een vakje aan als je iemand vond.', 'Tap a square when you found someone.')}</p>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${all.map((b, i) => `<button type="button" class="exChip${got.includes(i) ? ' on' : ''}" style="border-radius:12px;min-height:66px;font-size:12px" onclick="GLXEXTRA._bingo('${id}',${i})">${esc(b)}</button>`).join('')}</div>
<p class="sub" style="margin-top:8px;text-align:center">${got.length}/9${got.length === 9 ? ' · 🎉 ' + t('Bingo! Toon dit aan de bar voor een high five', 'Bingo! Show this at the bar for a high five') : ''}</p></div>`, false);
  }
  function bingo(id, i) { const key = 'glxBingo_' + id; let got = []; try { got = JSON.parse(localStorage[key] || '[]') } catch (e) { } got = got.includes(i) ? got.filter(x => x !== i) : got.concat(i); try { localStorage[key] = JSON.stringify(got) } catch (e) { } buzz(got.length === 9 ? [40, 80, 40, 80, 120] : 10); ice(id) }

  /* ==================== 📷 echte foto (alleen voor matches) ==================== */
  function photo() {
    if (!ready()) return;
    xs('📷 ' + t('Mijn foto', 'My photo'), `<p class="sub">${t('Je figuur blijft je gezicht op de kaart. Een echte foto zien <b>alleen je matches</b>, zodat ze weten wie ze ontmoeten.', 'Your figure stays your face on the map. A real photo is <b>only shown to your matches</b>, so they know who they are meeting.')}</p>
<div id="exPhPrev" style="margin:12px 0;text-align:center"></div>
<label class="btn" style="display:block;width:100%;text-align:center;cursor:pointer">📷 ${t('Kies of maak een foto', 'Choose or take a photo')}<input type="file" accept="image/*" id="exPhIn" style="display:none"></label>
<button class="btn sm ghost" style="width:100%;margin-top:8px;color:#fb7185" onclick="GLXEXTRA._delPhoto()">🗑️ ${t('Mijn foto verwijderen', 'Delete my photo')}</button>
<p class="sub" style="font-size:12px;margin-top:8px">${t('Alleen jezelf, duidelijk herkenbaar. Geen naaktheid, geen kinderen, geen foto’s van anderen: zulke foto’s worden verwijderd en kunnen tot een schorsing leiden.', 'Only you, clearly recognisable. No nudity, no children, no photos of others: such photos are removed and can lead to suspension.')}</p>`, false);
    myPhoto().then(u => { const p = $('exPhPrev'); if (p && u) p.innerHTML = `<img src="${u}" alt="${t('Mijn foto', 'My photo')}" style="width:180px;height:180px;object-fit:cover;border-radius:20px">` });
    $('exPhIn').onchange = e => { const f = e.target.files && e.target.files[0]; if (f) savePhoto(f) };
  }
  async function myPhoto() { try { const r = await db().from('profiles').select('photo_at').eq('id', uid()).maybeSingle(); if (!r.data || !r.data.photo_at) return null; const s = await db().storage.from('photos').createSignedUrl(uid() + '/photo', 300); return s.data && s.data.signedUrl } catch (e) { return null } }
  async function savePhoto(file) {
    if (!/^image\//.test(file.type)) return T(t('Kies een foto', 'Choose a photo'));
    try {
      const img = await createImageBitmap(file); const k = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', .82));
      const up = await db().storage.from('photos').upload(uid() + '/photo', blob, { upsert: true, contentType: 'image/jpeg' }); if (up.error) throw up.error;
      await db().rpc('set_photo', { has: true }); buzz([20, 60, 30]); T('📷 ' + t('Je foto staat erop. Alleen je matches zien ze.', 'Photo saved. Only your matches can see it.')); photo();
    } catch (e) { T(t('Opslaan lukte niet. Probeer een andere foto.', 'Saving failed. Try another photo.')) }
  }
  async function delPhoto() { if (!confirm(t('Je foto verwijderen?', 'Delete your photo?'))) return; await db().storage.from('photos').remove([uid() + '/photo']); await db().rpc('set_photo', { has: false }); T(t('Verwijderd', 'Deleted')); photo() }
  async function showPhoto(c) {
    const sh = $('xSheet'); if (!sh || $('exPhoto')) return;
    if (c.photo) {
      try { const s = await db().storage.from('photos').createSignedUrl(c.photo.split('?')[0], 300); if (!s.data) return;
        sh.insertAdjacentHTML('afterbegin', `<div id="exPhoto" style="text-align:center;margin-bottom:10px"><img src="${s.data.signedUrl}" alt="${t('Foto van', 'Photo of')} ${esc(c.name)}" style="width:100%;max-height:340px;object-fit:cover;border-radius:20px"><div class="sub" style="margin-top:4px">📷 ${t('Alleen zichtbaar voor matches', 'Only visible to matches')}</div></div>`) } catch (e) { }
    } else if (c.hasPhoto && !c.matched) sh.insertAdjacentHTML('afterbegin', `<div id="exPhoto" class="exCard" style="text-align:center;padding:10px"><span class="sub">📷 ${esc(c.name)} ${t('heeft een foto. Die zie je na een match.', 'has a photo. You will see it after a match.')}</span></div>`);
  }

  /* ==================== in de app haken ==================== */
  window.GLXEXTRA = {
    invite, agenda, voice, emote, emotes, out, safe: safeOpen, onProfile, _link: '',
    _share: shareInvite, _copy() { try { navigator.clipboard.writeText(window.GLXEXTRA._link); T('📋 ' + t('Link gekopieerd', 'Link copied')) } catch (e) { } }, _claim: claimTyped,
    _going: going, _checkin: checkin, _ticket: id => ticket(id), _show: showEv,
    _rec: recToggle, _saveVoice: saveVoice, _delVoice: delVoice,
    _out: on => setOut(!!on), _outNote(b, n) { outPick.note = outPick.note === n ? '' : n; b.parentElement.querySelectorAll('.exChip').forEach(x => x.classList.toggle('on', x === b && !!outPick.note)) }, _outH(b, h) { outPick.h = h; b.parentElement.querySelectorAll('.exChip').forEach(x => x.classList.toggle('on', x === b)) },
    _safeStart: safeStart, _safeDone: safeDone, photo, _delPhoto: delPhoto, _ice: ice, _bingo: bingo
  };

  function addHub() {
    try {
      if (typeof HUB === 'undefined') return;
      const add = (i, n, f) => { if (!HUB.some(h => h[2] === f)) HUB.unshift([i, n, f]) };
      add('🛡️', t('Veilig thuis', 'Home safe'), 'GLXEXTRA.safe()');
      add('📷', t('Mijn foto', 'My photo'), 'GLXEXTRA.photo()');
      add('🎙️', t('Spraakintro', 'Voice intro'), 'GLXEXTRA.voice()');
      add('💃', t('Emotes', 'Emotes'), 'GLXEXTRA.emotes()');
      add('🌙', t('Uit vanavond', 'Out tonight'), 'GLXEXTRA.out()');
      add('🎁', t('Uitnodigen', 'Invite'), 'GLXEXTRA.invite()');
      add('🎉', t('Galaxy-avonden', 'Galaxy nights'), 'GLXEXTRA.agenda()');
    } catch (e) { }
  }
  function addMapButtons() {
    const side = document.querySelector('.gmSide'); if (!side || $('exOutBtn')) return;
    side.insertAdjacentHTML('beforeend', `<button id="exOutBtn" title="${t('Uit vanavond', 'Out tonight')}" aria-label="${t('Uit vanavond', 'Out tonight')}">🌙</button><button id="exEmoBtn" title="Emotes" aria-label="Emotes">💃</button><button id="exEvBtn" title="${t('Galaxy-avonden', 'Galaxy nights')}" aria-label="${t('Galaxy-avonden', 'Galaxy nights')}">🎉</button>`);
    $('exOutBtn').onclick = out; $('exEmoBtn').onclick = emotes; $('exEvBtn').onclick = agenda;
  }
  let mapHooked = false;
  function hookMap() {
    const m = window.GLXMAP && GLXMAP.map; addMapButtons(); if (!m || mapHooked) return; mapHooked = true;
    let d = null; m.on('moveend', () => { clearTimeout(d); d = setTimeout(outZones, 500) });
    drawEvMarkers(); outZones(); clearInterval(outT); outT = setInterval(outZones, 90e3);
  }
  async function onConnected() {
    claimRef(); rewards(); loadSafe(); loadEvents(); loadOut();
    if (pendingEv) { const id = pendingEv; pendingEv = null; setTimeout(() => checkin(id), 600) }
    if (wantSafe) { wantSafe = false; setTimeout(() => { loadSafe().then(s => { if (s) T('🛡️ ' + t('Tik op "Veilig thuis" onderaan', 'Tap "Home safe" at the bottom')) }) }, 800) }
    if (wantEvents) { wantEvents = false; setTimeout(agenda, 700) }
    setInterval(() => { if (safeCur) drawSafeBar() }, 60e3);
  }
  function hook() {
    addHub();
    let n = 0; const iv = setInterval(() => { hookMap(); hookDate(); if (++n > 600) clearInterval(iv) }, 1000);
    document.addEventListener('click', () => setTimeout(hookDate, 150), true);
    let done = false; const go2 = () => { if (done) return; done = true; onConnected() };
    if (net().state === 'verbonden') go2(); else window.addEventListener('glx-net', e => { if (e.detail === 'verbonden') go2() });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
