-- Run this in Supabase Dashboard > SQL Editor > New query.
-- Supabase Auth securely handles passwords. The profile table stores player details only.

create table if not exists public.player_profiles (
  player_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null,
  player_class text not null default 'Swordsman'
    check (player_class in ('Swordsman', 'Archer', 'Assassin', 'Tank', 'SwordMage', 'Mage')),
  created_at timestamptz not null default now()
);

create unique index if not exists player_profiles_username_lower_uidx
  on public.player_profiles (lower(username));

create or replace function public.create_player_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.player_profiles (player_id, username, email, player_class)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'player_class', 'Swordsman')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_player on auth.users;
create trigger on_auth_user_created_player
  after insert on auth.users
  for each row execute procedure public.create_player_profile();

alter table public.player_profiles enable row level security;
drop policy if exists "Players can read own profile" on public.player_profiles;
create policy "Players can read own profile"
  on public.player_profiles for select
  to authenticated
  using ((select auth.uid()) = player_id);

-- Allows the login form to translate a username into its email.
-- It returns only the email for an exact username match.
create or replace function public.get_player_email_by_username(input_username text)
returns text
language sql
security definer
set search_path = ''
as $$
  select email
  from public.player_profiles
  where lower(username) = lower(trim(input_username))
  limit 1;
$$;

grant execute on function public.get_player_email_by_username(text) to anon, authenticated;
