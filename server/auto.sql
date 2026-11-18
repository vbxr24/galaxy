-- Galaxy – alles wat vanzelf moet gebeuren, zonder dat iemand iets hoeft te doen.
-- Voer uit na more.sql. Veilig om opnieuw uit te voeren.

/* ---------- 1. Automatische bescherming bij meldingen ----------
   Krijgt iemand binnen 48 uur meldingen van 3 verschillende mensen (of 2 bij een vermoeden van minderjarigheid),
   dan wordt die persoon meteen tijdelijk gepauzeerd: onzichtbaar en geen berichten meer, tot jij het bekijkt.
   Alleen meldingen van accounts die minstens 1 dag oud zijn tellen mee, zodat niemand met nepaccounts iemand kan wegpesten. */
alter table public.profiles add column if not exists auto_hold boolean not null default false;

create or replace function public.auto_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare n int; minor int; tgt public.profiles;
begin
  select * into tgt from profiles where id = new.target;
  if tgt.id is null or tgt.banned_at is not null or exists (select 1 from admins where user_id = new.target) then return new; end if;
  select count(distinct r.reporter),
         count(distinct r.reporter) filter (where r.reason ~* '(minder|jong|18|minor|age|âge|edad|età)')
    into n, minor
    from reports r join profiles p on p.id = r.reporter
   where r.target = new.target and not r.handled and r.at > now() - interval '48 hours'
     and p.created_at < now() - interval '1 day' and p.banned_at is null;
  if n >= 3 or minor >= 2 then
    update profiles set banned_at = now(), ghost = true, auto_hold = true,
      ban_reason = 'Tijdelijk gepauzeerd na meerdere meldingen. Een mens van het Galaxy-team bekijkt dit zo snel mogelijk.'
     where id = new.target;
    delete from presence where user_id = new.target;
    perform public.admin_ping('⚠️ Iemand werd automatisch gepauzeerd na meerdere meldingen. Bekijk het in Veiligheid.');
  end if;
  return new;
end $$;
drop trigger if exists reports_auto_guard on public.reports;
create trigger reports_auto_guard after insert on public.reports for each row execute function public.auto_guard();

-- opheffen door de beheerder zet ook de automatische pauze terug
create or replace function public.auto_hold_clear() returns trigger language plpgsql as $$
begin if new.banned_at is null and old.banned_at is not null then new.auto_hold := false; end if; return new; end $$;
drop trigger if exists profiles_auto_hold_clear on public.profiles;
create trigger profiles_auto_hold_clear before update of banned_at on public.profiles for each row execute function public.auto_hold_clear();

/* ---------- 2. Herinneringen die vanzelf vertrekken ---------- */
-- Galaxy-avond: 1 à 2 uur voor de start een melding aan wie "Ik ga" zei
create or replace function public.auto_event_reminders() returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select g.user_id, e.id, e.venue, e.starts_at from events e join event_going g on g.event_id = e.id
            where e.starts_at between now() + interval '1 hour' and now() + interval '2 hours' loop
    perform public.queue_push(r.user_id, 'feed', 'Galaxy-avond', '🎉 Vanavond bij ' || r.venue || ', om ' || to_char(r.starts_at at time zone 'Europe/Brussels', 'HH24:MI') || '. Vergeet niet in te checken!', './?ev=' || r.id, 'ev-' || r.id, interval '1 day');
  end loop;
end $$;

-- wie 3 dagen niet meer keek en ongelezen berichten heeft, krijgt één vriendelijke herinnering (max. 1 per week)
create or replace function public.auto_unread_nudge() returns void language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  for u in select m.to_id from messages m
            where m.read_at is null and m.at < now() - interval '1 day' and m.at > now() - interval '30 days'
              and not exists (select 1 from presence p where p.user_id = m.to_id and p.seen > now() - interval '3 days')
            group by m.to_id limit 3000 loop
    perform public.queue_push(u, 'badge', 'Galaxy', '💬 Je hebt nog ongelezen berichten van een match', './?chat=1', 'unread', interval '7 days');
  end loop;
end $$;

/* ---------- 3. Dagelijks overzicht voor de beheerder ---------- */
create or replace function public.auto_admin_digest() returns void language plpgsql security definer set search_path = public as $$
declare msg text; a uuid; nu int; act int; rep int; rev int; ver int; hold int;
begin
  select count(*) into nu from profiles where created_at > now() - interval '24 hours';
  select count(*) into act from presence where seen > now() - interval '24 hours';
  select count(*) into rep from reports where not handled;
  select count(*) into hold from profiles where auto_hold;
  rev := coalesce((select count(*) from stories where status = 'review'), 0) + coalesce((select count(*) from answers where status = 'review'), 0) + coalesce((select count(*) from venue_posts where status = 'review'), 0);
  select count(*) into ver from verify_requests where status = 'pending';
  msg := '📊 Gisteren: ' || nu || ' nieuw, ' || act || ' actief. Open: ' || rep || ' meldingen, ' || rev || ' feed, ' || ver || ' selfies' || case when hold > 0 then ', ' || hold || ' gepauzeerd' else '' end || '.';
  for a in select user_id from admins loop
    perform public.queue_push(a, 'admin', 'Galaxy vandaag', msg, './beheer.html', 'digest', interval '20 hours');
  end loop;
end $$;

/* ---------- 4. Opruimen ---------- */
create or replace function public.auto_cleanup() returns void language plpgsql security definer set search_path = public as $$
begin
  delete from presence where seen < now() - interval '30 days';
  delete from push_queue where created_at < now() - interval '30 days';
  begin delete from safe_checks where created_at < now() - interval '3 days'; exception when others then null; end;
  begin delete from verify_requests where status <> 'pending' and reviewed_at < now() - interval '30 days'; exception when others then null; end;
end $$;

/* ---------- 5. Planning (Belgische tijd: UTC+1 in de winter) ---------- */
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname in ('galaxy-event-reminders', 'galaxy-unread-nudge', 'galaxy-admin-digest', 'galaxy-auto-cleanup');
    perform cron.schedule('galaxy-event-reminders', '*/15 * * * *', 'select public.auto_event_reminders()');
    perform cron.schedule('galaxy-unread-nudge', '7 17 * * *', 'select public.auto_unread_nudge()');      -- 18:07
    perform cron.schedule('galaxy-admin-digest', '53 7 * * *', 'select public.auto_admin_digest()');      -- 08:53
    perform cron.schedule('galaxy-auto-cleanup', '41 3 * * *', 'select public.auto_cleanup()');          -- 04:41
  end if;
end $$;

/* ---------- 6. Bijhouden welke updates al uitgevoerd zijn (voor de automatische uitrol via GitHub) ---------- */
create table if not exists public._galaxy_migrations (name text primary key, sha text not null, at timestamptz not null default now());
alter table public._galaxy_migrations enable row level security;

revoke all on function public.auto_event_reminders(), public.auto_unread_nudge(), public.auto_admin_digest(), public.auto_cleanup() from public, anon, authenticated;
