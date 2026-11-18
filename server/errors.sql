-- Galaxy – foutmeldingen uit de app opvangen, zodat je na de lancering ziet wat er misgaat
create table if not exists public.client_errors (
  id bigserial primary key,
  at timestamptz not null default now(),
  uid uuid,
  msg text not null check (length(msg) <= 400),
  src text check (src is null or length(src) <= 160),
  ver text check (ver is null or length(ver) <= 40),
  ua text check (ua is null or length(ua) <= 200)
);
alter table public.client_errors enable row level security;  -- alleen via functies
create index if not exists client_errors_at on public.client_errors (at desc);

create or replace function public.log_client_error(p_msg text, p_src text default null, p_ver text default null, p_ua text default null) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if coalesce(trim(p_msg), '') = '' then return; end if;
  -- tegen overspoelen: max 30 per gebruiker per uur, max 2000 in totaal per uur
  if me is not null and (select count(*) from public.client_errors where uid = me and at > now() - interval '1 hour') >= 30 then return; end if;
  if (select count(*) from public.client_errors where at > now() - interval '1 hour') >= 2000 then return; end if;
  insert into public.client_errors (uid, msg, src, ver, ua) values (me, left(p_msg, 400), left(p_src, 160), left(p_ver, 40), left(p_ua, 200));
  if random() < 0.02 then delete from public.client_errors where at < now() - interval '14 days'; end if;
end $$;

create or replace function public.admin_client_errors(days int default 7) returns table (msg text, src text, n bigint, users bigint, last_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  return query select e.msg, max(e.src), count(*), count(distinct e.uid), max(e.at)
    from public.client_errors e where e.at > now() - make_interval(days => greatest(1, least(days, 30)))
    group by e.msg order by count(*) desc limit 100;
end $$;

revoke all on function public.log_client_error(text, text, text, text), public.admin_client_errors(int) from public;
grant execute on function public.log_client_error(text, text, text, text) to anon, authenticated;
grant execute on function public.admin_client_errors(int) to authenticated;
