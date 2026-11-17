-- Galaxy – extra's: vrienden uitnodigen, Galaxy-avonden, spraakintro, "uit vanavond",
-- veilig-thuis-check en de badge voor gecontroleerde leeftijd op de profielkaart.
-- Veilig om opnieuw uit te voeren. Voer uit na schema.sql, moderation.sql, push.sql en agecheck.sql.

create extension if not exists pg_net with schema extensions;

/* ---------------- profiel: nieuwe kolommen ---------------- */
alter table public.profiles add column if not exists ref_code   text unique;
alter table public.profiles add column if not exists invited_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists voice_at   timestamptz;
alter table public.profiles add column if not exists out_until  timestamptz;
alter table public.profiles add column if not exists out_note   text check (char_length(out_note) <= 60);
alter table public.profiles add column if not exists created_at timestamptz not null default now();

/* ---------------- 1. vrienden uitnodigen ---------------- */
-- elke gebruiker een korte, unieke code (6 tekens, zonder verwarrende letters)
create or replace function public.make_ref_code() returns text language plpgsql as $$
declare a constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := ''; for i in 1..6 loop c := c || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    exit when not exists (select 1 from profiles where ref_code = c);
  end loop;
  return c;
end $$;

create or replace function public.ref_code_default() returns trigger language plpgsql security definer set search_path = public as $$
begin if new.ref_code is null then new.ref_code := public.make_ref_code(); end if; return new; end $$;
drop trigger if exists profiles_ref_code on public.profiles;
create trigger profiles_ref_code before insert on public.profiles for each row execute function public.ref_code_default();
update public.profiles set ref_code = public.make_ref_code() where ref_code is null;

create table if not exists public.ref_rewards (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  friend_id  uuid not null references public.profiles(id) on delete cascade,
  coins      int  not null check (coins between 1 and 500),
  at         timestamptz not null default now(),
  claimed_at timestamptz,
  unique (user_id, friend_id)
);
alter table public.ref_rewards enable row level security;
revoke all on public.ref_rewards from anon, authenticated;

-- een nieuwe gebruiker vult de code van een vriend in (binnen 14 dagen na het maken van zijn profiel)
create or replace function public.claim_ref(code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me profiles; inviter profiles;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then raise exception 'Maak eerst je profiel'; end if;
  if me.invited_by is not null then return jsonb_build_object('ok', false, 'why', 'al'); end if;
  if me.created_at < now() - interval '14 days' then return jsonb_build_object('ok', false, 'why', 'te_laat'); end if;
  select * into inviter from profiles where ref_code = upper(trim(code));
  if inviter.id is null or inviter.id = me.id then return jsonb_build_object('ok', false, 'why', 'onbekend'); end if;
  if inviter.banned_at is not null then return jsonb_build_object('ok', false, 'why', 'onbekend'); end if;
  update profiles set invited_by = inviter.id where id = me.id;
  insert into ref_rewards (user_id, friend_id, coins) values (me.id, inviter.id, 50) on conflict do nothing;
  -- de uitnodiger krijgt maximaal 20 beloningen
  if (select count(*) from ref_rewards where user_id = inviter.id and friend_id <> inviter.id) < 20 then
    insert into ref_rewards (user_id, friend_id, coins) values (inviter.id, me.id, 50) on conflict do nothing;
  end if;
  return jsonb_build_object('ok', true, 'name', inviter.name);
end $$;

-- mijn code, hoeveel vrienden ik binnenbracht, en de munten die nog klaarliggen (worden meteen als opgehaald gemarkeerd)
create or replace function public.my_ref() returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text; n int; got int;
begin
  select ref_code into c from profiles where id = auth.uid();
  if c is null then update profiles set ref_code = public.make_ref_code() where id = auth.uid() returning ref_code into c; end if;
  select count(*) into n from profiles where invited_by = auth.uid();
  with x as (update ref_rewards r set claimed_at = now() where r.user_id = auth.uid() and r.claimed_at is null returning r.coins)
  select coalesce(sum(x.coins), 0) into got from x;
  return jsonb_build_object('code', c, 'friends', n, 'new_coins', got);
end $$;

/* ---------------- 2. Galaxy-avonden in cafés ---------------- */
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  venue      text not null check (char_length(venue) between 2 and 80),
  address    text check (char_length(address) <= 160),
  lat        double precision not null check (lat between -90 and 90),
  lng        double precision not null check (lng between -180 and 180),
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  offer      text check (char_length(offer) <= 120),
  note       text check (char_length(note) <= 300),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at - starts_at <= interval '12 hours')
);
create index if not exists events_starts on public.events (starts_at);
alter table public.events enable row level security;
drop policy if exists events_read on public.events;
create policy events_read on public.events for select to authenticated using (true);
revoke all on public.events from anon;
grant select on public.events to authenticated;

