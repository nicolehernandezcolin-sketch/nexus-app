// Your own profile, from the database.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WorkModule } from '../data/content';
import { saleLabel } from '../data/fees';
import { fetchCheckins, fetchEvents, fetchPostsBy, fetchWork, useLoad } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toNexusEvent } from '../lib/mappers';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';
import { Screen } from './Chrome';
import { LivePostCard } from './Feed';
import { Icon } from './Icon';
import { MeAvatar } from './Me';
import { CoverBanner, CustomizePanel } from './ProfileHeader';
import { PromptCards } from './Prompts';
import { ProfileTabs, WorkModules } from './ProfileSections';
import { Button, Card, Pill, SectionTitle, Tap, text } from './ui';

export function LiveProfile() {
  const { me } = useAuth();
  const { profileTab, header, setHeader } = useDemo();
  const [customizing, setCustomizing] = useState(false);
  const id = me!.id;

  // The cover comes from your saved header.
  useEffect(() => {
    if (me?.header) setHeader(me.header);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  const data = useLoad(async () => {
    const [work, posts, events, metAt] = await Promise.all([fetchWork(id), fetchPostsBy(id), fetchEvents(), fetchCheckins(id)]);
    const modules: WorkModule[] = work.modules
      .filter((m) => !m.hidden)
      .map((m) => ({
        id: m.id,
        title: m.title,
        blurb: m.blurb,
        items: work.items
          .filter((i) => i.module_id === m.id)
          .map((i) => ({
            id: i.id,
            title: i.title,
            detail: i.detail,
            kind: i.kind,
            about: i.about,
            art: {
              bg: colors.forest,
              fg: colors.lime,
              height: 148,
              label: i.title,
              image: i.imageUrl ? { uri: i.imageUrl } : undefined,
              plain: true,
            },
            eventId: i.event_id ?? undefined,
          })),
      }));
    const hosting = events.filter((e) => e.host === id).map(toNexusEvent);
    return { modules, posts, hosting, metAt };
  }, [id]);

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else data.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (!me) return null;

  return (
    <Screen nav cover={header.cover}>
      <View>
        <CoverBanner />
        <View style={styles.coverActions}>
          <Tap accessibilityRole="button" accessibilityState={{ expanded: customizing }} onPress={() => setCustomizing(!customizing)} style={styles.coverBtn}>
            <Icon name="pencil" size={16} color={colors.lime} />
            <Text style={styles.coverBtnText}>Customize</Text>
          </Tap>
          <Pressable accessibilityRole="button" accessibilityLabel="Privacy and settings" onPress={() => router.push('/privacy')} style={styles.gear}>
            <Icon name="gear" size={20} color={colors.lime} />
          </Pressable>
        </View>
      </View>
      {customizing ? (
        <View style={styles.customize}>
          <CustomizePanel onDone={() => setCustomizing(false)} />
        </View>
      ) : null}

      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: customizing ? 8 : -50 }}>
          <MeAvatar size={92} ring={colors.forest} />
          <Text style={[text.eyebrow, { color: colors.lime, marginBottom: 6 }]}>NEXUS</Text>
        </View>
        <View style={{ gap: 3 }}>
          <Text style={styles.name} accessibilityRole="header">
            {me.name || 'Add your name'}
          </Text>
          {me.tagline || me.location ? <Text style={styles.tagline}>{[me.tagline, me.location].filter(Boolean).join(' · ')}</Text> : null}
        </View>
        {me.bio ? <Text style={styles.bio}>{me.bio}</Text> : <Text style={styles.tagline}>Add a short bio so people know what you make.</Text>}
        <Button variant="lime" label="Edit profile" icon={<Icon name="pencil" size={16} />} style={{ height: 44 }} onPress={() => router.push('/edit-profile')} />
      </View>

      <View style={{ padding: 20, gap: 22 }}>
        {me.prompts?.length ? (
          <PromptCards prompts={me.prompts} />
        ) : (
          <Tap accessibilityRole="button" onPress={() => router.push('/edit-profile')} style={styles.addPrompts}>
            <Icon name="plus" size={18} color={colors.forest} />
            <View style={{ flex: 1 }}>
              <Text style={text.strong}>Add prompts to your profile</Text>
              <Text style={text.small}>“Currently making…”, “A dream collab…”. They help people know you before they reach out.</Text>
            </View>
          </Tap>
        )}

        {data.loading && !data.data ? <ActivityIndicator color={colors.forest} /> : null}
        {data.error ? <Text style={text.sub}>Couldn’t load your profile: {data.error}</Text> : null}

        {data.data?.hosting.length ? (
          <View style={{ gap: 10 }}>
            <SectionTitle>Upcoming from you</SectionTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
              {data.data.hosting.map((e) => (
                <Tap
                  key={e.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
                  style={[styles.upcoming, e.featured && { backgroundColor: colors.forest }]}
                >
                  <View style={[styles.upDate, e.featured && { backgroundColor: colors.lime }]}>
                    <Text style={styles.upMonth}>{e.month}</Text>
                    <Text style={styles.upDay}>{e.day}</Text>
                  </View>
                  <Text style={[styles.upTitle, e.featured && { color: colors.cream }]} numberOfLines={2}>
                    {e.title}
                  </Text>
                  <Text style={[text.small, e.featured && { color: colors.creamMuted }]}>{saleLabel(e.sale)}</Text>
                </Tap>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {me.open_to.length ? (
          <View style={{ gap: 10 }}>
            <SectionTitle>Open to</SectionTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {me.open_to.map((x) => (
                <Pill key={x} label={x} bg={colors.ink} fg={colors.lime} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ gap: 14 }}>
          <ProfileTabs />
          {profileTab === 'work' ? (
            data.data ? <WorkModules source={data.data.modules} /> : null
          ) : data.data?.posts.length ? (
            data.data.posts.map((item) => <LivePostCard key={item.post.id} item={item} showPin onChanged={data.reload} />)
          ) : (
            <Card style={{ padding: 18, gap: 10 }}>
              <Text style={text.strong}>No posts yet</Text>
              <Button label="Write your first post" onPress={() => router.push('/compose')} />
            </Card>
          )}
        </View>

        {profileTab === 'work' && data.data?.metAt.length ? (
          <View style={{ gap: 10 }}>
            <SectionTitle>Met in person at</SectionTitle>
            {data.data.metAt.map((x) => (
              <Card key={x} style={styles.met}>
                <Text style={{ flex: 1, fontSize: 13.5, fontFamily: fonts.body600, color: colors.ink }}>
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

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.forest, padding: 20, paddingTop: 0, gap: 14 },
  customize: { backgroundColor: colors.forest, paddingHorizontal: 16, paddingTop: 16 },
  coverActions: { position: 'absolute', top: 14, right: 14, left: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  coverBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: 'rgba(31,32,28,0.72)' },
  coverBtnText: { fontFamily: fonts.body600, fontSize: 13, color: colors.lime },
  gear: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(31,32,28,0.72)', alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.display800, fontSize: 22, lineHeight: 25, color: colors.cream },
  tagline: { fontFamily: fonts.body400, fontSize: 13, color: colors.creamMuted },
  bio: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 21, color: colors.cream },
  upcoming: { width: 170, backgroundColor: colors.paper, borderRadius: 20, padding: 14, gap: 10 },
  upDate: { width: 46, height: 48, borderRadius: 12, backgroundColor: colors.stone, alignItems: 'center', justifyContent: 'center', gap: 2 },
  upMonth: { fontFamily: fonts.display700, fontSize: 9, letterSpacing: 1, color: colors.forest },
  upDay: { fontFamily: fonts.display800, fontSize: 17, lineHeight: 18, color: colors.forest },
  upTitle: { fontFamily: fonts.display700, fontSize: 15, lineHeight: 18, color: colors.ink, minHeight: 36 },
  addPrompts: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.line2 },
  met: { borderRadius: 16, padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
