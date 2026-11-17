-- Galaxy – café-dashboard (zonder inloggen, met een geheime link per café) en een echte foto die alleen matches zien.
-- Voer uit na extras.sql. Veilig om opnieuw uit te voeren.

/* ---------------- café-dashboard ---------------- */
alter table public.events add column if not exists owner_token uuid not null default gen_random_uuid();
create unique index if not exists events_owner_token on public.events (owner_token);

-- alleen totalen per avond van dit café (zelfde naam), nooit wie
create or replace function public.venue_stats(token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with v as (select venue from events where owner_token = token limit 1),
  ev as (select e.* from events e, v where lower(e.venue) = lower(v.venue)),
  ci as (select c.place_id, c.at from checkins c join ev on c.place_id = 'ev:' || ev.id)
  select case when (select venue from v) is null then null else jsonb_build_object(
    'venue', (select venue from v),
    'events', (select coalesce(jsonb_agg(jsonb_build_object(
        'starts_at', ev.starts_at, 'ends_at', ev.ends_at, 'offer', ev.offer,
        'going', (select count(*) from event_going g where g.event_id = ev.id),
        'checkins', (select count(*) from ci where ci.place_id = 'ev:' || ev.id)) order by ev.starts_at desc), '[]') from ev),
    'hours', (select coalesce(jsonb_agg(jsonb_build_object('h', h, 'n', n) order by h), '[]') from
               (select extract(hour from at at time zone 'Europe/Brussels')::int h, count(*) n from ci group by 1) x),
    'total_checkins', (select count(*) from ci),
    'total_going', (select count(*) from event_going g join ev on g.event_id = ev.id)
  ) end;
$$;
revoke all on function public.venue_stats(uuid) from public;
grant execute on function public.venue_stats(uuid) to anon, authenticated;

-- beheer: de geheime link van een avond (voor het café)
create or replace function public.admin_event_token(ev uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select owner_token from events where id = ev and public.is_admin();
$$;
revoke all on function public.admin_event_token(uuid) from public, anon;
grant execute on function public.admin_event_token(uuid) to authenticated;

/* ---------------- echte foto, alleen voor matches ---------------- */
alter table public.profiles add column if not exists photo_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 800000, array['image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 800000, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists photos_read on storage.objects;
create policy photos_read on storage.objects for select to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text
         or public.is_match(auth.uid(), ((storage.foldername(name))[1])::uuid)));
drop policy if exists photos_write on storage.objects;
create policy photos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists photos_update on storage.objects;
create policy photos_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.set_photo(has boolean) returns void
language sql security definer set search_path = public as $$
  update profiles set photo_at = case when has then now() else null end where id = auth.uid();
$$;
revoke all on function public.set_photo(boolean) from public, anon;
grant execute on function public.set_photo(boolean) to authenticated;

-- profielkaart: 'photo' alleen voor jezelf en je matches; 'hasPhoto' laat anderen weten dat er een foto is
create or replace function public.profile_card(target uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select case when p.id is null or public.is_blocked(auth.uid(), p.id) then null else jsonb_build_object(
    'id', p.id, 'name', p.name, 'age', extract(year from age(current_date, p.birth))::int, 'city', p.city, 'bio', p.bio, 'cat', p.cat,
    'gender', p.gender, 'pron', p.pron, 'orient', case when p.show_orient then p.orient end,
    'ints', p.ints, 'basics', p.basics, 'music', p.music, 'ptheme', p.ptheme, 'avatar', p.avatar,
    'respect', p.respect, 'ageVerified', p.age_verified, 'plan', p.plan,
    'matched', public.is_match(auth.uid(), p.id),
    'socialVis', p.social_vis,
    'ig',   case when p.id = auth.uid() or p.social_vis = 'iedereen' or (p.social_vis = 'matches' and public.is_match(auth.uid(), p.id)) then p.ig end,
    'snap', case when p.id = auth.uid() or p.social_vis = 'iedereen' or (p.social_vis = 'matches' and public.is_match(auth.uid(), p.id)) then p.snap end,
    'hasSocials', (coalesce(p.ig,'') <> '' or coalesce(p.snap,'') <> ''),
    'voice', case when p.voice_at is not null then p.id::text || '/intro?v=' || extract(epoch from p.voice_at)::bigint end,
    'out', case when p.out_until > now() then jsonb_build_object('until', p.out_until, 'note', p.out_note) end,
    'hasPhoto', p.photo_at is not null,
    'photo', case when p.photo_at is not null and (p.id = auth.uid() or public.is_match(auth.uid(), p.id)) then p.id::text || '/photo?v=' || extract(epoch from p.photo_at)::bigint end
  ) end
  from (select 1) x left join profiles p on p.id = target;
$$;
