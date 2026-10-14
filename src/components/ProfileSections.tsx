// Profile sections: the Work / Timeline switcher, organizable work modules, and the personal timeline.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { events, profile, profileKindColors, ProfilePost, profilePosts, WorkModule, workModules } from '../data/content';
import { saleLabel } from '../data/fees';
import { ProfileTab, useDemo, UserPost } from '../state/DemoState';
import { colors, fonts } from '../theme';
import { Icon, IconName } from './Icon';
import { TeamStack } from './Team';
import { ArtBlock, Avatar, Button, Card, Pill, Rise, Tap, text } from './ui';

const nativeDriver = Platform.OS !== 'web';

/** Shape a post written in the demo like the profile's own posts. */
export const asProfilePost = (p: UserPost): ProfilePost => ({
  id: p.id,
  time: 'Just now',
  kind: p.kind,
  text: p.text,
  art: p.image ? { bg: colors.stone, fg: colors.forest, height: 220, label: 'Your photo', image: { uri: p.image } } : undefined,
});

const eventCta = (id: string) => {
  const e = events.find((x) => x.id === id);
  return e ? saleLabel(e.sale) : 'See event';
};

/** Two-way switch with a lime pill that slides to the selected side. */
export function ProfileTabs() {
  const { profileTab, setProfileTab } = useDemo();
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(profileTab === 'work' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(x, { toValue: profileTab === 'work' ? 0 : 1, useNativeDriver: nativeDriver, bounciness: 6, speed: 16 }).start();
  }, [profileTab, x]);

  const tabs: { id: ProfileTab; label: string; icon: IconName }[] = [
    { id: 'work', label: 'Work', icon: 'grid' },
    { id: 'posts', label: 'Posts', icon: 'chat' },
  ];
  const half = (width - 8) / 2;

  return (
    <View accessibilityRole="tablist" style={styles.tabs} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Animated.View
          style={[styles.tabThumb, { width: half, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, half] }) }] }]}
        />
      ) : null}
      {tabs.map((t) => {
        const on = profileTab === t.id;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => setProfileTab(t.id)}
            style={styles.tab}
          >
            <Icon name={t.icon} size={16} color={on ? colors.ink : colors.muted} strokeWidth={2.2} />
            <Text style={[styles.tabText, { color: on ? colors.ink : colors.muted }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Work modules ---------- */

export function WorkModules() {
  const { moduleOrder, hiddenModules, showToast } = useDemo();
  const [organizing, setOrganizing] = useState(false);

  const modules = moduleOrder
    .map((id) => workModules.find((m) => m.id === id))
    .filter((m): m is WorkModule => !!m && (organizing || !hiddenModules[m.id]));
  const hiddenCount = workModules.filter((m) => hiddenModules[m.id]).length;

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.rowBetween}>
        <Text style={text.small}>
          {organizing
            ? 'Reorder, hide or show modules on your profile.'
            : `${modules.length} modules${hiddenCount ? ` · ${hiddenCount} hidden` : ''}`}
        </Text>
        <Button
          variant={organizing ? 'primary' : 'ghost'}
          label={organizing ? 'Done' : 'Organize'}
          style={{ height: 36, paddingHorizontal: 14 }}
          onPress={() => {
            if (organizing) showToast('Your profile is **updated**.');
            setOrganizing(!organizing);
          }}
        />
      </View>

      {modules.map((m, i) => (
        <Rise key={m.id} delay={i * 70}>
          <ModuleCard module={m} organizing={organizing} index={i} count={modules.length} />
        </Rise>
      ))}

      {organizing ? (
        <Tap
          accessibilityRole="button"
          onPress={() => showToast('Creating new modules is coming in the full app.')}
          style={styles.addModule}
        >
          <Text style={styles.addModuleText}>+ New module</Text>
        </Tap>
      ) : null}
    </View>
  );
}

function ModuleCard({ module: m, organizing, index, count }: { module: WorkModule; organizing: boolean; index: number; count: number }) {
  const { collapsedModules, hiddenModules, toggleModuleCollapsed, toggleModuleHidden, moveModule } = useDemo();
  const collapsed = !!collapsedModules[m.id];
  const hidden = !!hiddenModules[m.id];
  const spin = useRef(new Animated.Value(collapsed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(spin, { toValue: collapsed ? 1 : 0, duration: 200, useNativeDriver: nativeDriver }).start();
  }, [collapsed, spin]);

  return (
    <Card style={[styles.module, hidden && { opacity: 0.55 }]}>
      <View style={styles.moduleHead}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: !collapsed }}
          accessibilityLabel={`${m.title}, ${m.items.length} pieces`}
          onPress={() => toggleModuleCollapsed(m.id)}
          style={styles.moduleTitleBtn}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.moduleTitle}>{m.title}</Text>
              <Pill label={String(m.items.length)} bg={colors.limeSoft} fg={colors.forest} style={{ paddingVertical: 2, paddingHorizontal: 8 }} />
            </View>
            <Text style={text.small}>{hidden ? 'Hidden from your profile' : m.blurb}</Text>
          </View>
          {!organizing ? (
            <Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-90deg'] }) }] }}>
              <Icon name="chevron" size={20} color={colors.forest} strokeWidth={2.2} />
            </Animated.View>
          ) : null}
        </Pressable>
        {organizing ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconButton icon="up" label={`Move ${m.title} up`} disabled={index === 0} onPress={() => moveModule(m.id, -1)} />
            <IconButton icon="down" label={`Move ${m.title} down`} disabled={index === count - 1} onPress={() => moveModule(m.id, 1)} />
            <IconButton
              icon={hidden ? 'eyeOff' : 'eye'}
              label={hidden ? `Show ${m.title}` : `Hide ${m.title}`}
              active={!hidden}
              onPress={() => toggleModuleHidden(m.id)}
            />
          </View>
        ) : null}
      </View>

      {!collapsed && !organizing ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moduleItems}>
          {m.items.map((item) => (
            <View key={item.id} style={styles.workItem}>
              <Tap
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/work/[id]', params: { id: item.id } })}
                style={{ gap: 6 }}
              >
                <ArtBlock art={item.art} radius={14} />
                <Text style={[text.strong, { fontSize: 13.5 }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[text.small, { fontSize: 12 }]} numberOfLines={1}>
                  {item.detail}
                </Text>
              </Tap>
              <TeamStack workId={item.id} />
            </View>
          ))}
        </ScrollView>
      ) : null}
    </Card>
  );
}

