/* Galaxy – Evenementen en festivals.
   Ontdekken · line-up met favorieten · tickets (gratis of via de betaallink van de organisator) ·
   ticket met QR die elke 30 s verandert (werkt ook offline) · organiseren · bezoekerslijst · scannen aan de ingang.
   Server: server/events.sql. QR-bibliotheken (MIT) worden pas geladen als ze nodig zijn, met integriteitscontrole. */
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
  const day = iso => new Date(iso).toLocaleDateString(loc(), { weekday: 'short', day: 'numeric', month: 'short' });
  const hm = iso => new Date(iso).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' });
  const when = e => { const s = new Date(e.starts_at), en = new Date(e.ends_at); return s.toDateString() === en.toDateString() ? `${day(e.starts_at)} · ${hm(e.starts_at)}–${hm(e.ends_at)}` : `${day(e.starts_at)} ${hm(e.starts_at)} → ${day(e.ends_at)} ${hm(e.ends_at)}` };
  const euro = c => c ? new Intl.NumberFormat(loc() || 'en', { style: 'currency', currency: 'EUR' }).format(c / 100) : t('Gratis', 'Free');
  const code8 = id => String(id).replace(/-/g, '').slice(0, 8).toUpperCase();
  const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)) } catch (e) { return null } };
  const UUID = /^[0-9a-f-]{36}$/i;
  const LIBS = {
    qr: ['https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js', 'sha384-8FWZA6BGMXhsfO+BLtrJK0We6gg5o1JyO8xQm6peWDEUs17ACA5ziE/NIAkl9z2k', () => window.qrcode],
    scan: ['https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js', 'sha384-b5Ya4Bq3qCyz39m2ISh+4DxjAIljdeFwK/BsXLuj9gugaNwAcj/ia15fxNZL9Nlx', () => window.jsQR]
  };
  const lib = k => new Promise((ok, no) => { const [src, sri, get] = LIBS[k]; if (get()) return ok(get()); const s = document.createElement('script'); s.src = src; s.integrity = sri; s.crossOrigin = 'anonymous'; s.onload = () => ok(get()); s.onerror = () => no(new Error('lib')); document.head.appendChild(s) });

  const css = `<style id="evCss">
.evTabs{display:flex;gap:6px;margin-bottom:12px}.evTabs button{flex:1;padding:9px 6px;border-radius:12px;border:1px solid var(--line);background:var(--card2);color:inherit;font-weight:700;font-size:13px}
.evTabs button.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent;color:#fff}
.evCard{display:block;width:100%;text-align:left;border-radius:18px;padding:14px;margin-bottom:10px;border:1px solid var(--line);color:inherit;background:linear-gradient(135deg,rgba(139,92,246,.22),rgba(236,72,153,.16))}
.evCard h3{font-size:17px;margin:0 0 4px}.evMeta{font-size:13px;opacity:.85;display:flex;flex-wrap:wrap;gap:4px 12px}
.evPrice{display:inline-block;padding:3px 10px;border-radius:99px;background:#ffffff22;font-weight:800;font-size:12px}
.evBox{border-radius:16px;padding:14px;background:var(--card2);border:1px solid var(--line);margin-bottom:10px}
.evLine{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}.evLine:last-child{border:0}
.evLine b{min-width:48px;font-variant-numeric:tabular-nums}.evStar{margin-left:auto;background:none;border:0;font-size:20px;color:inherit;opacity:.35}.evStar.on{opacity:1}
.evQR{background:#fff;border-radius:20px;padding:14px;display:grid;place-items:center;margin:8px auto;max-width:300px}.evQR svg{width:100%;height:auto;display:block}
.evBar{height:5px;border-radius:9px;background:#ffffff22;overflow:hidden;margin-top:8px}.evBar i{display:block;height:100%;background:linear-gradient(90deg,#8b5cf6,#ec4899);transition:width 1s linear}
.evStat{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center}.evStat div{background:var(--card);border-radius:12px;padding:8px 2px}.evStat b{display:block;font-size:20px}
.evRes{position:fixed;inset:0;z-index:300;display:grid;place-items:center;text-align:center;color:#fff;font-size:20px;padding:30px}
.evRes b{display:block;font-size:34px;margin:10px 0}
</style>`;
  const addCss = () => { if (!$('evCss')) document.head.insertAdjacentHTML('beforeend', css) };
  const needDb = () => { if (!db() || !me()) { T(t('Even geduld: Galaxy maakt nog verbinding.', 'One moment: Galaxy is still connecting.')); return false } return true };

  /* ---------- 1. ontdekken / mijn tickets / organiseren ---------- */
  let tab = 'discover';
  async function open(which) {
    addCss(); if (which) tab = which;
    const tabs = `<div class="evTabs" role="tablist">${[['discover', '🎉 ' + t('Ontdek', 'Discover')], ['tickets', '🎟️ ' + t('Mijn tickets', 'My tickets')], ['org', '🛠️ ' + t('Organiseer', 'Organise')]].map(x => `<button role="tab" aria-selected="${tab === x[0]}" class="${tab === x[0] ? 'on' : ''}" onclick="GLXEVENT.open('${x[0]}')">${x[1]}</button>`).join('')}</div>`;
    if (tab === 'tickets') return xs('🎟️ ' + t('Mijn tickets', 'My tickets'), tabs + await ticketsHtml(), false);
    if (!needDb()) return;
    if (tab === 'org') {
      const r = await db().from('events').select('id,title,place,starts_at,ends_at,status,price_cents').eq('owner', me()).order('starts_at', { ascending: false }).limit(50);
      const mine = r.data || [];
      return xs('🛠️ ' + t('Organiseer', 'Organise'), tabs + `<button class="btn" style="width:100%;margin-bottom:12px" onclick="GLXEVENT.create()">＋ ${t('Nieuw evenement', 'New event')}</button>` +
        (mine.length ? mine.map(e => `<button class="evCard" onclick="GLXEVENT.manage('${e.id}')"><h3>${esc(e.title)} ${e.status === 'cancelled' ? '<span class="evPrice">' + t('Geannuleerd', 'Cancelled') + '</span>' : ''}</h3><div class="evMeta"><span>📅 ${esc(when(e))}</span><span>📍 ${esc(e.place)}</span></div></button>`).join('') : `<div class="evBox"><p class="sub">${t('Organiseer je eerste feestje, quiz of festival. Bezoekers halen hun ticket in de app en jij scant ze binnen met je gsm.', 'Organise your first party, quiz or festival. Guests get their ticket in the app and you scan them in with your phone.')}</p></div>`), false);
    }
    const r = await db().from('events').select('id,owner,title,place,lat,lng,starts_at,ends_at,price_cents,news').eq('status', 'published').gt('ends_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(60);
    let list = r.data || []; let c = null; try { c = GLXMAP._me && GLXMAP._me() } catch (e) { }
    const km = e => c && e.lat != null ? dist(c.lat, c.lng, e.lat, e.lng) / 1000 : null;
    xs('🎉 ' + t('Evenementen', 'Events'), tabs + (list.length ? list.map(e => { const k = km(e); const live = new Date(e.starts_at) <= new Date(); return `<button class="evCard" onclick="GLXEVENT.view('${e.id}')"><h3>${esc(e.title)}</h3><div class="evMeta"><span>${live ? '🔴 ' + t('Nu bezig', 'Live now') : '📅 ' + esc(when(e))}</span><span>📍 ${esc(e.place)}${k != null ? ' · ' + (k < 1 ? Math.round(k * 1000) + ' m' : k.toFixed(k < 10 ? 1 : 0) + ' km') : ''}</span></div><div style="margin-top:8px"><span class="evPrice">${euro(e.price_cents)}</span>${e.news ? ' <span class="evPrice">📢 ' + t('Nieuws', 'Update') + '</span>' : ''}</div></button>` }).join('') : `<div class="evBox"><p class="sub">${t('Nog geen evenementen gepland. Organiseer zelf iets via 🛠️ Organiseer!', 'No events yet. Organise one yourself via 🛠️ Organise!')}</p></div>`), false);
  }
  function dist(a, b, c, d) { const R = 6371e3, r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)) }

  /* ---------- 2. evenement bekijken ---------- */
  let ev = null;
  async function view(id) {
    if (!UUID.test(id) || !needDb()) return; addCss();
    const [r, k, mine] = await Promise.all([
      db().from('events').select('*').eq('id', id).maybeSingle(),
      db().rpc('event_counts', { ev: id }),
      db().from('tickets').select('id,status,secret,checked_in_at').eq('event_id', id).maybeSingle()
    ]);
    if (!r.data) return T(t('Dit evenement is niet (meer) beschikbaar', 'This event is no longer available'));
    ev = r.data; const left = (k.data || {}).left, tk = mine.data && mine.data.status !== 'cancelled' ? mine.data : null;
    if (tk) saveTicket(tk, ev);
    const owner = ev.owner === me(), over = new Date(ev.ends_at) < new Date();
    const fav = ls('glxFav_' + ev.id) || [];
    const stages = {}; (ev.lineup || []).forEach((l, i) => { (stages[l.s || ''] = stages[l.s || ''] || []).push([l, i]) });
    const lineup = Object.keys(stages).length ? `<div class="evBox"><b>🎤 Line-up</b>${Object.entries(stages).map(([s, arr]) => `${s ? `<p style="margin:10px 0 2px;font-weight:800;opacity:.8">${esc(s)}</p>` : ''}${arr.sort((a, b) => String(a[0].t).localeCompare(String(b[0].t))).map(([l, i]) => `<div class="evLine"><b>${esc(l.t)}</b><span>${esc(l.a)}</span><button class="evStar${fav.includes(i) ? ' on' : ''}" aria-label="${t('Favoriet', 'Favourite')}" aria-pressed="${fav.includes(i)}" onclick="GLXEVENT._fav(${i})">⭐</button></div>`).join('')}`).join('')}<p class="sub" style="font-size:12px;margin-top:6px">⭐ ${t('Tik op het sterretje om je eigen planning te maken.', 'Tap the star to build your own schedule.')}</p></div>` : '';
    let cta = '';
    if (ev.status === 'cancelled') cta = `<div class="evBox" style="border-color:#fb7185"><b>❌ ${t('Dit evenement is geannuleerd.', 'This event was cancelled.')}</b><p class="sub">${t('Neem contact op met de organisator voor een terugbetaling.', 'Contact the organiser about a refund.')}</p></div>`;
    else if (tk) cta = `<button class="btn" style="width:100%;margin-bottom:10px" onclick="GLXEVENT.ticket('${tk.id}')">🎟️ ${tk.status === 'reserved' ? t('Betaal en activeer je ticket', 'Pay and activate your ticket') : t('Toon mijn ticket', 'Show my ticket')}</button>`;
    else if (!over && !owner) cta = left === 0 ? `<div class="evBox"><b>😢 ${t('Uitverkocht', 'Sold out')}</b></div>` : `<button class="btn" style="width:100%;margin-bottom:10px" onclick="GLXEVENT._get()">🎟️ ${ev.price_cents ? t('Ticket kopen', 'Buy ticket') + ' · ' + euro(ev.price_cents) : t('Gratis ticket halen', 'Get free ticket')}</button>`;
    const route = ev.lat != null ? `https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.place)}`;
    xs('🎉 ' + esc(ev.title), `
${ev.news ? `<div class="evBox" style="border-color:#f59e0b"><b>📢 ${t('Update van de organisator', 'Update from the organiser')}</b><p style="margin-top:6px">${esc(ev.news)}</p><p class="sub" style="font-size:11px">${ev.news_at ? esc(day(ev.news_at) + ' ' + hm(ev.news_at)) : ''}</p></div>` : ''}
<div class="evCard" style="cursor:default"><h3>${esc(ev.title)}</h3><div class="evMeta"><span>📅 ${esc(when(ev))}</span><span>📍 ${esc(ev.place)}</span></div>
<div style="margin-top:8px"><span class="evPrice">${euro(ev.price_cents)}</span>${left != null && !over && ev.status !== 'cancelled' ? ` <span class="evPrice">${left} ${t('plaatsen over', 'spots left')}</span>` : ''} <span class="evPrice">🔞 18+</span></div></div>
${cta}
${ev.descr ? `<div class="evBox"><p style="white-space:pre-line">${esc(ev.descr)}</p></div>` : ''}
${lineup}
<a class="btn ghost" style="display:block;text-align:center;text-decoration:none;color:inherit;margin-bottom:8px" target="_blank" rel="noopener" href="${route}">🧭 ${t('Route', 'Directions')}</a>
${owner ? `<button class="btn ghost" style="width:100%;margin-bottom:8px" onclick="GLXEVENT.manage('${ev.id}')">🛠️ ${t('Beheer dit evenement', 'Manage this event')}</button>` : ''}
<button class="btn ghost" style="width:100%" onclick="GLXEVENT.open()">‹ ${t('Alle evenementen', 'All events')}</button>`, false);
  }
  async function getTicket() {
    const r = await db().rpc('ticket_get', { ev: ev.id });
    if (r.error) return T(/uitverkocht/.test(r.error.message) ? t('Helaas, uitverkocht', 'Sorry, sold out') : t('Dat lukte niet', 'That didn\'t work'));
    const tk = r.data; saveTicket(tk, ev);
    T(tk.status === 'valid' ? '🎟️ ' + t('Je ticket staat klaar!', 'Your ticket is ready!') : t('Ticket gereserveerd: betaal om het te activeren', 'Ticket reserved: pay to activate it'));
    ticket(tk.id);
  }

  /* ---------- 3. ticket met wisselende QR (ook offline) ---------- */
  function saveTicket(tk, e) {
    const all = ls('glxTickets') || {};
    all[tk.id] = { id: tk.id, secret: tk.secret, status: tk.status, ev: { id: e.id, title: e.title, place: e.place, starts_at: e.starts_at, ends_at: e.ends_at, price_cents: e.price_cents, pay_url: e.pay_url } };
    ls('glxTickets', all);
  }
  async function ticketsHtml() {
    let all = ls('glxTickets') || {};
    if (db() && me()) {
      try {
        const r = await db().from('tickets').select('id,status,secret,event_id,events(id,title,place,starts_at,ends_at,price_cents,pay_url)').order('created_at', { ascending: false }).limit(50);
        if (!r.error) { all = {}; (r.data || []).filter(x => x.status !== 'cancelled' && x.events).forEach(x => { all[x.id] = { id: x.id, secret: x.secret, status: x.status, ev: x.events } }); ls('glxTickets', all) }
      } catch (e) { }
    }
    const list = Object.values(all).sort((a, b) => new Date(a.ev.starts_at) - new Date(b.ev.starts_at));
    const up = list.filter(x => new Date(x.ev.ends_at) > new Date());
    return up.length ? up.map(x => `<button class="evCard" onclick="GLXEVENT.ticket('${x.id}')"><h3>🎟️ ${esc(x.ev.title)}</h3><div class="evMeta"><span>📅 ${esc(when(x.ev))}</span><span>📍 ${esc(x.ev.place)}</span></div><div style="margin-top:8px"><span class="evPrice">${x.status === 'valid' ? '✅ ' + t('Geldig', 'Valid') : x.status === 'used' ? '🎉 ' + t('Binnen', 'Checked in') : '⏳ ' + t('Wacht op betaling', 'Awaiting payment')}</span></div></button>`).join('') + `<p class="sub" style="font-size:12px">📶 ${t('Je tickets werken ook zonder internet zodra je ze één keer hebt geopend.', 'Your tickets also work offline once you\'ve opened them once.')}</p>`
      : `<div class="evBox"><p class="sub">${t('Je hebt nog geen tickets. Ontdek evenementen in de buurt!', 'No tickets yet. Discover events nearby!')}</p></div>`;
  }
  let qrT = null, wake = null;
  async function sign(id, secret, slot) {
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const s = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(id + ':' + slot)));
    return [...s].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }
  async function ticket(id) {
    addCss(); let tk = (ls('glxTickets') || {})[id];
    if (db() && me()) { try { const r = await db().from('tickets').select('id,status,secret,events(id,title,place,starts_at,ends_at,price_cents,pay_url)').eq('id', id).maybeSingle(); if (r.data) { tk = { id, secret: r.data.secret, status: r.data.status, ev: r.data.events }; const all = ls('glxTickets') || {}; all[id] = tk; ls('glxTickets', all) } } catch (e) { } }
    if (!tk) return T(t('Ticket niet gevonden', 'Ticket not found'));
    const e = tk.ev, code = code8(tk.id);
    let body = `<div class="evCard" style="cursor:default"><h3>${esc(e.title)}</h3><div class="evMeta"><span>📅 ${esc(when(e))}</span><span>📍 ${esc(e.place)}</span></div></div>`;
    if (tk.status === 'reserved') {
      body += `<div class="evBox"><b>⏳ ${t('Nog te betalen', 'Payment needed')}: ${euro(e.price_cents)}</b>
<ol style="margin:10px 0 0 18px;line-height:1.6"><li>${t('Betaal via de betaallink van de organisator.', 'Pay via the organiser\'s payment link.')}</li><li>${t('Zet deze code in de mededeling', 'Put this code in the payment reference')}: <b style="font-size:18px;letter-spacing:2px">${code}</b> <button class="btn sm ghost" onclick="navigator.clipboard&&navigator.clipboard.writeText('${code}').then(()=>toast('${t('Gekopieerd', 'Copied')}'))">📋</button></li><li>${t('De organisator bevestigt je betaling. Dan verschijnt hier je QR-code.', 'The organiser confirms your payment. Then your QR code appears here.')}</li></ol>
${e.pay_url ? `<a class="btn" style="display:block;text-align:center;text-decoration:none;color:#fff;margin-top:12px" href="${esc(e.pay_url)}" target="_blank" rel="noopener noreferrer">💳 ${t('Naar betalen', 'Go to payment')} · ${euro(e.price_cents)}</a><p class="sub" style="font-size:11px;margin-top:6px">🔗 ${esc((() => { try { return new URL(e.pay_url).hostname } catch (x) { return '' } })())} · ${t('Galaxy ontvangt of bewaart geen betaalgegevens. De organisator is de verkoper.', 'Galaxy does not receive or store payment details. The organiser is the seller.')}</p>` : ''}</div>
<button class="btn ghost" style="width:100%;margin-bottom:8px" onclick="GLXEVENT.ticket('${tk.id}')">🔄 ${t('Status vernieuwen', 'Refresh status')}</button>`;
    } else if (tk.status === 'used') {
      body += `<div class="evBox" style="text-align:center"><div style="font-size:48px">🎉</div><b>${t('Je bent binnen. Veel plezier!', 'You\'re in. Have fun!')}</b></div>`;
    } else {
      body += `<div class="evQR" id="evQR" aria-label="QR-code ticket"></div><div class="evBar"><i id="evBarI" style="width:100%"></i></div>
<p style="text-align:center;margin-top:10px">${t('Code', 'Code')}: <b style="letter-spacing:2px">${code}</b></p>
<p class="sub" style="text-align:center;font-size:12px;margin-top:4px">🔆 ${t('Zet je scherm op de hoogste helderheid. De code verandert elke 30 seconden, dus een screenshot werkt niet.', 'Turn your brightness up. The code changes every 30 seconds, so a screenshot won\'t work.')}</p>`;
    }
    if (tk.status !== 'used' && new Date(e.starts_at) > new Date()) body += `<button class="btn ghost" style="width:100%;margin-bottom:8px;color:#fb7185" onclick="GLXEVENT._cancel('${tk.id}')">${t('Ticket annuleren', 'Cancel ticket')}</button>`;
    body += `<button class="btn ghost" style="width:100%" onclick="GLXEVENT.view('${e.id}')">ℹ️ ${t('Over dit evenement', 'About this event')}</button>`;
    xs('🎟️ ' + t('Ticket', 'Ticket'), body, false);
    clearInterval(qrT);
    if (tk.status === 'valid') {
      try { wake = await navigator.wakeLock.request('screen') } catch (x) { }
      const draw = async () => {
        const el = $('evQR'); if (!el) { clearInterval(qrT); try { wake && wake.release() } catch (x) { } return }
        const now = Date.now() / 1000, slot = Math.floor(now / 30), left = 30 - (now % 30);
        try {
          const qrcode = await lib('qr'); const q = qrcode(0, 'M'); q.addData(`GLX1:${tk.id}:${slot}:${await sign(tk.id, tk.secret, slot)}`); q.make();
          if (el.dataset.slot !== String(slot)) { el.innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); el.dataset.slot = slot }
        } catch (x) { el.innerHTML = `<p style="color:#111;text-align:center;padding:20px">${t('QR kon niet laden. Toon je code', 'QR could not load. Show your code')}: <b>${code}</b></p>` }
        const b = $('evBarI'); if (b) b.style.width = (left / 30 * 100) + '%';
      };
      draw(); qrT = setInterval(draw, 1000);
    }
  }

  /* ---------- 4. organiseren ---------- */
  let F = null;
  function create() {
    if (!needDb()) return; addCss();
    const nb = nearby();
    F = F || { title: '', descr: '', place: '', venue: null, start: '', end: '', cap: 100, price: '', pay: '', lineup: [{ t: '', a: '', s: '' }], ok: false };
    F.nb = nb; drawCreate();
  }
  function drawCreate() {
    const min = new Date(Date.now() + 3600e3); const local = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    const fld = (id, lab, v, extra = '') => `<label class="sub" style="display:block;margin:10px 0 4px">${lab}</label><input class="fld" id="${id}" value="${esc(v)}" ${extra} style="margin:0">`;
    xs('＋ ' + t('Nieuw evenement', 'New event'), `
${fld('evT', t('Naam', 'Name') + ' *', F.title, 'maxlength="100" placeholder="' + t('bv. Zomerfeest aan de vijver', 'e.g. Summer party by the lake') + '"')}
<label class="sub" style="display:block;margin:10px 0 4px">${t('Beschrijving', 'Description')}</label><textarea class="fld" id="evD" maxlength="2000" rows="3" style="margin:0" placeholder="${t('Wat mogen mensen verwachten? Dresscode, eten, huisregels…', 'What can people expect? Dress code, food, house rules…')}">${esc(F.descr)}</textarea>
<label class="sub" style="display:block;margin:10px 0 4px">${t('Plek', 'Venue')} *</label>
${F.nb.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">${F.nb.map((p, i) => `<button type="button" class="pill${F.venue && F.venue.id === p.id ? ' on' : ''}" style="${F.venue && F.venue.id === p.id ? 'background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff' : ''}" onclick="GLXEVENT._venue(${i})">📍 ${esc(p.name)}</button>`).join('')}</div>` : ''}
<input class="fld" id="evP" maxlength="200" value="${esc(F.venue ? F.venue.name : F.place)}" placeholder="${t('Naam en adres van de plek', 'Venue name and address')}" style="margin:0" oninput="GLXEVENT._typed()">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${fld('evS', t('Begint', 'Starts') + ' *', F.start, 'type="datetime-local" min="' + local(min) + '"')}${fld('evE', t('Eindigt', 'Ends') + ' *', F.end, 'type="datetime-local" min="' + local(min) + '"')}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${fld('evC', t('Max. bezoekers', 'Capacity') + ' *', F.cap, 'type="number" min="1" max="100000" inputmode="numeric"')}${fld('evPr', t('Prijs in € (0 = gratis)', 'Price in € (0 = free)'), F.price, 'type="number" min="0" max="1000" step="0.5" inputmode="decimal" placeholder="0" oninput="GLXEVENT._price()"')}</div>
<div id="evPayBox" style="${+F.price > 0 ? '' : 'display:none'}">${fld('evPay', t('Jouw betaallink', 'Your payment link') + ' *', F.pay, 'type="url" maxlength="300" placeholder="https://…"')}<p class="sub" style="font-size:12px;margin-top:4px">${t('Maak gratis een betaallink bij bv. Mollie, Stripe, PayPal of Payconiq. Kopers betalen daar met hun ticketcode als mededeling; jij bevestigt de betaling in de app.', 'Create a free payment link with e.g. Mollie, Stripe, PayPal or Payconiq. Buyers pay there with their ticket code as reference; you confirm payment in the app.')}</p></div>
<label class="sub" style="display:block;margin:14px 0 4px">🎤 Line-up / ${t('programma (optioneel)', 'schedule (optional)')}</label>
${F.lineup.map((l, i) => `<div style="display:grid;grid-template-columns:96px 1fr 84px 34px;gap:6px;margin-bottom:6px"><input class="fld" style="margin:0" type="time" value="${esc(l.t)}" onchange="GLXEVENT._lu(${i},'t',this.value)"><input class="fld" style="margin:0" maxlength="60" placeholder="${t('Artiest of activiteit', 'Artist or activity')}" value="${esc(l.a)}" oninput="GLXEVENT._lu(${i},'a',this.value)"><input class="fld" style="margin:0" maxlength="30" placeholder="${t('Podium', 'Stage')}" value="${esc(l.s)}" oninput="GLXEVENT._lu(${i},'s',this.value)"><button class="pill" aria-label="${t('Verwijder', 'Remove')}" onclick="GLXEVENT._luDel(${i})">✕</button></div>`).join('')}
<button class="btn sm ghost" onclick="GLXEVENT._luAdd()">＋ ${t('Regel toevoegen', 'Add row')}</button>
<label style="display:flex;gap:10px;align-items:flex-start;margin:16px 0 10px;font-size:13px"><input type="checkbox" id="evOk" ${F.ok ? 'checked' : ''} style="margin-top:3px;width:20px;height:20px" onchange="GLXEVENT._keep()"><span>${t('Ik ben de organisator en zorg zelf voor de nodige vergunningen (gemeente), verzekering, veiligheid en muziekrechten (Unisono, vroeger Sabam/PlayRight). Ik verkoop tickets in eigen naam en regel terugbetalingen zelf.', 'I am the organiser and take care of permits, insurance, safety and music rights myself. I sell tickets in my own name and handle refunds myself.')}</span></label>
<button class="btn" style="width:100%" onclick="GLXEVENT._publish()">🚀 ${t('Publiceren', 'Publish')}</button>
<button class="btn ghost" style="width:100%;margin-top:8px" onclick="GLXEVENT.open('org')">‹ ${t('Terug', 'Back')}</button>`, false);
  }
  function keep() {
    const v = id => ($(id) || {}).value;
    if (!$('evT')) return;
    Object.assign(F, { title: v('evT'), descr: v('evD'), start: v('evS'), end: v('evE'), cap: v('evC'), price: v('evPr'), pay: v('evPay') || F.pay, ok: !!($('evOk') || {}).checked });
    if (!F.venue) F.place = v('evP');
  }
  function nearby() {
    const out = []; let c = null; try { c = (GLXMAP._me && GLXMAP._me()) || (GLXMAP._center && GLXMAP._center()) } catch (e) { }
    try { if (GLXMAP._venues && c) GLXMAP._venues.forEach((x, id) => { if (x && x.name && x.lat != null) { const d = dist(c.lat, c.lng, x.lat, x.lng); if (d < 5000) out.push({ id, name: x.name, lat: x.lat, lng: x.lng, d }) } }) } catch (e) { }
    return out.sort((a, b) => a.d - b.d).slice(0, 6);
  }
  async function publish() {
    keep();
    const start = F.start ? new Date(F.start) : null, end = F.end ? new Date(F.end) : null, price = Math.round((+F.price || 0) * 100), cap = Math.floor(+F.cap);
    if ((F.title || '').trim().length < 3) return T(t('Geef je evenement een naam', 'Give your event a name'));
    const place = F.venue ? F.venue.name : (F.place || '').trim(); if (place.length < 2) return T(t('Vul de plek in', 'Enter the venue'));
    if (!start || isNaN(start) || start < new Date()) return T(t('Kies een starttijd in de toekomst', 'Pick a start time in the future'));
    if (!end || isNaN(end) || end <= start) return T(t('Het einde moet na de start liggen', 'The end must be after the start'));
    if (end - start > 14 * 864e5) return T(t('Maximaal 14 dagen', 'Maximum 14 days'));
    if (!(cap >= 1 && cap <= 100000)) return T(t('Kies een aantal bezoekers', 'Choose a capacity'));
    let pay = null;
    if (price > 0) { try { const u = new URL((F.pay || '').trim()); if (u.protocol !== 'https:') throw 0; pay = u.href } catch (e) { return T(t('Vul een geldige https-betaallink in', 'Enter a valid https payment link')) } }
    if (!F.ok) return T(t('Vink aan dat je de organisator bent', 'Tick that you are the organiser'));
    let c = null; try { c = GLXMAP._center && GLXMAP._center() } catch (e) { }
    const row = {
      owner: me(), title: F.title.trim().slice(0, 100), descr: (F.descr || '').trim().slice(0, 2000) || null, place: place.slice(0, 200),
      lat: F.venue ? F.venue.lat : (c ? +c.lat.toFixed(5) : null), lng: F.venue ? F.venue.lng : (c ? +c.lng.toFixed(5) : null),
      starts_at: start.toISOString(), ends_at: end.toISOString(), capacity: cap, price_cents: price, pay_url: pay,
      lineup: F.lineup.filter(l => (l.a || '').trim()).map(l => ({ t: String(l.t || '').slice(0, 5), a: String(l.a).trim().slice(0, 60), s: String(l.s || '').trim().slice(0, 30) })).slice(0, 80)
    };
    const r = await db().from('events').insert(row).select('id').single();
    if (r.error) { console.error(r.error); return T(t('Publiceren lukte niet', 'Could not publish') + (/5/.test(r.error.message) ? '' : '')) }
    F = null; T('🚀 ' + t('Je evenement staat online!', 'Your event is live!')); manage(r.data.id);
  }

  /* ---------- 5. beheren: tellers, bezoekers, betalingen, nieuws ---------- */
  let att = [], mid = null;
  async function manage(id) {
    if (!UUID.test(id) || !needDb()) return; addCss(); mid = id;
    const [r, k, a] = await Promise.all([db().from('events').select('*').eq('id', id).maybeSingle(), db().rpc('event_counts', { ev: id }), db().rpc('event_attendees', { ev: id })]);
    if (!r.data || r.data.owner !== me()) return T(t('Alleen de organisator kan dit beheren', 'Only the organiser can manage this'));
    const e = r.data, c = k.data || {}; att = a.data || []; ev = e;
    xs('🛠️ ' + esc(e.title), `
<div class="evStat"><div><b>${c.valid || 0}</b>${t('geldig', 'valid')}</div><div><b>${c.reserved || 0}</b>${t('te betalen', 'unpaid')}</div><div><b>${c.used || 0}</b>${t('binnen', 'in')}</div><div><b>${c.left ?? '–'}</b>${t('vrij', 'left')}</div></div>
<p class="sub" style="margin:8px 0">📅 ${esc(when(e))} · 📍 ${esc(e.place)} · ${euro(e.price_cents)}${e.status === 'cancelled' ? ' · <b style="color:#fb7185">' + t('GEANNULEERD', 'CANCELLED') + '</b>' : ''}</p>
${e.status !== 'cancelled' ? `<button class="btn" style="width:100%;margin-bottom:8px" onclick="GLXEVENT.scan('${e.id}')">📷 ${t('Tickets scannen aan de ingang', 'Scan tickets at the door')}</button>` : ''}
<div class="evBox"><b>📢 ${t('Update naar alle bezoekers', 'Update to all guests')}</b><textarea class="fld" id="evNews" maxlength="300" rows="2" style="margin:8px 0" placeholder="${t('bv. Deuren open om 19u! Neem een regenjas mee.', 'e.g. Doors open at 7pm! Bring a raincoat.')}">${esc(e.news || '')}</textarea><button class="btn sm" onclick="GLXEVENT._news()">${t('Plaatsen', 'Post')}</button></div>
<div class="evBox"><div style="display:flex;justify-content:space-between;align-items:center"><b>👥 ${t('Bezoekers', 'Guests')} (${att.length})</b><button class="btn sm ghost" onclick="GLXEVENT._csv()">⬇️ CSV</button></div>
<input class="fld" id="evFind" placeholder="${t('Zoek op naam of code', 'Search by name or code')}" oninput="GLXEVENT._find(this.value)" style="margin:8px 0">
<div id="evAtt">${attHtml('')}</div></div>
<button class="btn ghost" style="width:100%;margin-bottom:8px" onclick="GLXEVENT.view('${e.id}')">👀 ${t('Bekijk als bezoeker', 'View as guest')}</button>
${e.status !== 'cancelled' ? `<button class="btn ghost" style="width:100%;margin-bottom:8px;color:#fb7185" onclick="GLXEVENT._cancelEvent()">${t('Evenement annuleren', 'Cancel event')}</button>` : ''}
<button class="btn ghost" style="width:100%" onclick="GLXEVENT.open('org')">‹ ${t('Mijn evenementen', 'My events')}</button>`, false);
  }
  function attHtml(q) {
    q = (q || '').trim().toLowerCase();
    const L = att.filter(x => x.status !== 'cancelled' && (!q || (x.name || '').toLowerCase().includes(q) || x.code.toLowerCase().includes(q)));
    if (!L.length) return `<p class="sub">${q ? t('Niemand gevonden', 'Nobody found') : t('Nog geen tickets. Deel je evenement!', 'No tickets yet. Share your event!')}</p>`;
    const st = { valid: '✅ ' + t('geldig', 'valid'), reserved: '⏳ ' + t('te betalen', 'unpaid'), used: '🎉 ' + t('binnen', 'in') };
    return L.slice(0, 200).map(x => `<div class="evLine"><span style="flex:1;min-width:0"><b style="min-width:0">${esc(x.name || '?')}</b><br><small class="sub">${x.code} · ${st[x.status] || x.status}${x.checked_in_at ? ' ' + hm(x.checked_in_at) : ''}</small></span>${x.status === 'reserved' ? `<button class="btn sm" onclick="GLXEVENT._paid('${x.ticket}')">💶 ${t('Betaald', 'Paid')}</button>` : x.status === 'valid' ? `<button class="btn sm ghost" onclick="GLXEVENT._in('${x.ticket}')">${t('Binnenlaten', 'Let in')}</button>` : ''}</div>`).join('');
  }

  /* ---------- 6. scannen aan de ingang ---------- */
  let stream = null, scanning = false, lastCode = '', busy = false;
  async function scan(id) {
    mid = id; addCss();
    xs('📷 ' + t('Scannen', 'Scan'), `<div style="position:relative;border-radius:18px;overflow:hidden;background:#000;aspect-ratio:3/4"><video id="evCam" playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
<div style="position:absolute;inset:18%;border:3px solid #ffffffcc;border-radius:22px;box-shadow:0 0 0 999px #0006"></div></div>
<p class="sub" style="text-align:center;margin:8px 0" id="evScanMsg">${t('Richt de camera op de QR-code van het ticket', 'Point the camera at the ticket QR code')}</p>
<div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input class="fld" id="evCode" maxlength="8" placeholder="${t('Of typ de code (8 tekens)', 'Or type the code (8 chars)')}" style="margin:0;text-transform:uppercase"><button class="btn sm" onclick="GLXEVENT._manual()">OK</button></div>
<button class="btn ghost" style="width:100%;margin-top:10px" onclick="GLXEVENT._stop();GLXEVENT.manage('${id}')">‹ ${t('Stoppen', 'Stop')}</button>`, false);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const v = $('evCam'); v.srcObject = stream; await v.play(); scanning = true;
      const det = 'BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats()).includes('qr_code') ? new BarcodeDetector({ formats: ['qr_code'] }) : null;
      const jsQR = det ? null : await lib('scan');
      const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
      const loop = async () => {
        if (!scanning || !$('evCam')) return stop();
        try {
          let txt = null;
          if (det) { const r = await det.detect(v); txt = r[0] && r[0].rawValue }
          else if (v.videoWidth) { const w = 480, h = Math.round(v.videoHeight / v.videoWidth * w); cv.width = w; cv.height = h; cx.drawImage(v, 0, 0, w, h); const r = jsQR(cx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' }); txt = r && r.data }
          if (txt && !busy && txt !== lastCode) { lastCode = txt; await check(txt); setTimeout(() => { lastCode = '' }, 3000) }
        } catch (e) { }
        setTimeout(loop, det ? 150 : 250);
      };
      loop();
    } catch (e) { const m = $('evScanMsg'); if (m) m.innerHTML = '⚠️ ' + t('Geen toegang tot de camera. Geef toestemming of typ de code hieronder.', 'No camera access. Allow it or type the code below.') }
  }
  function stop() { scanning = false; try { stream && stream.getTracks().forEach(x => x.stop()) } catch (e) { } stream = null }
  async function check(txt) {
    busy = true;
    const r = await db().rpc('ticket_scan', { code: txt }); const j = r.data || { result: 'invalid' };
    const M = {
      ok: ['#16a34a', '✅', t('Welkom!', 'Welcome!')], already: ['#dc2626', '⛔', t('Al binnen', 'Already in')], unpaid: ['#d97706', '💶', t('Nog niet betaald', 'Not paid yet')],
      cancelled: ['#dc2626', '⛔', t('Geannuleerd ticket', 'Cancelled ticket')], expired: ['#d97706', '⏱️', t('Verlopen code: vraag de app te openen (geen screenshot)', 'Expired code: ask them to open the app (no screenshot)')],
      not_yours: ['#dc2626', '⛔', t('Ticket voor een ander evenement', 'Ticket for another event')], invalid: ['#dc2626', '⛔', t('Ongeldig ticket', 'Invalid ticket')]
    }[j.result] || ['#dc2626', '⛔', t('Ongeldig', 'Invalid')];
    try { navigator.vibrate && navigator.vibrate(j.result === 'ok' ? 80 : [80, 60, 80]) } catch (e) { }
    const d = document.createElement('div'); d.className = 'evRes'; d.style.background = M[0];
    d.innerHTML = `<div><div style="font-size:72px">${M[1]}</div><b>${esc(M[2])}</b>${j.name ? `<div>${esc(j.name)}</div>` : ''}${j.code ? `<div style="opacity:.8;letter-spacing:2px">${esc(j.code)}</div>` : ''}${j.at ? `<div style="opacity:.8">${t('om', 'at')} ${hm(j.at)}</div>` : ''}${j.result === 'unpaid' ? `<button class="btn" style="margin-top:16px;background:#fff;color:#111" onclick="event.stopPropagation();GLXEVENT._paidScan('${j.ticket}',this)">💶 ${t('Betaling ontvangen → binnenlaten', 'Payment received → let in')}</button>` : ''}</div>`;
    d.onclick = () => d.remove(); document.body.appendChild(d); setTimeout(() => { d.remove(); busy = false }, j.result === 'unpaid' ? 6000 : 1800);
  }

  window.GLXEVENT = {
    open, view, ticket, create, manage, scan,
    _get: getTicket, _publish: publish, _keep: keep, _stop: stop,
    _fav(i) { const k = 'glxFav_' + ev.id, f = ls(k) || []; ls(k, f.includes(i) ? f.filter(x => x !== i) : f.concat(i)); view(ev.id) },
    _venue(i) { keep(); const p = F.nb[i]; F.venue = F.venue && F.venue.id === p.id ? null : p; drawCreate() },
    _typed() { if (F.venue) { F.venue = null; document.querySelectorAll('#xSheet .pill.on').forEach(b => { b.classList.remove('on'); b.style.background = ''; b.style.color = '' }) } },
    _price() { const b = $('evPayBox'), v = +($('evPr') || {}).value; if (b) b.style.display = v > 0 ? '' : 'none' },
    _lu(i, k, v) { F.lineup[i][k] = v },
    _luAdd() { keep(); if (F.lineup.length < 80) F.lineup.push({ t: '', a: '', s: '' }); drawCreate() },
    _luDel(i) { keep(); F.lineup.splice(i, 1); if (!F.lineup.length) F.lineup.push({ t: '', a: '', s: '' }); drawCreate() },
    async _cancel(id) { if (!confirm(t('Ticket annuleren? Voor een terugbetaling neem je contact op met de organisator.', 'Cancel ticket? For a refund, contact the organiser.'))) return; const r = await db().rpc('ticket_cancel', { t: id }); if (r.error) return T(t('Annuleren lukte niet', 'Could not cancel')); const all = ls('glxTickets') || {}; delete all[id]; ls('glxTickets', all); T(t('Ticket geannuleerd', 'Ticket cancelled')); open('tickets') },
    async _paid(id) { const r = await db().rpc('ticket_confirm_paid', { t: id }); if (r.error) return T(t('Dat lukte niet', 'That didn\'t work')); T('💶 ' + t('Betaling bevestigd', 'Payment confirmed')); manage(mid) },
    async _paidScan(id, b) { b.disabled = true; const r = await db().rpc('ticket_confirm_paid', { t: id }); if (!r.error) await db().rpc('ticket_checkin', { t: id }); b.textContent = r.error ? '⚠️' : '✅ ' + t('Binnen', 'In'); setTimeout(() => { document.querySelectorAll('.evRes').forEach(x => x.remove()); busy = false }, 900) },
    async _in(id) { const r = await db().rpc('ticket_checkin', { t: id }); if (r.error) return T(t('Dat lukte niet', 'That didn\'t work')); T('🎉 ' + t('Binnengelaten', 'Checked in')); manage(mid) },
    _find(q) { const el = $('evAtt'); if (el) el.innerHTML = attHtml(q) },
    async _manual() {
      const c = (($('evCode') || {}).value || '').trim().toUpperCase(); if (c.length !== 8) return T(t('De code heeft 8 tekens', 'The code has 8 characters'));
      const a = await db().rpc('event_attendees', { ev: mid }); att = a.data || []; const x = att.find(y => y.code === c);
      if (!x) return T('⛔ ' + t('Onbekende code', 'Unknown code'));
      if (x.status === 'used') return T('⛔ ' + t('Al binnen om ', 'Already in at ') + hm(x.checked_in_at));
      if (x.status === 'reserved') return T('💶 ' + t('Nog niet betaald: bevestig eerst de betaling in de lijst', 'Not paid yet: confirm payment in the list first'));
      if (x.status !== 'valid') return T('⛔ ' + t('Ongeldig ticket', 'Invalid ticket'));
      const r = await db().rpc('ticket_checkin', { t: x.ticket }); T(r.error ? '⚠️' : '✅ ' + t('Welkom', 'Welcome') + ', ' + x.name); $('evCode').value = '';
    },
    async _news() { const v = (($('evNews') || {}).value || '').trim().slice(0, 300); const r = await db().from('events').update({ news: v || null, news_at: v ? new Date().toISOString() : null }).eq('id', mid); T(r.error ? t('Dat lukte niet', 'That didn\'t work') : '📢 ' + t('Geplaatst', 'Posted')) },
    async _cancelEvent() { if (!confirm(t('Evenement annuleren? Bezoekers zien dat het geannuleerd is. Terugbetalen doe je zelf via je betaaldienst.', 'Cancel event? Guests will see it is cancelled. You handle refunds via your payment provider.'))) return; const r = await db().from('events').update({ status: 'cancelled' }).eq('id', mid); T(r.error ? t('Dat lukte niet', 'That didn\'t work') : t('Evenement geannuleerd', 'Event cancelled')); manage(mid) },
    _csv() { const rows = [['naam', 'code', 'status', 'gekocht', 'binnen']].concat(att.map(x => [x.name, x.code, x.status, x.created_at, x.checked_in_at || ''])); const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'bezoekers.csv'; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500) }
  };

  function hook() { window.events = () => open('discover') }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