create table if not exists public.event_going (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  at       timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_going enable row level security;
drop policy if exists event_going_own on public.event_going;
create policy event_going_own on public.event_going for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.event_going from anon;
grant select, insert, delete on public.event_going to authenticated;

-- komende avonden met het aantal mensen dat gaat (nooit wie)
create or replace function public.upcoming_events() returns setof jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', e.id, 'venue', e.venue, 'address', e.address, 'lat', e.lat, 'lng', e.lng,
    'starts_at', e.starts_at, 'ends_at', e.ends_at, 'offer', e.offer, 'note', e.note,
    'going', (select count(*) from event_going g where g.event_id = e.id),
    'me_going', exists (select 1 from event_going g where g.event_id = e.id and g.user_id = auth.uid()),
    'checked_in', exists (select 1 from checkins c where c.place_id = 'ev:' || e.id and c.user_id = auth.uid()))
  from events e where auth.uid() is not null and e.ends_at > now() and e.starts_at < now() + interval '60 days'
  order by e.starts_at limit 50;
$$;

-- inchecken op een Galaxy-avond (via de QR-code van het café): alleen tijdens de avond (en een uur ervoor)
create or replace function public.event_checkin(ev uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e events;
begin
  if auth.uid() is null or not exists (select 1 from profiles where id = auth.uid()) then raise exception 'Maak eerst je profiel'; end if;
  select * into e from events where id = ev;
  if e.id is null then return jsonb_build_object('ok', false, 'why', 'onbekend'); end if;
  if now() < e.starts_at - interval '1 hour' then return jsonb_build_object('ok', false, 'why', 'te_vroeg', 'starts_at', e.starts_at); end if;
  if now() > e.ends_at then return jsonb_build_object('ok', false, 'why', 'voorbij'); end if;
  if not exists (select 1 from checkins where user_id = auth.uid() and place_id = 'ev:' || e.id and at > now() - interval '12 hours') then
    insert into checkins (user_id, place_id, place_name) values (auth.uid(), 'ev:' || e.id, left(e.venue, 120));
  end if;
  insert into event_going (event_id, user_id) values (e.id, auth.uid()) on conflict do nothing;
  return jsonb_build_object('ok', true, 'venue', e.venue, 'offer', e.offer, 'at', now());
end $$;

-- beheer: een avond toevoegen, wijzigen of verwijderen
create or replace function public.admin_event_save(ev jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  if ev ? 'id' and nullif(ev->>'id', '') is not null then
    update events set venue = ev->>'venue', address = ev->>'address', lat = (ev->>'lat')::float8, lng = (ev->>'lng')::float8,
      starts_at = (ev->>'starts_at')::timestamptz, ends_at = (ev->>'ends_at')::timestamptz, offer = ev->>'offer', note = ev->>'note'
    where id = (ev->>'id')::uuid returning id into rid;
  else
    insert into events (venue, address, lat, lng, starts_at, ends_at, offer, note, created_by)
    values (ev->>'venue', ev->>'address', (ev->>'lat')::float8, (ev->>'lng')::float8, (ev->>'starts_at')::timestamptz, (ev->>'ends_at')::timestamptz, ev->>'offer', ev->>'note', auth.uid())
    returning id into rid;
  end if;
  return rid;
end $$;
create or replace function public.admin_event_delete(ev uuid) returns void
language plpgsql security definer set search_path = public as $$
begin if not public.is_admin() then raise exception 'geen toegang'; end if; delete from events where id = ev; end $$;
create or replace function public.admin_events() returns setof jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(e) || jsonb_build_object('going', (select count(*) from event_going g where g.event_id = e.id),
    'checkins', (select count(distinct c.user_id) from checkins c where c.place_id = 'ev:' || e.id))
  from events e where public.is_admin() and e.ends_at > now() - interval '30 days' order by e.starts_at desc;
$$;

/* ---------------- 3. spraakintro (max. 15 seconden) ---------------- */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice', 'voice', false, 600000, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac'])
on conflict (id) do update set public = false, file_size_limit = 600000, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists voice_read on storage.objects;
create policy voice_read on storage.objects for select to authenticated
  using (bucket_id = 'voice' and not public.is_blocked(auth.uid(), ((storage.foldername(name))[1])::uuid));
