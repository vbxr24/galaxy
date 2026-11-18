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
  const THREE_URL = new URL('vendor/three/', location.href).href;
  let THREE, GLTFLoader, cloneSkinned;

  /* stijl -> bestand, materialen voor haar en per kledingstuk */
  const MODELS = {
    a_anime: { vrm: 'Anime_A', n: 'Vrouw', g: 'f', hairLbl: 'Haarkleur', skinM: ['Body_00_SKIN', 'Face_00_SKIN'], hairM: ['Hair_00_HAIR', 'HairBack_00_HAIR'], eyeM: ['EyeIris_00_EYE'], parts: [['Top', 'Tops_01_CLOTH'], ['Broekje', 'Bottoms_01_CLOTH'], ['Schoenen', 'Shoes_01_CLOTH']], prints: [['Top', 'Tops_01_CLOTH', 'top', null, 0], ['Broekje', 'Bottoms_01_CLOTH', 'bot', null, 0, 1]], eyes: true },
    a_boy: { vrm: 'Anime_B', n: 'Man', g: 'm', hairLbl: 'Haarkleur', skinM: ['body_bake'], hairM: ['hair'], eyeM: ['eye'], hide: /backpack|^arm_|armgear|anim_logo|green_emit|robo_face|glass/i, armZ: 1.36, shoes: 1, parts: [['Kleren', 'huku_bake'], ['Schoenen', 'glx_shoe']], prints: [['Shirt', 'huku_bake', 'top', [[0, .05, .24, .46], [.24, .05, .48, .46]], .5], ['Broek', 'huku_bake', 'bot', [[0, .46, .62, .95]], .5]], eyes: true },
  };
  const SKIN = ['#f8d9c4', '#f1c7a5', '#e0ac85', '#c98f66', '#a56f48', '#7d4f30', '#5a3620', '#3b2314'];
  const HAIRC = ['#17120f', '#3a2618', '#6b4226', '#a8703a', '#d8b46a', '#f2e3b0', '#b8402a', '#8e9099', '#f5f5f5', '#ec4899', '#3b82f6', '#22c55e', '#8b5cf6'];
  const CLOTH = ['#f8fafc', '#cbd5e1', '#64748b', '#1f2937', '#0b0a1f', '#ef4444', '#f97316', '#fbbf24', '#84cc16', '#16a34a', '#14b8a6', '#38bdf8', '#2563eb', '#8b5cf6', '#ec4899', '#9d174d', '#92400e', '#d6b48a'];
  const EYES = ['#3b2314', '#6b4226', '#2563eb', '#38bdf8', '#16a34a', '#8b5cf6', '#ec4899', '#ef4444', '#fbbf24', '#8e9099'];
  const FACES = [['neutral', '🙂 Gewoon'], ['happy', '😄 Blij'], ['relaxed', '😌 Relaxed'], ['surprised', '😮 Verrast'], ['sad', '🥺 Verlegen']];

  /* kleding-prints: patroon over de stof-textuur (vermenigvuldigen, zodat de kleurkeuze blijft werken) */
  const PRINTS = { top: [['', 'Effen'], ['streep', 'Strepen'], ['breton', 'Marinière'], ['ruit', 'Ruitjes'], ['logo', 'Galaxy-logo'], ['hart', 'Hartjes'], ['sterren', 'Sterrenhemel'], ['camo', 'Camouflage'], ['tie', 'Tie-dye']],
    bot: [['', 'Effen'], ['jeans', 'Jeans'], ['ruit', 'Ruitjes'], ['streep', 'Sportstreep'], ['camo', 'Camouflage'], ['sterren', 'Sterrenhemel']] };
  function rnd(seed) { let x = seed || 7; return () => (x = (x * 16807) % 2147483647) / 2147483647 }
  function drawPrint(c, W, H, kind, rect) {
    const [x0, y0, x1, y1] = rect, X = x0 * W, Y = y0 * H, w = (x1 - x0) * W, h = (y1 - y0) * H, u = Math.max(W, H) / 1024, r = rnd(42);
    c.save(); c.beginPath(); c.rect(X, Y, w, h); c.clip();
    const fill = (col, a, b, cc, d) => { c.fillStyle = col; c.fillRect(a, b, cc, d) };
    if (kind === 'streep') { for (let y = Y; y < Y + h; y += 46 * u) fill('#5b6478', X, y, w, 20 * u) }
    else if (kind === 'breton') { fill('#ffffff', X, Y, w, h); for (let y = Y + 10 * u; y < Y + h; y += 30 * u) fill('#1e3a8a', X, y, w, 11 * u) }
    else if (kind === 'ruit') { c.globalAlpha = .5; for (let x = X; x < X + w; x += 70 * u) { fill('#7f1d1d', x, Y, 26 * u, h); fill('#334155', x + 40 * u, Y, 5 * u, h) } for (let y = Y; y < Y + h; y += 70 * u) { fill('#7f1d1d', X, y, w, 26 * u); fill('#334155', X, y + 40 * u, w, 5 * u) } c.globalAlpha = 1 }
    else if (kind === 'jeans') { fill('#5b7fb3', X, Y, w, h); c.strokeStyle = 'rgba(30,50,90,.35)'; c.lineWidth = 2 * u; for (let i = -h; i < w; i += 7 * u) { c.beginPath(); c.moveTo(X + i, Y); c.lineTo(X + i + h, Y + h); c.stroke() } for (let i = 0; i < 900; i++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.25)' : 'rgba(10,20,50,.2)'; c.fillRect(X + r() * w, Y + r() * h, 9 * u, 1.5 * u) } }
    else if (kind === 'camo') { const cols = ['#4d5d2c', '#7a7a46', '#2f3a22', '#a39a6a']; fill('#8c8a5c', X, Y, w, h); for (let i = 0; i < 260; i++) { c.fillStyle = cols[i % 4]; c.beginPath(); c.ellipse(X + r() * w, Y + r() * h, (20 + r() * 50) * u, (12 + r() * 30) * u, r() * 3, 0, 7); c.fill() } }
    else if (kind === 'sterren') { const g = c.createLinearGradient(X, Y, X + w, Y + h); g.addColorStop(0, '#1e1b4b'); g.addColorStop(.5, '#4c1d95'); g.addColorStop(1, '#0f172a'); c.fillStyle = g; c.fillRect(X, Y, w, h); for (let i = 0; i < 700; i++) { c.fillStyle = r() < .2 ? '#f9a8d4' : '#ffffff'; const s = (r() < .1 ? 4 : 1.6) * u; c.fillRect(X + r() * w, Y + r() * h, s, s) } }
    else if (kind === 'tie') { for (let i = 0; i < 9; i++) { const cx = X + r() * w, cy = Y + r() * h, g = c.createRadialGradient(cx, cy, 0, cx, cy, 260 * u); g.addColorStop(0, ['#f472b6', '#60a5fa', '#facc15', '#a78bfa', '#34d399'][i % 5]); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(X, Y, w, h) } }
    else if (kind === 'hart') { c.fillStyle = '#e11d48'; for (let y = Y + 20 * u, row = 0; y < Y + h; y += 64 * u, row++) for (let x = X + (row % 2 ? 32 : 0) * u; x < X + w; x += 64 * u) { const s = 9 * u; c.beginPath(); c.moveTo(x, y + s); c.bezierCurveTo(x - 2 * s, y - s * .6, x - s * .4, y - 2 * s, x, y - s * .7); c.bezierCurveTo(x + s * .4, y - 2 * s, x + 2 * s, y - s * .6, x, y + s); c.fill() } }
    else if (kind === 'logo') { const cx = X + w / 2, cy = Y + h * .42, R = Math.min(w, h) * .2; c.fillStyle = '#6d28d9'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .45 : R; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) } c.fill(); c.font = `800 ${R * .55}px sans-serif`; c.textAlign = 'center'; c.fillStyle = '#1f2937'; c.fillText('GALAXY', cx, cy + R * 1.75) }
    c.restore();
  }
  function printTex(m, kind, rects, lum, lighten, key) {
    const tex = m.map; if (!tex) return; const ud = m.userData;
    if (!ud.orig) ud.orig = { map: tex, shade: m.shadeMultiplyTexture === tex };
    ud.prints = ud.prints || {}; ud.prints[key] = kind;
    const all = Object.entries(ud.prints).filter(([, k]) => k), sig = JSON.stringify(all) + (lighten ? 'L' : '');
    if (ud.sig === sig) return; ud.sig = sig;
    if (!all.length && !lighten) { m.map = ud.orig.map; if (ud.orig.shade) m.shadeMultiplyTexture = ud.orig.map; m.needsUpdate = true; return }
    const img = ud.orig.map.image, W = img.width, H = img.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d', { willReadFrequently: true });
    c.drawImage(img, 0, 0); const flip = ud.orig.map.flipY;
    if (lighten) { const d = c.getImageData(0, 0, W, H), a = d.data; for (let i = 0; i < a.length; i += 4) { const l = (a[i] + a[i + 1] + a[i + 2]) / 3; if (l < 90) { const v = 150 + l * 1.15; a[i] = a[i + 1] = a[i + 2] = v } } c.putImageData(d, 0, 0) }
    const base = c.getImageData(0, 0, W, H);
    all.forEach(([k2, kind2]) => {
      const R = (m.userData.rects || {})[k2] || [[0, 0, 1, 1]], L = (m.userData.lums || {})[k2] || 0;
      const p = document.createElement('canvas'); p.width = W; p.height = H; const pc = p.getContext('2d', { willReadFrequently: true });
      R.forEach(rc => drawPrint(pc, W, H, kind2, rc));
      if (L) { const pd = pc.getImageData(0, 0, W, H), b = base.data; for (let i = 0; i < b.length; i += 4) if ((b[i] + b[i + 1] + b[i + 2]) / 765 < L || Math.abs(b[i] - b[i + 2]) > 40) pd.data[i + 3] = 0; pc.putImageData(pd, 0, 0) }
      c.globalCompositeOperation = 'multiply'; c.drawImage(p, 0, 0); c.globalCompositeOperation = 'source-over';
    });
    const t = new THREE.CanvasTexture(cv); ['flipY', 'colorSpace', 'wrapS', 'wrapT', 'channel', 'anisotropy'].forEach(k => { if (ud.orig.map[k] !== undefined) t[k] = ud.orig.map[k] }); t.needsUpdate = true;
    if (m.map !== ud.orig.map && m.map) m.map.dispose(); m.map = t; if (ud.orig.shade) m.shadeMultiplyTexture = t; m.needsUpdate = true;
  }

  /* ===== accessoires: 3D-spulletjes vastgemaakt aan het skelet (werkt op elk model) ===== */
  const METAL = { goud: [0xe3b341, 1, .28], zilver: [0xd7dde5, 1, .25], rose: [0xe7a28f, 1, .3], zwart: [0x1f2329, .6, .35] };
  const ACC = [
    ['ketting', 'Ketting', 'metal', ['goud', 'zilver', 'rose']], ['hanger', 'Hanger', 'pick', [['hart', '❤️ Hart'], ['ster', '⭐ Ster'], ['maan', '🌙 Maan']]],
    ['ring', 'Ringen', 'metal', ['goud', 'zilver', 'rose', 'zwart']], ['horloge', 'Horloge', 'metal', ['zilver', 'goud', 'zwart', 'rose']],
    ['oorbel', 'Oorbellen', 'metal', ['goud', 'zilver', 'rose']], ['bril', 'Bril', 'pick', [['bril', '👓 Bril'], ['zon', '🕶️ Zonnebril']]],
    ['pet', 'Pet', 'col'], ['muts', 'Muts', 'col'], ['hoodie', 'Hoodie (kap)', 'col'], ['tas', 'Handtas', 'col'], ['rugzak', 'Rugzak', 'col'], ['laars', 'Laarzen', 'col']];
  const ACOL = ['#111827', '#f8fafc', '#9ca3af', '#7c4a2d', '#d6b48a', '#ef4444', '#ec4899', '#8b5cf6', '#2563eb', '#38bdf8', '#16a34a', '#fbbf24'];
  const GLBB = { hips: 'Hips', spine: 'Abdomen', chest: 'Torso', upperChest: 'Chest', neck: 'Neck', head: 'Head', leftUpperArm: 'UpperArm.L', rightUpperArm: 'UpperArm.R', leftLowerArm: 'LowerArm.L', rightLowerArm: 'LowerArm.R', leftHand: 'Wrist.L', rightHand: 'Wrist.R', leftRingProximal: 'Ring1.L', leftRingIntermediate: 'Ring2.L', rightRingProximal: 'Ring1.R', rightRingIntermediate: 'Ring2.R', leftUpperLeg: 'UpperLeg.L', rightUpperLeg: 'UpperLeg.R', leftLowerLeg: 'LowerLeg.L', rightLowerLeg: 'LowerLeg.R', leftFoot: 'Foot.L', rightFoot: 'Foot.R' };
  function addAcc(fig, wrap, getBone, skip) {
    const T = THREE, V3 = (x, y, z) => new T.Vector3(x, y, z), wp = b => b ? b.getWorldPosition(V3()) : null, items = {}, mats = {};
    wrap.updateMatrixWorld(true);
    const B = n => getBone(n) || (n === 'upperChest' ? getBone('chest') : null), P = n => wp(B(n));
    const head = P('head'), neck = P('neck') || head, chest = P('upperChest') || P('chest'), hips = P('hips');
    if (!head || !chest || !hips) return;
    /* hoofdmaat meten op de echte vertices (ook geskinde) */
    let top = head.y + .12; const all = [], v = V3();
    wrap.traverse(o => { if (!o.isMesh || !o.visible || !o.geometry || !o.geometry.attributes.position) return; const pa = o.geometry.attributes.position, st = Math.max(1, Math.floor(pa.count / 6000)); for (let i = 0; i < pa.count; i += st) { v.fromBufferAttribute(pa, i); if (o.isSkinnedMesh && o.applyBoneTransform) o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld); all.push(v.clone()) } });
    const vs = all.filter(p => p.y > head.y - .02 && Math.abs(p.x - head.x) < .22 && Math.abs(p.z - head.z) < .25);
    vs.forEach(p => { if (Math.abs(p.x - head.x) < .12 && p.y > top) top = p.y });
    const HH = top - head.y; let fz = head.z + HH * .45; vs.forEach(p => { if (Math.abs(p.x - head.x) < .03 && p.y > head.y + HH * .2 && p.y < head.y + HH * .6 && p.z > fz) fz = p.z });
    const hR = Math.max(.08, Math.min(.2, HH * .52)), hc = V3(head.x, head.y + HH * .5, fz - hR * .95);
    /* lichaamsoppervlak: voor- en achterkant per hoogte */
    const zr = (y0, y1, cx, xr) => { let f = -9, b = 9, w = 0; all.forEach(p => { if (p.y >= y0 && p.y <= y1 && Math.abs(p.x - cx) < xr) { if (p.z > f) f = p.z; if (p.z < b) b = p.z } }); return f < -8 ? { f: chest.z + .1, b: chest.z - .1 } : { f, b } };
    const wr = (y0, y1, zr0) => { let l = 0, r = 0; all.forEach(p => { if (p.y >= y0 && p.y <= y1 && Math.abs(p.z - zr0) < .2) { const d = p.x - hips.x; if (d > r) r = d; if (d < l) l = d } }); return { l, r } };
    const shW = (() => { const a = P('leftUpperArm'), b = P('rightUpperArm'); return a && b ? a.distanceTo(b) : .3 })();
    const mat = (k, o) => (mats[k] = mats[k] || []).push(o) && o;
    const std = (k, c, r) => mat(k, new T.MeshStandardMaterial({ color: c || 0x888888, roughness: r == null ? .7 : r, metalness: 0 }));
    const add = (key, bone, ...objs) => { const g = new T.Group(); objs.forEach(o => { if (o.isMesh) o.castShadow = true; g.add(o) }); wrap.add(g); g.updateMatrixWorld(true); const b = B(bone); if (b) b.attach(g); g.visible = false; (items[key] = items[key] || []).push(g); return g };
    const M = (geo, m, pos, rot, sc) => { const o = new T.Mesh(geo, m); if (pos) o.position.copy(pos); if (rot) o.rotation.set(...rot); if (sc) o.scale.set(...sc); return o };
    const alignTo = (o, from, to) => { o.quaternion.setFromUnitVectors(V3(0, 1, 0), to.clone().sub(from).normalize()) };
    /* ketting + hanger */
    const nb = zr(neck.y - .06, neck.y + .01, neck.x, .06), nRad = Math.max(.045, (nb.f - nb.b) / 2 + .012), ncz = (nb.f + nb.b) / 2, cs = zr(chest.y, neck.y - .04, chest.x, .05);
    const nk = V3(neck.x, neck.y - .035, ncz), nR = nRad, km = std('ketting', 0, .3); add('ketting', 'upperChest', M(new T.TorusGeometry(nR, .0045, 6, 40), km, nk, [Math.PI / 2 - .55, 0, 0], [1.08, 1, 1]));
    nk.z = cs.f - nR * 1.02 + .006;
    const pend = V3(nk.x, nk.y - nR * Math.cos(Math.PI / 2 - .55) - .03, cs.f + .012), pm = std('ketting', 0, .3), hs = new T.Shape(); { const s = .018; hs.moveTo(0, -s); hs.bezierCurveTo(-s * 1.9, s * .4, -s * .6, s * 1.5, 0, s * .55); hs.bezierCurveTo(s * .6, s * 1.5, s * 1.9, s * .4, 0, -s) }
    const st = new T.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .009 : .022; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r) }
    const mo = new T.Shape(); mo.absarc(0, 0, .02, Math.PI * .35, Math.PI * 1.65, false); mo.absarc(.009, 0, .016, Math.PI * 1.55, Math.PI * .45, true);
    const ex = { depth: .006, bevelEnabled: true, bevelSize: .002, bevelThickness: .002, bevelSegments: 2 };
    [['hart', hs], ['ster', st], ['maan', mo]].forEach(([k, sh]) => { const g = add('hanger_' + k, 'upperChest', M(new T.ExtrudeGeometry(sh, ex), pm, pend, [-.25, 0, 0])); });
    /* ringen */
    const rm = std('ring', 0, .3);
    ['left', 'right'].forEach(sd => { const a = P(sd + 'RingProximal'), b = P(sd + 'RingIntermediate'); if (!a || !b) return; const o = M(new T.TorusGeometry(.0085, .0028, 6, 18), rm, a.clone().lerp(b, .45)); o.quaternion.setFromUnitVectors(V3(0, 0, 1), b.clone().sub(a).normalize()); add('ring', sd + 'RingProximal', o) });
    /* horloge links */
    { const a = P('leftLowerArm'), b = P('leftHand'); if (a && b) { const d = b.clone().sub(a).normalize(), c = a.clone().lerp(b, .86), hm = std('horloge', 0, .3), q = new T.Quaternion().setFromUnitVectors(V3(0, 0, 1), d); const band = M(new T.TorusGeometry(.03, .007, 8, 24), hm, c); band.quaternion.copy(q); const face = M(new T.CylinderGeometry(.016, .016, .008, 20), std('horloge', 0, .3), c.clone().add(V3(0, .03, 0))); const glass = M(new T.CylinderGeometry(.013, .013, .009, 20), new T.MeshStandardMaterial({ color: 0x0f172a, roughness: .1, metalness: .2 }), c.clone().add(V3(0, .031, 0))); add('horloge', 'leftLowerArm', band, face, glass) } }
    /* oorbellen */
    { const om = std('oorbel', 0, .3); [-1, 1].forEach(sx => add('oorbel', 'head', M(new T.SphereGeometry(.009, 12, 10), om, V3(hc.x + sx * hR * .78, head.y + HH * .22, hc.z)), M(new T.TorusGeometry(.012, .002, 6, 16), om, V3(hc.x + sx * hR * .78, head.y + HH * .1, hc.z), [0, Math.PI / 2, 0]))) }
    /* bril + zonnebril */
    { const eyeB = P('leftEye'), ey = eyeB ? eyeB.y : head.y + HH * .4, ez = fz + .006, fr = std('brilR', 0x1f2937, .4); [['bril', new T.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: .18, roughness: .05 })], ['zon', new T.MeshStandardMaterial({ color: 0x0b0f19, transparent: true, opacity: .88, roughness: .1, metalness: .3 })]].forEach(([k, lm]) => { const parts = []; [-1, 1].forEach(sx => { const c = V3(hc.x + sx * hR * .36, ey, ez); parts.push(M(new T.TorusGeometry(hR * .27, .0045, 6, 24), fr, c, [0, 0, 0], [1, .8, 1]), M(new T.CircleGeometry(hR * .27, 24), lm, c.clone().add(V3(0, 0, .001)), [0, 0, 0], [1, .8, 1]), M(new T.BoxGeometry(.005, .005, hR * .95), fr, V3(hc.x + sx * hR * .9, ey + .004, ez - hR * .45))) }); parts.push(M(new T.BoxGeometry(hR * .2, .005, .005), fr, V3(hc.x, ey + .006, ez))); add('bril_' + k, 'head', ...parts) }) }
    /* pet */
    { const pm2 = std('pet', 0, .8), cr = hR * 1.07, by = head.y + HH * .54, sy = (top + .012 - by) / cr, cap = M(new T.SphereGeometry(cr, 28, 14, 0, Math.PI * 2, 0, Math.PI * .5), pm2, V3(hc.x, by, hc.z), 0, [1, sy, 1.06]); const vis = M(new T.CylinderGeometry(cr * .82, cr * .82, .008, 28, 1, false, -Math.PI * .5, Math.PI), pm2, V3(hc.x, by + .004, hc.z + cr * .62), [.14, 0, 0], [1, 1, .95]); const btn = M(new T.SphereGeometry(.012, 10, 8), pm2, V3(hc.x, top + .014, hc.z)); add('pet', 'head', cap, vis, btn) }
    /* muts */
    { const mm = std('muts', 0, .95), cr = hR * 1.1, by = head.y + HH * .56, sy = (top + .02 - by) / cr, cap = M(new T.SphereGeometry(cr, 28, 14, 0, Math.PI * 2, 0, Math.PI * .5), mm, V3(hc.x, by, hc.z - hR * .04), 0, [1, sy, 1.04]); const rim = M(new T.TorusGeometry(cr, cr * .12, 10, 32), mm, V3(hc.x, by + cr * .06, hc.z - hR * .04), [Math.PI / 2, 0, 0], [1, 1.04, 1]); const pom = M(new T.SphereGeometry(cr * .25, 14, 10), mm, V3(hc.x, top + .02 + cr * .15, hc.z - hR * .04)); add('muts', 'head', cap, rim, pom) }
    /* hoodie-kap + koordjes */
    { const hm = std('hoodie', 0, .9), ub = zr(neck.y - .14, neck.y - .02, chest.x, .1), hw = shW * .3, hood = M(new T.SphereGeometry(1, 24, 16), hm, V3(neck.x, neck.y - .07, ub.b - .02), [.3, 0, 0], [hw * 1.45, .11, .065]); const fold = M(new T.TorusGeometry(hw * .55, .018, 8, 24, Math.PI), hm, V3(neck.x, neck.y - .025, ub.b + .005), [-.2, 0, 0], [1, .8, 1]);
      const col = M(new T.TorusGeometry(nRad + .012, .011, 8, 30), hm, V3(neck.x, neck.y - .05, ncz - .005), [Math.PI / 2 - .35, 0, 0], [1.1, 1, 1]); const cords = [-1, 1].map(sx => M(new T.CylinderGeometry(.0035, .0035, .12, 6), std('hoodieC', 0xf1f5f9, .6), V3(neck.x + sx * .028, neck.y - .13, cs.f + .012), [-.12, 0, 0])); add('hoodie', 'upperChest', hood, fold, col, ...cords) }
    /* handtas (schoudertas) */
    { const tm = std('tas', 0, .55), hw2 = wr(hips.y - .05, hips.y + .05, hips.z), hz = zr(hips.y - .06, hips.y + .04, hips.x, .3), bp = V3(hips.x + hw2.r + .045, hips.y - .03, (hz.f + hz.b) / 2 + .02), ry = .0;
      const bag = M(new T.BoxGeometry(.05, .12, .16, 2, 2, 2), tm, bp, [0, ry, 0]); const flap = M(new T.BoxGeometry(.054, .055, .162), std('tas', 0, .45), bp.clone().add(V3(.002, .035, 0))); const clasp = M(new T.BoxGeometry(.01, .016, .022), std('tasG', 0xe3b341, .3), bp.clone().add(V3(.029, .012, 0)));
      const sh = zr(neck.y - .1, neck.y - .02, chest.x - shW * .25, .05), sA = V3(chest.x - shW * .27, neck.y - .02, (sh.f + sh.b) / 2), sB = bp.clone().add(V3(0, .055, 0)), cf = zr(chest.y - .05, chest.y + .05, chest.x, shW * .4), cb = cf;
      const strap = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([sA.clone().add(V3(0, .01, 0)), V3(chest.x - shW * .1, chest.y + .03, cf.f + .012), V3(hips.x + hw2.r * .7, hips.y + .08, hz.f + .02), sB]), 30, .005, 5), std('tas', 0, .55));
      const strap2 = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([sA.clone().add(V3(0, .01, 0)), V3(chest.x - shW * .1, chest.y + .03, cb.b - .012), V3(hips.x + hw2.r * .7, hips.y + .08, hz.b - .02), sB]), 30, .005, 5), std('tas', 0, .55));
      add('tas', 'hips', bag, flap, clasp); add('tas', 'upperChest', strap, strap2) }
    /* rugzak */
    { const rm2 = std('rugzak', 0, .75), bk = zr(chest.y - .12, neck.y - .06, chest.x, shW * .3), d = .12, c = V3(chest.x, (chest.y + neck.y) / 2 - .1, bk.b - d / 2 + .01);
      const bag = M(new T.CapsuleGeometry(.085, .17, 6, 14), rm2, c, 0, [shW * .42 / .085 / 1, 1, d / 2 / .085]); const pocket = M(new T.CapsuleGeometry(.05, .04, 6, 12), std('rugzak', 0, .75), c.clone().add(V3(0, -.07, -d / 2 - .01)), 0, [1.6, 1, .5]);
      const straps = [-1, 1].map(sx => { const xs = chest.x + sx * shW * .2, top2 = zr(neck.y - .08, neck.y, xs, .04), fr = zr(chest.y - .1, chest.y, xs, .04); return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V3(xs, c.y + .12, bk.b - .005), V3(xs, neck.y - .03, (top2.f + top2.b) / 2), V3(xs, chest.y + .02, fr.f + .01), V3(xs + sx * .03, chest.y - .14, fr.f + .0)]), 24, .011, 5), std('rugzak', 0, .75)) });
      add('rugzak', 'upperChest', bag, pocket, ...straps) }
    /* laarzen */
    ['left', 'right'].forEach(sd => { const k = P(sd + 'LowerLeg'), f = P(sd + 'Foot'); if (!k || !f) return; const lm = std('laars', 0, .5), up = M(new T.CylinderGeometry(.062, .052, (k.y - f.y) * .62, 16), lm, V3(f.x, f.y + (k.y - f.y) * .28, f.z - .005)); const ft = M(new T.CapsuleGeometry(.05, .12, 6, 12), lm, V3(f.x, .055, f.z + .045), [Math.PI / 2, 0, 0], [1.05, 1, 1.15]); const sole = M(new T.BoxGeometry(.11, .028, .25), std('laarsZ', 0x1f2937, .8), V3(f.x, .014, f.z + .04)); add('laars', sd + 'LowerLeg', up); add('laars', sd + 'Foot', ft, sole) });
    const old = fig.tint.bind(fig);
    fig.tint = c => {
      old(c); const a = c.acc || {}, show = (k, on) => (items[k] || []).forEach(g => g.visible = !!on);
      ACC.forEach(([k, , type]) => {
        const v = a[k];
        if (k === 'hanger') { ['hart', 'ster', 'maan'].forEach(h => show('hanger_' + h, a.ketting && (v || 'hart') === h)); return }
        if (k === 'bril') { show('bril_bril', v === 'bril'); show('bril_zon', v === 'zon'); return }
        show(k, v); if (!v) return;
        (mats[k] || []).forEach(m => { if (type === 'metal') { const [cc, me, ro] = METAL[v] || METAL.zilver; m.color.setHex(cc); m.metalness = me; m.roughness = ro } else m.color.set(v) });
      });
      if (skip) skip(a);
    };
  }
  const DEF = { model: 'a_anime', skin: null, hair: null, parts: {} };
  const OLD = m => MODELS[m] ? m : /^m_/.test(m || '') ? 'a_boy' : /^f_/.test(m || '') ? 'a_anime' : null;
  function load() { try { const a = JSON.parse(localStorage[KEY] || 'null'); if (a && OLD(a.model) && OLD(a.model) !== a.model) { a.model = OLD(a.model); a.parts = {}; a.hair = null } if (a && MODELS[a.model]) return { model: a.model, skin: a.skin || null, hair: a.hair || null, eyes: a.eyes || null, face: a.face || null, parts: a.parts || {}, prints: a.prints || {}, acc: a.acc || {} } } catch (e) { } return JSON.parse(JSON.stringify(DEF)) }
  function has() { try { return !!localStorage[KEY] } catch (e) { return false } }
  let A = load();

  /* ===================== 3D laden ===================== */
  async function lib() {
    if (THREE) return;
    if (!document.querySelector('script[type="importmap"]')) { const s = document.createElement('script'); s.type = 'importmap'; s.textContent = JSON.stringify({ imports: { three: THREE_URL + 'build/three.module.min.js', 'three/addons/': THREE_URL + 'examples/jsm/' } }); document.head.appendChild(s) }
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
    vrm.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; if (M.hide && (Array.isArray(o.material) ? o.material : [o.material]).some(m => M.hide.test((m.name || '').replace(/ \(Outline\)$/, '')))) o.visible = false } });
    const mats = {}; vrm.scene.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { const n = (m.name || '').replace(/ \(Outline\)$/, ''); (mats[n] = mats[n] || []).push(m); if (m.color && m.userData.base == null) m.userData.base = m.color.getHex(); if (m.shadeColorFactor && m.userData.shade == null) m.userData.shade = m.shadeColorFactor.getHex() }) });
    (M.prints || []).forEach(p => { if (p[5]) (mats[p[1]] || []).forEach(m => { m.userData.base = 0x2b2d38; if (m.userData.shade != null) m.userData.shade = 0x1a1b22 }) });
    const H = vrm.humanoid, bone = n => H.getNormalizedBoneNode(n);
    vrm.scene.updateMatrixWorld(true); const head = bone('head'), v = new THREE.Vector3(); const hh = head ? head.getWorldPosition(v).y + .14 : 1.6;
    const k = 1.62 / hh, wrap = new THREE.Group(); vrm.scene.scale.setScalar(k); wrap.add(vrm.scene);

    if (M.shoes) {
      const sm = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: .55, name: 'glx_shoe' }), so = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: .8 });
      sm.userData.base = 0xf1f5f9; mats.glx_shoe = [sm]; wrap.updateMatrixWorld(true);
      ['left', 'right'].forEach(sd => {
        const f = H.getRawBoneNode(sd + 'Foot'), te = H.getRawBoneNode(sd + 'Toes'); if (!f) return;
        const a = f.getWorldPosition(new THREE.Vector3()), b = te ? te.getWorldPosition(new THREE.Vector3()) : a.clone().add(new THREE.Vector3(0, 0, .12));
        const dir = b.clone().sub(a).setY(0).normalize(), heel = a.clone().addScaledVector(dir, -.06), tip = b.clone().addScaledVector(dir, .075), L = heel.distanceTo(tip) - 0.0;
        const g = new THREE.Group(), up = new THREE.Mesh(new THREE.CapsuleGeometry(.047, Math.max(.05, L - .094), 6, 14), sm), sole = new THREE.Mesh(new THREE.BoxGeometry(.096, .026, L + .012), so);
        up.rotation.x = Math.PI / 2; up.scale.set(.9, 1, 1.18); up.position.y = .066; sole.position.y = .013; up.castShadow = sole.castShadow = true; g.add(up, sole);
        const mid = heel.clone().add(tip).multiplyScalar(.5); g.position.set(mid.x, 0, mid.z); g.rotation.y = Math.atan2(dir.x, dir.z); wrap.add(g); g.updateMatrixWorld(true); f.attach(g);
      });
    }
    let mode = 'Idle', once = 0, t = Math.random() * 10, blinkAt = 1.5, blink = 0, look = null;
    const AZ = M.armZ || 1.24;
    const R = (n, x, y, z) => { const b = bone(n); if (b) b.rotation.set(x || 0, y || 0, z || 0) };
    /* ontspannen staan: armen los langs het lichaam, ellebogen licht gebogen, gewicht op één been */
    const relaxedArms = (sw, lift) => {
      R('leftShoulder', 0, 0, .06 + lift); R('rightShoulder', 0, 0, -.06 - lift);
      R('leftUpperArm', .1 + sw, -.08, -AZ); R('rightUpperArm', .1 - sw, .08, AZ);
      R('leftLowerArm', 0, -.32, -.05); R('rightLowerArm', 0, .32, .05);
      R('leftHand', 0, -.1, -.12); R('rightHand', 0, .1, .12);
    };
    const pose = dt => {
      t += dt; const s = Math.sin, br = s(t * 1.8) * .025, sway = s(t * .55);
      vrm.scene.position.y = 0;
      if (mode === 'Walk') {
        const w = t * 7, a = s(w) * .5;
        R('hips', 0, s(w) * .1, s(w) * .03); R('spine', .04, -s(w) * .08, 0); R('chest', br, -s(w) * .05, 0); R('neck', 0, 0, 0); R('head', -.03, s(w) * .04, 0);
        R('leftUpperLeg', a, 0, 0); R('rightUpperLeg', -a, 0, 0);
        R('leftLowerLeg', Math.max(0, -s(w + .6)) * 1.0, 0, 0); R('rightLowerLeg', Math.max(0, s(w + .6)) * 1.0, 0, 0);
        R('leftFoot', Math.max(0, s(w)) * .3 - .1, 0, 0); R('rightFoot', Math.max(0, -s(w)) * .3 - .1, 0, 0);
        relaxedArms(0, 0); R('leftUpperArm', -a * .7, -.08, -1.2); R('rightUpperArm', a * .7, .08, 1.2);
        R('leftLowerArm', 0, -.45 - Math.max(0, a) * .4, 0); R('rightLowerArm', 0, .45 + Math.max(0, -a) * .4, 0);
        vrm.scene.position.y = Math.abs(s(w)) * .025;
      } else {
        /* rustig staan, een beetje wiegen van het ene op het andere been */
        R('hips', 0, sway * .04, .035 + sway * .012); R('spine', br * .6, -sway * .02, -.03); R('chest', br, 0, -.01); R('upperChest', br * .5, 0, 0);
        R('leftUpperLeg', -.03, .05, -.035); R('rightUpperLeg', .05, -.05, -.06); R('leftLowerLeg', .02, 0, 0); R('rightLowerLeg', .14, 0, 0);
        R('leftFoot', 0, 0, .03); R('rightFoot', -.08, -.05, .05);
        R('neck', .03, s(t * .37) * .06, 0); R('head', .02 + s(t * .29) * .025, s(t * .43) * .08, sway * .025);
        relaxedArms(s(t * 1.1) * .02, br * .4);
        if (mode === 'Dance') { const b = s(t * 8); R('leftUpperArm', 0, 0, -.35 + b * .25); R('rightUpperArm', 0, 0, .35 + b * .25); R('leftLowerArm', 0, -.6, 0); R('rightLowerArm', 0, .6, 0); R('hips', 0, s(t * 4) * .25, 0); R('spine', 0, 0, b * .12); R('leftLowerLeg', Math.max(0, b) * .4, 0, 0); R('rightLowerLeg', Math.max(0, -b) * .4, 0, 0); vrm.scene.position.y = Math.abs(s(t * 8)) * .05 }
        else if (mode === 'Wave') { R('rightShoulder', 0, 0, -.15); R('rightUpperArm', 0, -.2, -.25); R('rightLowerArm', 0, -.1 + s(t * 9) * .4, -1.45); R('rightHand', 0, 0, .1); R('head', .05, .12, -.06) }
      }
      if (once && t > once) { once = 0; mode = 'Idle' }
      const E = vrm.expressionManager;
      if (E) {
        if (t > blinkAt) { blink = .16; blinkAt = t + 2 + Math.random() * 3 } if (blink > 0) blink -= dt;
        E.setValue('blink', blink > 0 ? Math.sin((blink / .16) * Math.PI) : 0);
        const f = mode === 'Wave' || mode === 'Dance' ? 'happy' : (cfg.face || 'neutral'); FACES.forEach(([n]) => E.setValue(n, n === f && n !== 'neutral' ? (n === 'sad' ? .55 : .85) : 0));
      }
      if (vrm.lookAt && look) vrm.lookAt.target = look;
      vrm.update(dt);
    };
    const fig = {
      root: wrap, model: cfg.model, vrm, headY: 1.47,
      mixer: { update: pose },
      play(n, o) { mode = ['Wave', 'Walk', 'Dance'].includes(n) ? n : 'Idle'; once = o || n === 'Wave' || n === 'Dance' ? t + (n === 'Dance' ? 3.4 : 2.2) : 0 },
      tint(c) {
        const set = (names, hex) => names.forEach(n => (mats[n] || []).forEach(m => { if (!m.color) return; m.color.set(hex == null ? m.userData.base : hex); if (m.shadeColorFactor) { if (hex == null) m.shadeColorFactor.set(m.userData.shade); else m.shadeColorFactor.set(hex).multiplyScalar(.72) } }));
        set(M.skinM || [], c.skin); set(M.hairM || [], c.hair); set(M.eyeM || [], c.eyes);
        M.parts.forEach(([, mat]) => { const pr = (M.prints || []).some(p => p[5] && p[1] === mat && (c.prints || {})[mat + ':' + p[2]]); set([mat], (c.parts || {})[mat] || (pr ? '#ffffff' : null)) });
        (M.prints || []).forEach(([, mat, kind, rects, lum, lighten], i) => (mats[mat] || []).forEach(m => { const key = kind + i; m.userData.rects = m.userData.rects || {}; m.userData.lums = m.userData.lums || {}; if (rects) m.userData.rects[key] = rects; m.userData.lums[key] = lum; try { printTex(m, (c.prints || {})[mat + ':' + kind] || '', rects, lum, lighten, key) } catch (e) { } }));
      },
      face(f) { cfg = Object.assign({}, cfg, { face: f }) },
      lookAt(o) { look = o || null; if (vrm.lookAt && !o) vrm.lookAt.target = null }
    };
    try { addAcc(fig, wrap, n => H.getRawBoneNode(n), a => { (mats.glx_shoe ? wrap : null) && wrap.traverse(o => { if (o.material === mats.glx_shoe[0]) o.visible = !a.laars }) }) } catch (e) { console.warn(e) }
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
      root: wrap, mixer, model: cfg.model, headY: 1.5,
      play(n, once) { const a = acts[n] || acts.Idle; if (!a || a === cur) return; a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = !!once; a.fadeIn(.25).play(); if (cur) cur.fadeOut(.25); cur = a },
      tint(c) {
        const set = (names, hex) => names.forEach(n => { const m = mats[n]; if (m) m.color.set(hex == null ? m.userData.base : hex) });
        set(['Skin'], c.skin); if (mats.Skin_Darker) { if (c.skin) mats.Skin_Darker.color.set(c.skin).multiplyScalar(.8); else mats.Skin_Darker.color.set(mats.Skin_Darker.userData.base) }
        set(M.hair, c.hair); M.parts.forEach(([, mat]) => set([mat], (c.parts || {})[mat]));
      }
    };
    try { const bn = {}; root.traverse(o => { if (o.isBone) bn[o.name] = o }); addAcc(fig, wrap, n => bn[GLBB[n]]) } catch (e) { console.warn(e) }
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
  const TABS = [['stijl', '🧍 Stijl'], ['huid', '🎨 Huid'], ['haar', '💇 Haar'], ['kleren', '👕 Kleren'], ['extra', '💍 Extra'], ['gezicht', '😊 Gezicht']];
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
    if (tab === 'stijl') h = `<div class="avOpts">${Object.entries(MODELS).map(([k, m]) => `<button class="${A.model === k ? 'on' : ''}" onclick="GLXAV.set('model','${k}')">${m.g === 'f' ? '👩' : '👨'} ${m.n}</button>`).join('')}</div><p class="avLbl">Kies vrouw of man. Pas daarna huid, haar, kleren en extra's aan.</p>`;
    if (tab === 'gezicht') h = M.vrm ? `<div class="avLbl">Gezichtje</div><div class="avOpts">${FACES.map(([f, n]) => `<button class="${(A.face || 'neutral') === f ? 'on' : ''}" onclick="GLXAV.set('face','${f}')">${n}</button>`).join('')}</div><div class="avLbl">Oogkleur</div>${sw("set.bind(null,'eyes')", A.eyes, EYES)}` : `<p class="avLbl">Gezichtjes en oogkleur kan je kiezen bij de stijl ✨ Anime.</p>`;
    if (tab === 'extra') { const a = A.acc || {}, b = (k, v, l, on) => `<button class="${on ? 'on' : ''}" onclick="GLXAV.acc('${k}',${v == null ? 'null' : `'${v}'`})">${l}</button>`;
      h = ACC.map(([k, n, type, opts]) => { if (k === 'hanger' && !a.ketting) return ''; let o = '';
        if (type === 'metal') o = `<div class="avOpts">${b(k, null, '✖️', !a[k])}${opts.map(v => b(k, v, { goud: '🟡 Goud', zilver: '⚪ Zilver', rose: '🌸 Rosé', zwart: '⚫ Zwart' }[v], a[k] === v)).join('')}</div>`;
        else if (type === 'pick') o = `<div class="avOpts">${k === 'hanger' ? '' : b(k, null, '✖️', !a[k])}${opts.map(([v, l]) => b(k, v, l, (a[k] || (k === 'hanger' ? 'hart' : '')) === v)).join('')}</div>`;
        else o = `<div class="avOpts"><button class="avSw std ${!a[k] ? 'on' : ''}" title="Geen" onclick="GLXAV.acc('${k}',null)">✖️</button>${ACOL.map(c => `<button class="avSw ${a[k] === c ? 'on' : ''}" style="background:${c}" aria-label="kleur ${c}" onclick="GLXAV.acc('${k}','${c}')"></button>`).join('')}</div>`;
        return `<div class="avLbl">${n}</div>${o}` }).join('') }
    if (tab === 'huid') h = `<div class="avLbl">Huidskleur</div>${sw("set.bind(null,'skin')", A.skin, SKIN)}`;
    if (tab === 'haar') h = `<div class="avLbl">${M.hairLbl || 'Haarkleur'}</div>${sw("set.bind(null,'hair')", A.hair, HAIRC)}`;
    if (tab === 'kleren') h = M.parts.map(([n, mat]) => `<div class="avLbl">${n}</div>${sw(`part.bind(null,'${mat}')`, (A.parts || {})[mat] || null, CLOTH)}`).join('')
    if (tab === 'kleren' && M.prints) h = M.prints.map(([n, mat, kind]) => { const k = mat + ':' + kind, cur = (A.prints || {})[k] || ''; return `<div class="avLbl"><span>${n}</span> – <span>patroon</span></div><div class="avOpts">${PRINTS[kind].map(([v, l]) => `<button class="${cur === v ? 'on' : ''}" onclick="GLXAV.print('${k}','${v}')">${l}</button>`).join('')}</div>` }).join('') + h;
    $('avPanel').innerHTML = h;
  }
  async function rebuild() {
    const my = ++busy, msg = $('avMsg'); if (msg) { msg.style.display = ''; msg.textContent = 'Mannetje laden…' }
    try {
      const f = await figure(A); if (my !== busy) return;
      if (fig) scene.remove(fig.root); fig = f; scene.add(f.root); if (f.lookAt) f.lookAt(cam); f.play(previewWalk ? 'Walk' : 'Idle'); if (msg) msg.style.display = 'none';
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
      cam.position.set(0, 1.02, 4.3); cam.lookAt(0, .88, 0); fit(); renderer.render(scene, cam); raf = requestAnimationFrame(loop);
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
      if (mapFig) { const em = s.emote && now < s.emoteEnd ? s.emote : null; if (s.emote && !em) { s.emote = null; mapFig.root.position.y = 0; mapFig.play(s.walk ? 'Walk' : 'Idle') }
        mapFig.root.rotation.y = em === 'dance' && !mapFig.vrm ? now / 260 : s.walk ? s.cur : s.cur + Math.sin(now / 3300) * .2;
        if (em === 'dance' && !mapFig.vrm) mapFig.root.position.y = Math.abs(Math.sin(now / 140)) * .18; mapFig.mixer.update(dt) }
      mapCam.position.set(0, 3.9, 5.4); mapCam.lookAt(0, .8, 0); mapR.render(mapScene, mapCam); mapRaf = requestAnimationFrame(loop);
    };
    mapRaf = requestAnimationFrame(loop);
    return { el: mapR.domElement, setWalking: w => { w = !!w; if (w !== mapState.walk) { mapState.walk = w; if (mapFig) mapFig.play(w ? 'Walk' : 'Idle') } }, setHeading: rad => mapState.heading = rad, emote(n) { if (!mapFig) return; mapState.emote = n; mapState.emoteEnd = performance.now() + (n === 'dance' ? 3400 : 2400); mapFig.play(n === 'dance' ? (mapFig.vrm ? 'Dance' : 'Idle') : 'Wave', true) } };
  }

  /* ===================== figuurtjes van andere leden (foto van hun 3D-figuur) ===================== */
  const thumbs = new Map(); let tq = Promise.resolve(), tR = null, tS = null, tC = null;
  function hashStr(x) { let h = 2166136261; for (let i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
  function defaultFor(seed) {
    const h = hashStr(String(seed || 'x')), keys = ['a_anime', 'a_boy'], pick = (a, n) => a[(h >>> n) % a.length];
    const SAFE = ['#f8fafc', '#1f2937', '#0b0a1f', '#2563eb', '#38bdf8', '#8b5cf6', '#ec4899', '#16a34a', '#14b8a6', '#ef4444', '#fbbf24', '#64748b'];
    const k = pick(keys, 0), parts = {}; MODELS[k].parts.forEach(([, m], i) => { parts[m] = pick(SAFE, 5 + i * 4) });
    return { model: k, skin: pick(SKIN, 7), hair: pick(HAIRC.slice(0, 9), 11), eyes: MODELS[k].vrm ? pick(EYES, 13) : null, face: MODELS[k].vrm ? 'happy' : null, parts };
  }
  function clean(cfg, seed) { if (cfg && !MODELS[cfg.model] && OLD(cfg.model)) { const d = defaultFor(seed); return Object.assign(d, { model: OLD(cfg.model), skin: cfg.skin || d.skin, acc: cfg.acc }) } return cfg && MODELS[cfg.model] ? cfg : defaultFor(seed) }
  function thumb(cfg, seed, scale) {
    cfg = clean(cfg, seed); const sc = scale || 1, key = sc + JSON.stringify(cfg);
    if (thumbs.has(key)) return thumbs.get(key);
    const ck = location.origin + '/__glxthumb/' + hashStr('v1' + key).toString(36) + hashStr(key + 'x').toString(36);
    const fromCache = async () => { try { if (!window.caches) return null; const r = await (await caches.open('glx-thumbs')).match(ck); if (!r) return null; const b = await r.blob(); return await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b) }) } catch (e) { return null } };
    const toCache = async url => { try { if (!window.caches || !url) return; const b = await (await fetch(url)).blob(); await (await caches.open('glx-thumbs')).put(ck, new Response(b, { headers: { 'content-type': b.type } })) } catch (e) { } };
    const p = fromCache().then(hit => hit || (tq = tq.then(async () => {
      await lib();
      if (!tR || tR._sc !== sc) { tR = newRenderer(200 * sc, 260 * sc, true); tR._sc = sc; tR.setPixelRatio(1); tR.setSize(200 * sc, 260 * sc, false); tS = makeScene(true); tS.userData.env(tR); tC = new THREE.PerspectiveCamera(24, 200 / 260, .1, 50) }
      const f = await figure(cfg); f.root.rotation.y = .3; f.mixer.update(.016); tS.add(f.root);
      { const hb = f.headY || 1.45; tC.position.set(0, hb - .05, 2.0); tC.lookAt(0, hb - .12, 0) } if (f.lookAt) f.lookAt(tC); tR.render(tS, tC); await new Promise(r => requestAnimationFrame(r)); f.mixer.update(.016); tR.render(tS, tC); let url = tR.domElement.toDataURL('image/webp', .86); if (!/^data:image\/webp/.test(url)) url = tR.domElement.toDataURL('image/png'); toCache(url);
      tS.remove(f.root); return url;
    }).catch(() => null)));
    thumbs.set(key, p); return p;
  }

  const fail = e => { console.error(e); const m = $('avMsg'); if (m) { m.style.display = ''; m.textContent = '⚠️ 3D kon niet laden. Controleer je internet en probeer opnieuw.' } };
  const api = window.GLXAV = {
    open() { ensureDom(); panel(); document.querySelectorAll('.ov.on').forEach(o => o.classList.remove('on')); $('avV').classList.add('on'); start().catch(fail) },
    close() { $('avV').classList.remove('on') },
    set(k, v) { if (k === 'model') { if (!MODELS[v] || v === A.model) return; A = { model: v, skin: A.skin, hair: null, eyes: null, face: A.face || null, parts: {}, prints: {}, acc: A.acc || {} }; panel(); rebuild().catch(fail); return } A[k] = v; if (fig) { fig.tint(A); if (k === 'face' && fig.face) fig.face(v) } panel() },
    acc(k, v) { A.acc = Object.assign({}, A.acc); if (!v) delete A.acc[k]; else A.acc[k] = v; if (k === 'pet' && v) delete A.acc.muts; if (k === 'muts' && v) delete A.acc.pet; if (fig) fig.tint(A); panel() },
    print(k, v) { A.prints = Object.assign({}, A.prints); if (!v) delete A.prints[k]; else A.prints[k] = v; if (fig) fig.tint(A); panel() },
    part(mat, v) { A.parts = A.parts || {}; if (v == null) delete A.parts[mat]; else A.parts[mat] = v; if (fig) fig.tint(A); panel() },
    random() {
      const r = a => a[Math.floor(Math.random() * a.length)], k = r(Object.keys(MODELS)), parts = {}; MODELS[k].parts.forEach(([, m]) => { if (Math.random() < .7) parts[m] = r(CLOTH) });
      const same = k === A.model; A = { model: k, skin: r(SKIN), hair: r(HAIRC.slice(0, 9)), eyes: MODELS[k].vrm ? r(EYES) : null, face: MODELS[k].vrm ? r(FACES)[0] : null, parts }; panel(); if (same && fig) fig.tint(A); else rebuild().catch(fail);
    },
    save() {
      try { localStorage[KEY] = JSON.stringify(A) } catch (e) { }
      const img = snapshot(); if (img) try { localStorage[IMG] = img; localStorage[IMG + 'V'] = 'v2:' + A.model } catch (e) { }
      if (window.ME) ME.avatar = A;
      if (mapR) mapRebuild().catch(() => { });
      window.dispatchEvent(new Event('glx-avatar'));
      if (window.GLXLIVE && GLXLIVE.send) GLXLIVE.send({ t: 'avatar', avatar: A });
      api.close(); try { toast('✅ Je mannetje is opgeslagen') } catch (e) { }
    },
    image() {
      let old = null; try { old = localStorage[IMG] || null } catch (e) { }
      const want = 'v2:' + load().model; let have = null; try { have = localStorage[IMG + 'V'] } catch (e) { }
      if (have !== want && !api._regen) { api._regen = 1; thumb(load(), 'me', 2).then(u => { api._regen = 0; if (!u) return; try { localStorage[IMG] = u; localStorage[IMG + 'V'] = want } catch (e) { } document.querySelectorAll('img').forEach(im => { if (old && im.src === old) im.src = u }); if (!old) document.querySelectorAll('span').forEach(sp => { if (sp.textContent === '🧍' && sp.parentElement && /GLXAV.open/.test(sp.parentElement.getAttribute('onclick') || '')) sp.outerHTML = `<img src="${u}" alt="" style="width:170px;height:170px;object-fit:contain;margin:0 -25px">` }) }) }
      return old;
    },
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
