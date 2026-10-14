import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { Button, Card, Chip, Pill, SectionTitle, Switch, text } from '../components/ui';
import { roles, welcomeOptions } from '../data/content';
import { useAuth } from '../lib/auth';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function Welcome() {
  const demo = useDemo();
  const { live, saveMe } = useAuth();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  // With a real account, setup saves what you make and what you opted into.
  const enter = async () => {
    if (live) {
      setSaving(true);
      try {
        await saveMe({
          roles: roles.filter((r) => demo.roles[r]),
          suggest: !!demo.options.suggest,
          discoverable: !!demo.options.discover,
          personalize: !!demo.options.personal,
          onboarded: true,
        });
      } catch (e) {
        demo.showToast((e as Error).message);
        setSaving(false);
        return;
      }
    }
    router.replace('/timeline');
  };

  return (
    <Screen
      contentStyle={styles.body}
      footer={
        <View style={[styles.footer, { paddingBottom: 24 + insets.bottom }]}>
          <Button variant="big" label={saving ? 'Saving…' : 'Enter your timeline'} onPress={saving ? undefined : enter} />
        </View>
      }
    >
      <View style={styles.row}>
        <Text style={styles.logo}>NEXUS</Text>
        {live ? null : <Pill label="Demo" bg={colors.lime} fg={colors.ink} />}
      </View>

      <View style={{ gap: 12 }}>
        <Text style={styles.h1} accessibilityRole="header">
          Find your people. Then go make something.
        </Text>
        <Text style={[text.sub, { fontSize: 15, lineHeight: 22 }]}>
          A network for creatives built to connect you, not keep you scrolling. Nothing below is on until you turn it on.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <SectionTitle>What do you make?</SectionTitle>
        <View style={styles.wrap}>
          {roles.map((r) => (
            <Chip key={r} label={r} selected={!!demo.roles[r]} onPress={() => demo.toggleRole(r)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle>You choose what you’re part of</SectionTitle>
        {welcomeOptions.map((o) => (
          <Card key={o.id} style={styles.option}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={text.strong}>{o.title}</Text>
              <Text style={[text.small, { fontSize: 13 }]}>{o.detail}</Text>
            </View>
            <Switch label={o.title} value={!!demo.options[o.id]} onToggle={() => demo.toggleOption(o.id)} />
          </Card>
        ))}
      </View>

      <View style={styles.ai}>
        <Icon name="shield" color={colors.lime} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.aiTitle}>Your work is not for training AI</Text>
          <Text style={styles.aiText}>Always on. Uploads are watermarked, marked do-not-train, and only shown to signed-in members.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 36, paddingHorizontal: 22, paddingBottom: 16, gap: 24 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: fonts.display900, fontSize: 26, letterSpacing: -0.5, color: colors.forest },
  h1: { fontFamily: fonts.display800, fontSize: 36, lineHeight: 37, letterSpacing: -1, color: colors.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderRadius: 18, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  ai: { backgroundColor: colors.forest, borderRadius: 18, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  aiTitle: { fontFamily: fonts.body600, fontSize: 14, color: colors.lime },
  aiText: { fontFamily: fonts.body400, fontSize: 13, lineHeight: 19, color: colors.cream },
  footer: { paddingTop: 14, paddingHorizontal: 22, backgroundColor: colors.cream },
});
