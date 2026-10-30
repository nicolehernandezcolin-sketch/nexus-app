// Report and block, available on every post, profile, message thread and group.
// App Store rules require both wherever members can post or message each other.
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { blockMember, report, ReportReason, ReportTarget } from '../lib/api';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Button, Tap, text } from './ui';

const reasons: { id: ReportReason; label: string }[] = [
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'hate', label: 'Hate speech' },
  { id: 'sexual', label: 'Sexual content' },
  { id: 'violence', label: 'Violence or threats' },
  { id: 'stolen_work', label: 'Stolen or copied work' },
  { id: 'scam', label: 'Scam or fake tickets' },
  { id: 'spam', label: 'Spam' },
  { id: 'other', label: 'Something else' },
];

const noun: Record<ReportTarget, string> = { post: 'post', profile: 'profile', message: 'conversation', group: 'group' };

type Props = {
  target: { type: ReportTarget; id: string };
  /** The member behind it, who can be blocked. Leave out for your own things or groups you run. */
  person?: { id: string; name: string };
  /** Called after blocking, so the screen can hide what it was showing. */
  onBlocked?: () => void;
  /** Light icon for dark headers. */
  light?: boolean;
};

/** The ••• button that opens report and block options. */
export function SafetyMenu({ target, person, onBlocked, light }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tap
        accessibilityRole="button"
        accessibilityLabel={`More options for this ${noun[target.type]}`}
        hitSlop={8}
        onPress={() => setOpen(true)}
        style={styles.more}
      >
        <Icon name="more" size={22} color={light ? colors.cream : colors.muted} />
      </Tap>
      {open ? <SafetySheet target={target} person={person} onBlocked={onBlocked} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function SafetySheet({ target, person, onBlocked, onClose }: Props & { onClose: () => void }) {
  const { showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'menu' | 'report' | 'block'>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const firstName = person?.name.split(' ')[0] || 'this member';

  const sendReport = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      await report(target.type, target.id, reason, details.trim());
      onClose();
      showToast('Thanks. **We review every report within 24 hours.**');
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const block = async () => {
    if (!person) return;
    setBusy(true);
    try {
      await blockMember(person.id);
      onClose();
      showToast(`**${firstName}** is blocked. You won’t see each other’s posts or messages.`);
      onBlocked?.();
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]} accessibilityViewIsModal>
        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">
            {step === 'menu' ? 'Options' : step === 'report' ? `Report this ${noun[target.type]}` : `Block ${firstName}?`}
          </Text>
          <Tap accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={onClose} style={styles.close}>
            <Icon name="close" size={20} />
          </Tap>
        </View>

        {step === 'menu' ? (
          <View style={{ gap: 8 }}>
            <Option icon="flag" label={`Report ${noun[target.type]}`} detail="Tell us what’s wrong. It’s anonymous." onPress={() => setStep('report')} />
            {person ? (
              <Option icon="eyeOff" label={`Block ${firstName}`} detail="You won’t see each other’s posts, messages or profiles in Discover." onPress={() => setStep('block')} />
            ) : null}
          </View>
        ) : null}

        {step === 'report' ? (
          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
            <Text style={text.sub}>What’s the problem?</Text>
            {reasons.map((r) => {
              const on = reason === r.id;
              return (
                <Tap
                  key={r.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setReason(r.id)}
                  style={[styles.reason, on && { borderColor: colors.forest, backgroundColor: colors.limeSoft }]}
                >
                  <View style={[styles.radio, on && { borderColor: colors.forest }]}>{on ? <View style={styles.radioDot} /> : null}</View>
                  <Text style={[text.body, { flex: 1 }]}>{r.label}</Text>
                </Tap>
              );
            })}
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Anything else we should know? (optional)"
              placeholderTextColor={colors.muted}
              accessibilityLabel="More details, optional"
              multiline
              maxLength={1000}
              style={styles.details}
            />
            <Button
              variant="big"
              label={busy ? 'Sending…' : 'Send report'}
              onPress={reason && !busy ? sendReport : undefined}
              style={!(reason && !busy) && { opacity: 0.45 }}
            />
            {person ? (
              <Tap accessibilityRole="button" onPress={() => setStep('block')} style={{ alignSelf: 'center', paddingVertical: 8 }}>
                <Text style={styles.link}>Also block {firstName}</Text>
              </Tap>
            ) : null}
          </ScrollView>
        ) : null}

        {step === 'block' ? (
          <View style={{ gap: 12 }}>
            <Text style={text.body}>
              {firstName} won’t be able to message you, and you won’t see each other’s posts. They aren’t told. You can unblock them in Settings.
            </Text>
            <Button variant="big" label={busy ? 'Blocking…' : `Block ${firstName}`} onPress={busy ? undefined : block} />
            <Button variant="ghost" label="Cancel" onPress={onClose} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function Option({ icon, label, detail, onPress }: { icon: 'flag' | 'eyeOff'; label: string; detail: string; onPress: () => void }) {
  return (
    <Tap accessibilityRole="button" accessibilityHint={detail} onPress={onPress} style={styles.option}>
      <Icon name={icon} size={20} color={colors.forest} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={text.strong}>{label}</Text>
        <Text style={text.small}>{detail}</Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  more: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  scrim: { flex: 1, backgroundColor: 'rgba(20,24,12,0.45)' },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.display800, fontSize: 20, color: colors.ink, flex: 1 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.paper, minHeight: 56 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, minHeight: 48 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.line2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.forest },
  details: {
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: 12,
    fontFamily: fonts.body400,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  link: { fontFamily: fonts.body600, fontSize: 14, color: colors.forest, textDecorationLine: 'underline' },
});
