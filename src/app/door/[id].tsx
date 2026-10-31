import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../../components/Chrome';
import { Icon } from '../../components/Icon';
import { Button, Card, Tap, text } from '../../components/ui';
import { checkInTicket, fetchDoorList, fetchEvent, TicketRow, useLoad } from '../../lib/api';
import { useDemo } from '../../state/DemoState';
import { colors, fonts } from '../../theme';

/** For hosts at the door: find a ticket by its code or the holder's name and check it in, once. */
export default function DoorList() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast, celebrate } = useDemo();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const loaded = useLoad(async () => {
    const [event, tickets] = await Promise.all([fetchEvent(id), fetchDoorList(id)]);
    return { event, tickets };
  }, [id]);

  const tickets = useMemo(() => loaded.data?.tickets ?? [], [loaded.data]);
  const q = query.trim().toUpperCase().replace(/\s/g, '');
  const shown = q ? tickets.filter((t) => t.door_code.includes(q) || t.holder_name.toUpperCase().replace(/\s/g, '').includes(q)) : tickets;
  const inCount = tickets.filter((t) => t.status === 'used').length;
  const sold = tickets.filter((t) => t.status !== 'refunded').length;

  const checkIn = async (t: TicketRow) => {
    setBusy(t.id);
    try {
      const r = await checkInTicket(t.id);
      const message =
        r.result === 'ok'
          ? `**${t.holder_name}** is in.`
          : r.result === 'already'
            ? `Already used${r.used_at ? ` at ${new Date(r.used_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}. Don’t let a second person in.`
            : 'This ticket was refunded. It doesn’t get in.';
      if (r.result === 'ok') celebrate(message);
      else showToast(message);
      AccessibilityInfo.announceForAccessibility(message.replace(/\*\*/g, ''));
      setQuery('');
      await loaded.reload();
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen header={<BackHeader label="Event" fallback={`/event/${id}`} />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Text style={styles.title} accessibilityRole="header">
        Door list
      </Text>
      {loaded.data?.event ? <Text style={text.sub}>{loaded.data.event.title}</Text> : null}

      <View style={styles.counts} accessible accessibilityLabel={`${inCount} of ${sold} checked in`}>
        <Text style={styles.countBig}>{inCount}</Text>
        <Text style={text.sub}>of {sold} checked in</Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Door code or name</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search by door code or name"
          placeholder="e.g. 5024DE"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
      </View>

      {loaded.loading && !loaded.data ? <ActivityIndicator color={colors.forest} /> : null}
      {loaded.error ? <Text style={text.sub}>{loaded.error}</Text> : null}
      {loaded.data && shown.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={text.sub}>{q ? 'No ticket matches that code or name.' : 'No tickets sold yet.'}</Text>
        </Card>
      ) : null}

      {shown.map((t) => {
        const used = t.status === 'used';
        const refunded = t.status === 'refunded';
        return (
          <View key={t.id} style={[styles.row, (used || refunded) && { opacity: 0.6 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[text.strong, { fontSize: 15 }]}>{t.holder_name}</Text>
              <Text style={text.small}>
                {t.door_code.slice(0, 3)} {t.door_code.slice(3)} · {t.tier_name}
              </Text>
            </View>
            {used ? (
              <View style={styles.status} accessible accessibilityLabel="Checked in">
                <Icon name="check" size={16} color={colors.forest} strokeWidth={2.6} />
                <Text style={styles.statusText}>In</Text>
              </View>
            ) : refunded ? (
              <Text style={styles.statusText}>Refunded</Text>
            ) : (
              <Button
                variant="primary"
                label={busy === t.id ? 'Checking…' : 'Check in'}
                accessibilityLabel={`Check in ${t.holder_name}`}
                onPress={busy ? undefined : () => checkIn(t)}
                style={{ minHeight: 44 }}
              />
            )}
          </View>
        );
      })}

      <Tap accessibilityRole="button" onPress={() => loaded.reload()} style={{ alignSelf: 'center', paddingVertical: 10 }}>
        <Text style={styles.link}>Refresh list</Text>
      </Tap>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  title: { fontFamily: fonts.display800, fontSize: 30, letterSpacing: -0.8, color: colors.ink },
  counts: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  countBig: { fontFamily: fonts.display900, fontSize: 36, color: colors.forest },
  label: { fontFamily: fonts.body600, fontSize: 13.5, color: colors.forest },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    fontFamily: fonts.body600,
    fontSize: 18,
    letterSpacing: 2,
    color: colors.ink,
  },
  empty: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontFamily: fonts.body600, fontSize: 14, color: colors.forest },
  link: { fontFamily: fonts.body600, fontSize: 14, color: colors.forest, textDecorationLine: 'underline' },
});
