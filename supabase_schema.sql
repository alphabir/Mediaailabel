-- Supabase Database Schema Setup Description
-- Copy and run the following in your Supabase SQL Editor (https://supabase.com/dashboard)
-- To enable proper functionality, triggers are set up to auto-generate user profile rows.

-- 1. Create Profile Table for Public User Information
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on users
alter table public.users enable row level security;

create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);


-- 2. Create Billing Table
create table public.billing (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  plan text default 'Free' check (plan in ('Free', 'Pro', 'Enterprise')),
  status text default 'active',
  current_period_end timestamp with time zone default (now() + interval '30 days'),
  usage_jobs_count integer default 0,
  usage_jobs_limit integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.billing enable row level security;

create policy "Users can view their own billing" on public.billing
  for select using (auth.uid() = user_id);

create policy "System/Users can update billing" on public.billing
  for update using (auth.uid() = user_id);


-- 3. Create Projects Table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  status text default 'Active' check (status in ('Active', 'Paused', 'Completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;

create policy "Users can manage their own projects" on public.projects
  for all using (auth.uid() = user_id);


-- 4. Create Processing Jobs Table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  type text not null,
  status text default 'Pending' check (status in ('Pending', 'Processing', 'Completed', 'Failed')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  duration integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.jobs enable row level security;

create policy "Users can manage their own jobs" on public.jobs
  for all using (auth.uid() = user_id);


-- 5. Create API Keys Table
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  key_hint text not null,
  token text not null,
  status text default 'active' check (status in ('active', 'revoked')),
  last_used_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.api_keys enable row level security;

create policy "Users can manage their own api_keys" on public.api_keys
  for all using (auth.uid() = user_id);


-- 6. Trigger to automatically handle profile & billing creation on signup
-- Run this to allow Supabase Auth sign-ups to seamlessly register correct entries!
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );

  insert into public.billing (user_id, plan, status, usage_jobs_count, usage_jobs_limit)
  values (new.id, 'Free', 'active', 0, 100);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution setup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 7. Create Processing Jobs Table (Video Upload Center)
create table public.processing_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  file_name text not null,
  file_size text not null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'Pending' check (status in ('Pending', 'Processing', 'Completed', 'Failed')),
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.processing_jobs enable row level security;

create policy "Users can manage their own processing jobs" on public.processing_jobs
  for all using (auth.uid() = user_id);
