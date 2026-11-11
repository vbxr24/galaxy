/* Galaxy – Date plannen met een match.
   Voorstel: waar heb je zin in (zin-meter), wat, waar (openbare plekken op de kaart), wanneer, wat geeft je een fijn gevoel.
   De ander bevestigt, vraagt een ander moment of zegt af. Bevestigd: aftelklok, weer ter plaatse (Open-Meteo),
   route, agenda (.ics / Google), veilig-knop. Na de date: "nog eens?" – je ziet alleen of jullie ALLEBEI ja zeiden.
   Server: server/dateplans.sql (tabel date_plans + functies date_respond, date_cancel, date_again). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = m => { try { toast(m) } catch (e) { } };
  const nl = () => { try { return (typeof LANG === 'undefined' ? 'nl' : LANG) === 'nl' } catch (e) { return true } };
  const t = (a, b) => nl() ? a : b;
  const net = () => window.GLXNET || {};
  const db = () => net().db;
  const me = () => net().uid;
  const loc = () => (nl() ? 'nl-BE' : undefined);
  const fmt = iso => { try { return new Date(iso).toLocaleString(loc(), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) } catch (e) { return iso } };
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /* ---------- keuzes ---------- */
  const ACTS = () => [['coffee', '☕', t('Koffie', 'Coffee')], ['drinks', '🍹', t('Iets drinken', 'Drinks')], ['food', '🍽️', t('Etentje', 'Dinner')], ['walk', '🚶', t('Wandelen', 'Walk')],
  ['movie', '🎬', t('Film', 'Movie')], ['active', '🎳', t('Iets actiefs', 'Something active')], ['culture', '🎨', t('Cultuur', 'Culture')], ['sweet', '🧇', t('Dessert', 'Dessert')], ['surprise', '🎁', t('Verras me', 'Surprise me')]];
  const MOODS = () => [['chat', '☕', t('Een goed gesprek', 'A good talk')], ['food', '🍝', t('Lekker eten', 'Good food')], ['terrace', '🌞', t('Terrasje', 'Terrace')], ['active', '⚡', t('Iets actiefs', 'Something active')],
  ['cosy', '🕯️', t('Rustig en knus', 'Calm and cosy')], ['nature', '🌳', t('Natuur', 'Nature')], ['culture', '🎭', t('Cultuur', 'Culture')], ['sweet', '🍰', t('Iets zoets', 'Something sweet')],
  ['games', '🎯', t('Spelletjes', 'Games')], ['new', '✨', t('Iets nieuws', 'Something new')]];
  const LVL = () => ['', t('Misschien', 'Maybe'), t('Zin in', 'Keen'), t('Heel veel zin', 'Very keen')];
  const COMFORT = () => [['public', t('Openbare plek', 'Public place')], ['own_way', t('Zelf naar huis', 'Own way home')], ['no_alcohol', t('Alcoholvrij is prima', 'Alcohol-free is fine')],
  ['quiet', t('Niet te druk', 'Not too busy')], ['not_late', t('Niet te laat', 'Not too late')], ['short', t('Eerst iets korts', 'Something short first')]];
  const actOf = k => ACTS().find(a => a[0] === k) || ['', '📅', k || ''];
  const moodOf = k => MOODS().find(m => m[0] === k);
  const comfortOf = k => (COMFORT().find(c => c[0] === k) || [k, k])[1];
  const STATUS = () => ({ proposed: ['⏳', t('Wacht op antwoord', 'Waiting for reply')], confirmed: ['✅', t('Bevestigd', 'Confirmed')], other_time: ['🕒', t('Ander moment gevraagd', 'Asked for another time')], declined: ['🙅', t('Afgezegd', 'Declined')], cancelled: ['✖️', t('Geannuleerd', 'Cancelled')] });

  const css = `<style id="dpCss">
.dpH{font-weight:800;margin:16px 0 8px;font-size:15px}.dpGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.dpMood{display:flex;gap:8px;align-items:center;text-align:left;padding:10px;border-radius:14px;background:var(--card2);border:1px solid var(--line);color:inherit;font-size:13px}
.dpMood.on{border-color:#ec4899;background:linear-gradient(135deg,rgba(139,92,246,.35),rgba(236,72,153,.3))}.dpMood b{display:block;font-size:13px}.dpMood small{opacity:.8;font-size:11px}
.dpChips{display:flex;flex-wrap:wrap;gap:6px}.dpChip{padding:8px 12px;border-radius:99px;background:var(--card2);border:1px solid var(--line);color:inherit;font-size:13px}
.dpChip.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent;color:#fff}
.dpCard{border-radius:18px;padding:14px;background:var(--card2);border:1px solid var(--line);margin-bottom:10px}
.dpBig{font-size:18px;font-weight:800}.dpRow{display:flex;justify-content:space-between;gap:10px;align-items:center}
.dpCd{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center}.dpCd div{background:var(--card);border-radius:12px;padding:8px 0}.dpCd b{font-size:22px;display:block}
.dpBtns{display:grid;gap:8px}.dpBtns a,.dpBtns button{text-align:center;text-decoration:none}
.dpTok{display:block;margin-top:6px;width:100%;padding:8px 10px;border-radius:12px;border:1px solid #ffffff55;background:#ffffff22;color:inherit;font-weight:700;font-size:13px}
</style>`;
  const addCss = () => { if (!$('dpCss')) document.head.insertAdjacentHTML('beforeend', css) };

  /* ---------- plekken in de buurt (openbaar: cafés, restaurants, parken) ---------- */
  function nearby() {
    const out = []; let c = null;
    try { c = (GLXMAP._me && GLXMAP._me()) || (GLXMAP._center && GLXMAP._center()) } catch (e) { }
    try {
      const v = GLXMAP._venues; if (!v || !c) return out;
      v.forEach((x, id) => { if (!x || !x.name || x.lat == null) return; const d = dist(c.lat, c.lng, x.lat, x.lng); if (d < 5000) out.push({ id, name: x.name, lat: x.lat, lng: x.lng, d }) });
    } catch (e) { }
    return out.sort((a, b) => a.d - b.d).slice(0, 8);
  }
  function dist(a, b, c, d) { const R = 6371e3, r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)) }

  /* ---------- 1. voorstel maken ---------- */
  let D = null;
  function plan(toId, name, prev) {
    if (!db() || !me()) return T(t('Even geduld: Galaxy maakt nog verbinding.', 'One moment: Galaxy is still connecting.'));
    addCss();
    const nb = nearby();
    D = D && D.to === toId ? D : { to: toId, name: name || (net().nameOf && net().nameOf(toId)) || '', act: '', moods: {}, comfort: ['public'], place: null, own: '', when: '', min: 120, note: '', nb };
    if (prev) Object.assign(D, { act: prev.activity && ACTS().some(a => a[2] === prev.activity) ? ACTS().find(a => a[2] === prev.activity)[0] : D.act, own: prev.place || D.own });
    D.nb = nb; draw();
  }
  function draw() {
    const minDt = new Date(Date.now() + 3600e3); minDt.setMinutes(0, 0, 0);
    const local = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    const L = LVL();
    xs('📅 ' + t('Date plannen', 'Plan a date') + (D.name ? ' · ' + esc(D.name) : ''), `
<p class="sub">${t('Stel iets voor. ' + esc(D.name || 'Je match') + ' kan bevestigen, een ander moment vragen of afzeggen.', 'Suggest something. ' + esc(D.name || 'Your match') + ' can confirm, ask for another time or decline.')}</p>
<div class="dpH">1. ${t('Waar heb je zin in?', 'What are you in the mood for?')} <span class="sub" style="font-weight:400">(${t('tik vaker = meer zin', 'tap more = keener')})</span></div>
<div class="dpGrid">${MOODS().map(m => { const l = D.moods[m[0]] || 0; return `<button type="button" class="dpMood${l ? ' on' : ''}" aria-label="${esc(m[2])}: ${l ? L[l] : t('geen keuze', 'not chosen')}" onclick="GLXDATE._mood('${m[0]}')"><span style="font-size:22px">${m[1]}</span><span><b>${esc(m[2])}</b><small>${'♥'.repeat(l)}${'<span style=opacity:.3>♥</span>'.repeat(3 - l)} ${l ? L[l] : ''}</small></span></button>` }).join('')}</div>
<div class="dpH">2. ${t('Wat doen we?', 'What shall we do?')}</div>
<div class="dpChips">${ACTS().map(a => `<button type="button" class="dpChip${D.act === a[0] ? ' on' : ''}" aria-pressed="${D.act === a[0]}" onclick="GLXDATE._set('act','${a[0]}')">${a[1]} ${esc(a[2])}</button>`).join('')}</div>
<div class="dpH">3. ${t('Waar?', 'Where?')}</div>
${D.nb.length ? `<div class="dpChips">${D.nb.map((p, i) => `<button type="button" class="dpChip${D.place && D.place.id === p.id ? ' on' : ''}" onclick="GLXDATE._place(${i})">📍 ${esc(p.name)} <small style="opacity:.7">${p.d < 1000 ? Math.round(p.d / 10) * 10 + ' m' : (p.d / 1000).toFixed(1) + ' km'}</small></button>`).join('')}</div>` : `<p class="sub">${t('Zoom op de kaart in op je buurt om cafés en restaurants te zien, of typ zelf een plek.', 'Zoom in on the map to see cafés and restaurants nearby, or type a place.')}</p>`}
<input class="fld" id="dpOwn" maxlength="200" value="${esc(D.place ? '' : D.own)}" placeholder="${t('Of typ een plek (bv. naam van een café)', 'Or type a place (e.g. a café name)')}" oninput="GLXDATE._own(this.value)">
<p class="sub" style="font-size:12px;margin-top:-4px">🛡️ ${t('Kies voor een eerste date een openbare plek. Nooit bij iemand thuis.', 'For a first date, pick a public place. Never at someone\'s home.')}</p>
<div class="dpH">4. ${t('Wanneer?', 'When?')}</div>
<div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input class="fld" id="dpWhen" type="datetime-local" min="${local(minDt)}" value="${esc(D.when)}" onchange="GLXDATE._set('when',this.value,1)" style="margin:0">
<select class="fld" id="dpMin" onchange="GLXDATE._set('min',+this.value,1)" style="margin:0;width:auto">${[60, 90, 120, 180, 240].map(m => `<option value="${m}"${D.min === m ? ' selected' : ''}>${m < 120 ? m + ' min' : m / 60 + (nl() ? ' uur' : ' h')}</option>`).join('')}</select></div>
<div class="dpH">5. ${t('Wat geeft jou een fijn gevoel?', 'What makes you feel comfortable?')}</div>
<div class="dpChips">${COMFORT().map(c => `<button type="button" class="dpChip${D.comfort.includes(c[0]) ? ' on' : ''}" aria-pressed="${D.comfort.includes(c[0])}" onclick="GLXDATE._comfort('${c[0]}')">${esc(c[1])}</button>`).join('')}</div>
<textarea class="fld" id="dpNote" maxlength="300" rows="2" placeholder="${t('Berichtje erbij (optioneel)', 'Add a note (optional)')}" oninput="GLXDATE._set('note',this.value,1)" style="margin-top:10px">${esc(D.note)}</textarea>
<button class="btn" style="width:100%;margin-top:6px" onclick="GLXDATE._send()">💌 ${t('Stuur voorstel', 'Send proposal')}</button>
<button class="btn ghost" style="width:100%;margin-top:8px" onclick="GLXNET.chat('${esc(D.to)}')">‹ ${t('Terug naar de chat', 'Back to chat')}</button>`, false);
  }
  const keep = () => { const o = $('dpOwn'), n = $('dpNote'), w = $('dpWhen'); if (o && !D.place) D.own = o.value; if (n) D.note = n.value; if (w) D.when = w.value };

  async function send() {
    keep();
    const act = actOf(D.act), place = D.place ? D.place.name : (D.own || '').trim();
    if (!D.act) return T(t('Kies wat jullie gaan doen', 'Choose what you\'ll do'));
    if (!place) return T(t('Kies of typ een plek', 'Choose or type a place'));
    const when = D.when ? new Date(D.when) : null;
    if (!when || isNaN(when) || when.getTime() < Date.now() + 15 * 60e3) return T(t('Kies een moment in de toekomst', 'Pick a time in the future'));
    const row = {
      from_id: me(), to_id: D.to, activity: act[2].slice(0, 120), place: place.slice(0, 200),
      plat: D.place ? +D.place.lat.toFixed(5) : null, plng: D.place ? +D.place.lng.toFixed(5) : null,
      starts_at: when.toISOString(), minutes: D.min, note: (D.note || '').trim().slice(0, 300) || null,
      from_wish: { moods: D.moods, comfort: D.comfort.slice(0, 6), act: D.act }
    };
    const r = await db().from('date_plans').insert(row).select('id').single();
    if (r.error) { console.error(r.error); return T(t('Versturen lukte niet. Zijn jullie nog een match?', 'Could not send. Are you still a match?')) }
    await chatMsg(D.to, `📅 ${t('Date-voorstel', 'Date proposal')}: ${act[1]} ${row.activity} · ${fmt(row.starts_at)} · ${row.place} [#date:${r.data.id}]`);
    const to = D.to; D = null; T('💌 ' + t('Voorstel verstuurd', 'Proposal sent')); open(r.data.id, to);
  }
  async function chatMsg(to, body) { try { await db().from('messages').insert({ sender: me(), to_id: to, body: body.slice(0, 1000) }) } catch (e) { } }

  /* ---------- 2. een date bekijken en beantwoorden ---------- */
  let cdT = null, cur = null, myWish = { moods: {} };
  async function open(id) {
    if (!UUID.test(id || '') || !db()) return; addCss();
    const r = await db().from('date_plans').select('id,from_id,to_id,status,activity,place,plat,plng,starts_at,minutes,note,from_wish,to_wish,reply').eq('id', id).maybeSingle();
    if (r.error || !r.data) return T(t('Deze date is niet (meer) beschikbaar', 'This date is no longer available'));
    cur = r.data; myWish = { moods: {} }; render();
  }
  function render() {
    const p = cur, mine = p.from_id === me(), other = mine ? p.to_id : p.from_id, name = (net().nameOf && net().nameOf(other)) || t('je match', 'your match');
    const st = STATUS()[p.status] || ['', p.status], start = new Date(p.starts_at), end = start.getTime() + p.minutes * 6e4, past = end < Date.now(), act = actOf((p.from_wish || {}).act);
    const theirs = mine ? p.to_wish : p.from_wish, ours = mine ? p.from_wish : p.to_wish;
    const both = Object.keys((theirs || {}).moods || {}).filter(k => ((ours || {}).moods || {})[k]).map(moodOf).filter(Boolean);
    const L = LVL();
    const wishHtml = (w, who) => { const m = Object.entries((w || {}).moods || {}).sort((a, b) => b[1] - a[1]).map(([k, l]) => { const x = moodOf(k); return x ? `<span class="dpChip" style="cursor:default">${x[1]} ${esc(x[2])} <small style="opacity:.75">${'♥'.repeat(l)}</small></span>` : '' }).join(''); const c = ((w || {}).comfort || []).map(comfortOf); return m || c.length ? `<div class="dpCard"><b>${who}</b>${m ? `<div class="dpChips" style="margin-top:8px">${m}</div>` : ''}${c.length ? `<p class="sub" style="margin-top:8px">🛡️ ${t('Fijn gevoel', 'Comfortable with')}: ${c.map(esc).join(' · ')}</p>` : ''}</div>` : '' };
    let h = `<div class="dpCard" style="background:linear-gradient(135deg,rgba(139,92,246,.35),rgba(236,72,153,.28))">
<div class="dpRow"><span class="dpBig">${act[1]} ${esc(p.activity)}</span><span class="pill">${st[0]} ${esc(st[1])}</span></div>
<p style="margin-top:10px">📅 <b>${esc(fmt(p.starts_at))}</b> · ${p.minutes < 120 ? p.minutes + ' min' : p.minutes / 60 + (nl() ? ' uur' : ' h')}</p>
<p style="margin-top:4px">📍 ${esc(p.place)}</p>${p.note ? `<p style="margin-top:8px;font-style:italic">“${esc(p.note)}”</p>` : ''}${p.reply ? `<p style="margin-top:8px">💬 ${esc(p.reply)}</p>` : ''}</div>`;
    if (both.length) h += `<div class="dpCard"><b>💞 ${t('Jullie hebben allebei zin in', 'You both feel like')}</b><div class="dpChips" style="margin-top:8px">${both.map(x => `<span class="dpChip on" style="cursor:default">${x[1]} ${esc(x[2])}</span>`).join('')}</div></div>`;
    h += wishHtml(theirs, t(esc(name) + ' heeft zin in', esc(name) + ' feels like'));
    if (mine || p.status !== 'proposed') h += wishHtml(ours, t('Jij hebt zin in', 'You feel like'));

    if (!mine && p.status === 'proposed') {
      h += `<div class="dpH">${t('Waar heb jij zin in?', 'What do you feel like?')} <span class="sub" style="font-weight:400">(${t('optioneel', 'optional')})</span></div>
<div class="dpGrid">${MOODS().map(m => { const l = myWish.moods[m[0]] || 0; return `<button type="button" class="dpMood${l ? ' on' : ''}" onclick="GLXDATE._myMood('${m[0]}')"><span style="font-size:20px">${m[1]}</span><span><b>${esc(m[2])}</b><small>${'♥'.repeat(l)}${'<span style=opacity:.3>♥</span>'.repeat(3 - l)} ${l ? L[l] : ''}</small></span></button>` }).join('')}</div>
<textarea class="fld" id="dpReply" maxlength="300" rows="2" placeholder="${t('Berichtje (optioneel), bv. een ander uur dat beter past', 'Message (optional), e.g. a better time')}" style="margin-top:10px"></textarea>
<div class="dpBtns"><button class="btn" onclick="GLXDATE._respond('confirmed')">❤️ ${t('Ja, dat past!', 'Yes, that works!')}</button>
<button class="btn ghost" onclick="GLXDATE._respond('other_time')">🕒 ${t('Kan een ander moment?', 'Another time?')}</button>
<button class="btn ghost" onclick="GLXDATE._respond('declined')">🙅 ${t('Netjes afzeggen', 'Politely decline')}</button></div>`;
    }
    if (mine && p.status === 'other_time') h += `<button class="btn" style="width:100%;margin-bottom:10px" onclick="GLXDATE.plan('${other}')">📅 ${t('Doe een nieuw voorstel', 'Make a new proposal')}</button>`;
    if (p.status === 'confirmed' && !past) {
      h += `<div class="dpCard" id="dpCd"></div><div class="dpCard" id="dpWx"><b>🌦️ ${t('Weer ter plaatse', 'Weather there')}</b><p class="sub" style="margin-top:6px">${t('Even kijken…', 'Checking…')}</p></div>
<div class="dpCard"><b>🗓️ ${t('In je agenda', 'Add to calendar')}</b><div class="dpBtns" style="grid-template-columns:1fr 1fr;margin-top:8px"><button class="btn sm" onclick="GLXDATE._ics()">📥 .ics (Apple, Outlook)</button><a class="btn sm ghost" style="color:inherit;text-decoration:none;display:grid;place-items:center" target="_blank" rel="noopener" href="${gcal(p)}">Google</a></div></div>
<div class="dpCard"><b>🧭 ${t('Hoe kom je er?', 'Getting there')}</b><a class="btn sm ghost" style="display:block;margin-top:8px;text-align:center;text-decoration:none;color:inherit" target="_blank" rel="noopener" href="${route(p)}">${t('Route openen', 'Open route')}</a></div>
<div class="dpCard"><b>🛡️ ${t('Laat iemand weten waar je bent', 'Let someone know where you are')}</b><p class="sub" style="margin:6px 0 8px">${t('Stuur een vriend(in) waar en wanneer. Galaxy slaat je locatie hierbij niet op.', 'Send a friend where and when. Galaxy does not store your location for this.')}</p>
<div class="dpBtns" style="grid-template-columns:1fr 1fr"><button class="btn sm ghost" onclick="GLXDATE._safe(false)">${t('Waar en wanneer', 'Where and when')}</button><button class="btn sm ghost" onclick="GLXDATE._safe(true)">${t('+ mijn locatie nu', '+ my location now')}</button></div>
<p class="sub" style="font-size:11px;margin-top:8px">${t('Bij acuut gevaar: bel het noodnummer (EU 112).', 'In danger: call the emergency number (EU 112).')}</p></div>`;
    }
    if (p.status === 'confirmed' && past) h += `<div class="dpCard" id="dpAgain"><b>💭 ${t('Zin in een tweede date?', 'Fancy a second date?')}</b><p class="sub" style="margin:6px 0 8px">${t(esc(name) + ' ziet jouw antwoord nooit. Jullie zien alleen iets als jullie allebei ja zeggen.', esc(name) + ' never sees your answer. You only see something if you both say yes.')}</p><div class="dpBtns" style="grid-template-columns:1fr 1fr"><button class="btn sm" onclick="GLXDATE._again(true)">${t('Ja!', 'Yes!')}</button><button class="btn sm ghost" onclick="GLXDATE._again(false)">${t('Liever niet', 'Rather not')}</button></div><p id="dpAgainR" class="sub" style="margin-top:8px"></p></div>`;
    if (['proposed', 'confirmed', 'other_time'].includes(p.status) && !past) h += `<button class="btn ghost" style="width:100%;margin-bottom:8px" onclick="GLXDATE._cancel()">${t('Date annuleren', 'Cancel date')}</button>`;
    h += `<button class="btn ghost" style="width:100%" onclick="GLXNET.chat('${other}')">💬 ${t('Naar de chat', 'Go to chat')}</button>`;
    xs('📅 ' + t('Date met ', 'Date with ') + esc(name), h, false);
    clearInterval(cdT);
    if (p.status === 'confirmed' && !past) { countdown(); cdT = setInterval(() => { if (!$('dpCd')) return clearInterval(cdT); countdown() }, 30e3); weather(p) }
    if (p.status === 'confirmed' && past) again(null);
  }
  function countdown() {
    const el = $('dpCd'); if (!el || !cur) return; const ms = new Date(cur.starts_at) - Date.now();
    if (ms <= 0) { el.innerHTML = `<b>💜 ${t('Het is zover. Veel plezier!', 'It\'s time. Have fun!')}</b>`; return }
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    el.innerHTML = `<b>⏳ ${t('Nog', 'Still')}</b><div class="dpCd" style="margin-top:8px"><div><b>${d}</b>${t(d === 1 ? 'dag' : 'dagen', d === 1 ? 'day' : 'days')}</div><div><b>${h}</b>${t('uur', 'hours')}</div><div><b>${m}</b>min</div></div>`;
  }
  async function weather(p) {
    const el = $('dpWx'); if (!el) return; let la = p.plat, lo = p.plng;
    if (la == null) { try { const c = GLXMAP._me && GLXMAP._me(); if (c) { la = c.lat; lo = c.lng } } catch (e) { } }
    const start = new Date(p.starts_at), days = (start - Date.now()) / 864e5;
    if (la == null) { el.remove(); return }
    if (days > 15) { el.innerHTML = `<b>🌦️ ${t('Weer ter plaatse', 'Weather there')}</b><p class="sub" style="margin-top:6px">${t('De verwachting verschijnt hier ongeveer 2 weken vooraf.', 'The forecast appears about 2 weeks ahead.')}</p>`; return }
    try {
      const day = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const q = new URLSearchParams({ latitude: la.toFixed(3), longitude: lo.toFixed(3), hourly: 'temperature_2m,precipitation_probability,weather_code', timezone: 'auto', start_date: day, end_date: day });
      const j = await (await fetch('https://api.open-meteo.com/v1/forecast?' + q)).json(); const i = Math.min(start.getHours(), j.hourly.time.length - 1);
      const tC = Math.round(j.hourly.temperature_2m[i]), rain = j.hourly.precipitation_probability ? j.hourly.precipitation_probability[i] : 0, c = j.hourly.weather_code[i];
      const W = [[[0], '☀️', t('Zonnig', 'Sunny')], [[1, 2], '🌤️', t('Licht bewolkt', 'Partly cloudy')], [[3], '☁️', t('Bewolkt', 'Cloudy')], [[45, 48], '🌫️', t('Mist', 'Fog')], [[51, 53, 55, 56, 57], '🌦️', t('Motregen', 'Drizzle')], [[61, 63, 65, 66, 67, 80, 81, 82], '🌧️', t('Regen', 'Rain')], [[71, 73, 75, 77, 85, 86], '❄️', t('Sneeuw', 'Snow')], [[95, 96, 99], '⛈️', t('Onweer', 'Thunderstorm')]];
      const w = W.find(x => x[0].includes(c)) || [0, '🌡️', ''];
      const tip = rain >= 50 ? t('Kans op regen: neem een paraplu mee of kies een plek binnen ☔', 'Rain likely: bring an umbrella or pick an indoor spot ☔') : tC <= 5 ? t('Het wordt fris, kleed je warm aan 🧣', 'It\'ll be chilly, dress warm 🧣') : tC >= 28 ? t('Warm! Drink genoeg water 💧', 'Hot! Drink enough water 💧') : '';
      el.innerHTML = `<b>🌦️ ${t('Weer ter plaatse', 'Weather there')}</b><p style="margin-top:6px;font-size:16px">${w[1]} ${w[2]} · ${tC}°C · ${rain}% ${t('kans op regen', 'chance of rain')}</p>${tip ? `<p class="sub" style="margin-top:4px">${tip}</p>` : ''}<p class="sub" style="font-size:10px;margin-top:6px">Open-Meteo.com</p>`;
    } catch (e) { el.remove() }
  }
  const route = p => p.plat != null ? `https://www.google.com/maps/dir/?api=1&destination=${p.plat},${p.plng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.place)}`;
  const stamp = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const gcal = p => `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: 'Date: ' + p.activity, dates: stamp(p.starts_at) + '/' + stamp(new Date(p.starts_at).getTime() + p.minutes * 6e4), location: p.place, details: 'Galaxy' })}`;
  function ics() {
    const p = cur, e = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Galaxy//Date//NL', 'BEGIN:VEVENT', `UID:${p.id}@galaxy`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(p.starts_at)}`, `DTEND:${stamp(new Date(p.starts_at).getTime() + p.minutes * 6e4)}`,
      `SUMMARY:${e('Date: ' + p.activity)}`, `LOCATION:${e(p.place)}`, ...(p.plat != null ? [`GEO:${p.plat};${p.plng}`] : []), 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${e(t('Je date begint over 1 uur', 'Your date starts in 1 hour'))}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); a.download = 'galaxy-date.ics'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 500);
  }
  async function safe(withLoc) {
    const p = cur; let txt = t(`Hey! Ik heb een date op ${fmt(p.starts_at)} bij ${p.place}. Ik laat je weten wanneer ik veilig thuis ben 💜`, `Hey! I have a date on ${fmt(p.starts_at)} at ${p.place}. I'll let you know when I'm home safe 💜`);
    if (p.plat != null) txt += `\n📍 https://www.openstreetmap.org/?mlat=${p.plat}&mlon=${p.plng}#map=17/${p.plat}/${p.plng}`;
    if (withLoc && navigator.geolocation) {
      try { const pos = await new Promise((ok, no) => navigator.geolocation.getCurrentPosition(ok, no, { enableHighAccuracy: true, timeout: 10000 })); const la = pos.coords.latitude.toFixed(5), lo = pos.coords.longitude.toFixed(5); txt += `\n${t('Hier ben ik nu', 'I am here now')}: https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=17/${la}/${lo}` }
      catch (e) { T(t('Je locatie kon niet worden opgehaald', 'Could not get your location')) }
    }
    try { if (navigator.share) await navigator.share({ text: txt }); else window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener') } catch (e) { }
  }
  async function respond(st) {
    const reply = ($('dpReply') || {}).value || '';
    const r = await db().rpc('date_respond', { p: cur.id, st, wish: { moods: myWish.moods }, msg: reply });
    if (r.error) { console.error(r.error); return T(t('Dat lukte niet. Misschien is het voorstel al beantwoord.', 'That didn\'t work. Maybe it was already answered.')) }
    const label = { confirmed: '✅ ' + t('Date bevestigd!', 'Date confirmed!'), other_time: '🕒 ' + t('Kan een ander moment?', 'Another time?'), declined: '🙅 ' + t('Ik moet helaas afzeggen', 'I have to decline, sorry') }[st];
    await chatMsg(cur.from_id, `${label}${reply ? ' ' + reply.trim().slice(0, 200) : ''} [#date:${cur.id}]`);
    if (st === 'confirmed') { try { burst() } catch (e) { } }
    open(cur.id);
  }
  async function cancel() {
    if (!confirm(t('Deze date annuleren?', 'Cancel this date?'))) return;
    const r = await db().rpc('date_cancel', { p: cur.id }); if (r.error) return T(t('Annuleren lukte niet', 'Could not cancel'));
    await chatMsg(cur.from_id === me() ? cur.to_id : cur.from_id, `✖️ ${t('Date geannuleerd', 'Date cancelled')} [#date:${cur.id}]`); open(cur.id);
  }
  async function again(yes) {
    const r = await db().rpc('date_again', yes == null ? { p: cur.id } : { p: cur.id, yes }); const el = $('dpAgainR'); if (r.error || !el) return;
    const j = r.data || {};
    el.innerHTML = j.both ? `<span style="font-size:16px">🎉💜 <b>${t('Jullie willen allebei een tweede date!', 'You both want a second date!')}</b></span>` : j.mine === true ? t('Opgeslagen. Je ziet het hier als de ander ook ja zegt.', 'Saved. You\'ll see it here if they say yes too.') : j.mine === false ? t('Opgeslagen. Dit blijft privé.', 'Saved. This stays private.') : '';
    if (j.both) { try { burst() } catch (e) { } }
  }

  /* ---------- 3. overzicht ---------- */
  async function list() {
    if (!db() || !me()) return T(t('Even geduld: Galaxy maakt nog verbinding.', 'One moment: Galaxy is still connecting.'));
    addCss();
    const r = await db().from('date_plans').select('id,from_id,to_id,status,activity,place,starts_at,minutes,from_wish').order('starts_at', { ascending: true }).limit(100);
    const all = (r.data || []).filter(p => p.status !== 'cancelled'), now = Date.now();
    const up = all.filter(p => new Date(p.starts_at).getTime() + p.minutes * 6e4 > now), past = all.filter(p => !up.includes(p)).reverse().slice(0, 10);
    const row = p => { const o = p.from_id === me() ? p.to_id : p.from_id, st = STATUS()[p.status] || ['', '']; return `<button class="opt" onclick="GLXDATE.open('${p.id}')"><div class="dpRow"><b>${actOf((p.from_wish || {}).act)[1]} ${esc(p.activity)}</b><span>${st[0]}</span></div><span class="sub">${esc((net().nameOf && net().nameOf(o)) || '')} · ${esc(fmt(p.starts_at))} · ${esc(p.place)}</span></button>` };
    xs('📅 ' + t('Mijn dates', 'My dates'), `${up.length ? `<div class="dpH">${t('Gepland', 'Upcoming')}</div>` + up.map(row).join('') : `<div class="box"><p class="sub">${t('Nog geen dates gepland. Open een chat met een match en tik op 📅 Date plannen.', 'No dates yet. Open a chat with a match and tap 📅 Plan a date.')}</p></div>`}${past.length ? `<div class="dpH">${t('Voorbij', 'Past')}</div>` + past.map(row).join('') : ''}`, false);
  }

  /* ---------- chat-koppeling: [#date:uuid] wordt een knop ---------- */
  function tokens(html) { return String(html).replace(/\[#date:([0-9a-f-]{36})\]/gi, (m, id) => `<button class="dpTok" onclick="GLXDATE.open('${id}')">📅 ${t('Bekijk de date', 'View date')} ›</button>`) }

  window.GLXDATE = {
    plan, open, list, tokens,
    _mood(k) { keep(); D.moods[k] = ((D.moods[k] || 0) + 1) % 4; if (!D.moods[k]) delete D.moods[k]; draw() },
    _myMood(k) { const r = $('dpReply'), v = r ? r.value : ''; myWish.moods[k] = ((myWish.moods[k] || 0) + 1) % 4; if (!myWish.moods[k]) delete myWish.moods[k]; render(); const r2 = $('dpReply'); if (r2) r2.value = v },
    _set(k, v, quiet) { keep(); D[k] = v; if (!quiet) draw() },
    _place(i) { keep(); const p = D.nb[i]; D.place = D.place && D.place.id === p.id ? null : p; draw() },
    _own(v) { D.own = v; if (D.place && v) { D.place = null; document.querySelectorAll('#xSheet .dpChip').forEach(b => { if (/^📍/.test(b.textContent.trim())) b.classList.remove('on') }) } },
    _comfort(k) { keep(); D.comfort = D.comfort.includes(k) ? D.comfort.filter(x => x !== k) : D.comfort.concat(k); draw() },
    _send: send, _respond: respond, _cancel: cancel, _again: again, _ics: ics, _safe: safe
  };

  /* ---------- in de app haken ---------- */
  function hook() {
    try { if (typeof HUB !== 'undefined' && !HUB.some(h => /GLXDATE/.test(h[2]))) HUB.splice(1, 0, ['📅', t('Mijn dates', 'My dates'), 'GLXDATE.list()']) } catch (e) { }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
