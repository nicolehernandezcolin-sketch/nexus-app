// Everything the app reads from and writes to Supabase. Screens call these in live mode.
import { useCallback, useEffect, useState } from 'react';
import { PostKind } from '../data/content';
import { db } from './supabase';

/* ---------- Row types (mirror supabase/migrations) ---------- */

export type HeaderRow = { cover: string; pattern: 'none' | 'waves' | 'grid' | 'dots' };

export type ProfileRow = {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  location: string;
  roles: string[];
  open_to: string[];
  skills: string[];
  projects: string[];
  avatar_path: string | null;
  header: HeaderRow;
  suggest: boolean;
  discoverable: boolean;
  personalize: boolean;
  mix_others: boolean;
  reminder: boolean;
  quiet_hours: boolean;
  onboarded: boolean;
  created_at: string;
};

export type PostRow = {
  id: string;
  author: string;
  kind: PostKind;
  body: string;
  image_path: string | null;
  pinned: boolean;
  group_id: string | null;
  created_at: string;
};

export type Tier = { id: string; name: string; price: number; note?: string };

export type EventRow = {
  id: string;
  slug: string | null;
  host: string;
  title: string;
  badge: string;
  starts_on: string | null;
  when_text: string;
  where_text: string;
  about: string;
  cover_path: string | null;
  sale_kind: 'tickets' | 'free' | 'drawing';
  tiers: Tier[];
  featured: boolean;
};

export type WorkModuleRow = { id: string; owner: string; title: string; blurb: string; position: number; hidden: boolean };
export type WorkItemRow = {
  id: string;
  module_id: string;
  owner: string;
  title: string;
  detail: string;
  kind: string;
  about: string;
  image_path: string | null;
  event_id: string | null;
  position: number;
};

export type DiscoverRow = {
  id: string;
  name: string;
  tagline: string;
  location: string;
  roles: string[];
  open_to: string[];
  skills: string[];
  projects: string[];
  avatar_path: string | null;
  shared_at: string[];
  mutuals: string[];
  following: boolean;
};

/** Map from the demo's switch ids to profile columns. */
export const optionColumns = {
  suggest: 'suggest',
  discover: 'discoverable',
  personal: 'personalize',
  others: 'mix_others',
  reminder: 'reminder',
  quiet: 'quiet_hours',
} as const;

