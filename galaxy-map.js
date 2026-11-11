/* =====================================================================
   Galaxy-kaart 2.0 — 3D-kaart van de hele wereld + drukte per type mensen
   - Kaart: MapLibre GL + OpenFreeMap (gratis, geen API-sleutel)
   - Drukte-heatmap per type mensen (studenten, uitgaan, rustig daten, spicy)
   - Hotspots en plekken, inchecken, groepsdates
   - Power-ups per abonnement
   Veiligheid: er worden NOOIT mensen of hun locatie getoond, alleen plekken.
   ===================================================================== */
(function () {
  'use strict';
  const STYLE = 'https://tiles.openfreemap.org/styles/liberty';
  const ML_JS = 'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js';
  const ML_CSS = 'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css';
  const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = (m) => { try { (window.toast || alert)(m) } catch (e) { } };

  /* ---------- spelstatus (bewaard op dit toestel) ---------- */
  const G = (() => { let g = {}; try { g = JSON.parse(localStorage.glxGame || '{}') } catch (e) { }
    return Object.assign({ checkins: {}, groups: [], remoteDay: '' }, g) })();
  const save = () => { try { localStorage.glxGame = JSON.stringify(G) } catch (e) { } };

  /* ---------- power-ups per abonnement ---------- */
  const POWER = {
    free: { n: 'Gratis', r: 150, fc: false, mix: false, remote: 0, spot: false, see: 'Inchecken binnen 150 m · drukte nu' },
    plus: { n: 'Plus', r: 300, fc: false, mix: true, remote: 0, spot: false, see: 'Inchecken binnen 300 m · wie er zit per zone' },
    gold: { n: 'Gold', r: 300, fc: true, mix: true, remote: 0, spot: false, see: '300 m · wie er zit · voorspelling voor later op de avond · gouden rand' },
    cosmic: { n: 'Cosmic', r: 500, fc: true, mix: true, remote: 1, spot: true, see: '500 m · voorspelling · 1× per dag op afstand inchecken · kosmische aura' },
    lifetime: { n: 'Galaxy Forever', r: 500, fc: true, mix: true, remote: 1, spot: true, see: 'Alles van Cosmic, voor altijd' }
  };
  function plan() { const p = (window.S && S.plan) || 'free'; return POWER[p] ? p : 'free' }
  const pw = () => POWER[plan()];


  /* soorten plekken: kleur, icoon, label */
  const CAT = {
    land: ['#fbbf24', '🗿', 'Monument'], sight: ['#a78bfa', '🏛️', 'Bezienswaardigheid'], museum: ['#c4b5fd', '🏛️', 'Museum'],
    park: ['#34d399', '🌳', 'Park'], fun: ['#f97316', '🎢', 'Pretpark'], zoo: ['#84cc16', '🦁', 'Dierentuin'],
    shop: ['#38bdf8', '🛍️', 'Winkelcentrum'], culture: ['#e879f9', '🎭', 'Cultuur'], sport: ['#60a5fa', '🏟️', 'Sport'],
    beach: ['#fde68a', '🏖️', 'Strand'], night: ['#ec4899', '🍸', 'Bar / club'], student: ['#22d3ee', '🎓', 'Campus'],
    cafe: ['#d6b48a', '☕', 'Café'], food: ['#fb7185', '🍽️', 'Restaurant']
  };
  /* ---------- hulpfuncties ---------- */
  function dist(a, b, c, d) { const R = 6371e3, r = Math.PI / 180, x = (d - b) * r * Math.cos((a + c) / 2 * r), y = (c - a) * r; return Math.sqrt(x * x + y * y) * R }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
  function rng(seed) { let t = seed; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296 } }
  function circle(lng, lat, m, n = 64) { const c = []; for (let i = 0; i <= n; i++) { const a = i / n * 2 * Math.PI; c.push([lng + m / (111320 * Math.cos(lat * Math.PI / 180)) * Math.cos(a), lat + m / 110540 * Math.sin(a)]) } return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [c] }, properties: {} } }
  const today = () => new Date().toISOString().slice(0, 10);
  const slot = () => Math.floor(Date.now() / (15 * 60e3));
  function loadCss(h) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; document.head.appendChild(l) }
  function loadJs(s) { return new Promise((ok, no) => { const e = document.createElement('script'); e.src = s; e.onload = ok; e.onerror = no; document.head.appendChild(e) }) }

  /* ---------- opbouw van het scherm ---------- */
  const CSS = `
#v-map>h2,#mapWrap,#mapInfo,#mapSearch,#v-discover,#nav [data-v="discover"]{display:none!important}
#nav{grid-template-columns:repeat(3,1fr)!important}
#gmHead{display:flex;align-items:center;gap:8px;margin-bottom:8px}
#gmHead h2{flex:1;margin:0;font-size:20px}
#gmStreak{font-size:12px;color:var(--mut);white-space:nowrap}
#gmSearch{position:relative;margin-bottom:8px}
#gmSearch input{width:100%;padding:11px 14px 11px 38px;border-radius:14px;border:1px solid var(--line);background:var(--card);outline:none}
#gmSearch:before{content:'🔍';position:absolute;left:12px;top:10px;font-size:15px}
#gmRes{position:absolute;left:0;right:0;top:46px;z-index:30;background:var(--card2);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:none;max-height:300px;overflow-y:auto}
#gmRes button{display:block;width:100%;text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);font-size:14px}
#gmRes button small{display:block;color:var(--mut);font-size:12px}
#gmWrap{position:relative;height:calc(100% - 118px);min-height:380px;border-radius:22px;overflow:hidden;border:1px solid var(--line);background:#090718}
#glxMap{position:absolute;inset:0}
.gmChips{position:absolute;left:10px;right:56px;top:10px;z-index:5;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.gmChips::-webkit-scrollbar{display:none}
.gmChips button,.gmIntents button{flex:none;padding:7px 11px;border-radius:999px;font-size:12.5px;background:rgba(14,11,38,.82);border:1px solid rgba(167,139,250,.35);backdrop-filter:blur(8px);color:#ece9ff}
.gmChips button.on,.gmIntents button.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent}
.gmIntents{position:absolute;left:10px;right:56px;top:48px;z-index:5;display:none;gap:6px;overflow-x:auto;scrollbar-width:none}
.gmIntents.on{display:flex}
.gmSide{position:absolute;right:10px;top:10px;z-index:6;display:flex;flex-direction:column;gap:8px}
.gmSide button{width:40px;height:40px;border-radius:12px;background:rgba(14,11,38,.85);border:1px solid rgba(167,139,250,.35);font-size:17px;backdrop-filter:blur(8px);position:relative}
.gmSide button i{position:absolute;top:-5px;right:-5px;background:#ec4899;color:#fff;font-style:normal;font-size:10px;font-weight:700;border-radius:9px;padding:1px 5px}
#gmBar{position:absolute;left:10px;right:10px;bottom:10px;z-index:5;padding:9px 12px;border-radius:14px;background:rgba(14,11,38,.88);border:1px solid rgba(167,139,250,.3);font-size:12.5px;color:#d9d4ff;backdrop-filter:blur(8px);display:flex;align-items:center;gap:8px}
#gmBar b{color:#fff}#gmBar button{margin-left:auto;padding:6px 10px;border-radius:10px;background:linear-gradient(135deg,#8b5cf6,#ec4899);font-size:12px;white-space:nowrap}
#gmLegend{position:absolute;left:10px;bottom:58px;z-index:5;display:none;padding:7px 10px;border-radius:12px;background:rgba(14,11,38,.85);font-size:11px;color:#cfc9f5}
#gmLegend.on{display:block}
.gmLive{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:99px;background:rgba(6,40,30,.92);border:1px solid #34d399;color:#d1fae5;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.5);white-space:nowrap}
.gmLive i{width:8px;height:8px;border-radius:50%;background:#34d399;animation:gmPulse 1.6s infinite}.gmLive.pl{background:rgba(40,20,6,.92);border-color:#fbbf24;color:#fef3c7;padding:3px 7px}
@keyframes gmPulse{0%{box-shadow:0 0 0 0 rgba(52,211,153,.7)}100%{box-shadow:0 0 0 9px rgba(52,211,153,0)}}#gmLegend span{display:inline-block;width:110px;height:7px;border-radius:4px;vertical-align:middle;margin:0 6px;background:linear-gradient(90deg,#3b0764,#a21caf,#ec4899,#fff)}
.gmItem{width:42px;height:42px;display:grid;place-items:center;font-size:26px;cursor:pointer;border-radius:50%;animation:gmBob 2.4s ease-in-out infinite;filter:drop-shadow(0 0 8px var(--c,#a78bfa))}
.gmItem.far{opacity:.55;filter:drop-shadow(0 0 4px var(--c,#a78bfa)) grayscale(.3)}
@keyframes gmBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.gmMe{width:20px;height:20px;border-radius:50%;background:#22d3ee;border:3px solid #fff;box-shadow:0 0 0 6px rgba(34,211,238,.25),0 0 18px #22d3ee}
.gmMe.aura{background:#fbbf24;box-shadow:0 0 0 7px rgba(251,191,36,.25),0 0 24px #f472b6}
.gmAv{position:relative;cursor:pointer;display:flex;flex-direction:column;align-items:center}
.gmAv img{width:58px;height:58px;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,.6))}
.gmAv.me img{width:76px;height:76px}
.gmAv.me:after{content:'';width:34px;height:10px;border-radius:50%;background:radial-gradient(rgba(34,211,238,.6),transparent 70%);margin-top:-6px}
.gmAv.me.goud:after{background:radial-gradient(rgba(251,191,36,.55),transparent 70%);width:40px}
.gmAv.me.aura{filter:drop-shadow(0 0 10px rgba(244,114,182,.9))}
.gmAv.me.aura:after{background:radial-gradient(rgba(251,191,36,.8),transparent 70%);width:48px}
.gmAv.live3d:after{margin-top:-22px;width:60px;height:16px}.gmAv.walk img{animation:gmWalk .45s ease-in-out infinite}.gmAv.walk.left img{transform:scaleX(-1)}
@keyframes gmWalk{0%,100%{translate:0 0;rotate:-4deg}50%{translate:0 -5px;rotate:4deg}}
.gmAv .stack{display:flex}.gmAv .stack img{width:46px;height:46px;margin-left:-14px}.gmAv .stack img:first-child{margin-left:0}
.gmAv .stack b{font-size:30px}
.gmAv i{position:absolute;top:-4px;right:-8px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;font-style:normal;font-size:11px;font-weight:800;border-radius:10px;padding:1px 6px}
.gmAv .dot{width:9px;height:9px;border-radius:50%;background:#34d399;border:2px solid #0a0820;position:absolute;bottom:2px;right:0}
.gmCatch{text-align:center}
.gmCatch .big{font-size:84px;margin:6px 0 2px;display:inline-block;animation:gmSpin 3s linear infinite}
@keyframes gmSpin{0%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.08)}100%{transform:rotate(-8deg) scale(1)}}
.gmRing{position:relative;width:170px;height:170px;margin:4px auto 10px;display:grid;place-items:center}
.gmRing svg{position:absolute;inset:0}
.gmTag{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;color:#0b0820}
.gmGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}
.gmGrid div{background:var(--card2);border:1px solid var(--line);border-radius:14px;padding:10px 6px;text-align:center;font-size:12px}
.gmGrid div b{display:block;font-size:26px;margin-bottom:2px}
.gmGrid div.no{opacity:.35}
.gmRow{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px}
.gmPlans td,.gmPlans th{padding:7px 6px;border-bottom:1px solid var(--line);font-size:12.5px;text-align:center}.gmPlans th:first-child,.gmPlans td:first-child{text-align:left}
.gmPlans{width:100%;border-collapse:collapse;margin:8px 0}
.gmPlans .cur{background:rgba(139,92,246,.18)}
.maplibregl-ctrl-attrib{font-size:10px!important;background:rgba(10,8,25,.7)!important;color:#aaa!important}
.maplibregl-ctrl-attrib a{color:#c4b5fd!important}
.maplibregl-popup-content{background:var(--card2);color:var(--txt);border-radius:12px}
`;
  function build() {
    const v = $('v-map'); if (!v || $('gmWrap')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    v.insertAdjacentHTML('afterbegin', `
<div id="gmHead"><h2>Galaxy-kaart</h2></div>
<div id="gmSearch"><input id="gmQ" placeholder="Zoek een stad, straat of plek, overal ter wereld" autocomplete="off"><div id="gmRes"></div></div>
<div id="gmWrap"><div id="glxMap"></div>
 <div class="gmChips"><button data-m="heat" class="on">🔥 Drukte</button><button data-m="stops">📍 Plekken</button><button data-m="groups">👥 Groepsdates</button></div>
 <div class="gmIntents on"><button data-i="all" class="on">Alles</button><button data-i="student">🎓 Studenten</button><button data-i="night">🍸 Uitgaan</button><button data-i="chill">☕ Rustig daten</button><button data-i="spicy">🌶️ Spicy</button></div>
 <div class="gmSide"><button id="gmLoc" title="Mijn locatie">◎</button><button id="gm3d" title="3D">3D</button><button id="gmAvBtn" title="Mijn mannetje">🧍</button><button id="gmPow" title="Power-ups">⚡</button></div>
 <div id="gmLegend">Verwachte drukte<span></span>druk<br><b style="color:#34d399">●</b> groen = live aantal leden</div>
 <div id="gmBar">🌍 De kaart laadt…</div>
</div>`);
    v.querySelectorAll('.gmChips button').forEach(b => b.onclick = () => setMode(b.dataset.m));
    v.querySelectorAll('.gmIntents button').forEach(b => b.onclick = () => setIntent(b.dataset.i));
    $('gmLoc').onclick = locate; $('gm3d').onclick = toggle3d; $('gmAvBtn').onclick = () => window.GLXAV ? GLXAV.open() : T('Even geduld…'); $('gmPow').onclick = openPower;
    let qt; $('gmQ').oninput = e => { clearTimeout(qt); qt = setTimeout(() => search(e.target.value.trim()), 350) };
    $('gmQ').onkeydown = e => { if (e.key === 'Enter') { clearTimeout(qt); search(e.target.value.trim(), true) } };
    document.addEventListener('click', e => { if (!e.target.closest('#gmSearch')) $('gmRes').style.display = 'none' });
  }

  /* ---------- kaart ---------- */
  let map, me = null, watchId = null, mode = 'heat', intent = 'all', pitched = true, venues = new Map(), markers = [];
  async function init() {
    build();
    if (map) { setTimeout(() => map.resize(), 60); return }
    $('gmBar').innerHTML = '🌍 De kaart laadt…';
    try { if (!window.maplibregl) { loadCss(ML_CSS); await loadJs(ML_JS) } }
    catch (e) { $('gmBar').innerHTML = '⚠️ De kaart kon niet laden. Controleer je internet en probeer opnieuw.'; return }
    let start = [4.3517, 50.8467], z = 15.2; // Brussel
    try { const l = JSON.parse(localStorage.glxLast || 'null'); if (l) { start = [l[0], l[1]]; z = l[2] } } catch (e) { }
    map = new maplibregl.Map({ container: 'glxMap', style: STYLE, center: start, zoom: z, pitch: 50, bearing: -12, maxPitch: 75, attributionControl: { compact: true }, dragRotate: true });
    map.touchZoomRotate.enableRotation();
    try { let rz = 0; new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(() => { try { map.resize() } catch (e) { } }, 80) }).observe(document.getElementById('glxMap')) } catch (e) { }
    map.on('load', () => { restyle(); addLayers(); refresh(); bar() });
    map.on('dragstart', () => { follow = false });
    map.on('sourcedata', e => { if (e.isSourceLoaded && e.sourceId !== 'stops' && e.sourceId !== 'heat' && e.sourceId !== 'range') { clearTimeout(poiT); poiT = setTimeout(refresh, 400) } });
    map.on('moveend', () => { try { const c = map.getCenter(); localStorage.glxLast = JSON.stringify([c.lng, c.lat, map.getZoom()]) } catch (e) { } refresh() });
    map.on('error', e => { if (e && e.error && /Failed to fetch|NetworkError/i.test(e.error.message || '')) $('gmBar').innerHTML = '⚠️ Geen verbinding met de kaartserver.' });
    if (navigator.permissions) navigator.permissions.query({ name: 'geolocation' }).then(p => { if (p.state === 'granted') locate(true) }).catch(() => { });
  }

  /* Galaxy-stijl: donkerpaars, gloeiende wegen, 3D-gebouwen */
  function restyle() {
    const set = (id, p, v) => { try { map.setPaintProperty(id, p, v) } catch (e) { } };
    map.getStyle().layers.forEach(l => {
      const id = l.id, t = l.type;
      if (t === 'background') set(id, 'background-color', '#0a0820');
      else if (t === 'fill') {
        if (/water/.test(id)) set(id, 'fill-color', '#0d1d44');
        else if (/building/.test(id)) set(id, 'fill-color', '#1c1642');
        else if (/park|wood|grass|forest|landcover|scrub|wetland/.test(id)) { set(id, 'fill-color', '#0f1d2b'); set(id, 'fill-opacity', .9) }
        else if (/ice|sand|beach/.test(id)) set(id, 'fill-color', '#16132f');
        else set(id, 'fill-color', '#110d29');
      } else if (t === 'line') {
        if (/water|river|stream|canal/.test(id)) set(id, 'line-color', '#173a74');
        else if (/boundary|admin/.test(id)) { set(id, 'line-color', '#7c3aed'); set(id, 'line-opacity', .7) }
        else if (/casing/.test(id)) set(id, 'line-color', '#0b0720');
        else if (/rail|transit/.test(id)) set(id, 'line-color', '#3a2f6e');
        else if (/motorway/.test(id)) set(id, 'line-color', '#e879f9');
        else if (/trunk|primary/.test(id)) set(id, 'line-color', '#c084fc');
        else if (/secondary|tertiary/.test(id)) set(id, 'line-color', '#8b5cf6');
        else if (/road|street|minor|service|track|path|pedestrian|highway|bridge|tunnel/.test(id)) set(id, 'line-color', /path|pedestrian|track/.test(id) ? '#3d3474' : '#4c3f8f');
      } else if (t === 'fill-extrusion') {
        set(id, 'fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], ['get', 'height'], 8], 0, '#221a4f', 25, '#3b2a86', 80, '#6d4bd8', 200, '#c084fc']);
        set(id, 'fill-extrusion-opacity', .88);
      } else if (t === 'symbol') {
        const place = /place|city|town|village|country|state|capital/.test(id);
        set(id, 'text-color', place ? '#f5f3ff' : /road|street|highway/.test(id) ? '#b7aee8' : /water/.test(id) ? '#7fb2ff' : '#cfc7f5');
        set(id, 'text-halo-color', '#07061a'); set(id, 'text-halo-width', 1.4);
        if (/poi/.test(id)) set(id, 'icon-opacity', .75);
      }
    });
    // 3D-gebouwen toevoegen als de stijl ze niet heeft
    if (!map.getStyle().layers.some(l => l.type === 'fill-extrusion') && map.getSource('openmaptiles')) {
      try { map.addLayer({ id: 'glx-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14, paint: { 'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#221a4f', 25, '#3b2a86', 80, '#6d4bd8', 200, '#c084fc'], 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': .88 } }, firstSymbol()) } catch (e) { }
    }
    try { map.setSky && map.setSky({ 'sky-color': '#140f3a', 'horizon-color': '#3b1d6e', 'fog-color': '#0a0820', 'sky-horizon-blend': .6, 'horizon-fog-blend': .5, 'fog-ground-blend': .4 }) } catch (e) { }
  }
  const firstSymbol = () => (map.getStyle().layers.find(l => l.type === 'symbol') || {}).id;
  const fc = (f = []) => ({ type: 'FeatureCollection', features: f });
  function addLayers() {
    const before = firstSymbol();
    map.addSource('heat', { type: 'geojson', data: fc() });
    map.addLayer({ id: 'gm-heat', type: 'heatmap', source: 'heat', layout: { visibility: 'none' }, paint: {
      'heatmap-weight': ['get', 'w'], 'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 13, .9, 17, 1.8],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 13, 18, 15, 34, 18, 70],
      'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', .15, 'rgba(76,29,149,.55)', .4, '#a21caf', .65, '#ec4899', .85, '#fda4af', 1, '#ffffff'],
      'heatmap-opacity': .85 } }, before);
    map.addSource('range', { type: 'geojson', data: fc() });
    map.addLayer({ id: 'gm-range', type: 'fill', source: 'range', paint: { 'fill-color': '#22d3ee', 'fill-opacity': .08 } }, before);
    map.addLayer({ id: 'gm-range-l', type: 'line', source: 'range', paint: { 'line-color': '#22d3ee', 'line-opacity': .6, 'line-width': 1.5, 'line-dasharray': [2, 2] } }, before);
    map.addSource('stops', { type: 'geojson', data: fc() });
    const big = ['==', ['get', 'm'], 0], small = ['==', ['get', 'm'], 1];
    map.addLayer({ id: 'gm-stops-glow', type: 'circle', source: 'stops', minzoom: 13, filter: big, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 6, 17, 18], 'circle-color': ['get', 'col'], 'circle-blur': 1, 'circle-opacity': .5 } });
    map.addLayer({ id: 'gm-stops', type: 'circle', source: 'stops', minzoom: 13, filter: big, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 17, 8], 'circle-color': ['get', 'col'], 'circle-stroke-color': '#fff', 'circle-stroke-width': ['case', ['==', ['get', 'done'], 1], 3, 1.5] } });
    map.addLayer({ id: 'gm-small', type: 'circle', source: 'stops', minzoom: 15.5, filter: small, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 15.5, 2.5, 18, 6], 'circle-color': ['get', 'col'], 'circle-stroke-color': '#0a0820', 'circle-stroke-width': 1 } });
    map.addLayer({ id: 'gm-stops-t', type: 'symbol', source: 'stops', minzoom: 14.5, filter: big, layout: { 'text-field': ['get', 'n'], 'text-font': ['Noto Sans Regular'], 'text-size': 11.5, 'text-offset': [0, 1.2], 'text-anchor': 'top', 'text-max-width': 9, 'text-optional': true }, paint: { 'text-color': ['get', 'col'], 'text-halo-color': '#07061a', 'text-halo-width': 1.4 } });
    map.addLayer({ id: 'gm-small-t', type: 'symbol', source: 'stops', minzoom: 16.5, filter: small, layout: { 'text-field': ['get', 'n'], 'text-font': ['Noto Sans Regular'], 'text-size': 10.5, 'text-offset': [0, .9], 'text-anchor': 'top', 'text-max-width': 8, 'text-optional': true }, paint: { 'text-color': ['get', 'col'], 'text-halo-color': '#07061a', 'text-halo-width': 1.3 } });
    map.on('click', 'gm-small', e => { const f = e.features && e.features[0]; if (f) openStop(f.properties.id) });
    map.on('click', e => { if (mode !== 'heat' || map.getZoom() < 13.5) return; const hit = map.queryRenderedFeatures(e.point, { layers: ['gm-stops', 'gm-small'] }); if (!hit.length) openZone(e.lngLat.lat, e.lngLat.lng) });
    map.on('click', 'gm-stops', e => { const f = e.features && e.features[0]; if (f) openStop(f.properties.id) });
    map.on('mouseenter', 'gm-stops', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'gm-stops', () => map.getCanvas().style.cursor = '');
  }

  /* ---------- plekken: rechtstreeks uit de kaartgegevens (wereldwijd, geen extra server) ---------- */
  const SUB = { bar: 'night', pub: 'night', nightclub: 'night', biergarten: 'night', cafe: 'cafe', restaurant: 'food', fast_food: 'food', food_court: 'food', university: 'student', college: 'student',
    theme_park: 'fun', water_park: 'fun', amusement_arcade: 'fun', zoo: 'zoo', aquarium: 'zoo', mall: 'shop', department_store: 'shop', museum: 'museum', gallery: 'museum', art_gallery: 'museum',
    cinema: 'culture', theatre: 'culture', arts_centre: 'culture', stadium: 'sport', park: 'park', beach: 'beach', monument: 'land', castle: 'land', ruins: 'land', attraction: 'sight', viewpoint: 'sight', memorial: 'sight' };
  const CLS = { bar: 'night', beer: 'night', cafe: 'cafe', restaurant: 'food', fast_food: 'food', college: 'student', zoo: 'zoo', museum: 'museum', cinema: 'culture', theatre: 'culture', stadium: 'sport', park: 'park', castle: 'land', monument: 'land', attraction: 'sight' };
  let loading = false, poiT;
  function scanPois() {
    if (!map || map.getZoom() < 13.5) return;
    let feats = []; const st = map.getStyle();
    Object.keys(st.sources).forEach(src => { if (st.sources[src].type === 'vector') { try { feats = feats.concat(map.querySourceFeatures(src, { sourceLayer: 'poi' })) } catch (e) { } } });
    feats.forEach(f => {
      const p = f.properties || {}, c = SUB[p.subclass] || CLS[p.class]; if (!c || f.geometry.type !== 'Point') return;
      const [lng, lat] = f.geometry.coordinates, n = p['name:nl'] || p.name || p['name:latin'] || '';
      if (!n && !/^(night|cafe|food)$/.test(c)) return;
      const id = 'p' + (f.id != null ? f.id : hash(n + lat.toFixed(5) + lng.toFixed(5)));
      if (venues.has(id)) return;
      const kind = c === 'night' ? 'night' : c === 'student' ? 'student' : /^(cafe|food)$/.test(c) ? 'chill' : 'sight';
      venues.set(id, { id, n, lat, lng, kind, c, land: c === 'land', hot: kind === 'night' && !!n, cat: p.subclass || p.class || '' });
    });
    if (venues.size > 6000) { let k = 0; for (const key of venues.keys()) { if (k++ > 2000) break; venues.delete(key) } }
  }
  function refresh() {
    if (!map) return;
    scanPois(); drawStops(); drawHeat(); drawPeople(); bar();
  }
  function inView(v, pad = 0) { const b = map.getBounds(); return v.lng >= b.getWest() - pad && v.lng <= b.getEast() + pad && v.lat >= b.getSouth() - pad && v.lat <= b.getNorth() + pad }
  function stopKind(v) { return v.land ? 'land' : v.hot ? 'hot' : 'stop' }
  const catOf = v => v.c || (v.land ? 'land' : v.kind === 'night' ? 'night' : v.kind === 'student' ? 'student' : v.kind === 'chill' ? 'food' : 'sight');
  function isStop(v) { return true }
  const minor = v => /^(cafe|food)$/.test(catOf(v)) || (catOf(v) === 'night' && !v.n);
  function drawStops() {
    if (!map || !map.getSource('stops')) return;
    const show = true;
    const f = []; if (show) venues.forEach(v => { if (isStop(v) && v.n && inView(v, .01)) f.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [v.lng, v.lat] }, properties: { id: v.id, n: v.n, c: catOf(v), col: CAT[catOf(v)][0], m: minor(v) ? 1 : 0, done: cooldown(v) ? 1 : 0 } }) });
    map.getSource('stops').setData(fc(f.slice(0, 4000)));
  }

  /* ---------- verwachte drukte ---------- */
  function heatWeight(v) {
    const h = new Date().getHours(), night = h >= 20 || h < 4, day = h >= 8 && h < 18, wkd = [5, 6].includes(new Date().getDay());
    const nf = night ? 1.6 : day ? .35 : .8, cf = day ? 1.2 : night ? .5 : .9, sf = day && !wkd ? 1.5 : .6;
    const m = {
      all: { night: 1 * nf, chill: .5 * cf, student: 2 * sf, sight: .25 },
      student: { night: .45 * nf, chill: .2, student: 3.5 * sf, sight: 0 },
      night: { night: 1.6 * nf, chill: .15, student: .2, sight: 0 },
      chill: { night: .2, chill: 1.2 * cf, student: .2, sight: .3 },
      spicy: { night: 1.8 * nf, chill: .1, student: .1, sight: 0 }
    }[intent];
    return m[v.kind] || 0;
  }
  function drawHeat() {
    if (!map || !map.getSource('heat')) return;
    if (mode !== 'heat') { map.setLayoutProperty('gm-heat', 'visibility', 'none'); $('gmLegend').classList.remove('on'); return }
    const f = []; venues.forEach(v => { const w = heatWeight(v); if (w > 0 && inView(v, .03)) f.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [v.lng, v.lat] }, properties: { w } }) });
    map.getSource('heat').setData(fc(f)); map.setLayoutProperty('gm-heat', 'visibility', 'visible'); $('gmLegend').classList.add('on');
  }

  /* ---------- plekken: Hotspots, campussen, monumenten ---------- */
  const STAY = 2 * 3600e3;
  const cooldown = v => (G.checkins[v.id] || 0) > Date.now() - STAY;
  function openStop(id) {
    const v = venues.get(id); if (!v) return;
    const k = stopKind(v), C = CAT[catOf(v)], icon = C[1];
    const d = me ? dist(me.lat, me.lng, v.lat, v.lng) : null, p = pw(), inR = d != null && d <= p.r;
    const remote = !inR && p.remote && G.remoteDay !== today();
    xs(icon + ' ' + esc(v.n || 'Plek'), `
<p class="sub"><span style="color:${C[0]}">●</span> ${C[2]}${k === 'hot' ? ' · Hotspot' : ''}</p>
${busyLabel(v) ? `<p style="margin:10px 0">${busyLabel(v)}</p>` : ''}
${mixHtml(v.lat, v.lng)}
<div class="gmRow"><span>Afstand</span><b>${d == null ? 'zet je locatie aan' : d < 1000 ? Math.round(d) + ' m' : (d / 1000).toFixed(1) + ' km'}</b></div>
<div class="gmRow"><span>Galaxy-leden hier nu</span><b>${peopleNear(v.lat, v.lng, 150).length || 'nog niemand'}</b></div>
<div class="gmRow"><span>Nu ingecheckt (live)</span><b>${(live.busy && live.busy.places && live.busy.places[v.id]) || 0}</b></div>
<p class="sub" style="margin-top:6px">Wie hier ook incheckt, ziet 2 uur lang je profiel. Je exacte locatie blijft verborgen.</p>
<br>${cooldown(v) ? `<button class="btn ghost" style="width:100%" onclick="GLXMAP.checkout('${id}')">✔️ Ingecheckt · tik om uit te checken</button>` :
      inR || remote ? `<button class="btn" style="width:100%" onclick="GLXMAP.checkin('${id}',${remote ? 1 : 0})">${remote ? '🛰️ Check in op afstand (Cosmic, 1× per dag)' : '📍 Check hier in'}</button>` :
        d == null ? `<button class="btn" style="width:100%" onclick="GLXMAP.locate()">📍 Zet locatie aan om in te checken</button>` : `<button class="btn ghost" style="width:100%" disabled>Kom binnen ${p.r} m om in te checken</button>`}
<button class="btn ghost" style="width:100%;margin-top:8px" onclick="GLXMAP.group('${id}')">👥 Plan hier een groepsdate</button>`);
  }
  function busyLabel(v) {
    let n = 0; venues.forEach(o => { if (o.kind === 'night' && dist(v.lat, v.lng, o.lat, o.lng) < 350) n++ });
    const h = new Date().getHours(), night = h >= 20 || h < 4;
    if (n >= 12 && night) return '🔥 <b>Waarschijnlijk druk nu</b> <span class="sub">(verwacht)</span>';
    if (n >= 6) return night ? '🔥 Gezellig druk verwacht' : '🌙 Wordt vanavond druk';
    return '';
  }
  /* wie zit er (verwacht) in deze zone, per type */
  function mixAt(lat, lng) {
    const c = { student: 0, night: 0, chill: 0 }; venues.forEach(o => { if (c[o.kind] != null && dist(lat, lng, o.lat, o.lng) < 450) c[o.kind] += o.kind === 'student' ? 6 : 1 });
    const h = new Date().getHours(), night = h >= 20 || h < 4;
    const raw = { '🎓 Studenten': c.student * (night ? .6 : 1.4) + c.night * .3, '🍸 Iets luchtigs': c.night * (night ? 1.3 : .4), '💍 Iets serieus': c.chill * .6 + c.night * .2, '☕ Rustig daten': c.chill * (night ? .4 : 1), '🧑‍💼 30+': c.chill * .5 + c.night * .3 };
    if (!window.PLAY_BUILD) raw['🌶️ Spicy'] = c.night * (night ? .5 : .05);
    const tot = Object.values(raw).reduce((a, b) => a + b, 0); if (tot < 1) return null;
    return Object.entries(raw).map(([k, x]) => [k, Math.round(x / tot * 100)]).filter(e => e[1] >= 4).sort((a, b) => b[1] - a[1]);
  }
  function mixHtml(lat, lng) {
    const m = mixAt(lat, lng); if (!m) return '';
    if (!pw().mix) return `<div class="box" style="margin:8px 0">👀 <b>Wie zit hier?</b> Met Plus zie je per zone welk type mensen er vooral is.<br><button class="pill" style="margin-top:6px" onclick="GLXMAP.power()">⚡ Bekijk</button></div>`;
    return `<div style="margin:8px 0"><b>Wie zit hier vooral?</b> <span class="sub">(verwacht)</span>${m.map(([k, p]) => `<div style="display:flex;align-items:center;gap:8px;margin-top:5px;font-size:13px"><span style="width:118px">${k}</span><span style="flex:1;height:7px;border-radius:4px;background:var(--line)"><span style="display:block;height:7px;border-radius:4px;width:${p}%;background:linear-gradient(90deg,#8b5cf6,#ec4899)"></span></span><span style="width:34px;text-align:right">${p}%</span></div>`).join('')}</div>`;
  }
  function openZone(lat, lng) {
    const m = mixAt(lat, lng), ppl = peopleNear(lat, lng, 400), h = new Date().getHours();
    xs('🔥 Deze zone', `${m ? '' : '<p class="sub">Hier zijn weinig uitgaans- of studentenplekken.</p>'}${mixHtml(lat, lng)}
<div class="gmRow"><span>Galaxy-leden hier nu</span><b>${liveAt(lat, lng) ? '🟢 ' + liveAt(lat, lng) + ' live' : ppl.length || 'nog niemand'}</b></div>
${pw().fc ? `<div class="gmRow"><span>Later vanavond</span><b>${h < 21 ? '🔥 drukker verwacht vanaf 22u' : h < 2 ? '🔥 piek nu tot ±2u' : 'rustig'}</b></div>` : `<p class="sub" style="margin-top:6px">Met Gold zie je ook de voorspelling voor later op de avond.</p>`}`);
  }
  function checkin(id, remote) {
    const v = venues.get(id); if (!v) return;
    if (remote) G.remoteDay = today();
    G.checkins = {}; G.checkins[id] = Date.now(); G.nCheck = (G.nCheck || 0) + 1; save(); drawStops(); live.send && live.send({ t: 'checkin', place: id });
    xs('📍 Ingecheckt bij ' + esc(v.n), `<p>Wie hier ook incheckt, ziet de komende 2 uur je profiel. Je exacte locatie blijft verborgen.</p><br><button class="btn" style="width:100%" onclick="closeO('xV')">Top</button>`);
  }
  function checkout(id) { delete G.checkins[id]; save(); drawStops(); live.send && live.send({ t: 'checkout', place: id }); try { closeO('xV') } catch (e) { } T('Uitgecheckt') }

  /* ---------- groepsdates ---------- */
  function group(id) {
    const v = venues.get(id); const d = new Date(); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7)); d.setHours(20, 0, 0, 0);
    const val = new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    xs('👥 Groepsdate plannen', `<p class="sub">Bij <b>${esc(v ? v.n : 'deze plek')}</b>. Iedereen met dezelfde intentie in de buurt kan meedoen. Altijd op een openbare plek.</p>
<label class="sub" style="display:block;margin-top:12px">Wanneer</label><input id="gmGT" type="datetime-local" value="${val}" style="width:100%;padding:10px;border-radius:12px;border:1px solid var(--line);background:var(--card)">
<label class="sub" style="display:block;margin-top:10px">Soort</label><select id="gmGK" style="width:100%;padding:10px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--txt)"><option>🍸 Drankje</option><option>🎓 Studentenavond</option><option>☕ Koffie & wandelen</option><option>🎳 Activiteit</option><option>⚡ Speed date</option></select>
<label class="sub" style="display:block;margin-top:10px">Max. personen</label><select id="gmGN" style="width:100%;padding:10px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--txt)"><option>6</option><option selected>10</option><option>16</option><option>24</option></select>
<br><br><button class="btn" style="width:100%" onclick="GLXMAP.saveGroup('${id}')">Plaats groepsdate</button>`);
  }
  function saveGroup(id) {
    if (!pw().mix && G.groups.filter(x => new Date(x.at) > Date.now()).length >= 1) { closeO('xV'); try { toast('Gratis kun je 1 groepsdate tegelijk plaatsen') } catch (e) { } return openPower() }
    const v = venues.get(id) || {}; const g = { id: 'g' + Date.now(), at: $('gmGT').value, kind: $('gmGK').value, max: +$('gmGN').value, place: v.n || '', lat: v.lat, lng: v.lng };
    G.groups.push(g); save(); closeO('xV');
    xs('👥 Geplaatst!', `<p>${esc(g.kind)} bij <b>${esc(g.place)}</b>, ${new Date(g.at).toLocaleString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.</p><p class="sub" style="margin-top:8px">Deel de link met vrienden. Zodra Galaxy live is, zien leden in de buurt je groepsdate op de kaart.</p><br><button class="btn" style="width:100%" onclick="typeof invite==='function'&&invite()">🔗 Deel</button>`);
  }
  function groupsList() {
    const up = G.groups.filter(g => new Date(g.at) > Date.now() - 3 * 3600e3).sort((a, b) => new Date(a.at) - new Date(b.at));
    xs('👥 Groepsdates', `<p class="sub">Spreek met een groep af op een Galaxy-stop of Hotspot. Tik op een stop op de kaart en kies "Plan hier een groepsdate".</p><br>` +
      (up.length ? up.map(g => `<div class="gmRow"><span>${esc(g.kind)}<br><small class="sub">${esc(g.place)} · max ${g.max}</small></span><span style="text-align:right">${new Date(g.at).toLocaleString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}<br><button class="pill" onclick="GLXMAP.fly(${g.lng},${g.lat})">Toon</button></span></div>`).join('') : '<p>Nog geen groepsdates gepland.</p>'));
  }

  /* ---------- power-ups ---------- */
  function openPower() {
    const cur = plan(), rows = [['Inchecken binnen', p => p.r + ' m'], ['Wie zit er per zone', p => p.mix ? '✓' : '–'], ['Voorspelling vanavond', p => p.fc ? '✓' : '–'], ['Op afstand inchecken', p => p.remote ? '1/dag' : '–'], ['Groepsdates plaatsen', p => p.mix ? 'onbeperkt' : '1'], ['Rand rond je mannetje', p => p.spot ? 'aura' : p.fc ? 'goud' : '–']];
    const cols = ['free', 'plus', 'gold', 'cosmic'];
    xs('⚡ Power-ups', `<p class="sub">Gratis zie je de drukte en kun je inchecken. Met een abonnement zie je meer en kom je beter in beeld.</p>
<table class="gmPlans"><tr><th></th>${cols.map(c => `<th class="${c === cur || (cur === 'lifetime' && c === 'cosmic') ? 'cur' : ''}">${POWER[c].n}</th>`).join('')}</tr>
${rows.map(([n, f]) => `<tr><td>${n}</td>${cols.map(c => `<td class="${c === cur || (cur === 'lifetime' && c === 'cosmic') ? 'cur' : ''}">${f(POWER[c])}</td>`).join('')}</tr>`).join('')}</table>
<p class="sub">Jij hebt nu: <b>${POWER[cur].n}</b>. ${POWER[cur].see}.</p>
<p class="sub" style="margin-top:6px">🛡️ Geen enkel abonnement toont waar iemand precies is. Mensen staan altijd in een zone van ±300 m.</p>
${cur === 'cosmic' || cur === 'lifetime' ? '' : `<br><button class="btn" style="width:100%" onclick="closeO('xV');typeof openPlans==='function'&&openPlans()">✨ Upgrade</button>`}`);
  }

  /* ---------- modus, intentie, 3D, locatie, zoeken ---------- */
  function setMode(m) {
    if (m === 'groups') return groupsList();
    mode = m; document.querySelectorAll('.gmChips button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
    document.querySelector('.gmIntents').classList.toggle('on', m === 'heat');
    if (map && m === 'heat' && map.getZoom() > 16) map.easeTo({ zoom: 14.5, pitch: 40 });
    drawStops(); drawHeat(); drawPeople(); bar();
  }
  function setIntent(i) {
    if (i === 'spicy' && window.PLAY_BUILD) i = 'night';
    intent = i; document.querySelectorAll('.gmIntents button').forEach(b => b.classList.toggle('on', b.dataset.i === i)); drawHeat(); bar();
  }
  function toggle3d() { pitched = !pitched; map && map.easeTo({ pitch: pitched ? 55 : 0, bearing: pitched ? -12 : 0, duration: 700 }); $('gm3d').textContent = pitched ? '3D' : '2D' }
  /* ---------- jij op de kaart: je eigen 3D-mannetje ---------- */
  let meMarker, lastPos = null, walkT;
  function meEl() {
    const el = document.createElement('div'); el.className = 'gmAv me' + (pw().spot ? ' aura' : pw().fc ? ' goud' : '');
    const src = window.GLXAV && GLXAV.image(); el.innerHTML = src ? `<img src="${src}" alt="">` : '<div class="gmMe"></div>';
    el.onclick = () => window.GLXAV ? GLXAV.open() : null; return el;
  }
  let av3d = null, av3dLoading = false, heading = 0, follow = false;
  /* ---------- niet tijdens het rijden ----------
     Sneller dan ±30 km/u: scherm op slot, tenzij je bevestigt dat je passagier bent (1 uur geldig).
     Boven ±16 km/u tellen stappen niet mee. */
  let curSpeed = 0, fastN = 0, slowN = 0;
  const passenger = () => { try { return Date.now() - (+sessionStorage.glxPass || 0) < 3600e3 } catch (e) { return false } };
  function speedCheck(sp) {
    curSpeed = sp || 0;
    if (curSpeed > 8.3) { fastN++; slowN = 0 } else { slowN++; if (slowN >= 3) fastN = 0 }
    const lock = document.getElementById('gmDrive');
    if (fastN >= 2 && !passenger()) {
      if (!lock) document.body.insertAdjacentHTML('beforeend', `<div id="gmDrive" role="alertdialog" aria-label="Niet gebruiken tijdens het rijden" style="position:fixed;inset:0;z-index:500;background:rgba(8,6,24,.96);display:grid;place-items:center;padding:24px;text-align:center"><div style="max-width:340px"><div style="font-size:64px">🚗</div><h2 style="margin:8px 0">Je beweegt te snel</h2><p class="sub" style="font-size:15px">Gebruik Galaxy niet terwijl je rijdt of fietst. Hou je ogen op de weg.</p><button class="btn" style="width:100%;margin-top:18px" onclick="GLXMAP.passenger()">Ik ben passagier</button><p class="sub" style="margin-top:12px;font-size:12px">Dit scherm verdwijnt vanzelf als je stilstaat. Stappen tellen niet mee in een voertuig.</p></div></div>`);
    } else if (lock && (fastN === 0 || passenger())) lock.remove();
  }

  function onMe() {
    if (!map || !me) return;
    if (!meMarker) {
      meMarker = new maplibregl.Marker({ element: meEl(), anchor: 'bottom' }).setLngLat([me.lng, me.lat]).addTo(map);
      // echt 3D-mannetje dat meeloopt (als je er een gemaakt hebt)
      if (window.GLXAV && GLXAV.has() && !av3dLoading) { av3dLoading = true; GLXAV.mapAvatar().then(a => { av3d = a; const el = meMarker.getElement(); el.innerHTML = ''; el.appendChild(a.el); el.classList.add('live3d') }).catch(() => { }) }
    } else meMarker.setLngLat([me.lng, me.lat]);
    const moved = lastPos ? dist(lastPos.lat, lastPos.lng, me.lat, me.lng) : 0;
    if (moved > 2.5 && moved < 150 && curSpeed < 4.5) { G.walked = (G.walked || 0) + moved; save() }
    if (follow) map.easeTo({ center: [me.lng, me.lat], duration: 900 });
    if (moved > 2.5) {
      const e = meMarker.getElement(), dy = me.lat - lastPos.lat, dx = (me.lng - lastPos.lng) * Math.cos(me.lat * Math.PI / 180);
      heading = Math.atan2(dx, dy); // 0 = noord
      if (av3d) { av3d.setWalking(true); av3d.setHeading(-(heading - map.getBearing() * Math.PI / 180) + Math.PI) } else { e.classList.add('walk'); e.classList.toggle('left', dx < 0) }
      clearTimeout(walkT); walkT = setTimeout(() => { e.classList.remove('walk'); av3d && av3d.setWalking(false) }, 2500);
    }
    lastPos = { lat: me.lat, lng: me.lng };
    if (map.getSource('range')) map.getSource('range').setData(fc([circle(me.lng, me.lat, pw().r)]));
    drawPeople(); bar(); if (!localStorage.glxGhost) live.send({ t: 'pos', lat: me.lat, lng: me.lng });
  }
  window.addEventListener('glx-avatar', () => { if (meMarker && !av3d) { meMarker.remove(); meMarker = null; onMe() } });
  function locate(silent) {
    if (!navigator.geolocation) return T('Je toestel ondersteunt geen locatie');
    try { closeO('xV') } catch (e) { }
    follow = true;
    if (watchId != null) { if (me && map) map.flyTo({ center: [me.lng, me.lat], zoom: Math.max(map.getZoom(), 17.6), pitch: 68 }); return }
    let first = true;
    watchId = navigator.geolocation.watchPosition(p => {
      const prev = me, now = Date.now();
      me = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, t: now };
      let sp = p.coords.speed; if (sp == null || isNaN(sp)) sp = prev && now > prev.t ? dist(prev.lat, prev.lng, me.lat, me.lng) / ((now - prev.t) / 1000) : 0;
      speedCheck(sp);
      if (!map) return;
      if (first && !silent) map.flyTo({ center: [me.lng, me.lat], zoom: 17.6, pitch: 68 }); first = false;
      onMe();
    }, e => { watchId = null; if (!silent) T(e.code === 1 ? '📍 Locatie geweigerd. Zet ze aan in je instellingen.' : '📍 Locatie niet gevonden') }, { enableHighAccuracy: true, maximumAge: 5e3, timeout: 20e3 });
  }

  /* ---------- mensen in de buurt (live via de backend) ----------
     Veiligheid: andere leden staan NOOIT op hun exacte plek. Ze worden in een
     zone van ±300 m gezet (vast raster) en alleen getoond als ze zichtbaar staan.
     Exacte live locatie alleen tussen twee matches die het allebei aanzetten. */
  const ZONE = 0.003;
  const live = window.GLXLIVE = window.GLXLIVE || { people: [], send() { }, on: null };
  live.on = () => { drawPeople(); bar() };
  /* live drukte: echte aantallen van de server (zones vanaf 3 leden, check-ins per plek) */
  let bMarkers = [];
  function drawBusy() {
    bMarkers.forEach(m => m.remove()); bMarkers = [];
    const b = live.busy; if (!map || !b || map.getZoom() < 12) return;
    (b.zones || []).forEach(z => {
      const el = document.createElement('div'); el.className = 'gmLive'; el.innerHTML = `<i></i><b>${z.n}</b> nu`; el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', z.n + ' leden nu in deze zone');
      el.onclick = e => xs('🟢 Live drukte', `<p><b>${z.n} leden</b> zijn nu in deze zone (±300 m).</p><p class="sub" style="margin-top:8px">Dit getal is live en ververst elke 15 seconden. Je ziet alleen het aantal. Wie er zit, zie je pas na 15 minuten: zo kan niemand een ander live volgen.</p>`);
      hush(el); bMarkers.push(new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([z.lng, z.lat]).addTo(map));
    });
    if (map.getZoom() >= 13.5) Object.keys(b.places || {}).forEach(id => {
      const v = venues.get(id), n = b.places[id]; if (!v || !n) return;
      const el = document.createElement('div'); el.className = 'gmLive pl'; el.innerHTML = `📍<b>${n}</b>`; el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', n + ' ingecheckt bij ' + (v.n || 'deze plek'));
      el.onclick = () => xs('📍 ' + esc(v.n || 'Plek'), `<p><b>${n}</b> ${n === 1 ? 'lid is' : 'leden zijn'} hier de laatste 2 uur ingecheckt.</p><p class="sub" style="margin-top:8px">Live getal. Check zelf in om te zien wie er is.</p>`);
      hush(el); bMarkers.push(new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -18] }).setLngLat([v.lng, v.lat]).addTo(map));
    });
  }
  function liveAt(lat, lng) { const b = live.busy; let n = 0; if (b && b.zones) b.zones.forEach(z => { if (dist(lat, lng, z.lat, z.lng) <= 350) n += z.n }); return n }
  function hush(el) { ['pointerdown', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'dblclick'].forEach(k => el.addEventListener(k, e => e.stopPropagation())) }
  function liveCount() { const b = live.busy; if (!b || !b.ok || !map) return null; const bb = map.getBounds(); let n = 0; (b.zones || []).forEach(z => { if (bb.contains([z.lng, z.lat])) n += z.n }); return n }
  const snap = (lat, lng) => [(Math.floor(lat / ZONE) + .5) * ZONE, (Math.floor(lng / (ZONE * 1.5)) + .5) * ZONE * 1.5];
  const blocked = id => window.S && S.blocked && S.blocked.includes(id);
  function visible() { return (live.people || []).filter(p => p && p.zone && !blocked(p.id) && p.online !== false) }
  function peopleNear(lat, lng, r) { return visible().filter(p => dist(lat, lng, p.zone[0], p.zone[1]) <= r) }
  function peopleInView() { if (!map) return 0; const b = map.getBounds(); return visible().filter(p => b.contains([p.zone[1], p.zone[0]])).length }
  let pMarkers = [];
  function drawPeople() {
    drawBusy();
    pMarkers.forEach(m => m.remove()); pMarkers = [];
    if (!map || map.getZoom() < 12) return;
    const groups = {}; visible().forEach(p => { const z = snap(p.zone[0], p.zone[1]), k = z.join(); (groups[k] = groups[k] || { z, list: [] }).list.push(p) });
    Object.values(groups).forEach(g => {
      const el = document.createElement('div'); el.className = 'gmAv' + (g.list.length > 1 ? ' group' : '');
      const top = g.list.slice(0, 3).map(p => p.img ? `<img src="${esc(p.img)}" alt="">` : '<b>🧑</b>').join('');
      el.innerHTML = `<div class="stack">${top}</div>${g.list.length > 1 ? `<i>${g.list.length}</i>` : ''}<span class="dot"></span>`;
      el.onclick = () => openPeople(g.list);
      pMarkers.push(new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([g.z[1], g.z[0]]).addTo(map));
    });
  }
  function openPeople(list) {
    xs('👥 In deze zone', list.map(p => `<div class="gmRow"><span style="display:flex;gap:10px;align-items:center">${p.img ? `<img src="${esc(p.img)}" style="width:44px;height:44px;border-radius:12px;background:var(--card2)">` : '🧑'}<span><b>${esc(p.name || 'Galaxy-lid')}</b>${p.age ? ', ' + p.age : ''}<br><small class="sub">${esc(p.intent || '')} · ± ${me ? Math.max(100, Math.round(dist(me.lat, me.lng, p.zone[0], p.zone[1]) / 100) * 100) + ' m' : 'in de buurt'}</small></span></span><button class="pill" onclick="typeof openProfile==='function'&&openProfile('${esc(p.id)}')">Bekijk</button></div>`).join('') +
      '<p class="sub" style="margin-top:8px">🛡️ Leden staan in een zone van ±300 m, nooit op hun exacte plek.</p>');
  }

  async function search(q, go) {
    const res = $('gmRes'); if (!q || q.length < 2) { res.style.display = 'none'; return }
    const loc = (window.PLACES || []).filter(p => p[0].toLowerCase().startsWith(q.toLowerCase())).slice(0, 4).map(p => ({ n: p[0], d: 'België / Nederland', lat: p[1] / 1000, lng: p[2] / 1000, z: 14 }));
    render(loc);
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=nl&q=' + encodeURIComponent(q));
      const j = await r.json();
      const glob = j.map(x => ({ n: x.name || x.display_name.split(',')[0], d: x.display_name.split(',').slice(1, 4).join(',').trim(), lat: +x.lat, lng: +x.lon, z: /city|town|administrative/.test(x.type + x.addresstype) ? 13 : /village|suburb/.test(x.type + x.addresstype) ? 14.5 : 17 }));
      const all = loc.concat(glob.filter(g => !loc.some(l => l.n === g.n))).slice(0, 8); render(all);
      if (go && all[0]) pick(all[0]);
    } catch (e) { }
    function render(list) {
      if (!list.length) { res.style.display = 'none'; return }
      res.innerHTML = list.map((p, i) => `<button data-i="${i}">${esc(p.n)}<small>${esc(p.d)}</small></button>`).join(''); res.style.display = 'block';
      res.querySelectorAll('button').forEach(b => b.onclick = () => pick(list[+b.dataset.i]));
    }
    function pick(p) { res.style.display = 'none'; $('gmQ').value = p.n; $('gmQ').blur(); map && map.flyTo({ center: [p.lng, p.lat], zoom: p.z, pitch: p.z >= 15 ? 55 : 35, speed: 1.6 }) }
  }
  function bar() {
    const e = $('gmBar'); if (!e || !map) return; const z = map.getZoom();
    const n = peopleInView();
    if (z < 13.5) { e.innerHTML = '🔍 Zoom in op een stad of buurt om drukte, plekken en mensen te zien'; return }
    const ppl = n ? `👥 <b>${n}</b> ${n === 1 ? 'lid' : 'leden'} in beeld` : '👥 Nog niemand in de buurt';
    if (!me) { e.innerHTML = `${ppl} · 📍 <button onclick="GLXMAP.locate()">Zet locatie aan</button>`; return }
    if (mode === 'heat') { const lc = liveCount(); e.innerHTML = `<span>${lc ? `🟢 <b>${lc}</b> leden nu live in beeld` : lc === 0 ? '🟢 Live: nog te weinig leden hier. Je ziet de verwachte drukte.' : ppl}${n ? ' · Tik op een poppetje om te zien wie er zit' : ''}${loading ? ' · laden…' : ''}</span>`; return }
    let s = 0; venues.forEach(v => { if (isStop(v) && v.n && inView(v)) s++ });
    e.innerHTML = `${ppl} · 📍 <b>${s}</b> plekken${loading ? ' · laden…' : ''} <button onclick="GLXMAP.legend()">Kleuren</button>`;
  }

  /* ---------- koppelen aan de app ---------- */
  window.GLXMAP = { legend: () => xs('📍 Soorten plekken', Object.values(CAT).map(c => `<div class="gmRow"><span><span style="color:${c[0]}">●</span> ${c[1]} ${c[2]}</span></div>`).join('') + '<p class="sub" style="margin-top:8px">Cafés en restaurants verschijnen als je inzoomt tot op straatniveau.</p>'), locate: () => locate(), checkin, checkout, group, avatar: () => openAvatar(), saveGroup, fly: (lng, lat) => { try { closeO('xV') } catch (e) { } map && map.flyTo({ center: [lng, lat], zoom: 17, pitch: 55 }) }, power: openPower, state: G, _venues: venues, _me: () => me, _center: () => { const c = map && map.getCenter(); return c ? { lat: c.lat, lng: c.lng } : null }, passenger() { try { sessionStorage.glxPass = Date.now() } catch (e) { } const l = document.getElementById('gmDrive'); if (l) l.remove(); T('👍 Veilige rit. Als passagier kun je verder.') }, _speed: speedCheck, _setMe: (lat, lng) => { me = { lat, lng }; onMe() } };
  const og = window.go;
  /* Galaxy is een live kaart-app: geen swipen meer, de kaart is het startscherm */
  window.go = function (v) { if (v === 'discover') v = 'map'; const r = og.call(this, v); if (v === 'map') setTimeout(init, 30); return r };
  const boot = () => { const st = document.createElement('style'); st.textContent = '#v-discover,#nav [data-v="discover"]{display:none!important}#nav{grid-template-columns:repeat(3,1fr)!important}'; document.head.appendChild(st); const b = document.querySelector('#nav [data-v="map"]'); if (b) b.innerHTML = '<span>🌍</span>Live'; window.go('map') };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
