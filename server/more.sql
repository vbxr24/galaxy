-- Galaxy – meldingen voor de feed en voor de beheerder, betere chat (gelezen, foto, spraak),
-- echtheidscheck met selfie, reeksen en badges.
-- Voer uit na extras.sql, extras2.sql en feed.sql. Veilig om opnieuw uit te voeren.

/* =========================================================
   1. Algemene meldingen-wachtrij
   De database zet een melding in de wachtrij; de Edge Function "push" verstuurt ze één keer.
   ========================================================= */
alter table public.push_subs add column if not exists feed boolean not null default true;

create table if not exists public.push_queue (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('feed', 'admin', 'badge')),
  title      text not null check (char_length(title) <= 60),
  body       text not null check (char_length(body) <= 180),
  url        text not null default './' check (char_length(url) <= 120),
  tag        text not null check (char_length(tag) <= 80),
  created_at timestamptz not null default now(),
  pushed_at  timestamptz
);
create index if not exists push_queue_tag on public.push_queue (user_id, tag, created_at desc);
alter table public.push_queue enable row level security;   -- niemand leest of schrijft dit rechtstreeks

-- in de wachtrij zetten, maar niet vaker dan 'cool' per gebruiker en tag
create or replace function public.queue_push(u uuid, k text, ttl text, bd text, link text, tg text, cool interval)
returns void language plpgsql security definer set search_path = public as $$
begin
  if u is null then return; end if;
  if exists (select 1 from profiles where id = u and banned_at is not null) then return; end if;
  if not exists (select 1 from push_subs where user_id = u) then return; end if;
  if exists (select 1 from push_queue where user_id = u and tag = tg and created_at > now() - cool) then return; end if;
  insert into push_queue (user_id, kind, title, body, url, tag) values (u, k, left(ttl, 60), left(bd, 180), left(link, 120), left(tg, 80));
end $$;

create or replace function public.push_queue_send() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://dqodwuemdpzyvvvxvgtz.supabase.co/functions/v1/push',
    body := jsonb_build_object('q', new.id),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 4000);
  return new;
exception when others then return new;
end $$;
drop trigger if exists push_queue_send on public.push_queue;
create trigger push_queue_send after insert on public.push_queue for each row execute function public.push_queue_send();

-- wie zijn de matches van iemand?
create or replace function public.matches_of(u uuid) returns setof uuid language sql stable security definer set search_path = public as $$
  select w1.to_id from waves w1 join waves w2 on w2.from_id = w1.to_id and w2.to_id = w1.from_id
  where w1.from_id = u and not public.is_blocked(u, w1.to_id);
$$;

-- per toestel: meldingen over de feed aan of uit
create or replace function public.set_feed_push(ep text, onoff boolean) returns void language sql security definer set search_path = public as $$
  update push_subs set feed = onoff where endpoint = ep and user_id = auth.uid();
$$;

/* =========================================================
   2. Meldingen over de feed
   ========================================================= */
create or replace function public.feed_push_answer() returns trigger language plpgsql security definer set search_path = public as $$
declare n text; m uuid;
begin
  if tg_op = 'UPDATE' and old.body = new.body then return new; end if;
  select name into n from profiles where id = new.user_id;
  for m in select public.matches_of(new.user_id) loop
    perform public.queue_push(m, 'feed', 'Galaxy', '💬 ' || n || ' beantwoordde de vraag van de avond', './?feed=1', 'q-' || new.user_id, interval '12 hours');
  end loop;
  return new;
end $$;
drop trigger if exists answers_push on public.answers;
create trigger answers_push after insert on public.answers for each row execute function public.feed_push_answer();

create or replace function public.feed_push_story() returns trigger language plpgsql security definer set search_path = public as $$
declare n text; m uuid;
begin
  if new.status <> 'ok' then return new; end if;
  select name into n from profiles where id = new.user_id;
  for m in select public.matches_of(new.user_id) loop
    perform public.queue_push(m, 'feed', 'Galaxy', '📸 ' || n || ' plaatste een nieuw verhaal', './?feed=1', 'st-' || new.user_id, interval '6 hours');
  end loop;
  return new;
end $$;
drop trigger if exists stories_push on public.stories;
create trigger stories_push after insert on public.stories for each row execute function public.feed_push_story();

-- café-actie: naar wie de laatste 14 dagen in de buurt was
create or replace function public.feed_push_venue() returns trigger language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  for u in select pr.user_id from presence pr where pr.seen > now() - interval '14 days'
             and abs(pr.zlat - new.lat) <= 0.23 and abs(pr.zlng - new.lng) <= 0.35 limit 2000 loop
    perform public.queue_push(u, 'feed', new.venue, '📣 ' || new.body, './?feed=1', 'venue', interval '12 hours');
  end loop;
  return new;
