import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { PersonalTimeline, ProfileTabs, WorkModules } from '../components/ProfileSections';
import { Avatar, Button, Card, Pill, SectionTitle, text } from '../components/ui';
import { profile } from '../data/content';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function Profile() {
  const { showToast, profileTab } = useDemo();
  return (
    <Screen nav>
      <View style={styles.hero}>
        <View style={styles.row}>
          <Text style={[text.eyebrow, { color: colors.lime }]}>NEXUS</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Privacy and settings"
            onPress={() => router.push('/privacy')}
            style={styles.gear}
          >
            <Icon name="gear" size={20} color={colors.lime} />
          </Pressable>
        </View>
        <View style={[styles.row, { justifyContent: 'flex-start', gap: 14 }]}>
          <Avatar initials={profile.initials} size={76} bg={colors.lime} fg={colors.ink} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} accessibilityRole="header">
              {profile.name}
            </Text>
            <Text style={styles.tagline}>{profile.tagline}</Text>
          </View>
        </View>
        <Text style={styles.bio}>{profile.bio}</Text>
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
            onPress={() => showToast('Messaging is coming in the full app.')}
          />
        </View>
      </View>

      <View style={{ padding: 20, gap: 22 }}>
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
          {profileTab === 'work' ? <WorkModules /> : <PersonalTimeline />}
        </View>

        {profileTab === 'work' ? (
          <View style={{ gap: 10 }}>
            <SectionTitle>Met in person at</SectionTitle>
            {profile.metAt.map((x) => (
              <Card key={x} style={styles.met}>
                <View style={styles.star}>
                  <Icon name="star" size={18} color={colors.forest} />
                </View>
                <Text style={{ fontSize: 13.5, fontFamily: fonts.body600, color: colors.ink }}>
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
  hero: { backgroundColor: colors.forest, padding: 20, paddingTop: 22, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gear: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.forest2, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.display800, fontSize: 22, lineHeight: 25, color: colors.cream },
  tagline: { fontFamily: fonts.body400, fontSize: 13.5, color: colors.creamMuted, marginTop: 3 },
  bio: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 21, color: colors.cream },
  met: { borderRadius: 16, padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  star: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
});
