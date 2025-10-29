-- Create profiles table for user information
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  username text unique,
  email text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  primary key (id)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Admins can view all profiles
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own profile
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Create function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger to update updated_at on profile changes
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();