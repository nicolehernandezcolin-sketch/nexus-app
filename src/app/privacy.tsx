import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { Button, Card, Pill, Switch, text } from '../components/ui';
import { aiProtections, OptionId, privacySections } from '../data/content';
import { optionColumns } from '../lib/api';
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
      {privacySections.map((s) => (
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
        {aiProtections.map((x) => (
          <View key={x} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Icon name="check" size={16} color={colors.lime} strokeWidth={2.6} />
            <Text style={[styles.aiText, { flex: 1, color: colors.cream }]}>{x}</Text>
          </View>
        ))}
      </View>
      {live ? (
        <Button
          variant="ghost"
          label="Sign out"
          onPress={async () => {
            await signOut();
            router.replace('/auth');
          }}
        />
      ) : null}
    </Screen>
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
});
