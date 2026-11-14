/* Galaxy – Dagbonus.
   Elke dag dat je Galaxy opent: een stempel en 5 munten. Na 7 stempels (hoeven niet na elkaar, zoals de
   Research Breakthrough in Pokémon GO): een Sterrendoos met 30 munten, genoeg voor een Boost.
   Eerlijk ontworpen: geen reeks die je kwijtraakt, geen schuldgevoel, geen willekeurige prijzen, geen meldingen,
   en je kunt de dagbonus uitzetten (zoals de EU wil met de Digital Fairness Act).
   Extra: de Vraag van de dag (+3 munten) die je een dag op je profiel kunt zetten als gespreksopener. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = m => { try { toast(m) } catch (e) { } };
  const nl = () => { try { return (typeof LANG === 'undefined' ? 'nl' : LANG) === 'nl' } catch (e) { return true } };
  const t = (a, b) => nl() ? a : b;
  const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)) } catch (e) { return null } };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') };
  const DAY_COINS = 5, BOX_COINS = 30, Q_COINS = 3;
  const QKEY = '💬 Vraag van de dag';

  /* munten bewaren op dit toestel (ze gingen verloren bij herladen) */
  function coinsInit() {
    try {
      const saved = ls('glxCoins'); if (typeof saved === 'number' && saved >= 0) { S.coins = saved; const c = $('coins'); if (c) c.textContent = S.coins }
      if (typeof window.setCoins === 'function' && !window.setCoins._glx) { const o = window.setCoins; window.setCoins = function (d) { o(d); ls('glxCoins', S.coins) }; window.setCoins._glx = 1; ls('glxCoins', S.coins) }
    } catch (e) { }
  }
  const give = n => { try { setCoins(n) } catch (e) { } };

  const st = () => ls('glxDaily') || { stamps: [], total: 0, boxes: 0, q: null };
  const save = s => ls('glxDaily', s);
  const off = () => !!ls('glxDailyOff');

  /* ---------- vraag van de dag ---------- */
  const QS = () => nl() ? ['Wat is je perfecte zondag?', 'Welk liedje staat nu op repeat?', 'Koffie, thee of iets anders?', 'Waar wil je ooit nog naartoe?', 'Wat maakt jou meteen blij?', 'Beste snack ooit?', 'Welke film kun je blijven kijken?', 'Strand of bergen?', 'Wat is je verborgen talent?', 'Wat leerde je dit jaar?', 'Hond of kat?', 'Ochtendmens of avondmens?', 'Welk gerecht kook je het best?', 'Wat staat op je bucketlist?', 'Je ideale eerste date in drie woorden?', 'Welke app open je het vaakst (behalve Galaxy)?', 'Wat doe je als je niet kunt slapen?', 'Grootste guilty pleasure?', 'Waar ben je trots op?', 'Welk festival of concert vergeet je nooit?', 'Wat is je favoriete plek in je stad?', 'Welk boek of welke serie raad je aan?', 'Wat is je comfort food?', 'Welke superkracht zou je kiezen?', 'Wat is het beste advies dat je ooit kreeg?', 'Zomer of winter?', 'Welke game speel je graag?', 'Wat maakt een dag voor jou geslaagd?', 'Welke taal wil je nog leren?', 'Wat is je lievelingsseizoen en waarom?']
    : ['What is your perfect Sunday?', 'Which song is on repeat right now?', 'Coffee, tea or something else?', 'Where do you still want to go?', 'What makes you happy instantly?', 'Best snack ever?', 'Which film could you rewatch forever?', 'Beach or mountains?', 'What is your hidden talent?', 'What did you learn this year?', 'Dog or cat?', 'Morning person or night owl?', 'What do you cook best?', 'What is on your bucket list?', 'Your ideal first date in three words?', 'Which app do you open most (besides Galaxy)?', 'What do you do when you can\'t sleep?', 'Biggest guilty pleasure?', 'What are you proud of?', 'Which festival or concert will you never forget?', 'Favourite spot in your city?', 'Which book or series do you recommend?', 'What is your comfort food?', 'Which superpower would you pick?', 'Best advice you ever got?', 'Summer or winter?', 'Which game do you like to play?', 'What makes a day a good day for you?', 'Which language do you still want to learn?', 'Favourite season and why?'];
  const qToday = () => { const d = new Date(), start = new Date(d.getFullYear(), 0, 0), n = Math.floor((d - start) / 864e5); const L = QS(); return L[n % L.length] };
  function profileQ(text) {
    try {
      ME.basics = ME.basics || {};
      if (text) ME.basics[QKEY] = text.slice(0, 160); else delete ME.basics[QKEY];
      window.saveMe && saveMe(); window.GLXNET && GLXNET.sync && GLXNET.sync();
      typeof renderProfExtra === 'function' && renderProfExtra();
    } catch (e) { }
  }
  function expireQ() { const s = st(); if (s.q && s.q.d !== today() && s.q.shown) { s.q.shown = false; save(s); profileQ(null) } }

  /* ---------- het scherm ---------- */
  function open(isNew, gotBox) {
    const s = st(), n = s.stamps.length, q = s.q && s.q.d === today() ? s.q : null;
    const dots = Array.from({ length: 7 }, (_, i) => `<div style="width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:18px;${i < n ? 'background:linear-gradient(135deg,#8b5cf6,#ec4899);box-shadow:0 0 14px #ec489966' : 'background:var(--card2);border:1px dashed var(--line);opacity:.7'}">${i < n ? '⭐' : i === 6 ? '🎁' : ''}</div>`).join('');
    xs('🎁 ' + t('Dagbonus', 'Daily bonus'), `
${gotBox ? `<div class="box" style="text-align:center;border-color:#f59e0b"><div style="font-size:52px">🎁</div><b style="font-size:18px">${t('Sterrendoos geopend!', 'Star box opened!')}</b><p class="sub" style="margin-top:6px">+${BOX_COINS} 🪙${t(', genoeg voor een Boost van 30 minuten.', ', enough for a 30-minute Boost.')}</p></div>` : ''}
${isNew && !gotBox ? `<div class="box" style="text-align:center"><div style="font-size:40px">⭐</div><b>${t('Stempel van vandaag binnen', 'Today\'s stamp collected')}</b><p class="sub" style="margin-top:4px">+${DAY_COINS} 🪙</p></div>` : ''}
<div class="box"><b>${t('Jouw stempels', 'Your stamps')}</b> <span class="sub">${n}/7</span>
<div style="display:flex;gap:6px;justify-content:space-between;margin:12px 0 8px">${dots}</div>
<p class="sub" style="font-size:12px">${t('Eén stempel per dag dat je Galaxy opent. De dagen hoeven niet na elkaar: je verliest nooit iets als je een dag overslaat. Bij 7 stempels: een Sterrendoos met ' + BOX_COINS + ' munten.', 'One stamp per day you open Galaxy. The days don\'t have to be in a row: you never lose anything if you skip a day. At 7 stamps: a Star box with ' + BOX_COINS + ' coins.')}</p>
<p class="sub" style="font-size:12px;margin-top:6px">${t('Totaal', 'Total')}: ${s.total} ${t('dagen', 'days')} · ${s.boxes} ${s.boxes === 1 ? t('Sterrendoos', 'Star box') : t('Sterrendozen', 'Star boxes')}</p></div>
<div class="box"><b>💬 ${t('Vraag van de dag', 'Question of the day')}</b> <span class="sub">+${Q_COINS} 🪙</span>
<p style="margin:8px 0;font-size:16px">${esc(qToday())}</p>
${q ? `<p class="sub">✅ ${t('Jouw antwoord', 'Your answer')}: <b>${esc(q.a)}</b></p>
<div class="set"><span>${t('Vandaag op mijn profiel', 'On my profile today')}</span><button class="tg${q.shown ? ' on' : ''}" onclick="GLXDAY._show(!this.classList.contains('on'))"></button></div>`
        : `<input class="fld" id="dqA" maxlength="100" placeholder="${t('Jouw antwoord (max. 100 tekens)', 'Your answer (max 100 characters)')}" style="margin:0 0 8px">
<button class="btn sm" onclick="GLXDAY._answer()">${t('Beantwoorden', 'Answer')}</button>`}
<p class="sub" style="font-size:12px;margin-top:8px">${t('Zet je antwoord een dag op je profiel: een makkelijke opener voor wie je bekijkt.', 'Put your answer on your profile for a day: an easy opener for whoever views you.')}</p></div>
<div class="set"><span>${t('Dagbonus tonen bij het openen', 'Show daily bonus on open')}</span><button class="tg${off() ? '' : ' on'}" onclick="GLXDAY._toggle(this.classList.contains('on'))"></button></div>
<p class="sub" style="font-size:11px;margin-top:6px">${t('Munten staan op dit toestel en zijn niet in te wisselen voor geld.', 'Coins are stored on this device and cannot be exchanged for money.')}</p>`, false);
  }

  function stampToday() {
    const s = st(), d = today();
    if (s.stamps.includes(d) || s.lastDay === d) return null;
    s.stamps.push(d); s.total++; s.lastDay = d; give(DAY_COINS);
    let box = false; if (s.stamps.length >= 7) { s.stamps = []; s.boxes++; give(BOX_COINS); box = true }
    save(s); return { box };
  }

  function start() {
    coinsInit(); expireQ();
    let ready = false; try { ready = typeof ME !== 'undefined' && ME && ME.name } catch (e) { }
    if (!ready) return;
    const r = stampToday(); if (!r) return;
    let paused = false; try { paused = localStorage.glxPause != null } catch (e) { }
    if (off() || paused) { T('⭐ ' + t('Dagbonus', 'Daily bonus') + ': +' + (DAY_COINS + (r.box ? BOX_COINS : 0)) + ' 🪙'); return }
    setTimeout(() => { if (!document.querySelector('.ov.on')) open(true, r.box); else T('⭐ ' + t('Dagbonus', 'Daily bonus') + ': +' + (DAY_COINS + (r.box ? BOX_COINS : 0)) + ' 🪙') }, 2500);
  }

  window.GLXDAY = {
    open: () => open(false, false),
    _answer() {
      const a = (($('dqA') || {}).value || '').trim().slice(0, 100); if (a.length < 2) return T(t('Typ eerst een antwoord', 'Type an answer first'));
      const s = st(); const first = !(s.q && s.q.d === today()); s.q = { d: today(), a, shown: false }; save(s); if (first) give(Q_COINS);
      T('💬 +' + Q_COINS + ' 🪙'); open(false, false);
    },
    _show(on) { const s = st(); if (!s.q || s.q.d !== today()) return; s.q.shown = !!on; save(s); profileQ(on ? qToday() + ' ' + s.q.a : null); T(on ? t('Staat vandaag op je profiel', 'On your profile today') : t('Van je profiel gehaald', 'Removed from your profile')); open(false, false) },
    _toggle(wasOn) { ls('glxDailyOff', wasOn ? true : null); T(wasOn ? t('Dagbonus verschijnt niet meer vanzelf. Je stempels tellen wel door.', 'Daily bonus no longer pops up. Your stamps still count.') : t('Dagbonus staat weer aan', 'Daily bonus is on again')); open(false, false) }
  };

  function hook() {
    try { if (typeof HUB !== 'undefined' && !HUB.some(h => /GLXDAY/.test(h[2]))) HUB.splice(1, 0, ['🎁', t('Dagbonus', 'Daily bonus'), 'GLXDAY.open()']) } catch (e) { }
    start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
