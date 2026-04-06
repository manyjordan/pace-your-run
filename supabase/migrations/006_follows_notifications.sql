-- Follow relationships
create table if not exists follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_follower_idx on follows (follower_id);
create index if not exists follows_following_idx on follows (following_id);

alter table follows enable row level security;

create policy "Users can view follows involving themselves"
  on follows for select
  to authenticated
  using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "Users can insert own follow rows"
  on follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "Users can delete own follow rows"
  on follows for delete
  to authenticated
  using (auth.uid() = follower_id);

-- In-app notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('like', 'follow')),
  actor_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid references social_posts (id) on delete set null,
  post_title text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications (user_id);
create index if not exists notifications_user_unread_idx on notifications (user_id) where read_at is null;

alter table notifications enable row level security;

create policy "Users can view own notifications"
  on notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Actors can create notifications"
  on notifications for insert
  to authenticated
  with check (actor_id = auth.uid());
