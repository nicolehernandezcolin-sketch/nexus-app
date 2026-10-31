import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../../components/Chrome';
import { PrivateBadge } from '../../components/Groups';
import { Icon } from '../../components/Icon';
import { Avatar, Card, Pill, Rise, Tap, text } from '../../components/ui';
import { demoConversations } from '../../data/content';
import { fetchInbox, useLoad } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colorFor, initialsOf, timeAgo } from '../../lib/format';
import { suspicion } from '../../lib/spam';
import { useDemo } from '../../state/DemoState';
import { colors, fonts } from '../../theme';

type Row = {
  id: string;
  name: string;
  initials: string;
  color: string;
  photo?: string;
  last: string;
  time: string;
  /** From someone you don't follow and haven't written to. */
  request: boolean;
  flag: string | null;
};

export default function Inbox() {
  const { live } = useAuth();
  const { sentMessages } = useDemo();
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState<'inbox' | 'requests'>('inbox');
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
        request: !r.i_follow && !r.i_wrote,
        flag: r.last_body && !r.last_from_me ? suspicion(r.last_body) : null,
      }))
    : demoConversations.map((c) => {
        const all = [...c.messages, ...(sentMessages[c.id] ?? [])];
        const last = all[all.length - 1];
        const wrote = all.some((m) => m.from === 'me');
        return {
          id: c.id,
          name: c.name,
          initials: c.initials,
          color: c.avatar,
          last: `${last.from === 'me' ? 'You: ' : ''}${last.body}`,
          time: last.time,
          request: !!c.request && !wrote,
          flag: last.from === 'them' ? suspicion(last.body) : null,
        };
      });

  const shown = rows.filter((r) => r.request === (box === 'requests'));

  return (
    <Screen header={<BackHeader label="Timeline" fallback="/timeline" />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Text style={styles.title} accessibilityRole="header">
        Messages
      </Text>
      <PrivateBadge label="Private · only the two of you" />
      <Text style={text.sub}>Share full-quality work one to one instead of posting it. Photos you send open only for the person you sent them to.</Text>

      <View style={styles.boxes} accessibilityRole="tablist">
        {(['inbox', 'requests'] as const).map((b) => {
          const on = box === b;
          const count = rows.filter((r) => r.request === (b === 'requests')).length;
          return (
            <Tap
              key={b}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setBox(b)}
              style={[styles.box, on && { backgroundColor: colors.forest, borderColor: colors.forest }]}
            >
              <Text style={[styles.boxText, on && { color: colors.lime }]}>
                {b === 'inbox' ? 'Inbox' : 'Requests'}
                {b === 'requests' && count ? ` · ${count}` : ''}
              </Text>
            </Tap>
          );
        })}
      </View>
      {box === 'requests' ? (
        <View style={styles.note}>
          <Icon name="shield" size={18} color={colors.forest} />
          <Text style={[text.small, { flex: 1 }]}>
            From people you don’t follow. They can’t tell if you’ve read them. Reply to move one to your inbox, or tap ••• inside to report or
            block. Ads and paid-promo offers break the community rules.
          </Text>
        </View>
      ) : null}

      {live && loaded.loading && !loaded.data ? <ActivityIndicator color={colors.forest} /> : null}
      {!(live && loaded.loading) && !shown.length ? (
        <Text style={text.sub}>
          {box === 'requests' ? 'No requests. Messages from people you don’t follow land here.' : 'No conversations yet. Tap Message on someone’s profile or post to start one.'}
        </Text>
      ) : null}

      {shown.map((r, i) => (
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
                {r.flag ? (
                  <Pill label={`⚠ ${r.flag}`} bg={colors.ink} fg={colors.lime} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                ) : null}
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
  boxes: { flexDirection: 'row', gap: 8 },
  box: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: colors.line2, justifyContent: 'center' },
  boxText: { fontFamily: fonts.body600, fontSize: 13.5, color: colors.forest },
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.paper, borderRadius: 16, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
});
