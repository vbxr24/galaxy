-- Galaxy – echte leeftijdscontrole (18+) via Didit (selfie-leeftijdsschatting, bij twijfel ID-kaart).
-- De app start een controle; de Edge Function "age-check" vraagt het resultaat zelf op bij Didit
-- en zet profiles.age_verified. Gebruikers kunnen age_verified nooit zelf aanpassen.
create table if not exists public.age_checks (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  verified   boolean not null default false,
  session_id text not null,
  status     text,
  est_age    numeric,
  updated_at timestamptz not null default now()
);
alter table public.age_checks enable row level security;
drop policy if exists age_checks_own on public.age_checks;
create policy age_checks_own on public.age_checks for select to authenticated using (user_id = auth.uid());
revoke all on public.age_checks from anon;
grant select on public.age_checks to authenticated;

-- eigen status opvragen (ook als het profiel nog niet bestaat)
create or replace function public.my_age_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('verified', coalesce((select age_verified from profiles where id = auth.uid()), false) or coalesce((select verified from age_checks where user_id = auth.uid()), false),
                            'status', (select status from age_checks where user_id = auth.uid()));
$$;
revoke all on function public.my_age_status() from public, anon;
grant execute on function public.my_age_status() to authenticated;

-- een profiel dat later wordt aangemaakt, neemt de geslaagde controle over
create or replace function public.age_carry() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from age_checks where user_id = new.id and verified) then new.age_verified := true; end if;
  return new;
end $$;
drop trigger if exists profiles_age_carry on public.profiles;
create trigger profiles_age_carry before insert on public.profiles for each row execute function public.age_carry();
