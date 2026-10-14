-- Private spaces: invite-only groups with their own posts, and direct messages.
-- Nothing here appears in Discover, on profiles, or to anyone outside the group or conversation.
-- Files go to a separate private bucket that only the group or conversation can open.

/* ---------- Groups ---------- */

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  about text not null default '' check (char_length(about) <= 300),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

-- Membership checks run as the definer so policies on group_members don't recurse.
create function public.is_group_member(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = g and user_id = auth.uid());
$$;

create function public.is_group_owner(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.groups where id = g and owner = auth.uid());
$$;

-- Whoever creates a group is its first member.
create function public.add_group_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id, role) values (new.id, new.owner, 'owner');
  return new;
end;
$$;

create trigger on_group_created after insert on public.groups
  for each row execute function public.add_group_owner();

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "members see their groups" on public.groups for select to authenticated
  using (public.is_group_member(id) or owner = auth.uid());
create policy "create groups as yourself" on public.groups for insert to authenticated with check (owner = auth.uid());
create policy "owners edit groups" on public.groups for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy "owners delete groups" on public.groups for delete to authenticated using (owner = auth.uid());

create policy "members see who's in" on public.group_members for select to authenticated using (public.is_group_member(group_id));
-- Invite-only: the owner adds people.
create policy "owners add members" on public.group_members for insert to authenticated
  with check (public.is_group_owner(group_id) and role = 'member');
create policy "leave, or owner removes" on public.group_members for delete to authenticated
  using (user_id = auth.uid() or public.is_group_owner(group_id));

/* ---------- Posts can belong to a group ---------- */

alter table public.posts add column group_id uuid references public.groups (id) on delete cascade;
create index posts_group_created_idx on public.posts (group_id, created_at desc);

drop policy "members read posts" on public.posts;
create policy "members read open posts, groups read their own" on public.posts for select to authenticated
  using (group_id is null or public.is_group_member(group_id));

drop policy "post as yourself" on public.posts;
create policy "post as yourself, into groups you're in" on public.posts for insert to authenticated
  with check (author = auth.uid() and (group_id is null or public.is_group_member(group_id)));

-- The main timeline stays to open posts; group posts live in each group.
create or replace function public.timeline(max_posts int default 50)
returns setof public.posts
language sql stable security invoker set search_path = public as $$
  select p.* from public.posts p
  where p.group_id is null
    and (p.author = auth.uid() or p.author in (select followee from public.follows where follower = auth.uid()))
  order by p.created_at desc
  limit max_posts;
$$;

/* ---------- Direct messages ---------- */

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender uuid not null references public.profiles (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  image_path text,
  created_at timestamptz not null default now(),
  check (body <> '' or image_path is not null)
);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

create function public.is_conversation_member(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members where conversation_id = c and user_id = auth.uid());
$$;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "see your conversations" on public.conversations for select to authenticated using (public.is_conversation_member(id));
create policy "see who's in your conversations" on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id));
create policy "read your messages" on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "send as yourself" on public.messages for insert to authenticated
  with check (sender = auth.uid() and public.is_conversation_member(conversation_id));

-- Opens the one-to-one conversation with someone, creating it the first time.
create function public.open_conversation(other uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  found uuid;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if other = me then raise exception 'You can''t message yourself'; end if;
  if not exists (select 1 from public.profiles where id = other) then raise exception 'No such member'; end if;

  select a.conversation_id into found
  from public.conversation_members a
  join public.conversation_members b on b.conversation_id = a.conversation_id and b.user_id = other
  where a.user_id = me
    and (select count(*) from public.conversation_members c where c.conversation_id = a.conversation_id) = 2
  limit 1;
  if found is not null then return found; end if;

  insert into public.conversations default values returning id into found;
  insert into public.conversation_members (conversation_id, user_id) values (found, me), (found, other);
  return found;
end;
$$;

-- Your inbox: each conversation with the other person and the latest message.
create function public.inbox()
returns table (conversation_id uuid, other_id uuid, other_name text, other_avatar text, last_body text, last_at timestamptz, last_from_me boolean)
language sql stable security invoker set search_path = public as $$
  select
    c.conversation_id,
    o.user_id,
    p.name,
    p.avatar_path,
    m.body,
    m.created_at,
    m.sender = auth.uid()
  from public.conversation_members c
  join public.conversation_members o on o.conversation_id = c.conversation_id and o.user_id <> auth.uid()
  join public.profiles p on p.id = o.user_id
  left join lateral (
    select body, created_at, sender from public.messages
    where conversation_id = c.conversation_id order by created_at desc limit 1
  ) m on true
  where c.user_id = auth.uid()
  order by m.created_at desc nulls last;
$$;

/* ---------- Private files ---------- */

-- Paths look like <group or conversation id>/<your user id>/<file>. Only that space can open them.
insert into storage.buckets (id, name, public) values ('private', 'private', false) on conflict (id) do nothing;

create policy "only the space reads private files" on storage.objects for select to authenticated
  using (
    bucket_id = 'private'
    and (public.is_group_member(((storage.foldername(name))[1])::uuid) or public.is_conversation_member(((storage.foldername(name))[1])::uuid))
  );
create policy "upload private files into spaces you're in" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'private'
    and (storage.foldername(name))[2] = auth.uid()::text
    and (public.is_group_member(((storage.foldername(name))[1])::uuid) or public.is_conversation_member(((storage.foldername(name))[1])::uuid))
  );

-- New messages arrive live in an open conversation (Supabase Realtime still applies the policies above).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
