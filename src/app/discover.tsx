import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PageHeader, Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { ArtBlock, Chip, Pill, Rise, Tap, text } from '../components/ui';
import { Creator, creators, Discipline, disciplines } from '../data/content';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function Discover() {
  const [filter, setFilter] = useState<Discipline>('All');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const shown = creators.filter(
    (c) => (filter === 'All' || c.discipline === filter) && (!q || `${c.name} ${c.role} ${c.openTo}`.toLowerCase().includes(q)),
  );
  // Two staggered columns, like a masonry grid.
  const columns = [shown.filter((_, i) => i % 2 === 0), shown.filter((_, i) => i % 2 === 1)];

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
          <View style={{ paddingHorizontal: 20, gap: 14 }}>
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
              {disciplines.map((d) => (
                <Chip key={d} dark label={d} selected={filter === d} onPress={() => setFilter(d)} />
              ))}
            </ScrollView>
            <View style={styles.note}>
              <View style={styles.dot} />
              <Text style={[text.small, { color: colors.muted2 }]}>Only creators who opted in to being found show up here.</Text>
            </View>
          </View>
        </View>
      }
      contentStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 }}
    >
      {shown.length === 0 ? (
        <Text style={[text.sub, { textAlign: 'center', marginVertical: 24 }]}>No one matches yet. Try another word or filter.</Text>
      ) : (
        <View style={styles.grid}>
          {columns.map((col, c) => (
            <View key={c} style={styles.col}>
              {col.map((creator, i) => (
                <Rise key={creator.name} delay={(i * 2 + c) * 60 + 100}>
                  <CreatorTile creator={creator} />
                </Rise>
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function CreatorTile({ creator: c }: { creator: Creator }) {
  const { showToast } = useDemo();
  return (
    <Tap
      accessibilityRole="button"
      onPress={() => showToast(`**${c.name}** is ${c.openTo.toLowerCase()}. In the full app you’d see their boards here.`)}
      style={styles.tile}
    >
      <ArtBlock art={c.art} radius={0} />
      <View style={{ padding: 12, paddingTop: 10, gap: 3 }}>
        <Text style={[text.strong, { fontSize: 13.5 }]}>{c.name}</Text>
        <Text style={[text.small, { fontSize: 12 }]}>{c.role}</Text>
        <Pill label={c.openTo} bg={colors.limeSoft} fg={colors.forest} style={{ marginTop: 5, paddingHorizontal: 8, paddingVertical: 4 }} />
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
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 999,
  },
  input: { flex: 1, fontFamily: fonts.body400, fontSize: 15, color: colors.ink, outlineStyle: 'none' } as object,
  note: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.olive },
  grid: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  col: { flex: 1, gap: 10 },
  tile: { backgroundColor: colors.paper, borderRadius: 18, overflow: 'hidden' },
});
