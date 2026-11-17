-- Galaxy – de nieuwe feed: verhalen van 24 uur, vraag van de avond, café-posts en moderatie.
-- Voer uit na extras.sql en extras2.sql. Veilig om opnieuw uit te voeren.

/* ---------------- tekstfilter ---------------- */
-- geeft null terug als de tekst ok is, anders de reden. Geen links, telefoonnummers of e-mails (spam en lokken naar buiten de app).
create or replace function public.feed_bad(txt text) returns text language plpgsql immutable as $$
declare l text := lower(coalesce(txt, ''));
begin
  if l ~ '(https?://|www\.|\.(com|be|nl|net|org|io|me|ly)\y)' then return 'links'; end if;
  if l ~ '(\+\d{2}[ ./-]?\d[\d ./-]{7,}\d|\y0?4\d{2}[ ./-]?\d{2}[ ./-]?\d{2}[ ./-]?\d{2}\y)' then return 'telefoon'; end if;
  if l ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then return 'email'; end if;
  if l ~ '(onlyfans|snapchat premium|cashapp|paypal\.me|bitcoin|crypto|escort|sugar ?dadd?y|nudes?|naaktfoto|\mseks\m|\msex\m|\mpijp|\mneuk|fuck me|\mminderjarig|ik ben 1[0-7]\y|\y1[0-7] ?yo\y|\mschoolmeisje)' then return 'woorden'; end if;
  if l ~ '(\mnegers?\m|\mnigg|\mmongool|\mkanker[a-z]*\m|\mhoer\m|\mslet\m|\mflikker|\mjood\m)' then return 'woorden'; end if;
  return null;
end $$;

/* ---------------- verhalen van 24 uur ---------------- */
create table if not exists public.stories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  path       text not null unique,
  caption    text check (char_length(caption) <= 120),
  zlat       double precision,
  zlng       double precision,
  status     text not null default 'ok' check (status in ('ok', 'review', 'hidden')),
  reports    int not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create index if not exists stories_live on public.stories (expires_at) where status = 'ok';
alter table public.stories enable row level security;   -- alles via functies hieronder

create table if not exists public.feed_reports (
  kind     text not null check (kind in ('story', 'answer', 'venue')),
  item     uuid not null,
  reporter uuid not null references public.profiles(id) on delete cascade,
  reason   text check (char_length(reason) <= 200),
  at       timestamptz not null default now(),
  primary key (kind, item, reporter)
);
alter table public.feed_reports enable row level security;

-- mag ik dit verhaal zien? eigen verhaal, of: niet verlopen, goedgekeurd, niet geblokkeerd, en een match of in de buurt (± 25 km)
create or replace function public.can_see_story(s public.stories) returns boolean language sql stable security definer set search_path = public as $$
  select s.user_id = auth.uid() or (
    s.status = 'ok' and s.expires_at > now() and not public.is_blocked(auth.uid(), s.user_id) and (
      public.is_match(auth.uid(), s.user_id)
      or not exists (select 1 from presence where user_id = auth.uid())
      or s.zlat is null
      or exists (select 1 from presence me where me.user_id = auth.uid() and abs(me.zlat - s.zlat) <= 0.23 and abs(me.zlng - s.zlng) <= 0.35)));
$$;

