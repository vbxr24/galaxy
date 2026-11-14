/* Galaxy – Account.
   - Account bewaren: je automatische (anonieme) account krijgt een e-mail en wachtwoord. Je profiel, matches en chats blijven.
   - Inloggen op een ander toestel met dat e-mailadres.
   - Mijn gegevens downloaden (GDPR, recht op inzage en overdraagbaarheid).
   - Geschorst account: duidelijk scherm met de reden en hoe je bezwaar maakt (Digital Services Act).
   - Beheerders zien een link naar het beheerscherm. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = m => { try { toast(m) } catch (e) { } };
  const nl = () => { try { return (typeof LANG === 'undefined' ? 'nl' : LANG) === 'nl' } catch (e) { return true } };
  const t = (a, b) => nl() ? a : b;
  const net = () => window.GLXNET || {};
  const db = () => net().db;
  const MAIL = () => { try { return (typeof CONTACT_EMAIL !== 'undefined' && CONTACT_EMAIL) || 'galaxy.app.xv@gmail.com' } catch (e) { return 'galaxy.app.xv@gmail.com' } };
  const okMail = s => /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(s || '');
  const why = e => {
    const m = String((e && e.message) || e || '');
    if (/rate limit|too many/i.test(m)) return t('Te veel pogingen. Probeer het over een uur opnieuw.', 'Too many attempts. Try again in an hour.');
    if (/already|registered|exists/i.test(m)) return t('Dit e-mailadres is al in gebruik. Log in in plaats daarvan.', 'This email is already in use. Log in instead.');
    if (/invalid login|credentials/i.test(m)) return t('E-mail of wachtwoord klopt niet.', 'Email or password is wrong.');
    if (/not confirmed/i.test(m)) return t('Bevestig eerst je e-mailadres via de mail die je kreeg.', 'Confirm your email first via the mail you received.');
    if (/password/i.test(m) && /short|least|weak/i.test(m)) return t('Kies een sterker wachtwoord (minstens 8 tekens).', 'Choose a stronger password (at least 8 characters).');
    if (/email.*(send|provider|smtp)|sending/i.test(m)) return t('De bevestigingsmail kon niet verstuurd worden. Probeer later opnieuw.', 'The confirmation email could not be sent. Try again later.');
    return t('Dat lukte niet. Probeer het opnieuw.', 'That did not work. Please try again.');
  };
  async function user() { try { return (await db().auth.getUser()).data.user } catch (e) { return null } }

  /* ---------- account-scherm ---------- */
  async function open() {
    if (!db()) return T(t('Even geduld: Galaxy maakt nog verbinding.', 'One moment: Galaxy is still connecting.'));
    const u = await user(); const saved = u && !u.is_anonymous && u.email, pending = u && u.new_email;
    const pw = (id, ph) => `<input class="fld" id="${id}" type="password" autocomplete="${id === 'acPw' || id === 'acPw2' ? 'new-password' : 'current-password'}" minlength="8" maxlength="72" placeholder="${ph}" style="margin:0 0 8px">`;
    xs('👤 ' + t('Account', 'Account'), saved ? `
<div class="box"><b>✅ ${t('Je account is bewaard', 'Your account is saved')}</b><p class="sub" style="margin-top:6px">${esc(u.email)}</p>
<p class="sub" style="margin-top:6px">${t('Log met dit e-mailadres in op een ander toestel en je hebt je profiel, matches en chats terug.', 'Log in with this email on another device to get your profile, matches and chats back.')}</p></div>
<button class="btn ghost" style="width:100%;margin-bottom:8px" onclick="GLXACC.data()">📦 ${t('Mijn gegevens downloaden', 'Download my data')}</button>
<button class="btn ghost" style="width:100%" onclick="GLXACC._logout()">${t('Uitloggen op dit toestel', 'Log out on this device')}</button>` : `
<div class="box" style="border-color:#f59e0b"><b>⚠️ ${t('Je account staat alleen op deze gsm', 'Your account only lives on this phone')}</b><p class="sub" style="margin-top:6px">${t('Verlies je je gsm of wis je de app, dan ben je je profiel, matches en chats kwijt. Bewaar je account met een e-mailadres.', 'If you lose your phone or clear the app, you lose your profile, matches and chats. Save your account with an email.')}</p></div>
${pending ? `<div class="box"><p>📧 ${t('Bevestig je e-mail via de link in de mail naar', 'Confirm your email via the link sent to')} <b>${esc(pending)}</b>.</p></div>` : ''}
<div class="box"><b>💾 ${t('Account bewaren', 'Save account')}</b>
<input class="fld" id="acMail" type="email" autocomplete="email" maxlength="254" placeholder="${t('E-mailadres', 'Email address')}" style="margin:10px 0 8px">
${pw('acPw', t('Nieuw wachtwoord (min. 8 tekens)', 'New password (min. 8 characters)'))}${pw('acPw2', t('Herhaal wachtwoord', 'Repeat password'))}
<button class="btn" style="width:100%" onclick="GLXACC._save()">${t('Bewaren', 'Save')}</button></div>
<div class="box"><b>🔑 ${t('Al een account? Log in', 'Already have an account? Log in')}</b>
<input class="fld" id="liMail" type="email" autocomplete="email" maxlength="254" placeholder="${t('E-mailadres', 'Email address')}" style="margin:10px 0 8px">
${pw('liPw', t('Wachtwoord', 'Password'))}
<button class="btn ghost" style="width:100%" onclick="GLXACC._login()">${t('Inloggen', 'Log in')}</button>
<button class="btn sm ghost" style="width:100%;margin-top:8px" onclick="GLXACC._forgot()">${t('Wachtwoord vergeten?', 'Forgot password?')}</button></div>
<button class="btn ghost" style="width:100%" onclick="GLXACC.data()">📦 ${t('Mijn gegevens downloaden', 'Download my data')}</button>`, false);
  }

  async function save() {
    const mail = ($('acMail').value || '').trim().toLowerCase(), p1 = $('acPw').value || '', p2 = $('acPw2').value || '';
    if (!okMail(mail)) return T(t('Vul een geldig e-mailadres in', 'Enter a valid email'));
    if (p1.length < 8) return T(t('Wachtwoord: minstens 8 tekens', 'Password: at least 8 characters'));
    if (p1 !== p2) return T(t('De wachtwoorden zijn niet gelijk', 'Passwords do not match'));
    const r = await db().auth.updateUser({ email: mail, password: p1 });
    if (r.error) return T(why(r.error));
    const u = r.data.user;
    T(u && u.email === mail ? '✅ ' + t('Account bewaard!', 'Account saved!') : '📧 ' + t('Check je mail en klik op de bevestigingslink', 'Check your mail and click the confirmation link'));
    open();
  }

  /* profiel van de server terug in de app zetten (na inloggen op een nieuw toestel) */
  function toMe(p) {
    const born = p.birth, age = (() => { const b = new Date(born), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a })();
    return { name: p.name, born, age, city: p.city || '', bio: p.bio || '', cat: p.cat || null, gender: p.gender || null, pron: p.pron || null, orient: p.orient || null, showOrient: !!p.show_orient, seek: p.seek || [], ints: p.ints || [], basics: p.basics || {}, music: p.music || '', ig: p.ig || '', snap: p.snap || '', socialVis: p.social_vis || 'verborgen', ptheme: p.ptheme || 'Galaxy' };
  }
  async function login() {
    const mail = ($('liMail').value || '').trim().toLowerCase(), pw = $('liPw').value || '';
    if (!okMail(mail) || !pw) return T(t('Vul e-mail en wachtwoord in', 'Enter email and password'));
    const before = await user();
    if (before && before.is_anonymous && !confirm(t('Inloggen vervangt het profiel op deze gsm door je bewaarde account. Doorgaan?', 'Logging in replaces the profile on this phone with your saved account. Continue?'))) return;
    const r = await db().auth.signInWithPassword({ email: mail, password: pw });
    if (r.error) return T(why(r.error));
    try {
      const p = (await db().from('profiles').select('*').eq('id', r.data.user.id).maybeSingle()).data;
      if (p) { localStorage.glxMe = JSON.stringify(toMe(p)); if (p.avatar) localStorage.glxAvatar = JSON.stringify(p.avatar); if (p.ghost) localStorage.glxGhost = '1'; else localStorage.removeItem('glxGhost') }
    } catch (e) { }
    T('✅ ' + t('Ingelogd', 'Logged in')); setTimeout(() => location.reload(), 700);
  }
  async function forgot() {
    const mail = (($('liMail') || {}).value || '').trim().toLowerCase();
    if (!okMail(mail)) return T(t('Vul eerst je e-mailadres in', 'Enter your email first'));
    const r = await db().auth.resetPasswordForEmail(mail, { redirectTo: location.origin + location.pathname + '?reset=1' });
    T(r.error ? why(r.error) : '📧 ' + t('Als dit adres bestaat, krijg je een mail om je wachtwoord te herstellen.', 'If this address exists, you will get an email to reset your password.'));
  }
  async function newPasswordAfterReset() {
    if (!/[?&#]reset=1|type=recovery/.test(location.href)) return;
    const pw = prompt(t('Kies een nieuw wachtwoord (min. 8 tekens)', 'Choose a new password (min. 8 characters)'));
    if (!pw || pw.length < 8) return;
    const r = await db().auth.updateUser({ password: pw }); T(r.error ? why(r.error) : '✅ ' + t('Wachtwoord gewijzigd', 'Password changed'));
    try { history.replaceState(null, '', location.pathname) } catch (e) { }
  }
  async function logout() {
    if (!confirm(t('Uitloggen? Je profiel blijft bewaard; je kunt later opnieuw inloggen.', 'Log out? Your profile stays saved; you can log in again later.'))) return;
    try { await db().auth.signOut() } catch (e) { }
    ['glxMe', 'glxAvatar', 'glxAvatarImg', 'glxAuth', 'glxGhost', 'glxCoins', 'glxDaily', 'glxTickets'].forEach(k => { try { localStorage.removeItem(k) } catch (e) { } });
    location.replace(location.pathname);
  }

  /* ---------- mijn gegevens downloaden ---------- */
  async function data() {
    if (!db()) return T(t('Even geduld: Galaxy maakt nog verbinding.', 'One moment: Galaxy is still connecting.'));
    T('📦 ' + t('Gegevens verzamelen…', 'Collecting data…'));
    const id = net().uid, get = async (tbl, q) => { try { const r = await q(db().from(tbl).select('*')); return r.error ? { fout: r.error.message } : r.data } catch (e) { return null } };
    const out = {
      uitleg: t('Dit zijn alle gegevens die Galaxy over jou bewaart op de server, plus wat op dit toestel staat. Je exacte locatie bewaren we nooit; alleen een zone van ongeveer 300 m.', 'This is all data Galaxy stores about you on the server, plus what is stored on this device. We never store your exact location, only a zone of about 300 m.'),
      gemaakt: new Date().toISOString(), gebruiker_id: id,
      account: await (async () => { const u = await user(); return u ? { email: u.email || null, aangemaakt: u.created_at, laatst_ingelogd: u.last_sign_in_at } : null })(),
      profiel: await get('profiles', q => q.eq('id', id).maybeSingle()),
      zone_op_de_kaart: await get('presence', q => q.eq('user_id', id)),
      check_ins: await get('checkins', q => q.eq('user_id', id)),
      zwaaien_door_jou: await get('waves', q => q.eq('from_id', id)),
      geblokkeerd_door_jou: await get('blocks', q => q.eq('blocker', id)),
      berichten: await get('messages', q => q.order('at', { ascending: true }).limit(10000)),
      dates: await get('date_plans', q => q.order('starts_at', { ascending: true })),
      ontvangen_complimenten: await (async () => { try { return (await db().rpc('my_compliments')).data } catch (e) { return null } })(),
      op_dit_toestel: (() => { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^glx/.test(k) && k !== 'glxAuth') { const v = localStorage.getItem(k); try { o[k] = JSON.parse(v) } catch (e) { o[k] = v } } } } catch (e) { } return o })()
    };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    a.download = 'galaxy-mijn-gegevens-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 800);
    T('📦 ' + t('Je gegevens zijn gedownload', 'Your data was downloaded'));
  }

  /* ---------- geschorst? + beheerder? ---------- */
  async function checkStatus() {
    if (!db()) return;
    try {
      const p = (await db().from('profiles').select('banned_at,ban_reason').eq('id', net().uid).maybeSingle()).data;
      if (p && p.banned_at && !$('banScreen')) {
        document.body.insertAdjacentHTML('beforeend', `<div id="banScreen" role="alertdialog" aria-modal="true" style="position:fixed;inset:0;z-index:500;background:#0b0718;color:#fff;display:grid;place-items:center;padding:28px;text-align:center"><div style="max-width:420px">
<div style="font-size:56px">⛔</div><h2 style="margin:10px 0">${t('Je account is geschorst', 'Your account has been suspended')}</h2>
<p style="opacity:.85">${t('Op', 'On')} ${new Date(p.banned_at).toLocaleDateString(nl() ? 'nl-BE' : undefined)} ${t('heeft het Galaxy-team je account geschorst. Je bent niet meer zichtbaar en kunt niemand berichten sturen.', 'the Galaxy team suspended your account. You are no longer visible and cannot message anyone.')}</p>
<p style="margin:14px 0;padding:12px;border-radius:12px;background:#ffffff14"><b>${t('Reden', 'Reason')}:</b> ${esc(p.ban_reason || '')}</p>
<p style="opacity:.85">${t('Niet akkoord? Mail binnen 6 maanden je bezwaar naar', 'Disagree? Email your appeal within 6 months to')} <a style="color:#f9a8d4" href="mailto:${MAIL()}?subject=${encodeURIComponent('Bezwaar schorsing ' + net().uid)}">${MAIL()}</a>. ${t('Een mens bekijkt je bezwaar.', 'A human will review your appeal.')}</p>
<button class="btn ghost" style="margin-top:16px" onclick="GLXACC.data()">📦 ${t('Mijn gegevens downloaden', 'Download my data')}</button></div></div>`);
      }
      const a = await db().rpc('is_admin');
      if (a.data === true) { const box = $('acRow') && $('acRow').parentElement; if (box && !$('admRow')) box.insertAdjacentHTML('beforeend', `<a class="set" id="admRow" href="beheer.html" style="color:inherit;text-decoration:none"><span>🛡️ ${t('Beheer (meldingen)', 'Admin (reports)')}</span><span class="sub">›</span></a>`) }
    } catch (e) { }
  }

  /* ---------- eerlijk over betalen: nog geen echte aankopen ---------- */
  function honestShop() {
    const tf = t('Testfase', 'Test phase');
    if (typeof window.buyCoins === 'function' && !window.buyCoins._glx) {
      window.buyCoins = function () { try { closeO('planV') } catch (e) { } xs('🪙 ' + t('Munten kopen', 'Buy coins'), `<p>${t('Munten kopen kan nog niet: dat komt binnenkort via Google Play. Je wordt nu niets aangerekend.', 'Buying coins is not available yet: it is coming soon via Google Play. You are not charged anything.')}</p><p class="sub" style="margin-top:8px">${t('Verdien intussen gratis munten met de 🎁 Dagbonus en de Vraag van de dag.', 'Meanwhile, earn free coins with the 🎁 Daily bonus and the Question of the day.')}</p><button class="btn" style="width:100%;margin-top:12px" onclick="closeO('xV');GLXDAY&&GLXDAY.open()">🎁 ${t('Naar de dagbonus', 'Go to daily bonus')}</button>`, false) };
      window.buyCoins._glx = 1;
    }
    if (typeof window.buyPlan === 'function' && !window.buyPlan._glx) {
      const o = window.buyPlan;
      window.buyPlan = function () { o.apply(this, arguments); T('✦ ' + tf + ': ' + t('gratis uitproberen, er wordt niets aangerekend', 'free to try, nothing is charged')) };
      window.buyPlan._glx = 1;
    }
    if (typeof window.buyLifetime === 'function' && !window.buyLifetime._glx) {
      window.buyLifetime = function () { try { closeO('planV') } catch (e) { } T(t('Galaxy Forever kan nog niet gekocht worden. Je wordt niets aangerekend.', 'Galaxy Forever cannot be bought yet. You are not charged.')) };
      window.buyLifetime._glx = 1;
    }
    try { const st = document.createElement('style'); st.textContent = '#planSheet::before{content:"' + t('Testfase: betalen kan nog niet, je wordt niets aangerekend.', 'Test phase: payments are not live yet, you are not charged.') + '";display:block;margin:0 0 10px;padding:8px 12px;border-radius:12px;background:#78350f55;font-size:13px}'; document.head.appendChild(st) } catch (e) { }
  }

  window.GLXACC = { open, data, _save: save, _login: login, _forgot: forgot, _logout: logout };

  function hook() {
    honestShop();
    try { if (typeof HUB !== 'undefined' && !HUB.some(h => /GLXACC/.test(h[2]))) HUB.splice(1, 0, ['👤', t('Account', 'Account'), 'GLXACC.open()']) } catch (e) { }
    try { const g = $('ghostTg'), box = g && g.closest('.box'); if (box && !$('acRow')) box.insertAdjacentHTML('afterbegin', `<div class="set" id="acRow"><span>👤 ${t('Account bewaren en inloggen', 'Save account and log in')}</span><button class="btn sm ghost" onclick="GLXACC.open()">${t('Open', 'Open')}</button></div>`) } catch (e) { }
    let done = false; const go = () => { if (done) return; done = true; checkStatus(); newPasswordAfterReset() };
    if (net().state === 'verbonden') go(); else window.addEventListener('glx-net', e => { if (e.detail === 'verbonden') go() });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
