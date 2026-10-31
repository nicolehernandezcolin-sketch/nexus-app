// Posts from the real database: one card used on the timeline and on profiles.
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { PostKind, postKindColors } from '../data/content';
import { FeedItem, openConversation, requestCollab, setPinned, setSaved } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colorFor, firstNameOf, initialsOf, timeAgo } from '../lib/format';
import { useDemo } from '../state/DemoState';
import { colors } from '../theme';
import { Icon } from './Icon';
import { SafetyMenu } from './Safety';
import { Avatar, Button, Card, Pill, Tap, text } from './ui';

const ctaFor = { 'Looking for': 'I’m interested', 'New work': 'Collaborate', 'Crew call': 'Apply', Show: 'Save the date' } as const;

/** The post's kind, plus a Raw tag for unedited work. */
export function PostTags({ kind, raw }: { kind: PostKind; raw?: boolean }) {
  const c = postKindColors[kind];
  return (
    <View style={{ alignItems: 'flex-end', gap: 4 }}>
      <Pill label={kind} bg={c.bg} fg={c.fg} />
      {raw ? <Pill label="Raw · unedited" bg={colors.cream} fg={colors.forest} style={{ borderWidth: 1, borderColor: colors.line2 }} /> : null}
    </View>
  );
}

/** Opens (or starts) your private conversation with someone, optionally with a message started. */
export async function messageUser(userId: string, draft?: string) {
  const id = await openConversation(userId);
  router.push({ pathname: '/messages/[id]', params: draft ? { id, draft } : { id } });
}

export function openProfile(id: string, myId?: string) {
  if (id === myId) router.push('/profile');
  else router.push({ pathname: '/person/[id]', params: { id } });
}

export function LivePostCard({ item, onChanged, showPin }: { item: FeedItem; onChanged?: () => void; showPin?: boolean }) {
  const { me } = useAuth();
  const { showToast, celebrate } = useDemo();
  const { post: p, author } = item;
  const [saved, setSavedState] = useState(item.saved);
  const mine = me?.id === author.id;

  const toggleSave = async () => {
    setSavedState(!saved);
    try {
      await setSaved(p.id, !saved);
    } catch (e) {
      setSavedState(saved);
      showToast((e as Error).message);
    }
  };

  const collab = async () => {
    try {
      await requestCollab(author.id, p.id);
      celebrate(`Request sent to **${firstNameOf(author.name)}**. They’ll see it next time they open Nexus.`);
    } catch (e) {
      showToast((e as Error).message);
    }
  };

  const pin = async () => {
    try {
      await setPinned(p.id, !p.pinned);
      if (!p.pinned) showToast('Pinned to the **top** of your posts.');
      onChanged?.();
    } catch (e) {
      showToast((e as Error).message);
    }
  };

  return (
    <Card style={[styles.card, (mine && !showPin) || p.pinned ? { borderWidth: 1.5, borderColor: colors.olive } : null]}>
      <Tap accessibilityRole="link" onPress={() => openProfile(author.id, me?.id)} style={styles.author}>
        <Avatar
          initials={initialsOf(author.name)}
          photo={item.avatarUrl ? { uri: item.avatarUrl } : undefined}
          bg={colorFor(author.id)}
        />
        <View style={{ flex: 1 }}>
          <Text style={text.strong}>{author.name || 'New member'}</Text>
          <Text style={text.small}>
            {mine ? 'You' : author.roles[0] ?? author.tagline}
            {' · '}
            {p.pinned ? 'Pinned' : timeAgo(p.created_at)}
          </Text>
        </View>
        <PostTags kind={p.kind} raw={p.raw} />
      </Tap>
      {!mine ? (
        <View style={styles.menu}>
          <SafetyMenu target={{ type: 'post', id: p.id }} person={{ id: author.id, name: author.name }} onBlocked={onChanged} />
        </View>
      ) : null}
      <Text style={text.body}>{p.body}</Text>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} accessibilityLabel={`Photo from ${author.name}`} style={styles.photo} resizeMode="cover" /> : null}
      {mine ? (
        showPin ? (
          <Button
            variant="ghost"
            selected={p.pinned}
            label={p.pinned ? 'Pinned' : 'Pin to top'}
            icon={<Icon name="pin" size={16} color={colors.forest} />}
            style={{ height: 38, alignSelf: 'flex-start' }}
            onPress={pin}
          />
        ) : null
      ) : (
        <View style={styles.actions}>
          {p.kind === 'Show' ? (
            <Button label={saved ? 'Saved' : ctaFor.Show} selected={saved} style={{ flex: 1 }} onPress={toggleSave} />
          ) : (
            <>
              <Button label={ctaFor[p.kind]} style={{ flex: 1 }} onPress={collab} />
              <Button variant="ghost" label={saved ? 'Saved' : 'Save'} selected={saved} onPress={toggleSave} />
            </>
          )}
          <Button
            variant="ghost"
            accessibilityLabel={`Message ${author.name}`}
            style={{ width: 44, paddingHorizontal: 0 }}
            icon={<Icon name="chat" size={18} />}
            onPress={() => messageUser(author.id).catch((e) => showToast((e as Error).message))}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingRight: 30 },
  menu: { position: 'absolute', top: 12, right: 12 },
  photo: { width: '100%', height: 220, borderRadius: 16, backgroundColor: colors.stone },
  actions: { flexDirection: 'row', gap: 8 },
});
