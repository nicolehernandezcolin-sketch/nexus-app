import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PageHeader, Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { ArtBlock, Avatar, Button, Card, Pill, Rise, text } from '../components/ui';
import { Post, postKindColors, posts } from '../data/content';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function Timeline() {
  return (
    <Screen
      nav
      header={
        <View style={styles.headerWrap}>
          <PageHeader
            title="Timeline"
            right={
              <View style={styles.order}>
                <Icon name="clock" size={14} color={colors.forest} strokeWidth={2.2} />
                <Text style={styles.orderText}>Newest first · Following</Text>
              </View>
            }
          />
        </View>
      }
      contentStyle={styles.list}
    >
      {posts.map((p, i) => (
        <Rise key={p.id} delay={i * 70}>
          <PostCard post={p} />
        </Rise>
      ))}
      <Rise delay={posts.length * 70}>
        <CaughtUp />
      </Rise>
    </Screen>
  );
}

function PostCard({ post: p }: { post: Post }) {
  const { saved, toggleSaved, showToast } = useDemo();
  const kind = postKindColors[p.kind];
  const isSaved = !!saved[p.id];
  return (
    <Card style={styles.card}>
      <View style={styles.author}>
        <Avatar initials={p.initials} bg={p.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={text.strong}>{p.name}</Text>
          <Text style={text.small}>
            {p.role} · {p.time}
          </Text>
        </View>
        <Pill label={p.kind} bg={kind.bg} fg={kind.fg} />
      </View>
      <Text style={text.body}>{p.text}</Text>
      {p.art ? <ArtBlock art={p.art} /> : null}
      <View style={styles.actions}>
        <Button
          label={p.cta}
          style={{ flex: 1 }}
          onPress={() => showToast(`Request sent to **${p.firstName}**. They’ll see it next time they open Nexus.`)}
        />
        <Button variant="ghost" label={isSaved ? 'Saved' : 'Save'} selected={isSaved} onPress={() => toggleSaved(p.id)} />
        <Button
          variant="ghost"
          accessibilityLabel={`Message ${p.name}`}
          style={{ width: 44, paddingHorizontal: 0 }}
          icon={<Icon name="chat" size={18} />}
          onPress={() => showToast('Messaging is coming in the full app.')}
        />
      </View>
    </Card>
  );
}

function CaughtUp() {
  return (
    <View style={styles.end}>
      <View style={styles.tick}>
        <Icon name="check" size={24} strokeWidth={2.4} />
      </View>
      <Text style={styles.endTitle} accessibilityRole="header">
        You’re all caught up.
      </Text>
      <Text style={styles.endText}>
        That’s everything from the people you follow. No endless scroll here. Go meet someone, make something, or come to a show.
      </Text>
      <View style={{ gap: 8, alignSelf: 'stretch' }}>
        <Button variant="lime" label="See events this week" onPress={() => router.replace('/events')} />
        <Button variant="outlineDark" label="Find a collaborator" onPress={() => router.replace('/discover')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: { borderBottomWidth: 1, borderBottomColor: colors.line },
  order: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  orderText: { fontFamily: fonts.body600, fontSize: 12, color: colors.forest },
  list: { padding: 16, paddingBottom: 24, gap: 14 },
  card: { padding: 16, gap: 12 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  actions: { flexDirection: 'row', gap: 8 },
  end: { backgroundColor: colors.forest, borderRadius: 26, paddingVertical: 28, paddingHorizontal: 22, gap: 14, marginTop: 6 },
  tick: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  endTitle: { fontFamily: fonts.display800, fontSize: 28, lineHeight: 30, letterSpacing: -0.6, color: colors.cream },
  endText: { fontFamily: fonts.body400, fontSize: 14.5, lineHeight: 22, color: colors.creamMuted },
});
