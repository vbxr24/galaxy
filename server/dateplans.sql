-- Galaxy: dates plannen tussen matches.
-- Wie: alleen twee mensen die naar elkaar zwaaiden (match) en elkaar niet blokkeerden.
-- Privé: "nog eens afspreken?" ziet de ander nooit; je ziet alleen of jullie allebei ja zeiden.
-- Plak dit in de Supabase SQL Editor (na schema.sql en realtime.sql). Veilig om opnieuw uit te voeren.

create table if not exists public.date_plans (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references public.profiles(id) on delete cascade,
  to_id      uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'proposed' check (status in ('proposed','confirmed','other_time','declined','cancelled')),
  activity   text not null check (char_length(activity) between 1 and 120),
  place      text not null check (char_length(place) between 1 and 200),
  plat       double precision check (plat between -90 and 90),
  plng       double precision check (plng between -180 and 180),
  starts_at  timestamptz not null,
  minutes    int not null default 120 check (minutes between 30 and 720),
  note       text check (char_length(note) <= 500),
  from_wish  jsonb not null default '{}'::jsonb check (jsonb_typeof(from_wish) = 'object' and pg_column_size(from_wish) < 2000),
  to_wish    jsonb not null default '{}'::jsonb check (jsonb_typeof(to_wish) = 'object' and pg_column_size(to_wish) < 2000),
  reply      text check (char_length(reply) <= 300),
  again_from boolean,
  again_to   boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_id <> to_id)
);
create index if not exists date_plans_from on public.date_plans (from_id, starts_at desc);
create index if not exists date_plans_to   on public.date_plans (to_id, starts_at desc);

alter table public.date_plans enable row level security;
revoke all on public.date_plans from anon, authenticated;

-- lezen: alleen de twee betrokkenen, en nooit de "nog eens?"-antwoorden
grant select (id, from_id, to_id, status, activity, place, plat, plng, starts_at, minutes, note, from_wish, to_wish, reply, created_at, updated_at)
  on public.date_plans to authenticated;
drop policy if exists date_read on public.date_plans;
create policy date_read on public.date_plans for select to authenticated using (auth.uid() in (from_id, to_id));

-- voorstellen: alleen aan een match, niet in het verleden, max. 20 per dag
grant insert (from_id, to_id, activity, place, plat, plng, starts_at, minutes, note, from_wish) on public.date_plans to authenticated;
drop policy if exists date_new on public.date_plans;
create policy date_new on public.date_plans for insert to authenticated with check (
  from_id = auth.uid()
  and public.is_match(from_id, to_id)
  and starts_at > now() and starts_at < now() + interval '180 days'
  and (select count(*) from public.date_plans d where d.from_id = auth.uid() and d.created_at > now() - interval '1 day') < 20
);
-- geen rechtstreekse updates of deletes: alles via de functies hieronder

-- antwoorden op een voorstel (alleen de ontvanger)
create or replace function public.date_respond(p uuid, st text, wish jsonb default '{}'::jsonb, msg text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if st not in ('confirmed','other_time','declined') then raise exception 'ongeldig antwoord'; end if;
  if wish is null or jsonb_typeof(wish) <> 'object' or pg_column_size(wish) >= 2000 then raise exception 'ongeldige wensen'; end if;
  update date_plans set status = st, to_wish = wish, reply = left(nullif(trim(msg), ''), 300), updated_at = now()
   where id = p and to_id = auth.uid() and status = 'proposed' and not public.is_blocked(from_id, to_id);
  if not found then raise exception 'voorstel niet gevonden of al beantwoord'; end if;
end $$;

-- annuleren (allebei kunnen dat, zolang de date nog niet voorbij is)
create or replace function public.date_cancel(p uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update date_plans set status = 'cancelled', updated_at = now()
   where id = p and auth.uid() in (from_id, to_id) and status in ('proposed','confirmed','other_time')
     and starts_at + make_interval(mins => minutes) > now();
  if not found then raise exception 'kan niet meer geannuleerd worden'; end if;
end $$;

-- na de date: "nog eens afspreken?" Geeft enkel terug of jullie ALLEBEI ja zeiden.
create or replace function public.date_again(p uuid, yes boolean default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r date_plans;
begin
  select * into r from date_plans where id = p and auth.uid() in (from_id, to_id);
  if not found then raise exception 'niet gevonden'; end if;
  if yes is not null then
    if r.status <> 'confirmed' or r.starts_at + make_interval(mins => r.minutes) > now() then raise exception 'kan pas na de date'; end if;
    if auth.uid() = r.from_id then update date_plans set again_from = yes where id = p; r.again_from := yes;
    else update date_plans set again_to = yes where id = p; r.again_to := yes; end if;
  end if;
  return jsonb_build_object(
    'mine', case when auth.uid() = r.from_id then r.again_from else r.again_to end,
    'both', coalesce(r.again_from, false) and coalesce(r.again_to, false));
end $$;

revoke all on function public.date_respond(uuid, text, jsonb, text), public.date_cancel(uuid), public.date_again(uuid, boolean) from public, anon;
grant execute on function public.date_respond(uuid, text, jsonb, text), public.date_cancel(uuid), public.date_again(uuid, boolean) to authenticated;
