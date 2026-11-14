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
  const t = (a, b) => (nl() && !document.getElementById('glxGate')) ? a : b;
  const net = () => window.GLXNET || {};
  const db = () => net().db || CL;
  let CL = null, memPw = null;
  async function cl() { if (net().db) return net().db; if (!CL && net().client) { try { CL = await net().client() } catch (e) { } } return CL }
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
  const HOME = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  async function user() { try { const c = await cl(); const s = (await c.auth.getSession()).data.session; return s ? s.user : null } catch (e) { return null } }

  /* ---------- account-scherm ---------- */
  async function open() {
    for (let i = 0; !db() && i < 25; i++) { if (i === 0) T(t('Even geduld: Galaxy maakt verbinding…', 'One moment: connecting…')); await new Promise(r => setTimeout(r, 400)) }
    if (!db()) return T(t('Geen verbinding. Controleer je internet en probeer opnieuw.', 'No connection. Check your internet and try again.'));
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

  async function save() { if (await doSave($('acMail').value, $('acPw').value, $('acPw2').value)) open() }
  async function doSave(mail, p1, p2) {
    mail = (mail || '').trim().toLowerCase(); p1 = p1 || ''; p2 = p2 || '';
    if (!okMail(mail)) return T(t('Vul een geldig e-mailadres in', 'Enter a valid email'));
    if (p1.length < 8) return T(t('Wachtwoord: minstens 8 tekens', 'Password: at least 8 characters'));
    if (p1 !== p2) return T(t('De wachtwoorden zijn niet gelijk', 'Passwords do not match'));
    const c = await cl(); if (!c) return T(t('Geen verbinding. Probeer opnieuw.', 'No connection. Try again.'));
    const cur = await user(); memPw = p1;
    const r = cur ? await c.auth.updateUser({ email: mail, password: p1 }, { emailRedirectTo: HOME() + '?saved=1' })
                  : await c.auth.signUp({ email: mail, password: p1, options: { emailRedirectTo: HOME() + '?saved=1' } });
    if (!cur && !r.error && r.data && !r.data.session) { pendingMail = mail; T('📧 ' + t('Check je mail en klik op de bevestigingslink', 'Check your mail and click the confirmation link')); return true }
    if (r.error) return T(why(r.error));
    const u = r.data.user;
    if (r.data.session) { pendingMail = null; }
    T(u && u.email === mail ? '✅ ' + t('Account bewaard!', 'Account saved!') : '📧 ' + t('Check je mail en klik op de bevestigingslink', 'Check your mail and click the confirmation link'));
    return true;
  }

  /* profiel van de server terug in de app zetten (na inloggen op een nieuw toestel) */
  function toMe(p) {
    const born = p.birth, age = (() => { const b = new Date(born), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a })();
    return { name: p.name, born, age, city: p.city || '', bio: p.bio || '', cat: p.cat || null, gender: p.gender || null, pron: p.pron || null, orient: p.orient || null, showOrient: !!p.show_orient, seek: p.seek || [], ints: p.ints || [], basics: p.basics || {}, music: p.music || '', ig: p.ig || '', snap: p.snap || '', socialVis: p.social_vis || 'verborgen', ptheme: p.ptheme || 'Galaxy' };
  }
  async function login() { return doLogin($('liMail').value, $('liPw').value, true) }
  async function doLogin(mail, pw, ask) {
    mail = (mail || '').trim().toLowerCase(); pw = pw || '';
    if (!okMail(mail) || !pw) return T(t('Vul e-mail en wachtwoord in', 'Enter email and password'));
    const before = await user();
    if (ask && before && before.is_anonymous && !confirm(t('Inloggen vervangt het profiel op deze gsm door je bewaarde account. Doorgaan?', 'Logging in replaces the profile on this phone with your saved account. Continue?'))) return;
    const c = await cl(); if (!c) return T(t('Geen verbinding. Probeer opnieuw.', 'No connection. Try again.'));
    const r = await c.auth.signInWithPassword({ email: mail, password: pw });
    if (r.error) return T(why(r.error));
    try {
      const p = (await c.from('profiles').select('*').eq('id', r.data.user.id).maybeSingle()).data;
      if (p) { localStorage.glxMe = JSON.stringify(toMe(p)); if (p.avatar) localStorage.glxAvatar = JSON.stringify(p.avatar); if (p.ghost) localStorage.glxGhost = '1'; else localStorage.removeItem('glxGhost') }
    } catch (e) { }
    T('✅ ' + t('Ingelogd', 'Logged in')); setTimeout(() => location.reload(), 700);
  }
  async function forgot() {
    const mail = ((($('liMail') || $('gLiMail')) || {}).value || '').trim().toLowerCase();
    if (!okMail(mail)) return T(t('Vul eerst je e-mailadres in', 'Enter your email first'));
    const r = await db().auth.resetPasswordForEmail(mail, { redirectTo: HOME() + '?reset=1' });
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


  const en = (a, b) => b;  /* het login-scherm is altijd in het Engels */
  /* ---------- verplicht: eerst een account (e-mail + wachtwoord), dan je gegevens ---------- */
  let gTab = 'new';
  let pendingMail = null;
  /* echte 18+-controle (Didit): selfie-leeftijdsschatting, bij twijfel ID-kaart */
  async function ageState() {
    try { const c = await cl(); const r = await c.functions.invoke('age-check', { body: { action: 'check' } }); if (r.error) return null; return r.data } catch (e) { return null }
  }
  function drawAge(status) {
    drawGate(null); const card = document.querySelector('#glxGate .card'), seg = document.querySelector('#glxGate .seg'); if (seg) seg.remove();
    const declined = /Declined/i.test(status || ''), review = /Review/i.test(status || '');
    card.innerHTML = `<div style="text-align:center"><div style="font-size:46px">🔞</div><h2 style="margin:6px 0">${declined ? 'Verification not passed' : review ? 'Being reviewed' : 'Verify you are 18+'}</h2>
<p class="lead" style="font-size:14px">${declined ? 'We could not confirm that you are 18 or older. Galaxy is strictly 18+. If you think this is a mistake, try again with your ID card or contact us.' : review ? 'A person is checking your verification. This usually takes a few minutes. You will be able to continue right after.' : 'Galaxy is strictly for adults. A quick selfie check estimates your age in seconds. Only if it is unsure, we ask for your ID card. Your selfie is not shown to anyone.'}</p>
${review ? `<button class="btn" style="width:100%;margin-top:16px" onclick="GLXACC._ageCheck()">Check again</button>` : `<button class="btn" style="width:100%;margin-top:16px" onclick="GLXACC._ageStart()">📸 ${declined ? 'Try again' : 'Start age check'}</button>`}
<p class="small">Powered by Didit · Takes about 30 seconds · <a href="privacy.html" target="_blank">How we use it</a></p>
<button class="btn sm ghost" style="width:100%;margin-top:10px" onclick="GLXACC._logout()">Log out</button></div>`;
  }
  async function ageStart() {
    const c = await cl(); const r = await c.functions.invoke('age-check', { body: { action: 'start', back: HOME() + '?age=1' } });
    if (r.error || !r.data || !r.data.url) return T('The age check could not start. Please try again.');
    location.href = r.data.url;
  }
  async function ageCheck() { const a = await ageState(); if (a && a.verified) { T('✅ Age verified. Welcome to Galaxy!'); gate() } else drawAge(a && a.status) }
  async function gate() {
    const c = await cl(); if (!c) return setTimeout(gate, 3000);
    const u = await user();
    if (u && !u.is_anonymous && u.email) {
      const a = await ageState();
      if (a && a.configured && !a.verified) return drawAge(a.status);
      const g = $('glxGate'); if (g) { g.remove(); location.reload() } document.body.classList.remove('gated'); return;
    }
    drawGate((u && u.new_email) || pendingMail);
  }
  function drawGate(pending) {
    if (!$('gateCss')) document.head.insertAdjacentHTML('beforeend', `<style id="gateCss">
#glxGate{position:fixed;inset:0;z-index:600;overflow-y:auto;background:radial-gradient(circle at 50% 0%,#3b1d7a 0%,#120a33 45%,#07061a 80%);color:#fff;padding:calc(28px + env(safe-area-inset-top)) 20px 40px}
#glxGate .in{max-width:420px;margin:0 auto}#glxGate .gLogo{display:block!important;text-align:center;margin-bottom:18px}#glxGate .gLogo img{display:block;margin:0 auto;width:76px;height:76px;border-radius:20px;box-shadow:0 10px 40px #8b5cf655}
#glxGate h1{font-size:26px;margin:10px 0 4px;font-family:inherit;background:none;-webkit-text-fill-color:#fff;color:#fff}#glxGate .lead{color:#c9c4ef;font-size:15px;margin:0}
#glxGate .seg{display:flex;background:#ffffff10;border-radius:14px;padding:4px;margin:20px 0 14px}#glxGate .seg button{flex:1;padding:10px;border-radius:11px;font-weight:700;color:#c9c4ef}#glxGate .seg button.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff}
#glxGate .fld{width:100%;margin:0 0 10px}#glxGate .small{font-size:12px;color:#8f8aa8;line-height:1.5;margin-top:12px;text-align:center}#glxGate .small a{color:#f9a8d4}
#glxGate .card{background:#ffffff0d;border:1px solid #ffffff1f;border-radius:18px;padding:18px;animation:gIn .35s ease both}@keyframes gIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
body.gated{overflow:hidden}#glxGate .feats{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:12px}#glxGate .feats span{font-size:12px;padding:5px 10px;border-radius:99px;background:#ffffff12;border:1px solid #ffffff1a;color:#e6e1ff}#glxGate .pw{position:relative}#glxGate .pw button{position:absolute;right:8px;top:7px;background:none;border:0;font-size:18px;padding:4px 6px;color:#c9c4ef}#glxGate .btn[disabled]{opacity:.6}#glxGate .foot{text-align:center;font-size:11px;color:#6f6a8f;margin-top:26px}#glxGate .foot a{color:#8f8aa8}</style>`);
    let g = $('glxGate'); if (!g) { document.body.insertAdjacentHTML('beforeend', '<div id="glxGate" role="dialog" aria-modal="true" aria-label="Galaxy account"></div>'); g = $('glxGate') }
    document.body.classList.add('gated');
    const head = `<div class="gLogo"><img src="icons/icon-192.png" alt="Galaxy"><h1>Galaxy</h1><p class="lead">${en('', 'Meet real people nearby, on a live map.')}</p><div class="feats"><span>🗺️ Live map</span><span>🧍 3D avatar</span><span>🛡️ Safe &amp; private</span></div></div>`;
    const pw = (id, ph, ac) => `<div class="pw"><input class="fld" id="${id}" type="password" autocomplete="${ac}" minlength="8" maxlength="72" placeholder="${ph}"><button type="button" aria-label="Show password" onclick="const i=this.previousElementSibling;i.type=i.type==='password'?'text':'password';this.textContent=i.type==='password'?'👁️':'🙈'">👁️</button></div>`;
    if (pending) {
      g.innerHTML = `<div class="in">${head}<div class="card" style="text-align:center"><div style="font-size:44px">📧</div><h2 style="margin:6px 0">${en('Check je mail', 'Check your email')}</h2>
<p class="lead">${en('We stuurden een link naar', 'We sent a link to')} <b>${esc(pending)}</b>. ${en('Tik op de knop in die mail en kom dan terug.', 'Tap the button in that email, then come back.')}</p>
<button class="btn" style="width:100%;margin-top:16px" onclick="GLXACC._gCheck()">✅ ${en('Ik heb bevestigd', "I've confirmed")}</button>
<button class="btn ghost" style="width:100%;margin-top:8px" onclick="GLXACC._gResend('${esc(pending)}')">${en('Mail opnieuw sturen', 'Resend email')}</button>
<button class="btn sm ghost" style="width:100%;margin-top:8px" onclick="GLXACC._gTab('new')">${en('Ander e-mailadres gebruiken', 'Use another email')}</button>
<p class="small">${en('Niets gekregen? Kijk ook in je spam of "Reclame".', 'Nothing? Also check your spam folder.')}</p></div></div>`;
      return;
    }
    g.innerHTML = `<div class="in">${head}<div class="seg"><button class="${gTab === 'new' ? 'on' : ''}" onclick="GLXACC._gTab('new')">${en('Account maken', 'Sign up')}</button><button class="${gTab === 'in' ? 'on' : ''}" onclick="GLXACC._gTab('in')">${en('Inloggen', 'Log in')}</button></div>
<div class="card">${gTab === 'new' ? `
<input class="fld" id="gMail" type="email" autocomplete="email" maxlength="254" placeholder="${en('E-mailadres', 'Email address')}">
${pw('gPw', en('Wachtwoord (min. 8 tekens)', 'Password (min. 8 characters)'), 'new-password')}${pw('gPw2', en('Herhaal wachtwoord', 'Repeat password'), 'new-password')}
<label style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#c9c4ef;margin:4px 0 14px"><input type="checkbox" id="gOk" style="margin-top:3px;accent-color:#ec4899"><span>${en('Ik ben 18+ en ga akkoord met de', 'I am 18+ and agree to the')} <a href="voorwaarden.html" target="_blank" style="color:#f9a8d4">${en('voorwaarden', 'terms')}</a> ${en('en het', 'and the')} <a href="privacy.html" target="_blank" style="color:#f9a8d4">${en('privacybeleid', 'privacy policy')}</a>.</span></label>
<button class="btn" style="width:100%" onclick="GLXACC._gSave()">${en('Account maken', 'Create account')} ✦</button>` : `
<input class="fld" id="gLiMail" type="email" autocomplete="email" maxlength="254" placeholder="${en('E-mailadres', 'Email address')}">
${pw('gLiPw', en('Wachtwoord', 'Password'), 'current-password')}
<button class="btn" style="width:100%" onclick="GLXACC._gLogin()">${en('Inloggen', 'Log in')}</button>
<button class="btn sm ghost" style="width:100%;margin-top:8px" onclick="GLXACC._forgot()">${en('Wachtwoord vergeten?', 'Forgot password?')}</button>`}</div>
<p class="small">${en('', 'Your account keeps your profile, matches and chats safe on every device. We never show your exact location.')}</p><div class="foot"><a href="privacy.html" target="_blank">Privacy</a> · <a href="voorwaarden.html" target="_blank">Terms</a> · <a href="mailto:${MAIL()}">Contact</a><br>© Galaxy · 18+ only</div></div>`;
  }
  async function busy(btn, fn) { const b = document.activeElement && document.activeElement.closest && document.activeElement.closest('button'); if (b) { b.disabled = true; b.dataset.l = b.innerHTML; b.innerHTML = '…' } try { return await fn() } finally { if (b && b.isConnected) { b.disabled = false; b.innerHTML = b.dataset.l } } }
  async function gSave() {
    if (!$('gOk').checked) return T(en('Bevestig dat je 18+ bent en akkoord gaat', 'Confirm you are 18+ and agree'));
    if (await busy(0, () => doSave($('gMail').value, $('gPw').value, $('gPw2').value))) gate();
  }
  async function gCheck() {
    const c = await cl(); let u = await user();
    if (u) { try { await c.auth.refreshSession() } catch (e) { } u = await user() }
    else if (pendingMail && memPw) { const r = await c.auth.signInWithPassword({ email: pendingMail, password: memPw }); if (r.error) return T(/confirm/i.test(r.error.message) ? en('Nog niet bevestigd. Tik eerst op de knop in de mail.', 'Not confirmed yet. Tap the button in the email first.') : why(r.error)); u = r.data.user }
    else { gTab = 'in'; pendingMail = null; drawGate(null); return T(en('Log nu in met je e-mail en wachtwoord', 'Now log in with your email and password')) } if (u && !u.is_anonymous && u.email) { T('✅ ' + en('Welkom bij Galaxy!', 'Welcome to Galaxy!')); gate() } else T(en('Nog niet bevestigd. Tik eerst op de knop in de mail.', 'Not confirmed yet. Tap the button in the email first.')) }
  async function gResend(mail) { const c = await cl(); const r = await c.auth.resend({ type: (await user()) ? 'email_change' : 'signup', email: mail, options: { emailRedirectTo: HOME() + '?saved=1' } }); T(r.error ? why(r.error) : '📧 ' + en('Mail opnieuw verstuurd', 'Email sent again')) }

  window.GLXACC = { open, data, gate, _save: save, _login: login, _forgot: forgot, _logout: logout, _gTab: k => { gTab = k; drawGate(null) }, _gSave: gSave, _gLogin: () => busy(0, () => doLogin($('gLiMail').value, $('gLiPw').value, false)), _gCheck: gCheck, _gResend: gResend, _ageStart: ageStart, _ageCheck: ageCheck };

  function hook() {
    honestShop();
    try { if (typeof HUB !== 'undefined' && !HUB.some(h => /GLXACC/.test(h[2]))) HUB.splice(1, 0, ['👤', t('Account', 'Account'), 'GLXACC.open()']) } catch (e) { }
    try { const g = $('ghostTg'), box = g && g.closest('.box'); if (box && !$('acRow')) box.insertAdjacentHTML('afterbegin', `<div class="set" id="acRow"><span>👤 ${t('Account bewaren en inloggen', 'Save account and log in')}</span><button class="btn sm ghost" onclick="GLXACC.open()">${t('Open', 'Open')}</button></div>`) } catch (e) { }
    let done = false; const go = () => { if (done) return; done = true; gate(); checkStatus(); newPasswordAfterReset(); if (/[?&]login=1/.test(location.search)) { try { history.replaceState(null, '', location.pathname) } catch (e) { } let n = 0; const tryOpen = () => { if (!db() && ++n < 40) return setTimeout(tryOpen, 400); document.querySelectorAll('.ov.on').forEach(o => { if (o.id !== 'xV') o.classList.remove('on') }); open() }; setTimeout(tryOpen, 600) } if (/[?&]saved=1/.test(location.search)) { try { history.replaceState(null, '', location.pathname) } catch (e) { } T('✅ ' + t('Je account is bewaard! Je kunt nu op elk toestel inloggen.', 'Your account is saved! You can now log in on any device.')) } };
    if (net().state === 'verbonden') go(); else window.addEventListener('glx-net', e => { if (e.detail === 'verbonden') go() });
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && $('glxGate')) gCheckQuiet() });
  async function gCheckQuiet() { const c = await cl(); try { if (await user()) await c.auth.refreshSession() } catch (e) { } if (!(await user()) && pendingMail && memPw) { try { await c.auth.signInWithPassword({ email: pendingMail, password: memPw }) } catch (e) { } } gate() }
  const boot = () => { hook(); setTimeout(gate, 300) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
