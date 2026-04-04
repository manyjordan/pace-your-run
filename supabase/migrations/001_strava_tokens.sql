-- Create strava_tokens table with user association
create table strava_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  athlete jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table strava_tokens enable row level security;

-- Policy: Users can only read their own row
create policy "Users can read their own strava tokens"
  on strava_tokens
  for select
  using (auth.uid() = user_id);

-- Policy: Users can only update their own row
create policy "Users can update their own strava tokens"
  on strava_tokens
  for update
  using (auth.uid() = user_id);

-- Policy: Users can only insert their own row
create policy "Users can insert their own strava tokens"
  on strava_tokens
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only delete their own row
create policy "Users can delete their own strava tokens"
  on strava_tokens
  for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_strava_tokens_updated_at
  before update on strava_tokens
  for each row
  execute function update_updated_at_column();
