/* Galaxy – één rustige icoonstijl (lijniconen) in plaats van losse emoji in de vaste delen van de app:
   onderbalk, bovenbalk, knoppen op de kaart en de tegels van Galaxy Extra.
   Plus: je eigen figuur op je profiel en minder knoppen op de kaart. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const nl = () => { try { return (typeof LANG === 'undefined' ? 'nl' : LANG) === 'nl' } catch (e) { return true } };
  const t = (a, b) => nl() ? a : b;

  /* lijniconen, 24×24, 1.8 dik, kleur van de tekst */
  const P = {
    map: '<path d="M9 4 3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5z"/><path d="M9 4v14M15 6.5v14"/>',
    chat: '<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z"/>',
    feed: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="12" cy="12" r="3.6"/><path d="M17 7h.01"/>',
    locate: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="1.6"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
    figure: '<circle cx="12" cy="5" r="2.4"/><path d="M12 8.5v6.5M7.5 11h9M9 21l3-6 3 6"/>',
    zap: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>',
    moon: '<path d="M20 14.6A8 8 0 1 1 9.4 4a6.4 6.4 0 0 0 10.6 10.6z"/>',
    spark: '<path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    music: '<path d="M9 18V5.5l11-2v12.5"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5"/><path d="M12 8C10.5 4.5 7 4.5 7 6.5S10 8 12 8zm0 0c1.5-3.5 5-3.5 5-1.5S14 8 12 8z"/>',
    party: '<path d="M4 20.5 9.5 6l8.5 8.5z"/><path d="M14 4.5c0 1.5 1.5 1.5 1.5 3M18.5 9c1.5 0 1.5 1.5 3 1.5M16.5 3.5v.01M20.5 6.5v.01M20 13v.01"/>',
    smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9.3 9.5h.01M14.7 9.5h.01"/>',
    mic: '<rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-9 8.5"/>',
    shield: '<path d="M12 3 19.5 6v5.5c0 4.7-3.2 7.9-7.5 9.5-4.3-1.6-7.5-4.8-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/>',
    leaf: '<path d="M5 19.5C5 10.5 11 5 19.5 4.5c0 8.5-5 14.5-14.5 15z"/><path d="M5 19.5 12 12.5"/>',
    qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h2.5v2.5H14zM20.5 14v6.5M14 20.5h3"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0M16 5a3.5 3.5 0 0 1 0 7M21.5 20.5a6.5 6.5 0 0 0-3.5-5.8"/>',
    palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.6-.8 1.3-1.7-.4-1.2.3-2.3 1.6-2.3h1.8a4 4 0 0 0 4-4c0-5-3.8-9-8.7-9z"/><path d="M7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.5c0-1 1.1-1.8 2.5-1.8s2.5.7 2.5 1.8-1.1 1.6-2.5 1.8-2.5.8-2.5 1.9 1.1 1.8 2.5 1.8 2.5-.7 2.5-1.8"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10.5l5-3v9l-5-3z"/>',
    badge: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5"/>',
    idcard: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16a3.4 3.4 0 0 1 6.4 0M14.5 10h4M14.5 13.5h3"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'
  };
  const svg = (n, s) => `<svg class="gi" viewBox="0 0 24 24" width="${s || 22}" height="${s || 22}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  window.GLXICON = svg;

  /* welk emoji wordt welk icoon in de tegels van Galaxy Extra */
  const TILE = { '🎉': 'party', '🎁': 'gift', '🌙': 'moon', '💃': 'smile', '🎙️': 'mic', '📷': 'image', '🛡️': 'shield', '🌿': 'leaf', '👤': 'user', '📱': 'qr', '📅': 'calendar', '👥': 'users', '🎨': 'palette', '🎰': 'gift', '💌': 'heart', '💬': 'chat', '⭐': 'spark', '🗺️': 'map', '🎬': 'video', '🪪': 'idcard', '🏅': 'badge' };

  const css = document.createElement('style');
  css.textContent = `
