import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../../components/Chrome';
import { PrivateBadge } from '../../components/Groups';
import { Avatar, Card, Rise, Tap, text } from '../../components/ui';
import { demoConversations } from '../../data/content';
import { fetchInbox, useLoad } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colorFor, initialsOf, timeAgo } from '../../lib/format';
import { useDemo } from '../../state/DemoState';
import { colors, fonts } from '../../theme';

type Row = { id: string; name: string; initials: string; color: string; photo?: string; last: string; time: string };

export default function Inbox() {
  const { live } = useAuth();
  const { sentMessages } = useDemo();
  const insets = useSafeAreaInsets();
  const loaded = useLoad(async () => (live ? fetchInbox() : []), [live]);
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else if (live) loaded.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live]),
  );

  const rows: Row[] = live
    ? (loaded.data ?? []).map((r) => ({
        id: r.conversation_id,
        name: r.other_name || 'Member',
        initials: initialsOf(r.other_name),
        color: colorFor(r.other_id),
        photo: r.avatarUrl,
        last: r.last_body ? `${r.last_from_me ? 'You: ' : ''}${r.last_body || 'Photo'}` : 'No messages yet',
        time: r.last_at ? timeAgo(r.last_at) : '',
      }))
    : demoConversations.map((c) => {
        const all = [...c.messages, ...(sentMessages[c.id] ?? [])];
        const last = all[all.length - 1];
        return { id: c.id, name: c.name, initials: c.initials, color: c.avatar, last: `${last.from === 'me' ? 'You: ' : ''}${last.body}`, time: last.time };
      });

  return (
    <Screen header={<BackHeader label="Timeline" fallback="/timeline" />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Text style={styles.title} accessibilityRole="header">
        Messages
      </Text>
      <PrivateBadge label="Private · only the two of you" />
      <Text style={text.sub}>Share full-quality work one to one instead of posting it. Photos you send open only for the person you sent them to.</Text>

      {live && loaded.loading && !loaded.data ? <ActivityIndicator color={colors.forest} /> : null}
      {live && loaded.data?.length === 0 ? (
        <Text style={text.sub}>No conversations yet. Tap Message on someone’s profile or post to start one.</Text>
      ) : null}

      {rows.map((r, i) => (
        <Rise key={r.id} delay={i * 60}>
          <Tap accessibilityRole="button" onPress={() => router.push({ pathname: '/messages/[id]', params: { id: r.id } })}>
            <Card style={styles.row}>
              <Avatar initials={r.initials} photo={r.photo ? { uri: r.photo } : undefined} bg={r.color} size={46} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={[text.strong, { flex: 1 }]} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={text.small}>{r.time}</Text>
                </View>
                <Text style={text.small} numberOfLines={1}>
                  {r.last}
                </Text>
              </View>
            </Card>
          </Tap>
        </Rise>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },
  title: { fontFamily: fonts.display800, fontSize: 30, letterSpacing: -0.8, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
});
