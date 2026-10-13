import { router, useLocalSearchParams } from 'expo-router';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../../components/Chrome';
import { Icon } from '../../components/Icon';
import { ArtBlock, Avatar, Button, Card, Pill, Rise, SectionTitle, Tap, text } from '../../components/ui';
import { allWork, events, profile, profilePosts } from '../../data/content';
import { saleLabel } from '../../data/fees';
import { colors, fonts } from '../../theme';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return allWork.map((w) => ({ id: w.id }));
}

export default function WorkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const work = allWork.find((w) => w.id === id);

  if (!work) {
    return (
      <Screen header={<BackHeader label="Back" fallback="/profile" />} contentStyle={{ padding: 20 }}>
        <Text style={text.sub}>We couldn’t find that piece.</Text>
      </Screen>
    );
  }

  const event = work.eventId ? events.find((e) => e.id === work.eventId) : undefined;
  const posts = profilePosts.filter((p) => p.workId === work.id);
  // Other pieces from the same module, for browsing sideways.
  const more = allWork.filter((w) => w.module === work.module && w.id !== work.id);

  return (
    <Screen header={<BackHeader label="Back" fallback="/profile" />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Rise>
        <ArtBlock art={work.art} radius={22} height={work.art.image ? 220 : 260} />
      </Rise>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pill label={work.kind} bg={colors.limeSoft} fg={colors.forest} />
          <Pill label={work.module} bg={colors.stone} fg={colors.forest} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {work.title}
        </Text>
        <Tap accessibilityRole="link" onPress={() => router.replace('/profile')} style={styles.byline}>
          <Avatar initials={profile.initials} photo={profile.photo} size={28} bg={colors.lime} fg={colors.ink} />
          <Text style={[text.strong, { fontSize: 14 }]}>{profile.name}</Text>
        </Tap>
      </View>

      <Text style={text.body}>{work.about}</Text>

      {work.facts ? (
        <Card style={{ paddingVertical: 6 }}>
          {work.facts.map(([k, v], i) => (
            <View key={k} style={[styles.fact, i > 0 && styles.divider]}>
              <Text style={[text.small, { width: 110 }]}>{k}</Text>
              <Text style={[text.body, { flex: 1, fontFamily: fonts.body600, fontSize: 14 }]}>{v}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {work.gallery ? (
        <View style={{ gap: 10 }}>
          <SectionTitle>Award winners</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {work.gallery.map((g) => (
              <View key={g.title} style={styles.still}>
                <Image source={g.image} accessibilityLabel={`Still from ${g.title}`} style={styles.stillImg} resizeMode="cover" />
                <Pill label={g.note} bg={colors.ink} fg={colors.lime} style={{ paddingVertical: 3, paddingHorizontal: 8 }} />
                <Text style={[text.strong, { fontSize: 13.5 }]} numberOfLines={1}>
                  {g.title}
                </Text>
                <Text style={[text.small, { fontSize: 12 }]}>by {g.by}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {event ? (
        <Tap
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
          style={styles.eventLink}
        >
          <Icon name="ticket" size={22} color={colors.lime} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventMeta}>{event.when}</Text>
          </View>
          <View style={styles.eventCta}>
            <Text style={styles.eventCtaText}>{saleLabel(event.sale)}</Text>
          </View>
        </Tap>
      ) : null}

      {work.link ? (
        <Button
          variant="ghost"
          label={work.link.label}
          icon={<Icon name="link" size={16} color={colors.forest} />}
          style={{ height: 48 }}
          onPress={() => Linking.openURL(work.link!.url)}
        />
      ) : null}

      {posts.length ? (
        <View style={{ gap: 10 }}>
          <SectionTitle>Posts about this</SectionTitle>
          {posts.map((p) => (
            <Card key={p.id} style={{ padding: 14, gap: 6 }}>
              <Text style={text.small}>{p.time} ago</Text>
              <Text style={[text.body, { fontSize: 14 }]}>{p.text}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      {more.length ? (
        <View style={{ gap: 10 }}>
          <SectionTitle>More in {work.module}</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {more.map((m) => (
              <Tap
                key={m.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/work/[id]', params: { id: m.id } })}
                style={{ width: 140, gap: 6 }}
              >
                <ArtBlock art={m.art} radius={14} height={120} />
                <Text style={[text.strong, { fontSize: 13.5 }]} numberOfLines={1}>
                  {m.title}
                </Text>
                <Text style={[text.small, { fontSize: 12 }]} numberOfLines={1}>
                  {m.detail}
                </Text>
              </Tap>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 18 },
  title: { fontFamily: fonts.display800, fontSize: 30, lineHeight: 33, letterSpacing: -0.7, color: colors.ink },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: 44 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.stone },
  still: { width: 190, gap: 6 },
  stillImg: { width: 190, height: 100, borderRadius: 14, backgroundColor: colors.ink },
  eventLink: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.forest, borderRadius: 20, padding: 16 },
  eventTitle: { fontFamily: fonts.display700, fontSize: 16, color: colors.cream },
  eventMeta: { fontFamily: fonts.body400, fontSize: 12.5, color: colors.creamMuted },
  eventCta: { backgroundColor: colors.lime, borderRadius: 999, paddingHorizontal: 12, height: 34, justifyContent: 'center' },
  eventCtaText: { fontFamily: fonts.body600, fontSize: 12.5, color: colors.ink },
});
