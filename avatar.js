/* =====================================================================
   Galaxy 3D-mannetje — echte 3D-figuren met skelet en animaties
   - Modellen: "Ultimate Modular Men/Women" van Quaternius (CC0, publiek domein), in /models
   - Animaties uit het model zelf: stilstaan, wandelen, zwaaien
   - Personaliseren: stijl kiezen, huid, haar en kleuren van de kleren
   - Op de kaart loopt je mannetje live mee in je looprichting
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'glxAvatar', IMG = 'glxAvatarImg', BASE = 'models/';
  const THREE_URL = 'https://unpkg.com/three@0.160.0/';
  let THREE, GLTFLoader, cloneSkinned;

  /* stijl -> bestand, materialen voor haar en per kledingstuk */
  const MODELS = {
    m_casual: { f: 'Male_Casual_2', n: 'Casual', hair: ['Hair', 'Eyebrows'], parts: [['T-shirt', 'LightBrown'], ['Broek', 'LightBlue'], ['Schoenen', 'Red_Dark']] },
    f_casual: { f: 'Female_Casual', n: 'Casual', hair: ['Hair_Blond', 'Hair_Brown'], parts: [['Top', 'White'], ['Broek', 'Orange'], ['Schoenen', 'Grey']] },
    m_hoodie: { f: 'Male_Casual_Hoodie', n: 'Hoodie', hair: ['Hair', 'Eyebrows'], parts: [['Hoodie', 'Purple'], ['Short', 'LightBlue'], ['Schoenen', 'White']] },
    f_formal: { f: 'Female_Formal', n: 'Jurk', hair: ['Red'], hairLbl: 'Haar en schoenen', parts: [['Jurk', 'LimeGreen'], ['Riem', 'Gold']] },
    m_suit: { f: 'Male_Suit', n: 'Pak', hair: ['Hair', 'Eyebrows'], parts: [['Broek', 'Suit'], ['Das', 'Tie'], ['Hemd', 'White']] },
    f_suit: { f: 'Female_Suit', n: 'Pak', hair: ['Hair_Blond', 'Hair_Brown'], parts: [['Pak', 'Black'], ['Hemd', 'White']] },
    m_beach: { f: 'Male_Beach', n: 'Zomer', hair: ['Hair', 'Eyebrows'], parts: [['Top', 'LightBrown'], ['Short', 'Red_Dark']] },
    f_punk: { f: 'Female_Punk', n: 'Punk', hair: ['Pink'], hairLbl: 'Haar en top', parts: [['Broek', 'Black'], ['Schoenen', 'Grey']] },
    m_punk: { f: 'Male_Punk', n: 'Punk', hair: ['Red', 'Red_Dark'], parts: [['Top', 'White'], ['Vest', 'Black'], ['Broek', 'LightBlue']] }
  };
  const SKIN = ['#f8d9c4', '#f1c7a5', '#e0ac85', '#c98f66', '#a56f48', '#7d4f30', '#5a3620', '#3b2314'];
  const HAIRC = ['#17120f', '#3a2618', '#6b4226', '#a8703a', '#d8b46a', '#f2e3b0', '#b8402a', '#8e9099', '#f5f5f5', '#ec4899', '#3b82f6', '#22c55e', '#8b5cf6'];
  const CLOTH = ['#f8fafc', '#cbd5e1', '#64748b', '#1f2937', '#0b0a1f', '#ef4444', '#f97316', '#fbbf24', '#84cc16', '#16a34a', '#14b8a6', '#38bdf8', '#2563eb', '#8b5cf6', '#ec4899', '#9d174d', '#92400e', '#d6b48a'];
  const DEF = { model: 'm_casual', skin: null, hair: null, parts: {} };
  function load() { try { const a = JSON.parse(localStorage[KEY] || 'null'); if (a && MODELS[a.model]) return { model: a.model, skin: a.skin || null, hair: a.hair || null, parts: a.parts || {} } } catch (e) { } return JSON.parse(JSON.stringify(DEF)) }
  function has() { try { return !!localStorage[KEY] } catch (e) { return false } }
  let A = load();

  /* ===================== 3D laden ===================== */
  async function lib() {
    if (THREE) return;
    if (!document.querySelector('script[type="importmap"]')) { const s = document.createElement('script'); s.type = 'importmap'; s.textContent = JSON.stringify({ imports: { three: THREE_URL + 'build/three.module.js', 'three/addons/': THREE_URL + 'examples/jsm/' } }); document.head.appendChild(s) }
    const T = await import('three'), L = await import('three/addons/loaders/GLTFLoader.js'), U = await import('three/addons/utils/SkeletonUtils.js');
    THREE = T; GLTFLoader = L.GLTFLoader; cloneSkinned = U.clone;
  }
  const cache = new Map();
  function gltf(file) { if (!cache.has(file)) { const p = new GLTFLoader().loadAsync(BASE + file + '.glb'); p.catch(() => cache.delete(file)); cache.set(file, p) } return cache.get(file) }

  /* een figuur maken uit een instelling */
  async function figure(cfg) {
    await lib(); const M = MODELS[cfg.model] || MODELS[DEF.model], g = await gltf(M.f);
    const root = cloneSkinned(g.scene), mats = {};
    root.traverse(o => {
      if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false;
      const one = m => { if (!mats[m.name]) { mats[m.name] = m.clone(); mats[m.name].userData.base = m.color.getHex(); mats[m.name].roughness = Math.max(.55, m.roughness); mats[m.name].metalness = 0 } return mats[m.name] };
      o.material = Array.isArray(o.material) ? o.material.map(one) : one(o.material);
    });
    /* op de grond zetten en op 1,7 hoog schalen (gemeten op het skelet) */
    root.updateMatrixWorld(true); const box = new THREE.Box3(), v = new THREE.Vector3(); root.traverse(o => { if (o.isBone) box.expandByPoint(o.getWorldPosition(v)) });
    const h = (box.max.y - Math.min(0, box.min.y)) * 1.1 || 1.7, k = 1.7 / h, wrap = new THREE.Group(); root.scale.multiplyScalar(k); root.position.y = -Math.min(0, box.min.y) * k; wrap.add(root);
    const mixer = new THREE.AnimationMixer(root), acts = {}; g.animations.forEach(c => { if (/^(Idle|Walk|Wave|Run)$/.test(c.name)) acts[c.name] = mixer.clipAction(c) });
    let cur = null;
    const fig = {
      root: wrap, mixer, model: cfg.model,
      play(n, once) { const a = acts[n] || acts.Idle; if (!a || a === cur) return; a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = !!once; a.fadeIn(.25).play(); if (cur) cur.fadeOut(.25); cur = a },
      tint(c) {
        const set = (names, hex) => names.forEach(n => { const m = mats[n]; if (m) m.color.set(hex == null ? m.userData.base : hex) });
        set(['Skin'], c.skin); if (mats.Skin_Darker) { if (c.skin) mats.Skin_Darker.color.set(c.skin).multiplyScalar(.8); else mats.Skin_Darker.color.set(mats.Skin_Darker.userData.base) }
        set(M.hair, c.hair); M.parts.forEach(([, mat]) => set([mat], (c.parts || {})[mat]));
      }
    };
    fig.tint(cfg); fig.play('Idle'); mixer.update(0); return fig;
  }

  function makeScene(transparent) {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#3a2a66', 1.5));
    const key = new THREE.DirectionalLight('#fff4ea', 2.0); key.position.set(2.5, 4, 3.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = .5; key.shadow.camera.far = 12; scene.add(key);
    const rim1 = new THREE.DirectionalLight('#ff5fb4', .9); rim1.position.set(-3, 2.5, -2.5); scene.add(rim1);
    const rim2 = new THREE.DirectionalLight('#38d4f0', .7); rim2.position.set(3, 1.5, -3); scene.add(rim2);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(transparent ? .45 : .8, 48), new THREE.ShadowMaterial({ opacity: .4 })); sh.rotation.x = -Math.PI / 2; sh.receiveShadow = true; scene.add(sh);
    if (!transparent) { const ring = new THREE.Mesh(new THREE.RingGeometry(.62, .7, 64), new THREE.MeshBasicMaterial({ color: '#a78bfa', transparent: true, opacity: .45 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .002; scene.add(ring) }
    return scene;
  }
  function newRenderer(w, h, keep) { const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!keep }); r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.setSize(w, h, false); r.outputColorSpace = THREE.SRGBColorSpace; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; return r }

  /* ===================== maker-scherm ===================== */
  let renderer, scene, cam, fig, raf, spin = -0.4, drag = null, previewWalk = false, waveT = 0, busy = 0;
  const CSS = `
#avV .sheet{max-height:94vh}
#avStage{position:relative;height:330px;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 50% 78%,#4a2392 0%,#1a0f3f 45%,#0a0820 75%);touch-action:none;cursor:grab}
#avStage canvas{width:100%!important;height:100%!important;display:block}
#avStage .hint{position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:11px;color:#bfb8ef;pointer-events:none}
#avStage .acts{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:6px}
#avStage .acts button{padding:6px 10px;border-radius:10px;background:rgba(14,11,38,.75);border:1px solid rgba(167,139,250,.4);font-size:12px}
#avStage .acts button.on{background:linear-gradient(135deg,#8b5cf6,#ec4899)}
#avMsg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:30px;color:#d9d4ff;font-size:14px;pointer-events:none}
#avTabs{display:flex;gap:6px;overflow-x:auto;margin:12px 0 8px;scrollbar-width:none}#avTabs::-webkit-scrollbar{display:none}
#avTabs button{flex:none;padding:7px 12px;border-radius:999px;background:var(--card2);border:1px solid var(--line);font-size:13px}
#avTabs button.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent}
.avOpts{display:flex;flex-wrap:wrap;gap:7px;margin:6px 0 10px}
.avOpts button{padding:8px 12px;border-radius:12px;background:var(--card2);border:1px solid var(--line);font-size:13px}
.avOpts button.on{border-color:#ec4899;box-shadow:0 0 0 2px rgba(236,72,153,.35)}
.avSw{width:32px;height:32px;border-radius:50%;border:2px solid rgba(255,255,255,.15);padding:0!important}
.avSw.on{border-color:#fff!important;box-shadow:0 0 0 3px #ec4899!important}
.avSw.std{background:conic-gradient(#888,#ddd,#888)!important;font-size:10px;color:#111}
.avLbl{font-size:12px;color:var(--mut);margin-top:6px}`;
  const TABS = [['stijl', '🧍 Stijl'], ['huid', '🎨 Huid'], ['haar', '💇 Haar'], ['kleren', '👕 Kleren']];
  let tab = 'stijl';
  function ensureDom() {
    if ($('avV')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend', `<div class="ov" id="avV"><div class="sheet"><div style="display:flex;align-items:center;margin-bottom:10px"><h3 style="flex:1">🧍 Mijn mannetje</h3><button class="ico" onclick="GLXAV.close()">✖️</button></div>
<div id="avStage"><div id="avMsg">Mannetje laden…</div><div class="acts"><button id="avWalk">🚶 Wandel</button><button id="avWave">👋 Zwaai</button></div><div class="hint">Sleep om te draaien</div></div><div id="avTabs"></div><div id="avPanel"></div>
<div style="display:flex;gap:8px;margin-top:10px"><button class="btn ghost" style="flex:1" onclick="GLXAV.random()">🎲 Willekeurig</button><button class="btn" style="flex:2" onclick="GLXAV.save()">✅ Opslaan</button></div></div></div>`);
    $('avTabs').innerHTML = TABS.map(([k, n]) => `<button data-t="${k}">${n}</button>`).join('');
    $('avTabs').querySelectorAll('button').forEach(b => b.onclick = () => { tab = b.dataset.t; panel() });
    $('avWalk').onclick = () => { previewWalk = !previewWalk; $('avWalk').classList.toggle('on', previewWalk); if (fig) fig.play(previewWalk ? 'Walk' : 'Idle') };
    $('avWave').onclick = () => { if (!fig) return; waveT = performance.now() + 2200; fig.play('Wave') };
    const stg = $('avStage');
    stg.addEventListener('pointerdown', e => { if (e.target.closest('.acts')) return; drag = { x: e.clientX, s: spin }; stg.setPointerCapture(e.pointerId) });
    stg.addEventListener('pointermove', e => { if (drag) spin = drag.s + (e.clientX - drag.x) / 70 });
    stg.addEventListener('pointerup', () => drag = null);
  }
  const sw = (fn, cur, cols) => `<div class="avOpts"><button class="avSw std ${cur == null ? 'on' : ''}" title="Standaard" onclick="GLXAV.${fn}(null)">↺</button>${cols.map(c => `<button class="avSw ${cur === c ? 'on' : ''}" style="background:${c}" aria-label="kleur ${c}" onclick="GLXAV.${fn}('${c}')"></button>`).join('')}</div>`;
  function panel() {
    const M = MODELS[A.model]; $('avTabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    let h = '';
    if (tab === 'stijl') h = `<div class="avOpts">${Object.entries(MODELS).map(([k, m]) => `<button class="${A.model === k ? 'on' : ''}" onclick="GLXAV.set('model','${k}')">${k[0] === 'f' ? '👩' : '👨'} ${m.n}</button>`).join('')}</div><p class="avLbl">Kies een stijl. Daarna pas je huid, haar en kleuren aan.</p>`;
    if (tab === 'huid') h = `<div class="avLbl">Huidskleur</div>${sw("set.bind(null,'skin')", A.skin, SKIN)}`;
    if (tab === 'haar') h = `<div class="avLbl">${M.hairLbl || 'Haarkleur'}</div>${sw("set.bind(null,'hair')", A.hair, HAIRC)}`;
    if (tab === 'kleren') h = M.parts.map(([n, mat]) => `<div class="avLbl">${n}</div>${sw(`part.bind(null,'${mat}')`, (A.parts || {})[mat] || null, CLOTH)}`).join('');
    $('avPanel').innerHTML = h;
  }
  async function rebuild() {
    const my = ++busy, msg = $('avMsg'); if (msg) { msg.style.display = ''; msg.textContent = 'Mannetje laden…' }
    try {
      const f = await figure(A); if (my !== busy) return;
      if (fig) scene.remove(fig.root); fig = f; scene.add(f.root); f.play(previewWalk ? 'Walk' : 'Idle'); if (msg) msg.style.display = 'none';
    } catch (e) { if (my === busy && msg) { msg.style.display = ''; msg.textContent = '⚠️ Het mannetje kon niet laden. Controleer je internet en probeer opnieuw.' } throw e }
  }
  async function start() {
    await lib();
    if (!renderer) { renderer = newRenderer(340, 330, true); scene = makeScene(false); cam = new THREE.PerspectiveCamera(28, 1, .1, 50) }
    const stg = $('avStage'); if (renderer.domElement.parentNode !== stg) stg.prepend(renderer.domElement);
    const fit = () => { const w = stg.clientWidth || 340, h = stg.clientHeight || 330; if (renderer.domElement.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() } };
    fit(); cancelAnimationFrame(raf); let last = performance.now();
    const loop = now => {
      if (!$('avV').classList.contains('on')) return; const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (fig) { if (!drag && !previewWalk) spin += .003; fig.root.rotation.y = spin; if (waveT && now > waveT) { waveT = 0; fig.play(previewWalk ? 'Walk' : 'Idle') } fig.mixer.update(dt) }
      cam.position.set(0, 1.0, 5.4); cam.lookAt(0, .86, 0); fit(); renderer.render(scene, cam); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    if (!fig || fig.model !== A.model) await rebuild(); else fig.tint(A);
  }
  function snapshot() {
    if (!renderer || !fig) return null;
    try {
      const sc = makeScene(true), r = newRenderer(256, 256, true), c = new THREE.PerspectiveCamera(26, 1, .1, 50), old = fig.root.rotation.y, par = fig.root.parent;
      r.setPixelRatio(1); r.setSize(256, 256, false); sc.add(fig.root); fig.root.rotation.y = .35; c.position.set(0, .98, 5.1); c.lookAt(0, .86, 0);
      r.render(sc, c); const url = r.domElement.toDataURL('image/png'); fig.root.rotation.y = old; if (par) par.add(fig.root); r.dispose(); return url;
    } catch (e) { return null }
  }

  /* ===================== mannetje op de kaart (live, geanimeerd) ===================== */
  let mapR, mapScene, mapCam, mapFig, mapRaf, mapState = { walk: false, heading: 0, cur: 0 }, mapBusy = 0;
  async function mapRebuild() { const my = ++mapBusy, f = await figure(A); if (my !== mapBusy) return; if (mapFig) mapScene.remove(mapFig.root); mapFig = f; mapScene.add(f.root); f.play(mapState.walk ? 'Walk' : 'Idle') }
  async function mapAvatar() {
    await lib();
    if (!mapR) { mapR = newRenderer(130, 190, false); mapScene = makeScene(true); mapCam = new THREE.PerspectiveCamera(22, 130 / 190, .1, 50); mapR.domElement.style.cssText = 'width:130px;height:190px;display:block;pointer-events:none' }
    await mapRebuild();
    cancelAnimationFrame(mapRaf); let last = performance.now();
    const loop = now => {
      const dt = Math.min(.1, (now - last) / 1000), s = mapState; last = now;
      let d = s.heading - s.cur; d = Math.atan2(Math.sin(d), Math.cos(d)); s.cur += d * .15;
      if (mapFig) { mapFig.root.rotation.y = s.walk ? s.cur : s.cur + Math.sin(now / 3300) * .2; mapFig.mixer.update(dt) }
      mapCam.position.set(0, 3.9, 5.4); mapCam.lookAt(0, .8, 0); mapR.render(mapScene, mapCam); mapRaf = requestAnimationFrame(loop);
    };
    mapRaf = requestAnimationFrame(loop);
    return { el: mapR.domElement, setWalking: w => { w = !!w; if (w !== mapState.walk) { mapState.walk = w; if (mapFig) mapFig.play(w ? 'Walk' : 'Idle') } }, setHeading: rad => mapState.heading = rad };
  }

  const fail = e => { console.error(e); const m = $('avMsg'); if (m) { m.style.display = ''; m.textContent = '⚠️ 3D kon niet laden. Controleer je internet en probeer opnieuw.' } };
  const api = window.GLXAV = {
    open() { ensureDom(); panel(); document.querySelectorAll('.ov.on').forEach(o => o.classList.remove('on')); $('avV').classList.add('on'); start().catch(fail) },
    close() { $('avV').classList.remove('on') },
    set(k, v) { if (k === 'model') { if (!MODELS[v] || v === A.model) return; A = { model: v, skin: A.skin, hair: null, parts: {} }; panel(); rebuild().catch(fail); return } A[k] = v; if (fig) fig.tint(A); panel() },
    part(mat, v) { A.parts = A.parts || {}; if (v == null) delete A.parts[mat]; else A.parts[mat] = v; if (fig) fig.tint(A); panel() },
    random() {
      const r = a => a[Math.floor(Math.random() * a.length)], k = r(Object.keys(MODELS)), parts = {}; MODELS[k].parts.forEach(([, m]) => { if (Math.random() < .7) parts[m] = r(CLOTH) });
      const same = k === A.model; A = { model: k, skin: r(SKIN), hair: r(HAIRC.slice(0, 9)), parts }; panel(); if (same && fig) fig.tint(A); else rebuild().catch(fail);
    },
    save() {
      try { localStorage[KEY] = JSON.stringify(A) } catch (e) { }
      const img = snapshot(); if (img) try { localStorage[IMG] = img } catch (e) { }
      if (window.ME) ME.avatar = A;
      if (mapR) mapRebuild().catch(() => { });
      window.dispatchEvent(new Event('glx-avatar'));
      if (window.GLXLIVE && GLXLIVE.send) GLXLIVE.send({ t: 'avatar', avatar: A });
      api.close(); try { toast('✅ Je mannetje is opgeslagen') } catch (e) { }
    },
    image() { try { return localStorage[IMG] || null } catch (e) { return null } },
    mapAvatar, config: () => A, has, models: MODELS, figure
  };

  function profBtn() {
    const v = $('v-profile'); if (!v) return; const old = $('avProf'); if (old) old.remove();
    const g = (window.GLXMAP && GLXMAP.state) || {}, km = ((g.walked || 0) / 1000).toFixed(1).replace('.', ',');
    const row = (i, t, n) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;font-size:13px"><span>${i} ${t}</span><b>${n}</b></div>`;
    v.insertAdjacentHTML('afterbegin', `<div id="avProf" class="box" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;background:radial-gradient(circle at 22% 60%,rgba(139,92,246,.35),transparent 60%),var(--card)">
<div onclick="GLXAV.open()" style="flex:none;width:120px;height:170px;display:grid;place-items:center;cursor:pointer">${api.image() ? `<img src="${api.image()}" alt="Mijn mannetje" style="width:170px;height:170px;object-fit:contain;margin:0 -25px">` : '<span style="font-size:64px">🧍</span>'}</div>
<div style="flex:1;min-width:0">${row('👟', 'Stappen', Math.round((g.walked || 0) / .75).toLocaleString('nl-BE'))}${row('🚶', 'Gewandeld', km + ' km')}${row('📍', 'Check-ins', g.nCheck || 0)}${row('👥', 'Groepsdates', (g.groups || []).length)}
<button class="btn sm" style="width:100%;margin-top:8px" onclick="GLXAV.open()">👕 ${has() ? 'Stijl' : 'Maak je mannetje'}</button></div></div>`);
  }
  window.addEventListener('glx-avatar', profBtn);
  (function () { const g = window.go; if (typeof g === 'function') window.go = function (v) { const r = g.apply(this, arguments); if (v === 'profile') profBtn(); return r } })();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', profBtn); else profBtn();
})();
