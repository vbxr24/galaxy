/* Galaxy – werkt op elk toestel: iPhone, iPad, Samsung en andere Android-gsm's, tablets, computer (website) en smartwatches.
   - grotere schermen: bredere indeling (tablet, computer)
   - installeren: knop op Android/computer, korte uitleg op iPhone/iPad (nodig voor meldingen)
   - smartwatches: de meldingen van je gsm komen vanzelf op Apple Watch, Galaxy Watch, Wear OS, Garmin, Fitbit enz. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const t = (a, b) => window.GLXL ? GLXL(a, b) : b;
  const ua = navigator.userAgent || '';
  const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isIOS = /iPhone|iPod/.test(ua) || isIPad;
  const standalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
  const isSamsung = /SamsungBrowser/.test(ua);
  const isInApp = /FBAN|FBAV|Instagram|Line\/|TikTok|Snapchat/i.test(ua);
  const cls = document.documentElement.classList;
  cls.add(isIOS ? 'is-ios' : /Android/.test(ua) ? 'is-android' : 'is-desktop'); if (isIPad) cls.add('is-ipad'); if (standalone()) cls.add('is-app');

  const css = document.createElement('style');
  css.textContent = `
/* tablet en computer */
@media (min-width:760px){
  #app{max-width:820px!important}
  .sheet{max-width:620px!important;border-radius:26px 26px 0 0}
  #nav{max-width:560px;margin-left:auto!important;margin-right:auto!important;width:100%}
  #v-feed>*,#v-chat>*,#v-profile>*{max-width:680px;margin-left:auto;margin-right:auto}
  .fdS{grid-template-columns:repeat(4,1fr)!important}
}
@media (min-width:1100px){
  #app{max-width:1200px!important}
  #v-map{padding-left:24px;padding-right:24px}
  #gmWrap,#mapWrap{height:calc(100% - 96px)!important}
  header{padding-left:24px!important;padding-right:24px!important}
}
@media (min-width:760px) and (orientation:landscape) and (max-height:900px){ #gmWrap,#mapWrap{min-height:300px!important} }
/* muis en toetsenbord (website) */
@media (hover:hover) and (pointer:fine){ button,a,[onclick]{cursor:pointer} .tile:hover,.fdS button:hover{border-color:#8b5cf688} }
:focus-visible{outline:2px solid #c4b5fd;outline-offset:2px}
/* installeren */
#glxInst{position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:300;max-width:520px;margin:0 auto;border-radius:20px;padding:14px 14px 14px 16px;
  background:linear-gradient(180deg,rgba(36,30,84,.97),rgba(20,17,50,.97));border:1px solid #ffffff22;box-shadow:0 18px 50px #0009;color:#fff;display:flex;gap:12px;align-items:center}
#glxInst img{width:46px;height:46px;border-radius:12px;flex:none}
#glxInst b{display:block;font-size:15px}#glxInst span{font-size:13px;color:#e5e1ffcc;line-height:1.35;display:block}
#glxInst .go{flex:none;border:0;border-radius:12px;padding:10px 14px;font:inherit;font-weight:700;background:#fff;color:#2e1065}
#glxInst .x{position:absolute;top:4px;right:8px;background:none;border:0;color:#fff9;font-size:18px;padding:4px}
[dir=rtl] #glxInst .x{right:auto;left:8px}`;
  document.head.appendChild(css);

  /* installeren */
  let prompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); prompt = e; later() });
  window.addEventListener('appinstalled', () => { hide(); try { localStorage.glxInstalled = '1' } catch (e) { } });
  const snoozed = () => { try { return Date.now() < +(localStorage.glxInstSnooze || 0) } catch (e) { return true } };
  const snooze = d => { try { localStorage.glxInstSnooze = Date.now() + d * 864e5 } catch (e) { } };
  function hide() { const b = $('glxInst'); if (b) b.remove() }
  function show(body, btn, fn) {
    if ($('glxInst') || $('glxGate') || $('glxTour')) return;
    document.body.insertAdjacentHTML('beforeend', `<div id="glxInst" role="dialog" aria-label="${t('Galaxy installeren', 'Install Galaxy')}"><img src="icons/icon-192.png" alt=""><div style="flex:1;min-width:0"><b>${t('Zet Galaxy op je beginscherm', 'Add Galaxy to your home screen')}</b><span>${body}</span></div>${btn ? `<button class="go" type="button">${btn}</button>` : ''}<button class="x" type="button" aria-label="${t('Sluiten', 'Close')}">✕</button></div>`);
    const el = $('glxInst'); el.querySelector('.x').onclick = () => { snooze(5); hide() };
    if (btn) el.querySelector('.go').onclick = fn;
  }
  function later() {
    if (standalone() || snoozed()) return;
    setTimeout(() => {
      if (standalone() || snoozed() || $('glxGate')) return later2();
      if (prompt) return show(t('Opent sneller, volledig scherm, en je krijgt meldingen (ook op je smartwatch).', 'Opens faster, full screen, and you get notifications (also on your smartwatch).'), t('Installeer', 'Install'), async () => { hide(); try { prompt.prompt(); const r = await prompt.userChoice; if (r && r.outcome !== 'accepted') snooze(10) } catch (e) { } prompt = null });
      if (isIOS && isInApp) return show(t('Open deze pagina eerst in Safari (⋯ → Openen in Safari). Daarna kan je Galaxy op je beginscherm zetten.', 'Open this page in Safari first (⋯ → Open in Safari), then add Galaxy to your home screen.'));
      if (isIOS) return show(t('Tik onderaan op Deel', 'Tap Share') + ' <svg width="14" height="16" viewBox="0 0 14 18" style="vertical-align:-2px" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 1v11M3 5l4-4 4 4M2 8H1v9h12V8h-1"/></svg> ' + t('en kies "Zet op beginscherm". Pas dan werken meldingen op je iPhone, iPad en Apple Watch.', 'and choose "Add to Home Screen". Only then do notifications work on iPhone, iPad and Apple Watch.'));
    }, 25000);
  }
  let tries = 0; function later2() { if (++tries < 6) setTimeout(later, 30000) }
  later();

  /* smartwatches: uitleg in de meldingen-instellingen */
  function watchNote() {
    const n = $('nearRow'); if (!n || $('watchNote')) return;
    n.insertAdjacentHTML('beforeend', `<div class="sub" id="watchNote" style="font-size:12px;margin-top:6px">⌚ ${t('Werkt met Apple Watch, Samsung Galaxy Watch, Wear OS (Pixel, Oppo, Xiaomi…), Garmin, Fitbit, Huawei en andere: je horloge toont en trilt bij de meldingen van je gsm. Op iPhone: zet Galaxy eerst op je beginscherm.', 'Works with Apple Watch, Samsung Galaxy Watch, Wear OS, Garmin, Fitbit, Huawei and more: your watch shows and buzzes for your phone\'s notifications. On iPhone: add Galaxy to your home screen first.')}</div>`);
  }
  new MutationObserver(() => { clearTimeout(watchNote.t); watchNote.t = setTimeout(watchNote, 200) }).observe(document.documentElement, { childList: true, subtree: true });

  window.GLXDEV = { isIOS, isIPad, isSamsung, standalone, install: () => { try { localStorage.removeItem('glxInstSnooze') } catch (e) { } hide(); later() } };
})();
