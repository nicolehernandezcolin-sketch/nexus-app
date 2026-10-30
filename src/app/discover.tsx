import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PageHeader, Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { ArtBlock, Chip, Pill, Rise, Switch, Tap, text } from '../components/ui';
import { Creator, creators, Discipline, disciplines, ProjectType, projectTypes, Skill, skills } from '../data/content';
import { discoverPeople, useLoad } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colorFor, initialsOf } from '../lib/format';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

const NEARBY = ['San Diego', 'Chula Vista'];

type Match = { needs: Skill[]; project: ProjectType | null; nearby: boolean };
type Scored = { creator: Creator; percent: number; reasons: string[] };

/**
 * Scores a creator against what you're looking for. Skills carry the most weight,
 * then project type, being nearby, and Nexus events you've both been to.
 * Anyone missing a required skill, or outside the area when "nearby" is on, is left out.
 */
function score(c: Creator, m: Match): Scored | null {
  let points = 0;
  let possible = 15;
  const reasons: string[] = [];

  if (m.needs.length) {
    possible += 60;
    const hit = c.skills.find((s) => m.needs.includes(s));
    if (!hit) return null;
    points += 60;
    reasons.push(hit);
  }
  if (m.project) {
    possible += 25;
    if (c.projects.includes(m.project)) {
      points += 25;
      reasons.push(`Works on ${m.project === 'Album art' ? 'album art' : `${m.project.toLowerCase()}s`}`);
    }
  }
  const near = NEARBY.includes(c.city);
  if (m.nearby) {
    if (!near) return null;
    possible += 10;
    points += 10;
    reasons.push(c.city);
  }
  const shared = c.sharedAt.length;
  if (shared) {
    points += Math.min(shared * 5, 15);
    reasons.push(`${shared} Nexus event${shared > 1 ? 's' : ''} in common`);
  }
  return { creator: c, percent: Math.round((points / possible) * 100), reasons };
}

const disciplineFor = (roles: string[]): Creator['discipline'] => {
  if (roles.some((r) => ['Musician', 'Producer'].includes(r))) return 'Music';
  if (roles.includes('Filmmaker')) return 'Film';
  if (roles.includes('Dancer')) return 'Movement';
  return 'Visual';
};

/** A real member from discover_people(), shaped like the demo's creators. */
function toCreator(r: Awaited<ReturnType<typeof discoverPeople>>[number]): Creator {
  return {
    id: r.id,
    name: r.name || 'New member',
    role: [r.roles.slice(0, 2).join(' · ') || r.tagline, r.location].filter(Boolean).join(' · '),
    discipline: disciplineFor(r.roles),
    openTo: r.open_to[0] ? `Open to ${r.open_to[0].toLowerCase()}` : 'Open to collaborating',
    art: {
      bg: colorFor(r.id),
      fg: colors.lime,
      height: 150,
      label: initialsOf(r.name),
      image: r.avatarUrl ? { uri: r.avatarUrl } : undefined,
      plain: true,
    },
    skills: r.skills as Skill[],
    projects: r.projects as ProjectType[],
    city: r.location,
    sharedAt: r.shared_at,
    mutuals: r.mutuals,
  };
}

const hasCommonLink = (c: Creator) => c.sharedAt.length > 0 || c.mutuals.length > 0;

