/* Galaxy – talen. 15 talen; de vertalingen staan in lang/<code>.json (zelfde volgorde als lang/_keys.json).
   Werkt op drie manieren: t(nl, en) in de modules, vaste teksten op het scherm, en meldingen (toast). */
(function () {
  'use strict';
  const ALL = [['nl', '🇧🇪🇳🇱', 'Nederlands'], ['fr', '🇫🇷', 'Français'], ['en', '🇬🇧', 'English'], ['de', '🇩🇪', 'Deutsch'], ['es', '🇪🇸', 'Español'],
  ['it', '🇮🇹', 'Italiano'], ['pt', '🇵🇹', 'Português'], ['tr', '🇹🇷', 'Türkçe'], ['pl', '🇵🇱', 'Polski'], ['ro', '🇷🇴', 'Română'],
  ['ru', '🇷🇺', 'Русский'], ['uk', '🇺🇦', 'Українська'], ['ar', '🇸🇦', 'العربية'], ['zh', '🇨🇳', '中文'], ['ja', '🇯🇵', '日本語']];
  const V = '11';
  try { if (typeof LANGS !== 'undefined') { LANGS.length = 0; ALL.forEach(l => LANGS.push(l)) } } catch (e) { }
  let lang = 'nl';
  try { lang = localStorage.getItem('glxLang') || (navigator.language || 'nl').slice(0, 2).toLowerCase() } catch (e) { }
  if (!ALL.some(l => l[0] === lang)) lang = 'en';
  try { LANG = lang } catch (e) { }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  const get = url => { try { const x = new XMLHttpRequest(); x.open('GET', url, false); x.send(null); return x.status === 200 ? JSON.parse(x.responseText) : null } catch (e) { return null } };
  const cache = (k, f) => { try { const c = localStorage.getItem(k); if (c) return JSON.parse(c) } catch (e) { } const v = f(); if (v) try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } return v };

  /* woordenboek: bron (nl of en) → vertaling */
  const D = Object.create(null);
  if (lang !== 'nl') {
    const keys = cache('glxI18nK' + V, () => get('lang/_keys.json?v=' + V)) || [];
    const vals = cache('glxI18n' + V + lang, () => get('lang/' + lang + '.json?v=' + V)) || [];
    keys.forEach((k, i) => { const v = vals[i]; if (!v) return; (Array.isArray(k) ? k : [k]).forEach(s => { if (s && !(s in D)) D[s] = v }) });
    try { Object.keys(localStorage).forEach(k => { if (/^glxI18n/.test(k) && k !== 'glxI18nK' + V && k !== 'glxI18n' + V + lang) localStorage.removeItem(k) }) } catch (e) { }
  }
  /* een paar korte woorden in vaste knoppen */
  const MINI = { Gratis: { fr: 'Gratuit', en: 'Free', de: 'Gratis', es: 'Gratis', it: 'Gratis', pt: 'Grátis', tr: 'Ücretsiz', pl: 'Za darmo', ro: 'Gratuit', ru: 'Бесплатно', uk: 'Безкоштовно', ar: 'مجاني', zh: '免费', ja: '無料' },
    Chat: { pt: 'Conversas', tr: 'Sohbet', pl: 'Czat', ru: 'Чат', uk: 'Чат', ar: 'الدردشة', zh: '聊天', ja: 'チャット' },
    Live: { ru: 'Карта', uk: 'Мапа', ar: 'مباشر', zh: '实时', ja: 'ライブ', tr: 'Canlı', pl: 'Na żywo', ro: 'Live', pt: 'Ao vivo', es: 'En vivo', it: 'Live', de: 'Live', fr: 'Live' } };
  Object.keys(MINI).forEach(k => { const v = MINI[k][lang]; if (v && !(k in D)) D[k] = v });
  const RX = /^([^\p{L}]*)([\s\S]*?)([^\p{L}\p{N})]*)$/u;
  function look(s) {
    if (lang === 'nl' || s == null) return null; s = String(s);
    if (s in D) return D[s];
    const m = s.match(RX); if (!m || !m[2]) return null;
    const v = D[m[2]]; return v ? m[1] + v + m[3] : null;
  }
  /* t(nl, en) */
  window.GLXL = function (a, b) {
    if (lang === 'nl') return a;
    const v = D[a] || D[b]; if (v) return v;
    return lang === 'en' ? b : (look(a) || look(b) || b);
  };
  window.GLXLANG = lang;

  /* vaste teksten op het scherm */
  const OLD = (typeof TR !== 'undefined') ? TR : {};
  const idx = () => ALL.findIndex(l => l[0] === lang) - 1;
  function trText(o) {
    if (lang === 'nl') return o; const m = o.match(RX); if (!m || !m[2]) return o;
    const row = OLD[m[2]], oi = ['fr', 'en', 'de', 'es', 'it', 'pt', 'tr', 'pl'].indexOf(lang);
    if (row && oi >= 0 && row[oi]) return m[1] + row[oi] + m[3];
    const v = D[m[2]]; if (v) return m[1] + v + m[3];
    const t = o.trim(), x = D[t] || D[m[2] + m[3].trim()]; return x ? o.replace(t, x) : o;
  }
  window.trNode = function (n) {
    if (n.parentElement && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentElement.tagName)) return;
    if (n._o == null) n._o = n.nodeValue; const nv = trText(n._o); if (n.nodeValue !== nv) n.nodeValue = nv;
  };
  window.trAll = function (root) {
    if (lang === 'nl' || !root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while (n = w.nextNode()) window.trNode(n);
    if (root.querySelectorAll) root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el => {
      ['placeholder', 'aria-label', 'title'].forEach(a => { if (!el.hasAttribute(a)) return; const k = '_i' + a; if (el[k] == null) el[k] = el.getAttribute(a); const v = trText(el[k]); if (el.getAttribute(a) !== v) el.setAttribute(a, v) });
    });
  };
  /* taal kiezen: opslaan en herladen, zodat alles in de nieuwe taal opgebouwd wordt */
  window.setLang = function (l) {
    try { localStorage.setItem('glxLang', l) } catch (e) { }
    try { closeO('xV') } catch (e) { } location.reload();
  };
  window.openLang = function () {
    try {
      xs('🌐 ' + GLXL('Taal', 'Language'), ALL.map(l => `<button class="opt" onclick="setLang('${l[0]}')" style="display:flex;gap:12px;align-items:center"><span style="font-size:22px">${l[1]}</span>${l[2]}${lang === l[0] ? ' ✓' : ''}</button>`).join(''), false);
    } catch (e) { }
  };
  /* meldingen */
  const wrapToast = () => { const o = window.toast; if (!o || o._i18n) return; const w = function (m) { return o.call(this, look(m) || m) }; w._i18n = 1; window.toast = w };
  wrapToast(); document.addEventListener('DOMContentLoaded', wrapToast);
  /* knop bovenaan bijwerken */
  const fix = () => { const b = document.getElementById('langBtn'); const L = ALL.find(x => x[0] === lang); if (b && L) b.textContent = L[1].slice(0, 4); try { window.trAll(document.body) } catch (e) { } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fix); else fix();

  /* je taal doorgeven aan de server, zodat meldingen in jouw taal komen (1× per taal) */
  (function sendLang(n) { try { if (localStorage.getItem('glxLangSent') === lang) return; const db = window.GLXNET && GLXNET.db; if (!db) { if (n < 40) setTimeout(() => sendLang(n + 1), 3000); return } db.rpc('set_lang', { l: lang }).then(r => { if (!r.error) localStorage.setItem('glxLangSent', lang) }, () => { }) } catch (e) { } })(0);
})();