/* ---------- Helpers ---------- */

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function myId() {
  const { data } = await db().auth.getUser();
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

/** Load something once, with a way to reload it after a change. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await run());
      setError(undefined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [run]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

/* ---------- Files: private buckets, short-lived links ---------- */

type Bucket = 'avatars' | 'media' | 'private';

/** Uploads a picked image into the member's own folder and returns its storage path. */
export async function uploadImage(bucket: Bucket, uri: string, space?: string) {
  const uid = await myId();
  const blob = await (await fetch(uri)).arrayBuffer();
  const type = uri.startsWith('data:') ? uri.slice(5, uri.indexOf(';')) : 'image/jpeg';
  const ext = type.split('/')[1] ?? 'jpg';
  // Private files sit under the group or conversation they belong to.
  const path = `${space ? `${space}/` : ''}${uid}/${Date.now()}.${ext}`;
  check(await db().storage.from(bucket).upload(path, blob, { contentType: type, upsert: false }));
  return path;
}

/** Signed links that expire after an hour, so files only load for signed-in members. */
export async function signedUrls(bucket: Bucket, paths: (string | null | undefined)[]) {
  const wanted = [...new Set(paths.filter((p): p is string => !!p))];
  if (!wanted.length) return {} as Record<string, string>;
  const rows = check(await db().storage.from(bucket).createSignedUrls(wanted, 3600));
  return Object.fromEntries(rows.filter((r) => r.signedUrl).map((r) => [r.path, r.signedUrl])) as Record<string, string>;
}

/* ---------- Profiles ---------- */

export async function getProfile(id: string) {
  return check(await db().from('profiles').select('*').eq('id', id).single()) as ProfileRow;
}

export async function getProfiles(ids: string[]) {
  if (!ids.length) return [] as ProfileRow[];
  return check(await db().from('profiles').select('*').in('id', ids)) as ProfileRow[];
}

export async function updateMyProfile(patch: Partial<Omit<ProfileRow, 'id' | 'created_at'>>) {
  const uid = await myId();
  return check(await db().from('profiles').update(patch).eq('id', uid).select('*').single()) as ProfileRow;
}

export async function avatarUrls(profiles: { avatar_path: string | null }[]) {
  return signedUrls('avatars', profiles.map((p) => p.avatar_path));
}

/* ---------- Posts ---------- */

export type FeedItem = { post: PostRow; author: ProfileRow; imageUrl?: string; avatarUrl?: string; saved: boolean };

async function decorate(posts: PostRow[]): Promise<FeedItem[]> {
  const uid = await myId();
  const authors = await getProfiles([...new Set(posts.map((p) => p.author))]);
  const byId = Object.fromEntries(authors.map((a) => [a.id, a]));
  const [images, privateImages, avatars, saves] = await Promise.all([
    signedUrls('media', posts.filter((p) => !p.group_id).map((p) => p.image_path)),
    signedUrls('private', posts.filter((p) => p.group_id).map((p) => p.image_path)),
    avatarUrls(authors),
    posts.length
      ? db().from('saves').select('post_id').eq('user_id', uid).in('post_id', posts.map((p) => p.id))
      : Promise.resolve({ data: [], error: null }),
  ]);
  const saved = new Set((check(saves) as { post_id: string }[]).map((s) => s.post_id));
  return posts
    .filter((p) => byId[p.author])
    .map((p) => ({
      post: p,
      author: byId[p.author],
      imageUrl: p.image_path ? (p.group_id ? privateImages : images)[p.image_path] : undefined,
      avatarUrl: byId[p.author].avatar_path ? avatars[byId[p.author].avatar_path!] : undefined,
      saved: saved.has(p.id),
    }));
}

/** You and the people you follow, newest first. */
export async function fetchTimeline() {
  return decorate(check(await db().rpc('timeline', { max_posts: 50 })) as PostRow[]);
}

export async function fetchPostsBy(userId: string) {
  const rows = check(
    await db().from('posts').select('*').eq('author', userId).is('group_id', null).order('pinned', { ascending: false }).order('created_at', { ascending: false }),
  ) as PostRow[];
  return decorate(rows);
}

/** Posts to everyone on Nexus, or privately into a group when `groupId` is set. */
export async function createPost(kind: PostKind, body: string, imageUri?: string, groupId?: string) {
  const author = await myId();
  const image_path = imageUri ? await uploadImage(groupId ? 'private' : 'media', imageUri, groupId) : null;
  return check(
    await db().from('posts').insert({ author, kind, body, image_path, group_id: groupId ?? null }).select('*').single(),
  ) as PostRow;
}

export async function setSaved(postId: string, saved: boolean) {
  const uid = await myId();
  if (saved) check(await db().from('saves').upsert({ user_id: uid, post_id: postId }));
  else check(await db().from('saves').delete().eq('user_id', uid).eq('post_id', postId));
}

/** Only one pinned post per profile. */
export async function setPinned(postId: string, pinned: boolean) {
  const uid = await myId();
  if (pinned) check(await db().from('posts').update({ pinned: false }).eq('author', uid).eq('pinned', true));
  check(await db().from('posts').update({ pinned }).eq('id', postId));
}

export async function requestCollab(toUser: string, postId?: string) {
  const from_user = await myId();
  check(await db().from('collab_requests').insert({ from_user, to_user: toUser, post_id: postId ?? null }));
}

/* ---------- Following and Discover ---------- */

export async function setFollowing(userId: string, following: boolean) {
  const uid = await myId();
  if (following) check(await db().from('follows').upsert({ follower: uid, followee: userId }));
  else check(await db().from('follows').delete().eq('follower', uid).eq('followee', userId));
}

export async function isFollowing(userId: string) {
  const uid = await myId();
  const rows = check(await db().from('follows').select('followee').eq('follower', uid).eq('followee', userId)) as unknown[];
  return rows.length > 0;
}

export async function discoverPeople() {
  const rows = check(await db().rpc('discover_people')) as DiscoverRow[];
  const avatars = await avatarUrls(rows);
  return rows.map((r) => ({ ...r, avatarUrl: r.avatar_path ? avatars[r.avatar_path] : undefined }));
}

/* ---------- Work ---------- */

export async function fetchWork(ownerId: string) {
  const [modules, items] = await Promise.all([
    db().from('work_modules').select('*').eq('owner', ownerId).order('position'),
    db().from('work_items').select('*').eq('owner', ownerId).order('position'),
  ]);
  const itemRows = check(items) as WorkItemRow[];
  const images = await signedUrls('media', itemRows.map((i) => i.image_path));
  return {
    modules: check(modules) as WorkModuleRow[],
    items: itemRows.map((i) => ({ ...i, imageUrl: i.image_path ? images[i.image_path] : undefined })),
  };
}

/* ---------- Events ---------- */

export type EventView = EventRow & { going: number; mine: boolean; entered: boolean; coverUrl?: string; hostName: string };

export async function fetchEvents(): Promise<EventView[]> {
  const uid = await myId();
  const events = check(await db().from('events').select('*').order('starts_on', { ascending: true, nullsFirst: false })) as EventRow[];
  const ids = events.map((e) => e.id);
  if (!ids.length) return [];
  const [rsvps, entries, covers, hosts] = await Promise.all([
    db().from('rsvps').select('event_id, user_id').in('event_id', ids),
    db().from('drawing_entries').select('event_id').eq('user_id', uid),
    signedUrls('media', events.map((e) => e.cover_path)),
    getProfiles([...new Set(events.map((e) => e.host))]),
  ]);
  const r = check(rsvps) as { event_id: string; user_id: string }[];
  const entered = new Set((check(entries) as { event_id: string }[]).map((x) => x.event_id));
  return events.map((e) => ({
    ...e,
    going: r.filter((x) => x.event_id === e.id).length,
    mine: r.some((x) => x.event_id === e.id && x.user_id === uid),
    entered: entered.has(e.id),
    coverUrl: e.cover_path ? covers[e.cover_path] : undefined,
    hostName: hosts.find((h) => h.id === e.host)?.name || 'Nexus',
  }));
}

export async function fetchEvent(idOrSlug: string) {
  const all = await fetchEvents();
  return all.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
}

export async function setRsvp(eventId: string, going: boolean) {
  const uid = await myId();
  if (going) check(await db().from('rsvps').upsert({ event_id: eventId, user_id: uid }));
  else check(await db().from('rsvps').delete().eq('event_id', eventId).eq('user_id', uid));
}

export async function enterDrawing(eventId: string) {
  const uid = await myId();
  check(await db().from('drawing_entries').upsert({ event_id: eventId, user_id: uid }));
}

export async function fetchTeam(eventId: string) {
  const rows = check(await db().from('event_team').select('person, part').eq('event_id', eventId)) as { person: string; part: string }[];
  const people = await getProfiles(rows.map((r) => r.person));
  const avatars = await avatarUrls(people);
  return rows
    .map((r) => {
      const p = people.find((x) => x.id === r.person);
      return p ? { ...r, profile: p, avatarUrl: p.avatar_path ? avatars[p.avatar_path] : undefined } : null;
    })
    .filter((x) => !!x);
}

/** Events someone was checked in at, for "Met in person at". */
export async function fetchCheckins(userId: string) {
  const rows = check(await db().from('checkins').select('event_id').eq('user_id', userId)) as { event_id: string }[];
  if (!rows.length) return [] as string[];
  const events = check(await db().from('events').select('title').in('id', rows.map((r) => r.event_id))) as { title: string }[];
  return events.map((e) => e.title);
}

export async function fetchWorkItem(id: string) {
  const item = check(await db().from('work_items').select('*').eq('id', id).single()) as WorkItemRow;
  const [module, owner, images, event] = await Promise.all([
    db().from('work_modules').select('title').eq('id', item.module_id).single(),
    getProfile(item.owner),
    signedUrls('media', [item.image_path]),
    item.event_id ? fetchEvent(item.event_id) : Promise.resolve(undefined),
  ]);
  return {
    item,
    moduleTitle: (check(module) as { title: string }).title,
    owner,
    imageUrl: item.image_path ? images[item.image_path] : undefined,
    event,
  };
}

/* ---------- Private groups ---------- */

export type GroupRow = { id: string; owner: string; name: string; about: string; created_at: string };
export type GroupView = GroupRow & { members: number };

export async function fetchMyGroups(): Promise<GroupView[]> {
  const groups = check(await db().from('groups').select('*').order('created_at', { ascending: false })) as GroupRow[];
  if (!groups.length) return [];
  const members = check(await db().from('group_members').select('group_id').in('group_id', groups.map((g) => g.id))) as { group_id: string }[];
  return groups.map((g) => ({ ...g, members: members.filter((m) => m.group_id === g.id).length }));
}

export async function createGroup(name: string, about: string) {
  const owner = await myId();
  return check(await db().from('groups').insert({ owner, name, about }).select('*').single()) as GroupRow;
}

export async function fetchGroup(id: string) {
  const group = check(await db().from('groups').select('*').eq('id', id).single()) as GroupRow;
  const rows = check(await db().from('group_members').select('user_id, role').eq('group_id', id)) as { user_id: string; role: string }[];
  const people = await getProfiles(rows.map((r) => r.user_id));
  const posts = check(await db().from('posts').select('*').eq('group_id', id).order('created_at', { ascending: false })) as PostRow[];
  return { group, members: people, posts: await decorate(posts) };
}

export async function addGroupMember(groupId: string, userId: string) {
  check(await db().from('group_members').insert({ group_id: groupId, user_id: userId }));
}

export async function leaveGroup(groupId: string) {
  const uid = await myId();
  check(await db().from('group_members').delete().eq('group_id', groupId).eq('user_id', uid));
}

/** People you follow, for inviting into a group. */
export async function fetchFollowing() {
  const uid = await myId();
  const rows = check(await db().from('follows').select('followee').eq('follower', uid)) as { followee: string }[];
  return getProfiles(rows.map((r) => r.followee));
}

/* ---------- Direct messages ---------- */

export type InboxRow = {
  conversation_id: string;
  other_id: string;
  other_name: string;
  other_avatar: string | null;
  last_body: string | null;
  last_at: string | null;
  last_from_me: boolean | null;
};

export type MessageRow = { id: string; conversation_id: string; sender: string; body: string; image_path: string | null; created_at: string };

export async function fetchInbox() {
  const rows = check(await db().rpc('inbox')) as InboxRow[];
  const avatars = await signedUrls('avatars', rows.map((r) => r.other_avatar));
  return rows.map((r) => ({ ...r, avatarUrl: r.other_avatar ? avatars[r.other_avatar] : undefined }));
}

export async function openConversation(otherId: string) {
  return check(await db().rpc('open_conversation', { other: otherId })) as string;
}

export async function fetchConversation(id: string) {
  const uid = await myId();
  const members = check(await db().from('conversation_members').select('user_id').eq('conversation_id', id)) as { user_id: string }[];
  const other = (await getProfiles(members.map((m) => m.user_id).filter((m) => m !== uid)))[0];
  const messages = check(await db().from('messages').select('*').eq('conversation_id', id).order('created_at')) as MessageRow[];
  const images = await signedUrls('private', messages.map((m) => m.image_path));
  return { me: uid, other, messages: messages.map((m) => ({ ...m, imageUrl: m.image_path ? images[m.image_path] : undefined })) };
}

export async function sendMessage(conversationId: string, body: string, imageUri?: string) {
  const sender = await myId();
  const image_path = imageUri ? await uploadImage('private', imageUri, conversationId) : null;
  check(await db().from('messages').insert({ conversation_id: conversationId, sender, body, image_path }));
}
