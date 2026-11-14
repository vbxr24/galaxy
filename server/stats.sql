-- Galaxy – statistieken voor het beheerscherm (alleen beheerders, alleen totalen, nooit berichtinhoud).
create or replace function public.admin_stats(days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare d int := greatest(7, least(coalesce(days, 30), 365)); since timestamptz := date_trunc('day', now()) - make_interval(days => d - 1);
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  return jsonb_build_object(
    'generated', now(), 'days', d,
    'totals', jsonb_build_object(
      'users', (select count(*) from profiles),
      'new_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
      'new_prev_7d', (select count(*) from profiles where created_at between now() - interval '14 days' and now() - interval '7 days'),
      'dau', (select count(*) from auth.users u join profiles p on p.id = u.id where u.last_sign_in_at > now() - interval '1 day' or exists (select 1 from presence x where x.user_id = u.id and x.seen > now() - interval '1 day')),
      'wau', (select count(*) from auth.users u join profiles p on p.id = u.id where u.last_sign_in_at > now() - interval '7 days' or exists (select 1 from presence x where x.user_id = u.id and x.seen > now() - interval '7 days')),
      'on_map_now', (select count(*) from presence where seen > now() - interval '15 minutes'),
      'saved_accounts', (select count(*) from auth.users u join profiles p on p.id = u.id where u.email is not null and not coalesce(u.is_anonymous, false)),
      'push_users', (select count(distinct user_id) from push_subs),
      'ghost', (select count(*) from profiles where ghost),
      'banned', (select count(*) from profiles where banned_at is not null),
      'age_verified', (select count(*) from profiles where age_verified),
      'messages', (select count(*) from messages),
      'messages_24h', (select count(*) from messages where at > now() - interval '24 hours'),
      'waves', (select count(*) from waves),
      'wavers', (select count(distinct from_id) from waves),
      'chatters', (select count(distinct u) from (select sender u from messages union select to_id from messages) m),
      'daters', (select count(distinct u) from (select from_id u from date_plans union select to_id from date_plans) d),
      'daters_ok', (select count(distinct u) from (select from_id u from date_plans where status = 'confirmed' union select to_id from date_plans where status = 'confirmed') d),
      'matched', (select count(distinct a.from_id) from waves a join waves b on a.from_id = b.to_id and a.to_id = b.from_id),
      'matches', (select count(*) from waves a join waves b on a.from_id = b.to_id and a.to_id = b.from_id and a.from_id < a.to_id),
      'chats', (select count(*) from (select distinct least(sender, to_id), greatest(sender, to_id) from messages) c),
      'dates', (select count(*) from date_plans),
      'dates_confirmed', (select count(*) from date_plans where status = 'confirmed'),
      'feedback', (select count(*) from date_feedback),
      'feedback_unsafe', (select count(*) from date_feedback where safe = false),
      'checkins', (select count(*) from checkins),
      'group_dates', (select count(*) from group_dates),
      'blocks', (select count(*) from blocks),
      'reports', (select count(*) from reports),
      'open_reports', (select count(*) from reports where not handled)),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', g::date,
        'signups', (select count(*) from profiles where created_at >= g and created_at < g + interval '1 day'),
        'messages', (select count(*) from messages where at >= g and at < g + interval '1 day'),
        'waves', (select count(*) from waves where at >= g and at < g + interval '1 day'),
        'checkins', (select count(*) from checkins where at >= g and at < g + interval '1 day'),
        'reports', (select count(*) from reports where at >= g and at < g + interval '1 day')) order by g), '[]')
      from generate_series(since, date_trunc('day', now()), interval '1 day') g),
    'hours', (select coalesce(jsonb_agg(jsonb_build_object('h', h, 'n', (select count(*) from messages where at > now() - interval '30 days' and extract(hour from at at time zone 'Europe/Brussels') = h)) order by h), '[]') from generate_series(0, 23) h),
    'gender', (select coalesce(jsonb_object_agg(k, n), '{}') from (select coalesce(nullif(gender, ''), 'Niet ingevuld') k, count(*) n from profiles group by 1) x),
    'goal', (select coalesce(jsonb_object_agg(k, n), '{}') from (select coalesce(cat, 'niet gekozen') k, count(*) n from profiles group by 1) x),
    'ages', (select coalesce(jsonb_object_agg(k, n), '{}') from (select case when a < 25 then '18-24' when a < 30 then '25-29' when a < 35 then '30-34' when a < 45 then '35-44' when a < 55 then '45-54' else '55+' end k, count(*) n
               from (select extract(year from age(birth))::int a from profiles) y group by 1) x),
    'cities', (select coalesce(jsonb_agg(jsonb_build_object('city', k, 'n', n) order by n desc), '[]') from (select initcap(trim(city)) k, count(*) n from profiles where coalesce(trim(city), '') <> '' group by 1 order by 2 desc limit 8) x),
    'plans', (select coalesce(jsonb_object_agg(plan, n), '{}') from (select plan, count(*) n from profiles group by 1) x),
    'reasons', (select coalesce(jsonb_object_agg(reason, n), '{}') from (select reason, count(*) n from reports group by 1) x),
    'places', (select coalesce(jsonb_agg(jsonb_build_object('place', place_name, 'n', n) order by n desc), '[]') from (select place_name, count(*) n from checkins where at > now() - interval '30 days' group by 1 order by 2 desc limit 6) x),
    'retention_d7', (select case when count(*) = 0 then null else round(100.0 * count(*) filter (where u.last_sign_in_at > p.created_at + interval '7 days' or exists (select 1 from presence x where x.user_id = p.id and x.seen > p.created_at + interval '7 days')) / count(*)) end
                     from profiles p join auth.users u on u.id = p.id where p.created_at < now() - interval '7 days')
  );
end $$;
revoke all on function public.admin_stats(int) from public, anon;
grant execute on function public.admin_stats(int) to authenticated;
