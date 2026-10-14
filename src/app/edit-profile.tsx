import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { MeAvatar } from '../components/Me';
import { Button, Chip, SectionTitle, Tap, text } from '../components/ui';
import { projectTypes, roles, skills } from '../data/content';
import { uploadImage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

const openToOptions = ['Band members', 'Features', 'Music video crews', 'Film crews', 'Commissions', 'Event partners', 'Sponsors', 'Mentoring'];

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function EditProfile() {
  const { me, saveMe } = useAuth();
  const { showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(me?.name ?? '');
  const [tagline, setTagline] = useState(me?.tagline ?? '');
  const [location, setLocation] = useState(me?.location ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  const [myRoles, setRoles] = useState(me?.roles ?? []);
  const [openTo, setOpenTo] = useState(me?.open_to ?? []);
  const [mySkills, setSkills] = useState(me?.skills ?? []);
  const [myProjects, setProjects] = useState(me?.projects ?? []);
  const [busy, setBusy] = useState(false);

  if (!me) return null;

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    try {
      await saveMe({ avatar_path: await uploadImage('avatars', result.assets[0].uri) });
      showToast('Profile photo **updated**.');
    } catch (e) {
      showToast((e as Error).message);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await saveMe({
        name: name.trim(),
        tagline: tagline.trim(),
        location: location.trim(),
        bio: bio.trim(),
        roles: myRoles,
        open_to: openTo,
        skills: mySkills,
        projects: myProjects,
      });
      showToast('Profile **saved**.');
      if (router.canGoBack()) router.back();
      else router.replace('/profile');
    } catch (e) {
      showToast((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Screen header={<BackHeader label="Cancel" fallback="/profile" />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Text style={styles.title} accessibilityRole="header">
        Edit profile
      </Text>

      <Tap accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={pickPhoto} style={styles.photoRow}>
        <MeAvatar size={72} />
        <View style={styles.photoBtn}>
          <Icon name="image" size={18} color={colors.forest} />
          <Text style={styles.photoText}>Change photo</Text>
        </View>
      </Tap>

      <Field label="Name" value={name} onChange={setName} max={80} />
      <Field label="Tagline" value={tagline} onChange={setTagline} max={120} placeholder="Artist · Producer · Founder" />
      <Field label="Location" value={location} onChange={setLocation} max={80} placeholder="San Diego" />
      <Field label="Bio" value={bio} onChange={setBio} max={600} multiline placeholder="What you make, and what you’re looking for." />

      <ChipGroup title="What you make" options={roles} value={myRoles} onToggle={(v) => setRoles(toggle(myRoles, v))} />
      <ChipGroup title="Open to" options={openToOptions} value={openTo} onToggle={(v) => setOpenTo(toggle(openTo, v))} />
      <ChipGroup title="Skills for Talent match" options={[...skills]} value={mySkills} onToggle={(v) => setSkills(toggle(mySkills, v))} />
      <ChipGroup title="Projects you want" options={[...projectTypes]} value={myProjects} onToggle={(v) => setProjects(toggle(myProjects, v))} />

      <Button variant="big" label={busy ? 'Saving…' : 'Save'} onPress={busy ? undefined : save} />
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  max,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.slice(0, max))}
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 110, paddingTop: 12, textAlignVertical: 'top' }]}
      />
      {multiline ? <Text style={[text.small, { alignSelf: 'flex-end' }]}>{`${value.length}/${max}`}</Text> : null}
    </View>
  );
}

function ChipGroup({ title, options, value, onToggle }: { title: string; options: string[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>{title}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => (
          <Chip key={o} label={o} selected={value.includes(o)} onPress={() => onToggle(o)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 18 },
  title: { fontFamily: fonts.display800, fontSize: 28, letterSpacing: -0.6, color: colors.ink },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: colors.line2 },
  photoText: { fontFamily: fonts.body600, fontSize: 14, color: colors.forest },
  label: { fontFamily: fonts.body600, fontSize: 13.5, color: colors.forest },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    fontFamily: fonts.body400,
    fontSize: 16,
    color: colors.ink,
    outlineStyle: 'none',
  } as object,
});