-- voor de opslag-regel: mag ik dit bestand zien? (rijen in stories zijn zelf niet leesbaar)
create or replace function public.story_file_ok(p_name text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from stories s where s.path = p_name and public.can_see_story(s));
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('stories', 'stories', false, 900000, array['image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 900000, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists stories_read on storage.objects;
create policy stories_read on storage.objects for select to authenticated
  using (bucket_id = 'stories' and ((storage.foldername(name))[1] = auth.uid()::text
         or public.story_file_ok(name)));
drop policy if exists stories_write on storage.objects;
create policy stories_write on storage.objects for insert to authenticated
  with check (bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists stories_delete on storage.objects;
create policy stories_delete on storage.objects for delete to authenticated
  using (bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.story_post(p_path text, p_caption text, p_review boolean default false) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r text; nid uuid; z public.presence;
begin
  if me is null then raise exception 'niet ingelogd'; end if;
  if exists (select 1 from profiles where id = me and banned_at is not null) then raise exception 'geschorst'; end if;
  if split_part(p_path, '/', 1) <> me::text then raise exception 'ongeldig pad'; end if;
  r := public.feed_bad(p_caption); if r is not null then raise exception 'tekst niet toegestaan: %', r; end if;
  if (select count(*) from stories where user_id = me and created_at > now() - interval '24 hours') >= 5 then raise exception 'max 5 verhalen per dag'; end if;
  select * into z from presence where user_id = me;
  insert into stories (user_id, path, caption, zlat, zlng, status)
  values (me, p_path, nullif(trim(p_caption), ''), z.zlat, z.zlng, case when p_review then 'review' else 'ok' end)
  returning id into nid;
  return nid;
end $$;

create or replace function public.story_delete(p_id uuid) returns text language sql security definer set search_path = public as $$
  delete from stories where id = p_id and user_id = auth.uid() returning path;
$$;

/* ---------------- vraag van de avond ---------------- */
create table if not exists public.questions (
  id   serial primary key,
  nl   text not null,
  en   text not null
);
insert into public.questions (id, nl, en) values
 (1, 'Wat is jouw perfecte eerste date?', 'What''s your perfect first date?'),
 (2, 'Welk nummer zet je op als je gaat stappen?', 'Which song do you play before going out?'),
 (3, 'Beste snack na een avond uit?', 'Best snack after a night out?'),
 (4, 'Welk café in jouw buurt verdient meer volk?', 'Which bar near you deserves more people?'),
 (5, 'Wat maakt iemand meteen sympathiek?', 'What makes someone instantly likeable?'),
 (6, 'Zee of Ardennen voor een weekendje weg?', 'Coast or Ardennes for a weekend away?'),
 (7, 'Wat is je verborgen talent?', 'What''s your hidden talent?'),
 (8, 'Welk festival zou je nooit missen?', 'Which festival would you never miss?'),
 (9, 'Wat bestel je altijd aan de bar?', 'What do you always order at the bar?'),
 (10, 'Hond of kat?', 'Dog or cat?'),
 (11, 'Wat is het grappigste dat je ooit op een date meemaakte?', 'Funniest thing that ever happened on a date?'),
 (12, 'Waar ben je deze week trots op?', 'What are you proud of this week?'),
 (13, 'Welke film kan je blijven herbekijken?', 'Which movie can you rewatch forever?'),
 (14, 'Dansvloer of terras?', 'Dance floor or terrace?'),
 (15, 'Wat staat er nog op je bucketlist?', 'What''s still on your bucket list?'),
 (16, 'Beste frituur van de streek?', 'Best fries shop around here?'),
 (17, 'Wat doe je op een perfecte zondag?', 'What does your perfect Sunday look like?'),
 (18, 'Welke drie emoji''s beschrijven jou?', 'Which three emoji describe you?'),
 (19, 'Spontaan of alles gepland?', 'Spontaneous or everything planned?'),
 (20, 'Wat is een red flag voor jou?', 'What''s a red flag for you?'),
 (21, 'Wat is een green flag voor jou?', 'What''s a green flag for you?'),
 (22, 'Welk liedje zing je luidst mee?', 'Which song do you sing along to the loudest?'),
 (23, 'Waar wil je ooit nog naartoe reizen?', 'Where do you still want to travel?'),
 (24, 'Wat kook je als je indruk wil maken?', 'What do you cook to impress someone?'),
 (25, 'Ochtendmens of nachtuil?', 'Morning person or night owl?'),
 (26, 'Wat is je favoriete plek in je stad?', 'What''s your favourite spot in your town?'),
 (27, 'Welke app gebruik je het meest (behalve Galaxy)?', 'Which app do you use most (besides Galaxy)?'),
 (28, 'Wat zou je doen met een vrije dag morgen?', 'What would you do with a free day tomorrow?'),
 (29, 'Beste openingszin die je ooit kreeg?', 'Best opening line you ever got?'),
 (30, 'Waar word je altijd vrolijk van?', 'What always makes you happy?')
on conflict (id) do update set nl = excluded.nl, en = excluded.en;

-- vandaag (Brusselse tijd) en de vraag van vandaag
create or replace function public.feed_day() returns date language sql stable as $$ select (now() at time zone 'Europe/Brussels')::date $$;
create or replace function public.question_id(d date) returns int language sql stable security definer set search_path = public as $$
  select id from questions order by id offset ((d - date '2026-01-01') % greatest((select count(*) from questions), 1)) limit 1;
$$;

create table if not exists public.answers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  qday       date not null default public.feed_day(),
  body       text not null check (char_length(body) between 1 and 140),
  zlat       double precision,
  zlng       double precision,
  status     text not null default 'ok' check (status in ('ok', 'review', 'hidden')),
  reports    int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, qday)
);
alter table public.answers enable row level security;

create or replace function public.answer_post(p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r text; z public.presence;
begin
  if me is null then raise exception 'niet ingelogd'; end if;
  if exists (select 1 from profiles where id = me and banned_at is not null) then raise exception 'geschorst'; end if;
  r := public.feed_bad(p_body); if r is not null then raise exception 'tekst niet toegestaan: %', r; end if;
  select * into z from presence where user_id = me;
  insert into answers (user_id, body, zlat, zlng) values (me, trim(p_body), z.zlat, z.zlng)
  on conflict (user_id, qday) do update set body = excluded.body, created_at = now(), status = 'ok', reports = 0;
end $$;

create or replace function public.answer_delete() returns void language sql security definer set search_path = public as $$
  delete from answers where user_id = auth.uid() and qday = public.feed_day();
$$;

/* ---------------- café-posts ---------------- */
create table if not exists public.venue_posts (
  id         uuid primary key default gen_random_uuid(),
  venue      text not null,
  lat        double precision not null,
  lng        double precision not null,
  body       text not null check (char_length(body) between 3 and 160),
  until      timestamptz not null,
  status     text not null default 'ok' check (status in ('ok', 'review', 'hidden')),
  reports    int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.venue_posts enable row level security;

-- het café post met zijn geheime link (zelfde link als het café-dashboard); max 3 per dag, max 48 uur zichtbaar
create or replace function public.cafe_post(token uuid, p_body text, hours int default 12) returns uuid
language plpgsql security definer set search_path = public as $$
declare ev public.events; r text; nid uuid;
begin
  select * into ev from events where owner_token = token order by starts_at desc limit 1;
  if ev.id is null then raise exception 'ongeldige link'; end if;
  r := public.feed_bad(p_body); if r is not null and r <> 'telefoon' then raise exception 'tekst niet toegestaan: %', r; end if;
  if (select count(*) from venue_posts where lower(venue) = lower(ev.venue) and created_at > now() - interval '24 hours') >= 3 then raise exception 'max 3 posts per dag'; end if;
  insert into venue_posts (venue, lat, lng, body, until)
  values (ev.venue, ev.lat, ev.lng, trim(p_body), now() + make_interval(hours => least(greatest(coalesce(hours, 12), 1), 48)))
  returning id into nid;
  return nid;
end $$;

create or replace function public.cafe_posts(token uuid) returns jsonb language sql stable security definer set search_path = public as $$
  with v as (select venue from events where owner_token = token limit 1)
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'body', p.body, 'until', p.until, 'status', p.status, 'created_at', p.created_at) order by p.created_at desc), '[]')
  from venue_posts p, v where lower(p.venue) = lower(v.venue) and p.created_at > now() - interval '14 days';
$$;

create or replace function public.cafe_post_delete(token uuid, p_id uuid) returns void language sql security definer set search_path = public as $$
  delete from venue_posts p using events e where e.owner_token = token and lower(p.venue) = lower(e.venue) and p.id = p_id;
$$;

/* ---------------- melden: na 2 meldingen meteen verborgen tot de beheerder kijkt ---------------- */
create or replace function public.feed_report(p_kind text, p_item uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int;
begin
  if me is null then raise exception 'niet ingelogd'; end if;
  insert into feed_reports (kind, item, reporter, reason) values (p_kind, p_item, me, left(p_reason, 200)) on conflict do nothing;
  select count(*) into n from feed_reports where kind = p_kind and item = p_item;
  if p_kind = 'story' then update stories set reports = n, status = case when n >= 2 and status = 'ok' then 'review' else status end where id = p_item;
  elsif p_kind = 'answer' then update answers set reports = n, status = case when n >= 2 and status = 'ok' then 'review' else status end where id = p_item;
  elsif p_kind = 'venue' then update venue_posts set reports = n, status = case when n >= 2 and status = 'ok' then 'review' else status end where id = p_item;
  end if;
end $$;

/* ---------------- alles voor de feed in één keer ---------------- */
create or replace function public.feed_home() returns jsonb language sql stable security definer set search_path = public as $$
  with me as (select p.zlat, p.zlng from presence p where p.user_id = auth.uid()),
  near as (select (select count(*) from me) = 0 as anywhere),
  st as (
    select s.*, pr.name, pr.avatar from stories s join profiles pr on pr.id = s.user_id
    where public.can_see_story(s) and s.expires_at > now() and (s.status = 'ok' or s.user_id = auth.uid())
    order by (s.user_id = auth.uid()) desc, s.created_at desc limit 80),
  q as (select id, nl, en from questions where id = public.question_id(public.feed_day())),
  an as (
    select a.id, a.user_id, a.body, a.created_at, pr.name, pr.avatar from answers a join profiles pr on pr.id = a.user_id
    where a.qday = public.feed_day() and (a.user_id = auth.uid() or (a.status = 'ok' and not public.is_blocked(auth.uid(), a.user_id)
      and ((select anywhere from near) or a.zlat is null or public.is_match(auth.uid(), a.user_id)
           or exists (select 1 from me where abs(me.zlat - a.zlat) <= 0.23 and abs(me.zlng - a.zlng) <= 0.35))))
    order by (a.user_id = auth.uid()) desc, a.created_at desc limit 60),
  vp as (
    select v.* from venue_posts v where v.status = 'ok' and v.until > now()
      and ((select anywhere from near) or exists (select 1 from me where abs(me.zlat - v.lat) <= 0.23 and abs(me.zlng - v.lng) <= 0.35))
    order by v.created_at desc limit 20)
  select jsonb_build_object(
    'me', auth.uid(),
    'stories', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'uid', user_id, 'name', name, 'avatar', avatar, 'path', path, 'caption', caption,
                 'at', created_at, 'status', status, 'mine', user_id = auth.uid(), 'match', public.is_match(auth.uid(), user_id))), '[]') from st),
    'question', (select jsonb_build_object('nl', nl, 'en', en) from q),
    'answers', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'uid', user_id, 'name', name, 'avatar', avatar, 'body', body, 'at', created_at,
                 'mine', user_id = auth.uid())), '[]') from an),
    'venues', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'venue', venue, 'body', body, 'until', until, 'at', created_at)), '[]') from vp)
  );
