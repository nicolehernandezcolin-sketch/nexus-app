-- Launch: door check-in for tickets, reporting and blocking, and keeping sales
-- records when someone deletes their account.

/* ---------- Door check-in ---------- */

-- A short code shown on each ticket. The host finds it on the door list; each ticket gets in once.
alter table public.tickets
  add column door_code text generated always as (upper(substr(replace(code_secret, '-', ''), 1, 6))) stored,
  add column used_at timestamptz;

create policy "hosts see tickets for their events" on public.tickets for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.host = auth.uid()));

-- Checks a ticket in. Only the event's host can, and only once: a copied code can't get a second person in.
create function public.check_in_ticket(ticket uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t public.tickets;
begin
  select * into t from public.tickets where id = ticket for update;
  if t.id is null then raise exception 'No such ticket'; end if;
  if not exists (select 1 from public.events e where e.id = t.event_id and e.host = auth.uid()) then
    raise exception 'Only the host can check people in';
  end if;
  if t.status = 'refunded' then return jsonb_build_object('result', 'refunded'); end if;
  if t.status = 'used' then return jsonb_build_object('result', 'already', 'used_at', t.used_at); end if;

  update public.tickets set status = 'used', used_at = now() where id = ticket;
  -- Counts as "met in person" for the buyer, which Discover uses for shared events.
  if t.owner is not null then
    insert into public.checkins (event_id, user_id) values (t.event_id, t.owner) on conflict do nothing;
  end if;
  return jsonb_build_object('result', 'ok');
end;
$$;
revoke execute on function public.check_in_ticket(uuid) from public, anon;

/* ---------- Deleting an account keeps the sales record ---------- */

-- Orders and tickets stay (for refunds, payouts and taxes) but no longer point at the person.
alter table public.orders alter column user_id drop not null;
alter table public.orders drop constraint orders_user_id_fkey,
  add constraint orders_user_id_fkey foreign key (user_id) references public.profiles (id) on delete set null;
alter table public.tickets alter column owner drop not null;
alter table public.tickets drop constraint tickets_owner_fkey,
  add constraint tickets_owner_fkey foreign key (owner) references public.profiles (id) on delete set null;

/* ---------- Blocking ---------- */

create table public.blocks (
  blocker uuid not null references public.profiles (id) on delete cascade,
  blocked uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
alter table public.blocks enable row level security;
create policy "see who you blocked" on public.blocks for select to authenticated using (blocker = auth.uid());
create policy "block as yourself" on public.blocks for insert to authenticated with check (blocker = auth.uid());
create policy "unblock as yourself" on public.blocks for delete to authenticated using (blocker = auth.uid());

-- True when either of you has blocked the other.
create function public.blocked_with(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker = auth.uid() and blocked = other) or (blocker = other and blocked = auth.uid())
  );
$$;

-- Blocked people's posts disappear for each other, everywhere.
drop policy "members read open posts, groups read their own" on public.posts;
create policy "members read open posts, groups read their own" on public.posts for select to authenticated
  using ((group_id is null or public.is_group_member(group_id)) and not public.blocked_with(author));

-- No messages either way, in a one-to-one conversation with someone blocked.
drop policy "send as yourself" on public.messages;
create policy "send as yourself" on public.messages for insert to authenticated
  with check (
    sender = auth.uid()
    and public.is_conversation_member(conversation_id)
    and not exists (
      select 1 from public.conversation_members m
      where m.conversation_id = messages.conversation_id and m.user_id <> auth.uid() and public.blocked_with(m.user_id)
    )
  );
drop policy "read your messages" on public.messages;
create policy "read your messages" on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id) and not public.blocked_with(sender));

create or replace function public.open_conversation(other uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  found uuid;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if other = me then raise exception 'You can''t message yourself'; end if;
  if not exists (select 1 from public.profiles where id = other) then raise exception 'No such member'; end if;
  if public.blocked_with(other) then raise exception 'You can''t message this member'; end if;

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

-- Discover never shows people you've blocked or who blocked you.
create or replace function public.discover_people()
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
  where p.discoverable and p.onboarded and p.id <> auth.uid() and not public.blocked_with(p.id);
$$;

/* ---------- Reports ---------- */

-- Members report posts, profiles, messages or groups. Only Nexus reads these (in the Supabase dashboard).
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('post', 'profile', 'message', 'group')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'hate', 'sexual', 'violence', 'stolen_work', 'scam', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "report as yourself" on public.reports for insert to authenticated with check (reporter = auth.uid());
-- No select policy: members can't read reports, including their own.
