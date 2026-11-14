/* Galaxy – gevoel en overzicht.
   - Instellingen netjes gegroepeerd: "Account en meldingen" apart van "Veiligheid".
   - Korte tik-trilling bij knoppen (uit te zetten), zachte indruk-animatie.
   - Respecteert "minder beweging" van je toestel. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const nl = () => { try { return (typeof LANG === 'undefined' ? 'nl' : LANG) === 'nl' } catch (e) { return true } };
  const t = (a, b) => nl() ? a : b;
  const on = () => { try { return localStorage.glxHaptics !== '0' } catch (e) { return true } };

  const css = document.createElement('style');
  css.textContent = `
button,.set,.cl,a.set{-webkit-tap-highlight-color:transparent}
button{transition:transform .12s cubic-bezier(.2,.8,.2,1),filter .12s}
button:active:not(:disabled){transform:scale(.95);filter:brightness(1.12)}
#nav button:active span{transform:scale(1.25) translateY(-2px)}#nav button span{display:inline-block;transition:transform .18s cubic-bezier(.3,1.6,.5,1)}
#acBox{animation:glxIn .35s ease both}#acBox b.h{display:block;margin-bottom:2px}
@keyframes glxIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
#toast.on{animation:glxPop .32s cubic-bezier(.3,1.5,.5,1)}
@keyframes glxPop{0%{transform:translate(-50%,-24px) scale(.9)}100%{transform:translate(-50%,0) scale(1)}}
@media (prefers-reduced-motion:reduce){button:active:not(:disabled){transform:none}#toast.on,#acBox{animation:none}}`;
  document.head.appendChild(css);

  /* korte trilling bij een tik (Android; iPhone ondersteunt dit niet in de browser) */
  document.addEventListener('pointerdown', e => {
    if (!on() || !navigator.vibrate) return;
    const b = e.target.closest('button,.set[onclick],a.set'); if (!b || b.disabled) return;
    try { navigator.vibrate(b.classList.contains('btn') && !b.classList.contains('ghost') ? 12 : 6) } catch (x) { }
  }, { passive: true });

  /* een stevige trilling bij goed nieuws in de app */
  const T0 = window.toast;
  if (typeof T0 === 'function') window.toast = function (m) { try { if (on() && navigator.vibrate && /^(💞|✅|🎉|🎁|✦)/.test(String(m))) navigator.vibrate([20, 60, 30]) } catch (e) { } return T0.apply(this, arguments) };

  /* instellingen groeperen */
  function group() {
    const g = $('ghostTg'), safe = g && g.closest('.box'); if (!safe) return;
    let box = $('acBox');
    if (!box) {
      safe.insertAdjacentHTML('beforebegin', `<div class="box" id="acBox"><b class="h">⚙️ ${t('Account en meldingen', 'Account and notifications')}</b>
<div class="set" id="hapRow"><span>📳 ${t('Trillen bij tikken', 'Vibrate on tap')}</span><button class="tg${on() ? ' on' : ''}" aria-label="${t('Trillen bij tikken', 'Vibrate on tap')}" onclick="this.classList.toggle('on');try{localStorage.glxHaptics=this.classList.contains('on')?'1':'0'}catch(e){}"></button></div></div>`);
      box = $('acBox');
    }
    const head = box.querySelector('b.h'); let after = head;
    ['acRow', 'qrRow', 'pushRow', 'nearRow', 'admRow'].forEach(id => { const el = $(id); if (el && el.parentElement !== box) { after.insertAdjacentElement('afterend', el); } if (el && el.parentElement === box) after = el });
  }
  function hook() {
    group();
    /* andere modules voegen hun rijen later toe: even blijven opletten */
    let n = 0; const iv = setInterval(() => { group(); if (++n > 20) clearInterval(iv) }, 500);
    const g = window.go; if (typeof g === 'function' && !g._feel) { window.go = function (v) { const r = g.apply(this, arguments); if (v === 'profile') setTimeout(group, 50); return r }; window.go._feel = 1 }
    window.addEventListener('glx-net', () => setTimeout(group, 800));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
