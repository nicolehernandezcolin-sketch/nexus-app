import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { Button, Card, Pill, Switch, Tap, text } from '../components/ui';
import { aiProtections, OptionId, privacySections } from '../data/content';
import { deleteMyAccount, optionColumns } from '../lib/api';
import { legal, openPage } from '../lib/links';
import { useAuth } from '../lib/auth';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function Privacy() {
  const { options: demoOptions, toggleOption: toggleDemo, showToast } = useDemo();
  const { live, me, saveMe, signOut } = useAuth();
  // With an account, switches read and save your profile; otherwise they're the demo's.
  const options: Partial<Record<OptionId, boolean>> =
    live && me ? Object.fromEntries(Object.entries(optionColumns).map(([k, col]) => [k, me[col]])) : demoOptions;
  const toggleOption = (id: OptionId) => {
    if (!live) return toggleDemo(id);
    saveMe({ [optionColumns[id]]: !options[id] }).catch((e) => showToast((e as Error).message));
  };
  const insets = useSafeAreaInsets();

  const back = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  // The live app only shows switches that change something today, and only protections it really has.
  const sections = live
    ? privacySections
        .map((s) => ({ ...s, rows: s.rows.filter((r) => !r.id || r.id === 'discover') }))
        .filter((s) => s.rows.length)
    : privacySections;
  const protections = live ? liveProtections : aiProtections;

  return (
    <Screen
      header={
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={back} style={styles.back}>
            <Icon name="back" size={18} color={colors.forest} strokeWidth={2.2} />
            <Text style={styles.backText}>Profile</Text>
          </Pressable>
          <Text style={text.title} accessibilityRole="header">
            Your rules
          </Text>
          <Text style={text.sub}>Everything is off until you turn it on. Change it any time.</Text>
        </View>
      }
      contentStyle={[styles.body, { paddingBottom: 28 + insets.bottom }]}
    >
      {sections.map((s) => (
        <View key={s.title} style={{ gap: 8 }}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Card style={{ borderRadius: 20 }}>
            {s.rows.map((r, i) => (
              <View key={r.title} style={[styles.row, i > 0 && styles.divider]}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[text.strong, { fontSize: 14.5 }]}>{r.title}</Text>
                  <Text style={text.small}>{r.detail}</Text>
                </View>
                {r.id ? (
                  <Switch label={r.title} value={!!options[r.id]} onToggle={() => toggleOption(r.id!)} />
                ) : (
                  <Pill label="Always on" bg={colors.limeSoft} fg={colors.forest} style={{ paddingVertical: 6 }} />
                )}
              </View>
            ))}
          </Card>
        </View>
      ))}

      <View style={styles.ai}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="shield" size={24} color={colors.lime} />
          <Text style={styles.aiTitle} accessibilityRole="header">
            AI protection is on
          </Text>
        </View>
        <Text style={styles.aiText}>Every upload is protected the moment you post it. This can’t be turned off.</Text>
        {protections.map((x) => (
          <View key={x} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Icon name="check" size={16} color={colors.lime} strokeWidth={2.6} />
            <Text style={[styles.aiText, { flex: 1, color: colors.cream }]}>{x}</Text>
          </View>
        ))}
      </View>
      {live ? (
        <>
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionTitle}>Account and help</Text>
            <Card style={{ borderRadius: 20 }}>
              <LinkRow label="Blocked members" onPress={() => router.push('/blocked')} first />
              <LinkRow label="Terms and community guidelines" onPress={() => openPage(legal.terms)} external />
              <LinkRow label="Ticket terms and refunds" onPress={() => openPage(legal.tickets)} external />
              <LinkRow label="Privacy policy" onPress={() => openPage(legal.privacy)} external />
              <LinkRow label="Help and contact" onPress={() => openPage(legal.support)} external />
            </Card>
          </View>
          <Button
            variant="ghost"
            label="Sign out"
            onPress={async () => {
              await signOut();
              router.replace('/auth');
            }}
          />
          <DeleteAccount onDeleted={async () => {
            await signOut();
            router.replace('/auth');
          }} />
        </>
      ) : null}
    </Screen>
  );
}

const liveProtections = [
  'Only signed-in members can see posts, photos and profiles',
  'Photos load through private links that expire after an hour',
  'Private groups and messages are visible only to the people in them',
  'Nexus never sells your work or uses it to train AI',
];

function LinkRow({ label, onPress, external, first }: { label: string; onPress: () => void; external?: boolean; first?: boolean }) {
  return (
    <Tap
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityHint={external ? 'Opens in your browser' : undefined}
      onPress={onPress}
      style={[styles.row, !first && styles.divider]}
    >
      <Text style={[text.strong, { flex: 1, fontSize: 14.5 }]}>{label}</Text>
      <Icon name={external ? 'link' : 'chevron'} size={16} color={colors.olive} />
    </Tap>
  );
}

/** Permanent deletion, required by the App Store. Typing DELETE makes it hard to do by accident. */
function DeleteAccount({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const { showToast } = useDemo();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = typed.trim().toUpperCase() === 'DELETE' && !busy;

  const remove = async () => {
    setBusy(true);
    try {
      await deleteMyAccount();
      showToast('Your account has been **deleted**.');
      await onDeleted();
    } catch (e) {
      showToast((e as Error).message);
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Tap accessibilityRole="button" onPress={() => setOpen(true)} style={{ alignSelf: 'center', paddingVertical: 12 }}>
        <Text style={styles.danger}>Delete my account</Text>
      </Tap>
    );
  }
  return (
    <Card style={{ padding: 16, gap: 12, borderWidth: 1.5, borderColor: '#9A2B1F' }}>
      <Text style={[text.strong, { color: '#9A2B1F' }]} accessibilityRole="header">
        Delete your account?
      </Text>
      <Text style={text.sub}>
        This permanently deletes your profile, posts, photos, groups you own, messages and follows. It can’t be undone. Records of
        tickets you bought are kept for refunds and taxes, without your name attached.
      </Text>
      <Text style={styles.label}>Type DELETE to confirm</Text>
      <TextInput
        value={typed}
        onChangeText={setTyped}
        accessibilityLabel="Type DELETE to confirm"
        autoCapitalize="characters"
        autoCorrect={false}
        style={styles.input}
      />
      <Button
        variant="big"
        label={busy ? 'Deleting…' : 'Delete account permanently'}
        onPress={ready ? remove : undefined}
        style={[{ backgroundColor: '#9A2B1F' }, !ready && { opacity: 0.45 }]}
      />
      <Button variant="ghost" label="Keep my account" onPress={() => { setOpen(false); setTyped(''); }} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 18, paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.body600, fontSize: 14, color: colors.forest },
  body: { paddingHorizontal: 16, paddingTop: 8, gap: 20 },
  sectionTitle: { marginHorizontal: 4, fontFamily: fonts.display700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: colors.forest },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.stone },
  ai: { backgroundColor: colors.ink, borderRadius: 22, padding: 18, gap: 12 },
  aiTitle: { fontFamily: fonts.display800, fontSize: 19, color: colors.lime },
  aiText: { fontFamily: fonts.body400, fontSize: 13.5, lineHeight: 19, color: colors.creamMuted },
  danger: { fontFamily: fonts.body600, fontSize: 14, color: '#9A2B1F', textDecorationLine: 'underline' },
  label: { fontFamily: fonts.body600, fontSize: 13.5, color: colors.forest },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    fontFamily: fonts.body600,
    fontSize: 16,
    color: colors.ink,
  },
});