$$;

/* ---------------- beheer ---------------- */
create or replace function public.admin_feed_review() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  return jsonb_build_object(
    'stories', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'path', s.path, 'caption', s.caption, 'name', p.name, 'uid', s.user_id, 'reports', s.reports, 'status', s.status, 'at', s.created_at,
                 'reasons', (select jsonb_agg(r.reason) from feed_reports r where r.kind = 'story' and r.item = s.id)) order by s.created_at desc), '[]')
                from stories s join profiles p on p.id = s.user_id where s.status = 'review' or (s.reports > 0 and s.status = 'ok' and s.expires_at > now())),
    'answers', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'body', a.body, 'name', p.name, 'uid', a.user_id, 'reports', a.reports, 'status', a.status, 'at', a.created_at,
                 'reasons', (select jsonb_agg(r.reason) from feed_reports r where r.kind = 'answer' and r.item = a.id)) order by a.created_at desc), '[]')
                from answers a join profiles p on p.id = a.user_id where a.status = 'review' or (a.reports > 0 and a.status = 'ok')),
    'venues', (select coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'body', v.body, 'venue', v.venue, 'reports', v.reports, 'status', v.status, 'at', v.created_at) order by v.created_at desc), '[]')
                from venue_posts v where v.status = 'review' or v.reports > 0),
    'counts', jsonb_build_object(
      'stories_today', (select count(*) from stories where created_at > now() - interval '24 hours'),
      'answers_today', (select count(*) from answers where qday = public.feed_day()),
      'venue_live', (select count(*) from venue_posts where status = 'ok' and until > now()),
      'to_review', (select count(*) from stories where status = 'review') + (select count(*) from answers where status = 'review') + (select count(*) from venue_posts where status = 'review'))
  );
