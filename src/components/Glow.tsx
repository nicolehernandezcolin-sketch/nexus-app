// The soft light behind every screen: slow-drifting glows that shift as you scroll, and a
// spotlight that follows your finger.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, ViewProps } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';
import { useReduceMotion } from './ui';

type Orb = { id: string; color: string; strength: number; size: number; top: number; left: number; drift: number; seconds: number; parallax: number };

type Light = Pick<Orb, 'color' | 'strength'>;

// Where the three glows sit and how they move.
const slots: Omit<Orb, 'color' | 'strength'>[] = [
  { id: 'a', size: 420, top: -140, left: -150, drift: 50, seconds: 16, parallax: 0.25 },
  { id: 'b', size: 380, top: 320, left: 140, drift: 60, seconds: 21, parallax: 0.12 },
  { id: 'c', size: 340, top: 760, left: -120, drift: 40, seconds: 18, parallax: 0.32 },
];

/**
 * Each screen has its own light. Light colors can be strong; dark ones stay faint
 * (olive at most 0.28, forest 0.18) so text on cream stays above 4.5:1 contrast.
 */
const moods = {
  // Warm, like morning light.
  timeline: { flip: false, lights: [{ color: colors.lime, strength: 0.9 }, { color: colors.sand, strength: 0.7 }, { color: colors.lime, strength: 0.7 }] },
  // Cooler and spread out, for looking around.
  discover: { flip: true, lights: [{ color: colors.lime, strength: 0.85 }, { color: colors.forest, strength: 0.14 }, { color: colors.limeSoft, strength: 0.9 }] },
  // Low stage lights.
  events: { flip: true, lights: [{ color: colors.olive, strength: 0.28 }, { color: colors.lime, strength: 0.9 }, { color: colors.forest, strength: 0.16 }] },
  // Calm, for talking.
  quiet: { flip: false, lights: [{ color: colors.limeSoft, strength: 0.9 }, { color: colors.sand, strength: 0.5 }, { color: colors.limeSoft, strength: 0.7 }] },
  profile: { flip: false, lights: [{ color: colors.lime, strength: 0.9 }, { color: colors.olive, strength: 0.2 }, { color: colors.lime, strength: 0.7 }] },
} satisfies Record<string, { flip: boolean; lights: Light[] }>;

export type GlowMood = keyof typeof moods;

/** A profile's glow follows its cover color. */
const coverLights: Record<string, Light> = {
  lime: { color: colors.lime, strength: 0.9 },
  sand: { color: colors.sand, strength: 0.7 },
  olive: { color: colors.olive, strength: 0.28 },
  forest: { color: colors.forest, strength: 0.18 },
  ink: { color: colors.ink, strength: 0.12 },
  dome: { color: colors.lime, strength: 0.8 },
};

function orbsFor(mood: GlowMood, cover?: string): Orb[] {
  const m = moods[mood];
  const tint = cover ? coverLights[cover] : undefined;
  return slots.map((slot, i) => {
    const light = tint && i !== 1 ? tint : m.lights[i];
    return { ...slot, ...light, left: m.flip ? 375 - slot.left - slot.size : slot.left };
  });
}

function OrbView({ orb, scrollY, still }: { orb: Orb; scrollY?: Animated.Value; still: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: orb.seconds * 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: orb.seconds * 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, orb.seconds, still]);

  const driftY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -orb.drift * 0.6] });
  // Glows move up slower than the content as you scroll, so the screen feels deep.
  const translateY = scrollY ? Animated.add(driftY, Animated.multiply(scrollY, -orb.parallax)) : driftY;
  const transform = still
    ? []
    : [
        { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, orb.drift] }) },
        { translateY },
        { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
      ];

  // Unique per color: on the web, screens stay mounted side by side and share one page of SVG ids.
  const gradientId = `glow-${orb.id}-${orb.color.slice(1)}-${Math.round(orb.strength * 100)}`;

  return (
    <Animated.View style={{ position: 'absolute', top: orb.top, left: orb.left, width: orb.size, height: orb.size, transform }}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={orb.color} stopOpacity={orb.strength} />
            <Stop offset="0.55" stopColor={orb.color} stopOpacity={orb.strength * 0.35} />
            <Stop offset="1" stopColor={orb.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Fills its parent behind the content. Pass the screen's scroll position for parallax,
 * and on a profile the cover id so the light matches it.
 */
export function Glow({ scrollY, mood = 'timeline', cover }: { scrollY?: Animated.Value; mood?: GlowMood; cover?: string }) {
  const still = useReduceMotion();
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {orbsFor(mood, cover).map((o) => (
        <OrbView key={o.id} orb={o} scrollY={scrollY} still={still} />
      ))}
    </View>
  );
}

const LIGHT = 280;

/**
 * A spotlight that follows your finger (or the mouse on the web). Spread `handlers` on the
 * screen's root view and render `light` behind the content. It only listens, so taps and
 * scrolling work as usual.
 */
export function useFingerGlow() {
  const still = useReduceMotion();
  const x = useRef(new Animated.Value(-LIGHT)).current;
  const y = useRef(new Animated.Value(-LIGHT)).current;
  const shown = useRef(new Animated.Value(0)).current;

  const follow = (px: number, py: number) => {
    const to = { x: px - LIGHT / 2, y: py - LIGHT / 2 };
    if (still) {
      x.setValue(to.x);
      y.setValue(to.y);
      return;
    }
    Animated.spring(x, { toValue: to.x, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
    Animated.spring(y, { toValue: to.y, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
  };
  const show = (on: boolean) =>
    Animated.timing(shown, { toValue: on ? 1 : 0, duration: on ? 180 : 700, useNativeDriver: true }).start();

  const handlers: Partial<ViewProps> = {
    onTouchStart: (e) => {
      const { pageX, pageY } = e.nativeEvent;
      x.setValue(pageX - LIGHT / 2);
      y.setValue(pageY - LIGHT / 2);
      show(true);
    },
    onTouchMove: (e) => follow(e.nativeEvent.pageX, e.nativeEvent.pageY),
    onTouchEnd: () => show(false),
    onTouchCancel: () => show(false),
  };
  if (Platform.OS === 'web') {
    // A mouse has no touches: follow the pointer while it's over the app.
    Object.assign(handlers, {
      onPointerMove: (e: { nativeEvent: { pageX: number; pageY: number; pointerType?: string } }) => {
        if (e.nativeEvent.pointerType === 'touch') return;
        follow(e.nativeEvent.pageX, e.nativeEvent.pageY);
        show(true);
      },
      onPointerLeave: () => show(false),
    });
  }

  const light = (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, left: 0, width: LIGHT, height: LIGHT, opacity: shown, transform: [{ translateX: x }, { translateY: y }] }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="finger-glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.lime} stopOpacity={0.95} />
            <Stop offset="0.45" stopColor={colors.lime} stopOpacity={0.45} />
            <Stop offset="1" stopColor={colors.lime} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#finger-glow)" />
      </Svg>
    </Animated.View>
  );

  return { handlers, light };
}
