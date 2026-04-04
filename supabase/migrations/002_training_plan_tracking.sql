-- Create training_plan_sessions table to track which sessions users have completed
create table training_plan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  week_number integer not null,
  session_day text not null,
  session_type text not null,
  completed boolean default false,
  completed_at timestamptz,
  notes text,
  distance_km numeric,
  duration_minutes integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one entry per user per session
  unique(user_id, plan_id, week_number, session_day)
);

-- Enable RLS
alter table training_plan_sessions enable row level security;

-- Policies: Users can only read, update, and delete their own training sessions
create policy "Users can read their own training sessions"
  on training_plan_sessions
  for select
  using (auth.uid() = user_id);

create policy "Users can create training sessions"
  on training_plan_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own training sessions"
  on training_plan_sessions
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own training sessions"
  on training_plan_sessions
  for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create trigger update_training_plan_sessions_updated_at
  before update on training_plan_sessions
  for each row
  execute function update_updated_at_column();

-- Create index for fast queries by user and plan
create index training_plan_sessions_user_id_plan_id
  on training_plan_sessions(user_id, plan_id);

create index training_plan_sessions_user_week
  on training_plan_sessions(user_id, plan_id, week_number);