end $$;
drop trigger if exists venue_posts_push on public.venue_posts;
create trigger venue_posts_push after insert on public.venue_posts for each row execute function public.feed_push_venue();

-- elke avond: de vraag van de avond, voor wie de laatste week actief was en nog niet antwoordde
create or replace function public.feed_daily_push() returns void language plpgsql security definer set search_path = public as $$
declare q text; u uuid;
begin
  select nl into q from questions where id = public.question_id(public.feed_day());
  if q is null then return; end if;
  for u in select pr.user_id from presence pr where pr.seen > now() - interval '7 days'
             and not exists (select 1 from answers a where a.user_id = pr.user_id and a.qday = public.feed_day()) limit 5000 loop
    perform public.queue_push(u, 'feed', 'Vraag van de avond', q, './?feed=1', 'qday', interval '20 hours');
  end loop;
end $$;
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'galaxy-question-push';
    perform cron.schedule('galaxy-question-push', '30 17 * * *', 'select public.feed_daily_push()');   -- 18:30 Belgische wintertijd
  end if;
end $$;

/* =========================================================
   3. Meldingen voor de beheerder
   ========================================================= */
create or replace function public.admin_ping(what text) returns void language plpgsql security definer set search_path = public as $$
declare a uuid;
begin
  for a in select user_id from admins loop
    perform public.queue_push(a, 'admin', 'Galaxy beheer', what, './beheer.html', 'admin', interval '10 minutes');
  end loop;
end $$;

create or replace function public.admin_ping_report() returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.admin_ping('🛡️ Nieuwe melding over een gebruiker. Tik om te bekijken.'); return new; end $$;
drop trigger if exists reports_admin_ping on public.reports;
create trigger reports_admin_ping after insert on public.reports for each row execute function public.admin_ping_report();

create or replace function public.admin_ping_review() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'review' and (tg_op = 'INSERT' or old.status is distinct from 'review') then
    perform public.admin_ping('📰 Iets in de feed wacht op jouw controle.');
  end if;
  return new;
end $$;
drop trigger if exists stories_admin_ping on public.stories;
create trigger stories_admin_ping after insert or update of status on public.stories for each row execute function public.admin_ping_review();
drop trigger if exists answers_admin_ping on public.answers;
create trigger answers_admin_ping after insert or update of status on public.answers for each row execute function public.admin_ping_review();
drop trigger if exists venue_admin_ping on public.venue_posts;
create trigger venue_admin_ping after insert or update of status on public.venue_posts for each row execute function public.admin_ping_review();

/* =========================================================
   4. Chat: gelezen, foto's en spraakberichten (alleen tussen matches)
   ========================================================= */
alter table public.messages add column if not exists kind text not null default 'text';
alter table public.messages add column if not exists media text;
alter table public.messages add column if not exists read_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'messages_kind_ok') then
    alter table public.messages add constraint messages_kind_ok check (kind in ('text', 'photo', 'voice') and (kind = 'text') = (media is null) and char_length(coalesce(media, '')) <= 200);
  end if;
end $$;

drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated with check (
  sender = auth.uid() and public.is_match(sender, to_id) and read_at is null
  and (media is null or (split_part(media, '/', 1) = sender::text and split_part(media, '/', 2) = to_id::text)));

-- alles van de ander in dit gesprek als gelezen zetten
create or replace function public.chat_read(other uuid) returns void language sql security definer set search_path = public as $$
  update messages set read_at = now() where to_id = auth.uid() and sender = other and read_at is null;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat', 'chat', false, 2000000, array['image/jpeg', 'image/webp', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/mpeg'])
on conflict (id) do update set public = false, file_size_limit = 2000000, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists chat_read on storage.objects;
create policy chat_read on storage.objects for select to authenticated
  using (bucket_id = 'chat' and auth.uid()::text in ((storage.foldername(name))[1], (storage.foldername(name))[2]));
drop policy if exists chat_write on storage.objects;
create policy chat_write on storage.objects for insert to authenticated
  with check (bucket_id = 'chat' and (storage.foldername(name))[1] = auth.uid()::text
              and public.is_match(auth.uid(), ((storage.foldername(name))[2])::uuid));
drop policy if exists chat_delete on storage.objects;
create policy chat_delete on storage.objects for delete to authenticated
  using (bucket_id = 'chat' and (storage.foldername(name))[1] = auth.uid()::text);

/* =========================================================
   5. Echtheidscheck: selfie met een gevraagde pose, nagekeken door een mens
   ========================================================= */
alter table public.profiles add column if not exists real_at timestamptz;

