-- Galaxy: evenementen en festivals, met tickets en QR-check-in.
-- * Iedereen (18+) kan een evenement organiseren; anderen halen er een ticket voor in de app.
-- * Gratis: ticket is meteen geldig. Betalend: de koper betaalt via de betaallink van de organisator
--   (bv. Mollie, Stripe, PayPal, Payconiq) met zijn ticketcode als mededeling; de organisator bevestigt
--   de betaling in de app en dan wordt het ticket geldig. (Automatisch bevestigen kan later met een webhook.)
-- * De QR-code op het ticket verandert elke 30 seconden (HMAC met een geheim dat alleen de ticket-
--   houder kent). Een screenshot doorsturen werkt dus niet; elk ticket kan maar één keer binnen.
-- * Alleen de organisator kan scannen en ziet de lijst met bezoekers.
-- Plak dit in de Supabase SQL Editor NA schema.sql. Veilig om opnieuw uit te voeren.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 3 and 100),
  descr       text check (char_length(descr) <= 2000),
  place       text not null check (char_length(place) between 2 and 200),
  lat         double precision check (lat between -90 and 90),
  lng         double precision check (lng between -180 and 180),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  capacity    int not null check (capacity between 1 and 100000),
  price_cents int not null default 0 check (price_cents between 0 and 100000),
  pay_url     text check (pay_url ~ '^https://[^\s<>"]+$' and char_length(pay_url) <= 300),
  lineup      jsonb not null default '[]'::jsonb check (jsonb_typeof(lineup) = 'array' and pg_column_size(lineup) < 12000),
  news        text check (char_length(news) <= 300),
  news_at     timestamptz,
  status      text not null default 'published' check (status in ('published','cancelled')),
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at and ends_at <= starts_at + interval '14 days'),
  check (price_cents = 0 or pay_url is not null)
);
create index if not exists events_when on public.events (starts_at);

create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  status        text not null check (status in ('reserved','valid','used','cancelled')),
  secret        text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  created_at    timestamptz not null default now(),
  checked_in_at timestamptz,
  unique (event_id, user_id)
);
create index if not exists tickets_event on public.tickets (event_id, status);

alter table public.events  enable row level security;
alter table public.tickets enable row level security;
revoke all on public.events, public.tickets from anon, authenticated;

-- evenementen lezen: gepubliceerd, of je eigen
grant select on public.events to authenticated;
drop policy if exists events_read on public.events;
create policy events_read on public.events for select to authenticated
  using ((status = 'published' and not public.is_blocked(owner, auth.uid())) or owner = auth.uid());

-- aanmaken: in de toekomst, max. 5 per dag
grant insert (owner, title, descr, place, lat, lng, starts_at, ends_at, capacity, price_cents, pay_url, lineup) on public.events to authenticated;
drop policy if exists events_new on public.events;
create policy events_new on public.events for insert to authenticated with check (
  owner = auth.uid() and starts_at > now() and starts_at < now() + interval '400 days'
  and (select count(*) from public.events e where e.owner = auth.uid() and e.created_at > now() - interval '1 day') < 5);

-- aanpassen: alleen de organisator
grant update (title, descr, place, lat, lng, starts_at, ends_at, capacity, price_cents, pay_url, lineup, news, news_at, status) on public.events to authenticated;
drop policy if exists events_edit on public.events;
create policy events_edit on public.events for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

-- je eigen tickets lezen (met het geheim voor de QR-code)
grant select on public.tickets to authenticated;
drop policy if exists tickets_mine on public.tickets;
create policy tickets_mine on public.tickets for select to authenticated using (user_id = auth.uid());

-- korte code die mensen kunnen voorlezen of als betaalmededeling gebruiken
create or replace function public.ticket_code(t uuid) returns text language sql immutable as $$
  select upper(substr(replace(t::text, '-', ''), 1, 8)) $$;

-- ticket halen (of opnieuw activeren na annuleren)
create or replace function public.ticket_get(ev uuid)
returns public.tickets language plpgsql security definer set search_path = public as $$
declare e events; t tickets; used int; had boolean;
begin
  select * into e from events where id = ev for update;
  if not found or e.status <> 'published' or e.ends_at < now() then raise exception 'evenement niet beschikbaar'; end if;
  if public.is_blocked(e.owner, auth.uid()) then raise exception 'evenement niet beschikbaar'; end if;
  select * into t from tickets where event_id = ev and user_id = auth.uid();
  had := found;
  if had and t.status <> 'cancelled' then return t; end if;
  select count(*) into used from tickets where event_id = ev and status in ('reserved','valid','used');
  if used >= e.capacity then raise exception 'uitverkocht'; end if;
  if had then
    update tickets set status = case when e.price_cents = 0 then 'valid' else 'reserved' end, created_at = now(),
           secret = encode(extensions.gen_random_bytes(16), 'hex')
     where id = t.id returning * into t;
  else
    insert into tickets (event_id, user_id, status) values (ev, auth.uid(), case when e.price_cents = 0 then 'valid' else 'reserved' end)
    returning * into t;
  end if;
  return t;
end $$;

