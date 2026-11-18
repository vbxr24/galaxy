-- Galaxy – extra beveiliging. Voer uit na auto.sql. Veilig om opnieuw uit te voeren.

/* ---------- 1. Elke tabel in de database standaard dicht ----------
   Een tabel zonder RLS is in Supabase voor iedereen leesbaar en schrijfbaar. We zetten RLS aan op álle tabellen;
   wat de app nodig heeft, loopt via de bestaande regels en beveiligde functies. */
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
-- tabellen die alleen via functies gebruikt worden: geen rechtstreekse toegang
revoke all on public.questions, public.stories, public.answers, public.venue_posts, public.feed_reports, public.push_queue,
  public.verify_requests, public._galaxy_migrations from anon, authenticated;

/* ---------- 2. Functies niet bereikbaar voor wie niet ingelogd is ----------
   Alleen het café-dashboard werkt zonder login (met zijn geheime link). */
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind = 'f' loop
    execute format('revoke execute on function %s from public, anon', f.sig);
  end loop;
end $$;
do $$ begin
  grant execute on function public.cafe_post(uuid, text, int), public.cafe_posts(uuid), public.cafe_post_delete(uuid, uuid) to anon;
  begin execute 'grant execute on function public.venue_stats(uuid) to anon'; exception when others then null; end;
end $$;
-- nieuwe functies voortaan ook standaard dicht voor wie niet ingelogd is
alter default privileges in schema public revoke execute on functions from public, anon;

/* ---------- 3. Grenzen aan wat je in je profiel kwijt kunt (tegen misbruik met enorme data) ---------- */
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_sizes_ok') then
    alter table public.profiles add constraint profiles_sizes_ok check (
      coalesce(array_length(seek, 1), 0) <= 10 and coalesce(array_length(ints, 1), 0) <= 30
      and octet_length(basics::text) <= 4000 and octet_length(coalesce(avatar::text, '')) <= 4000
      and char_length(ptheme) <= 30) not valid;
  end if;
end $$;

/* ---------- 4. Snelheidslimieten tegen spam en bots ---------- */
create index if not exists messages_sender_at on public.messages (sender, at desc);
create index if not exists waves_from_at on public.waves (from_id, at desc);
create index if not exists reports_reporter_at on public.reports (reporter, at desc);

create or replace function public.rate_messages() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from messages where sender = new.sender and at > now() - interval '1 minute') >= 20
     or (select count(*) from messages where sender = new.sender and at > now() - interval '1 day') >= 800 then
    raise exception 'te snel: wacht even voor je meer berichten stuurt' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists messages_rate on public.messages;
create trigger messages_rate before insert on public.messages for each row execute function public.rate_messages();

create or replace function public.rate_waves() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from waves where from_id = new.from_id and at > now() - interval '1 hour') >= 60
     or (select count(*) from waves where from_id = new.from_id and at > now() - interval '1 day') >= 300 then
    raise exception 'te snel: je zwaaide al heel veel vandaag' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists waves_rate on public.waves;
create trigger waves_rate before insert on public.waves for each row execute function public.rate_waves();

create or replace function public.rate_reports() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from reports where reporter = new.reporter and at > now() - interval '1 day') >= 20 then
    raise exception 'te veel meldingen vandaag' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists reports_rate on public.reports;
create trigger reports_rate before insert on public.reports for each row execute function public.rate_reports();

revoke all on function public.rate_messages(), public.rate_waves(), public.rate_reports() from public, anon, authenticated;

/* ---------- 5. Logboek van beheerdersacties (wie deed wat, wanneer) ---------- */
create table if not exists public.admin_log (
  id    bigint generated always as identity primary key,
  admin uuid,
  what  text not null,
  target uuid,
  at    timestamptz not null default now()
);
alter table public.admin_log enable row level security;
revoke all on public.admin_log from anon, authenticated;

create or replace function public.log_ban() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.banned_at is distinct from old.banned_at then
    insert into admin_log (admin, what, target) values (auth.uid(), case when new.banned_at is null then 'opgeheven' when new.auto_hold then 'automatisch gepauzeerd' else 'geschorst' end, new.id);
  end if;
  return new;
end $$;
drop trigger if exists profiles_log_ban on public.profiles;
create trigger profiles_log_ban after update of banned_at on public.profiles for each row execute function public.log_ban();
