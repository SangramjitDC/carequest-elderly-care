begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 100),
  role text not null check (role in ('elderly', 'caregiver')),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create function private.validate_timezone() returns trigger language plpgsql
set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Invalid timezone' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger profile_timezone before insert or update on public.profiles
for each row execute function private.validate_timezone();

-- Metadata is used only at signup; subsequent user metadata edits never change roles.
create function private.create_profile() returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role, timezone)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'CareQuest member'),
    case when new.raw_user_meta_data->>'role' = 'caregiver' then 'caregiver' else 'elderly' end,
    coalesce(nullif(new.raw_user_meta_data->>'timezone', ''), 'UTC'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.create_profile();

-- Existing accounts receive the least-privileged role; review roles administratively.
insert into public.profiles (id, display_name, role)
select id, 'CareQuest member', 'elderly' from auth.users on conflict (id) do nothing;

create table public.caregiver_relationships (
  id uuid primary key default gen_random_uuid(),
  elderly_id uuid not null references public.profiles(id) on delete cascade,
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  can_manage_medications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (elderly_id, caregiver_id),
  check (elderly_id <> caregiver_id)
);
create index relationships_caregiver on public.caregiver_relationships(caregiver_id, status);

-- These narrow helpers avoid recursive RLS. Never expose the private schema via the Data API.
create function private.has_role(person uuid, expected text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = person and role = expected);
$$;
create function private.can_view_patient(patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select patient = (select auth.uid()) or exists (
    select 1 from public.caregiver_relationships
    where elderly_id = patient and caregiver_id = (select auth.uid()) and status = 'active'
  );
$$;
create function private.can_manage_patient(patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.caregiver_relationships
    where elderly_id = patient and caregiver_id = (select auth.uid())
      and status = 'active' and can_manage_medications);
$$;
create function private.can_view_profile(person uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select person = (select auth.uid()) or exists (
    select 1 from public.caregiver_relationships where
      (elderly_id = person and caregiver_id = (select auth.uid()) and status = 'active') or
      (caregiver_id = person and elderly_id = (select auth.uid()) and status in ('pending', 'active'))
  );
$$;
create function private.touch_relationship() returns trigger language plpgsql
set search_path = '' as $$ begin new.updated_at = clock_timestamp(); return new; end; $$;
create trigger relationship_updated before update on public.caregiver_relationships
for each row execute function private.touch_relationship();

-- One row represents one daily scheduled dose; use separate rows for multiple daily times.
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  name text not null check (char_length(trim(name)) between 1 and 120),
  dosage text not null check (char_length(trim(dosage)) between 1 and 120),
  instructions text not null default '' check (char_length(instructions) <= 500),
  scheduled_time time not null check (extract(second from scheduled_time) = 0),
  starts_on date not null,
  ends_on date,
  active boolean not null default true,
  created_by uuid not null default auth.uid() references public.profiles(id),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, patient_id),
  check (ends_on is null or ends_on >= starts_on)
);
create index medications_patient on public.medications(patient_id, active);
create function private.touch_medication() returns trigger language plpgsql
set search_path = '' as $$
begin new.updated_at = clock_timestamp(); new.version = old.version + 1; return new; end;
$$;
create trigger medication_updated before update on public.medications
for each row execute function private.touch_medication();

create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null,
  patient_id uuid not null references public.profiles(id),
  scheduled_date date not null,
  scheduled_time time not null,
  medication_name text not null,
  dosage text not null,
  taken_at timestamptz not null default now(),
  recorded_by uuid not null default auth.uid() references public.profiles(id),
  foreign key (medication_id, patient_id) references public.medications(id, patient_id),
  unique (medication_id, scheduled_date)
);
create index dose_logs_patient_date on public.dose_logs(patient_id, scheduled_date);
create function private.validate_dose() returns trigger language plpgsql
set search_path = '' as $$
declare med public.medications; local_today date;
begin
  select * into med from public.medications where id = new.medication_id and patient_id = new.patient_id;
  select (now() at time zone timezone)::date into local_today from public.profiles where id = new.patient_id;
  if med.id is null or not med.active or new.scheduled_date <> local_today or
    new.scheduled_date < med.starts_on or (med.ends_on is not null and new.scheduled_date > med.ends_on) then
    raise exception 'Dose is not scheduled today' using errcode = '23514';
  end if;
  new.scheduled_time = med.scheduled_time;
  new.medication_name = med.name;
  new.dosage = med.dosage;
  new.taken_at = now();
  new.recorded_by = auth.uid();
  return new;
end;
$$;
create trigger dose_validation before insert on public.dose_logs
for each row execute function private.validate_dose();

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  title text not null check (char_length(trim(title)) between 1 and 160),
  clinician text not null default '' check (char_length(clinician) <= 160),
  location text not null default '' check (char_length(location) <= 300),
  starts_at timestamptz not null,
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);
create index appointments_patient on public.appointments(patient_id, starts_at);
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  name text not null check (char_length(trim(name)) between 1 and 120),
  relationship text not null default '' check (char_length(relationship) <= 100),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{7,25}$'),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index emergency_contacts_patient on public.emergency_contacts(patient_id);
create unique index one_primary_contact on public.emergency_contacts(patient_id) where is_primary;
create table public.wellness_check_ins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  mood integer not null check (mood between 1 and 5),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);
create index wellness_check_ins_patient on public.wellness_check_ins(patient_id, created_at);
create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id),
  kind text not null check (kind in ('medication', 'appointment', 'sos', 'relationship')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index notifications_recipient on public.notification_logs(recipient_id, created_at);
create table public.sos_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'requested' check (status in ('requested', 'acknowledged', 'resolved')),
  created_at timestamptz not null default now()
);
create index sos_events_patient on public.sos_events(patient_id, created_at);