.gi{display:block;flex:none}
#nav button>span .gi{width:24px;height:24px;margin:0 auto}
#nav button>span{font-size:0!important;line-height:0;display:block;height:24px}
#nav button.on>span{color:#fff;filter:drop-shadow(0 0 8px #ec489988)}
header .ico .gi,header .pill .gi{width:20px;height:20px}
header .ico{display:grid;place-items:center}
#coinsBtn{display:inline-flex;align-items:center;gap:6px}#coinsBtn .gi{width:18px;height:18px;color:#fbbf24}
.gmSide button .gi{width:21px;height:21px;margin:auto}
.gmSide button{display:grid;place-items:center}
.tile .gIco{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#8b5cf633,#ec489922);border:1px solid #ffffff14;color:#f5f3ff;margin-bottom:2px}
.tile .gIco .gi{width:22px;height:22px}
.tile{gap:6px!important;padding:14px 6px!important;font-weight:600}
#gmTonight{position:absolute;left:12px;bottom:88px;z-index:4;display:flex;gap:6px}
#gmTonight button{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:99px;border:1px solid #ffffff22;background:rgba(17,14,46,.82);backdrop-filter:blur(10px);color:#fff;font:inherit;font-size:13px;font-weight:600}
#gmTonight button .gi{width:17px;height:17px}
#gmTonight button.hot{border-color:#fbbf24;color:#fde68a}
.profFig{width:100%;height:100%;object-fit:cover;object-position:50% 12%;border-radius:50%;background:radial-gradient(circle at 50% 35%,#8b5cf655,#1e1b4b)}
@media (prefers-reduced-motion:reduce){#nav button.on>span{filter:none}}`;
  document.head.appendChild(css);

  const set = (el, name, keepText) => { if (!el || el.dataset.gi === name) return; el.dataset.gi = name; if (keepText) el.innerHTML = svg(name) + keepText; else el.innerHTML = svg(name) };

  function nav() {
    const map = { feed: 'feed', map: 'map', chat: 'chat', live: 'map' };
    document.querySelectorAll('#nav button[data-v]').forEach(b => { const s = b.querySelector('span'); const n = map[b.dataset.v]; if (s && n && s.dataset.gi !== n) { s.dataset.gi = n; s.innerHTML = svg(n, 24) } });
  }
  function header() {
    document.querySelectorAll('header .ico').forEach(b => {
      const tx = b.textContent.trim(), on = b.getAttribute('onclick') || '';
      if (/openHub/.test(on) || tx === '✨') { set(b, 'grid'); b.setAttribute('aria-label', t('Galaxy Extra', 'Galaxy Extra')) }
      else if (/profile/.test(on) || tx === '👤') { set(b, 'user'); b.setAttribute('aria-label', t('Mijn profiel', 'My profile')) }
      else if (tx === '🎵' || /music|muziek/i.test(b.title + (b.getAttribute('aria-label') || ''))) { set(b, 'music'); b.setAttribute('aria-label', t('Muziek', 'Music')) }
    });
    const c = $('coinsBtn'); if (c && !c.querySelector('.gi')) { const n = $('coins'); c.innerHTML = svg('coin') + (n ? n.outerHTML : '') }
  }
  function mapSide() {
    const side = document.querySelector('.gmSide'); if (!side) return;
    const m = { gmLoc: 'locate', gmAvBtn: 'figure', gmPow: 'zap' };
    Object.entries(m).forEach(([id, n]) => { const b = $(id); if (b) { set(b, n); b.setAttribute('aria-label', b.title || n) } });
    /* "vanavond"-knoppen niet meer als losse emoji aan de zijkant, maar als twee duidelijke knoppen onderaan */
    ['exOutBtn', 'exEmoBtn', 'exEvBtn'].forEach(id => { const b = $(id); if (b) b.style.display = 'none' });
    const wrap = $('gmWrap'); if (wrap && !$('gmTonight') && window.GLXEXTRA) {
      wrap.insertAdjacentHTML('beforeend', `<div id="gmTonight"><button type="button" id="gtOut">${svg('moon')}${t('Uit vanavond', 'Out tonight')}</button><button type="button" id="gtEv">${svg('party')}${t('Galaxy-avonden', 'Galaxy nights')}</button><button type="button" id="gtEmo" aria-label="Emotes">${svg('smile')}</button></div>`);
      $('gtOut').onclick = () => GLXEXTRA.out(); $('gtEv').onclick = () => GLXEXTRA.agenda(); $('gtEmo').onclick = () => GLXEXTRA.emotes();
    }
  }
  function tiles() {
    document.querySelectorAll('.tile > span:first-child').forEach(s => {
      if (s.classList.contains('gIco')) return; const k = s.textContent.trim(), n = TILE[k]; if (!n) return;
      s.classList.add('gIco'); s.innerHTML = svg(n);
    });
  }
  /* je eigen figuur bovenaan je profiel in plaats van een letter of een emoji */
  let figUrl = null, figBusy = false;
  async function myFig() {
    if (figUrl || figBusy || !window.GLXAV) return figUrl; figBusy = true;
    try { figUrl = (GLXAV.image && GLXAV.image()) || await GLXAV.thumb(GLXAV.config(), 'me', 2) } catch (e) { } figBusy = false; return figUrl;
  }
  async function profile() {
    const v = $('v-profile'); if (!v || !v.classList.contains('on')) return;
    const ring = v.querySelector('.ring .av'), slot = v.querySelector('#avProf > div:first-child');
    const needRing = ring && !ring.querySelector('img'), needSlot = slot && !slot.querySelector('img');
    if (!needRing && !needSlot) return;
    const u = await myFig(); if (!u) return;
    if (needRing && ring && !ring.querySelector('img')) { ring.style.background = 'none'; ring.style.padding = '0'; ring.innerHTML = `<img class="profFig" src="${u}" alt="${t('Mijn figuur', 'My figure')}">` }
    if (needSlot && slot && !slot.querySelector('img')) slot.innerHTML = `<img src="${u}" alt="${t('Mijn mannetje', 'My figure')}" style="width:150px;height:170px;object-fit:contain">`;
  }
  /* "Bewerk" opent het echte bewerkscherm */
  function editBtn() { document.querySelectorAll('#v-profile button').forEach(b => { if (/Profiel bewerken komt/.test(b.getAttribute('onclick') || '') && typeof window.editProfile === 'function') b.setAttribute('onclick', 'editProfile()') }) }

  function run() { try { nav(); header(); mapSide(); tiles(); profile(); editBtn() } catch (e) { } }
  const boot = () => {
    run(); new MutationObserver(() => { clearTimeout(boot.t); boot.t = setTimeout(run, 60) }).observe(document.body, { childList: true, subtree: true });
    try { const save = window.saveAvatar; window.addEventListener('glx-avatar', () => { figUrl = null; run() }) } catch (e) { }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
