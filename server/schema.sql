-- =====================================================================
-- Galaxy – database voor Supabase (Postgres)
-- Plakken in: Supabase > SQL Editor > New query > Run
--
-- Veiligheidsregels die hier afgedwongen worden (niet alleen in de app):
--  * alleen 18+ kan een profiel maken
--  * de exacte locatie wordt NOOIT bewaard: de server rondt af naar een zone van ±300 m
--  * een nieuwe zone wordt pas na 15 minuten zichtbaar voor anderen
--  * onzichtbaar = je staat in geen enkele lijst
--  * geaardheid en socials alleen zichtbaar als de eigenaar dat koos
--  * chatten kan alleen na een wederzijdse zwaai (match) en niet met wie je blokkeerde
--  * abonnement, respect-score en leeftijdscontrole kan een gebruiker niet zelf aanpassen
-- =====================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null check (char_length(name) between 2 and 24),
  birth         date not null,
  city          text check (char_length(city) <= 40),
  bio           text check (char_length(bio) <= 500),
  cat           text check (cat in ('lange','serieus','zien','vrienden','fwb','ons')),
  gender        text check (char_length(gender) <= 30),
  pron          text check (char_length(pron) <= 20),
  orient        text check (char_length(orient) <= 30),
  show_orient   boolean not null default false,
  seek          text[] not null default '{}',
  ints          text[] not null default '{}',
  basics        jsonb  not null default '{}',
  music         text check (music is null or music ~ '^https://open\.spotify\.com/'),
  ig            text check (ig   ~ '^[A-Za-z0-9._-]{0,30}$'),
  snap          text check (snap ~ '^[A-Za-z0-9._-]{0,30}$'),
  social_vis    text not null default 'verborgen' check (social_vis in ('verborgen','matches','iedereen')),
  ptheme        text not null default 'Galaxy',
  avatar        jsonb,
  ghost         boolean not null default false,
  plan          text not null default 'free' check (plan in ('free','plus','gold','cosmic')),
  respect       int  not null default 100 check (respect between 0 and 100),
  age_verified  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 18+ afdwingen (een CHECK met de datum van vandaag mag niet, dus een trigger)
create or replace function public.profiles_guard() returns trigger language plpgsql as $$
begin
  if new.birth > (current_date - interval '18 years')::date then
    raise exception 'Galaxy is alleen voor 18 jaar en ouder';
  end if;
  if new.birth < date '1900-01-01' then raise exception 'Ongeldige geboortedatum'; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before insert or update on public.profiles for each row execute function public.profiles_guard();

create table if not exists public.presence (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  zlat         double precision not null,
  zlng         double precision not null,
  visible_from timestamptz not null default now() + interval '15 minutes',
  seen         timestamptz not null default now()
);
create index if not exists presence_zone on public.presence (zlat, zlng);

create table if not exists public.checkins (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  place_id   text not null check (char_length(place_id) <= 80),
  place_name text not null check (char_length(place_name) <= 120),
  at         timestamptz not null default now()
);
create index if not exists checkins_place on public.checkins (place_id, at desc);

create table if not exists public.group_dates (
  id         bigint generated always as identity primary key,
  owner      uuid not null references public.profiles(id) on delete cascade,
  place_name text not null check (char_length(place_name) <= 120),
  lat        double precision not null,
  lng        double precision not null,
  starts_at  timestamptz not null,
  kind       text not null check (char_length(kind) <= 40),
  max_people int  not null default 6 check (max_people between 3 and 20),
  created_at timestamptz not null default now()
);
create table if not exists public.group_members (
  group_id bigint not null references public.group_dates(id) on delete cascade,
  user_id  uuid   not null references public.profiles(id) on delete cascade,
  primary key (group_id, user_id)
);

