// Galaxy hulp-assistent. Werkt met Claude als ANTHROPIC_API_KEY is ingesteld (Supabase → Edge Functions → Secrets),
// anders met een eenvoudige vraag-en-antwoordlijst. De assistent kan zelf: een hulpvraag aanmaken, een café aanmelden,
// en de juiste pagina openen. Hij kan nooit accounts wijzigen of verwijderen; daarvoor stuurt hij je naar de juiste knop.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { FAQ, NONE, URGENT } from './faq.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const MODEL = Deno.env.get('HELP_MODEL') || 'claude-haiku-5-5';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

const LINKS: Record<string, string> = {
  app: './', delete_account: 'verwijderen.html', privacy: 'privacy.html', privacy_en: 'privacy-en.html', terms: 'voorwaarden.html', terms_en: 'terms-en.html',
  safety: 'veiligheid.html', cafe_signup: 'voor-cafes.html', cafe_signup_en: 'voor-cafes-en.html', helplines: 'https://findahelpline.com', home: 'welkom.html', home_en: 'welkom-en.html',
};

const SYSTEM = `You are the friendly help assistant of Galaxy (an 18+ app: a live world map to meet new people; users walk around with a customisable 3D avatar, see where it's busy, check in at places, wave, chat after a match, plan group dates in public places). Website: https://vbxr24.github.io/galaxy/ . It works in the browser (PWA): "Add to Home Screen". The beta is completely free; planned plans: Galaxy+ €9.99/month, Gold €19.99, Cosmic €34.99, Galaxy Forever €149.99 one-time. Nothing is charged during the beta.
Facts: others only ever see an area of about 300 m, never your exact location; the "invisible" button hides you completely; report and block are one tap on a profile; minors are refused and removed; a "safe home" check exists after a date; socials stay hidden until shared. Delete account: in the app (profile → delete account) or the page verwijderen.html. Bars/clubs can sign up for "Galaxy nights" (QR check-in at the bar, offers in the feed, own stats page).
Rules:
- Always answer in the user's language (given as lang), short and warm, max ~90 words, no markdown headings.
- Do things yourself with the tools when it helps: create_ticket when a human must look at something (bugs, account problems, payments, safety reports, anything you can't solve) — ask for an email address only if they want an answer by email (optional). venue_signup when a bar/club owner wants to join (need venue name and email). open_link to give the right page or button.
- Never promise refunds, never claim you changed an account; you can't access accounts or personal data.
- Safety: if someone is in danger, tell them to call the local emergency number (112 in Europe, 911 in the US) right away. If someone mentions self-harm or suicide, respond with care, encourage contacting a local helpline and open_link helplines.
- If asked about something unrelated to Galaxy, help briefly or steer back kindly.`;

const TOOLS = [
  { name: 'create_ticket', description: 'Send a help request to the Galaxy team so a human follows up.', input_schema: { type: 'object', properties: { topic: { type: 'string', enum: ['account', 'veiligheid', 'betalen', 'bug', 'privacy', 'cafe', 'andere'] }, summary: { type: 'string', description: 'Clear summary of the problem in the user\'s words (max 1000 chars)' }, email: { type: 'string', description: 'Optional email for a reply' } }, required: ['topic', 'summary'] } },
  { name: 'venue_signup', description: 'Sign up a bar, café, club or restaurant for Galaxy nights.', input_schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, city: { type: 'string' }, kind: { type: 'string', enum: ['cafe', 'bar', 'club', 'restaurant', 'andere'] }, phone: { type: 'string' }, contact_name: { type: 'string' }, message: { type: 'string' } }, required: ['name', 'email'] } },
  { name: 'open_link', description: 'Show the user a button to the right page.', input_schema: { type: 'object', properties: { target: { type: 'string', enum: Object.keys(LINKS) }, label: { type: 'string', description: 'Short button text in the user\'s language' } }, required: ['target', 'label'] } },
];

async function runTool(name: string, inp: any, lang: string, uid: string | null) {
  try {
    if (name === 'create_ticket') {
      const { data, error } = await db.rpc('support_ticket', { p_email: inp.email || null, p_topic: inp.topic || 'andere', p_summary: String(inp.summary || '').slice(0, 1200), p_lang: lang });
      return error ? { ok: false, error: error.message } : { ok: true, ticket: data };
    }
    if (name === 'venue_signup') {
      const { data, error } = await db.rpc('venue_apply', { p_name: inp.name, p_kind: inp.kind || 'cafe', p_city: inp.city || '', p_address: '', p_contact: inp.contact_name || '', p_email: inp.email, p_phone: inp.phone || '', p_message: inp.message || 'Via de hulp-assistent' });
      return error ? { ok: false, error: error.message } : { ok: true, id: data };
    }
    if (name === 'open_link') return { ok: !!LINKS[inp.target] };
  } catch (e) { return { ok: false, error: String(e) }; }
  return { ok: false };
}

