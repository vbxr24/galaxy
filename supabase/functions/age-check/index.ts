// Galaxy – Edge Function "age-check": echte 18+-controle via Didit.
// Geheimen (Supabase > Edge Functions > Secrets): DIDIT_API_KEY en DIDIT_WORKFLOW_ID
// (gratis Didit-account op https://business.didit.me, workflow met AGE_ESTIMATION + ID-fallback).
// "Verify JWT" blijft AAN: alleen ingelogde gebruikers kunnen dit aanroepen.
import { createClient } from 'npm:@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL')!, SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const KEY = Deno.env.get('DIDIT_API_KEY'), WF = Deno.env.get('DIDIT_WORKFLOW_ID');
const API = 'https://verification.didit.me/v3';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const admin = createClient(URL, SERVICE);
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user || user.is_anonymous) return out({ error: 'login' }, 401);
    const { action, back } = await req.json().catch(() => ({}));
    if (!KEY || !WF) return out({ configured: false });

    if (action === 'start') {
      const r = await fetch(API + '/session/', { method: 'POST', headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: WF, vendor_data: user.id, callback: typeof back === 'string' && back.startsWith('https://vbxr24.github.io/galaxy/') ? back : 'https://vbxr24.github.io/galaxy/?age=1' }) });
      const j = await r.json(); if (!r.ok || !j.session_id) return out({ error: 'didit', detail: j }, 502);
      await admin.from('age_checks').upsert({ user_id: user.id, session_id: j.session_id, status: 'Not Started', verified: false, updated_at: new Date().toISOString() });
      return out({ configured: true, url: j.session_url || j.url });
    }

    // check: resultaat zelf opvragen bij Didit (nooit het woord van de app geloven)
    const { data: c } = await admin.from('age_checks').select('session_id').eq('user_id', user.id).maybeSingle();
    if (!c) return out({ configured: true, verified: false, status: 'none' });
    const r = await fetch(API + '/session/' + c.session_id + '/decision/', { headers: { 'x-api-key': KEY } });
    const d = await r.json(); if (!r.ok) return out({ error: 'didit', detail: d }, 502);
    const status = d.status || 'Unknown';
    const est = d?.liveness?.age_estimation ?? d?.age_estimation?.age_estimation ?? d?.face?.age_estimation ?? null;
    const idAge = d?.id_verification?.age ?? null;
    const age = idAge ?? est;
    const ok = status === 'Approved' && (age == null || Number(age) >= 18);
    await admin.from('age_checks').update({ status, est_age: age, verified: ok, updated_at: new Date().toISOString() }).eq('user_id', user.id);
    if (ok) await admin.from('profiles').update({ age_verified: true }).eq('id', user.id);
    return out({ configured: true, verified: ok, status });
  } catch (e) { return out({ error: String(e) }, 500) }
});
