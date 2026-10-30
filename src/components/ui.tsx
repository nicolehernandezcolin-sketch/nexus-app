// Small building blocks shared by every screen.
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  ImageSourcePropType,
  ImageStyle,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Art } from '../data/content';
import { colors, fonts } from '../theme';

/** True when the person has turned on Reduce Motion (iOS/Android settings, or the browser preference). */
export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/** Pressable that shrinks slightly while held. */
export function Tap({ style, children, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <Pressable {...rest} style={({ pressed }) => [style, pressed && { transform: [{ scale: 0.96 }] }]}>
      {children}
    </Pressable>
  );
}

type ButtonVariant = 'primary' | 'ghost' | 'lime' | 'outlineDark' | 'big';

export function Button({
  label,
  onPress,
  variant = 'primary',
  selected,
  style,
  icon,
  accessibilityLabel,
}: {
  label?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  accessibilityLabel?: string;
}) {
  const v = buttonVariants[variant];
  // A height passed in is a minimum: buttons stay at least 44pt to tap and grow with larger text.
  const flat = StyleSheet.flatten(style) ?? {};
  const sized = typeof flat.height === 'number' ? { ...flat, height: undefined, minHeight: Math.max(flat.height, 44) } : flat;
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !onPress, ...(selected === undefined ? {} : { selected }) }}
      style={[styles.btn, v.box, selected && variant === 'ghost' && styles.ghostOn, sized]}
    >
      {icon}
      {label ? <Text style={[styles.btnText, v.text]}>{label}</Text> : null}
    </Tap>
  );
}

const buttonVariants: Record<ButtonVariant, { box: ViewStyle; text: TextStyle }> = {
  primary: { box: { backgroundColor: colors.forest }, text: { color: colors.lime } },
  ghost: { box: { borderWidth: 1.5, borderColor: colors.line2 }, text: { color: colors.ink } },
  lime: { box: { backgroundColor: colors.lime, height: 48 }, text: { color: colors.ink } },
  outlineDark: { box: { borderWidth: 1.5, borderColor: colors.olive, height: 48 }, text: { color: colors.cream } },
  big: { box: { backgroundColor: colors.ink, height: 56 }, text: { color: colors.lime, fontFamily: fonts.display700, fontSize: 16 } },
};

export function Chip({ label, selected, onPress, dark }: { label: string; selected: boolean; onPress: () => void; dark?: boolean }) {
  const onBg = dark ? colors.ink : colors.forest;
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && { backgroundColor: onBg, borderColor: onBg }]}
    >
      <Text style={[styles.chipText, selected && { color: colors.lime }]}>{label}</Text>
    </Tap>
  );
}

export function Switch({ value, onToggle, label }: { value: boolean; onToggle: () => void; label: string }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, bounciness: 8, speed: 18 }).start();
  }, [value, anim]);
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={[styles.switch, { backgroundColor: value ? colors.forest : colors.switchOff }]}
    >
      <Animated.View
        style={[
          styles.knob,
          {
            backgroundColor: value ? colors.lime : colors.paper,
            transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }],
          },
        ]}
      />
    </Pressable>
  );
}

export function Pill({ label, bg, fg, style }: { label: string; bg: string; fg: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Avatar({
  initials,
  bg,
  size = 42,
  fg = colors.cream,
  ring,
  photo,
}: {
  initials: string;
  bg: string;
  size?: number;
  fg?: string;
  ring?: string;
  photo?: ImageSourcePropType;
}) {
  if (photo) {
    return (
      <Image
        source={photo}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderWidth: ring ? 2 : 0, borderColor: ring }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2 : 0,
        borderColor: ring,
      }}
    >
      <Text style={{ fontFamily: fonts.display700, color: fg, fontSize: size * 0.34 }}>{initials}</Text>
    </View>
  );
}

/** A cover image, or a colored block standing in for one. */
export function ArtBlock({ art, radius = 16, height, style }: { art: Art; radius?: number; height?: number; style?: StyleProp<ViewStyle> }) {
  const h = height ?? art.height;
  if (art.image) {
    return (
      <Image
        source={art.image}
        accessibilityLabel={art.label}
        resizeMode="cover"
        style={[{ width: '100%', height: h, borderRadius: radius, backgroundColor: art.bg }, style as StyleProp<ImageStyle>]}
      />
    );
  }
  return (
    <View style={[styles.art, { height: h, backgroundColor: art.bg, borderRadius: radius }, style]}>
      {h >= 90 ? <Text style={[styles.artText, { color: art.fg }]}>{art.plain ? art.label : `${art.label} (sample)`}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

/** Fades and lifts its children in when first shown. */
export function Rise({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return a.setValue(1);
    Animated.timing(a, { toValue: 1, duration: 420, delay, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [a, delay, reduce]);
  return (
    <Animated.View
      style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

export const text = StyleSheet.create({
  eyebrow: { fontFamily: fonts.display900, fontSize: 13, letterSpacing: 1.5, color: colors.forest2 },
  title: { fontFamily: fonts.display800, fontSize: 30, letterSpacing: -0.8, lineHeight: 32, color: colors.ink },
  sub: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 20, color: colors.muted2 },
  body: { fontFamily: fonts.body400, fontSize: 14.5, lineHeight: 22, color: colors.ink },
  strong: { fontFamily: fonts.body600, fontSize: 15, color: colors.ink },
  small: { fontFamily: fonts.body400, fontSize: 12.5, lineHeight: 18, color: colors.muted },
});

const styles = StyleSheet.create({
  btn: {
    minHeight: 44,
    paddingVertical: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { fontFamily: fonts.body600, fontSize: 13.5 },
  ghostOn: { borderColor: colors.forest, backgroundColor: colors.limeSoft },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.line2,
    justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.body500, fontSize: 14, color: colors.ink },
  switch: { width: 52, height: 32, borderRadius: 999, padding: 3 },
  knob: { width: 26, height: 26, borderRadius: 13 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  pillText: { fontFamily: fonts.body600, fontSize: 11 },
  art: { justifyContent: 'flex-end', padding: 12 },
  artText: { fontFamily: fonts.body600, fontSize: 12 },
  card: { backgroundColor: colors.paper, borderRadius: 22 },
  sectionTitle: { fontFamily: fonts.display700, fontSize: 15, color: colors.forest },
});
