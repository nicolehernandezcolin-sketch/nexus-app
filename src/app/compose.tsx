import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { Avatar, Button, Chip, Tap, text } from '../components/ui';
import { PostKind, profile } from '../data/content';
import { useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

const MAX = 500;

const kinds: { kind: PostKind; hint: string }[] = [
  { kind: 'New work', hint: 'Share something you made. What is it, and who should see it?' },
  { kind: 'Looking for', hint: 'Who are you looking for? Say the role, the vibe and where.' },
  { kind: 'Crew call', hint: 'What’s the shoot or show? Date, place, roles and whether it’s paid.' },
];

export default function Compose() {
  const { addPost, showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<PostKind>('New work');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | undefined>();

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const ready = body.trim().length > 0;
  const post = () => {
    addPost({ kind, text: body.trim(), image });
    showToast(image ? 'Posted. **AI protection** is on for your photo.' : 'Posted to your **followers’ timelines**.');
    if (router.canGoBack()) router.back();
    else router.replace('/timeline');
  };

  return (
    <Screen
      header={<BackHeader label="Cancel" fallback="/timeline" />}
      contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}
    >
      <View style={styles.titleRow}>
        <Avatar initials={profile.initials} photo={profile.photo} bg={colors.lime} fg={colors.ink} size={40} />
        <Text style={styles.title} accessibilityRole="header">
          New post
        </Text>
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

      <View style={styles.protect}>
        <Icon name="shield" size={18} color={colors.lime} />
        <Text style={styles.protectText}>Uploads are marked do-not-train, watermarked and only shown to signed-in members.</Text>
      </View>

      <Text style={text.small}>Goes to your followers’ timelines, newest first, and to the Posts tab on your profile.</Text>

      <Button variant="big" label="Post" onPress={ready ? post : undefined} style={!ready && { opacity: 0.45 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: fonts.display800, fontSize: 28, letterSpacing: -0.6, color: colors.ink },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
