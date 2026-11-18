-- Galaxy – cafés, bars en clubs kunnen zich aanmelden
-- Iedereen (ook zonder account) kan een aanvraag sturen via venue_apply(); alleen beheerders zien ze.

create table if not exists public.venue_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (length(name) between 2 and 80),
  kind text not null default 'cafe' check (kind in ('cafe', 'bar', 'club', 'restaurant', 'andere')),
  city text check (city is null or length(city) <= 60),
  address text check (address is null or length(address) <= 140),
  contact_name text check (contact_name is null or length(contact_name) <= 60),
  email text not null check (length(email) between 6 and 120 and email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  phone text check (phone is null or length(phone) <= 30),
  message text check (message is null or length(message) <= 600),
  status text not null default 'nieuw' check (status in ('nieuw', 'gecontacteerd', 'actief', 'afgewezen')),
  note text check (note is null or length(note) <= 600)
);
alter table public.venue_requests enable row level security;   -- geen policies: alleen via de functies hieronder
create index if not exists venue_requests_created on public.venue_requests (created_at desc);
create index if not exists venue_requests_email on public.venue_requests (lower(email), created_at desc);

create or replace function public.venue_apply(p_name text, p_kind text, p_city text, p_address text, p_contact text, p_email text, p_phone text, p_message text)
returns uuid language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare nid uuid; e text := lower(trim(p_email));
begin
  if coalesce(length(trim(p_name)), 0) < 2 then raise exception 'Vul de naam van je zaak in'; end if;
  if e is null or e !~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' then raise exception 'Vul een geldig e-mailadres in'; end if;
  -- tegen spam: max 3 aanvragen per e-mailadres per dag, max 60 in totaal per uur
  if (select count(*) from public.venue_requests where lower(email) = e and created_at > now() - interval '1 day') >= 3 then raise exception 'Je aanvraag is al binnen. We nemen snel contact op.'; end if;
  if (select count(*) from public.venue_requests where created_at > now() - interval '1 hour') >= 60 then raise exception 'Even te druk, probeer het later opnieuw'; end if;
  insert into public.venue_requests (name, kind, city, address, contact_name, email, phone, message)
  values (left(trim(p_name), 80), case when p_kind in ('cafe', 'bar', 'club', 'restaurant', 'andere') then p_kind else 'andere' end,
          nullif(left(trim(p_city), 60), ''), nullif(left(trim(p_address), 140), ''), nullif(left(trim(p_contact), 60), ''), e,
          nullif(left(trim(p_phone), 30), ''), nullif(left(trim(p_message), 600), ''))
  returning id into nid;
  begin perform public.admin_ping('🍻 Nieuwe aanmelding van ' || left(trim(p_name), 60) || '. Tik om te bekijken.'); exception when others then null; end;
  return nid;
end $$;

create or replace function public.admin_venue_requests() returns setof public.venue_requests
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  return query select * from public.venue_requests order by (status = 'nieuw') desc, created_at desc limit 300;
end $$;

create or replace function public.admin_venue_status(p_id uuid, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  update public.venue_requests set status = p_status, note = coalesce(p_note, note) where id = p_id;
end $$;

revoke all on function public.venue_apply(text, text, text, text, text, text, text, text), public.admin_venue_requests(), public.admin_venue_status(uuid, text, text) from public;
grant execute on function public.venue_apply(text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_venue_requests(), public.admin_venue_status(uuid, text, text) to authenticated;
