-- Galaxy: moderatie.
-- Beheerders bekijken meldingen, sluiten ze af en kunnen een account schorsen.
-- Een geschorst account is voor iedereen als "geblokkeerd": onzichtbaar op de kaart en in de tellers,
-- geen profielkaart, geen berichten, zwaaien of dates. De geschorste gebruiker ziet in de app waarom
-- en hoe hij bezwaar maakt (zoals de Europese Digital Services Act vraagt).
-- Plak dit in de Supabase SQL Editor na de andere bestanden. Veilig om opnieuw uit te voeren.

alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists ban_reason text check (char_length(ban_reason) <= 300);
alter table public.reports  add column if not exists handled_at timestamptz;
alter table public.reports  add column if not exists handled_by uuid references public.profiles(id) on delete set null;
alter table public.reports  add column if not exists outcome text check (outcome in ('geen actie','gewaarschuwd','geschorst'));

-- geblokkeerd = elkaar geblokkeerd, OF een van beiden is geschorst
create or replace function public.is_blocked(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a))
      or exists (select 1 from profiles where id in (a, b) and banned_at is not null);
$$;

-- een geschorst account komt niet meer op de kaart of in de live tellers
create or replace function public.presence_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from profiles where id = new.user_id and banned_at is not null) then return null; end if;
  return new;
end $$;
drop trigger if exists presence_guard on public.presence;
create trigger presence_guard before insert or update on public.presence for each row execute function public.presence_guard();

-- beheerders
create table if not exists public.admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- meldingen, per gemelde persoon gegroepeerd (open eerst)
create or replace function public.mod_reports(only_open boolean default true)
returns table (id bigint, at timestamptz, reason text, detail text, handled boolean, outcome text,
               reporter uuid, reporter_name text, target uuid, target_name text, target_bio text,
               target_banned boolean, target_reports int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  return query
    select r.id, r.at, r.reason, r.detail, r.handled, r.outcome, r.reporter, rp.name, r.target, tp.name, tp.bio,
           tp.banned_at is not null, (select count(*)::int from reports x where x.target = r.target)
      from reports r join profiles rp on rp.id = r.reporter join profiles tp on tp.id = r.target
     where (not only_open or not r.handled)
     order by r.handled, (select count(*) from reports x where x.target = r.target and not x.handled) desc, r.at desc
     limit 300;
end $$;

create or replace function public.mod_resolve(rid bigint, result text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  if result not in ('geen actie','gewaarschuwd','geschorst') then raise exception 'ongeldige uitkomst'; end if;
  update reports set handled = true, handled_at = now(), handled_by = auth.uid(), outcome = result where id = rid;
end $$;

create or replace function public.mod_ban(who uuid, reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  if who = auth.uid() then raise exception 'jezelf schorsen kan niet'; end if;
  if coalesce(trim(reason), '') = '' then raise exception 'geef een reden'; end if;
  update profiles set banned_at = now(), ban_reason = left(trim(reason), 300), ghost = true where id = who;
  delete from presence where user_id = who;
  update reports set handled = true, handled_at = now(), handled_by = auth.uid(), outcome = 'geschorst' where reports.target = who and not handled;
end $$;

create or replace function public.mod_unban(who uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  update profiles set banned_at = null, ban_reason = null where id = who;
end $$;

-- tellers voor het beheerscherm
create or replace function public.mod_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  return jsonb_build_object(
    'users', (select count(*) from profiles),
    'active_24h', (select count(*) from presence where seen > now() - interval '24 hours'),
    'open_reports', (select count(*) from reports where not handled),
    'banned', (select count(*) from profiles where banned_at is not null),
    'messages_24h', (select count(*) from messages where at > now() - interval '24 hours'));
end $$;

revoke all on function public.is_admin(), public.mod_reports(boolean), public.mod_resolve(bigint, text), public.mod_ban(uuid, text),
  public.mod_unban(uuid), public.mod_stats(), public.presence_guard() from public, anon;
grant execute on function public.is_admin(), public.mod_reports(boolean), public.mod_resolve(bigint, text), public.mod_ban(uuid, text),
  public.mod_unban(uuid), public.mod_stats() to authenticated;

-- Een beheerder toevoegen (één keer, door de eigenaar, hier in de SQL Editor):
--   insert into public.admins (user_id) select id from auth.users where email = 'JOUW@EMAIL';
