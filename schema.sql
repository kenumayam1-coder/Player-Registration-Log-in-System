-- Run this entire script in Supabase Dashboard > SQL Editor > New query.
-- Passwords are stored and verified by Supabase Auth, never in player_profiles.

create table if not exists public.player_profiles (
  player_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text,
  player_class text not null default 'Swordsman'
    check (player_class in ('Swordsman', 'Archer', 'Assassin', 'Tank', 'SwordMage', 'Mage')),
  status text not null default 'Active'
    check (status in ('Active', 'Inactive', 'Banned')),
  created_at timestamptz not null default now()
);

create table if not exists public.player_inventory (
  inventory_id uuid primary key default gen_random_uuid(),
  player_id uuid not null unique references public.player_profiles(player_id) on delete cascade,
  armor jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  weapon jsonb not null default '[]'::jsonb,
  misc_item jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Automatically create a profile and an empty inventory whenever Supabase Auth
-- creates a new user.
create or replace function public.create_player_records()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.player_profiles (player_id, username, email, player_class, status)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'player_class', 'Swordsman'),
    'Active'
  );

  insert into public.player_inventory (player_id)
  values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_player on auth.users;
create trigger on_auth_user_created_player
  after insert on auth.users
  for each row execute procedure public.create_player_records();

-- Enable Row Level Security on both tables.
alter table public.player_profiles enable row level security;
alter table public.player_inventory enable row level security;

-- A signed-in player can only read and update their own profile.
drop policy if exists "Players can read own profile" on public.player_profiles;
create policy "Players can read own profile"
  on public.player_profiles for select
  to authenticated
  using ((select auth.uid()) = player_id);

drop policy if exists "Players can update own profile" on public.player_profiles;
create policy "Players can update own profile"
  on public.player_profiles for update
  to authenticated
  using ((select auth.uid()) = player_id)
  with check ((select auth.uid()) = player_id);

-- A signed-in player can only read and update their own inventory.
drop policy if exists "Players can read own inventory" on public.player_inventory;
create policy "Players can read own inventory"
  on public.player_inventory for select
  to authenticated
  using ((select auth.uid()) = player_id);

drop policy if exists "Players can update own inventory" on public.player_inventory;
create policy "Players can update own inventory"
  on public.player_inventory for update
  to authenticated
  using ((select auth.uid()) = player_id)
  with check ((select auth.uid()) = player_id);

-- Restrict username duplicates without regard to capitalization.
create unique index if not exists player_profiles_username_lower_uidx
  on public.player_profiles (lower(username));
