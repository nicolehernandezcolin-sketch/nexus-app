import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/Chrome';
import { openProfile } from '../../components/Feed';
import { Icon } from '../../components/Icon';
import { Avatar, Tap, text } from '../../components/ui';
import { demoConversations } from '../../data/content';
import { fetchConversation, sendMessage, useLoad } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colorFor, initialsOf, timeAgo } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { useDemo } from '../../state/DemoState';
import { colors, fonts } from '../../theme';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return demoConversations.map((c) => ({ id: c.id }));
}

type Bubble = { key: string; mine: boolean; body: string; time: string; image?: string };

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { live, me } = useAuth();
  const { sentMessages, sendDemoMessage, showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const loaded = useLoad(async () => (live ? fetchConversation(id) : null), [live, id]);

  // New messages arrive live while the conversation is open.
  useEffect(() => {
    if (!live || !supabase) return;
    const channel = supabase
      .channel(`messages:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, () => loaded.reload())
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, id]);

  const demo = demoConversations.find((c) => c.id === id);
  const other = live
    ? loaded.data?.other && { id: loaded.data.other.id, name: loaded.data.other.name, initials: initialsOf(loaded.data.other.name), color: colorFor(loaded.data.other.id) }
    : demo && { id: demo.id, name: demo.name, initials: demo.initials, color: demo.avatar };

  const bubbles: Bubble[] = live
    ? (loaded.data?.messages ?? []).map((m) => ({ key: m.id, mine: m.sender === me?.id, body: m.body, time: timeAgo(m.created_at), image: m.imageUrl }))
    : [...(demo?.messages ?? []), ...(sentMessages[id] ?? [])].map((m, i) => ({ key: String(i), mine: m.from === 'me', body: m.body, time: m.time }));

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }, [bubbles.length]);

  const send = async (imageUri?: string) => {
    const body = draft.trim();
    if (!body && !imageUri) return;
    if (!live) {
      sendDemoMessage(id, body || 'Sent a photo');
      setDraft('');
      return;
    }
    setBusy(true);
    try {
      await sendMessage(id, body, imageUri);
      setDraft('');
      loaded.reload();
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const attach = async () => {
    if (!live) return showToast('Photo sharing in messages works once you have an account.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled) send(result.assets[0].uri);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BackHeader label="Messages" fallback="/messages" />
      {other ? (
        <Tap accessibilityRole="link" onPress={() => (live ? openProfile(other.id, me?.id) : undefined)} style={styles.who}>
          <Avatar initials={other.initials} bg={other.color} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={text.strong}>{other.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name="lock" size={11} color={colors.olive} strokeWidth={2.4} />
              <Text style={text.small}>Private · only the two of you</Text>
            </View>
          </View>
        </Tap>
      ) : null}

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={styles.thread}>
        {live && loaded.loading && !loaded.data ? <ActivityIndicator color={colors.forest} /> : null}
        {bubbles.map((b) => (
          <View key={b.key} style={[styles.bubble, b.mine ? styles.mine : styles.theirs]}>
            {b.image ? <Image source={{ uri: b.image }} accessibilityLabel="Shared photo" style={styles.image} resizeMode="cover" /> : null}
            {b.body ? <Text style={[styles.bubbleText, b.mine && { color: colors.cream }]}>{b.body}</Text> : null}
            <Text style={[styles.time, b.mine && { color: colors.creamMuted }]}>{b.time}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: 12 + insets.bottom }]}>
        <Tap accessibilityRole="button" accessibilityLabel="Send a photo" onPress={attach} style={styles.attach}>
          <Icon name="image" size={20} color={colors.forest} />
        </Tap>
        <TextInput
          value={draft}
          onChangeText={(t) => setDraft(t.slice(0, 2000))}
          placeholder="Message"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Message"
          style={styles.input}
          multiline
        />
        <Tap
          accessibilityRole="button"
          accessibilityLabel="Send"
          onPress={busy ? undefined : () => send()}
          style={[styles.send, (!draft.trim() || busy) && { opacity: 0.4 }]}
        >
          <Icon name="send" size={18} color={colors.ink} />
        </Tap>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  thread: { padding: 16, gap: 8 },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.forest, borderBottomRightRadius: 6 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.paper, borderBottomLeftRadius: 6 },
  bubbleText: { fontFamily: fonts.body400, fontSize: 15, lineHeight: 21, color: colors.ink },
  time: { fontFamily: fonts.body400, fontSize: 11, color: colors.muted, alignSelf: 'flex-end' },
  image: { width: 220, height: 160, borderRadius: 12, backgroundColor: colors.stone },
  bar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.cream },
  attach: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.line2, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 11,
    fontFamily: fonts.body400,
    fontSize: 15,
    color: colors.ink,
    outlineStyle: 'none',
  } as object,
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
});