create table if not exists public.waves (
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id   uuid not null references public.profiles(id) on delete cascade,
  at      timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

create table if not exists public.blocks (
  blocker uuid not null references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  at      timestamptz not null default now(),
  primary key (blocker, blocked)
);

create table if not exists public.messages (
  id      bigint generated always as identity primary key,
  sender  uuid not null references public.profiles(id) on delete cascade,
  to_id   uuid not null references public.profiles(id) on delete cascade,
  body    text not null check (char_length(body) between 1 and 1000),
  at      timestamptz not null default now()
);
create index if not exists messages_pair on public.messages (least(sender,to_id), greatest(sender,to_id), at);

create table if not exists public.reports (
  id       bigint generated always as identity primary key,
  reporter uuid not null references public.profiles(id) on delete cascade,
  target   uuid not null references public.profiles(id) on delete cascade,
  reason   text not null check (char_length(reason) <= 60),
  detail   text check (char_length(detail) <= 1000),
  at       timestamptz not null default now(),
  handled  boolean not null default false
);

-- ---------- hulpfuncties ----------
create or replace function public.is_blocked(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a));
$$;
create or replace function public.is_match(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from waves where from_id = a and to_id = b)
     and exists (select 1 from waves where from_id = b and to_id = a)
     and not public.is_blocked(a, b);
$$;

-- profielkaart zoals anderen die zien (nooit geboortedatum, nooit locatie)
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
    'hasSocials', (coalesce(p.ig,'') <> '' or coalesce(p.snap,'') <> '')
  ) end
  from (select 1) x left join profiles p on p.id = target;
$$;

-- locatie doorgeven: de server rondt af naar een zone, de exacte plek wordt weggegooid
create or replace function public.set_presence(lat double precision, lng double precision) returns void language plpgsql security definer set search_path = public as $$
declare z constant double precision := 0.003; nlat double precision; nlng double precision;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd'; end if;
  if lat is null or lng is null or abs(lat) > 90 or abs(lng) > 180 then raise exception 'Ongeldige locatie'; end if;
  nlat := round((lat / z)::numeric) * z;  nlng := round((lng / z)::numeric) * z;
  insert into presence (user_id, zlat, zlng) values (auth.uid(), nlat, nlng)
  on conflict (user_id) do update set
    visible_from = case when presence.zlat = excluded.zlat and presence.zlng = excluded.zlng then presence.visible_from else now() + interval '15 minutes' end,
    zlat = excluded.zlat, zlng = excluded.zlng, seen = now();
end $$;
create or replace function public.clear_presence() returns void language sql security definer set search_path = public as $$
  delete from presence where user_id = auth.uid();
$$;

-- drukte per zone rond een punt (alleen aantallen per categorie)
create or replace function public.zones_near(lat double precision, lng double precision) returns table (zlat double precision, zlng double precision, cat text, n bigint)
language sql stable security definer set search_path = public as $$
  select pr.zlat, pr.zlng, coalesce(p.cat, 'zien'), count(*)
  from presence pr join profiles p on p.id = pr.user_id
  where auth.uid() is not null and not p.ghost and pr.visible_from <= now() and pr.seen > now() - interval '2 hours'
    and pr.zlat between lat - 0.05 and lat + 0.05 and pr.zlng between lng - 0.08 and lng + 0.08
  group by 1, 2, 3;
$$;

-- wie zit er in een zone (profielkaarten, zonder wie jou of jij blokkeerde)
create or replace function public.zone_people(z_lat double precision, z_lng double precision) returns setof jsonb
language sql stable security definer set search_path = public as $$
  select public.profile_card(p.id)
  from presence pr join profiles p on p.id = pr.user_id
  where auth.uid() is not null and p.id <> auth.uid() and not p.ghost and pr.visible_from <= now() and pr.seen > now() - interval '2 hours'
    and abs(pr.zlat - z_lat) < 0.0001 and abs(pr.zlng - z_lng) < 0.0001
    and not public.is_blocked(auth.uid(), p.id)
  limit 100;
$$;

