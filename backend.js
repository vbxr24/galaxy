/* Galaxy – koppeling met de server (Supabase).
   Testfase: elk toestel krijgt automatisch een eigen account (geen e-mail of wachtwoord).
   Privacy: je exacte locatie verlaat je toestel niet. De app rondt eerst af naar een zone
   van ±300 m en stuurt alleen die zone door; de server rondt nog eens af en wacht 15 minuten. */
(function () {
  'use strict';
  const CFG = window.GALAXY_BACKEND = { url: 'https://dqodwuemdpzyvvvxvgtz.supabase.co', key: 'sb_publishable_nxc3zbKKIR6zpx8iYz4fFA_9yN0JY6p' };
  const LIB = 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js';
  const Z = 0.003, T = m => { try { toast(m) } catch (e) { } }, $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let sb = null, uid = null, state = 'uit', lastZone = '', lastSent = 0, pollT = null, target = null, lastPos = null, busyT = null, rtCh = null;
  const st = s => { state = s; try { localStorage.glxNet = s } catch (e) { } window.dispatchEvent(new CustomEvent('glx-net', { detail: s })) };
  const ghost = () => { try { return !!localStorage.glxGhost } catch (e) { return false } };
  const cut = (s, n) => (s == null ? null : String(s).slice(0, n));

  function loadLib() { return new Promise((ok, no) => { if (window.supabase) return ok(); const s = document.createElement('script'); s.src = LIB; s.onload = ok; s.onerror = () => no(new Error('bibliotheek laadt niet')); document.head.appendChild(s) }) }

  /* ---------- profiel ---------- */
  function row() {
    let av = null; try { av = window.GLXAV && GLXAV.has() ? GLXAV.config() : null } catch (e) { }
    const sp = /^https:\/\/open\.spotify\.com\//.test(ME.music || '') ? cut(ME.music, 300) : null, h = s => String(s || '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 30);
    return {
      name: cut(ME.name, 24), city: cut(ME.city || '', 40), bio: cut(ME.bio || '', 500), cat: ME.cat || null, gender: cut(ME.gender || null, 30), pron: cut(ME.pron || null, 20), orient: cut(ME.orient || null, 30),
      show_orient: !!ME.showOrient, seek: (ME.seek || []).slice(0, 6), ints: (ME.ints || []).slice(0, 12), basics: ME.basics || {}, music: sp, ig: h(ME.ig), snap: h(ME.snap),
      social_vis: ['verborgen', 'matches', 'iedereen'].includes(ME.socialVis) ? ME.socialVis : 'verborgen', ptheme: cut(ME.ptheme || 'Galaxy', 30), avatar: av, ghost: ghost()
    };
  }
  let syncT = null, syncing = false;
  async function syncProfile() {
    if (!sb || !uid || syncing || !ME.name || !ME.born) return; syncing = true;
    try {
      const r = row(); let q = await sb.from('profiles').update(r).eq('id', uid).select('id');
      if (q.error) throw q.error;
      if (!q.data || !q.data.length) { q = await sb.from('profiles').insert(Object.assign({ id: uid, birth: ME.born }, r)).select('id'); if (q.error) throw q.error }
      st('verbonden'); if (ghost()) { await sb.rpc('clear_presence'); lastZone = '' }
    } catch (e) { console.error('profiel', e); st('fout'); if (/18 jaar/.test(e.message || '')) T('Galaxy is alleen voor 18 jaar en ouder') }
    syncing = false;
  }
  const later = () => { clearTimeout(syncT); syncT = setTimeout(syncProfile, 1500) };

  /* ---------- zone doorgeven ---------- */
  async function sendZone(lat, lng) {
    if (!sb || !uid || state !== 'verbonden' || ghost()) return;
    const zlat = Math.round(lat / Z) * Z, zlng = Math.round(lng / Z) * Z, k = zlat.toFixed(4) + ',' + zlng.toFixed(4), now = Date.now();
    lastPos = [lat, lng]; if (k === lastZone && now - lastSent < 2 * 60e3) return; if (now - lastSent < 20e3) return;
    lastZone = k; lastSent = now;
    const { error } = await sb.rpc('set_presence', { lat: zlat, lng: zlng }); if (error) console.error('zone', error);
  }

  /* ---------- mensen in zones ophalen ---------- */
  const CAT = () => { const o = {}; try { GLXPROFILE.cats.forEach(c => o[c[0]] = c[1] + ' ' + c[2]) } catch (e) { } return o };
  async function poll() {
    if (!sb || !uid || state !== 'verbonden' || document.hidden) return;
    const me = window.GLXMAP && GLXMAP._me && GLXMAP._me(); let c = me; try { if (!c && GLXMAP._center) c = GLXMAP._center() } catch (e) { } if (!c) return;
    const z = await sb.rpc('zones_near', { lat: c.lat, lng: c.lng }); if (z.error) { console.error('zones', z.error); return }
    const zones = {}; (z.data || []).forEach(r => zones[r.zlat + ',' + r.zlng] = [r.zlat, r.zlng]);
    const cat = CAT(), people = [];
    for (const zz of Object.values(zones).slice(0, 12)) {
      const p = await sb.rpc('zone_people', { z_lat: zz[0], z_lng: zz[1] }); if (p.error) continue;
      (p.data || []).forEach(c => { if (c && c.id) people.push({ id: c.id, name: c.name, age: c.age, intent: cat[c.cat] || '', zone: zz, card: c }) });
    }
    const L = window.GLXLIVE; if (L) { L.people = people; if (L.on) L.on() }
  }

  /* ---------- live drukte: alleen aantallen, elke 15 seconden ---------- */
  async function busy() {
    if (!sb || !uid || state !== 'verbonden' || document.hidden) return;
    let c = null; try { c = GLXMAP._center && GLXMAP._center() } catch (e) { } if (!c) c = window.GLXMAP && GLXMAP._me && GLXMAP._me(); if (!c) return;
    const [z, pl] = await Promise.all([sb.rpc('busy_near', { lat: c.lat, lng: c.lng }), sb.rpc('places_busy', { lat: c.lat, lng: c.lng })]);
    const L = window.GLXLIVE; if (!L) return;
    if (z.error || pl.error) { L.busy = { zones: [], places: {}, ok: false, at: Date.now() }; if (L.on) L.on(); return }
    const places = {}; (pl.data || []).forEach(r => places[r.place_id] = Number(r.n));
    L.busy = { zones: (z.data || []).map(r => ({ lat: r.zlat, lng: r.zlng, n: Number(r.n) })), places, ok: true, at: Date.now() }; if (L.on) L.on();
  }
  async function checkIn(id) {
    if (!sb || !uid || state !== 'verbonden' || ghost()) return; let v = null; try { v = GLXMAP._venues.get(id) } catch (e) { } if (!v) return;
    await sb.from('checkins').delete().eq('user_id', uid);
    const r = await sb.from('checkins').insert({ user_id: uid, place_id: String(id).slice(0, 80), place_name: String(v.n || 'Plek').slice(0, 120), plat: v.lat, plng: v.lng }); if (r.error) console.error('checkin', r.error); busy();
  }
  async function checkOut() { if (!sb || !uid) return; await sb.from('checkins').delete().eq('user_id', uid); busy() }
  function realtime() {
    try { if (rtCh) sb.removeChannel(rtCh) } catch (e) { }
    try { rtCh = sb.channel('glx-msg-' + uid).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'to_id=eq.' + uid }, () => { loadMsgs(); loadMatches() }).subscribe() } catch (e) { console.error('realtime', e) }
  }

  /* ---------- profielkaart van een ander ---------- */
  function toCard(c) {
    return {
      id: c.id, name: c.name, age: c.age, city: c.city, bio: c.bio, cat: c.cat, gender: c.gender, pron: c.pron, orient: c.orient, showOrient: !!c.orient, ints: c.ints || [], basics: c.basics || {}, music: c.music || '',
      ptheme: c.ptheme, respect: c.respect, matched: !!c.matched, socialVis: c.ig || c.snap ? 'iedereen' : 'verborgen', ig: c.ig || (c.hasSocials && !c.snap ? '•' : ''), snap: c.snap || '',
      badges: [['🪐', 'Galaxy-lid']].concat(c.ageVerified ? [['🔞', 'Leeftijd gecontroleerd']] : []).concat(c.matched ? [['💜', 'Jullie zwaaiden naar elkaar']] : [])
    };
  }
  async function openOther(id) {
    const hit = ((window.GLXLIVE || {}).people || []).find(p => p.id === id); let c = hit && hit.card;
    if (!c) { const r = await sb.rpc('profile_card', { target: id }); c = r.data }
    if (!c) return T('Dit profiel is niet beschikbaar');
    target = c.id; GLXPROFILE.show(toCard(c));
    const sh = $('xSheet'); if (sh) sh.insertAdjacentHTML('beforeend', `<button class="btn ghost" style="width:100%;margin-top:8px;color:#fb7185" onclick="GLXNET.block()">🚫 Blokkeer ${esc(c.name)}</button>`);
  }
  const REASON = ['Lijkt minderjarig', 'Nepprofiel of oplichting', 'Intimidatie of bedreiging', 'Ongepaste foto of tekst', 'Vraagt geld of biedt seks tegen betaling', 'Iets anders'];
  const api = window.GLXNET = {
    get state() { return state }, get uid() { return uid }, sync: syncProfile, poll,
    async wave() {
      if (!target || !sb) return; const w = await sb.from('waves').insert({ from_id: uid, to_id: target });
      if (w.error && w.error.code !== '23505') { console.error(w.error); return T('Zwaaien lukte niet') }
      const m = await sb.rpc('is_match', { a: uid, b: target });
      if (m.data) { T('💜 Jullie zwaaiden naar elkaar! Je kunt nu chatten.'); loadMatches() } else T('👋 Zwaai verstuurd');
    },
    report() { if (!target) return; xs('🚩 Melden', '<p class="sub" style="margin-bottom:10px">Wat is er aan de hand? De ander ziet niet dat jij meldt.</p>' + REASON.map((r, k) => `<button class="opt" style="width:100%;text-align:left;margin-bottom:8px" onclick="GLXNET.sendReport(${k})">${r}</button>`).join(''), false) },
    async sendReport(k) { const r = await sb.from('reports').insert({ reporter: uid, target, reason: REASON[k] }); try { closeO('xV') } catch (e) { } T(r.error ? 'Melden lukte niet, probeer opnieuw' : '🚩 Bedankt, je melding is verstuurd') },
    async block() { if (!target) return; const r = await sb.from('blocks').insert({ blocker: uid, blocked: target }); try { closeO('xV') } catch (e) { } if (r.error && r.error.code !== '23505') return T('Blokkeren lukte niet'); T('🚫 Geblokkeerd. Jullie zien elkaar niet meer.'); poll() },
    chat(id) { openChat2(id) }, sendMsg, matches: () => loadMatches(),
    async wipe() { try { if (sb && uid) { await sb.from('profiles').delete().eq('id', uid); await sb.auth.signOut() } } catch (e) { } }
  };

  /* ---------- matches en chat ---------- */
  let matchList = [], chatWith = null, chatT = null, lastSeen = {};
  try { lastSeen = JSON.parse(localStorage.glxSeenMsg || '{}') } catch (e) { }
  const hm = d => { try { return new Date(d).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' }) } catch (e) { return '' } };
  async function loadMatches() {
    if (!sb || !uid || state !== 'verbonden') return;
    const r = await sb.rpc('my_matches'); if (r.error) { console.error('matches', r.error); return }
    matchList = (r.data || []).filter(c => c && c.id);
    const m = await sb.from('messages').select('sender,to_id,body,at').order('at', { ascending: false }).limit(200); const last = {}; let unread = 0;
    (m.data || []).forEach(x => { const o = x.sender === uid ? x.to_id : x.sender; if (!last[o]) last[o] = x });
    matchList.forEach(c => { c.last = last[c.id] || null; c.unread = !!(c.last && c.last.sender !== uid && (!lastSeen[c.id] || new Date(c.last.at) > new Date(lastSeen[c.id]))); if (c.unread) unread++ });
    matchList.sort((a, b) => new Date((b.last || {}).at || 0) - new Date((a.last || {}).at || 0));
    drawMatches(unread);
  }
  function drawMatches(unread) {
    const cl = $('clist'), mr = $('mrow'); if (!cl) return; if (mr) mr.innerHTML = '';
    document.querySelectorAll('#v-chat > h2').forEach((h, i) => { h.style.display = i === 0 ? 'none' : ''; if (i === 1) h.textContent = 'Matches en berichten' });
    cl.innerHTML = matchList.length ? matchList.map(c => `<button class="gmRow" style="width:100%;text-align:left;margin-bottom:8px;padding:12px;border-radius:14px;background:var(--card);border:1px solid var(--line);display:flex;gap:12px;align-items:center" onclick="GLXNET.chat('${esc(c.id)}')">
<span style="flex:none;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:20px;background:linear-gradient(135deg,#8b5cf6,#ec4899)">${esc((c.name || '?')[0])}</span>
<span style="flex:1;min-width:0"><b>${esc(c.name)}${c.age ? ', ' + c.age : ''}</b><br><small class="sub" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.last ? (c.last.sender === uid ? 'Jij: ' : '') + esc(c.last.body) : 'Jullie zwaaiden naar elkaar. Zeg hallo 👋'}</small></span>
${c.unread ? '<span style="flex:none;width:10px;height:10px;border-radius:50%;background:#ec4899"></span>' : ''}</button>`).join('')
      : '<div class="box"><p class="sub">Nog geen matches. Zwaai naar iemand in een zone op de kaart. Zwaait die terug, dan kunnen jullie hier chatten.</p></div>';
    const b = document.getElementById('chatDot'); if (b) { b.textContent = unread || ''; b.style.display = unread ? '' : 'none' }
  }
  async function loadMsgs() {
    if (!chatWith || !sb) return; const o = chatWith;
    const r = await sb.from('messages').select('id,sender,body,at').or(`and(sender.eq.${uid},to_id.eq.${o}),and(sender.eq.${o},to_id.eq.${uid})`).order('at', { ascending: true }).limit(300);
    if (r.error || chatWith !== o) return; const box = $('gcMsgs'); if (!box) return;
    const sig = (r.data || []).length + ':' + ((r.data || []).slice(-1)[0] || {}).id; if (box.dataset.sig === sig) return; box.dataset.sig = sig;
    box.innerHTML = (r.data || []).length ? r.data.map(m => `<div style="display:flex;justify-content:${m.sender === uid ? 'flex-end' : 'flex-start'};margin:6px 0"><div style="max-width:78%;padding:9px 13px;border-radius:16px;white-space:pre-wrap;overflow-wrap:anywhere;background:${m.sender === uid ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'var(--card2)'}">${esc(m.body)}<small style="display:block;opacity:.7;font-size:10px;text-align:right;margin-top:2px">${hm(m.at)}</small></div></div>`).join('')
      : '<p class="sub" style="text-align:center;margin:30px 0">Nog geen berichten. Zeg hallo 👋</p>';
    box.scrollTop = box.scrollHeight; const l = (r.data || []).slice(-1)[0]; if (l) { lastSeen[o] = l.at; try { localStorage.glxSeenMsg = JSON.stringify(lastSeen) } catch (e) { } }
  }
  function openChat2(id) {
    const c = matchList.find(x => x.id === id); if (!c) return; chatWith = id; target = id;
    xs('💬 ' + esc(c.name), `<div style="display:flex;gap:8px;margin-bottom:8px"><button class="pill" onclick="openProfile('${esc(id)}')">👤 Profiel</button><button class="pill" onclick="GLXNET.report()">🚩 Meld</button><button class="pill" onclick="GLXNET.block()">🚫 Blokkeer</button></div>
<div id="gcMsgs" style="height:46vh;overflow-y:auto;padding:4px 2px"></div>
<form onsubmit="event.preventDefault();GLXNET.sendMsg()" style="display:flex;gap:8px;margin-top:8px"><input id="gcIn" class="fld" maxlength="1000" autocomplete="off" placeholder="Typ een bericht" style="margin:0;flex:1 1 auto;min-width:0;width:auto"><button class="btn" type="submit" aria-label="Verstuur" style="flex:none;width:52px;padding:0">➤</button></form>
<p class="sub" style="margin-top:8px;font-size:11px">🛡️ Deel geen adres, geld of bankgegevens. Spreek af op een openbare plek.</p>`, false);
    loadMsgs(); clearInterval(chatT); chatT = setInterval(() => { const v = $('xV'); if (!v || !v.classList.contains('on') || !$('gcMsgs')) { clearInterval(chatT); chatWith = null; loadMatches(); return } loadMsgs() }, 4000);
  }
  async function sendMsg() {
    const i = $('gcIn'), body = (i && i.value || '').trim(); if (!body || !chatWith) return; i.value = '';
    const r = await sb.from('messages').insert({ sender: uid, to_id: chatWith, body: body.slice(0, 1000) });
    if (r.error) { i.value = body; return T('Versturen lukte niet. Misschien zijn jullie geen match meer.') } loadMsgs();
  }

  /* ---------- haken in de app ---------- */
  function hooks() {
    const sm = window.saveMe; window.saveMe = function () { const r = sm && sm.apply(this, arguments); later(); return r };
    window.addEventListener('glx-avatar', later);
    document.addEventListener('click', e => { if (e.target && e.target.id === 'ghostTg') setTimeout(syncProfile, 300) });
    const L = window.GLXLIVE = window.GLXLIVE || { people: [], send() { }, on: null }, snd = L.send;
    L.send = function (m) { try { snd && snd.apply(this, arguments) } catch (e) { } if (m && m.t === 'pos') sendZone(m.lat, m.lng); if (m && m.t === 'checkin') checkIn(m.place); if (m && m.t === 'checkout') checkOut(); if (m && (m.t === 'avatar' || m.t === 'cat')) later() };
    if (window.GLXPROFILE) { GLXPROFILE.wave = () => api.wave(); GLXPROFILE.report = () => api.report() }
    window.openProfile = function (id) { if (typeof id === 'string' && id.length > 20) return openOther(id) };
    if (typeof window.reallyDelete === 'function') { const rd = window.reallyDelete; window.reallyDelete = async function () { await api.wipe(); return rd.apply(this, arguments) } }
    if (typeof window.renderChats === 'function') { const rc = window.renderChats; window.renderChats = function () { const r = rc.apply(this, arguments); if (state === 'verbonden') { drawMatches(matchList.filter(c => c.unread).length); loadMatches() } return r } }
    clearInterval(pollT); pollT = setInterval(poll, 60e3); document.addEventListener('visibilitychange', () => { if (!document.hidden) { poll(); busy(); loadMatches() } });
    clearInterval(busyT); let tick = 0; busyT = setInterval(() => { tick++; busy(); loadMatches(); if (tick % 8 === 0 && lastPos && !document.hidden) sendZone(lastPos[0], lastPos[1]) }, 15e3);
  }

  async function start() {
    if (typeof ME === 'undefined' || !ME.name || !ME.born) return st('wacht');           /* eerst het welkomstscherm */
    try {
      await loadLib(); if (!sb) sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'glxAuth' } });
      let s = (await sb.auth.getSession()).data.session;
      if (!s) { const r = await sb.auth.signInAnonymously(); if (r.error) throw r.error; s = r.data.session }
      uid = s.user.id; await syncProfile(); if (state === 'verbonden') { setTimeout(poll, 1500); setTimeout(busy, 2000); setTimeout(loadMatches, 2500); realtime() }
    } catch (e) { console.error('server', e); st('offline') }
  }
  hooks(); st('uit');
  const wg = window.welcomeGo; if (typeof wg === 'function') window.welcomeGo = function () { const r = wg.apply(this, arguments); setTimeout(start, 400); return r };
  start();
})();
