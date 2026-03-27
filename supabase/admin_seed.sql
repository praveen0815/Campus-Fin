-- SlotSphere Admin Seed Script
-- Run this in Supabase SQL Editor.

-- 1) Core tables and constraints for admin module
create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete restrict,
  name text not null,
  location text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint venues_unique_name_location unique (name, location)
);

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete restrict,
  session text not null check (session in ('morning', 'evening')),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- 2) Insert predefined sports (deduplicated by unique name)
insert into public.sports (name) values
  ('Carrom'),
  ('Football'),
  ('Ball Badminton'),
  ('Handball'),
  ('Hockey'),
  ('Table Tennis'),
  ('Badminton'),
  ('Kho-Kho'),
  ('Chess'),
  ('Volleyball'),
  ('Kabaddi'),
  ('Basketball'),
  ('Tennis'),
  ('Silambam'),
  ('Throwball')
on conflict (name) do nothing;

-- 3) Insert predefined venues linked to sports
insert into public.venues (sport_id, name, location) values
  ((select id from public.sports where name = 'Carrom'), 'Recreational Hall (Boys)', 'Recreational Hall (Boys)'),
  ((select id from public.sports where name = 'Chess'), 'Recreational Hall (Boys)', 'Recreational Hall (Boys)'),

  ((select id from public.sports where name = 'Football'), 'BIT Play Field (Football Field)', 'BIT Play Field (Football Field)'),
  ((select id from public.sports where name = 'Ball Badminton'), 'BIT Play Field (Ball Badminton Court)', 'BIT Play Field (Ball Badminton Court)'),
  ((select id from public.sports where name = 'Handball'), 'BIT Play Field (Handball Court)', 'BIT Play Field (Handball Court)'),
  ((select id from public.sports where name = 'Hockey'), 'BIT Play Field (Hockey Court)', 'BIT Play Field (Hockey Court)'),
  ((select id from public.sports where name = 'Badminton'), 'BIT Play Field (Badminton Court)', 'BIT Play Field (Badminton Court)'),
  ((select id from public.sports where name = 'Kho-Kho'), 'BIT Play Field (Kho-Kho Court)', 'BIT Play Field (Kho-Kho Court)'),

  ((select id from public.sports where name = 'Table Tennis'), 'BIT Indoor', 'BIT Indoor'),

  ((select id from public.sports where name = 'Volleyball'), 'Sports Complex (Volleyball Court)', 'Sports Complex (Volleyball Court)'),
  ((select id from public.sports where name = 'Throwball'), 'Sports Complex (Volleyball Court)', 'Sports Complex (Volleyball Court)'),

  ((select id from public.sports where name = 'Kabaddi'), 'Sports Complex (Kabaddi Court)', 'Sports Complex (Kabaddi Court)'),
  ((select id from public.sports where name = 'Basketball'), 'Sports Complex (Basketball Court)', 'Sports Complex (Basketball Court)'),
  ((select id from public.sports where name = 'Tennis'), 'Sports Complex (Tennis Court)', 'Sports Complex (Tennis Court)'),
  ((select id from public.sports where name = 'Silambam'), 'Sports Complex (Tennis Court)', 'Sports Complex (Tennis Court)')
on conflict (name, location) do nothing;

-- Optional indexes for admin listing/filtering
create index if not exists idx_venues_sport_id on public.venues(sport_id);
create index if not exists idx_slots_venue_id on public.slots(venue_id);
