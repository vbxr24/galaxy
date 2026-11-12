-- Galaxy: feedback na een date.
-- Zoals Hinge "We Met": wat je over de date zegt, blijft privé. Alleen POSITIEVE complimenten
-- komen bij de ander terecht, en op een profiel pas als minstens 2 verschillende mensen hetzelfde gaven
-- (zo kan niemand achterhalen wie wat zei). "Ik voelde me niet veilig" of "leek niet op het profiel"
-- gaat als melding naar het Galaxy-team, nooit naar de ander.
-- Plak dit in de Supabase SQL Editor NA dateplans.sql. Veilig om opnieuw uit te voeren.

create table if not exists public.date_feedback (
  plan_id    uuid not null references public.date_plans(id) on delete cascade,
  from_id    uuid not null references public.profiles(id) on delete cascade,
  to_id      uuid not null references public.profiles(id) on delete cascade,
  tags       text[] not null default '{}' check (
               tags <@ array['respect','fun','punctual','like_photos','listener','at_ease','kind','great_spot']::text[]
               and cardinality(tags) <= 5),
  safe       boolean,
  as_profile boolean,
  created_at timestamptz not null default now(),
  primary key (plan_id, from_id)
);
create index if not exists date_feedback_to on public.date_feedback (to_id);
alter table public.date_feedback enable row level security;
revoke all on public.date_feedback from anon, authenticated;   -- enkel via de functies hieronder

create or replace function public.date_feedback_give(p uuid, tags text[], safe boolean, as_profile boolean, note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r date_plans; other uuid;
begin
  select * into r from date_plans where id = p and auth.uid() in (from_id, to_id);
  if not found then raise exception 'niet gevonden'; end if;
  if r.status <> 'confirmed' or r.starts_at > now() then raise exception 'feedback kan pas als de date begonnen is'; end if;
  if r.starts_at < now() - interval '60 days' then raise exception 'te lang geleden'; end if;
  other := case when auth.uid() = r.from_id then r.to_id else r.from_id end;
  insert into date_feedback (plan_id, from_id, to_id, tags, safe, as_profile)
  values (p, auth.uid(), other, coalesce(tags, '{}'), safe, as_profile)
  on conflict (plan_id, from_id) do update set tags = excluded.tags, safe = excluded.safe, as_profile = excluded.as_profile, created_at = now();
  -- een slecht gevoel wordt een melding voor het team (één keer per date)
  if (safe is false or as_profile is false) and not exists (
       select 1 from reports where reporter = auth.uid() and target = other and at > now() - interval '7 days' and reason like 'Na date:%') then
    insert into reports (reporter, target, reason, detail)
    values (auth.uid(), other,
            case when safe is false then 'Na date: voelde zich niet veilig' else 'Na date: leek niet op profiel' end,
            left(nullif(trim(note), ''), 1000));
  end if;
end $$;

-- wat jij zelf gaf voor deze date (om je antwoord te kunnen aanpassen)
create or replace function public.date_feedback_mine(p uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('tags', tags, 'safe', safe, 'as_profile', as_profile)
    from date_feedback where plan_id = p and from_id = auth.uid();
$$;

-- jouw ontvangen complimenten (alleen tags en aantallen, nooit van wie)
create or replace function public.my_compliments()
returns table (tag text, n int) language sql stable security definer set search_path = public as $$
  select t, count(*)::int from date_feedback, unnest(tags) t where to_id = auth.uid() group by t order by 2 desc;
$$;

-- complimenten op iemands profiel: alleen als minstens 2 verschillende mensen hetzelfde gaven
create or replace function public.compliments_of(target uuid)
returns table (tag text, n int) language sql stable security definer set search_path = public as $$
  select t, count(distinct from_id)::int from date_feedback, unnest(tags) t
   where to_id = target and not public.is_blocked(auth.uid(), target)
   group by t having count(distinct from_id) >= 2 order by 2 desc limit 6;
$$;

revoke all on function public.date_feedback_give(uuid, text[], boolean, boolean, text), public.date_feedback_mine(uuid),
  public.my_compliments(), public.compliments_of(uuid) from public, anon;
grant execute on function public.date_feedback_give(uuid, text[], boolean, boolean, text), public.date_feedback_mine(uuid),
  public.my_compliments(), public.compliments_of(uuid) to authenticated;
