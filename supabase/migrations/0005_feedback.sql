-- From early member feedback: profiles people can make their own, raw work and show
-- promos in the timeline, message requests so spam doesn't bury real messages, and
-- show locations for the map.

/* ---------- Profile prompts ---------- */

-- Up to three short answers to Nexus prompts: [{ "q": "Currently making…", "a": "…" }].
alter table public.profiles add column prompts jsonb not null default '[]'
  check (jsonb_typeof(prompts) = 'array' and jsonb_array_length(prompts) <= 3 and char_length(prompts::text) <= 1200);

/* ---------- Posts: raw work and show promos ---------- */

alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check check (kind in ('New work', 'Looking for', 'Crew call', 'Show'));
-- Unedited, unpolished work: phone demos, rehearsal clips, sketches.
alter table public.posts add column raw boolean not null default false;

/* ---------- Events on the map ---------- */

alter table public.events add column lat double precision check (lat between -90 and 90);
alter table public.events add column lng double precision check (lng between -180 and 180);

-- Behind The Curtain is at UC San Diego.
update public.events set lat = 32.8801, lng = -117.2340 where slug = 'curtain' and lat is null;

/* ---------- Message requests ---------- */

-- The inbox now says whether you follow the other person and whether you've written
-- in the conversation, so messages from strangers wait in Requests. Blocked members
-- are left out.
drop function if exists public.inbox();
create function public.inbox()
returns table (
  conversation_id uuid, other_id uuid, other_name text, other_avatar text,
  last_body text, last_at timestamptz, last_from_me boolean, i_follow boolean, i_wrote boolean
)
language sql stable security invoker set search_path = public as $$
  select
    c.conversation_id,
    o.user_id,
    p.name,
    p.avatar_path,
    m.body,
    m.created_at,
    m.sender = auth.uid(),
    exists (select 1 from public.follows f where f.follower = auth.uid() and f.followee = o.user_id),
    exists (select 1 from public.messages w where w.conversation_id = c.conversation_id and w.sender = auth.uid())
  from public.conversation_members c
  join public.conversation_members o on o.conversation_id = c.conversation_id and o.user_id <> auth.uid()
  join public.profiles p on p.id = o.user_id
  left join lateral (
    select body, created_at, sender from public.messages
    where conversation_id = c.conversation_id order by created_at desc limit 1
  ) m on true
  where c.user_id = auth.uid() and not public.blocked_with(o.user_id)
  order by m.created_at desc nulls last;
$$;
grant execute on function public.inbox() to authenticated;
