-- Galaxy – pushmeldingen bij een nieuw bericht.
-- Werking: de app bewaart per toestel een "push-abonnement". Bij een nieuw bericht
-- roept de database de Edge Function "push" aan met alleen het bericht-id.
-- De functie leest het bericht zelf opnieuw en stuurt één melding zonder inhoud
-- ("Je hebt een nieuw bericht"), zodat niemand op je vergrendelscherm meeleest.

create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subs (
  endpoint   text primary key check (endpoint ~ '^https://' and char_length(endpoint) < 1000),
  user_id    uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  p256dh     text not null check (char_length(p256dh) < 200),
  auth       text not null check (char_length(auth) < 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user on public.push_subs(user_id);
alter table public.push_subs enable row level security;
drop policy if exists push_subs_own on public.push_subs;
create policy push_subs_own on public.push_subs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.push_subs from anon;
grant select, insert, update, delete on public.push_subs to authenticated;

alter table public.messages add column if not exists pushed_at timestamptz;

create or replace function public.notify_push() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://dqodwuemdpzyvvvxvgtz.supabase.co/functions/v1/push',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 4000);
  return new;
exception when others then
  return new;  -- een mislukte melding mag een bericht nooit tegenhouden
end $$;

drop trigger if exists messages_push on public.messages;
create trigger messages_push after insert on public.messages
  for each row execute function public.notify_push();
