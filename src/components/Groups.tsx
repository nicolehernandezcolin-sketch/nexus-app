// Private groups: the list on the timeline's Groups tab.
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { demoGroups } from '../data/content';
import { fetchMyGroups, useLoad } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Avatar, Button, Card, Rise, Tap, text } from './ui';

export function PrivateBadge({ label = 'Private · members only', dark }: { label?: string; dark?: boolean }) {
  return (
    <View style={[styles.badge, dark && { backgroundColor: colors.ink }]}>
      <Icon name="lock" size={12} color={dark ? colors.lime : colors.forest} strokeWidth={2.4} />
      <Text style={[styles.badgeText, dark && { color: colors.lime }]}>{label}</Text>
    </View>
  );
}

type Row = { id: string; name: string; about: string; members: number; faces: string[] };

export function GroupsTab() {
  const { live } = useAuth();
  const loaded = useLoad(async () => (live ? await fetchMyGroups() : []), [live]);
  const groups: Row[] = live
    ? (loaded.data ?? []).map((g) => ({ id: g.id, name: g.name, about: g.about, members: g.members, faces: [] }))
    : demoGroups.map((g) => ({ id: g.id, name: g.name, about: g.about, members: g.memberCount, faces: g.members }));

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.explainer}>
        <Icon name="shield" size={20} color={colors.lime} />
        <Text style={styles.explainerText}>
          Share work in progress with just the people you choose. Group posts never reach Discover, profiles or the open timeline, and their files open only for members.
        </Text>
      </View>

      {live && loaded.loading && !loaded.data ? <ActivityIndicator color={colors.forest} /> : null}
      {live && loaded.data?.length === 0 ? <Text style={text.sub}>You’re not in any groups yet. Start one and invite people you follow.</Text> : null}

      {groups.map((g, i) => (
        <Rise key={g.id} delay={i * 70}>
          <Tap accessibilityRole="button" onPress={() => router.push({ pathname: '/group/[id]', params: { id: g.id } })}>
            <Card style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.lockTile}>
                  <Icon name="lock" size={20} color={colors.lime} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[text.strong, { fontSize: 16 }]}>{g.name}</Text>
                  <Text style={text.small}>
                    {g.members} member{g.members === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Icon name="chevron" size={18} color={colors.olive} strokeWidth={2.2} />
                </View>
              </View>
              {g.about ? <Text style={text.sub}>{g.about}</Text> : null}
              {g.faces.length ? (
                <View style={{ flexDirection: 'row' }}>
                  {g.faces.map((f, j) => (
                    <View key={f} style={{ marginLeft: j ? -8 : 0 }}>
                      <Avatar initials={f} size={28} bg={[colors.olive, colors.forest, colors.ink][j % 3]} ring={colors.paper} />
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          </Tap>
        </Rise>
      ))}

      <Button variant="ghost" label="Start a private group" icon={<Icon name="plus" size={16} color={colors.forest} strokeWidth={2.4} />} style={{ height: 48 }} onPress={() => router.push('/group/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: colors.limeSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontFamily: fonts.body600, fontSize: 11.5, color: colors.forest },
  explainer: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.ink, borderRadius: 18, padding: 14 },
  explainerText: { flex: 1, fontFamily: fonts.body400, fontSize: 13, lineHeight: 19, color: colors.cream },
  card: { padding: 16, gap: 10 },
  lockTile: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
});
