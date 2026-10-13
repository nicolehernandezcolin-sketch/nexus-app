import { StyleSheet, Text, View } from 'react-native';
import { PageHeader, Screen } from '../components/Chrome';
import { Avatar, Pill, Rise, Tap } from '../components/ui';
import { events, NexusEvent } from '../data/content';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function Events() {
  return (
    <Screen
      nav
      header={<PageHeader title="Off the app, into the room" sub="See who you follow is going, then go say hi in person." />}
      contentStyle={styles.list}
    >
      {events.map((e, i) => (
        <Rise key={e.id} delay={i * 80}>
          <EventCard event={e} />
        </Rise>
      ))}
    </Screen>
  );
}

const friendColors = [colors.olive, colors.forest, colors.lime];

function EventCard({ event: e }: { event: NexusEvent }) {
  const { going, toggleGoing, showToast } = useDemo();
  const dark = !!e.featured;
  const on = !!going[e.id];
  const fg = dark ? colors.cream : colors.ink;
  const subtle = dark ? colors.creamMuted : colors.muted;

  const onPress = () => {
    if (!on) showToast('You’re going. See you **in person**.');
    toggleGoing(e.id);
  };

  return (
    <View style={[styles.card, { backgroundColor: dark ? colors.forest : colors.paper }]}>
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
        <Tap
          accessibilityRole="button"
          accessibilityState={{ selected: on }}
          onPress={onPress}
          style={[
            styles.going,
            { borderColor: on || dark ? colors.lime : colors.forest, backgroundColor: on ? colors.lime : 'transparent' },
          ]}
        >
          <Text style={[styles.goingText, { color: on ? colors.ink : dark ? colors.lime : colors.forest }]}>
            {on ? 'Going' : 'I’m going'}
          </Text>
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20, gap: 14 },
  card: { borderRadius: 22, padding: 16, gap: 14 },
  top: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  date: { width: 62, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 4 },
  month: { fontFamily: fonts.display700, letterSpacing: 1 },
  day: { fontFamily: fonts.display800, fontSize: 22, lineHeight: 22 },
  title: { fontFamily: fonts.display700, fontSize: 18, lineHeight: 21 },
  meta: { fontFamily: fonts.body400, fontSize: 12.5, lineHeight: 18 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  going: { height: 40, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 16, justifyContent: 'center' },
  goingText: { fontFamily: fonts.body600, fontSize: 13.5 },
});