drop policy if exists voice_write on storage.objects;
create policy voice_write on storage.objects for insert to authenticated
  with check (bucket_id = 'voice' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists voice_update on storage.objects;
create policy voice_update on storage.objects for update to authenticated
  using (bucket_id = 'voice' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists voice_delete on storage.objects;
create policy voice_delete on storage.objects for delete to authenticated
  using (bucket_id = 'voice' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.set_voice(has boolean) returns void
language sql security definer set search_path = public as $$
  update profiles set voice_at = case when has then now() else null end where id = auth.uid();
$$;

/* ---------------- 4. "uit vanavond" ---------------- */
create or replace function public.set_out(hours int, note text default null) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare u timestamptz;
begin
  if hours is null or hours <= 0 then update profiles set out_until = null, out_note = null where id = auth.uid(); return null; end if;
  u := now() + make_interval(hours => least(hours, 8));
  update profiles set out_until = u, out_note = left(nullif(trim(note), ''), 60) where id = auth.uid();
  return u;
end $$;

/* ---------------- 5. veilig-thuis-check ---------------- */
create table if not exists public.safe_checks (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  contact_id    uuid references public.profiles(id) on delete set null,
  due_at        timestamptz not null,
  note          text check (char_length(note) <= 120),
  done_at       timestamptz,
  reminded_at   timestamptz,
  alerted_at    timestamptz,
  remind_pushed_at timestamptz,
  alert_pushed_at  timestamptz,
  created_at    timestamptz not null default now(),
  check (due_at > created_at and due_at < created_at + interval '24 hours')
);
create index if not exists safe_checks_open on public.safe_checks (due_at) where done_at is null;
alter table public.safe_checks enable row level security;
drop policy if exists safe_checks_own on public.safe_checks;
create policy safe_checks_own on public.safe_checks for select to authenticated using (user_id = auth.uid());
revoke all on public.safe_checks from anon, authenticated;
grant select on public.safe_checks to authenticated;

alter table public.safe_checks add column if not exists remind_pushed_at timestamptz;
alter table public.safe_checks add column if not exists alert_pushed_at timestamptz;

-- een check starten: contactpersoon = een van je matches (die krijgt een melding als je je niet meldt)
create or replace function public.safe_start(due timestamptz, contact uuid default null, note text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare rid bigint;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd'; end if;
  if contact is not null and not public.is_match(auth.uid(), contact) then raise exception 'Kies een van je matches'; end if;
  update safe_checks set done_at = now() where user_id = auth.uid() and done_at is null;
  insert into safe_checks (user_id, contact_id, due_at, note) values (auth.uid(), contact, due, left(note, 120)) returning id into rid;
  return rid;
end $$;
create or replace function public.safe_done() returns void
language sql security definer set search_path = public as $$
  update safe_checks set done_at = now() where user_id = auth.uid() and done_at is null;
$$;
create or replace function public.safe_mine() returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(s) - 'user_id' || jsonb_build_object('contact_name', (select name from profiles where id = s.contact_id))
  from safe_checks s where s.user_id = auth.uid() and s.done_at is null order by s.created_at desc limit 1;
$$;

-- elke minuut: herinnering op het afgesproken uur, waarschuwing aan de contactpersoon 20 minuten later
create or replace function public.safe_tick() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare r record;
begin
  for r in select id from safe_checks where done_at is null and reminded_at is null and due_at <= now() limit 200 loop
    update safe_checks set reminded_at = now() where id = r.id;
    perform net.http_post(url := 'https://dqodwuemdpzyvvvxvgtz.supabase.co/functions/v1/push',
      body := jsonb_build_object('safe', r.id, 'kind', 'remind'), headers := '{"Content-Type":"application/json"}'::jsonb, timeout_milliseconds := 4000);
  end loop;
  for r in select id from safe_checks where done_at is null and alerted_at is null and contact_id is not null and due_at <= now() - interval '20 minutes' limit 200 loop
    update safe_checks set alerted_at = now() where id = r.id;
    perform net.http_post(url := 'https://dqodwuemdpzyvvvxvgtz.supabase.co/functions/v1/push',
      body := jsonb_build_object('safe', r.id, 'kind', 'alert'), headers := '{"Content-Type":"application/json"}'::jsonb, timeout_milliseconds := 4000);
  end loop;
  -- oude checks opruimen
  delete from safe_checks where created_at < now() - interval '3 days';
end $$;
revoke all on function public.safe_tick() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'galaxy-safe-tick';
select cron.schedule('galaxy-safe-tick', '* * * * *', $$select public.safe_tick()$$);

/* ---------------- 6. profielkaart: nieuwe velden ---------------- */
create or replace function public.profile_card(target uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select case when p.id is null or public.is_blocked(auth.uid(), p.id) then null else jsonb_build_object(
    'id', p.id, 'name', p.name, 'age', extract(year from age(current_date, p.birth))::int, 'city', p.city, 'bio', p.bio, 'cat', p.cat,
    'gender', p.gender, 'pron', p.pron, 'orient', case when p.show_orient then p.orient end,
    'ints', p.ints, 'basics', p.basics, 'music', p.music, 'ptheme', p.ptheme, 'avatar', p.avatar,
    'respect', p.respect, 'ageVerified', p.age_verified, 'plan', p.plan,
    'matched', public.is_match(auth.uid(), p.id),
    'socialVis', p.social_vis,
    'ig',   case when p.id = auth.uid() or p.social_vis = 'iedereen' or (p.social_vis = 'matches' and public.is_match(auth.uid(), p.id)) then p.ig end,
    'snap', case when p.id = auth.uid() or p.social_vis = 'iedereen' or (p.social_vis = 'matches' and public.is_match(auth.uid(), p.id)) then p.snap end,
    'hasSocials', (coalesce(p.ig,'') <> '' or coalesce(p.snap,'') <> ''),
    'voice', case when p.voice_at is not null then p.id::text || '/intro?v=' || extract(epoch from p.voice_at)::bigint end,
    'out', case when p.out_until > now() then jsonb_build_object('until', p.out_until, 'note', p.out_note) end
  ) end
  from (select 1) x left join profiles p on p.id = target;
$$;

-- wie in de buurt "uit vanavond" is (aantal per zone, nooit wie): voor een glans op de kaart
create or replace function public.out_zones(min_lat double precision, min_lng double precision, max_lat double precision, max_lng double precision) returns setof jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('lat', pr.zlat, 'lng', pr.zlng, 'n', count(*))
  from presence pr join profiles p on p.id = pr.user_id
  where auth.uid() is not null and p.out_until > now() and not p.ghost and p.banned_at is null and pr.visible_from <= now() and pr.seen > now() - interval '2 hours'
    and pr.zlat between min_lat and max_lat and pr.zlng between min_lng and max_lng and p.id <> auth.uid()
    and not public.is_blocked(auth.uid(), p.id)
  group by pr.zlat, pr.zlng limit 300;
$$;

-- rechten
revoke all on function public.claim_ref(text), public.my_ref(), public.upcoming_events(), public.event_checkin(uuid),
  public.admin_event_save(jsonb), public.admin_event_delete(uuid), public.admin_events(), public.set_voice(boolean),
  public.set_out(int, text), public.safe_start(timestamptz, uuid, text), public.safe_done(), public.safe_mine(),
  public.out_zones(double precision, double precision, double precision, double precision) from public, anon;
grant execute on function public.claim_ref(text), public.my_ref(), public.upcoming_events(), public.event_checkin(uuid),
  public.admin_event_save(jsonb), public.admin_event_delete(uuid), public.admin_events(), public.set_voice(boolean),
  public.set_out(int, text), public.safe_start(timestamptz, uuid, text), public.safe_done(), public.safe_mine(),
  public.out_zones(double precision, double precision, double precision, double precision) to authenticated;