-- annuleren: de houder (vóór de start) of de organisator (zolang niet binnen)
create or replace function public.ticket_cancel(t uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update tickets k set status = 'cancelled' from events e
   where k.id = t and e.id = k.event_id and k.status in ('reserved','valid')
     and ((k.user_id = auth.uid() and e.starts_at > now()) or e.owner = auth.uid());
  if not found then raise exception 'kan niet geannuleerd worden'; end if;
end $$;

-- organisator: betaling ontvangen → ticket geldig
create or replace function public.ticket_confirm_paid(t uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update tickets k set status = 'valid' from events e
   where k.id = t and e.id = k.event_id and e.owner = auth.uid() and k.status = 'reserved';
  if not found then raise exception 'niet gevonden'; end if;
end $$;

-- organisator: QR scannen aan de ingang. Code = GLX1:<ticket>:<tijdvak>:<handtekening>
create or replace function public.ticket_scan(code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare parts text[]; tid uuid; slot bigint; now_slot bigint; k tickets; e events; who text; ok boolean := false;
begin
  parts := string_to_array(coalesce(code, ''), ':');
  if array_length(parts, 1) <> 4 or parts[1] <> 'GLX1' or parts[2] !~ '^[0-9a-f-]{36}$' or parts[3] !~ '^[0-9]{1,12}$' then
    return jsonb_build_object('result', 'invalid'); end if;
  tid := parts[2]::uuid; slot := parts[3]::bigint; now_slot := floor(extract(epoch from now()) / 30);
  select * into k from tickets where id = tid for update;
  if not found then return jsonb_build_object('result', 'invalid'); end if;
  select * into e from events where id = k.event_id;
  if e.owner <> auth.uid() then return jsonb_build_object('result', 'not_yours'); end if;
  if abs(slot - now_slot) > 2 then return jsonb_build_object('result', 'expired'); end if;
  ok := substr(encode(extensions.hmac(tid::text || ':' || slot::text, k.secret, 'sha256'), 'hex'), 1, 16) = parts[4];
  if not ok then return jsonb_build_object('result', 'invalid'); end if;
  select name into who from profiles where id = k.user_id;
  if k.status = 'used' then return jsonb_build_object('result', 'already', 'name', who, 'at', k.checked_in_at, 'code', ticket_code(k.id)); end if;
  if k.status = 'reserved' then return jsonb_build_object('result', 'unpaid', 'name', who, 'code', ticket_code(k.id), 'ticket', k.id); end if;
  if k.status = 'cancelled' then return jsonb_build_object('result', 'cancelled', 'name', who); end if;
  update tickets set status = 'used', checked_in_at = now() where id = k.id;
  return jsonb_build_object('result', 'ok', 'name', who, 'code', ticket_code(k.id), 'event', e.title);
end $$;

-- organisator: iemand manueel binnenlaten (bv. als de gsm van de bezoeker leeg is)
create or replace function public.ticket_checkin(t uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update tickets k set status = 'used', checked_in_at = now() from events e
   where k.id = t and e.id = k.event_id and e.owner = auth.uid() and k.status = 'valid';
  if not found then raise exception 'niet mogelijk'; end if;
end $$;

-- organisator: bezoekerslijst (zonder geheimen)
create or replace function public.event_attendees(ev uuid)
returns table (ticket uuid, code text, name text, status text, created_at timestamptz, checked_in_at timestamptz)
language sql stable security definer set search_path = public as $$
  select k.id, ticket_code(k.id), p.name, k.status, k.created_at, k.checked_in_at
    from tickets k join events e on e.id = k.event_id join profiles p on p.id = k.user_id
   where k.event_id = ev and e.owner = auth.uid()
   order by k.created_at;
$$;

-- tellers: iedereen ziet hoeveel plaatsen er nog zijn; de organisator ziet alles
create or replace function public.event_counts(ev uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when e.owner = auth.uid() then jsonb_build_object(
           'capacity', e.capacity,
           'valid', count(*) filter (where k.status = 'valid'),
           'reserved', count(*) filter (where k.status = 'reserved'),
           'used', count(*) filter (where k.status = 'used'),
           'left', greatest(e.capacity - count(*) filter (where k.status in ('reserved','valid','used')), 0))
         else jsonb_build_object('left', greatest(e.capacity - count(*) filter (where k.status in ('reserved','valid','used')), 0)) end
    from events e left join tickets k on k.event_id = e.id
   where e.id = ev and (e.status = 'published' or e.owner = auth.uid())
   group by e.id, e.owner, e.capacity;
$$;

revoke all on function public.ticket_get(uuid), public.ticket_cancel(uuid), public.ticket_confirm_paid(uuid), public.ticket_scan(text),
  public.ticket_checkin(uuid), public.event_attendees(uuid), public.event_counts(uuid) from public, anon;
grant execute on function public.ticket_get(uuid), public.ticket_cancel(uuid), public.ticket_confirm_paid(uuid), public.ticket_scan(text),
  public.ticket_checkin(uuid), public.event_attendees(uuid), public.event_counts(uuid), public.ticket_code(uuid) to authenticated;
