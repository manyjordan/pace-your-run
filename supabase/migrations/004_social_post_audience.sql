alter table social_posts
  add column if not exists audience text not null default 'public';

update social_posts
set audience = case
  when coalesce(is_public, true) then 'public'
  else 'private'
end
where audience is null or audience = '';

alter table social_posts
  drop constraint if exists social_posts_audience_check;

alter table social_posts
  add constraint social_posts_audience_check
  check (audience in ('private', 'friends', 'public'));