function IconButton({ icon, label, onPress, disabled, active }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <Tap
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.iconBtn, active && { backgroundColor: colors.lime, borderColor: colors.lime }, disabled && { opacity: 0.35 }]}
    >
      <Icon name={icon} size={18} color={colors.forest} strokeWidth={2.2} />
    </Tap>
  );
}

/* ---------- Personal timeline ---------- */

export function ProfilePosts() {
  const { pinnedPost, userPosts } = useDemo();
  // New posts from this session first, then the pinned post, then everything else newest first.
  const posts = [...userPosts.map(asProfilePost), ...profilePosts].sort((a, b) => Number(b.id === pinnedPost) - Number(a.id === pinnedPost));

  return (
    <View style={{ gap: 12 }}>
      <Text style={text.small}>Everything {profile.firstName} has posted, newest first.</Text>
      {posts.map((p, i) => (
        <Rise key={p.id} delay={i * 70}>
          <OwnPost post={p} pinned={p.id === pinnedPost} />
        </Rise>
      ))}
      <Rise delay={posts.length * 70}>
        <View style={styles.end}>
          <View style={styles.tick}>
            <Icon name="check" size={18} strokeWidth={2.6} />
          </View>
          <Text style={styles.endText}>That’s every post. No endless scroll on profiles either.</Text>
        </View>
      </Rise>
    </View>
  );
}

function OwnPost({ post: p, pinned }: { post: ProfilePost; pinned: boolean }) {
  const { togglePinned, showToast } = useDemo();
  const kind = profileKindColors[p.kind];
  return (
    <Card style={[styles.post, pinned && { borderWidth: 1.5, borderColor: colors.olive }]}>
      <View style={styles.author}>
        <Avatar initials={profile.initials} photo={profile.photo} bg={colors.lime} fg={colors.ink} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={[text.strong, { fontSize: 14 }]}>{profile.name}</Text>
          <Text style={text.small}>{pinned ? `Pinned · ${p.time}` : p.time}</Text>
        </View>
        <Pill label={p.kind} bg={kind.bg} fg={kind.fg} />
      </View>
      <Text style={text.body}>{p.text}</Text>
      {p.art ? <ArtBlock art={p.art} /> : null}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant="ghost"
          selected={pinned}
          label={pinned ? 'Pinned' : 'Pin to top'}
          icon={<Icon name="pin" size={16} color={colors.forest} />}
          style={{ height: 38 }}
          onPress={() => {
            if (!pinned) showToast('Pinned to the **top** of your posts.');
            togglePinned(p.id);
          }}
        />
        {p.workId ? (
          <Button
            variant="ghost"
            label={p.module ? `In ${p.module}` : 'See the work'}
            icon={<Icon name="grid" size={16} color={colors.forest} />}
            style={{ height: 38 }}
            onPress={() => router.push({ pathname: '/work/[id]', params: { id: p.workId! } })}
          />
        ) : null}
        {p.eventId ? (
          <Button
            variant="ghost"
            label={eventCta(p.eventId)}
            icon={<Icon name="ticket" size={16} color={colors.forest} />}
            style={{ height: 38 }}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: p.eventId! } })}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: colors.stone, borderRadius: 999, padding: 4 },
  tabThumb: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 999, backgroundColor: colors.lime },
  tab: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabText: { fontFamily: fonts.body600, fontSize: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  module: { borderRadius: 20, paddingVertical: 14, gap: 12 },
  moduleHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  moduleTitleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  moduleTitle: { fontFamily: fonts.display700, fontSize: 16, color: colors.ink },
  moduleItems: { paddingHorizontal: 16, gap: 10 },
  workItem: { width: 148, gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addModule: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addModuleText: { fontFamily: fonts.body600, fontSize: 14, color: colors.forest },
  post: { padding: 16, gap: 12 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  end: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.forest, borderRadius: 18, padding: 16 },
  tick: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  endText: { flex: 1, fontFamily: fonts.body500, fontSize: 13.5, lineHeight: 19, color: colors.cream },
});