/** The greyed-out line on a card saying what you have in common. */
function CommonLink({ creator: c }: { creator: Creator }) {
  if (!hasCommonLink(c)) return null;
  const lines: string[] = [];
  if (c.sharedAt.length) lines.push(`Both at ${c.sharedAt[0]}${c.sharedAt.length > 1 ? ` +${c.sharedAt.length - 1}` : ''}`);
  if (c.mutuals.length) lines.push(`Knows ${c.mutuals[0]}${c.mutuals.length > 1 ? ` +${c.mutuals.length - 1}` : ''}`);
  return (
    <View style={styles.common}>
      {lines.map((l, i) => (
        <View key={l} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
          <View style={{ marginTop: 3 }}>
            <Icon name={i === 0 && c.sharedAt.length ? 'events' : 'users'} size={11} color={colors.navOff} strokeWidth={2.2} />
          </View>
          <Text style={styles.commonText}>
            {l}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function Discover() {
  const [filter, setFilter] = useState<Discipline>('All');
  const [query, setQuery] = useState('');
  const [matching, setMatching] = useState(false);
  const [mutualsOnly, setMutualsOnly] = useState(false);
  const [match, setMatch] = useState<Match>({ needs: [], project: null, nearby: false });

  const { live } = useAuth();
  const people = useLoad(async () => (live ? (await discoverPeople()).map(toCreator) : creators), [live]);
  const source = people.data ?? (live ? [] : creators);

  const q = query.trim().toLowerCase();
  const base = source.filter(
    (c) =>
      (filter === 'All' || c.discipline === filter) &&
      (!mutualsOnly || hasCommonLink(c)) &&
      (!q || `${c.name} ${c.role} ${c.openTo}`.toLowerCase().includes(q)),
  );
  const scored: Scored[] = matching
    ? base
        .map((c) => score(c, match))
        .filter((s): s is Scored => !!s)
        .sort((a, b) => b.percent - a.percent)
    : base.map((c) => ({ creator: c, percent: 0, reasons: [] }));

  const toggleNeed = (s: Skill) =>
    setMatch((m) => ({ ...m, needs: m.needs.includes(s) ? m.needs.filter((x) => x !== s) : [...m.needs, s] }));

  // Two staggered columns, like a masonry grid.
  const columns = [scored.filter((_, i) => i % 2 === 0), scored.filter((_, i) => i % 2 === 1)];

  return (
    <Screen
      nav
      header={
        <View style={{ paddingBottom: 12 }}>
          <PageHeader
            title="Find your people"
            right={
              <View style={styles.globe}>
                <Icon name="globe" size={44} color={colors.lime} strokeWidth={1.6} />
              </View>
            }
          />
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <View style={styles.search}>
              <Icon name="discover" size={18} color={colors.forest} strokeWidth={2.2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Try: vocalist, Chula Vista"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Search creatives"
                style={styles.input}
                returnKeyType="search"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Tap
                accessibilityRole="switch"
                accessibilityState={{ checked: matching }}
                onPress={() => setMatching(!matching)}
                style={[styles.matchToggle, matching && { backgroundColor: colors.lime, borderColor: colors.lime }]}
              >
                <Icon name="sparkle" size={16} color={matching ? colors.ink : colors.forest} />
                <Text style={[styles.matchToggleText, matching && { color: colors.ink }]}>Talent match</Text>
              </Tap>
              <Tap
                accessibilityRole="switch"
                accessibilityState={{ checked: mutualsOnly }}
                onPress={() => setMutualsOnly(!mutualsOnly)}
                style={[styles.matchToggle, mutualsOnly && { backgroundColor: colors.ink, borderColor: colors.ink }]}
              >
                <Icon name="users" size={16} color={mutualsOnly ? colors.lime : colors.forest} />
                <Text style={[styles.matchToggleText, mutualsOnly && { color: colors.lime }]}>Mutuals</Text>
              </Tap>
              {disciplines.map((d) => (
                <Chip key={d} dark label={d} selected={filter === d} onPress={() => setFilter(d)} />
              ))}
            </ScrollView>
          </View>
        </View>
      }
      contentStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 14 }}
    >
      {matching ? <MatchPanel match={match} toggleNeed={toggleNeed} setMatch={setMatch} /> : null}

      {!matching ? (
        <View style={styles.note}>
          <View style={styles.dot} />
          <Text style={[text.small, { color: colors.muted2, flex: 1 }]}>
            {mutualsOnly
              ? 'People you share a past Nexus event or a connection with.'
              : 'Only creators who opted in to being found show up here.'}
          </Text>
        </View>
      ) : null}

      {live && people.loading && !people.data ? <ActivityIndicator color={colors.forest} style={{ marginVertical: 24 }} /> : null}
      {live && people.error ? <Text style={[text.sub, { textAlign: 'center' }]}>Couldn’t load Discover: {people.error}</Text> : null}

      {scored.length === 0 && !(live && people.loading) ? (
        <Text style={[text.sub, { textAlign: 'center', marginVertical: 24 }]}>
          {matching || mutualsOnly ? 'No one matches all of that yet. Try fewer filters.' : 'No one matches yet. Try another word or filter.'}
        </Text>
      ) : (
        <View style={styles.grid}>
          {columns.map((col, c) => (
            <View key={c} style={styles.col}>
              {col.map((s, i) => (
                <Rise key={`${s.creator.id ?? s.creator.name}-${matching}`} delay={(i * 2 + c) * 60 + 100}>
                  <CreatorTile scored={s} showMatch={matching} />
                </Rise>
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function MatchPanel({
  match,
  toggleNeed,
  setMatch,
}: {
  match: Match;
  toggleNeed: (s: Skill) => void;
  setMatch: Dispatch<SetStateAction<Match>>;
}) {
  return (
    <Rise>
      <View style={styles.panel}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="sparkle" size={18} color={colors.lime} />
          <Text style={styles.panelTitle}>Talent match</Text>
        </View>
        <Text style={styles.panelSub}>Tell us what your project needs. We rank creators who opted in by how well they fit.</Text>

        <Text style={styles.label}>I need</Text>
        <View style={styles.chips}>
          {skills.map((s) => (
            <MatchChip key={s} label={s} on={match.needs.includes(s)} onPress={() => toggleNeed(s)} />
          ))}
        </View>

        <Text style={styles.label}>For a</Text>
        <View style={styles.chips}>
          {projectTypes.map((p) => (
            <MatchChip key={p} label={p} on={match.project === p} onPress={() => setMatch((m) => ({ ...m, project: m.project === p ? null : p }))} />
          ))}
        </View>

        <View style={styles.nearRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.nearTitle}>Near San Diego</Text>
            <Text style={styles.panelSub}>So you can actually meet up.</Text>
          </View>
          <Switch label="Near San Diego" value={match.nearby} onToggle={() => setMatch((m) => ({ ...m, nearby: !m.nearby }))} />
        </View>
      </View>
    </Rise>
  );
}

function MatchChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Tap
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.mChip, on && { backgroundColor: colors.lime, borderColor: colors.lime }]}
    >
      <Text style={[styles.mChipText, on && { color: colors.ink }]}>{label}</Text>
    </Tap>
  );
}

/** A bar that fills to the match percentage. */
function MatchBar({ percent }: { percent: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: percent, duration: 600, delay: 200, useNativeDriver: false }).start();
  }, [a, percent]);
  return (
    <View style={styles.bar}>
      <Animated.View style={[styles.barFill, { width: a.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
}

function CreatorTile({ scored: { creator: c, percent, reasons }, showMatch }: { scored: Scored; showMatch: boolean }) {
  const { showToast } = useDemo();
  return (
    <Tap
      accessibilityRole="button"
      accessibilityLabel={showMatch ? `${c.name}, ${percent}% match` : c.name}
      onPress={() =>
        c.id
          ? router.push({ pathname: '/person/[id]', params: { id: c.id } })
          : showToast(`**${c.name}** is ${c.openTo.toLowerCase()}. In the full app you’d see their work here.`)
      }
      style={styles.tile}
    >
      <View>
        <ArtBlock art={c.art} radius={0} />
        {showMatch ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{percent}% match</Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 12, paddingTop: 10, gap: 3 }}>
        <Text style={[text.strong, { fontSize: 13.5 }]}>{c.name}</Text>
        <Text style={[text.small, { fontSize: 12 }]}>{c.role}</Text>
        {showMatch ? (
          <View style={{ gap: 6, marginTop: 6 }}>
            <MatchBar percent={percent} />
            {reasons.map((r) => (
              <View key={r} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Icon name="check" size={12} color={colors.olive} strokeWidth={2.8} />
                <Text style={[text.small, { fontSize: 11.5, lineHeight: 15, flex: 1 }]}>{r}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Pill label={c.openTo} bg={colors.limeSoft} fg={colors.forest} style={{ marginTop: 5, paddingHorizontal: 8, paddingVertical: 4 }} />
        )}
        <CommonLink creator={c} />
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  globe: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 16,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 999,
  },
  input: { flex: 1, fontFamily: fonts.body400, fontSize: 15, color: colors.ink, outlineStyle: 'none' } as object,
  matchToggle: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.forest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchToggleText: { fontFamily: fonts.body600, fontSize: 13.5, color: colors.forest },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.olive },
  panel: { backgroundColor: colors.forest, borderRadius: 22, padding: 16, gap: 10 },
  panelTitle: { fontFamily: fonts.display800, fontSize: 18, color: colors.lime },
  panelSub: { fontFamily: fonts.body400, fontSize: 12.5, lineHeight: 18, color: colors.creamMuted },
  label: { fontFamily: fonts.body600, fontSize: 12.5, color: colors.cream, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mChip: { height: 36, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: colors.olive, justifyContent: 'center' },
  mChipText: { fontFamily: fonts.body500, fontSize: 13, color: colors.cream },
  nearRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  nearTitle: { fontFamily: fonts.body600, fontSize: 14, color: colors.cream },
  common: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.stone, gap: 3 },
  commonText: { flex: 1, fontFamily: fonts.body500, fontSize: 11.5, color: colors.muted, lineHeight: 16 },
  grid: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  col: { flex: 1, gap: 10 },
  tile: { backgroundColor: colors.paper, borderRadius: 18, overflow: 'hidden' },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.ink, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontFamily: fonts.display800, fontSize: 11, color: colors.lime },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.stone, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.olive },
});
