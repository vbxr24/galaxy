/* Galaxy – pushmeldingen bij nieuwe berichten. Staat standaard UIT; de gebruiker zet het zelf aan.
   Meldingen tonen nooit de inhoud of de naam, alleen "Je hebt een nieuw bericht". */
(function () {
  'use strict';
  const KEY = 'BOGDsADs2UfDIgmgfgmHuCw3TPaaJeb7tMyed7t97lqBv4h1mY6A3u7g_36jVyAqp8oJ2BEqVM-tmZAAUa8Fd3k';
  const $ = id => document.getElementById(id);
  const T = m => { try { toast(m) } catch (e) { } };
  const nl = () => { try { return (typeof LANG === 'undefined' ? 'nl' : LANG) === 'nl' } catch (e) { return true } };
  const t = (a, b) => nl() ? a : b;
  const db = () => (window.GLXNET || {}).db;
  const can = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator.standalone || matchMedia('(display-mode: standalone)').matches);
  const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)) };
  const enc = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  async function sub() { const r = await navigator.serviceWorker.ready; return r.pushManager.getSubscription() }
  async function on() {
    if (ios()) return T(t('Op iPhone: zet Galaxy eerst op je beginscherm (Deel → Zet op beginscherm), open het daar en zet meldingen dan aan.', 'On iPhone: add Galaxy to your home screen first (Share → Add to Home Screen), open it there and then turn on notifications.'));
    if (!can()) return T(t('Je browser ondersteunt geen meldingen.', 'Your browser does not support notifications.'));
    if (!db()) return T(t('Even geduld: Galaxy maakt nog verbinding.', 'One moment: Galaxy is still connecting.'));
    if (await Notification.requestPermission() !== 'granted') { draw(); return T(t('Meldingen zijn geweigerd. Je kunt dit later aanpassen in de instellingen van je browser.', 'Notifications were blocked. You can change this later in your browser settings.')) }
    try {
      const r = await navigator.serviceWorker.ready;
      const s = (await r.pushManager.getSubscription()) || await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(KEY) });
      const res = await db().from('push_subs').upsert({ endpoint: s.endpoint, p256dh: enc(s.getKey('p256dh')), auth: enc(s.getKey('auth')) });
      if (res.error) throw res.error;
      T('🔔 ' + t('Meldingen staan aan', 'Notifications are on'));
    } catch (e) { T(t('Meldingen aanzetten lukte niet.', 'Could not turn on notifications.')) }
    draw();
  }
  async function off() {
    try { const s = await sub(); if (s) { if (db()) await db().from('push_subs').delete().eq('endpoint', s.endpoint); await s.unsubscribe() } } catch (e) { }
    try { localStorage.removeItem('glxNear') } catch (e) { } T('🔕 ' + t('Meldingen staan uit', 'Notifications are off')); draw();
  }
  async function draw() {
    const el = $('pushRow'); if (!el) return;
    let active = false; try { active = can() && Notification.permission === 'granted' && !!(await sub()) } catch (e) { }
    el.querySelector('button').textContent = active ? t('Uit', 'Off') : t('Aan', 'On');
    el.querySelector('button').onclick = active ? off : on;
    const n = $('nearRow'); if (n) { n.style.display = active ? '' : 'none'; const m = localStorage.glxNear || 'uit'; n.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === m)) }
  }
  /* trillen als er iemand in de buurt is – ook op je smartwatch, want die toont de meldingen van je gsm */
  async function near(mode) {
    try {
      const s = await sub(); if (!s || !db()) return T(t('Zet eerst meldingen aan', 'Turn on notifications first'));
      const r = await db().rpc('set_near_alert', { ep: s.endpoint, mode }); if (r.error) throw r.error;
      localStorage.glxNear = mode; draw(); buzz(mode === 'uit' ? [40] : [200, 100, 200]);
      T(mode === 'uit' ? t('Geen meldingen meer over mensen in de buurt', 'No more nearby alerts') : mode === 'matches' ? '💞 ' + t('Je trilt als een match in de buurt is', 'You buzz when a match is nearby') : '✨ ' + t('Je trilt als er iemand in de buurt is', 'You buzz when someone is nearby'));
    } catch (e) { T(t('Dat lukte niet. Probeer opnieuw.', 'That did not work. Try again.')) }
  }
  function buzz(p) { try { if (localStorage.glxHaptics !== '0' && navigator.vibrate) navigator.vibrate(p) } catch (e) { } }
  window.GLXPUSH = { on, off, near, buzz };

  function hook() {
    try { const g = $('ghostTg'), box = g && g.closest('.box'); if (box && !$('pushRow')) { box.insertAdjacentHTML('afterbegin', `<div class="set" id="pushRow"><span>🔔 ${t('Melding bij een nieuw bericht', 'Notify me of new messages')}</span><button class="btn sm ghost">…</button></div>
<div id="nearRow" style="display:none;padding:8px 0"><div style="font-size:14px">⌚ ${t('Trillen als iemand in de buurt is (ook op je smartwatch)', 'Buzz when someone is nearby (also on your smartwatch)')}</div>
<div style="display:flex;gap:6px;margin-top:6px">${[['uit', t('Uit', 'Off')], ['matches', '💞 ' + t('Matches', 'Matches')], ['iedereen', '✨ ' + t('Iedereen', 'Everyone')]].map(([m, l]) => `<button class="btn sm ghost" data-m="${m}" onclick="GLXPUSH.near('${m}')" style="flex:1">${l}</button>`).join('')}</div>
<div class="sub" style="font-size:12px;margin-top:4px">${t('Je ziet nooit wie of waar precies. Max. 1 keer per half uur.', 'You never see who or exactly where. Max once per half hour.')}</div></div>`); draw() } } catch (e) { }
    try { const st = document.createElement('style'); st.textContent = '#nearRow .btn.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent}'; document.head.appendChild(st) } catch (e) { }
    /* aantal ongelezen berichten op het app-icoon */
    try { const dot = $('chatDot'); if (dot && 'setAppBadge' in navigator) new MutationObserver(() => { const n = parseInt(dot.textContent) || 0; (dot.style.display !== 'none' && n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => { }) }).observe(dot, { attributes: true, childList: true, characterData: true, subtree: true }) } catch (e) { }
    if (/[?&]map=1/.test(location.search)) { try { history.replaceState(null, '', location.pathname) } catch (e) { } setTimeout(() => { try { go('map') } catch (e) { } }, 400) }
    if (/[?&]chat=1/.test(location.search)) { try { history.replaceState(null, '', location.pathname) } catch (e) { } setTimeout(() => { try { go('chat') } catch (e) { } }, 400) }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
