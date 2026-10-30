import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../components/Chrome';
import { Avatar, Button, Card, text } from '../components/ui';
import { fetchBlocked, unblockMember, useLoad } from '../lib/api';
import { colorFor, initialsOf } from '../lib/format';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

/** People you've blocked, with a way to unblock them. */
export default function Blocked() {
  const { showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const loaded = useLoad(fetchBlocked, []);
  const [busy, setBusy] = useState<string | null>(null);

  const unblock = async (id: string, name: string) => {
    setBusy(id);
    try {
      await unblockMember(id);
      showToast(`**${name || 'Member'}** is unblocked.`);
      await loaded.reload();
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen header={<BackHeader label="Settings" fallback="/privacy" />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Text style={styles.title} accessibilityRole="header">
        Blocked members
      </Text>
      <Text style={text.sub}>Blocked members can’t message you, and you don’t see each other’s posts. They aren’t told.</Text>
      {loaded.loading && !loaded.data ? <ActivityIndicator color={colors.forest} /> : null}
      {loaded.data && loaded.data.length === 0 ? (
        <Card style={{ padding: 16 }}>
          <Text style={text.sub}>You haven’t blocked anyone.</Text>
        </Card>
      ) : null}
      {(loaded.data ?? []).map((p) => (
        <View key={p.id} style={styles.row}>
          <Avatar initials={initialsOf(p.name)} bg={colorFor(p.id)} size={40} />
          <Text style={[text.strong, { flex: 1 }]}>{p.name || 'Member'}</Text>
          <Button
            variant="ghost"
            label={busy === p.id ? '…' : 'Unblock'}
            accessibilityLabel={`Unblock ${p.name || 'member'}`}
            onPress={busy ? undefined : () => unblock(p.id, p.name)}
          />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  title: { fontFamily: fonts.display800, fontSize: 30, letterSpacing: -0.8, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.paper },
});
