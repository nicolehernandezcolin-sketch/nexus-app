import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PageHeader, Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { Avatar, Pill, Rise, Tap } from '../components/ui';
import { events, NexusEvent } from '../data/content';
import { saleLabel } from '../data/fees';
import { fetchEvents, useLoad } from '../lib/api';
import { useAuth } from '../lib/auth';
import { LiveEvent, toNexusEvent } from '../lib/mappers';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function Events() {
  const { tickets } = useDemo();
  const { live } = useAuth();
  const loaded = useLoad(async () => (live ? (await fetchEvents()).map(toNexusEvent) : events), [live]);
  // Refresh when you come back (e.g. after an RSVP); the first load is already running.
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else if (live) loaded.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live]),
  );
  const list: NexusEvent[] = loaded.data ?? (live ? [] : events);
  return (
    <Screen
      nav
      header={
        <PageHeader
          title="Off the app, into the room"
          sub="See who you follow is going, then go say hi in person."
          right={
            <Tap accessibilityRole="button" accessibilityLabel="My tickets" onPress={() => router.push('/tickets')} style={styles.wallet}>
              <Icon name="ticket" size={20} color={colors.lime} />
              {tickets.length ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tickets.length}</Text>
                </View>
              ) : null}
            </Tap>
          }
        />
      }
      contentStyle={styles.list}
    >
      {live && loaded.loading && !loaded.data ? <ActivityIndicator color={colors.forest} style={{ marginVertical: 24 }} /> : null}
      {live && loaded.error ? <Text style={styles.meta}>Couldn’t load events: {loaded.error}</Text> : null}
      {live && loaded.data?.length === 0 ? <Text style={styles.meta}>No events yet.</Text> : null}
      {list.map((e, i) => (
        <Rise key={e.id} delay={i * 80}>
          <EventCard event={e} />
        </Rise>
      ))}
    </Screen>
  );
}

const friendColors = [colors.olive, colors.forest, colors.lime];

function EventCard({ event: e }: { event: NexusEvent }) {
  const { tickets, drawings } = useDemo();
  const dark = !!e.featured;
  const fg = dark ? colors.cream : colors.ink;
  const subtle = dark ? colors.creamMuted : colors.muted;

  const liveRow = (e as Partial<LiveEvent>).live;
  const mine = liveRow ? (liveRow.mine ? 1 : 0) : tickets.filter((t) => t.eventId === e.id).length;
  const entered = liveRow ? liveRow.entered : drawings[e.id];
  const status = mine ? (e.sale.kind === 'free' ? 'Going' : `${mine} ticket${mine > 1 ? 's' : ''}`) : entered ? 'Entered' : null;
  const open = () => router.push({ pathname: '/event/[id]', params: { id: e.id } });

  return (
    <Tap accessibilityRole="button" accessibilityLabel={`${e.title}, ${e.when}`} onPress={open} style={[styles.card, { backgroundColor: dark ? colors.forest : colors.paper }]}>
      <View style={styles.top}>
        <View style={[styles.date, { backgroundColor: dark ? colors.lime : colors.stone }]}>
          <Text style={[styles.month, { fontSize: e.month.length > 3 ? 9 : 11, color: dark ? colors.ink : colors.forest }]}>{e.month}</Text>
          <Text style={[styles.day, { color: dark ? colors.ink : colors.forest }]}>{e.day}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Pill
            label={e.badge}
            bg={dark ? colors.ink : colors.limeSoft}
            fg={dark ? colors.lime : colors.forest}
            style={{ paddingVertical: 3, paddingHorizontal: 9 }}
          />
          <Text style={[styles.title, { color: fg }]}>{e.title}</Text>
          <Text style={[styles.meta, { color: subtle }]}>{e.meta}</Text>
        </View>
      </View>
      <View style={styles.bottom}>
        <View style={{ flexDirection: 'row' }}>
          {e.friends.map((f, j) => (
            <View key={f} style={{ marginLeft: j ? -8 : 0 }}>
              <Avatar
                initials={f}
                size={28}
                bg={friendColors[j % 3]}
                fg={j % 3 === 2 ? colors.ink : colors.cream}
                ring={dark ? colors.forest : colors.paper}
              />
            </View>
          ))}
        </View>
        <Text style={[styles.meta, { flex: 1, color: subtle }]}>{e.friendsText}</Text>
        <View
          style={[
            styles.cta,
            { borderColor: status || dark ? colors.lime : colors.forest, backgroundColor: status ? colors.lime : 'transparent' },
          ]}
        >
          {status ? <Icon name="check" size={14} strokeWidth={2.6} /> : null}
          <Text style={[styles.ctaText, { color: status ? colors.ink : dark ? colors.lime : colors.forest }]}>{status ?? saleLabel(e.sale)}</Text>
        </View>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20, gap: 14 },
  wallet: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.display800, fontSize: 10, color: colors.ink },
  card: { borderRadius: 22, padding: 16, gap: 14 },
  top: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  date: { width: 62, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 4 },
  month: { fontFamily: fonts.display700, letterSpacing: 1 },
  day: { fontFamily: fonts.display800, fontSize: 22, lineHeight: 22 },
  title: { fontFamily: fonts.display700, fontSize: 18, lineHeight: 21 },
  meta: { fontFamily: fonts.body400, fontSize: 12.5, lineHeight: 18 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cta: { height: 36, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  ctaText: { fontFamily: fonts.body600, fontSize: 12.5 },
});
