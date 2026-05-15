-- Run this in your Supabase SQL editor to set up the database schema.

-- Clients table
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Pianos table
create table if not exists pianos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  style text check (style in ('upright', 'grand', 'baby_grand', 'spinet', 'console', 'studio', 'other')),
  brand text,
  model text,
  serial_number text,
  year_manufactured int,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Service records table
create table if not exists service_records (
  id uuid primary key default gen_random_uuid(),
  piano_id uuid references pianos(id) on delete cascade not null,
  date_serviced date not null,
  service_type text not null,
  technician_notes text,
  amount_charged numeric(10, 2),
  next_service_due date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Scheduled appointments table
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  piano_id uuid references pianos(id) on delete cascade not null,
  scheduled_date date not null,
  service_type text not null default 'Tuning',
  notes text,
  created_at timestamptz default now() not null
);

-- Marketing leads table
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text,
  institution text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  emailed_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz default now() not null
);

alter table leads enable row level security;

create policy "leads: user owns" on leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_leads_user_id on leads(user_id);

-- Migration for existing databases:
-- alter table leads add column if not exists converted_at timestamptz;

-- Reminder tracking table
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  reminded_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Row Level Security
alter table clients enable row level security;
alter table pianos enable row level security;
alter table service_records enable row level security;
alter table reminders enable row level security;
alter table appointments enable row level security;

-- RLS Policies: only the owning user can access their data
create policy "clients: user owns" on clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "pianos: user owns via client" on pianos
  for all using (
    exists (select 1 from clients where clients.id = pianos.client_id and clients.user_id = auth.uid())
  )
  with check (
    exists (select 1 from clients where clients.id = pianos.client_id and clients.user_id = auth.uid())
  );

create policy "service_records: user owns via piano" on service_records
  for all using (
    exists (
      select 1 from pianos
      join clients on clients.id = pianos.client_id
      where pianos.id = service_records.piano_id
        and clients.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from pianos
      join clients on clients.id = pianos.client_id
      where pianos.id = service_records.piano_id
        and clients.user_id = auth.uid()
    )
  );

create policy "appointments: user owns via piano" on appointments
  for all using (
    exists (
      select 1 from pianos
      join clients on clients.id = pianos.client_id
      where pianos.id = appointments.piano_id
        and clients.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from pianos
      join clients on clients.id = pianos.client_id
      where pianos.id = appointments.piano_id
        and clients.user_id = auth.uid()
    )
  );

create policy "reminders: user owns via client" on reminders
  for all using (
    exists (select 1 from clients where clients.id = reminders.client_id and clients.user_id = auth.uid())
  )
  with check (
    exists (select 1 from clients where clients.id = reminders.client_id and clients.user_id = auth.uid())
  );

-- Indexes for performance
create index if not exists idx_pianos_client_id on pianos(client_id);
create index if not exists idx_service_records_piano_id on service_records(piano_id);
create index if not exists idx_service_records_date on service_records(date_serviced desc);
create index if not exists idx_reminders_client_id on reminders(client_id);
create index if not exists idx_clients_user_id on clients(user_id);
