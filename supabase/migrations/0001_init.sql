-- Nexus: accounts, profiles, posts, follows, work, events and RSVPs.
-- Everything is members-only: every table requires a signed-in user to read,
-- and people can only change their own rows.

/* ---------- Profiles ---------- */

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  tagline text not null default '' check (char_length(tagline) <= 120),
  bio text not null default '' check (char_length(bio) <= 600),
  location text not null default '' check (char_length(location) <= 80),
  roles text[] not null default '{}',
  open_to text[] not null default '{}',
  -- Talent match: what someone brings, and the projects they want.
  skills text[] not null default '{}',
  projects text[] not null default '{}',
  avatar_path text,
  header jsonb not null default '{"cover": "forest", "pattern": "none"}',
  -- Every opt-in starts off.
  suggest boolean not null default false,
  discoverable boolean not null default false,
  personalize boolean not null default false,
  mix_others boolean not null default false,
  reminder boolean not null default false,
  quiet_hours boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- A profile row appears as soon as someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/* ---------- Follows ---------- */

create table public.follows (
  follower uuid not null references public.profiles (id) on delete cascade,
  followee uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);
create index follows_followee_idx on public.follows (followee);

/* ---------- Posts ---------- */

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('New work', 'Looking for', 'Crew call')),
  body text not null check (char_length(body) between 1 and 500),
  image_path text,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index posts_author_created_idx on public.posts (author, created_at desc);

create table public.saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- "I'm interested", "Collaborate", "Let's collaborate".
create table public.collab_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete set null,
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

/* ---------- Work on profiles ---------- */

create table public.work_modules (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  blurb text not null default '',
  position int not null default 0,
  hidden boolean not null default false
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.work_modules (id) on delete cascade,
  owner uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  detail text not null default '',
  kind text not null default '',
  about text not null default '',
  image_path text,
  event_id uuid,
  position int not null default 0
);

/* ---------- Events ---------- */

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  host uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  badge text not null default 'Nexus event',
  starts_on date,
  when_text text not null default '',
  where_text text not null default '',
  about text not null default '',
  cover_path text,
  sale_kind text not null default 'free' check (sale_kind in ('tickets', 'free', 'drawing')),
  -- [{ "id": "ga", "name": "General admission", "price": 15 }]
  tiers jsonb not null default '[]',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.work_items
  add constraint work_items_event_fk foreign key (event_id) references public.events (id) on delete set null;

create table public.event_team (
  event_id uuid not null references public.events (id) on delete cascade,
  person uuid not null references public.profiles (id) on delete cascade,
  part text not null default '',
  primary key (event_id, person)
);

create table public.rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.drawing_entries (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- "Met in person": organizers check people in at the door.
create table public.checkins (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

/* ---------- Row level security ---------- */

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.saves enable row level security;
alter table public.collab_requests enable row level security;
alter table public.work_modules enable row level security;
alter table public.work_items enable row level security;
alter table public.events enable row level security;
alter table public.event_team enable row level security;
alter table public.rsvps enable row level security;
alter table public.drawing_entries enable row level security;
alter table public.checkins enable row level security;

-- Members can see each other; nothing is public to signed-out visitors or scrapers.
create policy "members read profiles" on public.profiles for select to authenticated using (true);
create policy "edit own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "members read follows" on public.follows for select to authenticated using (true);
create policy "follow as yourself" on public.follows for insert to authenticated with check (follower = auth.uid());
create policy "unfollow as yourself" on public.follows for delete to authenticated using (follower = auth.uid());

create policy "members read posts" on public.posts for select to authenticated using (true);
create policy "post as yourself" on public.posts for insert to authenticated with check (author = auth.uid());
create policy "edit own posts" on public.posts for update to authenticated using (author = auth.uid()) with check (author = auth.uid());
create policy "delete own posts" on public.posts for delete to authenticated using (author = auth.uid());

create policy "own saves" on public.saves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "see requests you sent or got" on public.collab_requests for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());
create policy "send requests as yourself" on public.collab_requests for insert to authenticated with check (from_user = auth.uid());

create policy "members read modules" on public.work_modules for select to authenticated using (true);
create policy "own modules" on public.work_modules for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy "members read work" on public.work_items for select to authenticated using (true);
create policy "own work" on public.work_items for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

create policy "members read events" on public.events for select to authenticated using (true);
create policy "host own events" on public.events for all to authenticated using (host = auth.uid()) with check (host = auth.uid());

create policy "members read teams" on public.event_team for select to authenticated using (true);
create policy "hosts manage teams" on public.event_team for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.host = auth.uid()))
  with check (exists (select 1 from public.events e where e.id = event_id and e.host = auth.uid()));

create policy "members read rsvps" on public.rsvps for select to authenticated using (true);
create policy "rsvp as yourself" on public.rsvps for insert to authenticated with check (user_id = auth.uid());
create policy "cancel own rsvp" on public.rsvps for delete to authenticated using (user_id = auth.uid());

create policy "see own drawing entries" on public.drawing_entries for select to authenticated using (user_id = auth.uid());
create policy "enter as yourself" on public.drawing_entries for insert to authenticated with check (user_id = auth.uid());

create policy "members read checkins" on public.checkins for select to authenticated using (true);
create policy "hosts check people in" on public.checkins for insert to authenticated
  with check (exists (select 1 from public.events e where e.id = event_id and e.host = auth.uid()));

/* ---------- Feeds ---------- */

-- Your timeline: you and the people you follow, newest first. It ends; no suggestions mixed in.
create function public.timeline(max_posts int default 50)
returns setof public.posts
language sql stable security invoker set search_path = public as $$
  select p.* from public.posts p
  where p.author = auth.uid()
     or p.author in (select followee from public.follows where follower = auth.uid())
  order by p.created_at desc
  limit max_posts;
$$;

-- Discover: only people who opted in, with what you have in common.
create function public.discover_people()
returns table (
  id uuid, name text, tagline text, location text, roles text[], open_to text[],
  skills text[], projects text[], avatar_path text,
  shared_at text[], mutuals text[], following boolean
)
language sql stable security invoker set search_path = public as $$
  select
    p.id, p.name, p.tagline, p.location, p.roles, p.open_to, p.skills, p.projects, p.avatar_path,
    coalesce((
      select array_agg(e.title order by e.starts_on desc nulls last)
      from public.checkins mine
      join public.checkins theirs on theirs.event_id = mine.event_id and theirs.user_id = p.id
      join public.events e on e.id = mine.event_id
      where mine.user_id = auth.uid()
    ), '{}') as shared_at,
    coalesce((
      select array_agg(m.name order by m.name)
      from public.follows a
      join public.follows b on b.followee = a.followee and b.follower = p.id
      join public.profiles m on m.id = a.followee
      where a.follower = auth.uid()
    ), '{}') as mutuals,
    exists (select 1 from public.follows f where f.follower = auth.uid() and f.followee = p.id) as following
  from public.profiles p
  where p.discoverable and p.onboarded and p.id <> auth.uid();
$$;

/* ---------- Storage: members-only files ---------- */

-- Private buckets: files load only for signed-in members through short-lived signed links.
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', false), ('media', 'media', false)
  on conflict (id) do nothing;

create policy "members read files" on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'media'));
create policy "upload into your own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'media') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "replace your own files" on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'media') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete your own files" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'media') and (storage.foldername(name))[1] = auth.uid()::text);
