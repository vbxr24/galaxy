/* Galaxy themalied: eigen compositie, gemaakt met WebAudio (geen opname, geen licentie nodig).
   Staat standaard uit. Knop 🎵 in de balk zet het aan of uit; de keuze wordt onthouden. */
(function () {
  'use strict';
  let ctx, master, timer, step = 0, next = 0, on = false;
  const BPM = 104, S16 = 60 / BPM / 4;
  const f = n => 440 * Math.pow(2, (n - 69) / 12);
  /* akkoorden: Am – F – C – G (elk 1 maat), 2 keer, daarna Dm – F – C – E */
  const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62], [50, 53, 57], [53, 57, 60], [48, 52, 55], [52, 56, 59]];
  /* melodie per maat: [stap(0-15), noot, lengte in 16den] */
  const MEL = [
    [[0, 76, 4], [4, 72, 2], [6, 74, 2], [8, 76, 6]],
    [[0, 77, 4], [4, 76, 2], [6, 72, 2], [8, 69, 6]],
    [[0, 67, 2], [2, 72, 2], [4, 76, 4], [8, 79, 6]],
    [[0, 74, 4], [4, 71, 4], [8, 74, 4], [12, 79, 3]],
    [[0, 81, 4], [4, 79, 2], [6, 76, 2], [8, 72, 6]],
    [[0, 77, 2], [2, 76, 2], [4, 72, 4], [8, 77, 6]],
    [[0, 79, 4], [4, 76, 4], [8, 72, 4], [12, 76, 3]],
    [[0, 74, 6], [8, 71, 4], [12, 67, 3]],
    [[0, 69, 2], [2, 74, 2], [4, 77, 4], [8, 81, 6]],
    [[0, 81, 4], [4, 77, 4], [8, 72, 6]],
    [[0, 79, 4], [4, 76, 2], [6, 72, 2], [8, 67, 6]],
    [[0, 76, 4], [4, 80, 4], [8, 83, 7]]
  ];
  function tone(type, freq, t, dur, vol, det) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; if (det) o.detune.value = det;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function noise(t, dur, vol, hp) {
    const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    fl.type = 'highpass'; fl.frequency.value = hp; s.buffer = b; g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(master); s.start(t);
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
    g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .2); o.connect(g); g.connect(master); o.start(t); o.stop(t + .22);
  }
  function sched(i, t) {
    const bar = Math.floor(i / 16) % CH.length, s = i % 16, ch = CH[bar];
    if (s === 0) ch.forEach(n => { tone('sawtooth', f(n), t, S16 * 15, .028, -6); tone('sawtooth', f(n), t, S16 * 15, .028, 6) });      /* vlak */
    tone('triangle', f(ch[[0, 1, 2, 1][s % 4]] + 12), t, S16 * .9, .06);                                                              /* arpeggio */
    if (s % 4 === 0 || s === 10) tone('sine', f(ch[0] - 12), t, S16 * 2.4, .2);                                                      /* bas */
    if (s % 8 === 0) kick(t); if (s % 8 === 4) noise(t, .12, .1, 1800); if (s % 2 === 0) noise(t, .03, .03, 7000);                   /* drums */
    MEL[bar].forEach(([st, n, len]) => { if (st === s) { tone('square', f(n), t, S16 * len, .05); tone('sine', f(n), t, S16 * len, .08) } }); /* melodie */
  }
  function tick() { while (next < ctx.currentTime + .15) { sched(step++, next); next += S16 } }
  function start() {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false; ctx = new AC(); master = ctx.createGain(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; master.connect(lp); lp.connect(ctx.destination) }
    ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0, ctx.currentTime); master.gain.linearRampToValueAtTime(.55, ctx.currentTime + .6);
    step = 0; next = ctx.currentTime + .08; clearInterval(timer); timer = setInterval(tick, 40); on = true; return true;
  }
  function stop() { on = false; clearInterval(timer); if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, .08) } }
  function mark() { const b = document.getElementById('songBtn'); if (b) b.classList.toggle('on', on) }
  window.GLXSONG = {
    toggle() { if (on) stop(); else if (!start()) { try { toast('Geluid lukt niet op dit toestel') } catch (e) { } } try { localStorage.glxSong = on ? '1' : '' } catch (e) { } mark(); try { toast(on ? '🎵 Themalied aan' : '🔇 Themalied uit') } catch (e) { } },
    get on() { return on }
  };
  /* browsers laten geluid pas toe na een tik: start bij de eerste tik als het aan stond */
  try { if (localStorage.glxSong) addEventListener('pointerdown', function once(e) { removeEventListener('pointerdown', once); if (!on && !(e.target.closest && e.target.closest('#songBtn'))) { start(); mark() } }) } catch (e) { }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume() });
})();
