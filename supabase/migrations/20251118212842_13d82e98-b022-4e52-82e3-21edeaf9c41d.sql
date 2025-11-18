-- Create an enum for user roles
create type public.app_role as enum ('doctor', 'admin');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

-- Enable Row-Level Security
alter table public.user_roles enable row level security;

-- Create a security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Drop existing policies on consultations table
drop policy if exists "Doctors can view their own consultations" on public.consultations;
drop policy if exists "Doctors can create their own consultations" on public.consultations;
drop policy if exists "Doctors can update their own consultations" on public.consultations;
drop policy if exists "Doctors can delete their own consultations" on public.consultations;

-- Create new policies that verify doctor role
create policy "Verified doctors can view their own consultations"
on public.consultations
for select
to authenticated
using (auth.uid() = doctor_id and public.has_role(auth.uid(), 'doctor'));

create policy "Verified doctors can create their own consultations"
on public.consultations
for insert
to authenticated
with check (auth.uid() = doctor_id and public.has_role(auth.uid(), 'doctor'));

create policy "Verified doctors can update their own consultations"
on public.consultations
for update
to authenticated
using (auth.uid() = doctor_id and public.has_role(auth.uid(), 'doctor'));

create policy "Verified doctors can delete their own consultations"
on public.consultations
for delete
to authenticated
using (auth.uid() = doctor_id and public.has_role(auth.uid(), 'doctor'));

-- Allow users to view their own role
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

-- Only admins can manage roles
create policy "Admins can manage all roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));