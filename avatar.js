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
    a_anime: { vrm: 'Anime_A', n: 'Vrouw', g: 'f', hairLbl: 'Haarkleur', skinM: ['Body_00_SKIN', 'Face_00_SKIN'], hairM: ['Hair_00_HAIR', 'HairBack_00_HAIR'], eyeM: ['EyeIris_00_EYE'], browM: ['FaceBrow_00_FACE'], hairDef: '#8a5a3c', face: { m: 'Face_00_SKIN', r: [.34, .54, .655, .75] }, hsDef: 'Lang', backM: ['HairBack_00_HAIR'], allHair: ['Hair_00_HAIR', 'HairBack_00_HAIR'], parts: [['Top', 'Tops_01_CLOTH'], ['Broekje', 'Bottoms_01_CLOTH'], ['Schoenen', 'Shoes_01_CLOTH']], prints: [['Top', 'Tops_01_CLOTH', 'top', null, 0], ['Broekje', 'Bottoms_01_CLOTH', 'bot', null, 0, 1]], eyes: true },
    a_boy: { vrm: 'Anime_B', n: 'Man', g: 'm', hairLbl: 'Haarkleur', skinM: ['body_bake'], hairM: ['hair'], eyeM: ['eye'], hairDef: '#2b2b30', face: { m: 'body_bake', r: [.26, .48, .405, .58] }, hsDef: 'Kort', backM: [], allHair: ['hair'], skinFix: { m: 'body_bake', rects: [[.57, 0, 1, .33], [.73, .42, 1, .67]], tone: [238, 205, 186] }, hide: /backpack|^arm_|armgear|anim_logo|green_emit|robo_face|glass/i, armZ: 1.36, shoes: 1, parts: [['Kleren', 'huku_bake'], ['Schoenen', 'glx_shoe']], prints: [['Shirt', 'huku_bake', 'top', [[0, .05, .24, .46], [.24, .05, .48, .46]], .5], ['Broek', 'huku_bake', 'bot', [[0, .46, .62, .95]], .5]], eyes: true },
  };
  const SKIN = ['#fff1e8', '#fbe3d0', '#efd2bc', '#dcb08a', '#c49270', '#9a6a4a', '#734a32', '#2e1c10', '#ffd6e8', '#cde8ff', '#d6f5d6', '#e6d9ff', '#b8c7d9', '#9fd4c4', '#fde7da', '#f8d9c4', '#f5cfb3', '#f1c7a5', '#e8b98f', '#e0ac85', '#d29b70', '#c98f66', '#b57d55', '#a56f48', '#8f5c3a', '#7d4f30', '#6a4128', '#5a3620', '#4a2c1a', '#3b2314'];
  const HAIRC = ['#17120f', '#3a2618', '#6b4226', '#a8703a', '#d8b46a', '#f2e3b0', '#b8402a', '#8e9099', '#f5f5f5', '#ec4899', '#3b82f6', '#22c55e', '#8b5cf6', '#0f172a', '#4a3728', '#c2410c', '#e11d48', '#f9a8d4', '#a78bfa', '#7c3aed', '#14b8a6', '#06b6d4', '#facc15', '#9ca3af'];
  const CLOTH = ['#7f1d1d', '#b91c1c', '#c2410c', '#a16207', '#3f6212', '#0f766e', '#0e7490', '#1e3a8a', '#4c1d95', '#701a75', '#fde2e4', '#fbcfe8', '#ddd6fe', '#bfdbfe', '#bbf7d0', '#fef08a', '#fed7aa', '#f8fafc', '#cbd5e1', '#64748b', '#1f2937', '#0b0a1f', '#ef4444', '#f97316', '#fbbf24', '#84cc16', '#16a34a', '#14b8a6', '#38bdf8', '#2563eb', '#8b5cf6', '#ec4899', '#9d174d', '#92400e', '#d6b48a'];
  const EYES = ['#000000', '#5b3a29', '#a3e635', '#22d3ee', '#f472b6', '#fb923c', '#fde047', '#ffffff', '#64748b', '#4ade80', '#c084fc', '#3b2314', '#6b4226', '#2563eb', '#38bdf8', '#16a34a', '#8b5cf6', '#ec4899', '#ef4444', '#fbbf24', '#8e9099', '#0f172a', '#92400e', '#d97706', '#65a30d', '#0d9488', '#1e3a8a', '#7c3aed', '#be123c', '#e5e7eb'];
  const PAL = ['#111827', '#374151', '#6b7280', '#d1d5db', '#ffffff', '#7f1d1d', '#b91c1c', '#ef4444', '#fb7185', '#fda4af', '#9d174d', '#db2777', '#f472b6', '#fbcfe8', '#7c2d12', '#c2410c', '#f97316', '#fdba74', '#a16207', '#eab308', '#fde047', '#3f6212', '#16a34a', '#4ade80', '#0f766e', '#14b8a6', '#0e7490', '#38bdf8', '#1e3a8a', '#2563eb', '#93c5fd', '#4c1d95', '#7c3aed', '#a78bfa', '#c4b5fd', '#d6b48a', '#92400e'];
  const FACEX = { blos: [['', 'Geen'], ['#f9a8b8', 'Roze'], ['#fb7185', 'Rood'], ['#fdba74', 'Perzik'], ['#c084fc', 'Paars']], sproet: [['', 'Geen'], ['licht', 'Licht'], ['veel', 'Veel']],
    shadow: [['', 'Geen'], ['#a78bfa', 'Paars'], ['#f9a8d4', 'Roze'], ['#93c5fd', 'Blauw'], ['#d4a373', 'Bruin'], ['#fde68a', 'Goud'], ['#4ade80', 'Groen'], ['#111827', 'Smoky']], lip: [['', 'Naturel'], ['#e11d48', 'Rood'], ['#f472b6', 'Roze'], ['#9f1239', 'Bordeaux'], ['#c08457', 'Nude'], ['#7c3aed', 'Paars'], ['#111827', 'Zwart'], ['#fb923c', 'Koraal']],
    baard: [['', 'Geen'], ['snor', 'Snor'], ['sik', 'Sik'], ['kort', 'Korte baard'], ['baard', 'Volle baard'], ['snorsik', 'Snor + sik'], ['kin', 'Kinbaardje'], ['bakken', 'Bakkebaarden'], ['hoef', 'Hoefijzersnor'], ['lang', 'Lange baard']], deco: [['', 'Geen'], ['moedervlek', 'Moedervlek'], ['ster', 'Sterretje'], ['hart', 'Hartje'], ['glitter', 'Glitter'], ['pleister', 'Pleister'], ['moedervlek2', 'Moedervlek lip'], ['traan', 'Traantje'], ['bliksem', 'Bliksem'], ['maan', 'Maantje'], ['kruis', 'Kruisje'], ['sterren', 'Sterretjes'], ['hartjes', 'Hartjes'], ['streep', 'Strepen'], ['verf', 'Oorlogsverf'], ['vlinder', 'Vlinder'], ['sproet2', 'Neus-sproetjes'], ['punt', 'Bindi'], ['katoog', 'Eyeliner']], oog: [['.85', 'Klein'], ['', 'Normaal'], ['1.15', 'Groot'], ['1.3', 'Extra groot']] };
  const BODYX = { len: [['.82', 'Mini'], ['.85', 'Piepklein'], ['.88', 'Heel klein'], ['.9', 'Erg klein'], ['.92', 'Klein'], ['.96', 'Iets kleiner'], ['', 'Normaal'], ['1.04', 'Iets groter'], ['1.08', 'Groot'], ['1.1', 'Erg groot'], ['1.12', 'Heel groot'], ['1.15', 'Reus']], hoofd: [['.82', 'Mini'], ['.85', 'Heel klein'], ['.88', 'Klein'], ['.94', 'Kleiner'], ['', 'Normaal'], ['1.06', 'Groter'], ['1.12', 'Groot'], ['1.16', 'Heel groot'], ['1.2', 'Chibi']] };
  const FACES = [['neutral', '🙂 Gewoon'], ['happy', '😄 Blij'], ['smile', '🙂 Glimlach'], ['grin', '😁 Grote lach'], ['relaxed', '😌 Relaxed'], ['surprised', '😮 Verrast'], ['shock', '😱 Geschrokken'], ['sad', '🥺 Verlegen'], ['cry', '😢 Verdrietig'], ['wink', '😉 Knipoog'], ['winkR', '😜 Knipoog rechts'], ['angry', '😤 Stoer'], ['mad', '😠 Boos'], ['ohh', '😗 Kusje'], ['pout', '😙 Pruillip'], ['sleep', '😴 Slaperig'], ['closed', '😌 Ogen dicht'], ['dreamy', '🥰 Verliefd'], ['smug', '😏 Zelfzeker'], ['cheeky', '😋 Ondeugend'], ['ah', '😃 Ah!'], ['ee', '😬 Oeps'], ['ih', '😊 Lief'], ['oh', '😲 Oh!'], ['talk', '🗣️ Pratend'], ['cool', '😎 Cool'], ['shy', '☺️ Schattig'], ['meh', '😐 Meh'], ['tired', '😩 Moe'], ['up', '🙄 Ogen omhoog'], ['down', '😔 Naar beneden']];

  /* kleding-prints: patroon over de stof-textuur (vermenigvuldigen, zodat de kleurkeuze blijft werken) */
  const MERCH = [['glx1', 'Galaxy logo'], ['glx2', 'Klein logo'], ['glx3', 'GALAXY'], ['glx4', 'Retro planeet'], ['glx5', 'Find your galaxy'], ['glx6', 'Galaxy club'], ['glx7', 'Sterrenstof'], ['glx8', 'Neon Galaxy']];
  const PRINTS0 = [['', 'Effen'], ['streep', 'Strepen'], ['breton', 'Marinière'], ['ruit', 'Ruitjes'], ['logo', 'Galaxy-logo'], ['hart', 'Hartjes'], ['sterren', 'Sterrenhemel'], ['camo', 'Camouflage'], ['tie', 'Tie-dye'], ['stip', 'Stippen'], ['luipaard', 'Luipaard'], ['zebra', 'Zebra'], ['bloem', 'Bloemen'], ['regenboog', 'Regenboog'], ['nummer', 'Nummer 10'], ['smiley', 'Smiley'], ['bliksem', 'Bliksem'], ['galaxy', 'Galaxy'], ['jeans', 'Jeans'], ['zwartjeans', 'Zwarte jeans'], ['sportstreep', 'Sportstreep'], ['gingham', 'Picknickruit'], ['schaak', 'Dambord'], ['diagonaal', 'Diagonaal'], ['zigzag', 'Zigzag'], ['golf', 'Golven'], ['verloop', 'Zonsondergang'], ['neon', 'Neon'], ['vlam', 'Vlammen'], ['kers', 'Kersen'], ['love', 'LOVE'], ['be', 'België'], ['ster1', 'Grote ster'], ['hart1', 'Groot hart'], ['palm', 'Palmbomen'], ['pixel', 'Pixels'], ['marmer', 'Marmer']];
  const PRINTS = { top: PRINTS0.concat(MERCH), bot: [['', 'Effen'], ['jeans', 'Jeans'], ['zwartjeans', 'Zwarte jeans'], ['sportstreep', 'Sportstreep']].concat(PRINTS0.filter(x => !['', 'jeans', 'zwartjeans', 'sportstreep', 'logo', 'nummer', 'smiley', 'love', 'ster1', 'hart1'].includes(x[0]))) };
  function rnd(seed) { let x = seed || 7; return () => (x = (x * 16807) % 2147483647) / 2147483647 }
  function glxLogo(c, cx, cy, R) {
    c.save(); const g = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, '#a78bfa'); g.addColorStop(.55, '#7c3aed'); g.addColorStop(1, '#ec4899');
    c.lineWidth = R * .16; c.strokeStyle = '#f9a8d4'; c.beginPath(); c.ellipse(cx, cy, R * 1.55, R * .45, -.35, Math.PI * .95, Math.PI * 2.05); c.stroke();
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(cx - R * .35, cy - R * .35, R * .28, 0, 7); c.fill();
    c.beginPath(); c.ellipse(cx, cy, R * 1.55, R * .45, -.35, Math.PI * .05, Math.PI * .95); c.stroke(); c.restore();
  }
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
    else if (kind.indexOf('fx:') === 0) {
      const [, typ, val] = kind.split(':'), [ax, ay, bx, my] = rect, L = { x: ax * W, y: ay * H }, Rr = { x: bx * W, y: ay * H }, sp = Rr.x - L.x, d = my * H - L.y, cx = (L.x + Rr.x) / 2, rg = (x, y, rx, ry, col, a) => { c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, 7); c.fill(); c.restore() };
      c.restore(); c.save();
      if (typ === 'blos') [L, Rr].forEach(e => rg(e.x + (e === L ? -1 : 1) * sp * .06, e.y + d * .5, sp * .26, sp * .16, val, .55));
      if (typ === 'shadow') [L, Rr].forEach(e => rg(e.x, e.y - d * .2, sp * .3, sp * .17, val, .6));
      if (typ === 'lip') { c.globalAlpha = .75; c.fillStyle = val; c.beginPath(); c.ellipse(cx, my * H, sp * .13, sp * .045, 0, 0, 7); c.fill(); c.globalAlpha = 1 }
      if (typ === 'deco') { const cheek = { x: Rr.x + sp * .05, y: L.y + d * .55 };
        if (val === 'moedervlek') { c.fillStyle = '#3b2314'; c.beginPath(); c.arc(cheek.x + sp * .08, my * H - d * .05, sp * .025, 0, 7); c.fill() }
        if (val === 'ster') { c.fillStyle = '#7c3aed'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? sp * .035 : sp * .085; c.lineTo(cheek.x + Math.cos(a) * q, cheek.y + Math.sin(a) * q) } c.fill() }
        if (val === 'hart') { const x = cheek.x, y = cheek.y, q = sp * .05; c.fillStyle = '#e11d48'; c.beginPath(); c.moveTo(x, y + q); c.bezierCurveTo(x - 2 * q, y - q * .6, x - q * .4, y - 2 * q, x, y - q * .7); c.bezierCurveTo(x + q * .4, y - 2 * q, x + 2 * q, y - q * .6, x, y + q); c.fill() }
        if (val === 'glitter') for (let i = 0; i < 60; i++) { const sd = i % 2 ? 1 : -1; c.fillStyle = ['#a78bfa', '#f0abfc', '#93c5fd', '#fde047'][i % 4]; c.fillRect(cx + sd * sp * (.35 + r() * .3), L.y + d * (.1 + r() * .35), sp * .015, sp * .015) }
        if (val === 'moedervlek2') { c.fillStyle = '#3b2314'; c.beginPath(); c.arc(cx + sp * .16, my * H - d * .12, sp * .022, 0, 7); c.fill() }
        if (val === 'traan') { c.fillStyle = '#38bdf8'; c.beginPath(); const x = L.x - sp * .02, y = L.y + d * .4; c.moveTo(x, y - sp * .05); c.quadraticCurveTo(x + sp * .04, y + sp * .02, x, y + sp * .03); c.quadraticCurveTo(x - sp * .04, y + sp * .02, x, y - sp * .05); c.fill() }
        if (val === 'bliksem') { c.fillStyle = '#facc15'; c.beginPath(); const x = cheek.x, y = cheek.y, q = sp * .08; [[.15, -1], [-.45, .1], [-.05, .1], [-.2, 1], [.45, -.15], [.05, -.15], [.25, -1]].forEach(([a, b], i) => i ? c.lineTo(x + a * q, y + b * q) : c.moveTo(x + a * q, y + b * q)); c.fill() }
        if (val === 'maan') { c.fillStyle = '#7c3aed'; c.beginPath(); c.arc(cheek.x, cheek.y, sp * .06, .6, Math.PI * 2 - .6); c.arc(cheek.x + sp * .03, cheek.y, sp * .05, Math.PI * 2 - .9, .9, true); c.fill() }
        if (val === 'kruis') { c.strokeStyle = '#111827'; c.lineWidth = sp * .02; c.beginPath(); c.moveTo(cheek.x - sp * .04, cheek.y - sp * .04); c.lineTo(cheek.x + sp * .04, cheek.y + sp * .04); c.moveTo(cheek.x + sp * .04, cheek.y - sp * .04); c.lineTo(cheek.x - sp * .04, cheek.y + sp * .04); c.stroke() }
        if (val === 'sterren' || val === 'hartjes') for (let i = 0; i < 3; i++) { const x = cheek.x + (i - 1) * sp * .07, y = cheek.y + (i % 2) * sp * .06, q = sp * .025; c.fillStyle = val === 'sterren' ? '#facc15' : '#e11d48'; c.beginPath(); if (val === 'sterren') { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? q * .45 : q; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) } } else { c.moveTo(x, y + q); c.bezierCurveTo(x - 2 * q, y - q * .6, x - q * .4, y - 2 * q, x, y - q * .7); c.bezierCurveTo(x + q * .4, y - 2 * q, x + 2 * q, y - q * .6, x, y + q) } c.fill() }
        if (val === 'streep') [L, Rr].forEach(e => { c.fillStyle = '#111827'; for (let i = 0; i < 2; i++) c.fillRect(e.x - sp * .1, e.y + d * (.42 + i * .12), sp * .2, sp * .022) })
        if (val === 'verf') { c.fillStyle = '#dc2626'; c.fillRect(L.x - sp * .25, L.y + d * .3, Rr.x - L.x + sp * .5, sp * .05) }
        if (val === 'vlinder') { c.fillStyle = '#c084fc'; const x = cheek.x, y = cheek.y, q = sp * .05; [[-1, -1], [1, -1], [-.7, .8], [.7, .8]].forEach(([a, b]) => { c.beginPath(); c.ellipse(x + a * q * .7, y + b * q * .6, q * .6, q * .45, a * b * .5, 0, 7); c.fill() }) }
        if (val === 'sproet2') for (let i = 0; i < 26; i++) { c.fillStyle = 'rgba(150,90,50,.6)'; c.beginPath(); c.arc(cx + (r() - .5) * sp * .5, L.y + d * (.3 + r() * .2), sp * .01, 0, 7); c.fill() }
        if (val === 'punt') { c.fillStyle = '#b91c1c'; c.beginPath(); c.arc(cx, L.y - d * .38, sp * .025, 0, 7); c.fill() }
        if (val === 'katoog') [L, Rr].forEach(e => { c.strokeStyle = '#111827'; c.lineWidth = sp * .018; c.beginPath(); const sd = e === L ? -1 : 1; c.moveTo(e.x - sd * sp * .1, e.y - d * .2); c.quadraticCurveTo(e.x + sd * sp * .1, e.y - d * .25, e.x + sd * sp * .2, e.y - d * .35); c.stroke() })
        if (val === 'pleister') { c.save(); c.translate(cheek.x, cheek.y + d * .05); c.rotate(-.5); c.fillStyle = '#e8c39e'; c.fillRect(-sp * .12, -sp * .035, sp * .24, sp * .07); c.fillStyle = '#d6a77a'; c.fillRect(-sp * .04, -sp * .035, sp * .08, sp * .07); c.restore() } }
      if (typ === 'sproet') { const n = val === 'veel' ? 70 : 32; for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1, x = cx + side * sp * (.1 + r() * .55), y = L.y + d * (.25 + r() * .4); c.fillStyle = 'rgba(150,90,50,.55)'; c.beginPath(); c.arc(x, y, sp * (.008 + r() * .01), 0, 7); c.fill() } }
      if (typ === 'baard') { const col = val.split('|')[1] || '#2a1d14', v = val.split('|')[0];
        if (v === 'snorsik' || v === 'kin' || v === 'bakken' || v === 'hoef' || v === 'lang') { c.save(); c.filter = 'blur(2px)'; c.globalAlpha = .9; c.fillStyle = col;
          if (v === 'snorsik' || v === 'hoef') { c.beginPath(); c.ellipse(cx, my * H - d * .17, sp * .19, d * .065, 0, 0, 7); c.fill() }
          if (v === 'snorsik') { c.beginPath(); c.ellipse(cx, my * H + d * .3, sp * .11, d * .22, 0, 0, 7); c.fill() }
          if (v === 'hoef') [-1, 1].forEach(sx => c.fillRect(cx + sx * sp * .17 - sp * .025, my * H - d * .2, sp * .05, d * .55));
          if (v === 'kin') { c.beginPath(); c.ellipse(cx, my * H + d * .45, sp * .18, d * .13, 0, 0, 7); c.fill() }
          if (v === 'bakken') [L, Rr].forEach(e => { const sd = e === L ? -1 : 1; c.fillRect(e.x + sd * sp * .32 - sp * .05, e.y - d * .1, sp * .1, d * .8) });
          if (v === 'lang') { c.beginPath(); c.ellipse(cx, my * H + d * .4, sp * .6, d * 1.0, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.ellipse(cx, my * H + d * .02, sp * .15, d * .1, 0, 0, 7); c.fill() }
          c.restore() }
        if (v === 'kort') { c.save(); c.beginPath(); c.rect(0, my * H - d * .1, W, H); c.clip(); c.filter = `blur(${Math.round(sp * .03)}px)`; c.globalAlpha = .75; c.fillStyle = col; c.beginPath(); c.ellipse(cx, my * H + d * .2, sp * .5, d * .5, 0, 0, 7); c.fill(); c.restore(); c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.ellipse(cx, my * H + d * .02, sp * .14, d * .09, 0, 0, 7); c.fill(); c.restore() }
        if (v === 'stop' || v === 'baard') { c.save(); c.beginPath(); c.rect(0, my * H - d * .32, W, H); c.clip(); c.filter = `blur(${Math.round(sp * (v === 'baard' ? .025 : .05))}px)`; c.globalAlpha = v === 'baard' ? .92 : .24; c.fillStyle = col; c.beginPath(); c.ellipse(cx, my * H + d * .12, sp * .64, d * .78, 0, 0, 7); c.fill(); c.restore(); c.save(); c.globalCompositeOperation = 'destination-out'; c.filter = 'blur(2px)'; c.beginPath(); c.ellipse(cx, my * H + d * .02, sp * .15, d * .1, 0, 0, 7); c.fill(); c.restore() }
        if (v === 'snor' || v === 'baard') { c.save(); c.filter = 'blur(2px)'; c.globalAlpha = .9; c.fillStyle = col; c.beginPath(); c.ellipse(cx, my * H - d * .17, sp * .19, d * .07, 0, 0, 7); c.fill(); c.restore() }
        if (v === 'sik') { c.save(); c.filter = 'blur(2px)'; c.globalAlpha = .9; c.fillStyle = col; c.beginPath(); c.ellipse(cx, my * H + d * .3, sp * .11, d * .22, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(cx, my * H - d * .17, sp * .17, d * .06, 0, 0, 7); c.fill(); c.restore() } }
    }
    else if (kind === 'stip') { c.fillStyle = '#1f2937'; for (let y = Y + 14 * u, row = 0; y < Y + h; y += 44 * u, row++) for (let x = X + (row % 2 ? 22 : 0) * u; x < X + w; x += 44 * u) { c.beginPath(); c.arc(x, y, 8 * u, 0, 7); c.fill() } }
    else if (kind === 'luipaard') { fill('#e9b872', X, Y, w, h); for (let i = 0; i < 420; i++) { const x = X + r() * w, y = Y + r() * h, s = (8 + r() * 10) * u; c.fillStyle = '#7c4a1e'; c.beginPath(); c.ellipse(x, y, s, s * .8, r() * 3, 0, 7); c.fill(); c.strokeStyle = '#1c1206'; c.lineWidth = 4 * u; c.beginPath(); c.arc(x, y, s * 1.1, r() * 3, r() * 3 + 3.5); c.stroke() } }
    else if (kind === 'zebra') { c.strokeStyle = '#111'; c.lineCap = 'round'; for (let y = Y; y < Y + h; y += 34 * u) { c.lineWidth = (8 + r() * 10) * u; c.beginPath(); c.moveTo(X, y); for (let x = X; x <= X + w; x += 40 * u) c.lineTo(x, y + Math.sin(x / (60 * u) + y) * 14 * u); c.stroke() } }
    else if (kind === 'bloem') { const cols = ['#f472b6', '#facc15', '#60a5fa', '#f87171', '#a78bfa']; for (let i = 0; i < 90; i++) { const x = X + r() * w, y = Y + r() * h, s = (9 + r() * 8) * u; c.fillStyle = cols[i % 5]; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x + Math.cos(k * 1.257) * s, y + Math.sin(k * 1.257) * s, s * .7, 0, 7); c.fill() } c.fillStyle = '#fde047'; c.beginPath(); c.arc(x, y, s * .5, 0, 7); c.fill() } }
    else if (kind === 'regenboog') { const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6']; cols.forEach((cc, i) => fill(cc, X, Y + i * h / 6, w, h / 6 + 1)) }
    else if (kind === 'zwartjeans') { fill('#3a3f4b', X, Y, w, h); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2 * u; for (let i = -h; i < w; i += 7 * u) { c.beginPath(); c.moveTo(X + i, Y); c.lineTo(X + i + h, Y + h); c.stroke() } }
    else if (kind === 'galaxy') { const g = c.createRadialGradient(X + w * .3, Y + h * .4, 0, X + w * .5, Y + h * .5, Math.max(w, h) * .7); g.addColorStop(0, '#f0abfc'); g.addColorStop(.35, '#7c3aed'); g.addColorStop(.7, '#1e1b4b'); g.addColorStop(1, '#020617'); c.fillStyle = g; c.fillRect(X, Y, w, h); for (let i = 0; i < 500; i++) { c.fillStyle = '#fff'; const s = (r() < .08 ? 3.5 : 1.3) * u; c.fillRect(X + r() * w, Y + r() * h, s, s) } }
    else if (kind === 'nummer' || kind === 'smiley' || kind === 'bliksem') { const cx = X + w / 2, cy = Y + h * .45, R = Math.min(w, h) * .22;
      if (kind === 'nummer') { c.font = `900 ${R * 1.8}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#b91c1c'; c.fillText('10', cx, cy) }
      if (kind === 'smiley') { c.fillStyle = '#facc15'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.fillStyle = '#1f2937'; c.beginPath(); c.arc(cx - R * .35, cy - R * .2, R * .12, 0, 7); c.arc(cx + R * .35, cy - R * .2, R * .12, 0, 7); c.fill(); c.lineWidth = R * .1; c.strokeStyle = '#1f2937'; c.beginPath(); c.arc(cx, cy, R * .55, .3, Math.PI - .3); c.stroke() }
      if (kind === 'bliksem') { c.fillStyle = '#facc15'; c.beginPath(); [[.15, -1], [-.45, .1], [-.05, .1], [-.2, 1], [.45, -.15], [.05, -.15], [.25, -1]].forEach(([a, b], i) => i ? c.lineTo(cx + a * R, cy + b * R) : c.moveTo(cx + a * R, cy + b * R)); c.fill() } }
    else if (kind === 'sportstreep') { [X + w * .12, X + w * .82].forEach(x => { fill('#ffffff', x, Y, 14 * u, h); fill('#ffffff', x + 22 * u, Y, 14 * u, h) }); c.globalCompositeOperation = 'source-over' }
    else if (kind === 'gingham') { c.globalAlpha = .45; for (let x = X; x < X + w; x += 40 * u) fill('#dc2626', x, Y, 20 * u, h); for (let y = Y; y < Y + h; y += 40 * u) fill('#dc2626', X, y, w, 20 * u); c.globalAlpha = 1 }
    else if (kind === 'schaak') { for (let y = Y, i = 0; y < Y + h; y += 40 * u, i++) for (let x = X + (i % 2) * 40 * u; x < X + w; x += 80 * u) fill('#1f2937', x, y, 40 * u, 40 * u) }
    else if (kind === 'diagonaal') { c.strokeStyle = '#334155'; c.lineWidth = 14 * u; for (let i = -h; i < w; i += 46 * u) { c.beginPath(); c.moveTo(X + i, Y + h); c.lineTo(X + i + h, Y); c.stroke() } }
    else if (kind === 'zigzag') { c.strokeStyle = '#7c3aed'; c.lineWidth = 9 * u; for (let y = Y; y < Y + h; y += 40 * u) { c.beginPath(); for (let x = X, k = 0; x <= X + w; x += 20 * u, k++) c.lineTo(x, y + (k % 2) * 16 * u); c.stroke() } }
    else if (kind === 'golf') { c.strokeStyle = '#0ea5e9'; c.lineWidth = 8 * u; for (let y = Y; y < Y + h; y += 34 * u) { c.beginPath(); for (let x = X; x <= X + w; x += 6 * u) c.lineTo(x, y + Math.sin(x / (18 * u)) * 9 * u); c.stroke() } }
    else if (kind === 'verloop') { const g = c.createLinearGradient(X, Y, X, Y + h); g.addColorStop(0, '#fde047'); g.addColorStop(.45, '#fb923c'); g.addColorStop(.75, '#ec4899'); g.addColorStop(1, '#7c3aed'); c.fillStyle = g; c.fillRect(X, Y, w, h) }
    else if (kind === 'neon') { fill('#0b0a1f', X, Y, w, h); ['#22d3ee', '#f472b6', '#a3e635'].forEach((cc, i) => { c.strokeStyle = cc; c.lineWidth = 6 * u; for (let y = Y + i * 30 * u; y < Y + h; y += 90 * u) { c.beginPath(); c.moveTo(X, y); c.lineTo(X + w, y + 40 * u); c.stroke() } }) }
    else if (kind === 'vlam') { const g = c.createLinearGradient(X, Y + h, X, Y + h * .4); g.addColorStop(0, '#dc2626'); g.addColorStop(.6, '#f97316'); g.addColorStop(1, '#facc15'); c.fillStyle = g; c.beginPath(); c.moveTo(X, Y + h); for (let x = X; x <= X + w; x += 30 * u) c.lineTo(x, Y + h * (.4 + .25 * r())); c.lineTo(X + w, Y + h); c.fill() }
    else if (kind === 'kers') { for (let i = 0; i < 70; i++) { const x = X + r() * w, y = Y + r() * h, q = 7 * u; c.fillStyle = '#dc2626'; c.beginPath(); c.arc(x, y, q, 0, 7); c.arc(x + q * 1.8, y + q * .3, q, 0, 7); c.fill(); c.strokeStyle = '#15803d'; c.lineWidth = 2 * u; c.beginPath(); c.moveTo(x, y - q); c.lineTo(x + q, y - q * 3); c.lineTo(x + q * 1.8, y - q * .7); c.stroke() } }
    else if (kind === 'love' || kind === 'be') { const cx = X + w / 2, cy = Y + h * .42, R = Math.min(w, h) * .22; if (kind === 'love') { c.font = `900 ${R * 1.1}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e11d48'; c.fillText('LOVE', cx, cy) } else { ['#111827', '#facc15', '#dc2626'].forEach((cc, i) => fill(cc, cx - R * 1.2 + i * R * .8, cy - R * .8, R * .8, R * 1.6)) } }
    else if (kind === 'ster1' || kind === 'hart1') { const cx = X + w / 2, cy = Y + h * .42, R = Math.min(w, h) * .26; c.fillStyle = kind === 'ster1' ? '#facc15' : '#e11d48'; c.beginPath(); if (kind === 'ster1') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .45 : R; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) } } else { const q = R * .55; c.moveTo(cx, cy + q * 1.4); c.bezierCurveTo(cx - 2.2 * q, cy - q * .2, cx - q * .6, cy - 2 * q, cx, cy - q * .6); c.bezierCurveTo(cx + q * .6, cy - 2 * q, cx + 2.2 * q, cy - q * .2, cx, cy + q * 1.4) } c.fill() }
    else if (kind === 'palm') { for (let i = 0; i < 26; i++) { const x = X + r() * w, y = Y + r() * h, q = 18 * u; c.strokeStyle = '#7c4a1e'; c.lineWidth = 4 * u; c.beginPath(); c.moveTo(x, y + q * 1.5); c.quadraticCurveTo(x + q * .3, y + q * .5, x, y); c.stroke(); c.fillStyle = '#16a34a'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + Math.cos(k * 1.26) * q * .6, y + Math.sin(k * 1.26) * q * .35 - q * .1, q * .6, q * .15, k * 1.26, 0, 7); c.fill() } } }
    else if (kind === 'pixel') { const cols = ['#22d3ee', '#a78bfa', '#f472b6', '#fde047', '#4ade80', '#ffffff']; for (let y = Y; y < Y + h; y += 24 * u) for (let x = X; x < X + w; x += 24 * u) { c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(x, y, 23 * u, 23 * u) } }
    else if (kind === 'marmer') { fill('#f1f5f9', X, Y, w, h); c.strokeStyle = 'rgba(100,116,139,.6)'; for (let i = 0; i < 40; i++) { c.lineWidth = (1 + r() * 3) * u; c.beginPath(); let x = X + r() * w, y = Y + r() * h; c.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - .3) * 60 * u; y += (r() - .5) * 40 * u; c.lineTo(x, y) } c.stroke() } }
    else if (/^glx\d/.test(kind)) { const cx = X + w / 2, cy = Y + h * .4, R = Math.min(w, h) * .14, txt = (t, y, sz, col, f) => { c.font = `${f || 900} ${sz}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(t, cx, y) };
      if (kind === 'glx1') { glxLogo(c, cx, cy - R * .3, R); txt('GALAXY', cy + R * 1.6, R * .75, '#4c1d95') }
      if (kind === 'glx2') { glxLogo(c, X + w * .3, Y + h * .3, R * .45); }
      if (kind === 'glx3') { const g = c.createLinearGradient(X, 0, X + w, 0); g.addColorStop(0, '#7c3aed'); g.addColorStop(1, '#ec4899'); txt('GALAXY', cy, R * 1.25, g) }
      if (kind === 'glx4') { const g = c.createLinearGradient(0, cy - R * 1.6, 0, cy + R * 1.6); g.addColorStop(0, '#fde047'); g.addColorStop(.5, '#fb7185'); g.addColorStop(1, '#7c3aed'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * 1.6, 0, 7); c.fill(); c.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) c.fillRect(cx - R * 1.7, cy + R * (.2 + i * .28), R * 3.4, R * (.06 + i * .02)); glxLogo(c, cx, cy - R * .5, R * .55); txt('GALAXY', cy + R * 2.2, R * .55, '#4c1d95') }
      if (kind === 'glx5') { for (let i = 0; i < 140; i++) { c.fillStyle = i % 3 ? '#a78bfa' : '#f472b6'; const q = (r() < .15 ? 4 : 1.6) * u; c.fillRect(X + r() * w, Y + r() * h, q, q) } txt('find your', cy - R * .3, R * .45, '#7c3aed', 600); txt('GALAXY', cy + R * .5, R * .9, '#db2777') }
      if (kind === 'glx6') { c.save(); c.translate(cx, cy + R * 2.4); for (let i = 0, t = 'GALAXY'; i < t.length; i++) { const a = -0.55 + i * .22; c.save(); c.rotate(a); c.font = `900 ${R * .8}px serif`; c.textAlign = 'center'; c.fillStyle = '#1e3a8a'; c.fillText(t[i], 0, -R * 3.2); c.restore() } c.restore(); txt('26', cy + R * 1.1, R * 1.4, '#1e3a8a') }
      if (kind === 'glx7') { const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * .7); g.addColorStop(0, '#f0abfc'); g.addColorStop(.3, '#8b5cf6'); g.addColorStop(.7, '#312e81'); g.addColorStop(1, '#0f0a2e'); c.fillStyle = g; c.fillRect(X, Y, w, h); for (let i = 0; i < 400; i++) { c.fillStyle = '#fff'; const q = (r() < .08 ? 3.5 : 1.3) * u; c.fillRect(X + r() * w, Y + r() * h, q, q) } glxLogo(c, cx, cy, R * .8) }
      if (kind === 'glx8') { c.fillStyle = '#0b0a1f'; c.fillRect(X, Y, w, h); c.lineWidth = R * .07; c.font = `900 ${R * 1.05}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeStyle = '#22d3ee'; c.strokeText('GALAXY', cx, cy - R * .5); c.strokeStyle = '#f472b6'; c.strokeText('GALAXY', cx, cy + R * .7) } }
    else if (kind === 'logo') { const cx = X + w / 2, cy = Y + h * .42, R = Math.min(w, h) * .2; c.fillStyle = '#6d28d9'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .45 : R; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) } c.fill(); c.font = `800 ${R * .55}px sans-serif`; c.textAlign = 'center'; c.fillStyle = '#1f2937'; c.fillText('GALAXY', cx, cy + R * 1.75) }
    c.restore();
  }
  function printTex(m, kind, rects, lum, lighten, key) {
    const tex = m.map; if (!tex) return; const ud = m.userData;
    if (!ud.orig) { const sh = m.shadeMultiplyTexture; ud.orig = { map: tex, shade: !!sh && (sh === tex || sh.image === tex.image || (sh.name && sh.name === tex.name)), shadeTex: sh } }
    ud.prints = ud.prints || {}; ud.prints[key] = kind;
    const all = Object.entries(ud.prints).filter(([, k]) => k), sig = JSON.stringify(all) + (lighten ? 'L' : '');
    if (ud.sig === sig) return; ud.sig = sig;
    if (!all.length && !lighten) { m.map = ud.orig.map; if (ud.orig.shade) m.shadeMultiplyTexture = ud.orig.shadeTex; m.needsUpdate = true; return }
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
    ['ketting', 'Ketting', 'metal', ['goud', 'zilver', 'rose']], ['hanger', 'Hanger', 'pick', [['hart', '❤️ Hart'], ['ster', '⭐ Ster'], ['maan', '🌙 Maan'], ['diamant', '💎 Diamant']]],
    ['ring', 'Ringen', 'metal', ['goud', 'zilver', 'rose', 'zwart']], ['horloge', 'Horloge', 'metal', ['zilver', 'goud', 'zwart', 'rose']],
    ['oorbel', 'Oorbellen', 'metal', ['goud', 'zilver', 'rose']], ['bril', 'Bril', 'pick', [['bril', '👓 Bril'], ['zon', '🕶️ Zonnebril'], ['hart', '💕 Hartjesbril'], ['ster', '⭐ Sterrenbril']]],
    ['pet', 'Pet', 'col'], ['muts', 'Muts', 'col'], ['hoodie', 'Hoodie (kap)', 'col'], ['tas', 'Handtas', 'col'], ['rugzak', 'Rugzak', 'col'], ['hoed', 'Hoed', 'col'], ['kop', 'Koptelefoon', 'col'], ['oren', 'Kattenoortjes', 'col'], ['kroon', 'Kroon', 'metal', ['goud', 'zilver', 'rose']], ['strik', 'Haarstrik', 'col'], ['bloem', 'Bloem in haar', 'col'], ['sjaal', 'Sjaal', 'col'], ['das', 'Vlinderdas', 'col'], ['armband', 'Armband', 'metal', ['goud', 'zilver', 'rose', 'zwart']], ['vleugels', 'Vleugels', 'col'], ['cape', 'Cape', 'col'], ['aureool', 'Aureool', 'metal', ['goud', 'zilver', 'rose']], ['hoorns', 'Duivelshoorntjes', 'col'], ['konijn', 'Konijnenoren', 'col'], ['krans', 'Bloemenkrans', 'col'], ['tiara', 'Tiara', 'metal', ['zilver', 'goud', 'rose']], ['band', 'Hoofdband', 'col'], ['bandana', 'Bandana', 'col'], ['choker', 'Choker', 'col'], ['piercing', 'Neuspiercing', 'metal', ['zilver', 'goud', 'zwart']], ['ballon', 'Ballon', 'col'], ['zweetband', 'Zweetbandjes', 'col'], ['handschoen', 'Handschoenen', 'col'], ['merchpet', 'Galaxy pet', 'col'], ['merchtas', 'Galaxy tas', 'col']];
  const ACOL = ['#ffffff', '#374151', '#6b7280', '#7f1d1d', '#b91c1c', '#fb7185', '#db2777', '#fdba74', '#c2410c', '#eab308', '#fde047', '#3f6212', '#4ade80', '#0f766e', '#0e7490', '#1e3a8a', '#93c5fd', '#4c1d95', '#c4b5fd', '#111827', '#f8fafc', '#9ca3af', '#7c4a2d', '#d6b48a', '#ef4444', '#f97316', '#ec4899', '#fbcfe8', '#8b5cf6', '#2563eb', '#38bdf8', '#14b8a6', '#16a34a', '#fbbf24', '#9d174d'];
  const GLBB = { hips: 'Hips', spine: 'Abdomen', chest: 'Torso', upperChest: 'Chest', neck: 'Neck', head: 'Head', leftUpperArm: 'UpperArm.L', rightUpperArm: 'UpperArm.R', leftLowerArm: 'LowerArm.L', rightLowerArm: 'LowerArm.R', leftHand: 'Wrist.L', rightHand: 'Wrist.R', leftRingProximal: 'Ring1.L', leftRingIntermediate: 'Ring2.L', rightRingProximal: 'Ring1.R', rightRingIntermediate: 'Ring2.R', leftUpperLeg: 'UpperLeg.L', rightUpperLeg: 'UpperLeg.R', leftLowerLeg: 'LowerLeg.L', rightLowerLeg: 'LowerLeg.R', leftFoot: 'Foot.L', rightFoot: 'Foot.R' };
  function addAcc(fig, wrap, getBone, skip) {
    const T = THREE, V3 = (x, y, z) => new T.Vector3(x, y, z), items = {}, mats = {};
    /* in rust: botsposities onthouden en ankers aan de botten hangen (wereld = identiteit in rust), zodat alles later lui gebouwd kan worden */
    wrap.updateMatrixWorld(true);
    const B = n => getBone(n) || (n === 'upperChest' ? getBone('chest') : null), rest = {}, anchors = {};
    ['head', 'neck', 'upperChest', 'chest', 'hips', 'leftEye', 'leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'leftHand', 'rightHand', 'leftRingProximal', 'leftRingIntermediate', 'rightRingProximal', 'rightRingIntermediate', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg', 'leftFoot', 'rightFoot', 'leftToes', 'rightToes'].forEach(n => { const b = B(n); if (!b) return; rest[n] = b.getWorldPosition(V3()); const g = new T.Group(); wrap.add(g); g.updateMatrixWorld(true); b.attach(g); anchors[n] = g });
    const P = n => rest[n] ? rest[n].clone() : null, anc = n => anchors[n] || anchors.head;
    const smat = m => ((mats.shoe = mats.shoe || []).push(m), m);
    /* schoenen: 15 stijlen, pas gebouwd als iemand ze kiest */
    const shoeBuilt = {};
    const shoeMake = st => {
      if (shoeBuilt[st] !== undefined) return shoeBuilt[st]; const info = SHOES.find(x => x[0] === st); if (!info || !info[2]) return (shoeBuilt[st] = null);
      const kind = info[2], groups = [], body = () => smat(new T.MeshStandardMaterial({ color: 0x1f2937, roughness: kind === 'nette' || kind === 'regen' ? .25 : .6 })), white = () => new T.MeshStandardMaterial({ color: 0xf8fafc, roughness: .7 }), dark = () => new T.MeshStandardMaterial({ color: 0x1f2937, roughness: .8 }), tan = () => new T.MeshStandardMaterial({ color: 0xc8a27a, roughness: .9 });
      const B1 = new T.BoxGeometry(1, 1, 1), HS = (r, w, h) => new T.SphereGeometry(r, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      ['left', 'right'].forEach(sd => {
        const a = P(sd + 'Foot'), te = P(sd + 'Toes'), k = P(sd + 'LowerLeg'); if (!a) return;
        const b = te || a.clone().add(V3(0, 0, .12)), dir = b.clone().sub(a).setY(0).normalize(), heel = a.clone().addScaledVector(dir, -.06), tip = b.clone().addScaledVector(dir, .075), L = heel.distanceTo(tip), mid = heel.clone().add(tip).multiplyScalar(.5);
        const g = new T.Group(); g.position.set(mid.x, 0, mid.z); g.rotation.y = Math.atan2(dir.x, dir.z);
        const mk = (geo, m, x, y, z, sx, sy, sz, rx, rz) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); if (rx) o.rotation.x = rx; if (rz) o.rotation.z = rz; o.castShadow = true; o.userData.glxAcc = 1; g.add(o); return o };
        const bm = body();
        const sneaker = (high, soleH, soleM) => { mk(B1, soleM || white(), 0, soleH / 2, 0, .1, soleH, L + .014); mk(HS(.05), bm, 0, soleH, L * .18, 1, 1.05, 1.9); mk(B1, bm, 0, soleH + .038 + (high ? .03 : 0), -L * .2, .09, .075 + (high ? .07 : 0), L * .5); mk(HS(.05), white(), 0, soleH, L * .36, .98, .62, 1); for (let i = 0; i < 3; i++) mk(B1, white(), 0, soleH + .053 - i * .009, L * (.02 + i * .07), .05, .006, .012, -.5) };
        let shaft = 0, shaftR = .06, shaftM = bm;
        if (kind === 'sneaker') sneaker(0, .032);
        if (kind === 'hightop') sneaker(1, .032);
        if (kind === 'plateau') sneaker(0, .075, dark());
        if (kind === 'sport') { sneaker(0, .035); [-1, 1].forEach(sx => { for (let i = 0; i < 3; i++) mk(B1, white(), sx * .046, .07, -L * .05 + i * .025, .004, .05, .008, 0, .5) }) }
        if (kind === 'laars' || kind === 'enkel' || kind === 'cowboy' || kind === 'regen') { mk(B1, dark(), 0, .016, 0, .1, .032, L + .012); mk(HS(.05), bm, 0, .03, L * .18, 1.02, 1.1, 1.9); mk(B1, bm, 0, .07, -L * .18, .095, .08, L * .55); if (kind === 'cowboy') { mk(new T.ConeGeometry(.05, .1, 12), bm, 0, .045, L * .5, .9, 1, .6, Math.PI / 2); mk(B1, dark(), 0, .02, -L * .42, .05, .04, .05) } shaft = kind === 'enkel' ? .12 : kind === 'laars' ? .3 : kind === 'cowboy' ? .26 : .28; if (kind === 'cowboy') shaftR = .066 }
        if (kind === 'hak') { mk(B1, bm, 0, .012, L * .1, .085, .02, L * .7); mk(new T.CylinderGeometry(.006, .012, .06, 10), bm, 0, .03, -L * .42, 1, 1, 1); mk(HS(.046), bm, 0, .02, L * .22, 1, .7, 1.5); mk(B1, bm, 0, .045, -L * .36, .085, .05, .05) }
        if (kind === 'sandaal' || kind === 'slipper') { mk(B1, kind === 'sandaal' ? tan() : bm, 0, .01, 0, .095, .02, L + .01); if (kind === 'sandaal') { [0, .14, .3].forEach(z => mk(B1, bm, 0, .032, -L * .3 + z * L, .1, .012, .02)); mk(B1, bm, 0, .06, -L * .42, .1, .04, .012) } else { [-1, 1].forEach(sx => mk(B1, bm, sx * .024, .03, L * .14, .006, .008, .1, 0, 0).rotation.y = -sx * .45) } }
        if (kind === 'slof') { mk(B1, white(), 0, .012, 0, .1, .024, L + .02); mk(new T.SphereGeometry(.06, 16, 12), bm, 0, .05, L * .08, .95, .75, 1.75); mk(new T.TorusGeometry(.048, .012, 8, 18), bm, 0, .07, -L * .2, 1, 1, 1, Math.PI / 2) }
        if (kind === 'nette') { mk(B1, dark(), 0, .012, 0, .095, .024, L + .01); mk(HS(.048), bm, 0, .022, L * .16, 1, .95, 2); mk(B1, bm, 0, .052, -L * .2, .09, .06, L * .5); mk(B1, dark(), 0, .07, L * .04, .05, .006, .03) }
        if (kind === 'sok') { shaft = .14; shaftR = .052 }
        if (kind === 'regen') shaftM = bm;
        g.updateMatrixWorld(true); anc(sd + 'Foot').add(g); groups.push(g);
        if (shaft && k) { const s = new T.Group(), sm = kind === 'sok' ? bm : shaftM, h = Math.min(shaft, (k.y - .08) * .95), cyl = new T.Mesh(new T.CylinderGeometry(shaftR, shaftR * .9, h, 18, 1, true), sm); cyl.material.side = T.DoubleSide; cyl.position.set(a.x, .08 + h / 2, a.z - .005); cyl.castShadow = true; cyl.userData.glxAcc = 1; s.add(cyl); if (kind === 'sok') { const ft = new T.Mesh(new T.SphereGeometry(.05, 14, 10), sm); ft.position.set(a.x, .045, a.z + .03); ft.scale.set(1, .9, 1.9); s.add(ft) } if (kind === 'cowboy') { const tp = new T.Mesh(new T.TorusGeometry(shaftR, .006, 6, 18), dark()); tp.rotation.x = Math.PI / 2; tp.position.set(a.x, .08 + h, a.z - .005); s.add(tp) } anc(sd + 'LowerLeg').add(s); groups.push(s) }
      });
      return (shoeBuilt[st] = groups);
    };
    fig._shoe = (st, col) => { Object.values(shoeBuilt).forEach(gs => (gs || []).forEach(g => g.visible = false)); const gs = st ? shoeMake(st) : null; (gs || []).forEach(g => g.visible = true); const info = SHOES.find(x => x[0] === st); (mats.shoe || []).forEach(m => m.color.set(col || (info && info[3]) || '#1f2937')) };
    let built = false;
    const build = () => { if (built) return; built = true;
    const head = P('head'), neck = P('neck') || head, chest = P('upperChest') || P('chest'), hips = P('hips');
    if (!head || !chest || !hips) return;
    /* hoofdmaat meten op de echte vertices (ook geskinde) */
    let top = head.y + .12; const all = [], v = V3();
    wrap.updateMatrixWorld(true); const winv = wrap.matrixWorld.clone().invert(); wrap.traverse(o => { if (!o.isMesh || o.userData.permHide || o.userData.glxAcc || !o.geometry || !o.geometry.attributes.position) return; const mw = o.matrixWorld.clone().premultiply(winv), pa = o.geometry.attributes.position, st = Math.max(1, Math.floor(pa.count / 6000)); for (let i = 0; i < pa.count; i += st) { v.fromBufferAttribute(pa, i); v.applyMatrix4(mw); all.push(v.clone()) } });
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
    const add = (key, bone, ...objs) => { const g = new T.Group(); objs.forEach(o => { if (o.isMesh) { o.castShadow = true; o.userData.glxAcc = 1 } g.add(o) }); anc(bone).add(g); g.visible = false; (items[key] = items[key] || []).push(g); return g };
    const M = (geo, m, pos, rot, sc) => { const o = new T.Mesh(geo, m); if (pos) o.position.copy(pos); if (rot) o.rotation.set(...rot); if (sc) o.scale.set(...sc); return o };
    const alignTo = (o, from, to) => { o.quaternion.setFromUnitVectors(V3(0, 1, 0), to.clone().sub(from).normalize()) };
    /* ketting + hanger */
    const nb = zr(neck.y - .05, neck.y, neck.x, .035), nRad = Math.min(.068, Math.max(.045, (nb.f - nb.b) / 2 + .01)), ncz0 = (nb.f + nb.b) / 2, cs = zr(chest.y, neck.y - .04, chest.x, .05);
    let ff = -9; all.forEach(p => { if (p.y > neck.y - .07 && p.y < neck.y - .02 && Math.abs(p.x - neck.x) < .03 && p.z > ff) ff = p.z }); const ncz = ff > -8 ? ff + .006 - nRad : ncz0;
    const nk = V3(neck.x, neck.y - .035, ncz), nR = nRad, km = std('ketting', 0, .3); add('ketting', 'upperChest', M(new T.TorusGeometry(nR, .0045, 6, 40), km, nk, [Math.PI / 2 - .55, 0, 0], [1.08, 1, 1]));
    nk.z = cs.f - nR * 1.02 + .006;
    const pend = V3(nk.x, nk.y - nR * Math.cos(Math.PI / 2 - .55) - .03, cs.f + .012), pm = std('ketting', 0, .3), hs = new T.Shape(); { const s = .018; hs.moveTo(0, -s); hs.bezierCurveTo(-s * 1.9, s * .4, -s * .6, s * 1.5, 0, s * .55); hs.bezierCurveTo(s * .6, s * 1.5, s * 1.9, s * .4, 0, -s) }
    const st = new T.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .009 : .022; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r) }
    const mo = new T.Shape(); mo.absarc(0, 0, .02, Math.PI * .35, Math.PI * 1.65, false); mo.absarc(.009, 0, .016, Math.PI * 1.55, Math.PI * .45, true);
    const ex = { depth: .006, bevelEnabled: true, bevelSize: .002, bevelThickness: .002, bevelSegments: 2 };
    add('hanger_diamant', 'upperChest', M(new T.OctahedronGeometry(.016, 0), pm, pend.clone().add(V3(0, -.004, .004)), [0, .4, 0], [.8, 1.3, .8]));
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


    /* fun-brillen */
    { const eyeB = P('leftEye'), ey = eyeB ? eyeB.y : head.y + HH * .4, ez = fz + .008; [['hart', 0xe11d48, (q) => { const sh = new T.Shape(); sh.moveTo(0, -q); sh.bezierCurveTo(-q * 1.9, q * .4, -q * .6, q * 1.5, 0, q * .55); sh.bezierCurveTo(q * .6, q * 1.5, q * 1.9, q * .4, 0, -q); return sh }], ['ster', 0xfacc15, (q) => { const sh = new T.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? q * .45 : q * 1.05; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) } return sh }]].forEach(([k, col, mk]) => { const parts = [], lm = new T.MeshStandardMaterial({ color: col, roughness: .3, transparent: true, opacity: .85 }); [-1, 1].forEach(sx => { parts.push(M(new T.ExtrudeGeometry(mk(hR * .26), { depth: .004, bevelEnabled: false }), lm, V3(hc.x + sx * hR * .36, ey, ez))); parts.push(M(new T.BoxGeometry(.005, .005, hR * .95), std('brilR2', 0x111827, .4), V3(hc.x + sx * hR * .9, ey + .004, ez - hR * .45))) }); parts.push(M(new T.BoxGeometry(hR * .2, .005, .005), std('brilR2', 0x111827, .4), V3(hc.x, ey + .006, ez))); add('bril_' + k, 'head', ...parts) }) }
    /* hoed */
    { const m1 = std('hoed', 0, .8), by = head.y + HH * .62, cr = hR * 1.0; add('hoed', 'head', M(new T.CylinderGeometry(cr * .82, cr * .95, (top - by) + hR * .35, 24), m1, V3(hc.x, by + ((top - by) + hR * .35) / 2, hc.z)), M(new T.CylinderGeometry(cr * 1.7, cr * 1.7, .01, 32), m1, V3(hc.x, by + .005, hc.z)), M(new T.CylinderGeometry(cr * .96, cr * .96, hR * .12, 24), std('hoedB', 0x111827, .6), V3(hc.x, by + hR * .08, hc.z))) }
    /* koptelefoon */
    { const m1 = std('kop', 0, .4), ry = head.y + HH * .3; add('kop', 'head', M(new T.TorusGeometry(hR * 1.08, .012, 8, 28, Math.PI), m1, V3(hc.x, ry, hc.z - hR * .05), [0, 0, 0], [1, (top + .02 - ry) / (hR * 1.08), 1]), ...[-1, 1].map(sx => M(new T.CylinderGeometry(hR * .32, hR * .32, hR * .22, 20), m1, V3(hc.x + sx * hR * 1.02, ry, hc.z - hR * .05), [0, 0, Math.PI / 2])), ...[-1, 1].map(sx => M(new T.CylinderGeometry(hR * .24, hR * .24, hR * .24, 20), std('kopP', 0x111827, .8), V3(hc.x + sx * hR * .98, ry, hc.z - hR * .05), [0, 0, Math.PI / 2]))) }
    /* kattenoortjes */
    { const m1 = std('oren', 0, .7), parts = []; [-1, 1].forEach(sx => { const p = V3(hc.x + sx * hR * .55, top - hR * .08, hc.z - hR * .1); parts.push(M(new T.ConeGeometry(hR * .3, hR * .55, 4), m1, p, [0, Math.PI / 4, -sx * .35]), M(new T.ConeGeometry(hR * .17, hR * .35, 4), std('orenB', 0xf9a8d4, .7), p.clone().add(V3(0, -hR * .03, hR * .08)), [0, Math.PI / 4, -sx * .35])) }); add('oren', 'head', ...parts) }
    /* kroon */
    { const m1 = std('kroon', 0, .3), y0 = top - hR * .05, parts = [M(new T.CylinderGeometry(hR * .55, hR * .5, hR * .22, 20, 1, true), m1, V3(hc.x, y0, hc.z - hR * .1))]; parts[0].material.side = T.DoubleSide; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; parts.push(M(new T.ConeGeometry(hR * .08, hR * .25, 6), m1, V3(hc.x + Math.cos(a) * hR * .53, y0 + hR * .2, hc.z - hR * .1 + Math.sin(a) * hR * .53)), M(new T.SphereGeometry(hR * .05, 8, 6), std('kroonG', 0xe11d48, .2), V3(hc.x + Math.cos(a) * hR * .55, y0, hc.z - hR * .1 + Math.sin(a) * hR * .55))) } add('kroon', 'head', ...parts) }
    /* haarstrik + bloem */
    { const m1 = std('strik', 0, .6), p = V3(hc.x + hR * .62, top - hR * .22, hc.z - hR * .1); add('strik', 'head', M(new T.ConeGeometry(hR * .2, hR * .38, 12), m1, p.clone().add(V3(-hR * .17, 0, 0)), [0, 0, -Math.PI / 2], [1, 1, .5]), M(new T.ConeGeometry(hR * .2, hR * .38, 12), m1, p.clone().add(V3(hR * .17, 0, 0)), [0, 0, Math.PI / 2], [1, 1, .5]), M(new T.SphereGeometry(hR * .08, 10, 8), m1, p)) }
    { const m1 = std('bloem', 0, .6), p = V3(hc.x - hR * .7, hc.y + hR * .45, hc.z + hR * .05), parts = []; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; parts.push(M(new T.SphereGeometry(hR * .12, 10, 8), m1, p.clone().add(V3(0, Math.sin(a) * hR * .13, Math.cos(a) * hR * .13)), 0, [.5, 1, 1])) } parts.push(M(new T.SphereGeometry(hR * .08, 10, 8), std('bloemH', 0xfde047, .5), p.clone().add(V3(-.004, 0, 0)))); add('bloem', 'head', ...parts) }
    /* sjaal + vlinderdas */
    { const m1 = std('sjaal', 0, .95); add('sjaal', 'upperChest', M(new T.TorusGeometry(nRad + .012, .022, 10, 30), m1, V3(neck.x, neck.y - .055, ncz), [Math.PI / 2 - .25, 0, 0], [1.1, 1, 1]), M(new T.BoxGeometry(.05, .15, .018), m1, V3(neck.x + .03, neck.y - .15, cs.f + .015), [-.12, 0, .1])) }
    { const m1 = std('das', 0, .5), p = V3(neck.x, neck.y - .06, cs.f + .006); add('das', 'upperChest', M(new T.ConeGeometry(.026, .045, 4), m1, p.clone().add(V3(-.024, 0, 0)), [0, 0, -Math.PI / 2], [1, 1, .4]), M(new T.ConeGeometry(.026, .045, 4), m1, p.clone().add(V3(.024, 0, 0)), [0, 0, Math.PI / 2], [1, 1, .4]), M(new T.SphereGeometry(.009, 8, 6), m1, p)) }
    /* armband rechts */
    { const a = P('rightLowerArm'), b = P('rightHand'); if (a && b) { const d = b.clone().sub(a).normalize(), c0 = a.clone().lerp(b, .84), o = M(new T.TorusGeometry(.03, .006, 8, 24), std('armband', 0, .3), c0); o.quaternion.setFromUnitVectors(V3(0, 0, 1), d); add('armband', 'rightLowerArm', o) } }
    /* vleugels + cape */
    { const m1 = std('vleugels', 0, .7), bk = zr(chest.y - .1, neck.y - .05, chest.x, shW * .3), parts = []; [-1, 1].forEach(sx => { const sh = new T.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(.12, .12, .3, .18, .38, .12); sh.bezierCurveTo(.3, .06, .34, -.02, .28, -.06); sh.bezierCurveTo(.22, -.1, .2, -.16, .14, -.2); sh.bezierCurveTo(.08, -.16, .04, -.1, 0, 0); const g = new T.ExtrudeGeometry(sh, { depth: .012, bevelEnabled: true, bevelSize: .006, bevelThickness: .006, bevelSegments: 2 }); const o = M(g, m1, V3(chest.x + sx * .04, chest.y + .02, bk.b - .02), [0, sx > 0 ? -.35 : Math.PI + .35, 0]); parts.push(o) }); add('vleugels', 'upperChest', ...parts) }
    { const m1 = std('cape', 0, .85), bk = zr(chest.y - .1, neck.y - .05, chest.x, shW * .3), L2 = neck.y - .02 - .05, g = new T.CylinderGeometry(shW * .42, shW * .75, L2 + .55, 24, 1, true, Math.PI * .6, Math.PI * .8); m1.side = T.DoubleSide; add('cape', 'upperChest', M(g, m1, V3(chest.x, neck.y - .04 - (L2 + .55) / 2, (bk.b + bk.f) / 2 - .01), [0, 0, 0], [1, 1, .55])) }

    /* nog meer extra's */
    { const m1 = std('aureool', 0, .25); add('aureool', 'head', M(new T.TorusGeometry(hR * .55, .008, 8, 32), m1, V3(hc.x, top + hR * .3, hc.z - hR * .1), [Math.PI / 2, 0, 0])) }
    { const m1 = std('hoorns', 0, .5), parts = []; [-1, 1].forEach(sx => parts.push(M(new T.ConeGeometry(hR * .1, hR * .38, 10), m1, V3(hc.x + sx * hR * .42, top - hR * .02, hc.z + hR * .05), [-.2, 0, -sx * .35]))); add('hoorns', 'head', ...parts) }
    { const m1 = std('konijn', 0, .7), parts = []; [-1, 1].forEach(sx => { const p = V3(hc.x + sx * hR * .35, top + hR * .35, hc.z - hR * .1); parts.push(M(new T.CapsuleGeometry(hR * .13, hR * .55, 6, 12), m1, p, [0, 0, -sx * .15], [1, 1, .45]), M(new T.CapsuleGeometry(hR * .07, hR * .4, 6, 10), std('konijnB', 0xf9a8d4, .7), p.clone().add(V3(0, 0, hR * .05)), [0, 0, -sx * .15], [1, 1, .3])) }); add('konijn', 'head', ...parts) }
    { const m1 = std('krans', 0, .6), parts = [], y0 = head.y + HH * .72; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; parts.push(M(new T.SphereGeometry(hR * .1, 8, 6), i % 2 ? m1 : std('kransG', 0x16a34a, .7), V3(hc.x + Math.cos(a) * hR * 1.0, y0, hc.z + Math.sin(a) * hR * 1.0))) } add('krans', 'head', ...parts) }
    { const m1 = std('tiara', 0, .25), y0 = head.y + HH * .76, parts = [M(new T.TorusGeometry(hR * .9, .006, 6, 32, Math.PI), m1, V3(hc.x, y0, hc.z), [-Math.PI / 2 - .3, 0, 0])]; [0, -1, 1].forEach(k => parts.push(M(new T.OctahedronGeometry(hR * (k ? .08 : .13), 0), std('tiaraG', 0x93c5fd, .1), V3(hc.x + k * hR * .35, y0 + hR * (k ? .1 : .16), hc.z + hR * .82)))); add('tiara', 'head', ...parts) }
    { const m1 = std('band', 0, .6); add('band', 'head', M(new T.TorusGeometry(hR * 1.0, .012, 8, 32, Math.PI * 1.1), m1, V3(hc.x, head.y + HH * .72, hc.z - hR * .05), [-Math.PI / 2 - .15, 0, -Math.PI * .05], [1.02, 1, 1])) }
    { const m1 = std('bandana', 0, .85); m1.side = T.DoubleSide; add('bandana', 'head', M(new T.SphereGeometry(hR * 1.04, 24, 10, 0, Math.PI * 2, 0, Math.PI * .4), m1, V3(hc.x, hc.y + hR * .05, hc.z - hR * .03), 0, [1, 1.05, 1.05]), M(new T.ConeGeometry(hR * .18, hR * .4, 4), m1, V3(hc.x, hc.y + hR * .1, hc.z - hR * 1.05), [Math.PI / 2 + .4, 0, 0])) }
    { const m1 = std('choker', 0, .4); add('choker', 'neck', M(new T.TorusGeometry(Math.max(.04, nRad - .008), .008, 8, 32), m1, V3(neck.x, neck.y + .02, (nb.f + nb.b) / 2), [Math.PI / 2, 0, 0])) }
    { const m1 = std('piercing', 0, .25); add('piercing', 'head', M(new T.TorusGeometry(.006, .0015, 6, 14), m1, V3(hc.x + hR * .06, head.y + HH * .3, fz + .002), [0, Math.PI / 2, 0])) }
    { const m1 = std('ballon', 0, .3), ul = P('rightUpperLeg'); if (ul) { const a = V3(hips.x + (ul.x - hips.x) * 2.4, hips.y - .12, hips.z + .02), b = V3(a.x + .08, a.y + .85, a.z); add('ballon', 'hips', M(new T.SphereGeometry(.13, 20, 16), m1, b, 0, [1, 1.15, 1]), new T.Mesh(new T.TubeGeometry(new T.LineCurve3(a.clone(), b.clone().add(V3(0, -.15, 0))), 2, .002, 4), std('ballonT', 0xf1f5f9, .5))) } }
    ['left', 'right'].forEach(sd => { const a = P(sd + 'LowerArm'), b = P(sd + 'Hand'); if (!a || !b) return; const d = b.clone().sub(a).normalize(), o = M(new T.CylinderGeometry(.034, .034, .05, 16, 1, true), std('zweetband', 0, .9), a.clone().lerp(b, .82)); o.material.side = T.DoubleSide; o.quaternion.setFromUnitVectors(V3(0, 1, 0), d); add('zweetband', sd + 'LowerArm', o); const h = M(new T.SphereGeometry(.045, 12, 10), std('handschoen', 0, .7), b.clone().add(d.clone().multiplyScalar(.045)), 0, [1, .55, 1.25]); h.quaternion.setFromUnitVectors(V3(0, 1, 0), d); add('handschoen', sd + 'Hand', h) });
    /* Galaxy merch: pet en tas met logo */
    const logoTex = () => { if (!addAcc._l) { const cv = document.createElement('canvas'); cv.width = cv.height = 256; glxLogo(cv.getContext('2d'), 128, 128, 70); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.userData.shared = 1; addAcc._l = t } return addAcc._l };
    const logoMat = () => new T.MeshBasicMaterial({ map: logoTex(), transparent: true, depthWrite: false });
    { const pm2 = std('merchpet', 0, .8), cr = hR * 1.07, by = head.y + HH * .54, sy = (top + .012 - by) / cr, cap = M(new T.SphereGeometry(cr, 28, 14, 0, Math.PI * 2, 0, Math.PI * .5), pm2, V3(hc.x, by, hc.z), 0, [1, sy, 1.06]); const vis = M(new T.CylinderGeometry(cr * .82, cr * .82, .008, 28, 1, false, -Math.PI * .5, Math.PI), pm2, V3(hc.x, by + .004, hc.z + cr * .62), [.14, 0, 0], [1, 1, .95]); const lg = M(new T.PlaneGeometry(cr * .62, cr * .62), logoMat(), V3(hc.x, by + (top - by) * .45, hc.z + cr * .98), [-.45, 0, 0]); add('merchpet', 'head', cap, vis, lg) }
    { const tm = std('merchtas', 0, .7), hw2 = wr(hips.y - .05, hips.y + .05, hips.z), hz = zr(hips.y - .06, hips.y + .04, hips.x, .3), bp = V3(hips.x + hw2.r + .05, hips.y - .06, (hz.f + hz.b) / 2 + .02); const bag = M(new T.BoxGeometry(.04, .2, .18), tm, bp); const lg = M(new T.PlaneGeometry(.12, .12), logoMat(), bp.clone().add(V3(.021, 0, 0)), [0, Math.PI / 2, 0]); const sA = V3(chest.x + shW * .27, neck.y - .02, chest.z), strap = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([bp.clone().add(V3(0, .1, .06)), V3(sA.x + .02, sA.y - .02, chest.z + shW * .22), sA.clone().add(V3(0, .012, 0)), V3(sA.x + .02, sA.y - .02, chest.z - shW * .22), bp.clone().add(V3(0, .1, -.06))]), 30, .007, 5), std('merchtas', 0, .7)); add('merchtas', 'hips', bag, lg); add('merchtas', 'upperChest', strap) }
    /* kapsels: pas gebouwd als iemand ze kiest (anker op het hoofd, in rust-coördinaten) */
    const headAnc = anc('head');
    const toonGrad = () => { if (!addAcc._g) { const d = new Uint8Array([90, 170, 255]); const t = new T.DataTexture(d, 3, 1, T.RedFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; t.userData.shared = 1; addAcc._g = t } return addAcc._g };
    const hairTex = () => { if (!addAcc._h) { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d'); c.fillStyle = '#d9d9d9'; c.fillRect(0, 0, 256, 64); for (let i = 0; i < 60; i++) { const y = Math.random() * 64, h = .8 + Math.random() * 1.6; c.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.6)' : 'rgba(110,110,110,.35)'; c.fillRect(0, y, 256, h) } const g = c.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, 'rgba(255,255,255,.3)'); g.addColorStop(.25, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.15)'); c.fillStyle = g; c.fillRect(0, 0, 256, 64); const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.userData.shared = 1; addAcc._h = t } return addAcc._h };
    const hairBuilt = {};
    const hairMake = id => {
      if (hairBuilt[id] !== undefined) return hairBuilt[id]; const st = HS.find(x => x[0] === id); if (!st || !st[2]) return (hairBuilt[id] = null);
      const kind = st[2], o = st[3], hm = () => mat('hairP', new T.MeshToonMaterial({ color: 0x3a2618, map: hairTex(), gradientMap: toonGrad() })), parts = [], back = V3(hc.x, hc.y + hR * .25, hc.z - hR * .92);
      const taper = (pts, r0, r1, seg) => { const cv = new T.CatmullRomCurve3(pts), rad = 12, g = new T.TubeGeometry(cv, seg, 1, rad, false), pa = g.attributes.position; for (let i = 0; i <= seg; i++) { const t = i / seg, ctr = cv.getPointAt(t), r = r0 + (r1 - r0) * Math.pow(t, 1.3); for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j, q = V3(pa.getX(k), pa.getY(k), pa.getZ(k)).sub(ctr).multiplyScalar(r); pa.setXYZ(k, ctr.x + q.x, ctr.y + q.y, ctr.z + q.z) } } g.computeVertexNormals(); return g };
      const tie = p => M(new T.TorusGeometry(hR * .13, hR * .045, 8, 16), std('hairTie', 0xec4899, .5), p);
      const chain = (p0, n, len, r0, sx) => { for (let i = 0; i < n; i++) { const t = i / (n - 1); parts.push(M(new T.SphereGeometry(hR * (r0 - t * r0 * .45), 12, 10), hm(), p0.clone().add(V3((i % 2 ? 1 : -1) * hR * .04 + (sx || 0) * t * .02, -.02 - t * len, -.03 - Math.sin(t * 3) * .03)), 0, [1, 1.25, .9])) } parts.push(tie(p0.clone().add(V3(0, -.03 - len, -.03)))) };
      if (kind === 'tail') { const p0 = o.hi ? V3(hc.x, top - hR * .15, hc.z - hR * .55) : V3(hc.x, hc.y + hR * (.25 + (o.y || 0)), hc.z - hR * .92), L = o.len; parts.push(M(taper([p0, p0.clone().add(V3(0, -.05, -.045)), p0.clone().add(V3(0, -L * .4, -.06)), p0.clone().add(V3(0, -L * .75, -.045)), p0.clone().add(V3(0, -L, -.025))], hR * .26, hR * .05, 30), hm()), tie(p0.clone().add(V3(0, 0, -.02)))) }
      if (kind === 'side') { const p0 = V3(hc.x + o.s * hR * .82, hc.y + hR * .1, hc.z - hR * .2); parts.push(M(taper([p0, p0.clone().add(V3(o.s * .05, -.04, .02)), p0.clone().add(V3(o.s * .05, -o.len * .55, .04)), p0.clone().add(V3(o.s * .02, -o.len, .05))], hR * .3, hR * .06, 24), hm()), tie(p0.clone().add(V3(o.s * .01, -.01, 0)))) }
      if (kind === 'bun') { const p = o.hi ? V3(hc.x, top - hR * .18, hc.z - hR * .6) : o.low ? V3(hc.x, hc.y - hR * .1, hc.z - hR * 1.02) : V3(hc.x, hc.y + hR * .55, hc.z - hR * .98); parts.push(M(new T.SphereGeometry(hR * o.r, 20, 16), hm(), p, 0, [1, .9, 1])) }
      if (kind === 'buns') [-1, 1].forEach(sx => parts.push(M(new T.SphereGeometry(hR * o.r, 18, 14), hm(), V3(hc.x + sx * hR * .55, top - hR * .1, hc.z - hR * .15))));
      if (kind === 'pig') [-1, 1].forEach(sx => { const p0 = V3(hc.x + sx * hR * (o.lo ? .62 : .78), hc.y + hR * (o.hi ? .7 : o.lo ? -.15 : .35), hc.z - hR * (o.lo ? .6 : .3)); parts.push(M(taper([p0, p0.clone().add(V3(sx * .06, -.04, -.02)), p0.clone().add(V3(sx * .09, -o.len * .55, -.03)), p0.clone().add(V3(sx * .07, -o.len, -.01))], hR * .24, hR * .05, 24), hm()), tie(p0.clone().add(V3(sx * .015, -.01, 0)))) });
      if (kind === 'braid') chain(back.clone(), o.n, o.len, .24);
      if (kind === 'braids') [-1, 1].forEach(sx => chain(V3(hc.x + sx * hR * .7, hc.y - hR * .1, hc.z - hR * .45), 8, o.len, .17, sx));
      if (kind === 'afro') { const C = V3(hc.x, hc.y + hR * .45, hc.z - hR * .45); for (let i = 0; i < 90; i++) { const u = i * 2.399, v = Math.acos(1 - 2 * (i + .5) / 90), d = V3(Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)); if (d.z > .55 && d.y < .35) continue; parts.push(M(new T.SphereGeometry(hR * .36 * o.r, 9, 7), hm(), C.clone().add(d.multiplyScalar(hR * o.r)))) } }
      if (kind === 'curls') for (let i = 0; i < 40; i++) { const u = (i * 2.399) % (Math.PI * 2), v = Math.acos(1 - (i + .5) / 40 * 1.15); if (Math.sin(v) * Math.sin(u) > .35 && v > .9) continue; parts.push(M(new T.SphereGeometry(hR * .22, 10, 8), hm(), V3(hc.x + Math.sin(v) * Math.cos(u) * hR * 1.02, hc.y + hR * .15 + Math.cos(v) * hR * 1.02, hc.z - hR * .1 + Math.sin(v) * Math.sin(u) * hR * 1.02))) }
      if (kind === 'dreads') for (let i = 0; i < 14; i++) { const a = Math.PI * (.15 + .7 * i / 13), x = Math.cos(a) * hR * .95, z = -Math.sin(a) * hR * .95, p0 = V3(hc.x + x, hc.y + hR * .5, hc.z + z), len = o.len + (i % 3) * .05; parts.push(M(taper([p0, p0.clone().add(V3(x * .25, -.08, z * .25)), p0.clone().add(V3(x * .3, -len, z * .3))], hR * .09, hR * .07, 10), hm())) }
      if (kind === 'long') parts.push(M(new T.CapsuleGeometry(hR * .55, o.len, 8, 16), hm(), V3(hc.x, head.y - .02 - o.len / 2 + .05, hc.z - hR * .7), [.12, 0, 0], [1.55, 1, .45]));
      if (kind === 'bob') { const m = hm(); m.side = T.DoubleSide; parts.push(M(new T.SphereGeometry(hR * 1.12, 28, 14, Math.PI * .85, Math.PI * 1.3, Math.PI * .28, Math.PI * .4), m, V3(hc.x, hc.y + hR * .1, hc.z - hR * .08))) }
      if (kind === 'mohawk') for (let i = 0; i < 9; i++) { const t = i / 8, a = -.35 + t * 2.3; parts.push(M(new T.ConeGeometry(hR * .15, hR * o.h, 8), hm(), V3(hc.x, hc.y + hR * .1 + Math.cos(a) * hR * .95, hc.z - Math.sin(a) * hR * .95), [-a, 0, 0])) }
      if (kind === 'buzz') { let sk = head.y; all.forEach(p => { if (Math.abs(p.x - head.x) < .03 && Math.abs(p.z - hc.z) < .05 && p.y > sk && p.y < top - .005) sk = p.y }); const r0 = Math.max(.06, (sk - head.y) * .55), m = hm(); m.transparent = true; m.opacity = .6; parts.push(M(new T.SphereGeometry(r0 * 1.04, 24, 12, 0, Math.PI * 2, 0, Math.PI * .42), m, V3(hc.x, sk - r0 * 1.0, hc.z - hR * .08), 0, [1.0, 1.0, 1.12])) }
      const g = new T.Group(); parts.forEach(x => { x.castShadow = true; x.userData.glxAcc = 1; g.add(x) }); headAnc.add(g); return (hairBuilt[id] = g);
    };
    fig._hair = (id, col) => { Object.keys(hairBuilt).forEach(k => { if (hairBuilt[k]) hairBuilt[k].visible = false }); const g = id ? hairMake(id) : null; if (g) g.visible = true; (mats.hairP || []).forEach(m => m.color.set(col)) };
    /* laarzen */
    ['left', 'right'].forEach(sd => { const k = P(sd + 'LowerLeg'), f = P(sd + 'Foot'); if (!k || !f) return; const lm = std('laars', 0, .5), up = M(new T.CylinderGeometry(.062, .052, (k.y - f.y) * .62, 16), lm, V3(f.x, f.y + (k.y - f.y) * .28, f.z - .005)); const ft = M(new T.CapsuleGeometry(.05, .12, 6, 12), lm, V3(f.x, .055, f.z + .045), [Math.PI / 2, 0, 0], [1.05, 1, 1.15]); const sole = M(new T.BoxGeometry(.11, .028, .25), std('laarsZ', 0x1f2937, .8), V3(f.x, .014, f.z + .04)); add('laars', sd + 'LowerLeg', up); add('laars', sd + 'Foot', ft, sole) });
    };
    const old = fig.tint.bind(fig);
    fig.tint = c => {
      old(c); const a = c.acc || {}, show = (k, on) => (items[k] || []).forEach(g => g.visible = !!on);
      if (!built && (Object.values(a).some(Boolean) || (c.hs && c.hs !== 'kort' && c.hs !== 'kaal'))) build();
      ACC.forEach(([k, , type]) => {
        const v = a[k];
        if (k === 'hanger') { ['hart', 'ster', 'maan', 'diamant'].forEach(h => show('hanger_' + h, a.ketting && (v || 'hart') === h)); return }
        if (k === 'bril') { ['bril', 'zon', 'hart', 'ster'].forEach(x => show('bril_' + x, v === x)); return }
        show(k, v); if (!v) return;
        (mats[k] || []).forEach(m => { if (type === 'metal') { const [cc, me, ro] = METAL[v] || METAL.zilver; m.color.setHex(cc); m.metalness = me; m.roughness = ro } else m.color.set(v) });
      });
      if (skip) skip(a, c, show, (k, hex) => (mats[k] || []).forEach(m => m.color.set(hex)));
    };
  }

  /* kapsels: [id, naam, soort, opties, vlag]  vlag up = achterhaar weg (lang haar), bald = al het haar weg */
  const HS = [['kort', 'Kort', '', {}, 'up'], ['staart1', 'Korte paardenstaart', 'tail', { len: .25 }, 'up'], ['staart', 'Paardenstaart', 'tail', { len: .42 }, 'up'], ['staart3', 'Lange paardenstaart', 'tail', { len: .62 }, 'up'],
    
    
    ['knot', 'Knot', 'bun', { r: .42, hi: 1 }, 'up'], ['manbun', 'Man bun', 'bun', { r: .3, back: 1 }, ''],
    ['bollen', 'Twee knotjes', 'buns', { r: .32 }, 'up'], 
    ['staartjes', 'Twee staartjes', 'pig', { len: .36 }, 'up'], 
    ['vlecht', 'Vlecht', 'braid', { n: 11, len: .42 }, 'up'], ['vlechtL', 'Lange vlecht', 'braid', { n: 15, len: .62 }, 'up'], ['vlechten', 'Twee vlechten', 'braids', { len: .3 }, 'up'], 
    
    
    
    ['kaal', 'Kaal', '', {}, 'bald']];
  const hsList = M => [['', M.hsDef || 'Standaard']].concat(HS.filter(x => !(x[0] === 'kort' && !(M.backM || []).length)));
  const SHOES = [['', 'Standaard', '', null], ['sneaker', 'Sneakers', 'sneaker', '#1f2937'], ['sport', 'Sportschoenen', 'sport', '#2563eb'], ['hightop', 'Hoge sneakers', 'hightop', '#b91c1c'], ['plateau', 'Plateauschoenen', 'plateau', '#ffffff'], ['enkel', 'Enkellaarsjes', 'enkel', '#7c4a2d'], ['laars', 'Laarzen', 'laars', '#111827'], ['cowboy', 'Cowboylaarzen', 'cowboy', '#92400e'], ['regen', 'Regenlaarzen', 'regen', '#eab308'], ['hak', 'Hoge hakken', 'hak', '#b91c1c'], ['nette', 'Nette schoenen', 'nette', '#111827'], ['sandaal', 'Sandalen', 'sandaal', '#7c4a2d'], ['slipper', 'Teenslippers', 'slipper', '#ec4899'], ['slof', 'Pantoffels', 'slof', '#fbcfe8'], ['sok', 'Sokken', 'sok', '#ffffff'], ['bloot', 'Blote voeten', '', null]];
  const DEF = { model: 'a_anime', skin: null, hair: null, parts: {} };
  const OLD = m => MODELS[m] ? m : /^m_/.test(m || '') ? 'a_boy' : /^f_/.test(m || '') ? 'a_anime' : null;
  function load() { try { const a = JSON.parse(localStorage[KEY] || 'null'); if (a && OLD(a.model) && OLD(a.model) !== a.model) { a.model = OLD(a.model); a.parts = {}; a.hair = null } if (a && MODELS[a.model]) return { model: a.model, skin: a.skin || null, hair: a.hair || null, eyes: a.eyes || null, face: a.face || null, parts: a.parts || {}, prints: a.prints || {}, acc: a.acc || {}, hs: a.hs || '', fx: a.fx || {}, body: a.body || {}, shoe: a.shoe || '', shoeCol: a.shoeCol || null } } catch (e) { } return JSON.parse(JSON.stringify(DEF)) }
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
    vrm.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; if (M.hide && (Array.isArray(o.material) ? o.material : [o.material]).some(m => M.hide.test((m.name || '').replace(/ \(Outline\)$/, '')))) { o.visible = false; o.userData.permHide = 1 } } });
    const mats = {}; vrm.scene.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { const n = (m.name || '').replace(/ \(Outline\)$/, ''); (mats[n] = mats[n] || []).push(m); if (m.color && m.userData.base == null) m.userData.base = m.color.getHex(); if (m.shadeColorFactor && m.userData.shade == null) m.userData.shade = m.shadeColorFactor.getHex() }) });
    (M.prints || []).forEach(p => { if (p[5]) (mats[p[1]] || []).forEach(m => { m.userData.base = 0x2b2d38; if (m.userData.shade != null) m.userData.shade = 0x1a1b22 }) });
    /* robot-handschoenen en zwarte mouwen in de huid-textuur vervangen door huid */
    if (M.skinFix) (mats[M.skinFix.m] || []).slice(0, 1).forEach(m0 => { try {
      const tex = m0.map, img = tex && tex.image; if (!img) return; const W = img.width, Hh = img.height, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(img, 0, 0);
      const [tr, tg, tb] = M.skinFix.tone; M.skinFix.rects.forEach(([x0, y0, x1, y1]) => { const X = Math.floor(x0 * W), Y = Math.floor(y0 * Hh), w = Math.ceil((x1 - x0) * W), h = Math.ceil((y1 - y0) * Hh), d = c.getImageData(X, Y, w, h), a = d.data; for (let i = 0; i < a.length; i += 4) { const r = a[i], g = a[i + 1], b = a[i + 2], l = (r + g + b) / 3; if (l < 95 || b > r + 35) { const k = .82 + Math.min(.18, l / 500); a[i] = tr * k; a[i + 1] = tg * k; a[i + 2] = tb * k } } c.putImageData(d, X, Y) });
      const t = new THREE.CanvasTexture(cv); ['flipY', 'colorSpace', 'wrapS', 'wrapT', 'channel'].forEach(k => { if (tex[k] !== undefined) t[k] = tex[k] });
      vrm.scene.traverse(o => { if (!o.isMesh) return; [].concat(o.material).forEach(m => { if (m.map && m.map.image === img) m.map = t; if (m.shadeMultiplyTexture && m.shadeMultiplyTexture.image === img) m.shadeMultiplyTexture = t; m.needsUpdate = true }) }) } catch (e) { } });
    /* haar-texturen grijs maken zodat elke haarkleur echt klopt */
    (M.hairM || []).forEach(n => (mats[n] || []).forEach(m => { try {
      const tex = m.map; if (!tex || !tex.image || m.userData.normed) return; const img = tex.image, W = img.width, Hh = img.height, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(img, 0, 0);
      const d = c.getImageData(0, 0, W, Hh), a = d.data; let mn = 255, mx = 0, sr = 0, sg = 0, sb = 0, cnt = 0; for (let i = 0; i < a.length; i += 16) { const l = (a[i] + a[i + 1] + a[i + 2]) / 3; if (l < mn) mn = l; if (l > mx) mx = l; sr += a[i]; sg += a[i + 1]; sb += a[i + 2]; cnt++ }
      const rng = Math.max(20, mx - mn); for (let i = 0; i < a.length; i += 4) { const l = (a[i] + a[i + 1] + a[i + 2]) / 3, v = 120 + 135 * (l - mn) / rng; a[i] = a[i + 1] = a[i + 2] = v } c.putImageData(d, 0, 0);
      const t = new THREE.CanvasTexture(cv); ['flipY', 'colorSpace', 'wrapS', 'wrapT', 'channel'].forEach(k => { if (tex[k] !== undefined) t[k] = tex[k] }); const sh = m.shadeMultiplyTexture; m.map = t; if (sh && (sh === tex || sh.image === tex.image || (sh.name && sh.name === tex.name))) m.shadeMultiplyTexture = t;
      const avg = new THREE.Color(M.hairDef || '#6b4226'); m.userData.base = avg.getHex(); if (m.shadeColorFactor) m.userData.shade = avg.clone().multiplyScalar(.72).getHex(); m.userData.normed = 1; M._hairAvg = '#' + avg.getHexString(); m.needsUpdate = true } catch (e) { } }));
    const hairVis = {}; vrm.scene.traverse(o => { if (!o.isMesh) return; [].concat(o.material).forEach(m => { const n = (m.name || '').replace(/ \(Outline\)$/, ''); if ((M.allHair || []).includes(n)) { (hairVis[n] = hairVis[n] || []).includes(o) || hairVis[n].push(o) } }) });
    const set2 = (names, hex) => names.forEach(n => (mats[n] || []).forEach(m => { if (m.color) m.color.set(hex == null ? m.userData.base : hex) }));
    const H = vrm.humanoid, bone = n => H.getNormalizedBoneNode(n);
    vrm.scene.updateMatrixWorld(true); const head = bone('head'), v = new THREE.Vector3(); const hh = head ? head.getWorldPosition(v).y + .14 : 1.6;
    const k = 1.62 / hh, wrap = new THREE.Group(); vrm.scene.scale.setScalar(k); wrap.add(vrm.scene);

    if (M.shoes) {
      const sm = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: .6, name: 'glx_shoe' }), so = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: .7 }), lace = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: .6 });
      sm.userData.base = 0x1f2937; mats.glx_shoe = [sm]; wrap.updateMatrixWorld(true);
      ['left', 'right'].forEach(sd => {
        const f = H.getRawBoneNode(sd + 'Foot'), te = H.getRawBoneNode(sd + 'Toes'); if (!f) return;
        const a = f.getWorldPosition(new THREE.Vector3()), b = te ? te.getWorldPosition(new THREE.Vector3()) : a.clone().add(new THREE.Vector3(0, 0, .12));
        const dir = b.clone().sub(a).setY(0).normalize(), heel = a.clone().addScaledVector(dir, -.06), tip = b.clone().addScaledVector(dir, .075), L = heel.distanceTo(tip) - 0.0;
        const g = new THREE.Group(), T3 = THREE, mk = (geo, m, x, y, z, sx, sy, sz, rx) => { const o = new T3.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); if (rx) o.rotation.x = rx; o.castShadow = true; g.add(o); return o };
        mk(new T3.BoxGeometry(1, 1, 1), so, 0, .016, 0, .1, .032, L + .014);                                   // zool
        mk(new T3.SphereGeometry(.05, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), sm, 0, .03, L * .18, 1, 1.05, 1.9); // voorvoet
        mk(new T3.BoxGeometry(1, 1, 1), sm, 0, .068, -L * .2, .09, .075, L * .5);                                // hiel/enkel
        mk(new T3.SphereGeometry(.05, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), so, 0, .03, L * .36, .98, .62, 1.0); // neus
        for (let i = 0; i < 3; i++) mk(new T3.BoxGeometry(1, 1, 1), lace, 0, .083 - i * .009, L * (.02 + i * .07), .05, .006, .012, -.5);  // veters
        const mid = heel.clone().add(tip).multiplyScalar(.5); g.position.set(mid.x, 0, mid.z); g.rotation.y = Math.atan2(dir.x, dir.z); g.userData.oldShoe = 1; wrap.add(g); g.updateMatrixWorld(true); f.attach(g);
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
        const f = mode === 'Wave' || mode === 'Dance' ? 'happy' : (cfg.face || 'neutral'); const EX = ['happy', 'relaxed', 'surprised', 'sad', 'angry', 'aa', 'ih', 'ou', 'ee', 'oh', 'blinkLeft', 'blinkRight', 'lookUp', 'lookDown']; EX.forEach(n => E.setValue(n, 0)); const X = { happy: [['happy', .85]], smile: [['happy', .4]], grin: [['happy', 1], ['aa', .3]], relaxed: [['relaxed', .85]], surprised: [['surprised', .85]], shock: [['surprised', 1], ['aa', .6]], sad: [['sad', .55]], cry: [['sad', 1]], wink: [['blinkLeft', 1]], winkR: [['blinkRight', 1], ['happy', .25]], angry: [['angry', .5]], mad: [['angry', 1]], ohh: [['ou', .8], ['relaxed', .4]], pout: [['ou', .5], ['sad', .3]], sleep: [['relaxed', 1], ['blinkLeft', .6], ['blinkRight', .6]], closed: [['blinkLeft', 1], ['blinkRight', 1], ['happy', .2]], dreamy: [['relaxed', .6], ['happy', .4]], smug: [['relaxed', .5], ['angry', .25]], cheeky: [['happy', .5], ['blinkRight', 1], ['ee', .3]], ah: [['aa', .8], ['happy', .3]], ee: [['ee', .9]], ih: [['ih', .6], ['happy', .3]], oh: [['oh', .9]], talk: [['aa', .35], ['ih', .2]], cool: [['relaxed', .4], ['blinkLeft', .3], ['blinkRight', .3]], shy: [['sad', .35], ['happy', .35]], meh: [['relaxed', .2], ['ee', .2]], tired: [['sad', .4], ['blinkLeft', .5], ['blinkRight', .5]], up: [['lookUp', 1]], down: [['lookDown', 1], ['sad', .2]] }[f] || []; X.forEach(([n, v]) => E.setValue(n, v)); if (X.some(x => /blink/.test(x[0]))) E.setValue('blink', 0);
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
    try { addAcc(fig, wrap, n => H.getRawBoneNode(n), (a, c, show, colorize) => {
      const shSt = c.shoe || (a.laars ? 'laars' : ''), shCol = c.shoeCol || (c.shoe ? null : a.laars);
      if (fig._shoe) fig._shoe(shSt === 'bloot' ? '' : shSt, shCol);
      wrap.traverse(o => { if (o.userData.oldShoe) { o.visible = !shSt; return } if (!o.isMesh) return; if ([].concat(o.material).some(m => /^Shoes_/.test(m.name || ''))) o.visible = !shSt });
      const HSMAP = { staartK: 'staart1', knotK: 'manbun' }, sid = HSMAP[c.hs] || c.hs || '', st = HS.find(x => x[0] === sid), flag = st ? st[4] : '', hid = flag === 'bald' ? (M.allHair || []) : flag === 'up' ? (M.backM || []) : [];
      Object.keys(hairVis).forEach(n => hairVis[n].forEach(o => o.visible = !hid.includes(n)));
      if (fig._hair) fig._hair(st && st[2] ? sid : '', c.hair || M._hairAvg || M.hairDef || '#3a2618');
      const fx = c.fx || {}, fm = M.face && mats[M.face.m];
      if (fm) fm.forEach(m => { const ud = m.userData; ud.rects = ud.rects || {}; ud.lums = ud.lums || {}; [['blos', fx.blos], ['shadow', fx.shadow], ['lip', fx.lip], ['sproet', fx.sproet], ['deco', fx.deco], ['baard', fx.baard ? fx.baard + '|' + (c.hair || M._hairAvg || M.hairDef) : '']].forEach(([k, v]) => { const key = 'fx_' + k; ud.rects[key] = [M.face.r]; ud.lums[key] = 0; try { printTex(m, v ? 'fx:' + k + ':' + v : '', null, 0, false, key) } catch (e) { } }) });
      if (M.browM) set2(M.browM, fx.brow || null);
      const es = +(fx.oog || 1); ['leftEye', 'rightEye'].forEach(n => { const b = H.getRawBoneNode(n); if (b) b.scale.setScalar(es) });
      const hb = H.getRawBoneNode('head'); if (hb) hb.scale.setScalar(+((c.body || {}).hoofd || 1));
      const L = +((c.body || {}).len || 1); wrap.scale.setScalar(L); fig.headY = 1.47 * L;
    }) } catch (e) { console.warn(e) }
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
  const camS = { y: 1.02, z: 4.3, t: .88 };
  let renderer, scene, cam, fig, raf, spin = -0.4, drag = null, previewWalk = false, waveT = 0, busy = 0;
  const CSS = `
#avV .sheet{max-height:94vh}
#avStage{position:relative;height:min(46vh,380px);border-radius:22px;overflow:hidden;background:radial-gradient(circle at 50% 78%,#4a2392 0%,#1a0f3f 45%,#0a0820 75%);touch-action:none;cursor:grab}
#avStage canvas{width:100%!important;height:100%!important;display:block}
#avStage .hint{position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:11px;color:#bfb8ef;pointer-events:none}
#avStage .acts{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:6px}
#avStage .acts button{padding:6px 10px;border-radius:10px;background:rgba(14,11,38,.75);border:1px solid rgba(167,139,250,.4);font-size:12px}
#avStage .acts button.on{background:linear-gradient(135deg,#8b5cf6,#ec4899)}
#avMsg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:30px;color:#d9d4ff;font-size:14px;pointer-events:none}
#avTabs{display:flex;gap:4px;overflow-x:auto;margin:10px -4px 6px;padding:0 4px 6px;scrollbar-width:none;border-bottom:1px solid var(--line)}#avTabs::-webkit-scrollbar{display:none}
#avTabs button{flex:none;width:64px;padding:6px 2px;border-radius:14px;background:none;border:0;display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--mut);position:relative}
#avTabs button b{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:21px;background:var(--card2);transition:transform .15s}
#avTabs button span{font-size:10.5px;line-height:1.15;text-align:center;font-weight:600}
#avTabs button.on{color:#fff}#avTabs button.on b{background:linear-gradient(135deg,#8b5cf6,#ec4899);transform:scale(1.06)}
#avTabs button.on::after{content:'';position:absolute;bottom:-7px;left:14px;right:14px;height:3px;border-radius:3px;background:#fff}
#avPanel{max-height:42vh;overflow-y:auto;padding-bottom:6px}
.avGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:6px 0 12px}
.avTile{position:relative;aspect-ratio:1/1.15;border-radius:16px;background:#2a2838;border:2px solid transparent;padding:0;overflow:hidden;display:flex;flex-direction:column}
.avTile img{width:100%;flex:1;min-height:0;object-fit:cover;display:block;background:#2a2838}
.avTile .avTl{flex:1;display:grid;place-items:center;font-size:28px}
.avTile small{font-size:10px;line-height:1.2;padding:3px 4px 5px;color:#d9d4ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.avTile.on{border-color:#fff;box-shadow:0 0 0 2px #ec4899}
.avRm{margin:-2px 0 10px;padding:6px 12px;border-radius:999px;background:var(--card2);border:1px solid var(--line);font-size:12px}
.avMerch{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:16px;background:linear-gradient(135deg,rgba(139,92,246,.35),rgba(236,72,153,.3));margin:4px 0 8px;font-size:14px}.avMerch span{font-size:12px;color:#e9e3ff}
.avOpts{display:flex;flex-wrap:wrap;gap:7px;margin:6px 0 10px}
.avOpts button{padding:8px 12px;border-radius:12px;background:var(--card2);border:1px solid var(--line);font-size:13px}
.avOpts button.on{border-color:#ec4899;box-shadow:0 0 0 2px rgba(236,72,153,.35)}
.avSw{width:32px;height:32px;border-radius:50%;border:2px solid rgba(255,255,255,.15);padding:0!important}
.avSw.on{border-color:#fff!important;box-shadow:0 0 0 3px #ec4899!important}
.avSw.std{background:conic-gradient(#888,#ddd,#888)!important;font-size:10px;color:#111}
.avLbl{font-size:12px;color:var(--mut);margin-top:6px}`;
  let tab = 'stijl';
  function ensureDom() {
    if ($('avV')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend', `<div class="ov" id="avV"><div class="sheet"><div style="display:flex;align-items:center;margin-bottom:10px"><h3 style="flex:1">🧍 Mijn mannetje</h3><button class="ico" onclick="GLXAV.close()">✖️</button></div>
<div id="avStage"><div id="avMsg">Mannetje laden…</div><div class="acts"><button id="avWalk">🚶 Wandel</button><button id="avWave">👋 Zwaai</button></div><div class="hint">Sleep om te draaien</div></div><div id="avTabs"></div><div id="avPanel"></div>
<div style="display:flex;gap:8px;margin-top:10px"><button class="btn ghost" style="flex:1" onclick="GLXAV.random()">🎲 Willekeurig</button><button class="btn" style="flex:2" onclick="GLXAV.save()">✅ Opslaan</button></div></div></div>`);
    $('avTabs').innerHTML = TABS.map(([k, i, n]) => `<button data-t="${k}"><b>${i}</b><span>${n}</span></button>`).join('');
    $('avTabs').querySelectorAll('button').forEach(b => b.onclick = () => { tab = b.dataset.t; accSel = null; panel(); b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }) });
    $('avWalk').onclick = () => { previewWalk = !previewWalk; $('avWalk').classList.toggle('on', previewWalk); if (fig) fig.play(previewWalk ? 'Walk' : 'Idle') };
    $('avWave').onclick = () => { if (!fig) return; waveT = performance.now() + 2200; fig.play('Wave') };
    const stg = $('avStage');
    stg.addEventListener('pointerdown', e => { if (e.target.closest('.acts')) return; drag = { x: e.clientX, s: spin }; stg.setPointerCapture(e.pointerId) });
    stg.addEventListener('pointermove', e => { if (drag) spin = drag.s + (e.clientX - drag.x) / 70 });
    stg.addEventListener('pointerup', () => drag = null);
  }
  const sw = (fn, cur, cols) => `<div class="avOpts"><button class="avSw std ${cur == null ? 'on' : ''}" title="Standaard" onclick="GLXAV.${fn}(null)">↺</button>${cols.map(c => `<button class="avSw ${cur === c ? 'on' : ''}" style="background:${c}" aria-label="kleur ${c}" onclick="GLXAV.${fn}('${c}')"></button>`).join('')}</div>`;
  const optRow = (fn, k, cur, list) => `<div class="avOpts">${list.map(([v, l]) => `<button class="${(cur || '') === v ? 'on' : ''}" onclick="GLXAV.${fn}('${k}','${v}')">${l}</button>`).join('')}</div>`;
  const fxRows = M => { const f = A.fx || {}; let h = `<div class="avLbl">Ogen</div>${optRow('fx', 'oog', f.oog, FACEX.oog)}`;
    if (M.browM) h += `<div class="avLbl">Wenkbrauwen</div>${sw("fx.bind(null,'brow')", f.brow || null, HAIRC.concat(PAL))}`;
    h += `<div class="avLbl">Blos</div>${sw("fx.bind(null,'blos')", f.blos || null, PAL)}<div class="avLbl">Sproetjes</div>${optRow('fx', 'sproet', f.sproet, FACEX.sproet)}<div class="avLbl">Versiering</div>${optRow('fx', 'deco', f.deco, FACEX.deco)}<div class="avLbl">Oogschaduw</div>${sw("fx.bind(null,'shadow')", f.shadow || null, PAL)}<div class="avLbl">Lippen</div>${sw("fx.bind(null,'lip')", f.lip || null, PAL)}<div class="avLbl">Baard en snor</div>${optRow('fx', 'baard', f.baard, FACEX.baard)}`;
    return h };
  /* ===== nieuwe maker: categorieën met icoontjes + tegels met foto's (zoals Bitmoji) ===== */
  const PV = 'av/p/';
  const TABS = [['stijl', '🧍', 'Stijl'], ['huid', '🎨', 'Huid'], ['haar', '💇', 'Haar'], ['ogen', '👁️', 'Ogen'], ['gezicht', '😊', 'Expressie'], ['makeup', '💄', 'Make-up'], ['deco', '✨', 'Versiering'], ['baard', '🧔', 'Baard'],
    ['merch', '🪐', 'Galaxy merch'], ['top', '👕', 'Shirt'], ['broek', '👖', 'Broek'], ['schoen', '👟', 'Schoenen'], ['hoofd', '🧢', 'Hoofd'], ['sieraad', '💍', 'Sieraden'], ['tas', '🎒', 'Tassen & meer'], ['lichaam', '📏', 'Lichaam']];
  const CLOSE = { haar: 1, ogen: 1, gezicht: 1, makeup: 1, deco: 1, baard: 1, hoofd: 1, sieraad: .6 };
  const ACCG = { hoofd: ['pet', 'merchpet', 'muts', 'hoed', 'bandana', 'kroon', 'tiara', 'aureool', 'hoorns', 'oren', 'konijn', 'strik', 'bloem', 'krans', 'band', 'kop', 'bril'], sieraad: ['ketting', 'hanger', 'choker', 'oorbel', 'piercing', 'ring', 'horloge', 'armband'], tas: ['tas', 'merchtas', 'rugzak', 'sjaal', 'das', 'hoodie', 'vleugels', 'cape', 'ballon', 'zweetband', 'handschoen'] };
  let accSel = null;
  const prTiles = {};
  const printTile = (kind, base) => { const k = kind + base; if (prTiles[k]) return prTiles[k]; try { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); c.fillStyle = base || '#e5e7eb'; c.fillRect(0, 0, 128, 128); if (kind) { const p = document.createElement('canvas'); p.width = p.height = 512; drawPrint(p.getContext('2d'), 512, 512, kind, [0, 0, 1, 1]); c.globalCompositeOperation = 'multiply'; c.drawImage(p, 0, 0, 128, 128) } return (prTiles[k] = cv.toDataURL('image/png')) } catch (e) { return '' } };
  const tile = (img, label, on, click, extra) => `<button class="avTile ${on ? 'on' : ''}" onclick="${click}" aria-label="${label}">${img ? `<img loading="lazy" src="${img}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : ''}<span class="avTl" style="${img ? 'display:none' : ''}">${extra || label}</span><small>${label}</small></button>`;
  const none = (on, click) => `<button class="avTile none ${on ? 'on' : ''}" onclick="${click}"><span class="avTl" style="display:grid">🚫</span><small>Geen</small></button>`;
  const grid = h => `<div class="avGrid">${h}</div>`;
  const lbl = t => `<div class="avLbl">${t}</div>`;
  const metalSw = (k, cur, opts) => `<div class="avOpts">${opts.map(v => `<button class="avSw ${cur === v ? 'on' : ''}" style="background:${{ goud: 'linear-gradient(135deg,#fde68a,#b8860b)', zilver: 'linear-gradient(135deg,#fff,#9ca3af)', rose: 'linear-gradient(135deg,#fecdd3,#d4877a)', zwart: 'linear-gradient(135deg,#4b5563,#0b0f19)' }[v]}" aria-label="${v}" onclick="GLXAV.acc('${k}','${v}')"></button>`).join('')}</div>`;
  function accPanel(group) {
    const a = A.acc || {}, list = ACCG[group].map(k => ACC.find(x => x[0] === k)).filter(Boolean);
    if (!accSel || !ACCG[group].includes(accSel)) accSel = list.find(x => a[x[0]]) ? list.find(x => a[x[0]])[0] : null;
    let h = '';
    const sel = list.find(x => x[0] === accSel);
    if (sel) { const [k, n, type, opts] = sel; h += lbl(`<span>${n}</span>`);
      if (type === 'metal') h += metalSw(k, a[k], opts);
      else if (type === 'pick') h += grid(opts.map(([v, l]) => tile(PV + 'a_' + k + '_' + v + '.webp', l.replace(/^\S+\s/, ''), (a[k] || (k === 'hanger' ? 'hart' : '')) === v, `GLXAV.acc('${k}','${v}')`)).join(''));
      else h += `<div class="avOpts">${ACOL.map(c => `<button class="avSw ${a[k] === c ? 'on' : ''}" style="background:${c}" aria-label="kleur" onclick="GLXAV.acc('${k}','${c}')"></button>`).join('')}</div>`;
      if (a[k]) h += `<button class="avRm" onclick="GLXAV.acc('${k}',null)">✖️ <span>Uitdoen</span></button>`; }
    h += grid(list.filter(x => x[0] !== 'hanger' || a.ketting).map(([k, n]) => tile(PV + 'a_' + k + '.webp', n, !!a[k] || accSel === k, `GLXAV.accPick('${k}')`)).join(''));
    return h;
  }
  function panel() {
    const M = MODELS[A.model], f = A.fx || {}, a = A.acc || {};
    $('avTabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    let h = '';
    if (tab === 'stijl') h = grid(Object.entries(MODELS).map(([k, m]) => tile(PV + 'm_' + k + '.webp', m.n, A.model === k, `GLXAV.set('model','${k}')`, m.g === 'f' ? '👩' : '👨')).join('')) + `<p class="avLbl">Kies vrouw of man. Pas daarna alles aan in de categorieën hierboven.</p>`;
    if (tab === 'huid') h = lbl('Huidskleur') + sw("set.bind(null,'skin')", A.skin, SKIN);
    if (tab === 'haar') h = lbl('Haarkleur') + sw("set.bind(null,'hair')", A.hair, HAIRC) + lbl('Kapsel') + grid(hsList(M).map(([v, l]) => tile(PV + 'h_' + A.model + '_' + (v || 'std') + '.webp', l, (A.hs || '') === v, `GLXAV.set('hs','${v}')`)).join(''));
    if (tab === 'ogen') h = lbl('Oogkleur') + sw("set.bind(null,'eyes')", A.eyes, EYES) + lbl('Ogen') + optRow('fx', 'oog', f.oog, FACEX.oog) + (M.browM ? lbl('Wenkbrauwen') + sw("fx.bind(null,'brow')", f.brow || null, HAIRC.concat(PAL)) : '');
    if (tab === 'gezicht') h = grid(FACES.map(([v, n]) => tile(PV + 'f_' + v + '.webp', n.replace(/^\S+\s/, ''), (A.face || 'neutral') === v, `GLXAV.set('face','${v}')`, n.split(' ')[0])).join(''));
    if (tab === 'makeup') h = lbl('Lippen') + sw("fx.bind(null,'lip')", f.lip || null, PAL) + lbl('Blos') + sw("fx.bind(null,'blos')", f.blos || null, PAL) + lbl('Oogschaduw') + sw("fx.bind(null,'shadow')", f.shadow || null, PAL);
    if (tab === 'deco') h = lbl('Sproetjes') + optRow('fx', 'sproet', f.sproet, FACEX.sproet) + lbl('Versiering') + grid(FACEX.deco.map(([v, n]) => v ? tile(PV + 'd_' + v + '.webp', n, f.deco === v, `GLXAV.fx('deco','${v}')`) : none(!f.deco, `GLXAV.fx('deco','')`)).join(''));
    if (tab === 'baard') h = grid(FACEX.baard.map(([v, n]) => v ? tile(PV + 'b_' + v + '.webp', n, f.baard === v, `GLXAV.fx('baard','${v}')`) : none(!f.baard, `GLXAV.fx('baard','')`)).join('')) + `<p class="avLbl">De baard krijgt de kleur van je haar.</p>`;
    const pr = (which, list, base) => { const p = (M.prints || []).find(x => x[2] === which); if (!p) return ''; const key = p[1] + ':' + which, cur = (A.prints || {})[key] || ''; return grid(list.map(([v, l]) => tile(printTile(v, base), l, cur === v, `GLXAV.print('${key}','${v}')`)).join('')) };
    const partSw = (i) => { const p = M.parts[i]; return p ? lbl(`<span>${p[0]}</span> – <span>kleur</span>`) + sw(`part.bind(null,'${p[1]}')`, (A.parts || {})[p[1]] || null, CLOTH) : '' };
    if (tab === 'top') h = partSw(0) + lbl('Print') + pr('top', PRINTS.top.filter(x => !/^glx/.test(x[0])), '#f3f4f6');
    if (tab === 'broek') h = (M.parts.length > 2 ? partSw(1) : '') + lbl('Patroon') + pr('bot', PRINTS.bot, '#f3f4f6');
    if (tab === 'schoen') { const st = A.shoe || ((A.acc || {}).laars ? 'laars' : ''); h = lbl('Kleur') + `<div class="avOpts"><button class="avSw std ${!A.shoeCol ? 'on' : ''}" title="Standaard" onclick="GLXAV.set('shoeCol',null)">↺</button>${ACOL.map(c => `<button class="avSw ${A.shoeCol === c ? 'on' : ''}" style="background:${c}" aria-label="kleur" onclick="GLXAV.set('shoeCol','${c}')"></button>`).join('')}</div>` + lbl('Schoenen') + grid(SHOES.map(([v, l]) => tile(PV + 's_' + (v || 'std_' + A.model) + '.webp', l, st === v, `GLXAV.set('shoe','${v}')`)).join('')) }
    if (tab === 'merch') h = `<div class="avMerch">🪐 <b>Galaxy merch</b><span>Draag het Galaxy-logo en laat zien dat je erbij hoort.</span></div>` + lbl('Shirts') + pr('top', MERCH, '#f3f4f6') + lbl('Petten en tassen') + grid(['merchpet', 'merchtas'].map(k => { const it = ACC.find(x => x[0] === k); return tile(PV + 'a_' + k + '.webp', it[1], !!a[k], `GLXAV.acc('${k}',${a[k] ? 'null' : "'#111827'"})`) }).join(''));
    if (ACCG[tab]) h = accPanel(tab);
    if (tab === 'lichaam') { const b = A.body || {}; h = lbl('Lengte') + optRow('bod', 'len', b.len, BODYX.len) + lbl('Hoofd') + optRow('bod', 'hoofd', b.hoofd, BODYX.hoofd) }
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
      if (fig) { if (!drag && !previewWalk && !(CLOSE[tab] > .5)) spin += .003; fig.root.rotation.y = spin; if (waveT && now > waveT) { waveT = 0; fig.play(previewWalk ? 'Walk' : 'Idle') } fig.mixer.update(dt) }
      { const z = CLOSE[tab] || 0, L = +((A.body || {}).len || 1), ty = (.88 + (1.47 - .88) * z) * L, tz = 4.3 - 2.55 * z, ey = (1.02 + (1.5 - 1.02) * z) * L; const kk = 1 - Math.exp(-dt * 7); camS.y += (ey - camS.y) * kk; camS.z += (tz - camS.z) * kk; camS.t += (ty - camS.t) * kk; cam.position.set(0, camS.y, camS.z); cam.lookAt(0, camS.t, 0); if (z > .5 && !drag) spin += (Math.round(spin / (Math.PI * 2)) * Math.PI * 2 - spin) * kk } fit(); renderer.render(scene, cam); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    if (!fig || fig.model !== A.model) await rebuild(); else fig.tint(A);
  }
  function snapshot() {
    if (!renderer || !fig) return null;
    try {
      const sc = makeScene(true), r = newRenderer(256, 256, true), c = new THREE.PerspectiveCamera(26, 1, .1, 50), old = fig.root.rotation.y, par = fig.root.parent;
      r.setPixelRatio(1); r.setSize(256, 256, false); sc.add(fig.root); fig.root.rotation.y = .35; c.position.set(0, .98, 5.1); c.lookAt(0, .86, 0);
      sc.userData.env(r); r.render(sc, c); let url = r.domElement.toDataURL('image/webp', .85); if (!/^data:image\/webp/.test(url)) url = r.domElement.toDataURL('image/png'); fig.root.rotation.y = old; if (par) par.add(fig.root); r.dispose(); try { r.forceContextLoss() } catch (e) { } return url;
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
      if (document.hidden || !mapR.domElement.isConnected || !mapR.domElement.offsetParent || now - last < 31) { mapRaf = requestAnimationFrame(loop); return }  /* niet tekenen als je het niet ziet, max ~30 fps: spaart batterij */
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
  /* geheugen vrijmaken na een fotootje (anders loopt de gsm vol bij lange lijsten) */
  function disposeFig(f) { try { f.root.traverse(o => { if (o.geometry) o.geometry.dispose(); [].concat(o.material || []).forEach(m => { Object.keys(m).forEach(k => { const t = m[k]; if (t && t.isTexture && !(t.userData && t.userData.shared)) t.dispose() }); m.dispose() }) }) } catch (e) { } }
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
      tS.remove(f.root); disposeFig(f); return url;
    }).catch(() => null)));
    thumbs.set(key, p); return p;
  }

  const fail = e => { console.error(e); const m = $('avMsg'); if (m) { m.style.display = ''; m.textContent = '⚠️ 3D kon niet laden. Controleer je internet en probeer opnieuw.' } };
  const api = window.GLXAV = {
    open() { ensureDom(); panel(); document.querySelectorAll('.ov.on').forEach(o => o.classList.remove('on')); $('avV').classList.add('on'); start().catch(fail) },
    close() { $('avV').classList.remove('on') },
    set(k, v) { if (k === 'model') { if (!MODELS[v] || v === A.model) return; A = { model: v, skin: A.skin, hair: null, eyes: null, face: A.face || null, parts: {}, prints: {}, acc: A.acc || {}, fx: A.fx || {}, body: A.body || {}, hs: '', shoe: A.shoe || '', shoeCol: A.shoeCol || null }; panel(); rebuild().catch(fail); return } if (k === 'shoe' && A.acc && A.acc.laars) { A.acc = Object.assign({}, A.acc); delete A.acc.laars } A[k] = v; if (fig) { fig.tint(A); if (k === 'face' && fig.face) fig.face(v) } panel() },
    fx(k, v) { A.fx = Object.assign({}, A.fx); if (!v) delete A.fx[k]; else A.fx[k] = v; if (fig) fig.tint(A); panel() },
    bod(k, v) { A.body = Object.assign({}, A.body); if (!v) delete A.body[k]; else A.body[k] = v; if (fig) fig.tint(A); panel() },
    async _shot(cfg, frame, rot) { await lib(); if (!api._sR) { api._sR = newRenderer(220, 220, true); api._sR.setPixelRatio(1); api._sR.setSize(220, 220, false); api._sS = makeScene(true); api._sS.userData.env(api._sR); api._sC = new THREE.PerspectiveCamera(22, 1, .05, 50) }
      const f = await figure(clean(cfg, 'x')); f.root.rotation.y = rot || 0; f.mixer.update(.016); api._sS.add(f.root); const hb = f.headY || 1.47, C = api._sC, F = { face: [hb + .06, 1.05, hb + .05], face2: [hb + .03, .72, hb + .01], hips: [.95, 1.9, .86], head: [hb + .08, 1.8, hb + .05], bust: [hb - .12, 2.3, hb - .2], full: [.9, 5.2, .86], feet: [.3, 1.6, .12] }[frame || 'head'];
      C.position.set(0, F[0], F[1]); C.lookAt(0, F[2], 0); if (f.lookAt) f.lookAt(C); api._sR.render(api._sS, C); await new Promise(r => requestAnimationFrame(r)); f.mixer.update(.016); api._sR.render(api._sS, C); const u = api._sR.domElement.toDataURL('image/webp', .82); api._sS.remove(f.root); disposeFig(f); return u },
    accPick(k) { const it = ACC.find(x => x[0] === k), a = A.acc || {}; accSel = k; if (!a[k] && it) { const v = it[2] === 'metal' ? it[3][0] : it[2] === 'pick' ? it[3][0][0] : ACOL[0]; if (k === 'hanger' && !a.ketting) { api.acc('ketting', 'goud') } api.acc(k, v); return } panel() },
    acc(k, v) { A.acc = Object.assign({}, A.acc); if (!v) delete A.acc[k]; else A.acc[k] = v; const HATS = ['pet', 'merchpet', 'muts', 'hoed', 'kroon', 'bandana']; if (v && HATS.includes(k)) HATS.forEach(x => { if (x !== k) delete A.acc[x] }); if (fig) fig.tint(A); panel() },
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
<div style="flex:1;min-width:0">${row('👟', 'Stappen', Math.round((g.walked || 0) / .75).toLocaleString((document.documentElement.lang||undefined)))}${row('🚶', 'Gewandeld', km + ' km')}${row('📍', 'Check-ins', g.nCheck || 0)}${row('👥', 'Groepsdates', (g.groups || []).length)}
<button class="btn sm" style="width:100%;margin-top:8px" onclick="GLXAV.open()">👕 ${has() ? 'Stijl' : 'Maak je mannetje'}</button></div></div>`);
  }
  window.addEventListener('glx-avatar', profBtn);
  (function () { const g = window.go; if (typeof g === 'function') window.go = function (v) { const r = g.apply(this, arguments); if (v === 'profile') profBtn(); return r } })();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', profBtn); else profBtn();
})();