create table if not exists public.verify_requests (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  path        text not null,
  pose        int not null check (pose between 1 and 6),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note        text check (char_length(note) <= 200),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.verify_requests enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verify', 'verify', false, 1500000, array['image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 1500000, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists verify_read on storage.objects;
create policy verify_read on storage.objects for select to authenticated
  using (bucket_id = 'verify' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists verify_write on storage.objects;
create policy verify_write on storage.objects for insert to authenticated
  with check (bucket_id = 'verify' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists verify_delete on storage.objects;
create policy verify_delete on storage.objects for delete to authenticated
  using (bucket_id = 'verify' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
-- de beheerder mag de profielfoto zien om te vergelijken
drop policy if exists photos_admin_read on storage.objects;
create policy photos_admin_read on storage.objects for select to authenticated using (bucket_id = 'photos' and public.is_admin());

create or replace function public.verify_submit(p_path text, p_pose int) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'niet ingelogd'; end if;
  if split_part(p_path, '/', 1) <> me::text then raise exception 'ongeldig pad'; end if;
  if exists (select 1 from verify_requests where user_id = me and status = 'pending' and created_at > now() - interval '1 minute') then raise exception 'even wachten'; end if;
  insert into verify_requests (user_id, path, pose) values (me, p_path, p_pose)
  on conflict (user_id) do update set path = excluded.path, pose = excluded.pose, status = 'pending', note = null, created_at = now(), reviewed_at = null;
  perform public.admin_ping('🪪 Nieuwe selfie-check om na te kijken.');
end $$;

create or replace function public.verify_status() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('real', (select real_at is not null from profiles where id = auth.uid()),
    'request', (select jsonb_build_object('status', status, 'note', note, 'at', created_at) from verify_requests where user_id = auth.uid()));
$$;

create or replace function public.admin_verify_list() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('uid', v.user_id, 'name', p.name, 'age', extract(year from age(current_date, p.birth))::int,
    'path', v.path, 'pose', v.pose, 'at', v.created_at, 'photo', case when p.photo_at is not null then p.id::text || '/photo' end,
    'ageVerified', p.age_verified) order by v.created_at), '[]')
    from verify_requests v join profiles p on p.id = v.user_id where v.status = 'pending');
end $$;

create or replace function public.admin_verify_decide(u uuid, ok boolean, p_note text default null) returns void language plpgsql security definer set search_path = public as $$
declare pth text;
begin
  if not public.is_admin() then raise exception 'geen toegang'; end if;
  update verify_requests set status = case when ok then 'approved' else 'rejected' end, note = left(p_note, 200), reviewed_at = now()
  where user_id = u returning path into pth;
  update profiles set real_at = case when ok then now() else real_at end where id = u;
  perform public.queue_push(u, 'badge', 'Galaxy', case when ok then '✅ Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!' else 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.' end, './?verify=1', 'verify', interval '1 minute');
end $$;

/* =========================================================
   7. Video-intro op je profiel (max 15 seconden)
   ========================================================= */
alter table public.profiles add column if not exists video_at timestamptz;
alter table public.profiles add column if not exists video_vis text not null default 'matches';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_video_vis_ok') then
    alter table public.profiles add constraint profiles_video_vis_ok check (video_vis in ('matches', 'iedereen'));
  end if;
end $$;

create or replace function public.can_see_video(owner uuid) returns boolean language sql stable security definer set search_path = public as $$
  select owner = auth.uid() or public.is_admin() or exists (select 1 from profiles p where p.id = owner and p.video_at is not null and p.banned_at is null
    and not public.is_blocked(auth.uid(), owner) and (p.video_vis = 'iedereen' or public.is_match(auth.uid(), owner)));
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('video', 'video', false, 6000000, array['video/webm', 'video/mp4', 'video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = 6000000, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists video_read on storage.objects;
create policy video_read on storage.objects for select to authenticated
  using (bucket_id = 'video' and public.can_see_video(((storage.foldername(name))[1])::uuid));
drop policy if exists video_write on storage.objects;
create policy video_write on storage.objects for insert to authenticated
  with check (bucket_id = 'video' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists video_update on storage.objects;
create policy video_update on storage.objects for update to authenticated
  using (bucket_id = 'video' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists video_delete on storage.objects;
create policy video_delete on storage.objects for delete to authenticated
  using (bucket_id = 'video' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.set_video(has boolean, vis text default 'matches') returns void language sql security definer set search_path = public as $$
  update profiles set video_at = case when has then now() else null end,
                      video_vis = case when vis in ('matches', 'iedereen') then vis else 'matches' end
  where id = auth.uid();
$$;

/* =========================================================
   6. Reeksen en badges
   ========================================================= */
alter table public.profiles add column if not exists streak int not null default 0;
alter table public.profiles add column if not exists streak_day date;
alter table public.profiles add column if not exists best_streak int not null default 0;
alter table public.profiles add column if not exists stories_total int not null default 0;

create or replace function public.streak_bump() returns trigger language plpgsql security definer set search_path = public as $$
declare p public.profiles; s int;
begin
  select * into p from profiles where id = new.user_id;
  if p.streak_day = new.qday then return new; end if;
  s := case when p.streak_day = new.qday - 1 then p.streak + 1 else 1 end;
  update profiles set streak = s, streak_day = new.qday, best_streak = greatest(best_streak, s) where id = new.user_id;
  if s in (3, 7, 30, 100) then
    perform public.queue_push(new.user_id, 'badge', 'Galaxy', '🔥 ' || s || ' dagen op rij! Je hebt een nieuwe badge.', './?badges=1', 'streak', interval '1 minute');
  end if;
  return new;
end $$;
drop trigger if exists answers_streak on public.answers;
create trigger answers_streak after insert on public.answers for each row execute function public.streak_bump();

create or replace function public.stories_count() returns trigger language plpgsql security definer set search_path = public as $$
begin update profiles set stories_total = stories_total + 1 where id = new.user_id; return new; end $$;
drop trigger if exists stories_count on public.stories;
create trigger stories_count after insert on public.stories for each row execute function public.stories_count();

-- huidige reeks telt alleen als je gisteren of vandaag antwoordde
create or replace function public.streak_now(p public.profiles) returns int language sql stable as $$
  select case when p.streak_day >= public.feed_day() - 1 then p.streak else 0 end;
$$;

create or replace function public.badges_of(u uuid) returns text[] language sql stable security definer set search_path = public as $$
  select array_remove(array[
    case when p.real_at is not null then 'real' end,
    case when p.age_verified then 'age18' end,
    case when exists (select 1 from waves where from_id = u) then 'wave' end,
    case when exists (select 1 from public.matches_of(u)) then 'match' end,
    case when (select count(*) from checkins where user_id = u) >= 1 then 'checkin1' end,
    case when (select count(*) from checkins where user_id = u) >= 5 then 'checkin5' end,
    case when exists (select 1 from checkins where user_id = u and place_id like 'ev:%') then 'avond' end,
    case when exists (select 1 from date_plans where status = 'confirmed' and u in (from_id, to_id)) then 'date' end,
    case when exists (select 1 from safe_checks where user_id = u and done_at is not null) then 'safe' end,
    case when exists (select 1 from ref_rewards where user_id = u) then 'invite' end,
    case when p.stories_total >= 1 then 'story' end,
    case when p.best_streak >= 3 then 'streak3' end,
    case when p.best_streak >= 7 then 'streak7' end,
    case when p.best_streak >= 30 then 'streak30' end
  ], null) from profiles p where p.id = u;
$$;

create or replace function public.my_badges() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('badges', to_jsonb(public.badges_of(p.id)), 'streak', public.streak_now(p), 'best', p.best_streak,
    'answeredToday', p.streak_day = public.feed_day(), 'real', p.real_at is not null)
  from profiles p where p.id = auth.uid();
$$;

-- profielkaart: + echtheidsvinkje, reeks en badges
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
    'photo', case when p.photo_at is not null and (p.id = auth.uid() or public.is_match(auth.uid(), p.id)) then p.id::text || '/photo?v=' || extract(epoch from p.photo_at)::bigint end,
    'real', p.real_at is not null,
    'hasVideo', p.video_at is not null,
    'video', case when public.can_see_video(p.id) and p.video_at is not null then p.id::text || '/intro?v=' || extract(epoch from p.video_at)::bigint end,
    'videoVis', case when p.id = auth.uid() then p.video_vis end,
    'streak', public.streak_now(p),
    'badges', to_jsonb(public.badges_of(p.id))
  ) end
  from (select 1) x left join profiles p on p.id = target;
$$;

/* =========================================================
   rechten
   ========================================================= */
revoke all on function public.queue_push(uuid, text, text, text, text, text, interval), public.matches_of(uuid), public.admin_ping(text),
  public.feed_daily_push(), public.badges_of(uuid) from public, anon, authenticated;
revoke all on function public.set_feed_push(text, boolean), public.chat_read(uuid), public.verify_submit(text, int), public.verify_status(),
  public.admin_verify_list(), public.admin_verify_decide(uuid, boolean, text), public.my_badges(), public.streak_now(public.profiles), public.set_video(boolean, text), public.can_see_video(uuid) from public, anon;
grant execute on function public.set_feed_push(text, boolean), public.chat_read(uuid), public.verify_submit(text, int), public.verify_status(),
  public.admin_verify_list(), public.admin_verify_decide(uuid, boolean, text), public.my_badges(), public.streak_now(public.profiles),
  public.profile_card(uuid), public.set_video(boolean, text), public.can_see_video(uuid) to authenticated;
