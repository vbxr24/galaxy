/* Galaxy – Welzijn: pauzemodus, welzijn-badges (optioneel op je profiel), schermtijd-grens,
   ademoefening, tips en hulplijnen per land (wereldwijd, met findahelpline.com als reserve).
   Galaxy geeft geen medisch advies en is geen noodhulp. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch (e) { } return null };
  const T = m => { try { toast(m) } catch (e) { } };
  const nl = () => { try { return (typeof LANG === 'undefined' ? 'nl' : LANG) === 'nl' } catch (e) { return true } };
  const t = (a, b) => nl() ? a : b;

  /* ---------- hulplijnen per land ---------- */
  const LINES = {
    BE: ['België / Belgique', '112', [['Zelfmoordlijn (NL)', '1813', 'https://www.zelfmoord1813.be'], ['Prévention suicide (FR)', '0800 32 123', 'https://www.preventionsuicide.be'], ['Tele-Onthaal (NL)', '106', 'https://www.tele-onthaal.be'], ['Télé-Accueil (FR)', '107', 'https://tele-accueil.be'], ['1712 · geweld en misbruik', '1712', 'https://www.1712.be']]],
    NL: ['Nederland', '112', [['113 Zelfmoordpreventie', '0800 0113', 'https://www.113.nl'], ['De Luisterlijn', '088 0767 000', 'https://www.deluisterlijn.nl']]],
    FR: ['France', '112', [['Prévention du suicide', '3114', 'https://3114.fr']]],
    DE: ['Deutschland', '112', [['TelefonSeelsorge', '0800 111 0 111', 'https://www.telefonseelsorge.de']]],
    GB: ['United Kingdom', '999', [['Samaritans', '116 123', 'https://www.samaritans.org']]],
    IE: ['Ireland', '112', [['Samaritans', '116 123', 'https://www.samaritans.org']]],
    ES: ['España', '112', [['Línea 024', '024', 'https://www.sanidad.gob.es/linea024']]],
    US: ['United States', '911', [['988 Suicide & Crisis Lifeline', '988', 'https://988lifeline.org']]],
    CA: ['Canada', '911', [['988 Suicide Crisis Helpline', '988', 'https://988.ca']]],
    AU: ['Australia', '000', [['Lifeline', '13 11 14', 'https://www.lifeline.org.au']]]
  };
  function guessCountry() {
    const s = ls('glxCountry'); if (s) return s;
    let z = ''; try { z = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch (e) { }
    const m = { 'Europe/Brussels': 'BE', 'Europe/Amsterdam': 'NL', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Madrid': 'ES' };
    if (m[z]) return m[z];
    if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina)/.test(z)) return 'CA';
    if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana)/.test(z) || z === 'Pacific/Honolulu') return 'US';
    if (/^Australia\//.test(z)) return 'AU';
    return 'OTHER';
  }
  function linesHtml() {
    const c = guessCountry(), L = LINES[c];
    const opts = Object.entries(LINES).map(([k, v]) => `<option value="${k}"${k === c ? ' selected' : ''}>${esc(v[0])}</option>`).join('') + `<option value="OTHER"${c === 'OTHER' ? ' selected' : ''}>${t('Ander land', 'Other country')}</option>`;
    const row = (n, num, url) => `<div class="set"><span style="flex:1;min-width:0;padding-right:8px">${esc(n)}</span><span style="display:flex;gap:6px;flex-shrink:0"><a class="btn sm" style="white-space:nowrap;text-decoration:none;color:#fff" href="tel:${num.replace(/\s/g, '')}">📞 ${esc(num)}</a>${url ? `<a class="btn sm ghost" style="text-decoration:none" href="${url}" target="_blank" rel="noopener" aria-label="website">🌐</a>` : ''}</span></div>`;
    return `<select id="wlCountry" onchange="GLXWELL.country(this.value)" style="width:100%;padding:10px;border-radius:12px;background:var(--card2);color:inherit;border:1px solid var(--line);margin:8px 0">${opts}</select>
${L ? row(t('Noodnummer', 'Emergency'), L[1]) + L[2].map(x => row(x[0], x[1], x[2])).join('') : `<p class="sub" style="margin:6px 0">${t('Bel bij gevaar het lokale noodnummer (in de EU 112).', 'In danger? Call your local emergency number (112 in the EU).')}</p>`}
<div class="set"><span>${t('Hulplijnen in elk land', 'Helplines in every country')}</span><a class="btn sm ghost" style="text-decoration:none;color:inherit;white-space:nowrap" href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a></div>
<p class="sub" style="margin-top:8px">${t('Gratis en anoniem. Galaxy is geen hulpverlener en geen noodhulp. Bel bij acuut gevaar meteen het noodnummer.', 'Free and anonymous. Galaxy is not a care provider or emergency service. In immediate danger, call the emergency number.')}</p>`;
  }

  /* ---------- pauzemodus (zoals Snooze) ---------- */
  const DUR = () => [[24, t('24 uur', '24 hours')], [72, t('3 dagen', '3 days')], [168, t('1 week', '1 week')], [0, t('Tot ik terugkom', 'Until I return')]];
  const pausedUntil = () => { const v = ls('glxPause'); return v == null ? null : +v };
  const isPaused = () => pausedUntil() != null;
  function setGhost(on) {
    ls('glxGhost', on ? '1' : ''); const g = $('ghostTg'); if (g) g.classList.toggle('on', on);
    try { S.paused = on } catch (e) { }
    try { window.GLXNET && GLXNET.sync && GLXNET.sync() } catch (e) { }
    try { window.GLXMAP && GLXMAP.restyle && GLXMAP.restyle() } catch (e) { }
  }
  function pause(h) {
    ls('glxPauseGhostBefore', ls('glxGhost') ? '1' : '');
    ls('glxPause', String(h ? Date.now() + h * 3600e3 : 0)); setGhost(true); badge();
    T(t('🌙 Pauze aan. Je bent onzichtbaar; je chats en matches blijven bewaard.', '🌙 Paused. You are invisible; your chats and matches are kept.')); open();
  }
  function resume(quiet) {
    const before = ls('glxPauseGhostBefore') === '1'; ls('glxPause', null); ls('glxPauseGhostBefore', null); setGhost(before); badge();
    if (!quiet) { T(t('👋 Welkom terug!', '👋 Welcome back!')); open() }
  }
  function checkPause() { const u = pausedUntil(); if (u && Date.now() > u) resume(true) }
  function badge() {
    let b = $('wlPauseBar'); const u = pausedUntil();
    if (u == null) { if (b) b.remove(); return }
    if (!b) { b = document.createElement('button'); b.id = 'wlPauseBar'; b.onclick = () => open(); b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 64px);z-index:60;padding:8px 14px;border-radius:99px;border:1px solid var(--line);background:var(--card);color:inherit;font-size:13px;box-shadow:0 6px 20px #0004'; document.body.appendChild(b) }
    b.textContent = '🌙 ' + t('Pauze', 'Paused') + (u ? ' · ' + t('tot', 'until') + ' ' + new Date(u).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  }

  /* ---------- welzijn-badges en profielzin ---------- */
  const WB = () => [['🧘', t('Mindfulness', 'Mindfulness')], ['💬', t('Diepe gesprekken', 'Deep chats')], ['😴', t('Goed slapen', 'Sleeping well')], ['📵', t('Tijd offline', 'Time offline')], ['🏃', t('Bewegen', 'Staying active')], ['🥗', t('Gezond eten', 'Eating well')], ['🐢', t('Rustig daten', 'Slow dating')], ['🛡️', t('Grenzen respecteren', 'Respecting boundaries')]];
  const WKEY = '🌿 Welzijn', PKEY = '💭 Zelfzorg';
  function well() { try { return ME.well || (ME.well = { b: [], p: '', show: false }) } catch (e) { return { b: [], p: '', show: false } } }
  function pushToProfile() {
    const w = well(); try {
      ME.basics = ME.basics || {};
      if (w.show && w.b.length) ME.basics[WKEY] = w.b.slice(0, 4).map(bName).filter(Boolean); else delete ME.basics[WKEY];
      if (w.show && w.p) ME.basics[PKEY] = w.p.slice(0, 120); else delete ME.basics[PKEY];
      window.saveMe && saveMe(); window.GLXNET && GLXNET.sync && GLXNET.sync();
      typeof renderProfExtra === 'function' && renderProfExtra();
    } catch (e) { }
  }
  function togB(k) { const w = well(), i = w.b.indexOf(k); if (i > -1) w.b.splice(i, 1); else { if (w.b.length >= 4) return T(t('Maximaal 4 badges', 'Up to 4 badges')); w.b.push(k) } pushToProfile(); open('b') }
  const bName = k => { const b = WB().find(x => x[0] === k); return b ? b[0] + ' ' + b[1] : '' };

  /* ---------- schermtijd ---------- */
  const today = () => new Date().toISOString().slice(0, 10);
  function usage() { let u = {}; try { u = JSON.parse(ls('glxUse') || '{}') } catch (e) { } if (u.d !== today()) u = { d: today(), m: 0, warned: false }; return u }
  function tick() {
    if (document.hidden) return; const u = usage(); u.m += 1; ls('glxUse', JSON.stringify(u));
    const lim = +(ls('glxLimit') || 0);
    if (lim && u.m >= lim && !u.warned) { u.warned = true; ls('glxUse', JSON.stringify(u)); nudge(lim) }
  }
  function nudge(lim) {
    try {
      xs('🌿 ' + t('Even pauze?', 'Time for a break?'), `<p style="margin-bottom:12px">${t(`Je bent vandaag al ${lim} minuten op Galaxy. Dat was je eigen grens.`, `You've spent ${lim} minutes on Galaxy today. That was your own limit.`)}</p>
<button class="btn" style="width:100%;margin-bottom:8px" onclick="GLXWELL.breathe()">🫁 ${t('1 minuut ademen', '1 minute of breathing')}</button>
<button class="btn ghost" style="width:100%;margin-bottom:8px" onclick="GLXWELL.pause(24)">🌙 ${t('Pauze tot morgen', 'Pause until tomorrow')}</button>
<button class="btn ghost" style="width:100%" onclick="closeO('xV')">${t('Nog even verder', 'Keep going for now')}</button>`, false);
    } catch (e) { }
  }

  /* ---------- ademoefening (4 in, 4 vast, 6 uit) ---------- */
  let brT = null;
  function breathe() {
    xs('🫁 ' + t('Even ademen', 'Breathe'), `<div style="display:flex;flex-direction:column;align-items:center;padding:20px 0"><div id="wlBall" style="width:120px;height:120px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#a5f3fc,#6366f1);transform:scale(.6);transition:transform 4s ease-in-out;box-shadow:0 0 40px #6366f166"></div><p id="wlBr" style="margin-top:22px;font-size:18px;font-weight:700"></p><p class="sub" id="wlLeft" style="margin-top:6px"></p></div><button class="btn ghost" style="width:100%" onclick="GLXWELL.open()">${t('Stoppen', 'Stop')}</button>`, false);
    clearTimeout(brT); let left = 60; const ball = $('wlBall'), txt = $('wlBr'), lt = $('wlLeft');
    const steps = [[t('Adem in', 'Breathe in'), 4, 1], [t('Hou vast', 'Hold'), 4, 1], [t('Adem uit', 'Breathe out'), 6, .6]];
    let k = 0; const run = () => {
      if (!$('wlBall')) return; if (left <= 0) { txt.textContent = t('Goed gedaan 💜', 'Well done 💜'); lt.textContent = ''; return }
      const s = steps[k % 3]; txt.textContent = s[0]; ball.style.transitionDuration = s[1] + 's'; ball.style.transform = 'scale(' + s[2] + ')'; left -= s[1]; lt.textContent = Math.max(0, left) + ' s'; k++; brT = setTimeout(run, s[1] * 1000);
    }; setTimeout(run, 60);
  }

  /* ---------- tips ---------- */
  const TIPS = () => nl() ? [
    ['⏱️', 'Kies vaste momenten', 'Open de app op een paar vaste momenten per dag in plaats van steeds tussendoor. Stel hieronder een dagelijkse grens in.'],
    ['🛡️', 'Jij bepaalt je grenzen', 'Je hoeft niets te delen waar je je niet goed bij voelt. Respect gaat beide kanten op.'],
    ['🤍', 'Geen reactie zegt niets over jou', 'Mensen reageren niet om veel redenen. Dat is geen oordeel over wie je bent.'],
    ['☕', 'Eerste afspraak: kort en openbaar', 'Een koffie op een drukke plek is genoeg. Laat iemand weten waar je bent.'],
    ['🌙', 'Pauze is normaal', 'Even weg van dating-apps is gezond. Met de pauzemodus verlies je niets.']
  ] : [
    ['⏱️', 'Pick set times', 'Open the app at a few set moments a day instead of all the time. Set a daily limit below.'],
    ['🛡️', 'Your boundaries count', "You never have to share anything you're not comfortable with. Respect goes both ways."],
    ['🤍', "Silence isn't about you", "People don't reply for many reasons. It's not a judgement of who you are."],
    ['☕', 'First meet: short and public', 'A coffee somewhere busy is enough. Let someone know where you are.'],
    ['🌙', 'Breaks are normal', 'Time away from dating apps is healthy. Pause mode keeps everything.']];

  /* ---------- het scherm ---------- */
  function open(focus) {
    checkPause(); const u = pausedUntil(), w = well(), lim = +(ls('glxLimit') || 0), use = usage();
    const pauseHtml = u != null
      ? `<p style="margin:6px 0 10px">🌙 ${t('Je staat op pauze', 'You are paused')}${u ? ' ' + t('tot', 'until') + ' <b>' + new Date(u).toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' }) + '</b>' : ''}. ${t('Niemand ziet je op de kaart.', 'Nobody sees you on the map.')}</p><button class="btn" style="width:100%" onclick="GLXWELL.resume()">👋 ${t('Ik ben terug', "I'm back")}</button>`
      : `<p class="sub" style="margin:6px 0 10px">${t('Verdwijn even van de kaart en uit de live drukte. Je chats en matches blijven bewaard.', 'Disappear from the map and live counts for a while. Your chats and matches are kept.')}</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${DUR().map(d => `<button class="opt" style="margin:0;text-align:center" onclick="GLXWELL.pause(${d[0]})">${d[1]}</button>`).join('')}</div>`;
    const html = `
<div class="box"><b>🌙 ${t('Pauzemodus', 'Pause mode')}</b>${pauseHtml}</div>
<div class="box" id="wlB"><b>🌿 ${t('Welzijn-badges', 'Wellbeing badges')}</b><p class="sub" style="margin:6px 0 8px">${t('Kies er tot 4 en een zin. Ze staan alleen op je profiel als je dat aanzet.', "Pick up to 4 and a line. They're only on your profile if you turn it on.")}</p>
<div class="tags">${WB().map(b => { const on = w.b.includes(b[0]); return `<button class="tag" aria-pressed="${on}" style="background:${on ? 'var(--a)' : 'var(--card2)'}" onclick="GLXWELL.togB('${b[0]}')">${esc(b[0] + ' ' + b[1])}</button>` }).join('')}</div>
<input id="wlP" maxlength="120" value="${esc(w.p)}" placeholder="${t('Zo zorg ik voor mezelf…', 'How I take care of myself…')}" onchange="GLXWELL.prompt(this.value)" style="width:100%;margin-top:10px;padding:10px;border-radius:12px;background:var(--card2);color:inherit;border:1px solid var(--line)">
<div class="set"><span>${t('Toon op mijn profiel', 'Show on my profile')}</span><button class="tg${w.show ? ' on' : ''}" onclick="GLXWELL.show(!this.classList.contains('on'))"></button></div></div>
<div class="box"><b>⏱️ ${t('Schermtijd', 'Screen time')}</b><p class="sub" style="margin:6px 0 8px">${t('Vandaag', 'Today')}: ${use.m} min. ${t('Bij je grens krijg je een zachte herinnering.', "You'll get a gentle reminder at your limit.")}</p>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${[0, 15, 30, 60].map(m => `<button class="opt" style="margin:0;text-align:center;padding:12px 4px;white-space:nowrap;font-size:14px;${m === lim ? 'background:var(--a);color:#fff' : ''}" onclick="GLXWELL.limit(${m})">${m ? m + ' min' : t('Geen', 'None')}</button>`).join('')}</div></div>
<button class="btn ghost" style="width:100%;margin-bottom:12px" onclick="GLXWELL.breathe()">🫁 ${t('Even ademen (1 minuut)', 'Breathe (1 minute)')}</button>
<div class="box"><b>💡 ${t('Tips voor gezond daten', 'Tips for healthy dating')}</b>${TIPS().map(x => `<details style="margin-top:8px"><summary style="cursor:pointer">${x[0]} ${esc(x[1])}</summary><p class="sub" style="margin-top:4px">${esc(x[2])}</p></details>`).join('')}</div>
<div class="box" id="wlHelp"><b>🆘 ${t('Praten met iemand', 'Talk to someone')}</b>${linesHtml()}</div>`;
    xs('🌿 ' + t('Welzijn', 'Wellbeing'), html, false);
    if (focus === 'b') { const b = $('wlB'); b && b.scrollIntoView({ block: 'center' }) }
  }

  window.GLXWELL = {
    open, pause, resume, breathe, togB,
    prompt(v) { well().p = String(v || '').slice(0, 120); pushToProfile() },
    show(on) { well().show = !!on; pushToProfile(); T(on ? t('Zichtbaar op je profiel', 'Visible on your profile') : t('Verborgen voor anderen', 'Hidden from others')); open('b') },
    limit(m) { ls('glxLimit', String(m)); const u = usage(); u.warned = false; ls('glxUse', JSON.stringify(u)); open() },
    country(c) { ls('glxCountry', c); const h = $('wlHelp'); if (h) h.innerHTML = `<b>🆘 ${t('Praten met iemand', 'Talk to someone')}</b>` + linesHtml() },
    get paused() { return isPaused() }
  };

  /* ---------- inhaken in de app ---------- */
  function hook() {
    try { if (typeof HUB !== 'undefined' && !HUB.some(h => /GLXWELL/.test(h[2]))) HUB.unshift(['🌿', 'Welzijn', 'GLXWELL.open()']) } catch (e) { }
    const g = $('ghostTg'); const set = g && g.closest('.box');
    if (set && !$('wlRow')) set.insertAdjacentHTML('beforeend', `<div class="set" id="wlRow"><span>🌿 ${t('Welzijn, pauze en hulp', 'Wellbeing, pause and help')}</span><button class="btn sm ghost" onclick="GLXWELL.open()">${t('Open', 'Open')}</button></div>`);
    checkPause(); badge();
  }
  document.addEventListener('click', e => { if (e.target && e.target.id === 'ghostTg' && isPaused() && !e.target.classList.contains('on')) { ls('glxPause', null); ls('glxPauseGhostBefore', null); badge() } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
  setInterval(tick, 60e3); setInterval(() => { checkPause(); badge() }, 60e3);
})();