alter table public.profiles enable row level security;
alter table public.caregiver_relationships enable row level security;
alter table public.medications enable row level security;
alter table public.dose_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.wellness_check_ins enable row level security;
alter table public.notification_logs enable row level security;
alter table public.sos_events enable row level security;

-- Explicit grants remove Supabase's default broad table privileges.
revoke all on public.profiles, public.caregiver_relationships, public.medications, public.dose_logs,
  public.appointments, public.emergency_contacts, public.wellness_check_ins,
  public.notification_logs, public.sos_events from anon, authenticated;
grant select on public.profiles, public.caregiver_relationships, public.medications, public.dose_logs,
  public.appointments, public.emergency_contacts, public.wellness_check_ins,
  public.notification_logs, public.sos_events to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant insert (elderly_id, caregiver_id) on public.caregiver_relationships to authenticated;
grant update (status, can_manage_medications) on public.caregiver_relationships to authenticated;
grant insert (patient_id, name, dosage, instructions, scheduled_time, starts_on, ends_on, active) on public.medications to authenticated;
grant update (name, dosage, instructions, scheduled_time, starts_on, ends_on, active) on public.medications to authenticated;
grant insert (medication_id, patient_id, scheduled_date) on public.dose_logs to authenticated;
grant insert (patient_id, title, clinician, location, starts_at, notes),
  update (title, clinician, location, starts_at, notes), delete on public.appointments to authenticated;
grant insert (patient_id, name, relationship, phone, is_primary),
  update (name, relationship, phone, is_primary), delete on public.emergency_contacts to authenticated;
grant insert (patient_id, mood, notes) on public.wellness_check_ins to authenticated;
grant insert (patient_id, message), update (status) on public.sos_events to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (private.can_view_profile(id));
create policy profiles_edit on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy relationships_read on public.caregiver_relationships for select to authenticated
using (elderly_id = (select auth.uid()) or caregiver_id = (select auth.uid()));
create policy relationships_request on public.caregiver_relationships for insert to authenticated
with check (caregiver_id = (select auth.uid()) and status = 'pending' and
  private.has_role(caregiver_id, 'caregiver') and private.has_role(elderly_id, 'elderly'));
create policy relationships_consent on public.caregiver_relationships for update to authenticated
using (elderly_id = (select auth.uid())) with check (elderly_id = (select auth.uid()));
create policy medications_read on public.medications for select to authenticated using (private.can_view_patient(patient_id));
create policy medications_add on public.medications for insert to authenticated
with check (private.can_manage_patient(patient_id) and private.has_role(patient_id, 'elderly') and created_by = (select auth.uid()));
create policy medications_edit on public.medications for update to authenticated
using (private.can_manage_patient(patient_id)) with check (private.can_manage_patient(patient_id));
create policy dose_logs_read on public.dose_logs for select to authenticated using (private.can_view_patient(patient_id));
create policy dose_logs_record on public.dose_logs for insert to authenticated
with check (patient_id = (select auth.uid()) and recorded_by = (select auth.uid()) and private.has_role(patient_id, 'elderly'));
create policy appointments_read on public.appointments for select to authenticated using (private.can_view_patient(patient_id));
create policy appointments_add on public.appointments for insert to authenticated
with check (private.has_role(patient_id, 'elderly') and (patient_id = (select auth.uid()) or private.can_manage_patient(patient_id)));
create policy appointments_edit on public.appointments for update to authenticated
using (patient_id = (select auth.uid()) or private.can_manage_patient(patient_id))
with check (patient_id = (select auth.uid()) or private.can_manage_patient(patient_id));
create policy appointments_remove on public.appointments for delete to authenticated using (patient_id = (select auth.uid()) or private.can_manage_patient(patient_id));
create policy contacts_read on public.emergency_contacts for select to authenticated using (private.can_view_patient(patient_id));
create policy contacts_add on public.emergency_contacts for insert to authenticated
with check (private.has_role(patient_id, 'elderly') and (patient_id = (select auth.uid()) or private.can_manage_patient(patient_id)));
create policy contacts_edit on public.emergency_contacts for update to authenticated
using (patient_id = (select auth.uid()) or private.can_manage_patient(patient_id))
with check (patient_id = (select auth.uid()) or private.can_manage_patient(patient_id));
create policy contacts_remove on public.emergency_contacts for delete to authenticated using (patient_id = (select auth.uid()) or private.can_manage_patient(patient_id));
create policy check_ins_read on public.wellness_check_ins for select to authenticated using (private.can_view_patient(patient_id));
create policy check_ins_add on public.wellness_check_ins for insert to authenticated
with check (patient_id = (select auth.uid()) and private.has_role(patient_id, 'elderly'));
create policy notifications_read on public.notification_logs for select to authenticated using (recipient_id = (select auth.uid()));
create policy sos_read on public.sos_events for select to authenticated using (private.can_view_patient(patient_id));
create policy sos_add on public.sos_events for insert to authenticated
with check (patient_id = (select auth.uid()) and private.has_role(patient_id, 'elderly') and status = 'requested');
create policy sos_acknowledge on public.sos_events for update to authenticated
using (private.can_manage_patient(patient_id)) with check (private.can_manage_patient(patient_id));

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.has_role(uuid, text), private.can_view_patient(uuid),
  private.can_manage_patient(uuid), private.can_view_profile(uuid) to authenticated;

commit;
