import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../../components/Chrome';
import { LivePostCard, messageUser } from '../../components/Feed';
import { Icon } from '../../components/Icon';
import { SafetyMenu } from '../../components/Safety';
import { ArtBlock, Avatar, Button, Card, Pill, Rise, SectionTitle, Tap, text } from '../../components/ui';
import { allWork, people, personById, workFor } from '../../data/content';
import { avatarUrls, fetchCheckins, fetchPostsBy, getProfile, isFollowing, requestCollab, setFollowing, useLoad } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colorFor, firstNameOf, initialsOf } from '../../lib/format';
import { useDemo } from '../../state/DemoState';
import { colors, fonts } from '../../theme';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return people.filter((p) => p.id !== 'nicole').map((p) => ({ id: p.id }));
}

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { live } = useAuth();
  if (live) return <LivePerson id={id} />;
  return <DemoPerson id={id} />;
}

/** A real member's profile. */
function LivePerson({ id }: { id: string }) {
  const { showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const loaded = useLoad(async () => {
    const [profile, posts, following, metAt] = await Promise.all([getProfile(id), fetchPostsBy(id), isFollowing(id), fetchCheckins(id)]);
    const avatars = await avatarUrls([profile]);
    return { profile, posts, following, metAt, avatarUrl: profile.avatar_path ? avatars[profile.avatar_path] : undefined };
  }, [id]);
  const [busy, setBusy] = useState(false);

  if (!loaded.data) {
    return (
      <Screen header={<BackHeader label="Back" fallback="/discover" />} contentStyle={{ padding: 24 }}>
        {loaded.error ? <Text style={text.sub}>We couldn’t find that person.</Text> : <ActivityIndicator color={colors.forest} />}
      </Screen>
    );
  }
  const { profile: p, posts, following, metAt, avatarUrl } = loaded.data;
  const first = firstNameOf(p.name);

  const follow = async () => {
    setBusy(true);
    try {
      await setFollowing(p.id, !following);
      loaded.setData({ ...loaded.data!, following: !following });
      if (!following) showToast(`Following **${first}**. Their posts now show on your timeline.`);
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const collab = async () => {
    try {
      await requestCollab(p.id);
      showToast(`Collaboration request sent to **${first}**.`);
    } catch (e) {
      showToast((e as Error).message);
    }
  };

  return (
    <Screen header={<BackHeader label="Back" fallback="/discover" />} contentStyle={{ paddingBottom: 32 + insets.bottom }}>
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar initials={initialsOf(p.name)} photo={avatarUrl ? { uri: avatarUrl } : undefined} bg={colorFor(p.id)} fg={colors.cream} size={76} ring={colors.lime} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.name} accessibilityRole="header">
              {p.name || 'New member'}
            </Text>
            {p.tagline || p.location ? (
              <Text style={styles.sub}>{[p.tagline, p.location].filter(Boolean).join(' · ')}</Text>
            ) : null}
          </View>
          <SafetyMenu light target={{ type: 'profile', id: p.id }} person={{ id: p.id, name: p.name }} onBlocked={() => router.back()} />
        </View>
        {p.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            variant={following ? 'outlineDark' : 'lime'}
            label={busy ? '…' : following ? 'Following' : 'Follow'}
            style={{ flex: 1, height: 44 }}
            onPress={busy ? undefined : follow}
          />
          <Button variant="outlineDark" label="Let’s collaborate" style={{ flex: 1, height: 44 }} onPress={collab} />
        </View>
        <Button
          variant="outlineDark"
          label="Message privately"
          icon={<Icon name="lock" size={14} color={colors.cream} />}
          style={{ height: 44 }}
          onPress={() => messageUser(p.id).catch((e) => showToast((e as Error).message))}
        />
      </View>

      <View style={{ padding: 20, gap: 14 }}>
        {p.open_to.length ? (
          <View style={{ gap: 10 }}>
            <SectionTitle>Open to</SectionTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {p.open_to.map((x) => (
                <Pill key={x} label={x} bg={colors.ink} fg={colors.lime} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />
              ))}
            </View>
          </View>
        ) : null}

        <SectionTitle>Posts</SectionTitle>
        {posts.length ? (
          posts.map((item) => <LivePostCard key={item.post.id} item={item} onChanged={loaded.reload} />)
        ) : (
          <Text style={text.sub}>{first} hasn’t posted yet.</Text>
        )}

        {metAt.length ? (
          <View style={{ gap: 10 }}>
            <SectionTitle>Met in person at</SectionTitle>
            {metAt.map((x) => (
              <Card key={x} style={{ borderRadius: 16, padding: 12, paddingHorizontal: 14 }}>
                <Text style={[text.strong, { fontSize: 13.5 }]}>
                  {x}
                  <Text style={{ fontFamily: fonts.body400, color: colors.muted }}> · checked in</Text>
                </Text>
              </Card>
            ))}
          </View>
        ) : null}
        <Text style={text.small}>No follower counts or likes on profiles. Nexus shows what you make and where you show up.</Text>
      </View>
    </Screen>
  );
}

function DemoPerson({ id }: { id: string }) {
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
          <Button variant="outlineDark" label="Message" style={{ flex: 1, height: 44 }} onPress={() => router.push('/messages')} />
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
  sub: { fontFamily: fonts.body400, fontSize: 13, color: colors.creamMuted },
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
