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
    a_anime: { vrm: 'Anime_A', n: 'Anime', g: 'f', hairLbl: 'Haarkleur', parts: [['Top', 'Tops_01_CLOTH'], ['Rok', 'Bottoms_01_CLOTH'], ['Schoenen', 'Shoes_01_CLOTH']], eyes: true },
    m_punk: { f: 'Male_Punk', n: 'Punk', hair: ['Red', 'Red_Dark'], parts: [['Top', 'White'], ['Vest', 'Black'], ['Broek', 'LightBlue']] }
  };
  const SKIN = ['#f8d9c4', '#f1c7a5', '#e0ac85', '#c98f66', '#a56f48', '#7d4f30', '#5a3620', '#3b2314'];
  const HAIRC = ['#17120f', '#3a2618', '#6b4226', '#a8703a', '#d8b46a', '#f2e3b0', '#b8402a', '#8e9099', '#f5f5f5', '#ec4899', '#3b82f6', '#22c55e', '#8b5cf6'];
  const CLOTH = ['#f8fafc', '#cbd5e1', '#64748b', '#1f2937', '#0b0a1f', '#ef4444', '#f97316', '#fbbf24', '#84cc16', '#16a34a', '#14b8a6', '#38bdf8', '#2563eb', '#8b5cf6', '#ec4899', '#9d174d', '#92400e', '#d6b48a'];
  const EYES = ['#3b2314', '#6b4226', '#2563eb', '#38bdf8', '#16a34a', '#8b5cf6', '#ec4899', '#ef4444', '#fbbf24', '#8e9099'];
  const FACES = [['neutral', '🙂 Gewoon'], ['happy', '😄 Blij'], ['relaxed', '😌 Relaxed'], ['surprised', '😮 Verrast'], ['sad', '🥺 Verlegen']];
  const DEF = { model: 'm_casual', skin: null, hair: null, parts: {} };
  function load() { try { const a = JSON.parse(localStorage[KEY] || 'null'); if (a && MODELS[a.model]) return { model: a.model, skin: a.skin || null, hair: a.hair || null, eyes: a.eyes || null, face: a.face || null, parts: a.parts || {} } } catch (e) { } return JSON.parse(JSON.stringify(DEF)) }
  function has() { try { return !!localStorage[KEY] } catch (e) { return false } }
  let A = load();

  /* ===================== 3D laden ===================== */
  async function lib() {
    if (THREE) return;
    if (!document.querySelector('script[type="importmap"]')) { const s = document.createElement('script'); s.type = 'importmap'; s.textContent = JSON.stringify({ imports: { three: THREE_URL + 'build/three.module.js', 'three/addons/': THREE_URL + 'examples/jsm/' } }); document.head.appendChild(s) }
    const T = await import('three'), L = await import('three/addons/loaders/GLTFLoader.js'), U = await import('three/addons/utils/SkeletonUtils.js');
    try { RoomEnv = (await import('three/addons/environments/RoomEnvironment.js')).RoomEnvironment; creased = (await import('three/addons/utils/BufferGeometryUtils.js')).toCreasedNormals } catch (e) { }
    THREE = T; GLTFLoader = L.GLTFLoader; cloneSkinned = U.clone;
  }
  let RoomEnv = null, creased = null, VRMmod = null;
  async function vrmLib() { await lib(); if (!VRMmod) VRMmod = await import(new URL('vendor/three-vrm-3.5.5.module.min.js', location.href).href); return VRMmod }
  const vrmBuf = new Map();
  function vrmData(file) { if (!vrmBuf.has(file)) { const p = fetch(BASE + file + '.vrm').then(r => { if (!r.ok) throw new Error('vrm ' + r.status); return r.arrayBuffer() }); p.catch(() => vrmBuf.delete(file)); vrmBuf.set(file, p) } return vrmBuf.get(file) }

  /* anime-figuur (VRM): eigen skelet, bewegingen met code, knipperen en gezichtjes */
  async function vrmFigure(cfg, M) {
    const V = await vrmLib(), buf = await vrmData(M.vrm), loader = new GLTFLoader();
    loader.register(p => new V.VRMLoaderPlugin(p));
    const g = await new Promise((ok, no) => loader.parse(buf.slice(0), new URL(BASE, location.href).href, ok, no));
    const vrm = g.userData.vrm; V.VRMUtils.removeUnnecessaryVertices(g.scene); V.VRMUtils.combineSkeletons ? V.VRMUtils.combineSkeletons(g.scene) : 0; V.VRMUtils.rotateVRM0(vrm);
    vrm.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false } });
    const mats = {}; vrm.scene.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { const n = (m.name || '').replace(/ \(Outline\)$/, ''); (mats[n] = mats[n] || []).push(m); if (m.color && m.userData.base == null) m.userData.base = m.color.getHex(); if (m.shadeColorFactor && m.userData.shade == null) m.userData.shade = m.shadeColorFactor.getHex() }) });
    const H = vrm.humanoid, bone = n => H.getNormalizedBoneNode(n);
    vrm.scene.updateMatrixWorld(true); const head = bone('head'), v = new THREE.Vector3(); const hh = head ? head.getWorldPosition(v).y + .14 : 1.6;
    const k = 1.62 / hh, wrap = new THREE.Group(); vrm.scene.scale.setScalar(k); wrap.add(vrm.scene);
    let mode = 'Idle', once = 0, t = 0, blinkAt = 1.5, blink = 0;
    const R = (n, x, y, z) => { const b = bone(n); if (b) b.rotation.set(x || 0, y || 0, z || 0) };
    const pose = dt => {
      t += dt; const s = Math.sin, br = s(t * 2) * .02;
      R('spine', br, 0, 0); R('chest', br, 0, 0); R('neck', 0, s(t * .5) * .08, 0);
      if (mode === 'Walk') {
        const w = t * 7, a = s(w) * .55;
        R('leftUpperLeg', a, 0, 0); R('rightUpperLeg', -a, 0, 0); R('leftLowerLeg', Math.max(0, -s(w)) * .9, 0, 0); R('rightLowerLeg', Math.max(0, s(w)) * .9, 0, 0);
        R('leftUpperArm', -a * .6, 0, -1.2); R('rightUpperArm', a * .6, 0, 1.2); R('leftLowerArm', 0, 0, -.2); R('rightLowerArm', 0, 0, .2);
        R('hips', 0, s(w) * .08, 0); vrm.scene.position.y = Math.abs(s(w)) * .03;
      } else {
        ['leftUpperLeg', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg', 'hips'].forEach(n => R(n)); vrm.scene.position.y = 0;
        R('leftUpperArm', 0, 0, -1.22 - s(t * 2) * .02); R('leftLowerArm', 0, 0, -.12);
        if (mode === 'Wave') { R('rightUpperArm', 0, 0, -.2); R('rightLowerArm', 0, -.2 + s(t * 9) * .45, -1.5); R('rightHand', 0, 0, 0) }
        else { R('rightUpperArm', 0, 0, 1.22 + s(t * 2) * .02); R('rightLowerArm', 0, 0, .12) }
      }
      if (once && t > once) { once = 0; mode = 'Idle' }
      const E = vrm.expressionManager;
      if (E) {
        if (t > blinkAt) { blink = .16; blinkAt = t + 2 + Math.random() * 3 } if (blink > 0) blink -= dt;
        E.setValue('blink', blink > 0 ? Math.sin((blink / .16) * Math.PI) : 0);
        const f = mode === 'Wave' ? 'happy' : (cfg.face || 'neutral'); FACES.forEach(([n]) => E.setValue(n, n === f && n !== 'neutral' ? (n === 'sad' ? .55 : .85) : 0));
      }
      vrm.update(dt);
    };
    const fig = {
      root: wrap, model: cfg.model, vrm,
      mixer: { update: pose },
      play(n, o) { mode = n === 'Wave' || n === 'Walk' ? n : 'Idle'; once = o || n === 'Wave' ? t + 2.2 : 0 },
      tint(c) {
        const set = (names, hex) => names.forEach(n => (mats[n] || []).forEach(m => { if (!m.color) return; m.color.set(hex == null ? m.userData.base : hex); if (m.shadeColorFactor) { if (hex == null) m.shadeColorFactor.set(m.userData.shade); else m.shadeColorFactor.set(hex).multiplyScalar(.72) } }));
        set(['Body_00_SKIN', 'Face_00_SKIN'], c.skin); set(['Hair_00_HAIR', 'HairBack_00_HAIR'], c.hair); set(['EyeIris_00_EYE'], c.eyes);
        M.parts.forEach(([, mat]) => set([mat], (c.parts || {})[mat]));
      },
      face(f) { cfg = Object.assign({}, cfg, { face: f }) }
    };
    fig.tint(cfg); pose(0); return fig;
  }
  const cache = new Map();
  function gltf(file) { if (!cache.has(file)) { const p = new GLTFLoader().loadAsync(BASE + file + '.glb'); p.catch(() => cache.delete(file)); cache.set(file, p) } return cache.get(file) }

  /* een figuur maken uit een instelling */
  async function figure(cfg) {
    await lib(); const M = MODELS[cfg.model] || MODELS[DEF.model]; if (M.vrm) return vrmFigure(cfg, M); const g = await gltf(M.f);
    const root = cloneSkinned(g.scene), mats = {};
    root.traverse(o => {
      if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false;
      if (creased && !o.geometry.userData.glxSmooth) { try { const src = o.geometry, g2 = creased(src, Math.PI * .34); g2.userData.glxSmooth = 1; src.userData.glxAlt = g2 } catch (e) { o.geometry.userData.glxSmooth = 1 } }
      if (o.geometry.userData.glxAlt) o.geometry = o.geometry.userData.glxAlt;
      const one = m => { if (!mats[m.name]) { mats[m.name] = m.clone(); mats[m.name].userData.base = m.color.getHex(); const mm = mats[m.name]; mm.flatShading = false; mm.metalness = 0; mm.roughness = /skin/i.test(m.name) ? .62 : /hair|shoe|black|belt/i.test(m.name) ? .5 : .78; mm.envMapIntensity = .55; mm.needsUpdate = true } return mats[m.name] };
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
    scene.add(new THREE.HemisphereLight('#ffffff', '#4a3a7a', RoomEnv ? .55 : 1.5));
    const key = new THREE.DirectionalLight('#fff1e0', RoomEnv ? 2.4 : 2.0); key.position.set(2.2, 4.2, 3.6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = .5; key.shadow.camera.far = 12; key.shadow.radius = 5; key.shadow.bias = -.0004; key.shadow.normalBias = .02; scene.add(key);
    const fill = new THREE.DirectionalLight('#cfd8ff', .5); fill.position.set(-2.5, 1.5, 3); scene.add(fill);
    const rim1 = new THREE.DirectionalLight('#ff5fb4', 1.5); rim1.position.set(-3, 2.5, -2.8); scene.add(rim1);
    const rim2 = new THREE.DirectionalLight('#38d4f0', 1.2); rim2.position.set(3, 1.8, -3); scene.add(rim2);
    scene.userData.env = r => { if (!RoomEnv || scene.environment) return; try { const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnv(), .04).texture; pm.dispose() } catch (e) { } };
    const sh = new THREE.Mesh(new THREE.CircleGeometry(transparent ? .45 : .8, 48), new THREE.ShadowMaterial({ opacity: .4 })); sh.rotation.x = -Math.PI / 2; sh.receiveShadow = true; scene.add(sh);
    if (!transparent) { const ring = new THREE.Mesh(new THREE.RingGeometry(.62, .7, 64), new THREE.MeshBasicMaterial({ color: '#a78bfa', transparent: true, opacity: .45 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .002; scene.add(ring) }
    return scene;
  }
  function newRenderer(w, h, keep) { const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!keep }); r.setPixelRatio(Math.min(3, devicePixelRatio || 1)); r.setSize(w, h, false); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.12; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; return r }

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
  const TABS = [['stijl', '🧍 Stijl'], ['huid', '🎨 Huid'], ['haar', '💇 Haar'], ['kleren', '👕 Kleren'], ['gezicht', '😊 Gezicht']];
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
    if (tab === 'stijl') h = `<div class="avOpts">${Object.entries(MODELS).map(([k, m]) => `<button class="${A.model === k ? 'on' : ''}" onclick="GLXAV.set('model','${k}')">${m.vrm ? '✨' : k[0] === 'f' ? '👩' : '👨'} ${m.n}</button>`).join('')}</div><p class="avLbl">Kies een stijl. Daarna pas je huid, haar en kleuren aan.${M.vrm ? ' ✨ Anime knippert met de ogen en toont gezichtjes.' : ''}</p>`;
    if (tab === 'gezicht') h = M.vrm ? `<div class="avLbl">Gezichtje</div><div class="avOpts">${FACES.map(([f, n]) => `<button class="${(A.face || 'neutral') === f ? 'on' : ''}" onclick="GLXAV.set('face','${f}')">${n}</button>`).join('')}</div><div class="avLbl">Oogkleur</div>${sw("set.bind(null,'eyes')", A.eyes, EYES)}` : `<p class="avLbl">Gezichtjes en oogkleur kan je kiezen bij de stijl ✨ Anime.</p>`;
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
    if (!renderer) { renderer = newRenderer(340, 330, true); scene = makeScene(false); scene.userData.env(renderer); cam = new THREE.PerspectiveCamera(28, 1, .1, 50) }
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
      sc.userData.env(r); r.render(sc, c); const url = r.domElement.toDataURL('image/png'); fig.root.rotation.y = old; if (par) par.add(fig.root); r.dispose(); return url;
    } catch (e) { return null }
  }

  /* ===================== mannetje op de kaart (live, geanimeerd) ===================== */
  let mapR, mapScene, mapCam, mapFig, mapRaf, mapState = { walk: false, heading: 0, cur: 0 }, mapBusy = 0;
  async function mapRebuild() { const my = ++mapBusy, f = await figure(A); if (my !== mapBusy) return; if (mapFig) mapScene.remove(mapFig.root); mapFig = f; mapScene.add(f.root); f.play(mapState.walk ? 'Walk' : 'Idle') }
  async function mapAvatar() {
    await lib();
    if (!mapR) { mapR = newRenderer(130, 190, false); mapScene = makeScene(true); mapScene.userData.env(mapR); mapCam = new THREE.PerspectiveCamera(22, 130 / 190, .1, 50); mapR.domElement.style.cssText = 'width:130px;height:190px;display:block;pointer-events:none' }
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

  /* ===================== figuurtjes van andere leden (foto van hun 3D-figuur) ===================== */
  const thumbs = new Map(); let tq = Promise.resolve(), tR = null, tS = null, tC = null;
  function hashStr(x) { let h = 2166136261; for (let i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
  function defaultFor(seed) {
    const h = hashStr(String(seed || 'x')), keys = ['m_casual', 'f_casual', 'm_hoodie', 'f_formal', 'a_anime', 'm_suit', 'f_suit', 'a_anime'].filter(k => MODELS[k]), pick = (a, n) => a[(h >>> n) % a.length];
    const k = pick(keys, 0), parts = {}; MODELS[k].parts.forEach(([, m], i) => { if ((h >>> (i + 3)) & 1) parts[m] = pick(CLOTH, 5 + i * 3) });
    return { model: k, skin: pick(SKIN, 7), hair: pick(HAIRC.slice(0, 9), 11), eyes: MODELS[k].vrm ? pick(EYES, 13) : null, face: MODELS[k].vrm ? 'happy' : null, parts };
  }
  function clean(cfg, seed) { return cfg && MODELS[cfg.model] ? cfg : defaultFor(seed) }
  function thumb(cfg, seed) {
    cfg = clean(cfg, seed); const key = JSON.stringify(cfg);
    if (thumbs.has(key)) return thumbs.get(key);
    const p = tq = tq.then(async () => {
      await lib();
      if (!tR) { tR = newRenderer(200, 260, true); tR.setPixelRatio(1); tR.setSize(200, 260, false); tS = makeScene(true); tS.userData.env(tR); tC = new THREE.PerspectiveCamera(24, 200 / 260, .1, 50) }
      const f = await figure(cfg); f.root.rotation.y = .3; f.mixer.update(.016); tS.add(f.root);
      tC.position.set(0, .9, 4.6); tC.lookAt(0, .84, 0); tR.render(tS, tC); await new Promise(r => requestAnimationFrame(r)); f.mixer.update(.016); tR.render(tS, tC); const url = tR.domElement.toDataURL('image/png');
      tS.remove(f.root); f.root.traverse(o => { if (o.isMesh && o.geometry && !o.isSkinnedMesh) { } }); return url;
    }).catch(() => null);
    thumbs.set(key, p); return p;
  }

  const fail = e => { console.error(e); const m = $('avMsg'); if (m) { m.style.display = ''; m.textContent = '⚠️ 3D kon niet laden. Controleer je internet en probeer opnieuw.' } };
  const api = window.GLXAV = {
    open() { ensureDom(); panel(); document.querySelectorAll('.ov.on').forEach(o => o.classList.remove('on')); $('avV').classList.add('on'); start().catch(fail) },
    close() { $('avV').classList.remove('on') },
    set(k, v) { if (k === 'model') { if (!MODELS[v] || v === A.model) return; A = { model: v, skin: A.skin, hair: null, eyes: null, face: A.face || null, parts: {} }; panel(); rebuild().catch(fail); return } A[k] = v; if (fig) { fig.tint(A); if (k === 'face' && fig.face) fig.face(v) } panel() },
    part(mat, v) { A.parts = A.parts || {}; if (v == null) delete A.parts[mat]; else A.parts[mat] = v; if (fig) fig.tint(A); panel() },
    random() {
      const r = a => a[Math.floor(Math.random() * a.length)], k = r(Object.keys(MODELS)), parts = {}; MODELS[k].parts.forEach(([, m]) => { if (Math.random() < .7) parts[m] = r(CLOTH) });
      const same = k === A.model; A = { model: k, skin: r(SKIN), hair: r(HAIRC.slice(0, 9)), eyes: MODELS[k].vrm ? r(EYES) : null, face: MODELS[k].vrm ? r(FACES)[0] : null, parts }; panel(); if (same && fig) fig.tint(A); else rebuild().catch(fail);
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
    mapAvatar, config: () => A, has, models: MODELS, figure, thumb, defaultFor
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
