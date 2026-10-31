// Profile prompts: short answers that give a feel for someone before you reach out.
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Prompt, promptQuestions } from '../data/content';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Button, Chip, SectionTitle, Tap, text } from './ui';

const MAX_PROMPTS = 3;
const MAX_ANSWER = 160;

// Each card gets its own look, in order.
const looks = [
  { bg: colors.lime, q: colors.forest, a: colors.ink },
  { bg: colors.forest, q: colors.lime, a: colors.cream },
  { bg: colors.paper, q: colors.forest2, a: colors.ink },
];

/** The prompt cards on a profile. `onRiff` adds a button to reply to one. */
export function PromptCards({ prompts, onRiff }: { prompts: Prompt[]; onRiff?: (p: Prompt) => void }) {
  const shown = prompts.filter((p) => p.a.trim());
  if (!shown.length) return null;
  return (
    <View style={{ gap: 10 }}>
      {shown.map((p, i) => {
        const look = looks[i % looks.length];
        return (
          <View key={`${p.q}-${i}`} style={[styles.card, { backgroundColor: look.bg }, i % 2 ? styles.tiltRight : styles.tiltLeft]}>
            <Text style={[styles.q, { color: look.q }]}>{p.q}</Text>
            <Text style={[styles.a, { color: look.a }]}>{p.a}</Text>
            {onRiff ? (
              <Tap
                accessibilityRole="button"
                accessibilityLabel={`Reply to “${p.q}”`}
                onPress={() => onRiff(p)}
                style={[styles.riff, { borderColor: look.q }]}
              >
                <Icon name="chat" size={15} color={look.q} />
                <Text style={[styles.riffText, { color: look.q }]}>Riff on this</Text>
              </Tap>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** The opening line of a message sent from "Riff on this". */
export const riffDraft = (p: Prompt) => `Re “${p.q}” `;

/** Choose up to three prompts and answer them. */
export function PromptEditor({ value, onChange }: { value: Prompt[]; onChange: (v: Prompt[]) => void }) {
  const set = (i: number, change: Partial<Prompt>) => onChange(value.map((p, j) => (j === i ? { ...p, ...change } : p)));
  const unused = promptQuestions.filter((q) => !value.some((p) => p.q === q));
  return (
    <View style={{ gap: 12 }}>
      <SectionTitle>Prompts</SectionTitle>
      <Text style={text.small}>Up to three. They show on your profile so people get a feel for you and your work.</Text>
      {value.map((p, i) => (
        <View key={i} style={styles.editCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {[p.q, ...unused].map((q) => (
              <Chip key={q} label={q} selected={p.q === q} onPress={() => set(i, { q })} />
            ))}
          </ScrollView>
          <TextInput
            value={p.a}
            onChangeText={(a) => set(i, { a: a.slice(0, MAX_ANSWER) })}
            accessibilityLabel={`Your answer to “${p.q}”`}
            placeholder="Your answer"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={text.small}>{`${p.a.length}/${MAX_ANSWER}`}</Text>
            <Button variant="ghost" label="Remove" onPress={() => onChange(value.filter((_, j) => j !== i))} />
          </View>
        </View>
      ))}
      {value.length < MAX_PROMPTS && unused.length ? (
        <Button
          variant="ghost"
          label="Add a prompt"
          icon={<Icon name="plus" size={16} color={colors.forest} />}
          onPress={() => onChange([...value, { q: unused[0], a: '' }])}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, gap: 10 },
  tiltLeft: { transform: [{ rotate: '-0.6deg' }] },
  tiltRight: { transform: [{ rotate: '0.6deg' }] },
  q: { fontFamily: fonts.body600, fontSize: 13, letterSpacing: 0.2 },
  a: { fontFamily: fonts.display800, fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  riff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  riffText: { fontFamily: fonts.body600, fontSize: 13.5 },
  editCard: { backgroundColor: colors.paper, borderRadius: 18, borderWidth: 1.5, borderColor: colors.line, padding: 12, gap: 10 },
  input: {
    minHeight: 70,
    fontFamily: fonts.body400,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
    textAlignVertical: 'top',
    outlineStyle: 'none',
  } as object,
});
