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

// veilig-thuis-check: herinnering aan de gebruiker, of waarschuwing aan de gekozen match. Elk maar één keer.
async function safeHome(sid: number, kind: string) {
  const col = kind === 'alert' ? 'alert_pushed_at' : 'remind_pushed_at', when = kind === 'alert' ? 'alerted_at' : 'reminded_at';
  const { data: c } = await db.from('safe_checks').update({ [col]: new Date().toISOString() })
    .eq('id', sid).is(col, null).is('done_at', null).gte(when, new Date(Date.now() - 180000).toISOString())
    .select('user_id,contact_id').maybeSingle();
  if (!c) return new Response('skip');
  if (kind === 'alert') {
    if (!c.contact_id) return new Response('skip');
    const { data: who } = await db.from('profiles').select('name').eq('id', c.user_id).maybeSingle();
    const { data: subs } = await db.from('push_subs').select('endpoint,p256dh,auth').eq('user_id', c.contact_id);
    const lc = await langOf(c.contact_id);
    await send(subs || [], { title: tx('safeTitle', lc), body: tx('safeAlert', lc, (who && who.name) || 'Match'), url: './?chat=1', tag: 'safe-' + sid, vibrate: [400, 150, 400, 150, 400] }, 3600);
  } else {
    const { data: subs } = await db.from('push_subs').select('endpoint,p256dh,auth').eq('user_id', c.user_id);
    const lu = await langOf(c.user_id);
    await send(subs || [], { title: 'Galaxy', body: tx('safeAsk', lu), url: './?safe=1', tag: 'safe-' + sid, vibrate: [200, 100, 200, 100, 200] }, 1800);
  }
  return new Response('ok');
}


// meldingen in de taal van de ontvanger (profiles.lang); onbekende taal → Engels
const TX: Record<string, Record<string, string>> = {
  safeAlert: { nl: '⚠️ {n} meldde zich nog niet veilig thuis na een date. Stuur een bericht of bel even.', en: "⚠️ {n} hasn't checked in safely at home after a date. Send a message or give them a call.", fr: "⚠️ {n} n'a pas encore confirmé être bien rentré(e) après un date. Envoie un message ou appelle.", de: '⚠️ {n} hat sich nach einem Date noch nicht sicher zuhause gemeldet. Schreib oder ruf kurz an.', es: '⚠️ {n} aún no ha confirmado que llegó bien a casa tras una cita. Envía un mensaje o llama.', it: '⚠️ {n} non ha ancora confermato di essere a casa dopo un appuntamento. Scrivi o chiama.', pt: '⚠️ {n} ainda não confirmou que chegou bem a casa depois de um encontro. Envia uma mensagem ou liga.', tr: '⚠️ {n} randevudan sonra evine güvenle vardığını henüz bildirmedi. Mesaj at ya da ara.', pl: '⚠️ {n} nie potwierdził(a) jeszcze bezpiecznego powrotu po randce. Napisz lub zadzwoń.', ru: '⚠️ {n} ещё не подтвердил(а), что добрался(лась) домой после свидания. Напиши или позвони.', uk: '⚠️ {n} ще не підтвердив(ла), що безпечно дістався(лась) додому після побачення. Напиши або зателефонуй.', ar: '⚠️ {n} لم يؤكد بعد وصوله إلى البيت بأمان بعد الموعد. أرسل رسالة أو اتصل.', zh: '⚠️ {n} 约会后还没有报平安。发个消息或打个电话吧。', ja: '⚠️ {n} さんがデート後まだ無事帰宅の連絡をしていません。メッセージか電話をしてみて。', ro: '⚠️ {n} nu a confirmat încă că a ajuns acasă în siguranță după întâlnire. Trimite un mesaj sau sună.' },
  safeTitle: { nl: 'Galaxy – veiligheid', en: 'Galaxy – safety', fr: 'Galaxy – sécurité', de: 'Galaxy – Sicherheit', es: 'Galaxy – seguridad', it: 'Galaxy – sicurezza', pt: 'Galaxy – segurança', tr: 'Galaxy – güvenlik', pl: 'Galaxy – bezpieczeństwo', ru: 'Galaxy – безопасность', uk: 'Galaxy – безпека', ar: 'Galaxy – الأمان', zh: 'Galaxy – 安全', ja: 'Galaxy – 安全', ro: 'Galaxy – siguranță' },
  safeAsk: { nl: '🛡️ Ben je veilig thuis? Tik om het te bevestigen.', en: '🛡️ Are you home safe? Tap to confirm.', fr: '🛡️ Es-tu bien rentré(e) ? Touche pour confirmer.', de: '🛡️ Bist du sicher zuhause? Tippe zum Bestätigen.', es: '🛡️ ¿Llegaste bien a casa? Toca para confirmar.', it: '🛡️ Sei a casa al sicuro? Tocca per confermare.', pt: '🛡️ Chegaste bem a casa? Toca para confirmar.', tr: '🛡️ Evine güvenle vardın mı? Onaylamak için dokun.', pl: '🛡️ Jesteś bezpiecznie w domu? Dotknij, aby potwierdzić.', ru: '🛡️ Ты благополучно дома? Нажми, чтобы подтвердить.', uk: '🛡️ Ти безпечно вдома? Натисни, щоб підтвердити.', ar: '🛡️ هل وصلت إلى البيت بأمان؟ اضغط للتأكيد.', zh: '🛡️ 你安全到家了吗？点击确认。', ja: '🛡️ 無事に帰宅しましたか？タップして確認。', ro: '🛡️ Ai ajuns acasă în siguranță? Atinge pentru a confirma.' },
  nearMatch: { nl: '💞 Een match is in je buurt', en: '💞 A match is nearby', fr: '💞 Un match est près de toi', de: '💞 Ein Match ist in deiner Nähe', es: '💞 Un match está cerca', it: '💞 Un match è nelle vicinanze', pt: '💞 Um match está perto de ti', tr: '💞 Bir eşleşmen yakında', pl: '💞 Dopasowanie jest w pobliżu', ru: '💞 Твоя пара рядом', uk: '💞 Твоя пара поруч', ar: '💞 تطابقك قريب منك', zh: '💞 你的配对就在附近', ja: '💞 マッチが近くにいます', ro: '💞 Un match este în apropiere' },
  near: { nl: '✨ Er is iemand in je buurt', en: '✨ Someone is nearby', fr: "✨ Quelqu'un est près de toi", de: '✨ Jemand ist in deiner Nähe', es: '✨ Hay alguien cerca', it: "✨ C'è qualcuno nelle vicinanze", pt: '✨ Está alguém perto de ti', tr: '✨ Yakınında biri var', pl: '✨ Ktoś jest w pobliżu', ru: '✨ Кто-то рядом', uk: '✨ Хтось поруч', ar: '✨ هناك شخص قريب منك', zh: '✨ 附近有人', ja: '✨ 近くに誰かいます', ro: '✨ Cineva este în apropiere' },
  msg: { nl: '💬 Je hebt een nieuw bericht', en: '💬 You have a new message', fr: '💬 Tu as un nouveau message', de: '💬 Du hast eine neue Nachricht', es: '💬 Tienes un mensaje nuevo', it: '💬 Hai un nuovo messaggio', pt: '💬 Tens uma nova mensagem', tr: '💬 Yeni bir mesajın var', pl: '💬 Masz nową wiadomość', ru: '💬 У тебя новое сообщение', uk: '💬 У тебе нове повідомлення', ar: '💬 لديك رسالة جديدة', zh: '💬 你有一条新消息', ja: '💬 新しいメッセージがあります', ro: '💬 Ai un mesaj nou' },
};
const tx = (k: string, l?: string | null, n = '') => ((TX[k][l || 'nl'] || TX[k].en) as string).replace('{n}', n);
async function langOf(u: string) { const { data } = await db.from('profiles').select('lang').eq('id', u).maybeSingle(); return (data && data.lang) || 'nl'; }

