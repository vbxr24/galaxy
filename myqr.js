/* Galaxy – Mijn QR-code.
   Iedereen heeft een persoonlijke QR-code op zijn profiel. Wie hem scant (met Galaxy of met de gewone camera),
   opent jouw profielkaart in Galaxy en kan zwaaien. Blokkeren blijft altijd werken: wie jou blokkeerde of
   die jij blokkeerde, ziet je kaart niet. De QR-bibliotheken (MIT) laden pas als ze nodig zijn, met integriteitscontrole. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = m => { try { toast(m) } catch (e) { } };
  const nl = () => { try { return (typeof LANG === 'undefined' ? 'nl' : LANG) === 'nl' } catch (e) { return true } };
  const t = (a, b) => nl() ? a : b;
  const net = () => window.GLXNET || {};
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const BASE = 'https://vbxr24.github.io/galaxy/';
  const LIBS = {
    qr: ['https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js', 'sha384-8FWZA6BGMXhsfO+BLtrJK0We6gg5o1JyO8xQm6peWDEUs17ACA5ziE/NIAkl9z2k', () => window.qrcode],
    scan: ['https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js', 'sha384-b5Ya4Bq3qCyz39m2ISh+4DxjAIljdeFwK/BsXLuj9gugaNwAcj/ia15fxNZL9Nlx', () => window.jsQR]
  };
  const lib = k => new Promise((ok, no) => { const [src, sri, get] = LIBS[k]; if (get()) return ok(get()); const s = document.createElement('script'); s.src = src; s.integrity = sri; s.crossOrigin = 'anonymous'; s.onload = () => ok(get()); s.onerror = () => no(new Error('lib')); document.head.appendChild(s) });
  const link = id => BASE + '?u=' + id;
  const myName = () => { try { return (typeof ME !== 'undefined' && ME && ME.name) || '' } catch (e) { return '' } };

  /* ---------- mijn code tonen ---------- */
  async function mine() {
    const id = net().uid;
    if (!id) return T(t('Even geduld: Galaxy maakt nog verbinding.', 'One moment: Galaxy is still connecting.'));
    let paused = false; try { paused = !!localStorage.glxGhost } catch (e) { }
    xs('📱 ' + t('Mijn QR-code', 'My QR code'), `
<div style="text-align:center">
<div id="qrMine" style="background:#fff;border-radius:22px;padding:14px;max-width:280px;margin:6px auto 10px" aria-label="${t('Jouw persoonlijke QR-code', 'Your personal QR code')}"></div>
<b style="font-size:18px">${esc(myName())}</b>
<p class="sub" style="margin:6px 0 14px">${t('Laat iemand deze code scannen om meteen je profiel te zien en naar je te zwaaien.', 'Let someone scan this code to see your profile and wave at you.')}</p></div>
${paused ? `<div class="box" style="border-color:#f59e0b"><p class="sub">🌙 ${t('Je staat onzichtbaar op de kaart. Wie je code scant, ziet wel je profielkaart.', 'You are invisible on the map. People who scan your code still see your profile card.')}</p></div>` : ''}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
<button class="btn" onclick="GLXQR.scan()">📷 ${t('Scan een code', 'Scan a code')}</button>
<button class="btn ghost" onclick="GLXQR.share()">🔗 ${t('Deel link', 'Share link')}</button></div>
<p class="sub" style="font-size:12px">🔒 ${t('Je code toont alleen je profielkaart, nooit je exacte locatie. Wie je blokkeert, ziet niets meer.', 'Your code only shows your profile card, never your exact location. Anyone you block sees nothing.')}</p>`, false);
    try {
      const qrcode = await lib('qr'); const q = qrcode(0, 'M'); q.addData(link(id)); q.make();
      const el = $('qrMine'); if (el) el.innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
      const s = el && el.querySelector('svg'); if (s) { s.style.width = '100%'; s.style.height = 'auto'; s.style.display = 'block' }
    } catch (e) { const el = $('qrMine'); if (el) el.innerHTML = `<p style="color:#111;padding:20px">${t('QR kon niet laden. Gebruik "Deel link".', 'QR could not load. Use "Share link".')}</p>` }
  }
  async function share() {
    const id = net().uid; if (!id) return;
    const txt = t('Bekijk mijn profiel op Galaxy', 'Check out my Galaxy profile');
    try { if (navigator.share) return await navigator.share({ title: 'Galaxy', text: txt, url: link(id) }) } catch (e) { return }
    try { await navigator.clipboard.writeText(link(id)); T(t('Link gekopieerd', 'Link copied')) } catch (e) { prompt(t('Kopieer je link', 'Copy your link'), link(id)) }
  }

  /* ---------- iemands code scannen ---------- */
  let stream = null, run = false;
  function stop() { run = false; try { stream && stream.getTracks().forEach(x => x.stop()) } catch (e) { } stream = null }
  function idFrom(txt) {
    try { const u = new URL(String(txt)); const ok = (u.hostname === 'vbxr24.github.io' && u.pathname.startsWith('/galaxy')) || u.origin === location.origin; if (!ok) return null; const id = u.searchParams.get('u'); return UUID.test(id || '') ? id : null } catch (e) { return null }
  }
  async function scan() {
    xs('📷 ' + t('Scan een Galaxy-code', 'Scan a Galaxy code'), `<div style="position:relative;border-radius:18px;overflow:hidden;background:#000;aspect-ratio:3/4"><video id="qrCam" playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
<div style="position:absolute;inset:18%;border:3px solid #ffffffcc;border-radius:22px;box-shadow:0 0 0 999px #0006"></div></div>
<p class="sub" style="text-align:center;margin:10px 0" id="qrMsg">${t('Richt je camera op iemands Galaxy-code', 'Point your camera at someone\'s Galaxy code')}</p>
<button class="btn ghost" style="width:100%" onclick="GLXQR._stop();GLXQR.mine()">‹ ${t('Terug naar mijn code', 'Back to my code')}</button>`, false);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const v = $('qrCam'); v.srcObject = stream; await v.play(); run = true;
      const det = 'BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats()).includes('qr_code') ? new BarcodeDetector({ formats: ['qr_code'] }) : null;
      const jsQR = det ? null : await lib('scan');
      const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
      const loop = async () => {
        if (!run || !$('qrCam')) return stop();
        try {
          let txt = null;
          if (det) { const r = await det.detect(v); txt = r[0] && r[0].rawValue }
          else if (v.videoWidth) { const w = 480, h = Math.round(v.videoHeight / v.videoWidth * w); cv.width = w; cv.height = h; cx.drawImage(v, 0, 0, w, h); const r = jsQR(cx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' }); txt = r && r.data }
          if (txt) {
            const id = idFrom(txt);
            if (id) { stop(); try { navigator.vibrate && navigator.vibrate(60) } catch (e) { } return openFor(id) }
            const m = $('qrMsg'); if (m) m.textContent = '⛔ ' + t('Dit is geen Galaxy-code', 'This is not a Galaxy code');
          }
        } catch (e) { }
        setTimeout(loop, det ? 150 : 250);
      };
      loop();
    } catch (e) { const m = $('qrMsg'); if (m) m.textContent = '⚠️ ' + t('Geen toegang tot de camera. Geef toestemming in je browser.', 'No camera access. Allow it in your browser.') }
  }
  function openFor(id) {
    if (id === net().uid) return mine();
    try { closeO && closeO('xV') } catch (e) { }
    try { window.openProfile(id) } catch (e) { T(t('Profiel niet gevonden', 'Profile not found')) }
  }

  /* ---------- link ?u=... openen bij het opstarten ---------- */
  function fromUrl() {
    let id = null; try { id = new URLSearchParams(location.search).get('u') } catch (e) { }
    if (!UUID.test(id || '')) return;
    try { const u = new URL(location.href); u.searchParams.delete('u'); history.replaceState(null, '', u.pathname + u.search + u.hash) } catch (e) { }
    let n = 0; const wait = setInterval(() => { n++; if (net().state === 'verbonden' && net().uid) { clearInterval(wait); openFor(id) } else if (n > 40) { clearInterval(wait); T(t('Kon het profiel niet openen. Probeer opnieuw.', 'Could not open the profile. Try again.')) } }, 500);
  }

  window.GLXQR = { mine, scan, share, _stop: stop };

  function hook() {
    try { if (typeof HUB !== 'undefined' && !HUB.some(h => /GLXQR/.test(h[2]))) HUB.splice(1, 0, ['📱', t('Mijn QR-code', 'My QR code'), 'GLXQR.mine()']) } catch (e) { }
    try { const g = $('ghostTg'), box = g && g.closest('.box'); if (box && !$('qrRow')) box.insertAdjacentHTML('afterbegin', `<div class="set" id="qrRow"><span>📱 ${t('Mijn QR-code', 'My QR code')}</span><button class="btn sm" onclick="GLXQR.mine()">${t('Toon', 'Show')}</button></div>`) } catch (e) { }
    fromUrl();
    if (/[?&]qr=1/.test(location.search)) { try { history.replaceState(null, '', location.pathname) } catch (e) { } setTimeout(() => { try { GLXQR.mine() } catch (e) { } }, 900) }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
