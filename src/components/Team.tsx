// An event's team: a compact avatar row for tiles, and a full list for detail pages.
// Every person links to their profile.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { personById, teams } from '../data/content';
import { fetchTeam, useLoad } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colorFor, initialsOf } from '../lib/format';
import { openProfile } from './Feed';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Avatar, Card, SectionTitle, Tap, text } from './ui';

export function openPerson(id: string) {
  if (id === 'nicole') router.push('/profile');
  else router.push({ pathname: '/person/[id]', params: { id } });
}

/** Overlapping avatars; each one opens that person's profile. */
export function TeamStack({ workId, max = 4 }: { workId: string; max?: number }) {
  const members = teams[workId];
  if (!members) return null;
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <View style={styles.stack}>
      {shown.map((m, i) => {
        const p = personById(m.person);
        if (!p) return null;
        return (
          <Tap
            key={m.person}
            accessibilityRole="link"
            accessibilityLabel={`${p.name}, ${m.part}`}
            onPress={() => openPerson(p.id)}
            style={{ marginLeft: i ? -8 : 0 }}
          >
            <Avatar initials={p.initials} photo={p.photo} bg={p.avatar} fg={p.avatar === colors.lime ? colors.ink : colors.cream} size={30} ring={colors.paper} />
          </Tap>
        );
      })}
      {extra > 0 ? (
        <Tap accessibilityRole="button" accessibilityLabel="See the whole team" onPress={() => router.push({ pathname: '/work/[id]', params: { id: workId } })} style={styles.more}>
          <Text style={styles.moreText}>+{extra}</Text>
        </Tap>
      ) : null}
    </View>
  );
}

/** The whole team with each person's part. */
export function TeamList({ workId, title = 'Team' }: { workId: string; title?: string }) {
  const members = teams[workId];
  if (!members) return null;
  return (
    <View style={{ gap: 10 }}>
      <SectionTitle>{title}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {members.map((m, i) => {
          const p = personById(m.person);
          if (!p) return null;
          return (
            <Tap
              key={m.person}
              accessibilityRole="link"
              onPress={() => openPerson(p.id)}
              style={[styles.row, i > 0 && styles.divider]}
            >
              <Avatar initials={p.initials} photo={p.photo} bg={p.avatar} fg={p.avatar === colors.lime ? colors.ink : colors.cream} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[text.strong, { fontSize: 14.5 }]}>{p.name}</Text>
                <Text style={text.small}>{m.part}</Text>
              </View>
              <View style={{ transform: [{ rotate: '-90deg' }] }}>
                <Icon name="chevron" size={18} color={colors.olive} strokeWidth={2.2} />
              </View>
            </Tap>
          );
        })}
      </Card>
    </View>
  );
}

/** A real event's team, from the database. */
export function LiveTeamList({ eventId, title = 'Team' }: { eventId: string; title?: string }) {
  const { me } = useAuth();
  const team = useLoad(() => fetchTeam(eventId), [eventId]);
  if (!team.data?.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <SectionTitle>{title}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {team.data.map((m, i) => (
          <Tap key={m.person} accessibilityRole="link" onPress={() => openProfile(m.person, me?.id)} style={[styles.row, i > 0 && styles.divider]}>
            <Avatar
              initials={initialsOf(m.profile.name)}
              photo={m.avatarUrl ? { uri: m.avatarUrl } : undefined}
              bg={colorFor(m.person)}
              size={40}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[text.strong, { fontSize: 14.5 }]}>{m.profile.name}</Text>
              <Text style={text.small}>{m.part}</Text>
            </View>
          </Tap>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'row', alignItems: 'center' },
  more: {
    marginLeft: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.limeSoft,
    borderWidth: 2,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { fontFamily: fonts.body600, fontSize: 10.5, color: colors.forest },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, minHeight: 56 },
  divider: { borderTopWidth: 1, borderTopColor: colors.stone },
});
