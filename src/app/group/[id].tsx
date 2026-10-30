import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../../components/Chrome';
import { SafetyMenu } from '../../components/Safety';
import { LivePostCard, openProfile } from '../../components/Feed';
import { PrivateBadge } from '../../components/Groups';
import { Icon } from '../../components/Icon';
import { MeAvatar } from '../../components/Me';
import { ArtBlock, Avatar, Button, Card, Pill, Rise, SectionTitle, Tap, text } from '../../components/ui';
import { demoGroupPosts, demoGroups, postKindColors } from '../../data/content';
import { addGroupMember, fetchFollowing, fetchGroup, leaveGroup, useLoad } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colorFor, initialsOf } from '../../lib/format';
import { useDemo } from '../../state/DemoState';
import { colors, fonts } from '../../theme';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return demoGroups.map((g) => ({ id: g.id }));
}

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { live } = useAuth();
  return live ? <LiveGroup id={id} /> : <DemoGroup id={id} />;
}

function Composer({ groupId, name }: { groupId: string; name: string }) {
  return (
    <Tap accessibilityRole="button" onPress={() => router.push({ pathname: '/compose', params: { group: groupId } })} style={styles.composer}>
      <MeAvatar size={36} />
      <Text style={styles.composerText}>Share privately with {name}…</Text>
      <Icon name="lock" size={18} color={colors.olive} />
    </Tap>
  );
}

function Header({ name, about, members }: { name: string; about: string; members: number }) {
  return (
    <View style={styles.hero}>
      <PrivateBadge dark label={`Private group · ${members} member${members === 1 ? '' : 's'}`} />
      <Text style={styles.title} accessibilityRole="header">
        {name}
      </Text>
      {about ? <Text style={styles.about}>{about}</Text> : null}
      <Text style={styles.note}>Only members see these posts and open their files. Nothing here reaches Discover, profiles or AI crawlers.</Text>
    </View>
  );
}

