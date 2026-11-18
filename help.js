/* Galaxy – hulp-assistent op de website (en in de app). Praat met de edge function "help". */
(function () {
  'use strict';
  if (window.GLXHELP) return;
  const URL_ = 'https://dqodwuemdpzyvvvxvgtz.supabase.co/functions/v1/help', KEY = 'sb_publishable_nxc3zbKKIR6zpx8iYz4fFA_9yN0JY6p';
  const lang = ((window.LANG || document.documentElement.lang || navigator.language || 'en') + '').slice(0, 2).toLowerCase();
  const nl = lang === 'nl';
  const T = nl ? { btn: 'Hulp', title: 'Galaxy-hulp', hi: 'Hoi! 👋 Waarmee kan ik je helpen? Vraag gerust iets over Galaxy, je account, veiligheid of je café.', ph: 'Typ je vraag…', send: 'Stuur', err: 'Dat lukte niet. Controleer je internet en probeer opnieuw.', tk: 'Stuur naar het Galaxy-team', mail: 'E-mail (optioneel, voor een antwoord)', what: 'Wat is er aan de hand?', go: 'Versturen', note: 'Een automatische assistent helpt je. Deel geen wachtwoorden of bankgegevens.', chips: ['Hoe werkt Galaxy?', 'Kan iemand zien waar ik ben?', 'Account verwijderen', 'Ik heb een café'] }
    : { btn: 'Help', title: 'Galaxy help', hi: "Hi! 👋 How can I help? Ask anything about Galaxy, your account, safety or your venue.", ph: 'Type your question…', send: 'Send', err: "That didn't work. Check your connection and try again.", tk: 'Send to the Galaxy team', mail: 'Email (optional, for a reply)', what: "What's going on?", go: 'Send', note: "An automatic assistant helps you. Don't share passwords or bank details.", chips: ['How does Galaxy work?', 'Can someone see where I am?', 'Delete my account', 'I own a bar'] };
  const css = `#gh-b{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:9998;display:flex;align-items:center;gap:8px;padding:12px 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;font:700 15px system-ui,sans-serif;box-shadow:0 10px 30px rgba(236,72,153,.4);cursor:pointer}
#gh-p{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:9999;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 32px));display:none;flex-direction:column;background:#120f33;border:1px solid #2b2760;border-radius:22px;box-shadow:0 30px 80px rgba(0,0,0,.6);color:#f1eeff;font:15px/1.45 system-ui,sans-serif;overflow:hidden}
#gh-p.on{display:flex}#gh-h{display:flex;align-items:center;gap:10px;padding:14px 16px;background:linear-gradient(135deg,rgba(139,92,246,.35),rgba(236,72,153,.25))}#gh-h b{flex:1;font-size:16px}#gh-x{background:none;border:0;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px}
#gh-m{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.gh-q,.gh-a{max-width:86%;padding:10px 13px;border-radius:16px;white-space:pre-wrap;word-wrap:break-word}.gh-q{align-self:flex-end;background:linear-gradient(135deg,#8b5cf6,#ec4899);border-bottom-right-radius:4px}.gh-a{align-self:flex-start;background:#1f1b4d;border-bottom-left-radius:4px}
.gh-acts{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start}.gh-acts a,.gh-acts button,.gh-chip{padding:7px 12px;border-radius:999px;border:1px solid #4a4590;background:#1a1640;color:#f1eeff;font:600 13px system-ui,sans-serif;text-decoration:none;cursor:pointer}.gh-done{color:#86efac;font-weight:700;font-size:13px}
#gh-f{display:flex;gap:8px;padding:10px;border-top:1px solid #2b2760}#gh-i{flex:1;padding:11px 12px;border-radius:12px;border:1px solid #2b2760;background:#0b0a1f;color:#f1eeff;font:15px system-ui,sans-serif}#gh-s{padding:0 14px;border:0;border-radius:12px;background:#8b5cf6;color:#fff;font-weight:700;cursor:pointer}
#gh-n{font-size:11px;color:#b3aee0;padding:0 14px 8px}.gh-tk{display:flex;flex-direction:column;gap:6px;align-self:stretch;background:#1a1640;border-radius:14px;padding:10px}.gh-tk input,.gh-tk textarea{padding:9px;border-radius:10px;border:1px solid #2b2760;background:#0b0a1f;color:#f1eeff;font:14px system-ui,sans-serif}.gh-dot{display:inline-block;animation:ghb 1s infinite}@keyframes ghb{50%{opacity:.3}}
@media(prefers-reduced-motion:reduce){.gh-dot{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let hist = []; try { hist = JSON.parse(sessionStorage.glxHelp || '[]') } catch (e) { }
  const save = () => { try { sessionStorage.glxHelp = JSON.stringify(hist.slice(-20)) } catch (e) { } };
  const wrap = document.createElement('div');
  wrap.innerHTML = `<button id="gh-b" aria-label="${T.title}"><span aria-hidden="true">💬</span>${T.btn}</button><div id="gh-p" role="dialog" aria-label="${T.title}"><div id="gh-h"><span aria-hidden="true">🪐</span><b>${T.title}</b><button id="gh-x" aria-label="Sluiten / Close">✕</button></div><div id="gh-m" aria-live="polite"></div><div id="gh-n">${T.note}</div><form id="gh-f"><input id="gh-i" maxlength="1500" placeholder="${T.ph}" aria-label="${T.ph}" autocomplete="off"><button id="gh-s" type="submit">${T.send}</button></form></div>`;
  document.body.appendChild(wrap);
  const $ = id => document.getElementById(id), box = $('gh-m');
  const base = (() => { const p = location.pathname; return p.slice(0, p.lastIndexOf('/') + 1) })();
  const bubble = (role, text) => { const d = document.createElement('div'); d.className = role === 'user' ? 'gh-q' : 'gh-a'; d.textContent = text; box.appendChild(d); box.scrollTop = 1e9; return d };
  const acts = list => { if (!list || !list.length) return; const d = document.createElement('div'); d.className = 'gh-acts'; list.forEach(a => {
      if (a.type === 'link') { const u = /^https?:/.test(a.url) ? a.url : base + a.url.replace(/^\.\//, ''); d.insertAdjacentHTML('beforeend', `<a href="${esc(u)}" ${/^https?:/.test(a.url) ? 'target="_blank" rel="noopener"' : ''}>${esc(a.label || 'Open')} →</a>`) }
      else if (a.type === 'done') d.insertAdjacentHTML('beforeend', `<span class="gh-done">${esc(a.label)}</span>`);
      else if (a.type === 'ticket') { const b = document.createElement('button'); b.textContent = '🆘 ' + T.tk; b.onclick = ticketForm; d.appendChild(b) }
    }); box.appendChild(d); box.scrollTop = 1e9 };
  function ticketForm() {
    const f = document.createElement('form'); f.className = 'gh-tk';
    f.innerHTML = `<textarea required maxlength="1000" rows="3" placeholder="${T.what}"></textarea><input type="email" maxlength="120" placeholder="${T.mail}"><button class="gh-chip" type="submit">${T.go}</button>`;
    f.onsubmit = async e => { e.preventDefault(); const [ta, em] = f.querySelectorAll('textarea,input'); if (ta.value.trim().length < 3) return; f.querySelector('button').disabled = true;
      const r = await call({ messages: [{ role: 'user', content: ta.value }], lang, ticket: { topic: 'andere', summary: ta.value.trim(), email: em.value.trim() } }); f.remove(); bubble('assistant', r ? r.reply : T.err) };
    box.appendChild(f); box.scrollTop = 1e9; f.querySelector('textarea').focus();
  }
  async function call(body) {
    try { const r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: 'Bearer ' + KEY }, body: JSON.stringify(body) }); if (!r.ok) return null; return await r.json() } catch (e) { return null }
  }
  async function ask(text) {
    text = String(text || '').trim(); if (!text) return; hist.push({ role: 'user', content: text }); save(); bubble('user', text);
    const wait = bubble('assistant', ''); wait.innerHTML = '<span class="gh-dot">●</span> <span class="gh-dot" style="animation-delay:.2s">●</span> <span class="gh-dot" style="animation-delay:.4s">●</span>';
    $('gh-s').disabled = true;
    const r = await call({ messages: hist, lang, page: location.pathname.split('/').pop() || 'app' });
    $('gh-s').disabled = false;
    if (!r) { wait.textContent = T.err; return }
    wait.textContent = r.reply || '…'; hist.push({ role: 'assistant', content: r.reply || '' }); save(); acts(r.actions);
  }
  function render() { box.innerHTML = ''; bubble('assistant', T.hi); if (!hist.length) { const d = document.createElement('div'); d.className = 'gh-acts'; T.chips.forEach(c => { const b = document.createElement('button'); b.className = 'gh-chip'; b.textContent = c; b.onclick = () => { d.remove(); ask(c) }; d.appendChild(b) }); box.appendChild(d) } hist.forEach(m => bubble(m.role, m.content)) }
  const open = () => { $('gh-p').classList.add('on'); $('gh-b').style.display = 'none'; if (!box.childElementCount) render(); setTimeout(() => $('gh-i').focus(), 50) };
  const close = () => { $('gh-p').classList.remove('on'); $('gh-b').style.display = '' };
  $('gh-b').onclick = open; $('gh-x').onclick = close;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('gh-p').classList.contains('on')) close() });
  $('gh-f').onsubmit = e => { e.preventDefault(); const v = $('gh-i').value; $('gh-i').value = ''; ask(v) };
  window.GLXHELP = { open, close, ask };
})();
