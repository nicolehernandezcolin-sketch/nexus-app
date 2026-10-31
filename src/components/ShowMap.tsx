// The shows map on the web (and Android until Google Maps is set up): map tiles with a pin per event.
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Tap } from './ui';
import { MAP_CENTER, ShowMapProps } from './ShowMap.shared';

const ZOOM = 10;
const TILE = 256;
const HEIGHT = 360;
const WORLD = TILE * 2 ** ZOOM;

/** Web Mercator: latitude and longitude to pixels on the whole-world map at ZOOM. */
function project(lat: number, lng: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * WORLD,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * WORLD,
  };
}

export function ShowMap({ shows, onOpen }: ShowMapProps) {
  const [width, setWidth] = useState(0);
  const center = project(MAP_CENTER.latitude, MAP_CENTER.longitude);
  const left = center.x - width / 2;
  const top = center.y - HEIGHT / 2;

  const tiles: { key: string; x: number; y: number; url: string }[] = [];
  if (width) {
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + width) / TILE); tx++) {
      for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + HEIGHT) / TILE); ty++) {
        tiles.push({
          key: `${tx}-${ty}`,
          x: tx * TILE - left,
          y: ty * TILE - top,
          url: `https://tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`,
        });
      }
    }
  }

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {tiles.map((t) => (
        <Image key={t.key} source={{ uri: t.url }} accessible={false} style={{ position: 'absolute', left: t.x, top: t.y, width: TILE, height: TILE }} />
      ))}
      {width
        ? shows.map((s) => {
            const p = project(s.lat, s.lng);
            return (
              <Tap
                key={s.id}
                accessibilityRole="button"
                accessibilityLabel={`${s.title}, ${s.when}`}
                onPress={() => onOpen(s.id)}
                style={[styles.pin, { left: p.x - left - 22, top: p.y - top - 44 }]}
              >
                <View style={styles.pinHead}>
                  <Icon name="events" size={18} color={colors.lime} />
                </View>
                <View style={styles.pinTip} />
              </Tap>
            );
          })
        : null}
      <Text style={styles.credit}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: HEIGHT, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.stone },
  pin: { position: 'absolute', width: 44, height: 48, alignItems: 'center' },
  pinHead: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.forest,
    borderWidth: 3,
    borderColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTip: { width: 10, height: 10, backgroundColor: colors.forest, transform: [{ rotate: '45deg' }], marginTop: -6 },
  credit: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    fontFamily: fonts.body400,
    fontSize: 10,
    color: colors.ink,
  },
});
