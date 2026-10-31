import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { PageHeader, Screen } from '../components/Chrome';
import { LivePostCard, PostTags } from '../components/Feed';
import { GroupsTab } from '../components/Groups';
import { Icon } from '../components/Icon';
import { MeAvatar } from '../components/Me';
import { ArtBlock, Avatar, Button, Card, Rise, Tap, text } from '../components/ui';
import { Post, posts, profile } from '../data/content';
import { fetchTimeline, useLoad } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDemo, UserPost } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function Timeline() {
  const { userPosts } = useDemo();
  const { live } = useAuth();
  const [tab, setTab] = useState<'following' | 'groups'>('following');
  return (
    <Screen
      nav
      header={
        <View style={styles.headerWrap}>
          <PageHeader
            title="Timeline"
            right={
              <Tap accessibilityRole="button" accessibilityLabel="Messages" onPress={() => router.push('/messages')} style={styles.inbox}>
                <Icon name="chat" size={20} color={colors.lime} />
              </Tap>
            }
          />
          <View style={styles.tabs}>
            {(['following', 'groups'] as const).map((t) => {
              const on = tab === t;
              return (
                <Tap
                  key={t}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setTab(t)}
                  style={[styles.tab, on && { backgroundColor: colors.forest, borderColor: colors.forest }]}
                >
                  <Icon name={t === 'following' ? 'clock' : 'lock'} size={14} color={on ? colors.lime : colors.forest} strokeWidth={2.2} />
                  <Text style={[styles.tabText, on && { color: colors.lime }]}>
                    {t === 'following' ? 'Following · newest first' : 'Private groups'}
                  </Text>
                </Tap>
              );
            })}
          </View>
        </View>
      }
      contentStyle={styles.list}
      overlay={
        <Tap accessibilityRole="button" accessibilityLabel="New post" onPress={() => router.push('/compose')} style={styles.fab}>
          <Icon name="plus" size={20} color={colors.ink} strokeWidth={2.6} />
          <Text style={styles.fabText}>Post</Text>
        </Tap>
      }
    >
      {tab === 'groups' ? (
        <GroupsTab />
      ) : (
        <>
          <Tap accessibilityRole="button" onPress={() => router.push('/compose')} style={styles.composer}>
            <MeAvatar size={38} />
            <Text style={styles.composerText}>Share new work or find collaborators…</Text>
            <Icon name="image" size={20} color={colors.olive} />
          </Tap>
          {live ? (
            <LiveFeed />
          ) : (
            <>
              {userPosts
                .filter((p) => !p.groupId)
                .map((p) => (
                  <Rise key={p.id}>
                    <MyPost post={p} />
                  </Rise>
                ))}
              {posts.map((p, i) => (
                <Rise key={p.id} delay={i * 70}>
                  <PostCard post={p} />
                </Rise>
              ))}
            </>
          )}
          <Rise delay={posts.length * 70}>
            <CaughtUp />
          </Rise>
        </>
      )}
    </Screen>
  );
}

function PostCard({ post: p }: { post: Post }) {
  const { saved, toggleSaved, showToast } = useDemo();
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
        <PostTags kind={p.kind} raw={p.raw} />
      </View>
      <Text style={text.body}>{p.text}</Text>
      {p.art ? <ArtBlock art={p.art} /> : null}
      <View style={styles.actions}>
        {p.kind === 'Show' ? (
          <Button label={isSaved ? 'Saved' : 'Save the date'} selected={isSaved} style={{ flex: 1 }} onPress={() => toggleSaved(p.id)} />
        ) : (
          <>
            <Button
              label={p.cta}
              style={{ flex: 1 }}
              onPress={() => showToast(`Request sent to **${p.firstName}**. They’ll see it next time they open Nexus.`)}
            />
            <Button variant="ghost" label={isSaved ? 'Saved' : 'Save'} selected={isSaved} onPress={() => toggleSaved(p.id)} />
          </>
        )}
        <Button
          variant="ghost"
          accessibilityLabel={`Message ${p.name}`}
          style={{ width: 44, paddingHorizontal: 0 }}
          icon={<Icon name="chat" size={18} />}
          onPress={() => router.push('/messages')}
        />
      </View>
    </Card>
  );
}

/** Your posts and the people you follow, from the database. Reloads when you come back to it. */
function LiveFeed() {
  const { data, loading, error, reload } = useLoad(fetchTimeline, []);
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else reload();
    }, [reload]),
  );

  if (loading && !data) return <ActivityIndicator color={colors.forest} style={{ marginVertical: 24 }} />;
  if (error) return <Text style={[text.sub, { textAlign: 'center' }]}>Couldn’t load your timeline: {error}</Text>;
  if (!data?.length)
    return (
      <Card style={{ padding: 18, gap: 6 }}>
        <Text style={text.strong}>Your timeline is quiet</Text>
        <Text style={text.sub}>Follow people in Discover and their posts show up here, newest first.</Text>
      </Card>
    );
  return (
    <>
      {data.map((item, i) => (
        <Rise key={item.post.id} delay={Math.min(i, 6) * 60}>
          <LivePostCard item={item} onChanged={reload} />
        </Rise>
      ))}
    </>
  );
}

function MyPost({ post: p }: { post: UserPost }) {
  const { setProfileTab } = useDemo();
  return (
    <Card style={[styles.card, { borderWidth: 1.5, borderColor: colors.olive }]}>
      <View style={styles.author}>
        <Avatar initials={profile.initials} photo={profile.photo} bg={colors.lime} fg={colors.ink} />
        <View style={{ flex: 1 }}>
          <Text style={text.strong}>{profile.name}</Text>
          <Text style={text.small}>You · Just now</Text>
        </View>
        <PostTags kind={p.kind} raw={p.raw} />
      </View>
      <Text style={text.body}>{p.text}</Text>
      {p.image ? <Image source={{ uri: p.image }} accessibilityLabel="Your photo" style={styles.photo} resizeMode="cover" /> : null}
      <Button
        variant="ghost"
        label="See it on your profile"
        onPress={() => {
          setProfileTab('posts');
          router.replace('/profile');
        }}
      />
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
        That’s everything from the people you follow, in the order it was posted. Every post reaches every follower: no algorithm decides whose music or show gets
        seen, and nobody can pay to cut the line. Go meet someone, make something, or come to a show.
      </Text>
      <View style={{ gap: 8, alignSelf: 'stretch' }}>
        <Button variant="lime" label="See events this week" onPress={() => router.replace('/events')} />
        <Button variant="outlineDark" label="Find a collaborator" onPress={() => router.replace('/discover')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 12 },
  inbox: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.line2,
  },
  tabText: { fontFamily: fonts.body600, fontSize: 12.5, color: colors.forest },
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
  list: { padding: 16, paddingBottom: 96, gap: 14 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
  },
  composerText: { flex: 1, fontFamily: fonts.body400, fontSize: 14, color: colors.muted },
  photo: { width: '100%', height: 220, borderRadius: 16, backgroundColor: colors.stone },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: colors.lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { fontFamily: fonts.display700, fontSize: 15, color: colors.ink },
  card: { padding: 16, gap: 12 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  actions: { flexDirection: 'row', gap: 8 },
  end: { backgroundColor: colors.forest, borderRadius: 26, paddingVertical: 28, paddingHorizontal: 22, gap: 14, marginTop: 6 },
  tick: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  endTitle: { fontFamily: fonts.display800, fontSize: 28, lineHeight: 30, letterSpacing: -0.6, color: colors.cream },
  endText: { fontFamily: fonts.body400, fontSize: 14.5, lineHeight: 22, color: colors.creamMuted },
});
