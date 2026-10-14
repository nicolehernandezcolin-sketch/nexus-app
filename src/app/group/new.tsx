import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../../components/Chrome';
import { PrivateBadge } from '../../components/Groups';
import { Button, text } from '../../components/ui';
import { createGroup } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useDemo } from '../../state/DemoState';
import { colors, fonts } from '../../theme';

export default function NewGroup() {
  const { live } = useAuth();
  const { showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = name.trim().length > 0 && !busy;

  const create = async () => {
    if (!live) {
      showToast('Groups are created once you have an account. This is the **demo**.');
      return;
    }
    setBusy(true);
    try {
      const g = await createGroup(name.trim(), about.trim());
      router.replace({ pathname: '/group/[id]', params: { id: g.id } });
    } catch (e) {
      showToast((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Screen header={<BackHeader label="Cancel" fallback="/timeline" />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <PrivateBadge />
      <Text style={styles.title} accessibilityRole="header">
        New private group
      </Text>
      <Text style={text.sub}>Invite-only. You add people you follow, and only members can see posts or open files.</Text>

      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Name</Text>
        <TextInput value={name} onChangeText={(t) => setName(t.slice(0, 60))} accessibilityLabel="Group name" placeholder="Film Collective" placeholderTextColor={colors.muted} style={styles.input} />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>What it’s for</Text>
        <TextInput
          value={about}
          onChangeText={(t) => setAbout(t.slice(0, 300))}
          accessibilityLabel="What the group is for"
          placeholder="Sharing cuts before release"
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, { minHeight: 100, paddingTop: 12, textAlignVertical: 'top' }]}
        />
      </View>

      <Button variant="big" label={busy ? 'Creating…' : 'Create group'} onPress={ready ? create : undefined} style={!ready && { opacity: 0.45 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  title: { fontFamily: fonts.display800, fontSize: 28, letterSpacing: -0.6, color: colors.ink },
  label: { fontFamily: fonts.body600, fontSize: 13.5, color: colors.forest },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    fontFamily: fonts.body400,
    fontSize: 16,
    color: colors.ink,
    outlineStyle: 'none',
  } as object,
});