// "iemand in de buurt": één keer per ping, alleen voor verse pings, alleen naar toestellen die het aanzetten
async function nearby(pid: number) {
  const { data: p } = await db.from('near_pings').update({ pushed_at: new Date().toISOString() })
    .eq('id', pid).is('pushed_at', null).gte('at', new Date(Date.now() - 120000).toISOString())
    .select('to_id,is_match').maybeSingle();
  if (!p) return new Response('skip');
  const { data: subs } = await db.from('push_subs').select('endpoint,p256dh,auth,near').eq('user_id', p.to_id).neq('near', 'uit');
  const ok = (subs || []).filter((s) => s.near === 'iedereen' || p.is_match);
  const ln = await langOf(p.to_id);
  await send(ok, { title: 'Galaxy', body: tx(p.is_match ? 'nearMatch' : 'near', ln), url: './?map=1', tag: 'near', vibrate: [300, 150, 300, 150, 300] }, 900);
  return new Response('ok');
}

// meldingen uit de wachtrij (feed, beheer, badges): één keer per rij, alleen verse rijen
async function queued(qid: number) {
  const { data: m } = await db.from('push_queue').update({ pushed_at: new Date().toISOString() })
    .eq('id', qid).is('pushed_at', null).gte('created_at', new Date(Date.now() - 300000).toISOString())
    .select('user_id,kind,title,body,url,tag').maybeSingle();
  if (!m) return new Response('skip');
  const { data: p } = await db.from('profiles').select('banned_at').eq('id', m.user_id).maybeSingle();
  if (!p || p.banned_at) return new Response('skip');
  let q = db.from('push_subs').select('endpoint,p256dh,auth').eq('user_id', m.user_id);
  if (m.kind === 'feed') q = q.neq('feed', false);
  const { data: subs } = await q;
  await send(subs || [], { title: m.title, body: m.body, url: m.url, tag: m.tag, vibrate: m.kind === 'admin' ? [200, 100, 200] : [120, 80, 120] }, m.kind === 'feed' ? 7200 : 86400);
  return new Response('ok');
}

Deno.serve(async (req) => {
  try {
    const { id, near, safe, kind, q } = await req.json();
    if (Number.isInteger(q)) return await queued(q);
    if (Number.isInteger(safe)) return await safeHome(safe, kind);
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
    const lm = await langOf(m.to_id);
    await send(subs || [], { title: 'Galaxy', body: tx('msg', lm), url: './?chat=1', tag: 'msg', vibrate: [120, 80, 120] }, 3600);
    return new Response('ok');
  } catch (_) { return new Response('error', { status: 500 }); }
});
