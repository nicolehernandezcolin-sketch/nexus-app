import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { CoverBanner, CustomizePanel } from '../components/ProfileHeader';
import { ProfilePosts, ProfileTabs, WorkModules } from '../components/ProfileSections';
import { Avatar, Button, Card, Pill, SectionTitle, Tap, text } from '../components/ui';
import { events, profile } from '../data/content';
import { saleLabel } from '../data/fees';
import { LiveProfile } from '../components/LiveProfile';
import { useAuth } from '../lib/auth';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function Profile() {
  const { showToast, profileTab } = useDemo();
  const [customizing, setCustomizing] = useState(false);
  const { live, me } = useAuth();
  if (live) return me ? <LiveProfile /> : null;
  const hosting = profile.hosting.map((id) => events.find((e) => e.id === id)).filter((e) => !!e);

  return (
    <Screen nav>
      <View>
        <CoverBanner />
        <View style={styles.coverActions}>
          <Tap
            accessibilityRole="button"
            accessibilityState={{ expanded: customizing }}
            onPress={() => setCustomizing(!customizing)}
            style={styles.coverBtn}
          >
            <Icon name="pencil" size={16} color={colors.lime} />
            <Text style={styles.coverBtnText}>Customize</Text>
          </Tap>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Privacy and settings"
            onPress={() => router.push('/privacy')}
            style={styles.gear}
          >
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
        <View style={[styles.row, { justifyContent: 'flex-start', gap: 14, alignItems: 'flex-end', marginTop: customizing ? 8 : -50 }]}>
          <Avatar initials={profile.initials} photo={profile.photo} size={92} bg={colors.lime} fg={colors.ink} ring={colors.forest} />
          <Text style={[text.eyebrow, { color: colors.lime, marginBottom: 6 }]}>NEXUS</Text>
        </View>
        <View style={{ gap: 3 }}>
          <Text style={styles.name} accessibilityRole="header">
            {profile.name}
          </Text>
          <Text style={styles.tagline}>
            {profile.tagline} · {profile.location}
          </Text>
        </View>
        <View style={styles.role}>
          <Icon name="star" size={14} color={colors.ink} strokeWidth={2.2} />
          <Text style={styles.roleText}>{profile.role}</Text>
        </View>
        <Text style={styles.bio}>{profile.bio}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {profile.links.map((l) => (
            <Tap key={l.url} accessibilityRole="link" onPress={() => Linking.openURL(l.url)} style={styles.link}>
              <Icon name="link" size={14} color={colors.lime} />
              <Text style={styles.linkText}>{l.label}</Text>
            </Tap>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            variant="lime"
            label="Let’s collaborate"
            style={{ flex: 1, height: 44 }}
            onPress={() => showToast(`Collaboration request sent to **${profile.firstName}**.`)}
          />
          <Button
            variant="outlineDark"
            label="Message"
            style={{ flex: 1, height: 44 }}
            onPress={() => router.push('/messages')}
          />
        </View>
      </View>

      <View style={{ padding: 20, gap: 22 }}>
        <View style={{ gap: 10 }}>
          <SectionTitle>Upcoming from {profile.firstName}</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
            {hosting.map((e) => (
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
                <View style={[styles.upCta, e.featured && { backgroundColor: colors.lime }]}>
                  <Icon name="ticket" size={14} color={e.featured ? colors.ink : colors.lime} />
                  <Text style={[styles.upCtaText, e.featured && { color: colors.ink }]}>{saleLabel(e.sale)}</Text>
                </View>
              </Tap>
            ))}
          </ScrollView>
        </View>

        <View style={{ gap: 10 }}>
          <SectionTitle>Open to</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {profile.openTo.map((x) => (
              <Pill key={x} label={x} bg={colors.ink} fg={colors.lime} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />
            ))}
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <ProfileTabs />
          {profileTab === 'work' ? <WorkModules /> : <ProfilePosts />}
        </View>

        {profileTab === 'work' ? (
          <View style={{ gap: 10 }}>
            <SectionTitle>Met in person at</SectionTitle>
            {profile.metAt.map((x) => (
              <Card key={x} style={styles.met}>
                <View style={styles.star}>
                  <Icon name="star" size={18} color={colors.forest} />
                </View>
                <Text style={{ flex: 1, fontSize: 13.5, fontFamily: fonts.body600, color: colors.ink }}>
                  {x}
                  <Text style={{ fontFamily: fonts.body400, color: colors.muted }}> · checked in</Text>
                </Text>
              </Card>
            ))}
            <Text style={text.small}>No follower counts or likes on profiles. Nexus shows what you make and where you show up.</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.forest, padding: 20, paddingTop: 0, gap: 14 },
  customize: { backgroundColor: colors.forest, paddingHorizontal: 16, paddingTop: 16 },
  coverActions: { position: 'absolute', top: 14, right: 14, left: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  coverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(31,32,28,0.72)',
  },
  coverBtnText: { fontFamily: fonts.body600, fontSize: 13, color: colors.lime },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gear: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(31,32,28,0.72)', alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.display800, fontSize: 22, lineHeight: 25, color: colors.cream },
  tagline: { fontFamily: fonts.body400, fontSize: 13, color: colors.creamMuted },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.lime,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  roleText: { fontFamily: fonts.body600, fontSize: 12.5, color: colors.ink },
  bio: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 21, color: colors.cream },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.olive,
  },
  linkText: { fontFamily: fonts.body600, fontSize: 12.5, color: colors.lime },
  upcoming: { width: 170, backgroundColor: colors.paper, borderRadius: 20, padding: 14, gap: 10 },
  upDate: { width: 46, height: 48, borderRadius: 12, backgroundColor: colors.stone, alignItems: 'center', justifyContent: 'center', gap: 2 },
  upMonth: { fontFamily: fonts.display700, fontSize: 9, letterSpacing: 1, color: colors.forest },
  upDay: { fontFamily: fonts.display800, fontSize: 17, lineHeight: 18, color: colors.forest },
  upTitle: { fontFamily: fonts.display700, fontSize: 15, lineHeight: 18, color: colors.ink, minHeight: 36 },
  upCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.forest,
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 30,
  },
  upCtaText: { fontFamily: fonts.body600, fontSize: 12, color: colors.lime },
  met: { borderRadius: 16, padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  star: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
});
