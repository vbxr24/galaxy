-- Galaxy – hulp-assistent: supporttickets en een eerlijke limiet per bezoeker
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  uid uuid,
  email text check (email is null or (length(email) <= 120 and email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$')),
  lang text check (lang is null or lang ~ '^[a-z]{2}$'),
  topic text not null default 'andere' check (topic in ('account', 'veiligheid', 'betalen', 'bug', 'privacy', 'cafe', 'andere')),
  summary text not null check (length(summary) between 3 and 1200),
  status text not null default 'open' check (status in ('open', 'bezig', 'klaar'))
);
alter table public.support_tickets enable row level security;  -- alleen via functies
create index if not exists support_tickets_created on public.support_tickets (created_at desc);

create table if not exists public.help_usage (key text not null, at timestamptz not null default now());
alter table public.help_usage enable row level security;
create index if not exists help_usage_key_at on public.help_usage (key, at desc);

-- wordt aangeroepen door de edge function (service role) of door een ingelogde gebruiker
create or replace function public.support_ticket(p_email text, p_topic text, p_summary text, p_lang text default null) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare nid uuid; me uuid := auth.uid(); e text := nullif(lower(trim(p_email)), '');
begin
  if coalesce(length(trim(p_summary)), 0) < 3 then raise exception 'Beschrijf kort het probleem'; end if;
  if e is not null and e !~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' then e := null; end if;
  if (select count(*) from public.support_tickets where created_at > now() - interval '1 hour' and ((me is not null and uid = me) or (e is not null and email = e))) >= 5 then raise exception 'Je hebt al een paar vragen gestuurd. We antwoorden zo snel mogelijk.'; end if;
  if (select count(*) from public.support_tickets where created_at > now() - interval '1 hour') >= 200 then raise exception 'Even te druk, probeer het later opnieuw'; end if;
  insert into public.support_tickets (uid, email, lang, topic, summary)
  values (me, e, case when p_lang ~ '^[a-z]{2}$' then p_lang end, case when p_topic in ('account', 'veiligheid', 'betalen', 'bug', 'privacy', 'cafe', 'andere') then p_topic else 'andere' end, left(trim(p_summary), 1200))
  returning id into nid;
  begin perform public.admin_ping('🆘 Nieuwe hulpvraag (' || coalesce(p_topic, 'andere') || '). Tik om te bekijken.'); exception when others then null; end;
  return nid;
end $$;

-- limiet voor de assistent: true = mag nog (max n berichten per uur per sleutel)
create or replace function public.help_allow(p_key text, n int default 30) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.help_usage where key = p_key and at > now() - interval '1 hour') >= n then return false; end if;
  if (select count(*) from public.help_usage where at > now() - interval '1 hour') >= 3000 then return false; end if;
  insert into public.help_usage (key) values (p_key);
  if random() < 0.01 then delete from public.help_usage where at < now() - interval '1 day'; end if;
  return true;
end $$;

create or replace function public.admin_support_tickets() returns setof public.support_tickets
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  return query select * from public.support_tickets order by (status = 'open') desc, created_at desc limit 300;
end $$;

create or replace function public.admin_support_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  update public.support_tickets set status = p_status where id = p_id;
end $$;

revoke all on function public.support_ticket(text, text, text, text), public.help_allow(text, int), public.admin_support_tickets(), public.admin_support_status(uuid, text) from public, anon, authenticated;
grant execute on function public.support_ticket(text, text, text, text) to authenticated, service_role;
grant execute on function public.help_allow(text, int) to service_role;
grant execute on function public.admin_support_tickets(), public.admin_support_status(uuid, text) to authenticated;
