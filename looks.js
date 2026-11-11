/* Galaxy kleuren: donkere Galaxy-thema's (zoals altijd) plus lichte pastelthema's.
   Keuze blijft bewaard op het toestel (localStorage.glxLook). */
(function () {
  const LOOKS = {
    galaxy: { n: 'Galaxy', sub: 'Donker · standaard', d: 1, a: '#8b5cf6', c: '#ec4899', b: '#22d3ee', bg: '#07061a' },
    zonsondergang: { n: 'Zonsondergang', sub: 'Donker', d: 1, a: '#f97316', c: '#ef4444', b: '#fbbf24', bg: '#07061a' },
    oceaan: { n: 'Oceaan', sub: 'Donker', d: 1, a: '#0ea5e9', c: '#14b8a6', b: '#6366f1', bg: '#07061a' },
    neon: { n: 'Neon', sub: 'Donker', d: 1, a: '#22c55e', c: '#a3e635', b: '#06b6d4', bg: '#07061a' },
    lila: { n: 'Pastel Lila', sub: 'Licht', a: '#8a67e0', c: '#e06aa8', b: '#3aa6cf', bg: '#f5f0fd', card: '#ffffff', card2: '#efe7fb', line: '#dccff3', txt: '#2a2350', mut: '#6a6291' },
    perzik: { n: 'Pastel Perzik', sub: 'Licht', a: '#e8735f', c: '#e06a94', b: '#d9913a', bg: '#fff5ef', card: '#ffffff', card2: '#ffe9df', line: '#f4d2c3', txt: '#3b2430', mut: '#84636b' },
    mint: { n: 'Pastel Mint', sub: 'Licht', a: '#2fa888', c: '#3d9bd1', b: '#8a67e0', bg: '#eefaf5', card: '#ffffff', card2: '#dff4ea', line: '#c2e6d6', txt: '#17332b', mut: '#54756a' },
    hemel: { n: 'Pastel Hemel', sub: 'Licht', a: '#4a8be0', c: '#8a67e0', b: '#2fa8a8', bg: '#eef5fd', card: '#ffffff', card2: '#e0ecfa', line: '#c6d9f2', txt: '#1c2b45', mut: '#5a6c8a' },
    roos: { n: 'Pastel Roos', sub: 'Licht', a: '#d85c93', c: '#e8735f', b: '#8a67e0', bg: '#fef1f6', card: '#ffffff', card2: '#fde3ee', line: '#f3c9db', txt: '#3a1f2e', mut: '#85607a' }
  };
  const KEY = 'glxLook';
  let cur = 'galaxy'; try { const s = localStorage[KEY]; if (s && LOOKS[s]) cur = s } catch (e) { }

  const css = document.createElement('style');
  css.textContent = `
html.lt{color-scheme:light}
html.lt #stars{display:none}
html.lt #nebula i{opacity:.22!important;filter:blur(100px)}
html.lt #nebula i:nth-child(1){background:var(--a)}html.lt #nebula i:nth-child(2){background:var(--c)}html.lt #nebula i:nth-child(3){background:var(--b)}
html.lt #splash{background:radial-gradient(circle at 50% 45%,var(--card),var(--bg) 70%)}
html.lt header{background:linear-gradient(180deg,var(--bg),transparent)}
html.lt nav{background:rgba(255,255,255,.82)}
html.lt .sheet{background:linear-gradient(180deg,rgba(255,255,255,.97),var(--bg));box-shadow:0 -20px 60px rgba(60,40,110,.18)}
html.lt .sheet::before{background:rgba(40,30,80,.2)}
html.lt .ico,html.lt .pill{background:rgba(255,255,255,.8);color:var(--txt);box-shadow:0 2px 8px rgba(60,40,110,.08)}
html.lt .pill.on{color:#fff}
html.lt .ab{background:rgba(255,255,255,.85)}
html.lt .box,html.lt .pure-post,html.lt .post,html.lt .mini,html.lt .seg,html.lt .lcard[style*="var(--card)"]{box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 8px 24px rgba(60,40,110,.1)!important}
html.lt .pure-hero{background:linear-gradient(135deg,var(--card2),var(--card))!important}
html.lt .ov{background:rgba(40,30,80,.35)}
html.lt .inp,html.lt .fld,html.lt input,html.lt textarea,html.lt select{color:var(--txt)}
html.lt .opt,html.lt .set{color:var(--txt)}
html.lt .gmChips button:not(.on),html.lt .gmIntents button:not(.on),html.lt .gmSide button{background:rgba(255,255,255,.9);color:var(--txt);border-color:var(--line);box-shadow:0 2px 8px rgba(60,40,110,.12)}
html.lt .gmChips button.on,html.lt .gmIntents button.on{color:#fff;background:linear-gradient(135deg,var(--a),var(--c))}
html.lt .logo{color:var(--txt)}html.lt .logo svg [fill="#fff"],html.lt .logo svg [fill="#ffffff"],html.lt .logo svg [fill="white"]{fill:var(--txt)}
html.lt .lgTxt{-webkit-text-fill-color:var(--txt)!important;color:var(--txt)!important;text-shadow:none}
html.lt a,html.lt a[style*="#67e8f9"]{color:var(--a)!important}html.lt .btn a,html.lt a.btn{color:#fff}
html.lt #gmBar,html.lt #gmLegend{background:rgba(255,255,255,.92);color:var(--txt);border-color:var(--line);box-shadow:0 2px 10px rgba(60,40,110,.12)}
html.lt #gmBar span,html.lt #gmBar b{color:inherit}
html.lt .gmLive{background:#e8fbf3;color:#0b5a41;border-color:#2fa888;box-shadow:0 2px 8px rgba(60,40,110,.2)}
html.lt .gmLive.pl{background:#fff6dc;color:#6b4a06;border-color:#d9a21b}
html.lt .maplibregl-ctrl-attrib{background:rgba(255,255,255,.75)!important;color:#555!important}
html.lt .gmAv .dot{border-color:#fff}
html.lt #toast{background:var(--txt);color:var(--bg)}
html.lt ::placeholder{color:var(--mut);opacity:.8}
html.lt [style*="color:#fff"]:not(.btn):not(.pill):not(.av):not([style*="background"]){color:var(--txt)!important}
.lkGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.lkCard{border-radius:16px;border:2px solid var(--line);padding:10px;text-align:left;display:block;width:100%}
.lkCard.on{border-color:var(--a);box-shadow:0 0 0 3px color-mix(in srgb,var(--a) 30%,transparent)}
.lkPrev{height:74px;border-radius:11px;position:relative;overflow:hidden;margin-bottom:8px;border:1px solid rgba(128,128,128,.25)}
.lkPrev i{position:absolute;left:8px;right:8px;border-radius:6px}
.lkPrev i.c1{top:9px;height:22px}.lkPrev i.c2{top:38px;height:10px;right:40%}.lkPrev i.c3{bottom:8px;height:12px;left:auto;width:44px}
.lkCard b{display:block;font-size:14px}.lkCard small{color:var(--mut);font-size:11.5px}
`;
  document.head.appendChild(css);

  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})` }
  function apply(k, quiet) {
    const L = LOOKS[k] || LOOKS.galaxy, r = document.documentElement, s = r.style;
    cur = LOOKS[k] ? k : 'galaxy';
    const V = L.d
      ? { '--bg': '#07061a', '--card': '#14122e', '--card2': '#1d1a40', '--line': '#2c2860', '--txt': '#f1efff', '--mut': '#9b96c9', '--glass': 'linear-gradient(180deg,rgba(30,27,70,.72),rgba(16,14,43,.72))', '--edge': 'rgba(255,255,255,.08)' }
      : { '--bg': L.bg, '--card': L.card, '--card2': L.card2, '--line': L.line, '--txt': L.txt, '--mut': L.mut, '--glass': `linear-gradient(180deg,rgba(255,255,255,.92),${hexA(L.card2, .85)})`, '--edge': L.line };
    Object.keys(V).forEach(p => s.setProperty(p, V[p]));
    s.setProperty('--a', L.a); s.setProperty('--c', L.c); s.setProperty('--b', L.b);
    s.setProperty('--grad', `linear-gradient(135deg,${L.a},${L.c} 55%,${L.b})`);
    r.classList.toggle('lt', !L.d); r.dataset.look = cur;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = L.bg;
    try { localStorage[KEY] = cur } catch (e) { }
    try { window.GLXMAP && GLXMAP.restyle && GLXMAP.restyle() } catch (e) { }
    if (!quiet && typeof toast === 'function') toast('🎨 Kleuren: ' + L.n);
  }
  function card(k) {
    const L = LOOKS[k], bg = L.bg, cd = L.d ? '#1d1a40' : L.card2, tx = L.d ? '#f1efff' : L.txt;
    return `<button class="lkCard${k === cur ? ' on' : ''}" onclick="GLXLOOK.set('${k}');GLXLOOK.open()" aria-pressed="${k === cur}">
