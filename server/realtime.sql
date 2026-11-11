-- Galaxy: live drukte en live chat (uitvoeren na schema.sql; mag meerdere keren)
-- Veiligheid: live drukte toont alleen AANTALLEN. Een zone telt pas mee vanaf 3 leden,
-- zodat je er nooit één persoon mee kunt volgen. Wie er zit, blijft 15 minuten vertraagd.

alter table public.checkins add column if not exists plat double precision;
alter table public.checkins add column if not exists plng double precision;
create index if not exists checkins_at on public.checkins (at desc);
grant delete on public.checkins to authenticated;

-- live drukte per zone: aantal leden dat de laatste 10 minuten actief was (vanaf 3)
create or replace function public.busy_near(lat double precision, lng double precision) returns table (zlat double precision, zlng double precision, n bigint)
language sql stable security definer set search_path = public as $$
  select pr.zlat, pr.zlng, count(*)
  from presence pr join profiles p on p.id = pr.user_id
  where auth.uid() is not null and not p.ghost and pr.seen > now() - interval '10 minutes'
    and pr.zlat between lat - 0.05 and lat + 0.05 and pr.zlng between lng - 0.08 and lng + 0.08
  group by 1, 2 having count(*) >= 3;
$$;

-- live check-ins per plek (laatste 2 uur): alleen het aantal, niet wie
create or replace function public.places_busy(lat double precision, lng double precision) returns table (place_id text, n bigint)
language sql stable security definer set search_path = public as $$
  select c.place_id, count(distinct c.user_id)
  from checkins c join profiles p on p.id = c.user_id
  where auth.uid() is not null and not p.ghost and c.at > now() - interval '2 hours'
    and c.plat between lat - 0.05 and lat + 0.05 and c.plng between lng - 0.08 and lng + 0.08
  group by 1;
$$;

revoke all on function public.busy_near(double precision,double precision), public.places_busy(double precision,double precision) from public, anon;
grant execute on function public.busy_near(double precision,double precision), public.places_busy(double precision,double precision) to authenticated;

-- nieuwe berichten meteen doorsturen (Supabase Realtime); alleen wie het bericht mag lezen krijgt het
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
