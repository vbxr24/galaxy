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

Deno.serve(async (req) => {
  try {
    const { id } = await req.json();
    if (!Number.isInteger(id)) return new Response('bad', { status: 400 });
    // één keer per bericht, en alleen voor verse berichten
    const { data: m } = await db.from('messages').update({ pushed_at: new Date().toISOString() })
      .eq('id', id).is('pushed_at', null).gte('at', new Date(Date.now() - 120000).toISOString())
      .select('sender,to_id').maybeSingle();
    if (!m) return new Response('skip');
    const { data: p } = await db.from('profiles').select('ghost,banned_at').eq('id', m.to_id).maybeSingle();
    if (!p || p.banned_at) return new Response('skip');
    const { data: subs } = await db.from('push_subs').select('endpoint,p256dh,auth').eq('user_id', m.to_id);
    const payload = JSON.stringify({ title: 'Galaxy', body: '💬 Je hebt een nieuw bericht', url: './?chat=1', tag: 'msg' });
    await Promise.all((subs || []).map(async (s) => {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 }); }
      catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await db.from('push_subs').delete().eq('endpoint', s.endpoint); }
    }));
    return new Response('ok');
  } catch (_) { return new Response('error', { status: 500 }); }
});
