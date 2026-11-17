/* Galaxy – de feed: verhalen van 24 uur, vraag van de avond, café-acties en een startgids zolang het nog stil is.
   Foto's worden eerst op je eigen toestel gecontroleerd (NSFWJS) voordat ze online gaan; gemelde posts verdwijnen tot de beheerder kijkt. */
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
  const ago = d => { const m = Math.max(1, Math.round((Date.now() - new Date(d)) / 60000)); return m < 60 ? m + ' min' : Math.round(m / 60) + ' u' };
  const left = d => { const h = Math.round((new Date(d) - Date.now()) / 3600000); return h <= 1 ? t('nog even', 'ending soon') : t('nog ' + h + ' u', h + 'h left') };

  let data = null, loading = false, viewer = null;

  const css = document.createElement('style');
  css.textContent = `
#v-feed{padding-bottom:110px}
.fdSec{margin:18px 0 8px;display:flex;align-items:baseline;gap:8px}
.fdSec h3{margin:0;font-size:17px;font-weight:700}
.fdSec span{color:var(--mut);font-size:12px}
.fdRow{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 8px;scrollbar-width:none}
.fdRow::-webkit-scrollbar{display:none}
.fdSt{flex:none;width:68px;text-align:center;font-size:11.5px;color:var(--txt);background:none;border:0;padding:0;font-family:inherit;cursor:pointer}
.fdSt .rg{width:64px;height:64px;border-radius:50%;padding:2.5px;background:var(--grad);margin:0 auto 5px}
.fdSt.seen .rg{background:#ffffff26}
.fdSt .in{width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 50% 30%,#8b5cf655,#1e1b4b);border:2px solid var(--bg);overflow:hidden;display:grid;place-items:center}
.fdSt .in img{width:100%;height:100%;object-fit:cover;object-position:50% 12%}
.fdSt.add .in{background:var(--card2);color:#fff}
.fdSt b{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fdQ{position:relative;overflow:hidden;border-radius:22px;padding:18px 16px 14px;background:radial-gradient(120% 140% at 0% 0%,#7c3aed 0%,#be185d 55%,#0e0b2a 100%);border:1px solid #ffffff1f}
.fdQ small{display:inline-flex;align-items:center;gap:6px;font-size:12px;opacity:.85}
.fdQ small .gi{width:15px;height:15px}
.fdQ h2{margin:8px 0 12px;font-family:Syne,inherit;font-size:24px;line-height:1.15;letter-spacing:-.01em;text-wrap:balance}
.fdQ form{display:flex;gap:8px}
.fdQ input{flex:1;min-width:0;border-radius:14px;border:1px solid #ffffff33;background:#0007;color:#fff;padding:11px 12px;font:inherit;font-size:15px}
.fdQ input::placeholder{color:#fffa}
.fdQ button{border:0;border-radius:14px;padding:0 14px;background:#fff;color:#2e1065;font:inherit;font-weight:700}
.fdQ .mine{background:#0006;border-radius:14px;padding:10px 12px;display:flex;gap:8px;align-items:center;font-size:14.5px}
.fdQ .mine button{background:none;color:#fffc;padding:0;font-weight:600;font-size:13px}
.fdA{display:flex;gap:10px;align-items:flex-start;padding:11px 2px;border-bottom:1px solid var(--line)}
.fdA:last-child{border-bottom:0}
.fdA .ph{flex:none;width:40px;height:40px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 30%,#8b5cf655,#1e1b4b);border:0;padding:0;cursor:pointer}
.fdA .ph img{width:100%;height:100%;object-fit:cover;object-position:50% 12%}
.fdA .bd{flex:1;min-width:0}
.fdA .bd b{font-size:13.5px}.fdA .bd i{font-style:normal;color:var(--mut);font-size:12px;margin-left:6px}
.fdA .bd p{margin:2px 0 0;font-size:15px;line-height:1.35;overflow-wrap:anywhere}
.fdA .mo{background:none;border:0;color:var(--mut);padding:4px;cursor:pointer}
.fdA .mo .gi{width:18px;height:18px}
.fdV{border-radius:18px;padding:14px;background:var(--card);border:1px solid #fbbf2455;display:flex;gap:12px;align-items:flex-start;margin-bottom:8px}
.fdV .ic{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#fbbf2422;color:#fde68a}
.fdV b{display:block;font-size:14px}.fdV p{margin:3px 0 0;font-size:14.5px;line-height:1.35}.fdV small{color:var(--mut);font-size:12px}
.fdS{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fdS button{text-align:left;border-radius:18px;padding:14px;background:var(--card);border:1px solid var(--line);color:var(--txt);font:inherit;display:flex;flex-direction:column;gap:6px;cursor:pointer}
.fdS button .gi{width:22px;height:22px;color:#c4b5fd}
.fdS button b{font-size:14px}.fdS button span{font-size:12.5px;color:var(--mut);line-height:1.35}
.fdNote{color:var(--mut);font-size:13px;padding:6px 2px}
#fdView{position:fixed;inset:0;z-index:400;background:#000;display:flex;flex-direction:column;touch-action:manipulation}
#fdView .bars{display:flex;gap:4px;padding:calc(env(safe-area-inset-top) + 10px) 10px 0}
#fdView .bars i{flex:1;height:3px;border-radius:2px;background:#ffffff44;overflow:hidden}
#fdView .bars i u{display:block;height:100%;width:0;background:#fff}
#fdView .top{display:flex;align-items:center;gap:10px;padding:10px 12px;color:#fff}
#fdView .top img{width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#1e1b4b}
#fdView .top b{font-size:14px}#fdView .top small{opacity:.7;margin-left:6px}
#fdView .top button{margin-left:auto;background:none;border:0;color:#fff;font-size:24px;padding:4px 8px}
#fdView .img{flex:1;position:relative;display:grid;place-items:center;overflow:hidden}
#fdView .img img{max-width:100%;max-height:100%;object-fit:contain}
#fdView .img .tap{position:absolute;top:0;bottom:0;width:35%;border:0;background:none}
#fdView .cap{position:absolute;left:12px;right:12px;bottom:16px;text-align:center;color:#fff;font-size:17px;font-weight:600;text-shadow:0 1px 8px #000c}
#fdView .act{display:flex;gap:8px;padding:10px 12px calc(env(safe-area-inset-bottom) + 12px)}
#fdView .act button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:14px;padding:12px;border:1px solid #ffffff33;background:#ffffff14;color:#fff;font:inherit;font-weight:600}
#fdView .act button .gi{width:18px;height:18px}
.fdPrev{width:100%;max-height:52vh;object-fit:contain;border-radius:16px;background:#000;display:block}
@media (prefers-reduced-motion:reduce){#fdView .bars i u{transition:none!important}}`;
  document.head.appendChild(css);

  /* extra lijniconen voor de feed */
  const EXTRA = { flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', store: '<path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16v11H4zM4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20.5v-5h4v5"/>', plus: '<path d="M12 5v14M5 12h14"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13.5" r="3.5"/>' };
  const ic = (n, s) => EXTRA[n] ? `<svg class="gi" viewBox="0 0 24 24" width="${s || 20}" height="${s || 20}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EXTRA[n]}</svg>` : I(n, s);

  /* figuurtjes van mensen (dezelfde 3D-figuren als op de kaart) */
  function faces(root) {
    if (!window.GLXAV) return;
    root.querySelectorAll('img[data-av]').forEach(im => {
      if (im.dataset.done) return; im.dataset.done = 1;
      let cfg = null; try { cfg = JSON.parse(im.dataset.av || 'null') } catch (e) { }
      GLXAV.thumb(cfg || (GLXAV.defaultFor && GLXAV.defaultFor(im.dataset.id)), im.dataset.id).then(u => { if (u) im.src = u }).catch(() => { });
    });
  }
  const face = (av, id, alt) => `<img data-av='${esc(JSON.stringify(av || null))}' data-id="${esc(id)}" alt="${esc(alt || '')}" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">`;

  const seenKey = 'glxSeenStories';
  const seen = () => { try { return JSON.parse(localStorage[seenKey] || '{}') } catch (e) { return {} } };
  const markSeen = id => { try { const s = seen(); s[id] = Date.now(); Object.keys(s).forEach(k => { if (Date.now() - s[k] > 2 * 864e5) delete s[k] }); localStorage[seenKey] = JSON.stringify(s) } catch (e) { } };

  /* ---------------- tekenen ---------------- */
  function groups() {
    const g = new Map(); (data && data.stories || []).forEach(s => { if (!g.has(s.uid)) g.set(s.uid, { uid: s.uid, name: s.name, avatar: s.avatar, mine: s.mine, match: s.match, list: [] }); g.get(s.uid).list.push(s) });
    const arr = [...g.values()]; arr.forEach(x => x.list.sort((a, b) => new Date(a.at) - new Date(b.at)));
    const sn = seen(); arr.forEach(x => x.seen = x.list.every(s => sn[s.id]));
    return arr.sort((a, b) => (b.mine - a.mine) || (a.seen - b.seen) || (b.match - a.match));
  }

  function render() {
    const v = $('v-feed'); if (!v) return;
    const G = groups(), mine = G.find(x => x.mine), others = G.filter(x => !x.mine);
    const q = data && data.question, A = (data && data.answers) || [], my = A.find(a => a.mine), V = (data && data.venues) || [];
    const quiet = others.length + A.filter(a => !a.mine).length + V.length < 4;
    const offline = !db();

    let h = `<div class="fdSec"><h3>${t('Verhalen', 'Stories')}</h3><span>${t('24 uur zichtbaar voor matches en mensen in je buurt', 'Visible 24h to matches and people nearby')}</span></div>
<div class="fdRow">
 <button class="fdSt add" type="button" onclick="GLXFEED.add()"><div class="rg" style="background:#ffffff26"><div class="in">${ic('plus', 26)}</div></div><b>${t('Jouw verhaal', 'Your story')}</b></button>
 ${mine ? `<button class="fdSt" type="button" onclick="GLXFEED.view('${mine.uid}')"><div class="rg"><div class="in">${face(mine.avatar, mine.uid, mine.name)}</div></div><b>${t('Bekijk', 'View')}</b></button>` : ''}
 ${others.map(x => `<button class="fdSt ${x.seen ? 'seen' : ''}" type="button" onclick="GLXFEED.view('${x.uid}')"><div class="rg"><div class="in">${face(x.avatar, x.uid, x.name)}</div></div><b>${esc(x.name)}</b></button>`).join('')}
</div>
${!others.length ? `<div class="fdNote">${t('Nog geen verhalen in je buurt. Post er zelf een: het verdwijnt na 24 uur.', 'No stories nearby yet. Post one yourself: it disappears after 24 hours.')}</div>` : ''}`;

    if (V.length) h += `<div class="fdSec"><h3>${t('Acties in de buurt', 'Deals nearby')}</h3></div>` + V.map(p => `<div class="fdV"><div class="ic">${ic('store', 22)}</div><div style="flex:1;min-width:0"><b>${esc(p.venue)}</b><p>${esc(p.body)}</p><small>${left(p.until)}</small></div><button class="mo" style="background:none;border:0;color:var(--mut)" aria-label="${t('Melden', 'Report')}" onclick="GLXFEED.report('venue','${p.id}')">${ic('flag', 18)}</button></div>`).join('');

    if (q) {
      h += `<div class="fdSec"><h3>${t('Vraag van de avond', 'Question of the night')}</h3><span>${A.length ? A.length + ' ' + t(A.length === 1 ? 'antwoord' : 'antwoorden', A.length === 1 ? 'answer' : 'answers') : ''}</span></div>
<div class="fdQ"><small style="display:flex">${I('moon', 15)}${t('Vandaag, voor iedereen in je buurt', 'Today, for everyone nearby')}${window.GLXSOC ? GLXSOC.streakChip() : ''}</small><h2>${esc(nl() ? q.nl : q.en)}</h2>
${my ? `<div class="mine"><span style="flex:1">${esc(my.body)}</span><button type="button" onclick="GLXFEED.editAnswer()">${t('Wijzig', 'Edit')}</button></div>`
          : `<form onsubmit="event.preventDefault();GLXFEED.answer(this.a.value)"><input name="a" maxlength="140" autocomplete="off" placeholder="${t('Jouw antwoord…', 'Your answer…')}" aria-label="${t('Jouw antwoord', 'Your answer')}"><button>${t('Plaats', 'Post')}</button></form>`}
</div>
<div class="box" style="margin-top:10px;padding:4px 12px">${A.filter(a => !a.mine).length ? A.filter(a => !a.mine).map(a => `<div class="fdA"><button class="ph" type="button" aria-label="${esc(a.name)}" onclick="openProfile('${a.uid}')">${face(a.avatar, a.uid, a.name)}</button><div class="bd"><b>${esc(a.name)}</b><i>${ago(a.at)}</i><p>${esc(a.body)}</p></div><button class="mo" type="button" aria-label="${t('Melden', 'Report')}" onclick="GLXFEED.report('answer','${a.id}')">${ic('flag', 18)}</button></div>`).join('')
          : `<div class="fdNote" style="padding:12px 0">${my ? t('Jij bent de eerste. Zodra anderen antwoorden zie je ze hier, en kan je hun profiel openen.', 'You\'re the first. Answers from others show up here.') : t('Nog niemand heeft geantwoord. Wees de eerste: zo zien anderen meteen wat voor iemand je bent.', 'Nobody answered yet. Be the first.')}</div>`}</div>`;
    }

    if (quiet || offline) h += `<div class="fdSec"><h3>${t('Zo haal je meer uit Galaxy', 'Get more out of Galaxy')}</h3></div>
<div class="fdS">
 <button type="button" onclick="go('map')">${I('map')}<b>${t('Kijk op de kaart', 'Open the map')}</b><span>${t('Zie wie er nu in de buurt is en zwaai.', 'See who\'s nearby and wave.')}</span></button>
 <button type="button" onclick="window.GLXEXTRA&&GLXEXTRA.agenda()">${I('party')}<b>${t('Galaxy-avonden', 'Galaxy nights')}</b><span>${t('Avonden in cafés om elkaar echt te ontmoeten.', 'Nights in bars to meet for real.')}</span></button>
 <button type="button" onclick="window.GLXEXTRA&&GLXEXTRA.out()">${I('moon')}<b>${t('Uit vanavond', 'Out tonight')}</b><span>${t('Laat zien dat je vanavond uitgaat.', 'Show you\'re going out tonight.')}</span></button>
 <button type="button" onclick="window.GLXEXTRA&&GLXEXTRA.invite()">${I('gift')}<b>${t('Nodig vrienden uit', 'Invite friends')}</b><span>${t('Hoe meer mensen, hoe leuker. Jullie krijgen allebei munten.', 'More people, more fun. You both get coins.')}</span></button>
</div>${offline ? `<div class="fdNote" style="margin-top:10px">${t('Verbinden… verhalen en antwoorden verschijnen zodra je online bent.', 'Connecting… stories and answers appear once you\'re online.')}</div>` : ''}`;

    v.innerHTML = h; faces(v);
  }

  async function load(force) {
    if (loading) return; const d = db(); if (!d) { render(); return }
    if (data && !force && Date.now() - data._t < 30000) { render(); return }
    loading = true;
    try { const r = await d.rpc('feed_home'); if (r.error) throw r.error; data = r.data || {}; data._t = Date.now() } catch (e) { console.warn('feed', e) }
    loading = false; render(); cleanup();
  }

  /* ---------------- antwoorden ---------------- */
  async function answer(txt) {
    txt = String(txt || '').trim(); if (!txt) return; const d = db(); if (!d) return T(t('Nog niet verbonden', 'Not connected yet'));
    const r = await d.rpc('answer_post', { p_body: txt.slice(0, 140) });
    if (r.error) return T(/niet toegestaan/.test(r.error.message) ? t('Dat kan niet: geen links, nummers of grove woorden', 'Not allowed: no links, numbers or offensive words') : t('Plaatsen lukte niet', 'Could not post'));
    try { navigator.vibrate && navigator.vibrate(12) } catch (e) { }
    T(t('Geplaatst', 'Posted')); if (window.GLXSOC) await GLXSOC.loadMine(); load(true);
  }
  function editAnswer() {
    const my = (data.answers || []).find(a => a.mine) || {};
    xs(t('Jouw antwoord', 'Your answer'), `<form onsubmit="event.preventDefault();closeO('xV');GLXFEED.answer(this.a.value)"><input class="fld" name="a" maxlength="140" value="${esc(my.body)}" style="width:100%"><div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="btn ghost" onclick="closeO('xV');GLXFEED.delAnswer()">${t('Verwijder', 'Delete')}</button><button class="btn">${t('Opslaan', 'Save')}</button></div></form>`, false);
  }
  async function delAnswer() { const d = db(); if (!d) return; await d.rpc('answer_delete'); T(t('Verwijderd', 'Deleted')); load(true) }

  /* ---------------- melden ---------------- */
  function report(kind, id) {
    const R = [t('Naakt of seksueel', 'Nudity or sexual'), t('Lijkt minderjarig', 'Looks underage'), t('Haat of pesten', 'Hate or bullying'), t('Spam of oplichting', 'Spam or scam'), t('Iets anders', 'Something else')];
    xs(t('Melden', 'Report'), `<p class="sub" style="margin-top:0">${t('Na meldingen wordt het meteen verborgen tot we het nakijken. De ander ziet niet wie meldde.', 'Reported posts are hidden until we review them. Nobody sees who reported.')}</p>
<div style="display:grid;gap:8px">${R.map(r => `<button class="btn ghost" style="justify-content:flex-start" onclick="GLXFEED._rep('${kind}','${id}',this.textContent)">${r}</button>`).join('')}</div>`, false);
  }
  async function rep(kind, id, reason) {
    try { closeO('xV') } catch (e) { } const d = db(); if (!d) return;
    const r = await d.rpc('feed_report', { p_kind: kind, p_item: id, p_reason: reason });
    T(r.error ? t('Melden lukte niet', 'Report failed') : t('Bedankt, we kijken het na', 'Thanks, we\'ll review it'));
    if (viewer) closeViewer(); load(true);
  }

  /* ---------------- verhaal plaatsen ---------------- */
  let nsfwModel = null;
  const script = src => new Promise((ok, no) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s) });
  async function scan(canvas) {
    if (!nsfwModel) {
      await script('vendor/nsfw/nsfwjs.min.js'); await script('vendor/nsfw/model.min.js'); await script('vendor/nsfw/group1-shard1of1.min.js');
      nsfwModel = await window.nsfwjs.load('MobileNetV2');
    }
    const c = document.createElement('canvas'); c.width = c.height = 224; c.getContext('2d').drawImage(canvas, 0, 0, 224, 224);
    const p = {}; (await nsfwModel.classify(c)).forEach(x => p[x.className] = x.probability); return p;
  }

  let pending = null;
  function add() {
    if (!db()) return T(t('Nog niet verbonden', 'Not connected yet'));
    const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
    f.onchange = () => { if (f.files && f.files[0]) prep(f.files[0]) }; f.click();
  }
  async function prep(file) {
    try {
      const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file) });
      const k = Math.min(1, 1080 / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', .82)); pending = { blob, canvas: c };
      xs(t('Nieuw verhaal', 'New story'), `<img class="fdPrev" src="${c.toDataURL('image/jpeg', .7)}" alt="">
<input class="fld" id="fdCap" maxlength="120" placeholder="${t('Tekst erbij (mag leeg)', 'Caption (optional)')}" style="width:100%;margin-top:12px">
<p class="sub" style="font-size:12.5px">${t('Zichtbaar voor je matches en mensen in je buurt, 24 uur lang. Geen naakt, geen minderjarigen, geen gezichten van anderen zonder toestemming.', 'Visible to your matches and people nearby for 24 hours. No nudity, no minors, no faces of others without consent.')}</p>
<button class="btn" id="fdGo" style="width:100%" onclick="GLXFEED._post()">${t('Plaatsen', 'Post')}</button>`, false);
    } catch (e) { T(t('Die foto kon niet geopend worden', 'Could not open that photo')) }
  }
  async function post() {
    if (!pending) return; const btn = $('fdGo'); const cap = ($('fdCap') || {}).value || '';
    if (btn) { btn.disabled = true; btn.textContent = t('Foto controleren…', 'Checking photo…') }
    let review = false;
    try {
      const p = await scan(pending.canvas);
      if ((p.Porn || 0) + (p.Hentai || 0) > .5) { if (btn) { btn.disabled = false; btn.textContent = t('Plaatsen', 'Post') } return T(t('Deze foto lijkt naakt of seksueel en kan niet geplaatst worden', 'This photo looks sexual and can\'t be posted')) }
      if ((p.Sexy || 0) > .6 || (p.Porn || 0) + (p.Hentai || 0) > .25) review = true;
    } catch (e) { review = true }  // controle lukte niet: dan eerst nakijken
    if (btn) btn.textContent = t('Uploaden…', 'Uploading…');
    const d = db(), path = uid() + '/' + Date.now() + '.jpg';
    try {
      const up = await d.storage.from('stories').upload(path, pending.blob, { contentType: 'image/jpeg' }); if (up.error) throw up.error;
      const r = await d.rpc('story_post', { p_path: path, p_caption: cap.trim(), p_review: review });
      if (r.error) { await d.storage.from('stories').remove([path]); throw r.error }
      try { closeO('xV') } catch (e) { } pending = null;
      T(review ? t('Geplaatst. Een beheerder kijkt het eerst na voor anderen het zien.', 'Posted. A moderator checks it before others see it.') : t('Je verhaal staat online', 'Your story is live'));
      load(true);
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = t('Plaatsen', 'Post') }
      T(/niet toegestaan/.test(e.message || '') ? t('Die tekst kan niet: geen links, nummers of grove woorden', 'Caption not allowed') : /max 5/.test(e.message || '') ? t('Maximum 5 verhalen per dag', 'Max 5 stories a day') : t('Plaatsen lukte niet', 'Could not post'));
    }
  }

  /* ---------------- verhalen bekijken ---------------- */
  async function view(u) {
    const g = groups().find(x => x.uid === u); if (!g) return; const d = db(); if (!d) return;
    closeViewer(); const first = g.list.findIndex(s => !seen()[s.id]);
    viewer = { g, i: first < 0 ? 0 : first, timer: null, urls: {} };
    document.body.insertAdjacentHTML('beforeend', `<div id="fdView" role="dialog" aria-label="${t('Verhaal van', 'Story by')} ${esc(g.name)}">
<div class="bars">${g.list.map(() => '<i><u></u></i>').join('')}</div>
<div class="top">${face(g.avatar, g.uid, g.name)}<b>${esc(g.mine ? t('Jij', 'You') : g.name)}</b><small id="fdAgo"></small><button type="button" aria-label="${t('Sluiten', 'Close')}" onclick="GLXFEED.close()">✕</button></div>
<div class="img"><img id="fdImg" alt=""><button class="tap" style="left:0" aria-label="${t('Vorige', 'Previous')}" onclick="GLXFEED._step(-1)"></button><button class="tap" style="right:0" aria-label="${t('Volgende', 'Next')}" onclick="GLXFEED._step(1)"></button><div class="cap" id="fdCapV"></div></div>
<div class="act">${g.mine ? `<button type="button" onclick="GLXFEED._del()">${ic('trash', 18)}${t('Verwijder', 'Delete')}</button>` : `<button type="button" onclick="GLXFEED.close();openProfile('${g.uid}')">${I('user', 18)}${t('Profiel', 'Profile')}</button><button type="button" onclick="GLXFEED.report('story',GLXFEED._cur())">${ic('flag', 18)}${t('Melden', 'Report')}</button>`}</div></div>`);
    faces($('fdView')); document.addEventListener('keydown', key); show();
  }
  const key = e => { if (!viewer) return; if (e.key === 'Escape') closeViewer(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1) };
  async function show() {
    if (!viewer) return; const { g, i } = viewer, s = g.list[i]; clearTimeout(viewer.timer);
    const bars = document.querySelectorAll('#fdView .bars u'); bars.forEach((b, k) => { b.style.transition = 'none'; b.style.width = k < i ? '100%' : '0' });
    $('fdAgo').textContent = ago(s.at) + (s.status === 'review' ? ' · ' + t('wordt nagekeken', 'in review') : ''); $('fdCapV').textContent = s.caption || '';
    let u = viewer.urls[s.path]; if (!u) { const r = await db().storage.from('stories').createSignedUrl(s.path, 600); u = r.data && r.data.signedUrl; viewer.urls[s.path] = u }
    if (!viewer || viewer.g.list[viewer.i] !== s) return;
    const im = $('fdImg'); im.src = u || ''; markSeen(s.id);
    const run = () => { const b = bars[i]; if (!b) return; requestAnimationFrame(() => { b.style.transition = 'width 5s linear'; b.style.width = '100%' }); viewer.timer = setTimeout(() => step(1), 5000) };
    if (im.complete && im.naturalWidth) run(); else im.onload = run;
  }
  function step(n) { if (!viewer) return; viewer.i += n; if (viewer.i < 0) viewer.i = 0; if (viewer.i >= viewer.g.list.length) { closeViewer(); render(); return } show() }
  function closeViewer() { if (!viewer) return; clearTimeout(viewer.timer); viewer = null; const v = $('fdView'); if (v) v.remove(); document.removeEventListener('keydown', key); render() }
  async function del() {
    if (!viewer) return; const s = viewer.g.list[viewer.i], d = db(); if (!confirm(t('Dit verhaal verwijderen?', 'Delete this story?'))) return;
    const r = await d.rpc('story_delete', { p_id: s.id }); if (!r.error) await d.storage.from('stories').remove([s.path]);
    T(r.error ? t('Verwijderen lukte niet', 'Could not delete') : t('Verwijderd', 'Deleted')); closeViewer(); load(true);
  }

  /* je eigen verlopen foto's opruimen (één keer per sessie) */
  let cleaned = false;
  async function cleanup() {
    if (cleaned || !db() || !uid()) return; cleaned = true;
    try {
      const r = await db().storage.from('stories').list(uid(), { limit: 100 }); if (r.error || !r.data) return;
      const live = new Set((data.stories || []).filter(s => s.mine).map(s => s.path));
      const old = r.data.filter(f => !live.has(uid() + '/' + f.name) && Date.now() - new Date(f.created_at) > 25 * 3600e3).map(f => uid() + '/' + f.name);
      if (old.length) await db().storage.from('stories').remove(old);
    } catch (e) { }
  }

  window.GLXFEED = {
    load, add, view, answer, editAnswer, delAnswer, report, close: closeViewer,
    _rep: rep, _post: post, _step: step, _del: del, _cur: () => viewer ? viewer.g.list[viewer.i].id : ''
  };
  window.renderFeed = function () { render(); load() };

  /* bij openen van de feed: verversen */
  let wasOn = false;
  const start = () => {
    const v = $('v-feed'); if (!v) return; render();
    new MutationObserver(() => { const on = v.classList.contains('on'); if (on && !wasOn) load(); wasOn = on }).observe(v, { attributes: true, attributeFilter: ['class'] });
  };
  if (document.readyState !== 'loading') start(); else document.addEventListener('DOMContentLoaded', start);
})();
