// App chrome: bottom navigation, screen wrapper, page header and toast.
import { Href, router, usePathname } from 'expo-router';
import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, ScrollViewProps, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemo } from '../state/DemoState';
import { Glow } from './Glow';
import { colors, fonts } from '../theme';
import { Icon, IconName } from './Icon';
import { text } from './ui';

const tabs: { href: '/timeline' | '/discover' | '/events' | '/profile'; label: string; icon: IconName }[] = [
  { href: '/timeline', label: 'Timeline', icon: 'timeline' },
  { href: '/discover', label: 'Discover', icon: 'globe' },
  { href: '/events', label: 'Events', icon: 'events' },
  { href: '/profile', label: 'Profile', icon: 'profile' },
];

function BottomNav() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View accessibilityRole="tablist" style={[styles.nav, { paddingBottom: 14 + insets.bottom }]}>
      {tabs.map((t) => {
        const active = path === t.href;
        const color = active ? colors.lime : colors.navOff;
        return (
          <Pressable
            key={t.href}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => !active && router.replace(t.href)}
            style={({ pressed }) => [styles.navBtn, pressed && { transform: [{ scale: 0.92 }] }]}
          >
            <Icon name={t.icon} color={color} strokeWidth={active ? 2.2 : 2} />
            <Text style={[styles.navLabel, { color }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A full screen: optional fixed header, a scrolling body, and the tab bar when `nav` is set. */
export function Screen({
  header,
  children,
  nav,
  footer,
  contentStyle,
  overlay,
}: {
  header?: ReactNode;
  children: ReactNode;
  nav?: boolean;
  footer?: ReactNode;
  contentStyle?: ScrollViewProps['contentContainerStyle'];
  /** Floats above the scrolling content, e.g. a post button. */
  overlay?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Glow scrollY={scrollY} />
      {header}
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        >
          {children}
        </Animated.ScrollView>
        {overlay}
      </View>
      {footer}
      {nav ? <BottomNav /> : null}
    </View>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={text.eyebrow}>NEXUS</Text>
        <Text style={text.title} accessibilityRole="header">
          {title}
        </Text>
        {sub ? <Text style={[text.sub, { marginTop: 6 }]}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/** Top bar for pushed screens: a back button that falls back to `fallback` when there is no history (e.g. a shared link). */
export function BackHeader({ label, fallback, right }: { label: string; fallback: Href; right?: ReactNode }) {
  const back = () => (router.canGoBack() ? router.back() : router.replace(fallback));
  return (
    <View style={styles.backRow}>
      <Pressable accessibilityRole="button" onPress={back} style={styles.back}>
        <Icon name="back" size={18} color={colors.forest} strokeWidth={2.2} />
        <Text style={styles.backText}>{label}</Text>
      </Pressable>
      {right}
    </View>
  );
}

/** Renders the current toast. `**word**` in the message is shown in lime. */
export function Toast() {
  const { toast } = useDemo();
  const a = useRef(new Animated.Value(0)).current;
  const last = useRef(toast);
  if (toast) last.current = toast;

  useEffect(() => {
    Animated.timing(a, { toValue: toast ? 1 : 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [toast, a]);

  const parts = (last.current ?? '').split('**');
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
      ]}
    >
      <Text style={styles.toastText}>
        {parts.map((p, i) => (
          <Text key={i} style={i % 2 ? { color: colors.lime, fontFamily: fonts.body600 } : undefined}>
            {p}
          </Text>
        ))}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { paddingTop: 26, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  nav: {
    backgroundColor: colors.ink,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  navBtn: { minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 16 },
  backRow: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 4 },
  backText: { fontFamily: fonts.body600, fontSize: 14, color: colors.forest },
  navLabel: { fontFamily: fonts.body600, fontSize: 11 },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 150,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  toastText: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 20, color: colors.cream },
});
