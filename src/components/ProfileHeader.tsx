// The profile's customizable header: a cover (color, photo or your own upload) with an optional pattern.
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef } from 'react';
import { Animated, Image, ImageSourcePropType, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { HeaderStyle, useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Button, Chip, Tap, text } from './ui';

type Cover = { id: string; label: string; bg: string; light?: boolean; image?: ImageSourcePropType };

export const covers: Cover[] = [
  { id: 'forest', label: 'Forest', bg: colors.forest },
  { id: 'ink', label: 'Charcoal', bg: colors.ink },
  { id: 'olive', label: 'Olive', bg: colors.olive },
  { id: 'lime', label: 'Lime', bg: colors.lime, light: true },
  { id: 'sand', label: 'Sand', bg: colors.sand, light: true },
  { id: 'dome', label: 'Giant Dome', bg: colors.ink, image: require('../../assets/images/dome.jpg') },
];

const patterns: { id: HeaderStyle['pattern']; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'waves', label: 'Waves' },
  { id: 'grid', label: 'Grid' },
  { id: 'dots', label: 'Dots' },
];

const CUSTOM = 'custom:';

function resolveCover(id: string): Cover {
  if (id.startsWith(CUSTOM)) return { id, label: 'Your upload', bg: colors.ink, image: { uri: id.slice(CUSTOM.length) } };
  return covers.find((c) => c.id === id) ?? covers[0];
}

export const COVER_HEIGHT = 128;

/** The cover banner itself. */
export function CoverBanner({ height = COVER_HEIGHT }: { height?: number }) {
  const { header } = useDemo();
  const cover = resolveCover(header.cover);
  const ink = cover.light ? colors.forest : colors.lime;
  return (
    <View style={{ height, backgroundColor: cover.bg, overflow: 'hidden' }}>
      {cover.image ? <Image source={cover.image} accessibilityIgnoresInvertColors style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      {header.pattern !== 'none' ? <PatternLayer pattern={header.pattern} color={ink} /> : null}
    </View>
  );
}

function PatternLayer({ pattern, color }: { pattern: HeaderStyle['pattern']; color: string }) {
  const shapes = [];
  if (pattern === 'waves') {
    for (let y = 8; y < 140; y += 18) shapes.push(<Path key={y} d={`M-10 ${y} q 25 -12 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0`} stroke={color} strokeWidth={2} fill="none" />);
  } else if (pattern === 'grid') {
    for (let x = 0; x <= 440; x += 22) shapes.push(<Path key={`x${x}`} d={`M${x} 0 V140`} stroke={color} strokeWidth={1} />);
    for (let y = 0; y <= 140; y += 22) shapes.push(<Path key={`y${y}`} d={`M0 ${y} H440`} stroke={color} strokeWidth={1} />);
  } else {
    for (let y = 10; y < 140; y += 18) for (let x = (y / 18) % 2 ? 19 : 10; x < 440; x += 18) shapes.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={2.2} fill={color} />);
  }
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 440 140" preserveAspectRatio="xMidYMid slice" opacity={0.35} aria-hidden>
      {shapes}
    </Svg>
  );
}

/** Slide-down panel for choosing the cover and pattern. */
export function CustomizePanel({ onDone }: { onDone: () => void }) {
  const { header, setHeader, showToast } = useDemo();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 260, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [a]);

  const upload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [3, 1] });
    if (!result.canceled) setHeader({ cover: CUSTOM + result.assets[0].uri });
  };

  return (
    <Animated.View
      style={[styles.panel, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }]}
    >
      <Text style={styles.panelTitle}>Customize your header</Text>

      <Text style={styles.label}>Cover</Text>
      <View style={styles.swatches}>
        {covers.map((c) => {
          const on = header.cover === c.id;
          return (
            <Tap
              key={c.id}
              accessibilityRole="radio"
              accessibilityLabel={c.label}
              accessibilityState={{ selected: on }}
              onPress={() => setHeader({ cover: c.id })}
              hitSlop={4}
              style={[styles.swatch, { backgroundColor: c.bg }, on && styles.swatchOn]}
            >
              {c.image ? <Image source={c.image} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} resizeMode="cover" /> : null}
              {on ? (
                <View style={styles.check}>
                  <Icon name="check" size={12} strokeWidth={3} />
                </View>
              ) : null}
            </Tap>
          );
        })}
        <Tap
          accessibilityRole="button"
          accessibilityLabel="Upload a cover photo"
          onPress={upload}
          hitSlop={4}
          style={[styles.swatch, styles.upload, header.cover.startsWith(CUSTOM) && styles.swatchOn]}
        >
          <Icon name="image" size={18} color={colors.lime} />
        </Tap>
      </View>

      <Text style={styles.label}>Pattern</Text>
      <View style={styles.swatches}>
        {patterns.map((p) => (
          <Chip key={p.id} dark label={p.label} selected={header.pattern === p.id} onPress={() => setHeader({ pattern: p.id })} />
        ))}
      </View>

      <Text style={text.small}>Only you can change this. Everyone who visits sees your header.</Text>
      <Button
        variant="primary"
        label="Done"
        onPress={() => {
          showToast('Header **updated**.');
          onDone();
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.paper, borderRadius: 20, padding: 16, gap: 10 },
  panelTitle: { fontFamily: fonts.display700, fontSize: 16, color: colors.forest },
  label: { fontFamily: fonts.body600, fontSize: 12.5, letterSpacing: 0.5, color: colors.muted, marginTop: 4 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatch: { width: 38, height: 38, borderRadius: 11, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  swatchOn: { borderColor: colors.ink },
  check: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  upload: { borderStyle: 'dashed', borderColor: colors.olive, backgroundColor: colors.forest },
});
