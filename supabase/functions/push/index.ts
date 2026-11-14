// Galaxy – Edge Function "push": stuurt een pushmelding bij een nieuw bericht.
// Geheimen (in Supabase > Edge Functions > Secrets):
//   VAPID_PRIVATE_KEY  (de privésleutel, nooit in de code of op GitHub)
// SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn er automatisch.
// Zet bij deze functie "Verify JWT" UIT: de database roept ze aan.
// Misbruik is niet zinvol: de functie stuurt alleen voor een echt bericht
// van de laatste 2 minuten, en maar één keer per bericht.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const PUBLIC = 'BOGDsADs2UfDIgmgfgmHuCw3TPaaJeb7tMyed7t97lqBv4h1mY6A3u7g_36jVyAqp8oJ2BEqVM-tmZAAUa8Fd3k';
webpush.setVapidDetails('mailto:galaxy.app.xv@gmail.com', PUBLIC, Deno.env.get('VAPID_PRIVATE_KEY')!);
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function send(subs: any[], msg: object, ttl: number) {
  const payload = JSON.stringify(msg);
  await Promise.all(subs.map(async (s) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: ttl, urgency: 'high' }); }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await db.from('push_subs').delete().eq('endpoint', s.endpoint); }
  }));
}

// "iemand in de buurt": één keer per ping, alleen voor verse pings, alleen naar toestellen die het aanzetten
async function nearby(pid: number) {
  const { data: p } = await db.from('near_pings').update({ pushed_at: new Date().toISOString() })
    .eq('id', pid).is('pushed_at', null).gte('at', new Date(Date.now() - 120000).toISOString())
    .select('to_id,is_match').maybeSingle();
  if (!p) return new Response('skip');
  const { data: subs } = await db.from('push_subs').select('endpoint,p256dh,auth,near').eq('user_id', p.to_id).neq('near', 'uit');
  const ok = (subs || []).filter((s) => s.near === 'iedereen' || p.is_match);
  await send(ok, { title: 'Galaxy', body: p.is_match ? '💞 Een match is in je buurt' : '✨ Er is iemand in je buurt', url: './?map=1', tag: 'near', vibrate: [300, 150, 300, 150, 300] }, 900);
  return new Response('ok');
}

Deno.serve(async (req) => {
  try {
    const { id, near } = await req.json();
    if (Number.isInteger(near)) return await nearby(near);
    if (!Number.isInteger(id)) return new Response('bad', { status: 400 });
    // één keer per bericht, en alleen voor verse berichten
    const { data: m } = await db.from('messages').update({ pushed_at: new Date().toISOString() })
      .eq('id', id).is('pushed_at', null).gte('at', new Date(Date.now() - 120000).toISOString())
      .select('sender,to_id').maybeSingle();
    if (!m) return new Response('skip');
    const { data: p } = await db.from('profiles').select('ghost,banned_at').eq('id', m.to_id).maybeSingle();
    if (!p || p.banned_at) return new Response('skip');
    const { data: subs } = await db.from('push_subs').select('endpoint,p256dh,auth').eq('user_id', m.to_id);
    await send(subs || [], { title: 'Galaxy', body: '💬 Je hebt een nieuw bericht', url: './?chat=1', tag: 'msg', vibrate: [120, 80, 120] }, 3600);
    return new Response('ok');
  } catch (_) { return new Response('error', { status: 500 }); }
});
