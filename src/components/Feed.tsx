// Posts from the real database: one card used on the timeline and on profiles.
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { postKindColors } from '../data/content';
import { FeedItem, openConversation, requestCollab, setPinned, setSaved } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colorFor, firstNameOf, initialsOf, timeAgo } from '../lib/format';
import { useDemo } from '../state/DemoState';
import { colors } from '../theme';
import { Icon } from './Icon';
import { Avatar, Button, Card, Pill, Tap, text } from './ui';

const ctaFor = { 'Looking for': 'I’m interested', 'New work': 'Collaborate', 'Crew call': 'Apply' } as const;

/** Opens (or starts) your private conversation with someone. */
export async function messageUser(userId: string) {
  const id = await openConversation(userId);
  router.push({ pathname: '/messages/[id]', params: { id } });
}

export function openProfile(id: string, myId?: string) {
  if (id === myId) router.push('/profile');
  else router.push({ pathname: '/person/[id]', params: { id } });
}

export function LivePostCard({ item, onChanged, showPin }: { item: FeedItem; onChanged?: () => void; showPin?: boolean }) {
  const { me } = useAuth();
  const { showToast } = useDemo();
  const { post: p, author } = item;
  const [saved, setSavedState] = useState(item.saved);
  const mine = me?.id === author.id;
  const kind = postKindColors[p.kind];

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
      showToast(`Request sent to **${firstNameOf(author.name)}**. They’ll see it next time they open Nexus.`);
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
        <Pill label={p.kind} bg={kind.bg} fg={kind.fg} />
      </Tap>
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
          <Button label={ctaFor[p.kind]} style={{ flex: 1 }} onPress={collab} />
          <Button variant="ghost" label={saved ? 'Saved' : 'Save'} selected={saved} onPress={toggleSave} />
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
  author: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  photo: { width: '100%', height: 220, borderRadius: 16, backgroundColor: colors.stone },
  actions: { flexDirection: 'row', gap: 8 },
});