function DemoGroup({ id }: { id: string }) {
  const { userPosts, showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const g = demoGroups.find((x) => x.id === id);
  if (!g) return <Missing />;
  const posts = demoGroupPosts.filter((p) => p.group === id).map((p) => p.post);
  const mine = userPosts.filter((p) => p.groupId === id);

  return (
    <Screen header={<BackHeader label="Groups" fallback="/timeline" />} contentStyle={{ paddingBottom: 32 + insets.bottom }}>
      <Header name={g.name} about={g.about} members={g.memberCount} />
      <View style={styles.body}>
        <Composer groupId={g.id} name={g.name} />
        {mine.map((p) => (
          <Card key={p.id} style={styles.post}>
            <Text style={text.small}>You · Just now</Text>
            <Text style={text.body}>{p.text}</Text>
            {p.image ? <Image source={{ uri: p.image }} style={styles.photo} resizeMode="cover" /> : null}
          </Card>
        ))}
        {posts.map((p, i) => {
          const kind = postKindColors[p.kind];
          return (
            <Rise key={p.id} delay={i * 70}>
              <Card style={styles.post}>
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
                <Button label={p.cta} onPress={() => showToast(`Replied in **${g.name}**. Only members can see it.`)} />
              </Card>
            </Rise>
          );
        })}
      </View>
    </Screen>
  );
}

function LiveGroup({ id }: { id: string }) {
  const { me } = useAuth();
  const { showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const loaded = useLoad(() => fetchGroup(id), [id]);
  const [inviting, setInviting] = useState(false);
  const following = useLoad(async () => (inviting ? fetchFollowing() : []), [inviting]);

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else loaded.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (!loaded.data) {
    return (
      <Screen header={<BackHeader label="Groups" fallback="/timeline" />} contentStyle={{ padding: 24 }}>
        {loaded.error ? <Missing /> : <ActivityIndicator color={colors.forest} />}
      </Screen>
    );
  }
  const { group, members, posts } = loaded.data;
  const owner = group.owner === me?.id;
  const memberIds = new Set(members.map((m) => m.id));

  const invite = async (userId: string, name: string) => {
    try {
      await addGroupMember(group.id, userId);
      showToast(`**${name}** is in. They can see this group now.`);
      loaded.reload();
    } catch (e) {
      showToast((e as Error).message);
    }
  };

  return (
    <Screen
      header={
        <BackHeader
          label="Groups"
          fallback="/timeline"
          right={
            owner ? null : (
              <SafetyMenu
                target={{ type: 'group', id: group.id }}
                person={(() => {
                  const host = members.find((m) => m.id === group.owner);
                  return host ? { id: host.id, name: host.name } : undefined;
                })()}
                onBlocked={() => router.back()}
              />
            )
          }
        />
      }
      contentStyle={{ paddingBottom: 32 + insets.bottom }}
    >
      <Header name={group.name} about={group.about} members={members.length} />
      <View style={styles.body}>
        <View style={{ gap: 10 }}>
          <SectionTitle>Members</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {members.map((m) => (
              <Tap key={m.id} accessibilityRole="link" onPress={() => openProfile(m.id, me?.id)} style={styles.member}>
                <Avatar initials={initialsOf(m.name)} bg={colorFor(m.id)} size={26} />
                <Text style={[text.small, { color: colors.ink }]}>{m.id === me?.id ? 'You' : m.name}</Text>
              </Tap>
            ))}
          </View>
          {owner ? (
            <Button variant="ghost" label={inviting ? 'Done inviting' : 'Invite people you follow'} onPress={() => setInviting(!inviting)} />
          ) : (
            <Button
              variant="ghost"
              label="Leave group"
              onPress={async () => {
                await leaveGroup(group.id);
                router.replace('/timeline');
              }}
            />
          )}
          {inviting ? (
            <Card style={{ paddingVertical: 4 }}>
              {(following.data ?? []).filter((p) => !memberIds.has(p.id)).length === 0 ? (
                <Text style={[text.sub, { padding: 14 }]}>Everyone you follow is already in, or you don’t follow anyone yet.</Text>
              ) : (
                (following.data ?? [])
                  .filter((p) => !memberIds.has(p.id))
                  .map((p) => (
                    <View key={p.id} style={styles.inviteRow}>
                      <Avatar initials={initialsOf(p.name)} bg={colorFor(p.id)} size={34} />
                      <Text style={[text.strong, { flex: 1, fontSize: 14 }]}>{p.name}</Text>
                      <Button label="Add" style={{ height: 36 }} onPress={() => invite(p.id, p.name)} />
                    </View>
                  ))
              )}
            </Card>
          ) : null}
        </View>

        <Composer groupId={group.id} name={group.name} />
        {posts.length ? (
          posts.map((item) => <LivePostCard key={item.post.id} item={item} onChanged={loaded.reload} />)
        ) : (
          <Text style={text.sub}>No posts yet. Share something only this group should see.</Text>
        )}
      </View>
    </Screen>
  );
}

function Missing() {
  return (
    <Screen header={<BackHeader label="Groups" fallback="/timeline" />} contentStyle={{ padding: 20 }}>
      <Text style={text.sub}>This group doesn’t exist, or you’re not a member.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.forest, padding: 20, gap: 10 },
  title: { fontFamily: fonts.display800, fontSize: 26, lineHeight: 29, letterSpacing: -0.5, color: colors.cream },
  about: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 21, color: colors.cream },
  note: { fontFamily: fonts.body400, fontSize: 12.5, lineHeight: 18, color: colors.creamMuted },
  body: { padding: 16, gap: 14 },
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
  post: { padding: 16, gap: 12 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  photo: { width: '100%', height: 220, borderRadius: 16, backgroundColor: colors.stone },
  member: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.paper, borderRadius: 999, paddingVertical: 4, paddingLeft: 4, paddingRight: 12 },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 14 },
});