-- wie checkte de laatste 2 uur in op dezelfde plek (alleen als je er zelf ook incheckte)
create or replace function public.place_people(place text) returns setof jsonb
language sql stable security definer set search_path = public as $$
  select public.profile_card(c.user_id)
  from (select distinct user_id from checkins where place_id = place and at > now() - interval '2 hours') c
  join profiles p on p.id = c.user_id
  where exists (select 1 from checkins me where me.user_id = auth.uid() and me.place_id = place and me.at > now() - interval '2 hours')
    and c.user_id <> auth.uid() and not p.ghost and not public.is_blocked(auth.uid(), c.user_id)
  limit 100;
$$;

create or replace function public.my_matches() returns setof jsonb language sql stable security definer set search_path = public as $$
  select public.profile_card(w.to_id) from waves w
  where w.from_id = auth.uid() and public.is_match(auth.uid(), w.to_id);
$$;

-- ---------- rechten ----------
alter table public.profiles      enable row level security;
alter table public.presence      enable row level security;
alter table public.checkins      enable row level security;
alter table public.group_dates   enable row level security;
alter table public.group_members enable row level security;
alter table public.waves         enable row level security;
alter table public.blocks        enable row level security;
alter table public.messages      enable row level security;
alter table public.reports       enable row level security;

revoke all on public.profiles, public.presence, public.checkins, public.group_dates, public.group_members, public.waves, public.blocks, public.messages, public.reports from anon, authenticated;

-- profiel: alleen je eigen rij; plan, respect en age_verified staan NIET in de lijst en zijn dus niet aanpasbaar
grant select, delete on public.profiles to authenticated;
grant insert (id, name, birth, city, bio, cat, gender, pron, orient, show_orient, seek, ints, basics, music, ig, snap, social_vis, ptheme, avatar, ghost) on public.profiles to authenticated;
grant update (name, city, bio, cat, gender, pron, orient, show_orient, seek, ints, basics, music, ig, snap, social_vis, ptheme, avatar, ghost) on public.profiles to authenticated;
drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- presence: geen directe toegang, alleen via de functies hierboven

grant select, insert on public.checkins to authenticated;
drop policy if exists checkins_own on public.checkins;
create policy checkins_own on public.checkins for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.group_dates to authenticated;
drop policy if exists groups_read on public.group_dates;
create policy groups_read on public.group_dates for select to authenticated using (starts_at > now() - interval '3 hours' and not public.is_blocked(auth.uid(), owner));
drop policy if exists groups_own on public.group_dates;
create policy groups_own on public.group_dates for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

grant select, insert, delete on public.group_members to authenticated;
drop policy if exists members_read on public.group_members;
create policy members_read on public.group_members for select to authenticated using (true);
drop policy if exists members_own on public.group_members;
create policy members_own on public.group_members for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on public.waves to authenticated;
drop policy if exists waves_read on public.waves;
create policy waves_read on public.waves for select to authenticated using (from_id = auth.uid());
drop policy if exists waves_own on public.waves;
create policy waves_own on public.waves for all to authenticated using (from_id = auth.uid()) with check (from_id = auth.uid() and not public.is_blocked(from_id, to_id));

grant select, insert, delete on public.blocks to authenticated;
drop policy if exists blocks_own on public.blocks;
create policy blocks_own on public.blocks for all to authenticated using (blocker = auth.uid()) with check (blocker = auth.uid());

grant select, insert on public.messages to authenticated;
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated using (auth.uid() in (sender, to_id));
drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated with check (sender = auth.uid() and public.is_match(sender, to_id));

grant insert on public.reports to authenticated;
drop policy if exists reports_send on public.reports;
create policy reports_send on public.reports for insert to authenticated with check (reporter = auth.uid());

revoke all on function public.is_blocked(uuid,uuid), public.is_match(uuid,uuid), public.profile_card(uuid), public.set_presence(double precision,double precision), public.clear_presence(), public.zones_near(double precision,double precision), public.zone_people(double precision,double precision), public.place_people(text), public.my_matches() from public, anon;
grant execute on function public.is_blocked(uuid,uuid), public.is_match(uuid,uuid), public.profile_card(uuid), public.set_presence(double precision,double precision), public.clear_presence(), public.zones_near(double precision,double precision), public.zone_people(double precision,double precision), public.place_people(text), public.my_matches() to authenticated;
