/* =====================================================================
   Galaxy 3D-mannetje — gedetailleerde, geanimeerde avatar
   - Volledig skelet (heupen, knieën, schouders, ellebogen, hoofd)
   - Animaties: lopen, ademen, knipperen, rondkijken, zwaaien
   - Personaliseren: postuur, huid, gezicht, haar, baard, kleren, schoenen, accessoires
   - Op de kaart loopt je mannetje live mee in je looprichting
   ===================================================================== */
(function () {
  'use strict';
  const THREE_JS = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  const $ = id => document.getElementById(id);
  const KEY = 'glxAvatar', IMG = 'glxAvatarImg';

  const SKIN = ['#ffe5d4', '#f7d0b2', '#ecb994', '#d9a073', '#bb8155', '#996240', '#77472b', '#55311c'];
  const HAIRC = ['#17110d', '#3a2416', '#5e3a20', '#8a5a2f', '#b98142', '#e1b46a', '#f3dfa6', '#9a9aa3', '#ececec', '#b3332b', '#e2559d', '#8b5cf6', '#22c3e0', '#2fbf71'];
  const CLOTH = ['#14141a', '#f4f4f6', '#8a8f99', '#1f3a7a', '#2f6fe0', '#36c6e0', '#1d8c4c', '#8bc34a', '#f2c94c', '#f2994a', '#d93a3a', '#e85aa0', '#8b5cf6', '#6d3a1f', '#d8c7a0', '#2b3240', '#7a1f3d', '#0f5f5c'];
  const EYEC = ['#5a3a22', '#2b1a10', '#3b7dd8', '#3a9a5a', '#7a8590', '#8b5cf6', '#b07a2a'];
  const LIPC = ['#c46a6a', '#b85767', '#d48080', '#9c4a52', '#e07a8c'];
  const OPTS = {
    body: [['slank', 'Slank'], ['normaal', 'Normaal'], ['sportief', 'Sportief'], ['breed', 'Breed'], ['curvy', 'Curvy']],
    height: [['klein', 'Klein'], ['middel', 'Middel'], ['groot', 'Groot']],
    face: [['rond', 'Rond'], ['ovaal', 'Ovaal'], ['hoekig', 'Hoekig']],
    brows: [['dun', 'Dun'], ['normaal', 'Normaal'], ['dik', 'Dik']],
    mouth: [['glimlach', '🙂 Glimlach'], ['lach', '😁 Lach'], ['neutraal', '😐 Neutraal'], ['smirk', '😏 Smirk']],
    hair: [['kort', 'Kort'], ['fade', 'Fade'], ['quiff', 'Quiff'], ['krullen', 'Krullen'], ['afro', 'Afro'], ['bob', 'Bob'], ['lang', 'Lang'], ['staart', 'Staart'], ['knot', 'Knot'], ['vlechten', 'Vlechten'], ['mohawk', 'Mohawk'], ['kaal', 'Kaal']],
    beard: [['geen', 'Geen'], ['stoppels', 'Stoppels'], ['snor', 'Snor'], ['sik', 'Sik'], ['vol', 'Volle baard']],
    top: [['tshirt', 'T-shirt'], ['hoodie', 'Hoodie'], ['jas', 'Jas'], ['hemd', 'Hemd'], ['trui', 'Trui'], ['top', 'Top'], ['jurk', 'Jurk']],
    bottom: [['jeans', 'Jeans'], ['jogging', 'Jogging'], ['chino', 'Chino'], ['short', 'Short'], ['rok', 'Rok']],
    shoes: [['sneakers', 'Sneakers'], ['boots', 'Boots'], ['hakken', 'Hakken'], ['sandalen', 'Sandalen']],
    extra: [['bril', '👓 Bril'], ['zonnebril', '🕶️ Zonnebril'], ['pet', '🧢 Pet'], ['muts', '🧶 Muts'], ['koptelefoon', '🎧 Koptelefoon'], ['oorbellen', '💎 Oorbellen'], ['ketting', '📿 Ketting'], ['horloge', '⌚ Horloge'], ['rugzak', '🎒 Rugzak'], ['sjaal', '🧣 Sjaal']]
  };
  const DEF = { body: 'normaal', height: 'middel', skin: 2, face: 'ovaal', eyes: 0, brows: 'normaal', mouth: 'glimlach', lips: 0, freckles: false, hair: 'quiff', hairC: 2, beard: 'geen', top: 'hoodie', topC: 12, top2C: 1, bottom: 'jeans', botC: 3, shoes: 'sneakers', shoeC: 1, extra: [], extraC: 0 };
  let A = load();
  function load() { try { const a = Object.assign({}, DEF, JSON.parse(localStorage[KEY] || 'null') || {}); if (!OPTS.hair.some(h => h[0] === a.hair)) a.hair = DEF.hair; return a } catch (e) { return Object.assign({}, DEF) } }
  function has() { return !!localStorage[KEY] }

  /* ===================== bouwen ===================== */
  let THREE;
  const M = {};
  function mat(c, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .62, metalness: 0 }, o)) }
  function shade(hex, f) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, f); return '#' + c.getHexString() }
  function mesh(geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], parent) { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.scale.set(...s); o.castShadow = true; if (parent) parent.add(o); return o }
  const grp = (parent, p = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(...p); if (parent) parent.add(g); return g };
  const cap = (r, l, rs = 16) => new THREE.CapsuleGeometry(r, l, 8, rs), sph = (r, w = 28, h = 20) => new THREE.SphereGeometry(r, w, h),
    cyl = (a, b, h, n = 24, open = false) => new THREE.CylinderGeometry(a, b, h, n, 1, open), box = (x, y, z) => new THREE.BoxGeometry(x, y, z),
    tor = (r, t, arc = Math.PI * 2, rs = 10, ts = 32) => new THREE.TorusGeometry(r, t, rs, ts, arc);
  const capG = (r, from, to, w = 32, h = 20) => new THREE.SphereGeometry(r, w, h, 0, Math.PI * 2, from, to);
  function lathe(points, segs = 32) { return new THREE.LatheGeometry(points.map(p => new THREE.Vector2(p[0], p[1])), segs) }

  function build(a) {
    const root = new THREE.Group(), R = {};
    const skin = mat(SKIN[a.skin], { roughness: .55 }), skinD = mat(shade(SKIN[a.skin], -.06), { roughness: .6 });
    const hair = mat(HAIRC[a.hairC], { roughness: .78 }), hairD = mat(shade(HAIRC[a.hairC], -.08), { roughness: .8 });
    const top = mat(CLOTH[a.topC], { roughness: .8 }), topD = mat(shade(CLOTH[a.topC], -.08), { roughness: .85 }), top2 = mat(CLOTH[a.top2C], { roughness: .8 });
    const bot = mat(CLOTH[a.botC], { roughness: .85 }), botD = mat(shade(CLOTH[a.botC], -.07), { roughness: .85 });
    const shoe = mat(CLOTH[a.shoeC], { roughness: .55 }), sole = mat('#f1efe9', { roughness: .7 }), dark = mat('#1a1418', { roughness: .4 });
    const white = mat('#fbfbfd', { roughness: .25 }), gold = mat('#e8c25a', { metalness: .85, roughness: .25 }), silver = mat('#cfd3da', { metalness: .9, roughness: .25 });
    const xc = mat(CLOTH[a.extraC], { roughness: .7 }), lip = mat(LIPC[a.lips || 0], { roughness: .45 });
    const W = { slank: .88, normaal: 1, sportief: 1.08, breed: 1.2, curvy: 1.04 }[a.body] || 1, H = { klein: .93, middel: 1, groot: 1.07 }[a.height] || 1;
    const HIP = a.body === 'curvy' ? 1.2 : a.body === 'sportief' ? .98 : W, CH = a.body === 'sportief' ? 1.1 : 1;
    const legL = .47 * H, shinL = .45 * H, footH = .07, hipY = footH + shinL + legL + .02;
    const longLegs = !(a.bottom === 'short' || a.bottom === 'rok' || a.top === 'jurk');
    const legMat = a.bottom === 'short' || a.bottom === 'rok' || a.top === 'jurk' ? skin : bot;

    /* heupen */
    const hips = R.hips = grp(root, [0, hipY, 0]);
    mesh(sph(.15), a.top === 'jurk' ? top : bot, [0, .02, 0], [0, 0, 0], [1.08 * HIP, .7, .8], hips);
    const tucked = a.top === 'hemd' || a.top === 'top';
    if (tucked && a.bottom !== 'rok') { mesh(cyl(.162 * HIP, .162 * HIP, .045), a.bottom === 'jogging' ? botD : dark, [0, .09, 0], [0, 0, 0], [1, 1, .78], hips); if (a.bottom === 'jeans' || a.bottom === 'chino') mesh(box(.035, .03, .01), silver, [0, .09, .127], [0, 0, 0], [1, 1, 1], hips) }

    /* benen met knieën */
    ['L', 'R'].forEach((side, i) => {
      const s = i ? 1 : -1;
      const leg = R['leg' + side] = grp(hips, [s * .085 * HIP, 0, 0]);
      mesh(cap(.07 * (a.body === 'curvy' ? 1.12 : a.body === 'breed' ? 1.1 : 1), legL - .08), legMat, [0, -legL / 2, 0], [0, 0, 0], [1, 1, 1], leg);
      if (a.bottom === 'short') mesh(cyl(.095, .092, .2, 24), bot, [0, -.08, 0], [0, 0, 0], [1, 1, 1], leg);
      const knee = R['knee' + side] = grp(leg, [0, -legL, 0]);
      mesh(sph(.062), legMat, [0, 0, 0], [0, 0, 0], [1, 1, 1], knee);
      mesh(cap(.054, shinL - .1), legMat, [0, -shinL / 2, 0], [0, 0, 0], [1, 1, 1], knee);
      if (a.bottom === 'jogging') mesh(cyl(.07, .065, .05), botD, [0, -shinL + .04, 0], [0, 0, 0], [1, 1, 1], knee);
      if (a.bottom === 'jeans' || a.bottom === 'chino') mesh(cyl(.072, .074, .045), botD, [0, -shinL + .035, 0], [0, 0, 0], [1, 1, 1], knee);
      const foot = grp(knee, [0, -shinL, 0]);
      if (a.shoes === 'boots') { mesh(cyl(.075, .08, .2), shoe, [0, -.0, 0], [0, 0, 0], [1, 1, 1], foot); mesh(box(.13, .07, .26), shoe, [0, -.05, .05], [0, 0, 0], [1, 1, 1], foot); mesh(box(.135, .025, .27), dark, [0, -.085, .05], [0, 0, 0], [1, 1, 1], foot) }
      else if (a.shoes === 'hakken') { mesh(box(.09, .05, .2), shoe, [0, -.04, .06], [-.25, 0, 0], [1, 1, 1], foot); mesh(cyl(.012, .008, .09, 8), shoe, [0, -.07, -.04], [0, 0, 0], [1, 1, 1], foot) }
      else if (a.shoes === 'sandalen') { mesh(box(.11, .02, .25), dark, [0, -.075, .05], [0, 0, 0], [1, 1, 1], foot); mesh(box(.1, .045, .14), skin, [0, -.045, .07], [0, 0, 0], [1, 1, 1], foot); mesh(box(.115, .015, .03), shoe, [0, -.03, .09], [0, 0, 0], [1, 1, 1], foot); mesh(box(.115, .015, .03), shoe, [0, -.03, .01], [0, 0, 0], [1, 1, 1], foot) }
      else {
        mesh(cap(.062, .14), shoe, [0, -.04, .05], [Math.PI / 2, 0, 0], [1.1, 1, .8], foot);
        mesh(box(.13, .03, .27), sole, [0, -.075, .05], [0, 0, 0], [1, 1, 1], foot);
        for (let k = 0; k < 3; k++) mesh(box(.07, .008, .012), white, [0, -.005 - k * .006, .07 + k * .03], [-.5, 0, 0], [1, 1, 1], foot);
        mesh(box(.02, .03, .1), mat(shade(CLOTH[a.shoeC], a.shoeC === 1 ? -.35 : .25)), [s * .066, -.04, .03], [0, 0, 0], [1, 1, 1], foot);
      }
    });
    if (a.bottom === 'rok' && a.top !== 'jurk') mesh(lathe([[.0, .12], [.17 * HIP, .12], [.2 * HIP, .0], [.27 * HIP, -.3], [0, -.3]]), bot, [0, 0, 0], [0, 0, 0], [1, 1, .85], hips);
    if (a.top === 'jurk') mesh(lathe([[.0, .12], [.17 * HIP, .12], [.21 * HIP, -.05], [.3 * HIP, -.42], [0, -.42]]), top, [0, 0, 0], [0, 0, 0], [1, 1, .85], hips);

    /* romp */
    const spine = R.spine = grp(hips, [0, .0, 0]);
    const chest = R.chest = grp(spine, [0, .4 * H, 0]);
    const torsoMat = a.top === 'top' ? skin : top;
    const bust = a.body === 'curvy' ? 1.08 : 1, wst = a.body === 'curvy' ? .86 : a.body === 'sportief' ? .9 : 1;
    const prof = [[0, -.04], [.15 * HIP, -.03], [.165 * HIP, .05], [.15 * W * wst, .17], [.152 * W * wst, .25], [.18 * W * CH * bust, .36], [.2 * W * CH, .45], [.195 * W * CH, .5], [.15 * W, .56], [.07, .6], [0, .61]].map(p => [p[0], p[1] * H]);
    mesh(lathe(prof, 40), torsoMat, [0, 0, 0], [0, 0, 0], [1, 1, .74], spine); // romp in één vloeiende vorm
    if (a.top === 'top') { mesh(lathe([[.152 * W * wst, -.14], [.18 * W * CH * bust + .006, -.04], [.2 * W * CH + .006, .05], [.19 * W * CH, .1], [0, .1]].map(p => [p[0], p[1] * H]), 40), top, [0, 0, 0], [0, 0, 0], [1.02, 1, .76], chest); [-1, 1].forEach(s => mesh(cyl(.008, .008, .2, 6), top, [s * .09 * W, .1, .1], [-.25, 0, 0], [1, 1, 1], chest)) }
    
    // nek
    mesh(cyl(.048, .058, .13), skin, [0, .22 * H, 0], [0, 0, 0], [1, 1, 1], chest);
    // kleding-details
    if (a.top === 'tshirt' || a.top === 'trui') mesh(tor(.075, .016), a.top === 'trui' ? topD : topD, [0, .18 * H, .0], [Math.PI / 2, 0, 0], [1.1, 1, 1], chest);
    if (a.top === 'trui') { mesh(cyl(.168 * HIP, .17 * HIP, .05), topD, [0, .03, 0], [0, 0, 0], [1, 1, .76], spine); for (let k = -2; k <= 2; k++) mesh(box(.012, .32, .005), topD, [k * .06 * W, .0, .152], [0, 0, 0], [1, 1, 1], chest) }
    if (a.top === 'hoodie') {
      mesh(tor(.12, .055, Math.PI * 1.25), top, [0, .17 * H, -.04], [Math.PI / 2.3, 0, Math.PI * .37], [1, 1, 1], chest);
      mesh(box(.2 * W, .11, .03), topD, [0, .13 * H, .112], [0, 0, 0], [1, 1, 1], spine);
      [-1, 1].forEach(s => { mesh(cyl(.007, .007, .16, 6), white, [s * .035, .07, .155], [.1, 0, 0], [1, 1, 1], chest); mesh(sph(.012, 8, 6), white, [s * .035, -.01, .158], [0, 0, 0], [1, 1, 1], chest) });
      mesh(cyl(.168 * HIP, .17 * HIP, .055), topD, [0, .03, 0], [0, 0, 0], [1, 1, .76], spine);
    }
    if (a.top === 'jas') {
      mesh(lathe(prof.map(p => [p[0] + .012, p[1]]), 40), top, [0, -.4 * H, -.004], [0, 0, 0], [1, 1, .76], chest);
      mesh(box(.065, .5 * H, .02), top2, [0, -.12 * H, .148], [0, 0, 0], [1, 1, 1], chest);
      [-1, 1].forEach(s => mesh(box(.035, .2, .015), topD, [s * .05, .08, .152], [0, 0, s * -.32], [1, 1, 1], chest));
      mesh(tor(.08, .028, Math.PI * 1.2, 8, 24), topD, [0, .19 * H, -.02], [Math.PI / 2, 0, -Math.PI * .1], [1.25, 1, 1], chest);
    }
    if (a.top === 'hemd') {
      for (let k = 0; k < 5; k++) mesh(sph(.011, 8, 6), white, [0, .14 - k * .085, .153 - Math.abs(k - 1) * .004], [0, 0, 0], [1, 1, .5], chest);
      [-1, 1].forEach(s => mesh(box(.07, .045, .02), top, [s * .045, .2 * H, .07], [-.4, 0, s * .45], [1, 1, 1], chest));
      mesh(box(.04, .05, .01), topD, [-.08 * W, .07, .15], [0, 0, 0], [1, 1, 1], chest);
    }
    if (a.extra.includes('sjaal')) { mesh(tor(.09, .04), xc, [0, .19 * H, 0], [Math.PI / 2, 0, 0], [1.2, 1, 1], chest); mesh(box(.07, .2, .03), xc, [.05, .05, .14], [0, 0, .1], [1, 1, 1], chest) }
    if (a.extra.includes('ketting')) mesh(tor(.085, .006, Math.PI * 2, 6, 40), gold, [0, .14 * H, .04], [Math.PI / 2.6, 0, 0], [1, 1, 1], chest);
    if (a.extra.includes('rugzak')) { mesh(cap(.12, .14), xc, [0, -.05, -.21], [0, 0, 0], [1.25 * W, 1, .6], chest); mesh(box(.16 * W, .1, .04), shade(CLOTH[a.extraC], -.1) && mat(shade(CLOTH[a.extraC], -.1)), [0, -.16, -.27], [0, 0, 0], [1, 1, 1], chest);[-1, 1].forEach(s => mesh(box(.035, .3, .02), dark, [s * .1 * W, .0, .15], [0, 0, 0], [1, 1, 1], chest)) }

    /* armen met ellebogen */
    const shortSl = a.top === 'tshirt' || a.top === 'top' || a.top === 'jurk', bare = a.top === 'top' || a.top === 'jurk';
    ['L', 'R'].forEach((side, i) => {
      const s = i ? 1 : -1;
      const sh = R['arm' + side] = grp(chest, [s * (.2 * W * CH + .02), .1, 0]);
      mesh(sph(.066), bare ? skin : top, [0, 0, 0], [0, 0, 0], [1, 1, 1], sh);
      mesh(cap(.055 * (a.body === 'sportief' ? 1.15 : 1), .22 * H), bare ? skin : (shortSl ? skin : top), [0, -.14 * H, 0], [0, 0, 0], [1, 1, 1], sh);
      if (shortSl && !bare) mesh(cyl(.068, .064, .13), top, [0, -.06, 0], [0, 0, 0], [1, 1, 1], sh);
      const el = R['elbow' + side] = grp(sh, [0, -.3 * H, 0]);
      mesh(sph(.05), shortSl ? skin : top, [0, 0, 0], [0, 0, 0], [1, 1, 1], el);
      mesh(cap(.046, .19 * H), shortSl ? skin : top, [0, -.125 * H, 0], [0, 0, 0], [1, 1, 1], el);
      if (!shortSl) mesh(cyl(.052, .05, .04), topD, [0, -.22 * H, 0], [0, 0, 0], [1, 1, 1], el);
      const hand = grp(el, [0, -.27 * H, 0]);
      mesh(sph(.044), skin, [0, -.02, 0], [0, 0, 0], [.85, 1.15, .6], hand);
      mesh(cap(.016, .05), skin, [s * -.03, -.0, .028], [.3, 0, s * .6], [1, 1, 1], hand);
      for (let k = 0; k < 4; k++) mesh(cap(.011, .035, 8), skin, [(k - 1.5) * .017, -.075 + Math.abs(k - 1.5) * .005, .005], [.15, 0, 0], [1, 1, 1], hand);
      if (side === 'L' && a.extra.includes('horloge')) { mesh(cyl(.06, .06, .03, 20), dark, [0, -.2 * H, 0], [0, 0, 0], [1, 1, 1], el); mesh(cyl(.028, .028, .012, 20), silver, [0, -.2 * H, .055], [Math.PI / 2, 0, 0], [1, 1, 1], el) }
    });

    /* hoofd */
    const head = R.head = grp(chest, [0, .345 * H, 0]); head.scale.setScalar(.7);
    const fs = { rond: [1, 1, 1], ovaal: [.94, 1.08, .98], hoekig: [1, 1.02, .96] }[a.face] || [1, 1, 1];
    mesh(sph(.2, 40, 32), skin, [0, 0, 0], [0, 0, 0], fs, head);
    mesh(sph(.16, 32, 24), skin, [0, -.08, .03], [0, 0, 0], [a.face === 'hoekig' ? 1.05 : .95, .8, .9], head); // kaak
    // oren
    [-1, 1].forEach(s => { mesh(sph(.045, 16, 12), skin, [s * .19 * fs[0], -.01, -.01], [0, s * .3, 0], [.5, 1, .8], head); mesh(sph(.025, 12, 10), skinD, [s * .2 * fs[0], -.01, .0], [0, 0, 0], [.4, .7, .6], head) });
    // neus
    mesh(cap(.022, .04), skin, [0, -.02, .2], [-.25, 0, 0], [1, 1, 1], head);
    mesh(sph(.022, 12, 10), skinD, [0, -.05, .205], [0, 0, 0], [1.3, .8, .8], head);
    // ogen met oogleden
    R.lids = [];
    [-1, 1].forEach(s => {
      const eye = grp(head, [s * .072, .03, .168]);
      mesh(sph(.038, 24, 18), white, [0, 0, 0], [0, 0, 0], [1, 1.1, .55], eye);
      mesh(sph(.024, 20, 16), mat(EYEC[a.eyes], { roughness: .2 }), [0, -.002, .018], [0, 0, 0], [1, 1, .5], eye);
      mesh(sph(.012, 12, 10), dark, [0, -.002, .027], [0, 0, 0], [1, 1, .5], eye);
      mesh(sph(.006, 8, 6), white, [s * -.008, .01, .032], [0, 0, 0], [1, 1, 1], eye);
      const lid = mesh(capG(.041, 0, Math.PI / 2, 24, 12), skin, [0, .0, .0], [-.15, 0, 0], [1, .25, .62], eye); R.lids.push(lid);
      mesh(tor(.036, .005, Math.PI * .8, 6, 16), dark, [0, .006, .012], [0, 0, Math.PI * .1], [1, 1.05, .6], eye); // wimpers
      const bw = { dun: .006, normaal: .01, dik: .016 }[a.brows] || .01;
      mesh(cap(bw, .05), hairD, [s * .075, .095, .17], [0, 0, Math.PI / 2 + s * .12], [1, 1, .7], head);
    });
    // mond
    const mo = a.mouth;
    if (mo === 'lach') { mesh(capG(.04, Math.PI / 2, Math.PI / 2, 24, 10), dark, [0, -.1, .178], [-.15, 0, 0], [1.1, .7, .5], head); mesh(box(.06, .012, .01), white, [0, -.1, .188], [0, 0, 0], [1, 1, 1], head) }
    else if (mo === 'neutraal') mesh(cap(.009, .045), lip, [0, -.1, .186], [0, 0, Math.PI / 2], [1, 1, .6], head);
    else if (mo === 'smirk') mesh(tor(.03, .009, Math.PI * .6, 8, 16), lip, [.01, -.095, .184], [0, 0, Math.PI * 1.25], [1, 1, .6], head);
    else mesh(tor(.032, .009, Math.PI * .8, 8, 20), lip, [0, -.088, .184], [0, 0, Math.PI * 1.1], [1, 1, .6], head);
    // blos en sproeten
    [-1, 1].forEach(s => mesh(sph(.03, 12, 10), mat('#ff8a8a', { transparent: true, opacity: .18 }), [s * .11, -.04, .155], [0, 0, 0], [1, .7, .3], head));
    if (a.freckles) for (let k = 0; k < 10; k++) { const s = k % 2 ? 1 : -1; mesh(sph(.004, 6, 4), mat(shade(SKIN[a.skin], -.18)), [s * (.06 + (k * 7 % 5) * .012), -.02 - (k * 3 % 4) * .01, .185], [0, 0, 0], [1, 1, 1], head) }
    // baard
    if (a.beard === 'stoppels') mesh(capG(.205, Math.PI * .52, Math.PI * .45), mat(HAIRC[a.hairC], { transparent: true, opacity: .32 }), [0, -.01, .01], [0, 0, 0], [fs[0], fs[1], fs[2]], head);
    if (a.beard === 'vol') { mesh(capG(.21, Math.PI * .66, Math.PI * .34), hair, [0, -.03, .012], [-.12, 0, 0], [fs[0] * .98, fs[1] * 1.05, fs[2]], head); mesh(sph(.06), hair, [0, -.18, .12], [0, 0, 0], [1.25, .75, .7], head) }
    if (a.beard === 'snor' || a.beard === 'vol') [-1, 1].forEach(s => mesh(cap(.014, .04), hair, [s * .025, -.068, .19], [0, 0, Math.PI / 2 + s * .25], [1, 1, .8], head));
    if (a.beard === 'sik') mesh(cap(.025, .03), hair, [0, -.15, .17], [.3, 0, 0], [1, 1, .8], head);
    // haar
    buildHair(a, head, hair, hairD, fs);
    // accessoires op het hoofd
    const ex = a.extra;
    if (ex.includes('bril') || ex.includes('zonnebril')) {
      const sun = ex.includes('zonnebril'), fm = sun ? dark : mat('#2a2a30', { roughness: .3 }), lm = sun ? mat('#101018', { metalness: .7, roughness: .08 }) : mat('#d8ecff', { transparent: true, opacity: .22, roughness: .05 });
      [-1, 1].forEach(s => { mesh(tor(.045, .007, Math.PI * 2, 8, 28), fm, [s * .072, .03, .205], [0, 0, 0], [1, .85, 1], head); mesh(new THREE.CircleGeometry(.044, 24), lm, [s * .072, .03, .206], [0, 0, 0], [1, .85, 1], head); mesh(box(.12, .008, .008), fm, [s * .16, .04, .14], [0, s * .9, 0], [1, 1, 1], head) });
      mesh(box(.04, .008, .008), fm, [0, .04, .21], [0, 0, 0], [1, 1, 1], head);
    }
    if (ex.includes('pet')) { mesh(capG(.215, 0, Math.PI / 2), xc, [0, .04, 0], [-.1, 0, 0], [fs[0] * 1.02, .95, 1.02], head); mesh(cyl(.17, .17, .015, 32), xc, [0, .07, .16], [.2, 0, 0], [1, 1, .7], head); mesh(sph(.015), mat(shade(CLOTH[a.extraC], -.15)), [0, .255, -.02], [0, 0, 0], [1, 1, 1], head) }
    if (ex.includes('muts')) { mesh(capG(.22, 0, Math.PI * .55), xc, [0, .03, 0], [-.05, 0, 0], [fs[0] * 1.02, 1.08, 1.02], head); mesh(cyl(.218, .222, .07, 32, true), mat(shade(CLOTH[a.extraC], -.08)), [0, .04, 0], [-.05, 0, 0], [fs[0], 1, 1], head); mesh(sph(.06, 16, 12), white, [0, .27, -.02], [0, 0, 0], [1, 1, 1], head) }
    if (ex.includes('koptelefoon')) { mesh(tor(.225, .018, Math.PI, 8, 32), xc, [0, .02, 0], [0, 0, 0], [fs[0], 1.1, 1], head);[-1, 1].forEach(s => { mesh(cyl(.06, .06, .05, 24), xc, [s * .215 * fs[0], -.01, 0], [0, 0, Math.PI / 2], [1, 1, 1], head); mesh(cyl(.05, .05, .02, 24), dark, [s * .24 * fs[0], -.01, 0], [0, 0, Math.PI / 2], [1, 1, 1], head) }) }
    if (ex.includes('oorbellen')) [-1, 1].forEach(s => { mesh(tor(.012, .003, Math.PI * 2, 6, 14), gold, [s * .2 * fs[0], -.05, .0], [0, Math.PI / 2, 0], [1, 1, 1], head); mesh(sph(.008, 8, 6), gold, [s * .2 * fs[0], -.065, .0], [0, 0, 0], [1, 1, 1], head) });

    root.userData.R = R; root.userData.H = H;
    return root;
  }
  function buildHair(a, head, hair, hairD, fs) {
    const S = [fs[0] * 1.03, fs[1] * 1.02, fs[2] * 1.04], hidden = a.extra.includes('muts');
    const base = (to = .5, y = .02, tilt = -.18) => mesh(capG(.207, 0, Math.PI * to), hair, [0, y, -.005], [tilt, 0, 0], S, head);
    switch (a.hair) {
      case 'kort': base(.48); mesh(capG(.2, Math.PI * .1, Math.PI * .22), hair, [0, .07, .04], [.6, 0, 0], [1, .6, 1], head); break;
      case 'fade': base(.36, .03, -.25); mesh(capG(.206, Math.PI * .3, Math.PI * .2), mat(HAIRC[a.hairC], { transparent: true, opacity: .45 }), [0, .0, 0], [0, 0, 0], S, head); break;
      case 'quiff': base(.47); mesh(cap(.07, .12), hair, [0, .19, .1], [1.2, 0, Math.PI / 2], [1.4, 1, .8], head); mesh(sph(.08), hairD, [.03, .2, .06], [0, 0, 0], [1.3, .7, 1], head); break;
      case 'krullen': base(.5); if (!hidden) for (let i = 0; i < 34; i++) { const t = i / 34 * Math.PI * 2, rr = .13 + (i % 3) * .035, h = .15 + (i % 5) * .02; mesh(sph(.055, 12, 10), i % 2 ? hair : hairD, [Math.cos(t) * rr, h, Math.sin(t) * rr - .02], [0, 0, 0], [1, 1, 1], head) } break;
      case 'afro': if (!hidden) mesh(sph(.29, 32, 24), hair, [0, .1, -.03], [0, 0, 0], [1, .9, .95], head); else base(.5); break;
      case 'bob': base(.55); mesh(cyl(.22, .24, .2, 32, true), hair, [0, -.04, -.01], [0, 0, 0], [fs[0], 1, 1], head); mesh(capG(.2, Math.PI * .08, Math.PI * .2), hairD, [0, .06, .05], [.75, 0, 0], [1.05, .7, 1], head); break;
      case 'lang': base(.55); mesh(cap(.17, .26), hair, [0, -.2, -.07], [.08, 0, 0], [1.25, 1, .55], head); [-1, 1].forEach(s => mesh(cap(.05, .22), hair, [s * .17, -.16, .04], [0, 0, s * .06], [1, 1, 1], head)); mesh(capG(.2, Math.PI * .08, Math.PI * .2), hairD, [0, .06, .05], [.75, 0, 0], [1.05, .7, 1], head); break;
      case 'staart': base(.52); { const p = grp(head, [0, .08, -.2]); mesh(sph(.035), hairD, [0, 0, 0], [0, 0, 0], [1, 1, 1], p); mesh(cap(.05, .22), hair, [0, -.13, -.04], [.35, 0, 0], [1, 1, .9], p); head.userData.tail = p } break;
      case 'knot': base(.52); if (!hidden) mesh(sph(.085, 20, 16), hair, [0, .23, -.06], [0, 0, 0], [1, .85, 1], head); break;
      case 'vlechten': base(.52); [-1, 1].forEach(s => { for (let k = 0; k < 7; k++) mesh(sph(.038, 12, 10), k % 2 ? hairD : hair, [s * .15, -.08 - k * .055, -.02 + k * .01], [0, 0, 0], [1, 1.15, 1], head); mesh(sph(.02), mat('#e85aa0'), [s * .15, -.48, .05], [0, 0, 0], [1, 1, 1], head) }); break;
      case 'mohawk': mesh(capG(.206, Math.PI * .2, Math.PI * .3), mat(HAIRC[a.hairC], { transparent: true, opacity: .4 }), [0, .01, 0], [0, 0, 0], S, head); if (!hidden) for (let i = 0; i < 8; i++) mesh(new THREE.ConeGeometry(.035, .14, 10), hair, [0, .2 - Math.abs(i - 3.5) * .012, .14 - i * .045], [-.4 + i * .1, 0, 0], [1, 1, 1], head); break;
      case 'kaal': break;
    }
  }

  /* ===================== animatie ===================== */
  function animate(fig, t, walk, wave) {
    const R = fig.userData.R; if (!R) return;
    const w = walk ? 7.5 : 0, ph = t * w;
    if (walk) {
      const sw = Math.sin(ph), sw2 = Math.sin(ph + Math.PI);
      R.legL.rotation.x = sw * .55; R.legR.rotation.x = sw2 * .55;
      R.kneeL.rotation.x = Math.max(0, -Math.sin(ph - .6)) * .9; R.kneeR.rotation.x = Math.max(0, -Math.sin(ph + Math.PI - .6)) * .9;
      R.armL.rotation.x = sw2 * .5; R.armR.rotation.x = sw * .5; R.armL.rotation.z = -.08; R.armR.rotation.z = .08;
      R.elbowL.rotation.x = -.35 - Math.max(0, sw2) * .3; R.elbowR.rotation.x = -.35 - Math.max(0, sw) * .3;
      R.hips.position.y = R.hips.userData.y + Math.abs(Math.cos(ph)) * .03 - .015; R.hips.rotation.y = sw * .08; R.spine.rotation.y = -sw * .12; R.spine.rotation.x = .05;
      R.head.rotation.y = sw * .04; R.head.rotation.x = -.03;
      if (R.head.userData.tail) R.head.userData.tail.rotation.z = Math.sin(ph) * .25;
    } else {
      const br = Math.sin(t * 1.6);
      R.legL.rotation.x = R.legR.rotation.x = 0; R.kneeL.rotation.x = R.kneeR.rotation.x = 0;
      R.armL.rotation.x = R.armR.rotation.x = br * .03; R.armL.rotation.z = -.1 - br * .015; R.armR.rotation.z = .1 + br * .015;
      R.elbowL.rotation.x = R.elbowR.rotation.x = -.12;
      R.hips.position.y = R.hips.userData.y; R.hips.rotation.y = 0; R.spine.rotation.set(0, 0, 0);
      R.chest.scale.set(1, 1 + br * .012, 1 + br * .015);
      R.head.rotation.y = Math.sin(t * .45) * .35 * (Math.sin(t * .13) > .3 ? 1 : .2); R.head.rotation.x = Math.sin(t * .7) * .04;
      if (R.head.userData.tail) R.head.userData.tail.rotation.z = Math.sin(t * 1.2) * .06;
    }
    if (wave) { const k = Math.sin(t * 9); R.armR.rotation.z = 2.6; R.armR.rotation.x = 0; R.elbowR.rotation.x = 0; R.elbowR.rotation.z = .3 + k * .35 }
    else if (R.elbowR) R.elbowR.rotation.z = 0;
    // knipperen
    const b = (t % 3.7) < .12 ? 1 : 0; R.lids.forEach(l => l.scale.y = b ? 1.05 : .25);
  }

  /* ===================== scène ===================== */
  function makeScene(transparent) {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#f1ecff', '#2a1650', 1.05));
    const key = new THREE.DirectionalLight('#fff4ea', 1.7); key.position.set(2.5, 4, 3.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = .5; key.shadow.camera.far = 12; scene.add(key);
    const rim1 = new THREE.DirectionalLight('#ff5fb4', 1.1); rim1.position.set(-3, 2.5, -2.5); scene.add(rim1);
    const rim2 = new THREE.DirectionalLight('#38d4f0', .8); rim2.position.set(3, 1.5, -3); scene.add(rim2);
    const fill = new THREE.DirectionalLight('#b8a6ff', .35); fill.position.set(-2, 1, 3); scene.add(fill);
    if (!transparent) { const floor = new THREE.Mesh(new THREE.CircleGeometry(.8, 48), new THREE.ShadowMaterial({ opacity: .35 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.name = 'floor'; scene.add(floor); const ring = new THREE.Mesh(new THREE.RingGeometry(.62, .7, 64), new THREE.MeshBasicMaterial({ color: '#a78bfa', transparent: true, opacity: .45 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .002; ring.name = 'floor'; scene.add(ring) }
    else { const sh = new THREE.Mesh(new THREE.CircleGeometry(.4, 32), new THREE.ShadowMaterial({ opacity: .45 })); sh.rotation.x = -Math.PI / 2; sh.receiveShadow = true; scene.add(sh) }
    return scene;
  }
  function newFig(scene, old) { if (old) scene.remove(old); const f = build(A); f.userData.R.hips.userData.y = f.userData.R.hips.position.y; scene.add(f); return f }

  /* ===================== maker-scherm ===================== */
  let renderer, scene, cam, fig, raf, spin = -0.4, drag = null, previewWalk = false, waveT = 0;
  const CSS = `
#avV .sheet{max-height:94vh}
#avStage{position:relative;height:330px;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 50% 78%,#4a2392 0%,#1a0f3f 45%,#0a0820 75%);touch-action:none;cursor:grab}
#avStage canvas{width:100%!important;height:100%!important;display:block}
#avStage .hint{position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:11px;color:#bfb8ef;pointer-events:none}
#avStage .acts{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:6px}
#avStage .acts button{padding:6px 10px;border-radius:10px;background:rgba(14,11,38,.75);border:1px solid rgba(167,139,250,.4);font-size:12px}
#avStage .acts button.on{background:linear-gradient(135deg,#8b5cf6,#ec4899)}
#avTabs{display:flex;gap:6px;overflow-x:auto;margin:12px 0 8px;scrollbar-width:none}#avTabs::-webkit-scrollbar{display:none}
#avTabs button{flex:none;padding:7px 12px;border-radius:999px;background:var(--card2);border:1px solid var(--line);font-size:13px}
#avTabs button.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent}
.avOpts{display:flex;flex-wrap:wrap;gap:7px;margin:6px 0 10px}
.avOpts button{padding:8px 12px;border-radius:12px;background:var(--card2);border:1px solid var(--line);font-size:13px}
.avOpts button.on{border-color:#ec4899;box-shadow:0 0 0 2px rgba(236,72,153,.35)}
.avSw{width:32px;height:32px;border-radius:50%;border:2px solid rgba(255,255,255,.15);padding:0!important}
.avSw.on{border-color:#fff!important;box-shadow:0 0 0 3px #ec4899!important}
.avLbl{font-size:12px;color:var(--mut);margin-top:6px}`;
  const TABS = [['lijf', '🧍 Lijf'], ['gezicht', '🙂 Gezicht'], ['haar', '💇 Haar'], ['kleren', '👕 Kleren'], ['schoenen', '👟 Schoenen'], ['extra', '✨ Extra']];
  let tab = 'lijf';
  function ensureDom() {
    if ($('avV')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend', `<div class="ov" id="avV"><div class="sheet"><div style="display:flex;align-items:center;margin-bottom:10px"><h3 style="flex:1">🧍 Mijn mannetje</h3><button class="ico" onclick="GLXAV.close()">✖️</button></div>
<div id="avStage"><div class="acts"><button id="avWalk">🚶 Wandel</button><button id="avWave">👋 Zwaai</button></div><div class="hint">Sleep om te draaien</div></div><div id="avTabs"></div><div id="avPanel"></div>
<div style="display:flex;gap:8px;margin-top:10px"><button class="btn ghost" style="flex:1" onclick="GLXAV.random()">🎲 Willekeurig</button><button class="btn" style="flex:2" onclick="GLXAV.save()">✅ Opslaan</button></div></div></div>`);
    $('avTabs').innerHTML = TABS.map(([k, n]) => `<button data-t="${k}">${n}</button>`).join('');
    $('avTabs').querySelectorAll('button').forEach(b => b.onclick = () => { tab = b.dataset.t; panel() });
    $('avWalk').onclick = () => { previewWalk = !previewWalk; $('avWalk').classList.toggle('on', previewWalk) };
    $('avWave').onclick = () => { waveT = performance.now() + 2200 };
    const stg = $('avStage');
    stg.addEventListener('pointerdown', e => { if (e.target.closest('.acts')) return; drag = { x: e.clientX, s: spin }; stg.setPointerCapture(e.pointerId) });
    stg.addEventListener('pointermove', e => { if (drag) spin = drag.s + (e.clientX - drag.x) / 70 });
    stg.addEventListener('pointerup', () => drag = null);
  }
  const opts = (key, list) => `<div class="avOpts">${list.map(([v, n]) => `<button class="${A[key] === v ? 'on' : ''}" onclick="GLXAV.set('${key}','${v}')">${n}</button>`).join('')}</div>`;
  const sw = (key, cols) => `<div class="avOpts">${cols.map((c, i) => `<button class="avSw ${A[key] === i ? 'on' : ''}" style="background:${c}" onclick="GLXAV.set('${key}',${i})"></button>`).join('')}</div>`;
  function panel() {
    $('avTabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const P = {
      lijf: `<div class="avLbl">Postuur</div>${opts('body', OPTS.body)}<div class="avLbl">Lengte</div>${opts('height', OPTS.height)}<div class="avLbl">Huidskleur</div>${sw('skin', SKIN)}`,
      gezicht: `<div class="avLbl">Gezichtsvorm</div>${opts('face', OPTS.face)}<div class="avLbl">Oogkleur</div>${sw('eyes', EYEC)}<div class="avLbl">Wenkbrauwen</div>${opts('brows', OPTS.brows)}<div class="avLbl">Mond</div>${opts('mouth', OPTS.mouth)}<div class="avLbl">Lipkleur</div>${sw('lips', LIPC)}<div class="avLbl">Baard</div>${opts('beard', OPTS.beard)}<div class="avOpts"><button class="${A.freckles ? 'on' : ''}" onclick="GLXAV.set('freckles',${!A.freckles})">Sproeten</button></div>`,
      haar: `<div class="avLbl">Kapsel</div>${opts('hair', OPTS.hair)}<div class="avLbl">Haarkleur</div>${sw('hairC', HAIRC)}`,
      kleren: `<div class="avLbl">Bovenstuk</div>${opts('top', OPTS.top)}<div class="avLbl">Kleur</div>${sw('topC', CLOTH)}${A.top === 'jas' ? `<div class="avLbl">Shirt onder je jas</div>${sw('top2C', CLOTH)}` : ''}<div class="avLbl">Onderstuk</div>${opts('bottom', OPTS.bottom)}<div class="avLbl">Kleur</div>${sw('botC', CLOTH)}`,
      schoenen: `<div class="avLbl">Schoenen</div>${opts('shoes', OPTS.shoes)}<div class="avLbl">Kleur</div>${sw('shoeC', CLOTH)}`,
      extra: `<div class="avLbl">Accessoires (meerdere mogelijk)</div><div class="avOpts">${OPTS.extra.map(([v, n]) => `<button class="${A.extra.includes(v) ? 'on' : ''}" onclick="GLXAV.toggle('${v}')">${n}</button>`).join('')}</div><div class="avLbl">Kleur van pet, muts, koptelefoon, rugzak, sjaal</div>${sw('extraC', CLOTH)}`
    };
    $('avPanel').innerHTML = P[tab];
  }
  async function loadThree() { if (!window.THREE) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = THREE_JS; s.onload = ok; s.onerror = no; document.head.appendChild(s) }); THREE = window.THREE }
  async function start() {
    await loadThree();
    if (!renderer) {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      scene = makeScene(false); cam = new THREE.PerspectiveCamera(28, 1, .1, 50);
    }
    const stg = $('avStage'); if (renderer.domElement.parentNode !== stg) stg.prepend(renderer.domElement);
    const fit = () => { const w = stg.clientWidth || 340, h = stg.clientHeight || 330; if (renderer.domElement.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() } };
    fig = newFig(scene, fig); fit();
    const t0 = performance.now(); cancelAnimationFrame(raf);
    const loop = now => {
      if (!$('avV').classList.contains('on')) return; const t = (now - t0) / 1000;
      if (!drag) spin += previewWalk ? .0 : .003; fig.rotation.y = previewWalk ? spin + Math.PI * 0 : spin;
      animate(fig, t, previewWalk, now < waveT);
      const hh = fig.userData.H; cam.position.set(0, 1.0 * hh, 5.4); cam.lookAt(0, .82 * hh, 0);
      fit(); renderer.render(scene, cam); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function snapshot() {
    if (!renderer || !fig) return null;
    const sc = makeScene(true), f = newFig(sc), c = new THREE.PerspectiveCamera(26, 1, .1, 50);
    f.rotation.y = -.45; animate(f, .4, false, false); f.userData.R.lids.forEach(l => l.scale.y = .25);
    const hh = f.userData.H; c.position.set(0, .95 * hh, 5.1); c.lookAt(0, .8 * hh, 0);
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(256, 256, false); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.shadowMap.enabled = true;
    r.render(sc, c); const url = r.domElement.toDataURL('image/png'); r.dispose(); return url;
  }

  /* ===================== mannetje op de kaart (live, geanimeerd) ===================== */
  let mapR, mapScene, mapCam, mapFig, mapRaf, mapState = { walk: false, heading: 0, cur: 0 };
  async function mapAvatar() {
    await loadThree();
    if (!mapR) {
      mapR = new THREE.WebGLRenderer({ antialias: true, alpha: true }); mapR.setPixelRatio(Math.min(2, devicePixelRatio || 1)); mapR.setSize(130, 190, false); mapR.outputColorSpace = THREE.SRGBColorSpace; mapR.toneMapping = THREE.ACESFilmicToneMapping; mapR.shadowMap.enabled = true;
      mapScene = makeScene(true); mapCam = new THREE.PerspectiveCamera(22, 130 / 190, .1, 50);
      mapR.domElement.style.cssText = 'width:130px;height:190px;display:block;pointer-events:none';
    }
    mapFig = newFig(mapScene, mapFig);
    const t0 = performance.now(); cancelAnimationFrame(mapRaf);
    const loop = now => {
      const t = (now - t0) / 1000, s = mapState;
      let d = s.heading - s.cur; d = Math.atan2(Math.sin(d), Math.cos(d)); s.cur += d * .15;
      mapFig.rotation.y = s.walk ? s.cur : s.cur + Math.sin(t * .3) * .2;
      animate(mapFig, t, s.walk, false);
      const hh = mapFig.userData.H; mapCam.position.set(0, 2.3 * hh, 5.4); mapCam.lookAt(0, .78 * hh, 0);
      mapR.render(mapScene, mapCam); mapRaf = requestAnimationFrame(loop);
    };
    mapRaf = requestAnimationFrame(loop);
    return { el: mapR.domElement, setWalking: w => mapState.walk = !!w, setHeading: rad => mapState.heading = rad };
  }

  const api = window.GLXAV = {
    open() { ensureDom(); panel(); document.querySelectorAll('.ov.on').forEach(o => o.classList.remove('on')); $('avV').classList.add('on'); start().catch(() => { $('avStage').innerHTML = '<p style="padding:40px;text-align:center">⚠️ 3D kon niet laden. Controleer je internet.</p>' }) },
    close() { $('avV').classList.remove('on') },
    set(k, v) { A[k] = v; if (scene) fig = newFig(scene, fig); panel() },
    toggle(v) { const i = A.extra.indexOf(v); if (i >= 0) A.extra.splice(i, 1); else { const ex = { pet: 'muts', muts: 'pet', bril: 'zonnebril', zonnebril: 'bril' }; if (ex[v]) A.extra = A.extra.filter(x => x !== ex[v]); A.extra.push(v) } if (scene) fig = newFig(scene, fig); panel() },
    random() {
      const r = a => a[Math.floor(Math.random() * a.length)], ri = n => Math.floor(Math.random() * n);
      A = { body: r(OPTS.body)[0], height: r(OPTS.height)[0], skin: ri(SKIN.length), face: r(OPTS.face)[0], eyes: ri(EYEC.length), brows: r(OPTS.brows)[0], mouth: r(OPTS.mouth)[0], lips: ri(LIPC.length), freckles: Math.random() < .2, hair: r(OPTS.hair)[0], hairC: ri(HAIRC.length), beard: Math.random() < .6 ? 'geen' : r(OPTS.beard)[0], top: r(OPTS.top)[0], topC: ri(CLOTH.length), top2C: ri(CLOTH.length), bottom: r(OPTS.bottom)[0], botC: ri(CLOTH.length), shoes: r(OPTS.shoes)[0], shoeC: ri(CLOTH.length), extra: [], extraC: ri(CLOTH.length) };
      OPTS.extra.forEach(e => { if (Math.random() < .18) api.toggle(e[0]) }); if (scene) fig = newFig(scene, fig); panel();
    },
    save() {
      try { localStorage[KEY] = JSON.stringify(A) } catch (e) { }
      const img = snapshot(); if (img) try { localStorage[IMG] = img } catch (e) { }
      if (window.ME) ME.avatar = A;
      if (mapFig && mapScene) mapFig = newFig(mapScene, mapFig);
      window.dispatchEvent(new Event('glx-avatar'));
      if (window.GLXLIVE && GLXLIVE.send) GLXLIVE.send({ t: 'avatar' });
      api.close(); try { toast('✅ Je mannetje is opgeslagen') } catch (e) { }
    },
    image() { try { return localStorage[IMG] || null } catch (e) { return null } },
    mapAvatar, config: () => A, has
  };

  function profBtn() {
    const v = $('v-profile'); if (!v) return; const old = $('avProf'); if (old) old.remove();
    const g = (window.GLXMAP && GLXMAP.state) || {}, km = ((g.walked || 0) / 1000).toFixed(1).replace('.', ',');
    const row = (i, t, n) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;font-size:13px"><span>${i} ${t}</span><b>${n}</b></div>`;
    v.insertAdjacentHTML('afterbegin', `<div id="avProf" class="box" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;background:radial-gradient(circle at 22% 60%,rgba(139,92,246,.35),transparent 60%),var(--card)">
<div onclick="GLXAV.open()" style="flex:none;width:120px;height:170px;display:grid;place-items:center;cursor:pointer">${api.image() ? `<img src="${api.image()}" style="width:170px;height:170px;object-fit:contain;margin:0 -25px">` : '<span style="font-size:64px">🧍</span>'}</div>
<div style="flex:1;min-width:0">${row('👟', 'Stappen', Math.round((g.walked || 0) / .75).toLocaleString('nl-BE'))}${row('🚶', 'Gewandeld', km + ' km')}${row('📍', 'Check-ins', g.nCheck || 0)}${row('👥', 'Groepsdates', (g.groups || []).length)}
<button class="btn sm" style="width:100%;margin-top:8px" onclick="GLXAV.open()">👕 ${has() ? 'Stijl' : 'Maak je mannetje'}</button></div></div>`);
  }
  window.addEventListener('glx-avatar', profBtn);
  (function () { const g = window.go; if (typeof g === 'function') window.go = function (v) { const r = g.apply(this, arguments); if (v === 'profile') profBtn(); return r } })();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', profBtn); else profBtn();
})();
