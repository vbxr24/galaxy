-- Galaxy – "iemand in de buurt": een pushmelding (die ook op je smartwatch trilt).
-- Staat standaard UIT. Per toestel kies je: uit, alleen matches, of iedereen.
-- Privacy: de melding zegt nooit wie of waar precies. Alleen mensen die zelf zichtbaar zijn
-- (niet onzichtbaar, al 15 minuten in de zone, niet geblokkeerd, niet geschorst).
-- Maximaal 1 melding per 30 minuten per persoon, en per duo maximaal 1 keer per 12 uur.

alter table public.push_subs add column if not exists near text not null default 'uit' check (near in ('uit', 'matches', 'iedereen'));

create table if not exists public.near_pings (
  id        bigint generated always as identity primary key,
  to_id     uuid not null references public.profiles(id) on delete cascade,
  about_id  uuid not null references public.profiles(id) on delete cascade,
  is_match  boolean not null default false,
  at        timestamptz not null default now(),
  pushed_at timestamptz
);
create index if not exists near_pings_to on public.near_pings (to_id, at desc);
alter table public.near_pings enable row level security;  -- niemand leest dit rechtstreeks
revoke all on public.near_pings from anon, authenticated;

create or replace function public.near_check() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare r record; me_ok boolean;
begin
  -- alleen als de persoon die beweegt zelf zichtbaar is
  select not p.ghost and p.banned_at is null into me_ok from profiles p where p.id = new.user_id;
  if not coalesce(me_ok, false) or new.visible_from > now() then return new; end if;

  for r in
    select o.user_id as other, public.is_match(new.user_id, o.user_id) as m
    from presence o join profiles op on op.id = o.user_id
    where o.user_id <> new.user_id and not op.ghost and op.banned_at is null
      and o.visible_from <= now() and o.seen > now() - interval '20 minutes'
      and abs(o.zlat - new.zlat) <= 0.006 and abs(o.zlng - new.zlng) <= 0.009
      and not public.is_blocked(new.user_id, o.user_id)
    limit 50
  loop
    -- twee richtingen: de ander hoort over mij, en ik over de ander
    perform public.near_ping(r.other, new.user_id, r.m);
    perform public.near_ping(new.user_id, r.other, r.m);
  end loop;
  return new;
exception when others then
  return new;  -- een melding mag de kaart nooit tegenhouden
end $$;

create or replace function public.near_ping(rcpt uuid, about uuid, m boolean) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare mode text; pid bigint;
begin
  select case when bool_or(near = 'iedereen') then 'iedereen' when bool_or(near = 'matches') then 'matches' else 'uit' end
    into mode from push_subs where user_id = rcpt;
  if mode is null or mode = 'uit' or (mode = 'matches' and not m) then return; end if;
  if exists (select 1 from near_pings where to_id = rcpt and at > now() - interval '30 minutes') then return; end if;
  if exists (select 1 from near_pings where to_id = rcpt and about_id = about and at > now() - interval '12 hours') then return; end if;
  insert into near_pings (to_id, about_id, is_match) values (rcpt, about, m) returning id into pid;
  perform net.http_post(
    url := 'https://dqodwuemdpzyvvvxvgtz.supabase.co/functions/v1/push',
    body := jsonb_build_object('near', pid),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 4000);
end $$;
revoke all on function public.near_check(), public.near_ping(uuid, uuid, boolean) from public, anon, authenticated;

drop trigger if exists presence_near on public.presence;
create trigger presence_near after insert or update of zlat, zlng, visible_from, seen on public.presence
  for each row execute function public.near_check();

-- eigen keuze per toestel (de app roept dit aan)
create or replace function public.set_near_alert(ep text, mode text) returns void
language sql security definer set search_path = public as $$
  update push_subs set near = mode where endpoint = ep and user_id = auth.uid() and mode in ('uit', 'matches', 'iedereen');
$$;
revoke all on function public.set_near_alert(text, text) from public, anon;
grant execute on function public.set_near_alert(text, text) to authenticated;

-- oude pings opruimen
delete from public.near_pings where at < now() - interval '3 days';
