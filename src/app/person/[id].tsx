import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../../components/Chrome';
import { Icon } from '../../components/Icon';
import { ArtBlock, Avatar, Button, Card, Pill, Rise, SectionTitle, Tap, text } from '../../components/ui';
import { allWork, people, personById, workFor } from '../../data/content';
import { useDemo } from '../../state/DemoState';
import { colors, fonts } from '../../theme';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return people.filter((p) => p.id !== 'nicole').map((p) => ({ id: p.id }));
}

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const person = personById(id);

  if (!person) {
    return (
      <Screen header={<BackHeader label="Back" fallback="/profile" />} contentStyle={{ padding: 20 }}>
        <Text style={text.sub}>We couldn’t find that person.</Text>
      </Screen>
    );
  }

  const worked = workFor(person.id)
    .map((w) => ({ ...w, work: allWork.find((a) => a.id === w.workId) }))
    .filter((w) => !!w.work);
  const first = person.name.split(' ')[0];

  return (
    <Screen header={<BackHeader label="Back" fallback="/profile" />} contentStyle={{ paddingBottom: 32 + insets.bottom }}>
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar initials={person.initials} photo={person.photo} bg={person.avatar} fg={colors.cream} size={76} ring={colors.lime} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.name} accessibilityRole="header">
              {person.name}
            </Text>
            <Pill label={`${person.role} · Nexus`} bg={colors.lime} fg={colors.ink} />
          </View>
        </View>
        {person.bio ? <Text style={styles.bio}>{person.bio}</Text> : null}
        {person.link ? (
          <Tap accessibilityRole="link" onPress={() => Linking.openURL(person.link!.url)} style={styles.link}>
            <Icon name="link" size={14} color={colors.lime} />
            <Text style={styles.linkText}>{person.link.label}</Text>
          </Tap>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            variant="lime"
            label="Let’s collaborate"
            style={{ flex: 1, height: 44 }}
            onPress={() => showToast(`Collaboration request sent to **${first}**.`)}
          />
          <Button variant="outlineDark" label="Message" style={{ flex: 1, height: 44 }} onPress={() => showToast('Messaging is coming in the full app.')} />
        </View>
      </View>

      <View style={{ padding: 20, gap: 12 }}>
        <SectionTitle>Worked on</SectionTitle>
        {worked.map((w, i) => (
          <Rise key={w.workId} delay={i * 70}>
            <Tap
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/work/[id]', params: { id: w.workId } })}
            >
              <Card style={styles.work}>
                <View style={{ width: 72 }}>
                  <ArtBlock art={w.work!.art} radius={12} height={72} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[text.strong, { fontSize: 14.5 }]}>{w.work!.title}</Text>
                  <Text style={text.small}>{w.work!.detail}</Text>
                  <Text style={[text.small, { color: colors.forest, fontFamily: fonts.body600 }]}>{w.part}</Text>
                </View>
              </Card>
            </Tap>
          </Rise>
        ))}
        <Text style={text.small}>No follower counts or likes on profiles. Nexus shows what you make and where you show up.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.forest, padding: 20, gap: 14 },
  name: { fontFamily: fonts.display800, fontSize: 22, lineHeight: 25, color: colors.cream },
  bio: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 21, color: colors.cream },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.olive,
  },
  linkText: { fontFamily: fonts.body600, fontSize: 12.5, color: colors.lime },
  work: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18 },
});