// antwoorden zonder AI: het onderwerp met de meeste treffers wint
function fallback(text: string, lang: string) {
  const L = ['nl', 'en', 'fr', 'de', 'es'].includes(lang) ? lang : 'en';
  let best: any = null, score = 0;
  for (const e of FAQ) { const n = (text.match(new RegExp(e[0].source, 'gi')) || []).length; if (n > score) { score = n; best = e } }
  if (!best) return { reply: NONE[L], actions: [{ type: 'ticket' }] };
  const acts: any[] = [];
  if (best[1]) acts.push({ type: 'link', url: LINKS[best[1]], label: { nl: 'Openen', en: 'Open', fr: 'Ouvrir', de: 'Öffnen', es: 'Abrir' }[L] });
  if (/bug|error|fout|werkt niet|refund|terugbetal|inlog|login/i.test(best[0].source)) acts.push({ type: 'ticket' });
  return { reply: best[2][L] || best[2].en, actions: acts };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const body = await req.json();
    const lang = /^[a-z]{2}$/.test(body.lang || '') ? body.lang : 'en';
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12).map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 1500) })).filter((m: any) => m.content);
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json({ error: 'bad' }, 400);
    // directe hulpvraag vanuit het formulier (zonder AI)
    if (body.ticket) { const r = await runTool('create_ticket', { topic: body.ticket.topic || 'andere', summary: body.ticket.summary, email: body.ticket.email }, lang, null); return json({ reply: r.ok ? (lang === 'nl' ? '✅ Je vraag is doorgestuurd naar het Galaxy-team.' : '✅ Your question was sent to the Galaxy team.') : (r.error || 'error'), actions: [] }); }
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'x';
    const key = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('glx' + ip)))).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
    const { data: allowed } = await db.rpc('help_allow', { p_key: key, n: 30 });
    if (allowed === false) return json({ reply: lang === 'nl' ? 'Je hebt veel vragen gesteld. Probeer het over een uurtje opnieuw.' : 'You asked a lot of questions. Please try again in an hour.', actions: [] });
    if (!KEY) {
      const last = msgs[msgs.length - 1].content, out: any = fallback(last, lang);
      if (URGENT.test(last)) { const r = await runTool('create_ticket', { topic: 'veiligheid', summary: last }, lang, null); if (r.ok) out.actions.push({ type: 'done', label: lang === 'nl' ? '✅ Doorgestuurd naar het Galaxy-team' : '✅ Sent to the Galaxy team' }) }
      return json(out);
    }

    const actions: any[] = []; let convo: any[] = msgs; let reply = '';
    for (let step = 0; step < 4; step++) {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: 500, system: SYSTEM + `\nUser language: ${lang}. Page: ${String(body.page || '').slice(0, 60)}.`, tools: TOOLS, messages: convo }) });
      if (!r.ok) return json(fallback(msgs[msgs.length - 1].content, lang));
      const out = await r.json();
      const text = (out.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n').trim();
      if (text) reply = text;
      const uses = (out.content || []).filter((c: any) => c.type === 'tool_use');
      if (out.stop_reason !== 'tool_use' || !uses.length) break;
      const results = [];
      for (const u of uses) {
        const res = await runTool(u.name, u.input || {}, lang, null);
        if (u.name === 'open_link' && res.ok) actions.push({ type: 'link', url: LINKS[u.input.target], label: String(u.input.label || 'Open').slice(0, 40) });
        if (u.name === 'create_ticket' && res.ok) actions.push({ type: 'done', label: lang === 'nl' ? '✅ Hulpvraag verstuurd' : '✅ Help request sent' });
        if (u.name === 'venue_signup' && res.ok) actions.push({ type: 'done', label: lang === 'nl' ? '✅ Zaak aangemeld' : '✅ Venue signed up' });
        results.push({ type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(res) });
      }
      convo = [...convo, { role: 'assistant', content: out.content }, { role: 'user', content: results }];
    }
    return json({ reply: reply || (lang === 'nl' ? 'Klaar!' : 'Done!'), actions });
  } catch (_) { return json({ reply: 'Er ging iets mis. / Something went wrong.', actions: [] }, 200); }
});