end $$;

create or replace function public.admin_feed_set(p_kind text, p_item uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  if p_status not in ('ok', 'hidden') then raise exception 'ongeldige status'; end if;
  if p_kind = 'story' then update stories set status = p_status, reports = case when p_status = 'ok' then 0 else reports end where id = p_item;
  elsif p_kind = 'answer' then update answers set status = p_status, reports = case when p_status = 'ok' then 0 else reports end where id = p_item;
  elsif p_kind = 'venue' then update venue_posts set status = p_status, reports = case when p_status = 'ok' then 0 else reports end where id = p_item;
  end if;
  if p_status = 'ok' then delete from feed_reports where kind = p_kind and item = p_item; end if;
end $$;

/* ---------------- opruimen: oude rijen weg (bestanden ruimt de app zelf op) ---------------- */
create or replace function public.feed_cleanup() returns void language sql security definer set search_path = public as $$
  delete from stories where expires_at < now() - interval '2 days';
  delete from answers where qday < public.feed_day() - 14;
  delete from venue_posts where until < now() - interval '14 days';
  delete from feed_reports r where not exists (select 1 from stories s where s.id = r.item) and not exists (select 1 from answers a where a.id = r.item)
                               and not exists (select 1 from venue_posts v where v.id = r.item);
$$;
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'galaxy-feed-cleanup';
    perform cron.schedule('galaxy-feed-cleanup', '17 4 * * *', 'select public.feed_cleanup()');
  end if;
end $$;

/* ---------------- voor "mijn gegevens downloaden" ---------------- */
create or replace function public.my_feed_data() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'verhalen', (select coalesce(jsonb_agg(jsonb_build_object('bestand', path, 'tekst', caption, 'geplaatst', created_at, 'verloopt', expires_at, 'status', status)), '[]') from stories where user_id = auth.uid()),
    'antwoorden', (select coalesce(jsonb_agg(jsonb_build_object('dag', qday, 'antwoord', body, 'status', status)), '[]') from answers where user_id = auth.uid()),
    'jouw_meldingen', (select coalesce(jsonb_agg(jsonb_build_object('soort', kind, 'reden', reason, 'op', at)), '[]') from feed_reports where reporter = auth.uid()));
$$;
revoke all on function public.my_feed_data() from public, anon;
grant execute on function public.my_feed_data() to authenticated;

/* ---------------- rechten ---------------- */
revoke all on function public.feed_bad(text), public.can_see_story(public.stories), public.story_file_ok(text), public.story_post(text, text, boolean), public.story_delete(uuid),
  public.question_id(date), public.answer_post(text), public.answer_delete(), public.cafe_post(uuid, text, int), public.cafe_posts(uuid),
  public.cafe_post_delete(uuid, uuid), public.feed_report(text, uuid, text), public.feed_home(), public.admin_feed_review(),
  public.admin_feed_set(text, uuid, text), public.feed_cleanup() from public, anon;
grant execute on function public.feed_bad(text), public.can_see_story(public.stories), public.story_file_ok(text), public.story_post(text, text, boolean), public.story_delete(uuid),
  public.question_id(date), public.answer_post(text), public.answer_delete(), public.feed_report(text, uuid, text), public.feed_home(),
  public.admin_feed_review(), public.admin_feed_set(text, uuid, text) to authenticated;
grant execute on function public.cafe_post(uuid, text, int), public.cafe_posts(uuid), public.cafe_post_delete(uuid, uuid) to anon, authenticated;
