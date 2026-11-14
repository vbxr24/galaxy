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
    T('🔕 ' + t('Meldingen staan uit', 'Notifications are off')); draw();
  }
  async function draw() {
    const el = $('pushRow'); if (!el) return;
    let active = false; try { active = can() && Notification.permission === 'granted' && !!(await sub()) } catch (e) { }
    el.querySelector('button').textContent = active ? t('Uit', 'Off') : t('Aan', 'On');
    el.querySelector('button').onclick = active ? off : on;
  }
  window.GLXPUSH = { on, off };

  function hook() {
    try { const g = $('ghostTg'), box = g && g.closest('.box'); if (box && !$('pushRow')) { box.insertAdjacentHTML('afterbegin', `<div class="set" id="pushRow"><span>🔔 ${t('Melding bij een nieuw bericht', 'Notify me of new messages')}</span><button class="btn sm ghost">…</button></div>`); draw() } } catch (e) { }
    if (/[?&]chat=1/.test(location.search)) { try { history.replaceState(null, '', location.pathname) } catch (e) { } setTimeout(() => { try { go('chat') } catch (e) { } }, 400) }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
