import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { MeAvatar } from '../components/Me';
import { Button, Chip, Switch, Tap, text } from '../components/ui';
import { demoGroups, PostKind } from '../data/content';
import { createPost, fetchMyGroups, useLoad } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

const MAX = 500;

const kinds: { kind: PostKind; hint: string }[] = [
  { kind: 'New work', hint: 'Share something you made. What is it, and who should see it?' },
  { kind: 'Looking for', hint: 'Who are you looking for? Say the role, the vibe and where.' },
  { kind: 'Crew call', hint: 'What’s the shoot or show? Date, place, roles and whether it’s paid.' },
  { kind: 'Show', hint: 'Promote your show: who’s playing, when, where, and the price or ticket link.' },
];

export default function Compose() {
  const { addPost, showToast, celebrate } = useDemo();
  const { live } = useAuth();
  const params = useLocalSearchParams<{ group?: string }>();
  const [audience, setAudience] = useState<string | null>(params.group ?? null);
  const groups = useLoad(
    async () => (live ? (await fetchMyGroups()).map((g) => ({ id: g.id, name: g.name })) : demoGroups.map((g) => ({ id: g.id, name: g.name }))),
    [live],
  );
  const groupName = groups.data?.find((g) => g.id === audience)?.name;
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<PostKind>('New work');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [raw, setRaw] = useState(false);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const [busy, setBusy] = useState(false);
  const ready = body.trim().length > 0 && !busy;
  const post = async () => {
    if (live) {
      setBusy(true);
      try {
        await createPost(kind, body.trim(), image, audience ?? undefined, kind === 'New work' && raw);
      } catch (e) {
        showToast((e as Error).message);
        setBusy(false);
        return;
      }
    } else {
      addPost({ kind, text: body.trim(), image, groupId: audience ?? undefined, raw: kind === 'New work' && raw });
    }
    celebrate(
      audience
        ? `Shared privately with **${groupName ?? 'your group'}**.`
        : 'Posted to every **follower’s timeline**.',
    );
    if (router.canGoBack()) router.back();
    else router.replace('/timeline');
  };

  return (
    <Screen
      header={<BackHeader label="Cancel" fallback="/timeline" />}
      contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}
    >
      <View style={styles.titleRow}>
        <MeAvatar size={40} />
        <Text style={styles.title} accessibilityRole="header">
          New post
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.audienceLabel}>Who sees this</Text>
        <View style={styles.kinds}>
          <Tap
            accessibilityRole="radio"
            accessibilityState={{ selected: audience === null }}
            onPress={() => setAudience(null)}
            style={[styles.audience, audience === null && styles.audienceOn]}
          >
            <Icon name="users" size={15} color={audience === null ? colors.lime : colors.forest} />
            <Text style={[styles.audienceText, audience === null && { color: colors.lime }]}>Everyone on Nexus</Text>
          </Tap>
          {(groups.data ?? []).map((g) => {
            const on = audience === g.id;
            return (
              <Tap
                key={g.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => setAudience(g.id)}
                style={[styles.audience, on && styles.audienceOn]}
              >
                <Icon name="lock" size={14} color={on ? colors.lime : colors.forest} strokeWidth={2.4} />
                <Text style={[styles.audienceText, on && { color: colors.lime }]}>{g.name}</Text>
              </Tap>
            );
          })}
        </View>
      </View>

      <View style={styles.kinds}>
        {kinds.map((k) => (
          <Chip key={k.kind} label={k.kind} selected={kind === k.kind} onPress={() => setKind(k.kind)} />
        ))}
      </View>

      <View style={styles.editor}>
        <TextInput
          value={body}
          onChangeText={(t) => setBody(t.slice(0, MAX))}
          placeholder={kinds.find((k) => k.kind === kind)!.hint}
          placeholderTextColor={colors.muted}
          accessibilityLabel="Post text"
          multiline
          style={styles.input}
        />
        <Text style={[text.small, { alignSelf: 'flex-end' }]}>
          {body.length}/{MAX}
        </Text>
      </View>

      {image ? (
        <View>
          <Image source={{ uri: image }} accessibilityLabel="Selected photo" style={styles.preview} resizeMode="cover" />
          <Tap accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => setImage(undefined)} style={styles.remove}>
            <Icon name="close" size={18} color={colors.cream} strokeWidth={2.4} />
          </Tap>
        </View>
      ) : (
        <Tap accessibilityRole="button" onPress={pick} style={styles.addPhoto}>
          <Icon name="image" size={22} color={colors.forest} />
          <Text style={styles.addPhotoText}>Add a photo or artwork</Text>
        </Tap>
      )}

      {kind === 'New work' ? (
        <View style={styles.rawRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.rawTitle}>Raw · unedited</Text>
            <Text style={text.small}>A first take, a rehearsal, a sketch. Nexus values the real thing, not just the polished one.</Text>
          </View>
          <Switch label="Raw, unedited" value={raw} onToggle={() => setRaw(!raw)} />
        </View>
      ) : null}

      <View style={styles.protect}>
        <Icon name={audience ? 'lock' : 'shield'} size={18} color={colors.lime} />
        <Text style={styles.protectText}>
          {audience
            ? `Private: only ${groupName ?? 'group'} members can see this post or open its photo. It never reaches Discover, your profile or AI crawlers.`
            : live
              ? 'Only signed-in members can see your photos. Nexus never sells your work or uses it to train AI.'
              : 'Uploads are marked do-not-train, watermarked and only shown to signed-in members.'}
        </Text>
      </View>

      <Text style={text.small}>
        {audience
          ? 'Want it one to one instead? Send it in Messages.'
          : 'Reaches every one of your followers, newest first, and the Posts tab on your profile. No algorithm decides who sees it.'}
      </Text>

      <Button variant="big" label={busy ? 'Posting…' : 'Post'} onPress={ready ? post : undefined} style={!ready && { opacity: 0.45 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: fonts.display800, fontSize: 28, letterSpacing: -0.6, color: colors.ink },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rawRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.paper, borderRadius: 18, padding: 14 },
  rawTitle: { fontFamily: fonts.body600, fontSize: 14.5, color: colors.ink },
  audienceLabel: { fontFamily: fonts.body600, fontSize: 13, color: colors.forest },
  audience: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.line2,
  },
  audienceOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  audienceText: { fontFamily: fonts.body600, fontSize: 13.5, color: colors.forest },
  editor: { backgroundColor: colors.paper, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, padding: 14, gap: 6 },
  input: {
    minHeight: 140,
    fontFamily: fonts.body400,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
    textAlignVertical: 'top',
    outlineStyle: 'none',
  } as object,
  preview: { width: '100%', height: 240, borderRadius: 18, backgroundColor: colors.stone },
  remove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(31,32,28,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    height: 96,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoText: { fontFamily: fonts.body600, fontSize: 14, color: colors.forest },
  protect: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.forest, borderRadius: 16, padding: 14 },
  protectText: { flex: 1, fontFamily: fonts.body400, fontSize: 13, lineHeight: 18, color: colors.cream },
});
