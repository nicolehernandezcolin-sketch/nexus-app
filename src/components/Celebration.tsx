// A burst of light for good moments: a ticket bought, checked in at the door, a collab sent.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useDemo } from '../state/DemoState';
import { colors } from '../theme';
import { useReduceMotion } from './ui';

const FLASH = 520;
const sparkColors = [colors.lime, colors.olive, colors.sand, colors.forest, colors.limeSoft];

// Sparks spread evenly around the circle, each a little different so it feels alive.
const sparks = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.12;
  const distance = 120 + (i % 4) * 34;
  return {
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    size: 8 + (i % 3) * 4,
    color: sparkColors[i % sparkColors.length],
    round: i % 2 === 0,
  };
});

/** Lives once at the root; plays whenever `celebrate()` is called. */
export function Celebration() {
  const { burst } = useDemo();
  const still = useReduceMotion();
  const t = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!burst) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    t.setValue(0);
    Animated.timing(t, {
      toValue: 1,
      duration: still ? 700 : 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [burst, still, t]);

  if (!burst) return null;

  const flashOpacity = t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.9, 0] });
  const flashScale = still ? 1 : t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.6] });

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, styles.center]}>
      <Animated.View style={{ width: FLASH, height: FLASH, opacity: flashOpacity, transform: [{ scale: flashScale }] }}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="celebrate-flash" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.lime} stopOpacity={0.95} />
              <Stop offset="0.5" stopColor={colors.lime} stopOpacity={0.4} />
              <Stop offset="1" stopColor={colors.lime} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#celebrate-flash)" />
        </Svg>
      </Animated.View>
      {still
        ? null
        : sparks.map((s, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: s.size,
                height: s.size,
                borderRadius: s.round ? s.size / 2 : 2,
                backgroundColor: s.color,
                opacity: t.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, s.dx] }) },
                  // A little gravity: up and out, then drifting down.
                  { translateY: t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, s.dy - 30, s.dy + 40] }) },
                  { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 240}deg`] }) },
                  { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) },
                ],
              }}
            />
          ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
