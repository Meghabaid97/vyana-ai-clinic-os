create table public.journal_preferences (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique,
  cadence text not null default 'frequent',
  auto_cadence boolean not null default true,
  last_nudged_at timestamptz,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_logged_date date,
  preferred_hour integer not null default 9,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index journal_preferences_patient_idx on public.journal_preferences(patient_id);

alter table public.journal_preferences enable row level security;

create policy "Patients can view own journal preferences"
on public.journal_preferences for select
using (patient_id in (select id from public.patients where user_id = auth.uid()));

create policy "Patients can insert own journal preferences"
on public.journal_preferences for insert
with check (patient_id in (select id from public.patients where user_id = auth.uid()));

create policy "Patients can update own journal preferences"
on public.journal_preferences for update
using (patient_id in (select id from public.patients where user_id = auth.uid()));

create trigger journal_preferences_updated_at
before update on public.journal_preferences
for each row execute function public.update_updated_at_column();

-- validate cadence values
create or replace function public.validate_journal_cadence()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.cadence not in ('daily','frequent','weekly','off') then
    raise exception 'Invalid cadence: %', new.cadence;
  end if;
  if new.preferred_hour < 0 or new.preferred_hour > 23 then
    raise exception 'preferred_hour must be 0-23';
  end if;
  return new;
end$$;

create trigger journal_preferences_validate
before insert or update on public.journal_preferences
for each row execute function public.validate_journal_cadence();