<span class="lkPrev" style="display:block;background:${bg}"><i class="c1" style="background:${cd}"></i><i class="c2" style="background:${tx};opacity:.55"></i><i class="c3" style="background:linear-gradient(135deg,${L.a},${L.c} 55%,${L.b})"></i></span>
<b>${L.n}</b><small>${L.sub}</small></button>`;
  }
  function open() {
    const dark = Object.keys(LOOKS).filter(k => LOOKS[k].d), light = Object.keys(LOOKS).filter(k => !LOOKS[k].d);
    xs('🎨 Kleuren', `<p class="sub" style="margin-bottom:10px">Kies hoe Galaxy eruitziet. Je keuze blijft bewaard op dit toestel. Gratis voor iedereen.</p>
<b style="display:block;margin:6px 0 8px">☀️ Licht en pastel</b><div class="lkGrid">${light.map(card).join('')}</div>
<b style="display:block;margin:16px 0 8px">🌙 Donker</b><div class="lkGrid">${dark.map(card).join('')}</div>`);
  }
  window.GLXLOOK = { set: apply, open, current: () => cur, light: () => !LOOKS[cur].d, looks: LOOKS };
  try { window.themes = open; window.setTheme = n => apply(String(n).toLowerCase()) } catch (e) { }
  apply(cur, true);
})();
