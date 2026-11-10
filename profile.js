/* Galaxy – profiel: wie ben ik, wat zoek ik (kleur), badges, respect-score, profielthema,
   muziek, socials (alleen met toestemming), profielkaart zoals anderen die zien, seizoens-events.
   Alles blijft op dit toestel tot de server er is. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = m => { try { toast(m) } catch (e) { } };
  const subLevel = () => { try { return S.lifetime ? 3 : (rank[S.plan] || 0) } catch (e) { return 0 } };
  const game = () => (window.GLXMAP && GLXMAP.state) || {};
  const PLAY = () => !!window.PLAY_BUILD;

  /* ---------- keuzelijsten ---------- */
  const CATS = [
    ['lange', '💚', 'Lange termijn', '#34d399'], ['serieus', '💙', 'Iets serieus', '#60a5fa'], ['zien', '💜', 'Zien wat komt', '#a78bfa'],
    ['vrienden', '💛', 'Vrienden', '#fbbf24'], ['fwb', '🧡', 'Friends with benefits', '#fb923c'], ['ons', '❤️', 'One night stand', '#f43f5e']];
  const cats = () => CATS.filter(c => !(PLAY() && (c[0] === 'fwb' || c[0] === 'ons')));
  const cat = k => CATS.find(c => c[0] === k);
  const GENDER = ['Man', 'Vrouw', 'Non-binair', 'Trans man', 'Trans vrouw', 'Genderfluïde', 'Genderqueer', 'Agender', 'Intersekse', 'Anders', 'Zeg ik liever niet'];
  const PRON = ['hij/hem', 'zij/haar', 'hen/hun', 'die/diens', 'hij/hen', 'zij/hen', 'Anders'];
  const ORIENT = ['Hetero', 'Homo', 'Lesbisch', 'Biseksueel', 'Panseksueel', 'Aseksueel', 'Demiseksueel', 'Queer', 'Aromantisch', 'Zoekende', 'Anders', 'Zeg ik liever niet'];
  const SEEK = ['Mannen', 'Vrouwen', 'Non-binaire mensen', 'Iedereen'];
  /* profielthema's: [naam, kleur1, kleur2, nodig abonnement-niveau, bewegend] */
  const PT = [['Galaxy', '#6366f1', '#22d3ee', 0], ['Nacht', '#1e1b4b', '#3b0764', 0], ['Zonsondergang', '#f97316', '#db2777', 1], ['Oceaan', '#0ea5e9', '#1e3a8a', 1], ['Bos', '#16a34a', '#134e4a', 1],
  ['Roze wolk', '#f472b6', '#a78bfa', 1], ['Goud', '#fbbf24', '#b45309', 2], ['Neon', '#22d3ee', '#d946ef', 2], ['Aurora', '#34d399', '#8b5cf6', 3, true]];
  const pt = n => PT.find(t => t[0] === n) || PT[0];

  /* ---------- standaardwaarden ---------- */
  function defaults() {
    const d = { gender: '', pron: '', orient: '', showOrient: false, seek: [], cat: '', music: '', ig: '', snap: '', socialVis: 'verborgen', ptheme: 'Galaxy' };
    Object.keys(d).forEach(k => { if (ME[k] === undefined) ME[k] = d[k] });
    if (!Array.isArray(ME.seek)) ME.seek = [];
  }
  /* foto's bewaren: verkleinen zodat ze na herladen blijven staan */
  window.saveMe = function () { try { const c = Object.assign({}, ME); c.photos = (c.photos || []).filter(u => typeof u === 'string' && u.startsWith('data:') && u.length < 260000).slice(0, 6); localStorage.glxMe = JSON.stringify(c) } catch (e) { T('⚠️ Opslaan lukte niet: te weinig ruimte. Verwijder een foto.') } };
  window.setPhoto = function (k, inp) {
    const f = inp.files && inp.files[0]; if (!f) return; if (!/^image\//.test(f.type)) return T('Kies een foto');
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => {
      const m = 640, r = Math.min(1, m / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      const d = c.toDataURL('image/jpeg', .74); if (k >= ME.photos.length) ME.photos.push(d); else ME.photos[k] = d; saveProfile(true); T('📸 Foto toegevoegd');
    };
    img.onerror = () => T('Deze foto kan niet geladen worden'); img.src = url;
  };
  window.delPhoto = function (k) { ME.photos.splice(k, 1); saveProfile(true) };

  /* ---------- muziek en socials ---------- */
  function spotify(link) { const m = String(link || '').match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|artist|show|episode)\/([A-Za-z0-9]{10,40})/); return m ? { type: m[1], id: m[2] } : null }
  const handle = s => String(s || '').trim().replace(/^https?:\/\/(www\.)?(instagram\.com|snapchat\.com\/add)\//i, '').replace(/^@/, '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 30);
  function musicHtml(p) { const s = spotify(p.music); return s ? `<iframe title="Spotify" loading="lazy" style="border:0;border-radius:12px;width:100%;height:${s.type === 'track' ? 80 : 152}px;margin-top:8px" src="https://open.spotify.com/embed/${s.type}/${s.id}" allow="encrypted-media"></iframe>` : '' }
  function socialsHtml(p, own) {
    if (!p.ig && !p.snap) return '';
    const open = own || p.socialVis === 'iedereen' || (p.socialVis === 'matches' && p.matched);
    const row = (ico, n, v, url) => v ? `<div class="set"><span>${ico} ${n}</span>${open ? `<a href="${url}${encodeURIComponent(v)}" target="_blank" rel="noopener noreferrer" style="color:#67e8f9">@${esc(v)}</a>` : `<button class="btn sm ghost" onclick="GLXPROFILE.ask('${n}')">🔒 Vraag toegang</button>`}</div>` : '';
    return `<div class="box"><b>📱 Socials</b>${row('📷', 'Instagram', p.ig, 'https://instagram.com/')}${row('👻', 'Snapchat', p.snap, 'https://snapchat.com/add/')}${own ? `<p class="sub" style="margin-top:6px">Zichtbaar voor: <b>${{ verborgen: 'niemand', matches: 'alleen matches', iedereen: 'iedereen' }[p.socialVis] || 'niemand'}</b></p>` : ''}</div>`;
  }

  /* ---------- badges en respect ---------- */
  function badges() {
    const g = game(), sp = subLevel(); let ev = []; try { ev = JSON.parse(localStorage.glxEv || '[]') } catch (e) { }
    const full = !!(ME.bio && ME.photos.length && ME.ints.length >= 3 && ME.cat);
    const B = [['🪐', 'Nieuw lid', true], ['📝', 'Profiel compleet', full], ['🧍', 'Mannetje gemaakt', !!(window.GLXAV && GLXAV.has())], ['📍', 'Eerste check-in', (g.nCheck || 0) >= 1], ['🗺️', 'Ontdekker · 10 check-ins', (g.nCheck || 0) >= 10], ['🏆', 'Stamgast · 50 check-ins', (g.nCheck || 0) >= 50],
    ['👟', 'Wandelaar · 5 km', (g.walked || 0) >= 5000], ['🥾', 'Stapper · 25 km', (g.walked || 0) >= 25000], ['🏃', 'Marathon · 42 km', (g.walked || 0) >= 42195], ['👥', 'Organisator', (g.groups || []).length >= 1], ['🎉', 'Feestplanner · 5 groepsdates', (g.groups || []).length >= 5],
    ['🎵', 'Muziek gedeeld', !!spotify(ME.music)], ['📸', 'Fotograaf · 3 foto\'s', ME.photos.length >= 3], ['🌙', 'Nachtuil', (() => { try { return !!S.badges.night } catch (e) { return false } })()], ['✨', 'Galaxy+', sp >= 1], ['⭐', 'Gold', sp >= 2], ['🌌', 'Cosmic', sp >= 3],
    ['🎃', 'Halloween', ev.includes('halloween')], ['🎄', 'Kerst', ev.includes('kerst')], ['🎆', 'Nieuwjaar', ev.includes('nieuwjaar')], ['💘', 'Valentijn', ev.includes('valentijn')], ['🏳️‍🌈', 'Pride', ev.includes('pride')], ['☀️', 'Zomer', ev.includes('zomer')],
    ['🔞', 'Leeftijd gecontroleerd', false], ['🤝', 'Eerste ontmoeting', false]];
    return B;
  }
  const respect = () => { let r = 100; try { r = +localStorage.glxRespect || 100 } catch (e) { } return Math.max(0, Math.min(100, r)) };

  /* ---------- profielkaart: zo zien anderen je ---------- */
  function card(p, own) {
    const th = pt(p.ptheme), c = cat(p.cat), sp = spotify(p.music), img = (p.photos && p.photos[0]) || p.avatarImg || '';
    const chips = (typeof basicsChips === 'function' && p.basics) ? basicsChips(p.basics) : '';
    const who = [p.gender && p.gender !== 'Zeg ik liever niet' ? p.gender : '', p.pron, (p.showOrient && p.orient && p.orient !== 'Zeg ik liever niet') ? p.orient : ''].filter(Boolean);
    const earned = (p.badges || badges().filter(b => b[2]).map(b => [b[0], b[1]])).slice(0, 12);
    return `<div class="pcard${th[4] ? ' anim' : ''}" style="--p1:${th[1]};--p2:${th[2]}">
<div class="pc-top"><div class="pc-ph" style="${img ? `background-image:url(${img})` : ''}">${img ? '' : esc((p.name || '?')[0])}</div>
<h2>${esc(p.name || 'Naamloos')}${p.age ? ', ' + (+p.age) : ''}</h2><p>${esc(p.city || '')}</p>
${c ? `<span class="pc-cat" style="background:${c[3]}">${c[1]} ${c[2]}</span>` : ''}</div>
${(p.photos || []).length > 1 ? `<div class="pc-more">${p.photos.slice(1, 6).map(u => `<div style="background-image:url(${u})"></div>`).join('')}</div>` : ''}
${p.bio ? `<div class="box"><b>Over mij</b><p style="margin-top:6px;white-space:pre-wrap">${esc(p.bio)}</p></div>` : ''}
${who.length ? `<div class="box"><b>Wie ben ik</b><div class="tags" style="margin-top:8px">${who.map(w => `<span class="tag" style="background:var(--card2)">${esc(w)}</span>`).join('')}</div></div>` : ''}
${chips ? `<div class="box"><b>📋 Basics</b><div class="tags" style="margin-top:8px">${chips}</div></div>` : ''}
${(p.ints || []).length ? `<div class="box"><b>✨ Hobby's en interesses</b><div class="tags" style="margin-top:8px">${p.ints.map(t => `<span class="tag" style="background:var(--card2)">${esc(t)}</span>`).join('')}</div></div>` : ''}
${(p.prompts || []).filter(x => x[1]).map(x => `<div class="box"><span class="sub">${esc(x[0])}</span><p style="margin-top:4px">${esc(x[1])}</p></div>`).join('')}
${sp ? `<div class="box"><b>🎵 Mijn muziek</b>${musicHtml(p)}</div>` : ''}
${socialsHtml(p, own)}
${earned.length ? `<div class="box"><b>🏅 Badges</b><div class="badges">${earned.map(b => `<span class="bdg">${b[0]} ${esc(b[1])}</span>`).join('')}</div></div>` : ''}
<div class="box"><div style="display:flex;justify-content:space-between"><b>🤝 Respect-score</b><b>${p.respect == null ? respect() : +p.respect}/100</b></div></div>
${own ? `<p class="sub" style="text-align:center;margin:10px 0">Zo zien anderen je profiel als ze op je mannetje tikken. Je exacte plek zien ze nooit.</p><button class="btn" style="width:100%" onclick="editProfile()">✏️ Profiel bewerken</button>`
        : `<div style="display:flex;gap:8px;margin-top:10px"><button class="btn" style="flex:2" onclick="GLXPROFILE.wave()">👋 Zwaai</button><button class="btn ghost" style="flex:1" onclick="GLXPROFILE.report()">🚩 Meld</button></div>`}</div>`;
  }

  /* ---------- eigen profielpagina ---------- */
  function applyTheme() {
    const t = document.querySelector('.prof-top'); if (!t) return; const th = pt(ME.ptheme), need = th[3];
    const use = subLevel() >= need ? th : PT[0];
    t.style.cssText = `background:linear-gradient(135deg,${use[1]},${use[2]});border-radius:20px;padding:18px 14px 16px;margin-bottom:12px`; t.classList.toggle('pt-anim', !!use[4]);
    const c = cat(ME.cat); document.documentElement.style.setProperty('--intent', c ? c[3] : 'transparent');
    let pill = $('meCat'); if (!pill) { t.querySelector('p.sub').insertAdjacentHTML('afterend', '<span id="meCat" class="pc-cat"></span>'); pill = $('meCat') }
    pill.style.display = c ? '' : 'none'; if (c) { pill.style.background = c[3]; pill.textContent = c[1] + ' ' + c[2] }
    const s = t.querySelector('p.sub'); if (s) s.style.color = '#fff';
  }
  function boxes() {
    const ex = $('profExtra'); if (!ex) return;
    [...ex.querySelectorAll('.box')].forEach(b => { const h = b.querySelector('b'); if (h && /Wat zoek ik|Badges|Respect-score|Mijn muziek|Socials|Zo zien anderen/.test(h.textContent)) b.remove() });
    const B = badges(), got = B.filter(b => b[2]).length;
    ex.insertAdjacentHTML('afterbegin', `<div class="box"><b>👁️ Zo zien anderen je</b><p class="sub" style="margin:4px 0 8px">Tikt iemand op je mannetje, dan ziet die deze kaart.</p><button class="btn sm" onclick="GLXPROFILE.mine()">Bekijk mijn kaart</button></div>
<div class="box"><b>🎯 Wat zoek ik?</b><p class="sub" style="margin:2px 0 8px">Je kleur is zichtbaar op je profiel en rond je mannetje.</p><div class="tags">${cats().map(c => `<button class="tag pcat" style="background:${ME.cat === c[0] ? c[3] : 'var(--card2)'};color:${ME.cat === c[0] ? '#0b0a1f' : 'inherit'};border:2px solid ${c[3]}" onclick="GLXPROFILE.setCat('${c[0]}')">${c[1]} ${c[2]}</button>`).join('')}</div></div>
<div class="box"><div style="display:flex;justify-content:space-between"><b>🤝 Respect-score</b><b style="color:var(--ok)">${respect()}/100</b></div><div class="bar"><i style="width:${respect()}%"></i></div><p class="sub" style="margin-top:6px">Iedereen start op 100. Punten gaan eraf bij een terechte melding, niet komen opdagen of ghosten na een afspraak. Ze komen terug door je netjes te gedragen. Dit telt pas echt zodra er andere leden zijn.</p></div>`);
    ex.insertAdjacentHTML('beforeend', `${spotify(ME.music) ? `<div class="box"><b>🎵 Mijn muziek</b>${musicHtml(ME)}</div>` : ''}${socialsHtml(ME, true)}
<div class="box"><div style="display:flex;justify-content:space-between"><b>🏅 Badges</b><span class="sub">${got} / ${B.length}</span></div><div class="badges">${B.map(b => `<span class="bdg ${b[2] ? '' : 'off'}">${b[0]} ${esc(b[1])}</span>`).join('')}</div></div>`);
  }
  const _rpe = renderProfExtra; renderProfExtra = function () { _rpe.apply(this, arguments); try { boxes(); applyTheme() } catch (e) { console.error(e) } };
  const _am = applyMe; applyMe = function () { const r = _am.apply(this, arguments); try { applyTheme() } catch (e) { } return r };

  /* ---------- bewerken: extra velden ---------- */
  const sel = (key, list) => `<select class="fld" style="margin:2px 0 0;padding:8px" onchange="GLXPROFILE.set('${key}',this.value)"><option value="">—</option>${list.map(v => `<option ${ME[key] === v ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
  const _ep = editProfile; editProfile = function () {
    _ep.apply(this, arguments); defaults();
    const sh = $('xSheet'), anchor = [...sh.querySelectorAll('b')].find(b => b.textContent.includes('Jouw prompts')); if (!anchor) return;
    /* foto's: knop om te verwijderen */
    sh.querySelectorAll('.ph6 label.has').forEach((l, k) => l.insertAdjacentHTML('beforeend', `<button type="button" class="phx" aria-label="Foto verwijderen" onclick="event.preventDefault();event.stopPropagation();delPhoto(${k})">✕</button>`));
    const lvl = subLevel();
    anchor.insertAdjacentHTML('beforebegin', `<b>🎯 Wat zoek ik?</b><div class="tags" style="margin:8px 0 14px">${cats().map(c => `<button class="tag" style="background:${ME.cat === c[0] ? c[3] : 'var(--card2)'};color:${ME.cat === c[0] ? '#0b0a1f' : 'inherit'};border:2px solid ${c[3]}" onclick="GLXPROFILE.setCat('${c[0]}',1)">${c[1]} ${c[2]}</button>`).join('')}</div>
<b>🏳️‍🌈 Wie ben ik</b> <span class="sub">(alles is optioneel)</span>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 6px"><label style="font-size:12px;color:var(--mut)">Gender${sel('gender', GENDER)}</label><label style="font-size:12px;color:var(--mut)">Voornaamwoorden${sel('pron', PRON)}</label><label style="font-size:12px;color:var(--mut)">Geaardheid${sel('orient', ORIENT)}</label></div>
<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:10px"><input type="checkbox" ${ME.showOrient ? 'checked' : ''} onchange="GLXPROFILE.set('showOrient',this.checked)"> Toon mijn geaardheid op mijn profiel</label>
<span class="sub">Ik wil ontmoeten</span><div class="tags" style="margin:6px 0 14px">${SEEK.map(s => `<button class="tag" style="background:${ME.seek.includes(s) ? 'var(--a)' : 'var(--card2)'}" onclick="GLXPROFILE.seek('${s}')">${s}</button>`).join('')}</div>
<b>🎵 Mijn muziek</b><input class="fld" id="eMusic" value="${esc(ME.music)}" placeholder="Plak een Spotify-link (nummer, playlist of artiest)" onchange="GLXPROFILE.music(this.value)">
<p class="sub" style="margin:-4px 0 12px">Open Spotify → Delen → Link kopiëren. Je muziek komt als speler op je profiel.</p>
<b>📱 Socials</b><div style="display:flex;gap:8px"><input class="fld" value="${esc(ME.ig)}" placeholder="Instagram-naam" onchange="GLXPROFILE.social('ig',this.value)"><input class="fld" value="${esc(ME.snap)}" placeholder="Snapchat-naam" onchange="GLXPROFILE.social('snap',this.value)"></div>
<label style="font-size:12px;color:var(--mut)">Wie mag ze zien?<select class="fld" style="margin:2px 0 14px;padding:8px" onchange="GLXPROFILE.set('socialVis',this.value)">${[['verborgen', 'Niemand, tot ik toestemming geef'], ['matches', 'Alleen mijn matches'], ['iedereen', 'Iedereen']].map(([v, n]) => `<option value="${v}" ${ME.socialVis === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
<b>🖼️ Profielthema</b> <span class="sub">(meer kleuren met een abonnement)</span><div class="tags" style="margin:8px 0 14px">${PT.map(t => `<button class="tag" style="background:linear-gradient(135deg,${t[1]},${t[2]});outline:${ME.ptheme === t[0] ? '2px solid #fff' : 'none'};opacity:${lvl >= t[3] ? 1 : .55}" onclick="GLXPROFILE.theme('${t[0]}')">${lvl >= t[3] ? '' : '🔒 '}${t[0]}</button>`).join('')}</div>`);
  };
  function again() { const s = $('xSheet'), sc = s ? s.scrollTop : 0; if ($('xV') && $('xV').classList.contains('on') && $('eName')) { saveProfile(true); const n = $('xSheet'); if (n) n.scrollTop = sc } else { saveMe(); try { renderProfExtra() } catch (e) { } } }

  /* ---------- seizoens-events ---------- */
  const EVENTS = [
    { k: 'nieuwjaar', e: '🎆', n: 'Nieuwjaar', c: ['#fbbf24', '#8b5cf6'], tip: 'Waar vier jij het? Zoek een plein of café en plan een groepsdate voor middernacht.', on: (m, d) => (m === 12 && d >= 30) || (m === 1 && d <= 2) },
    { k: 'valentijn', e: '💘', n: 'Valentijn', c: ['#f43f5e', '#ec4899'], tip: 'Geen date? Plan een groepsdate en maak er een leuke avond van.', on: (m, d) => m === 2 && d >= 7 && d <= 14 },
    { k: 'pride', e: '🏳️‍🌈', n: 'Pride', c: ['#f43f5e', '#8b5cf6'], tip: 'Iedereen is welkom op Galaxy. Kijk waar het feest is en ga samen.', on: (m, d) => (m === 5 && d >= 10 && d <= 20) || m === 6 },
    { k: 'zomer', e: '☀️', n: 'Zomer', c: ['#f97316', '#fbbf24'], tip: 'Terrasjes, parken en festivals: kijk waar het leeft.', on: (m, d) => m === 7 || m === 8 },
    { k: 'halloween', e: '🎃', n: 'Halloween', c: ['#f97316', '#7c3aed'], tip: 'Verkleed je mannetje en zoek een Halloween-feest in de buurt.', on: (m, d) => m === 10 && d >= 24 },
    { k: 'sint', e: '🎁', n: 'Sinterklaas', c: ['#dc2626', '#fbbf24'], tip: 'Tijd voor chocolademelk. Zoek een gezellig café.', on: (m, d) => m === 12 && d <= 6 },
    { k: 'kerst', e: '🎄', n: 'Kerst', c: ['#16a34a', '#dc2626'], tip: 'Zoek een kerstmarkt op de kaart en plan er een groepsdate.', on: (m, d) => m === 12 && d >= 7 && d <= 26 }];
  function currentEvent() {
    const q = new URLSearchParams(location.search).get('event'); if (q) return EVENTS.find(e => e.k === q) || null;
    const n = new Date(), m = n.getMonth() + 1, d = n.getDate(); return EVENTS.find(e => e.on(m, d)) || null;
  }
  function startEvent() {
    const ev = currentEvent(); if (!ev) return; window.GLXEVENT = ev;
    try { const a = JSON.parse(localStorage.glxEv || '[]'); if (!a.includes(ev.k)) { a.push(ev.k); localStorage.glxEv = JSON.stringify(a) } } catch (e) { }
    document.documentElement.classList.add('ev-' + ev.k);
    const v = $('v-map'); if (v && !$('evBar')) v.insertAdjacentHTML('afterbegin', `<button id="evBar" style="background:linear-gradient(90deg,${ev.c[0]},${ev.c[1]})" onclick="GLXPROFILE.event()">${ev.e} <b>${ev.n} op Galaxy</b> <span>Tik voor meer</span></button>`);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { const f = document.createElement('div'); f.id = 'evFall'; f.setAttribute('aria-hidden', 'true'); f.innerHTML = Array.from({ length: 10 }, (_, i) => `<i style="left:${(i * 10 + 4)}%;animation-delay:${(i * 1.3) % 7}s;animation-duration:${9 + (i * 3) % 6}s">${ev.e}</i>`).join(''); document.body.appendChild(f) }
  }

  /* ---------- stijl ---------- */
  const st = document.createElement('style'); st.textContent = `
.pcard .pc-top{background:linear-gradient(135deg,var(--p1),var(--p2));border-radius:20px;padding:22px 14px 16px;text-align:center;color:#fff;margin-bottom:10px;background-size:200% 200%}
.pcard.anim .pc-top,.prof-top.pt-anim{background-size:200% 200%!important;animation:ptMove 6s ease infinite}
@keyframes ptMove{50%{background-position:100% 50%}}
.pc-ph{width:112px;height:112px;border-radius:50%;margin:0 auto 8px;background:#0003 center/cover;border:3px solid #fff;display:grid;place-items:center;font-size:46px;font-weight:800}
.pcard h2{margin:0;font-size:22px}.pcard .pc-top p{margin:2px 0 8px;opacity:.9;font-size:13px}
.pc-cat{display:inline-block;color:#0b0a1f;font-weight:700;font-size:12px;border-radius:99px;padding:4px 12px;margin-top:6px}
.pc-more{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10px}.pc-more div{aspect-ratio:1;border-radius:10px;background:#0003 center/cover}
.pcat{font-weight:600}.ph6 label{position:relative}.phx{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:#000a;color:#fff;font-size:11px;line-height:22px;padding:0}
.gmAv.me:not(.aura):not(.goud){filter:drop-shadow(0 0 7px var(--intent,transparent))}
#evBar{display:flex;gap:8px;align-items:center;width:100%;border-radius:14px;padding:9px 14px;margin-bottom:8px;color:#fff;font-size:13px;text-align:left}#evBar span{margin-left:auto;opacity:.85;font-size:12px}
#evFall{position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden}#evFall i{position:absolute;top:-40px;font-style:normal;font-size:20px;opacity:.55;animation:evDrop linear infinite}
@keyframes evDrop{to{transform:translateY(110vh) rotate(200deg)}}
@media(prefers-reduced-motion:reduce){.pcard.anim .pc-top,.prof-top.pt-anim{animation:none}}`; document.head.appendChild(st);

  /* ---------- api ---------- */
  window.GLXPROFILE = {
    cats: CATS, events: EVENTS, card,
    mine() { defaults(); let av = ''; try { av = GLXAV.image() || '' } catch (e) { } xs('👁️ Mijn kaart', card(Object.assign({}, ME, { avatarImg: av }), true), false) },
    show(p) { xs(esc(p.name || 'Profiel'), card(p, false), false) },
    set(k, v) { ME[k] = v; saveMe(); try { renderProfExtra() } catch (e) { } },
    setCat(k, inEdit) { ME.cat = ME.cat === k ? '' : k; try { S.intent = (cat(ME.cat) || [])[2] || '' } catch (e) { } saveMe(); if (inEdit) again(); else { try { renderProfExtra() } catch (e) { } } if (window.GLXLIVE && GLXLIVE.send) GLXLIVE.send({ t: 'cat', cat: ME.cat }) },
    seek(s) { const i = ME.seek.indexOf(s); if (s === 'Iedereen') ME.seek = i > -1 ? [] : ['Iedereen']; else { ME.seek = ME.seek.filter(x => x !== 'Iedereen'); const j = ME.seek.indexOf(s); j > -1 ? ME.seek.splice(j, 1) : ME.seek.push(s) } again() },
    music(v) { v = String(v || '').trim(); if (v && !spotify(v)) { T('Dat is geen geldige Spotify-link'); return } ME.music = v; again(); if (v) T('🎵 Muziek staat op je profiel') },
    social(k, v) { ME[k] = handle(v); again() },
    theme(n) { const t = pt(n); if (subLevel() < t[3]) { T('🔒 ' + t[0] + ' zit in ' + ['', 'Galaxy+', 'Gold', 'Cosmic'][t[3]]); try { closeO('xV'); openPlans() } catch (e) { } return } ME.ptheme = t[0]; again() },
    ask(n) { T('🔒 Je verzoek voor ' + n + ' wordt verstuurd zodra Galaxy live is. De ander beslist.') },
    wave() { T('👋 Zwaaien werkt zodra er andere leden zijn') },
    report() { try { reportUser() } catch (e) { T('🚩 Melding genoteerd') } },
    event() { const ev = window.GLXEVENT; if (!ev) return; xs(ev.e + ' ' + ev.n + ' op Galaxy', `<div class="box" style="background:linear-gradient(135deg,${ev.c[0]}55,${ev.c[1]}55)"><p>${ev.tip}</p></div><p class="sub" style="margin:10px 0">Je kreeg de ${ev.e} ${ev.n}-badge omdat je er nu bij bent.</p><button class="btn" style="width:100%" onclick="closeO('xV');go('map')">🌍 Naar de kaart</button>`, false) },
    badges, currentEvent
  };

  /* ---------- start ---------- */
  try { defaults(); const ph = (ME.photos || []).filter(u => typeof u === 'string' && u.startsWith('data:')); if (ph.length !== (ME.photos || []).length) ME.photos = ph; applyMe(); renderProfExtra() } catch (e) { console.error(e) }
  try { const gt = document.getElementById('ghostTg'), veil = gt && gt.closest('.box'); if (veil && !$('sosRow')) veil.insertAdjacentHTML('beforeend', '<div class="set" id="sosRow"><span>🆘 Noodgeval tijdens een date</span><a class="btn sm" href="tel:112" style="background:#e11d48;text-decoration:none">Bel 112</a></div>') } catch (e) { }
  startEvent();
})();
