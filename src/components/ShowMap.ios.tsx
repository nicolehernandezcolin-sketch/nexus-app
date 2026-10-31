// The shows map on iPhone: Apple Maps with a pin for each event.
import { AppleMaps, useLocationPermissions } from 'expo-maps';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Tap } from './ui';
import { MAP_CENTER, ShowMapProps } from './ShowMap.shared';

export function ShowMap({ shows, onOpen }: ShowMapProps) {
  const [permission, requestPermission] = useLocationPermissions();
  const located = !!permission?.granted;
  return (
    <View style={styles.wrap}>
      <AppleMaps.View
        style={StyleSheet.absoluteFill}
        cameraPosition={{ coordinates: MAP_CENTER, zoom: 10 }}
        properties={{ isMyLocationEnabled: located }}
        markers={shows.map((s) => ({
          id: s.id,
          title: s.title,
          coordinates: { latitude: s.lat, longitude: s.lng },
          tintColor: colors.forest,
          systemImage: 'music.note',
        }))}
        onMarkerClick={(m) => m.id && onOpen(m.id)}
      />
      {!located ? (
        <Tap accessibilityRole="button" onPress={requestPermission} style={styles.near}>
          <Icon name="globe" size={16} color={colors.lime} />
          <Text style={styles.nearText}>Show me on the map</Text>
        </Tap>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 360, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.stone },
  near: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.forest,
  },
  nearText: { fontFamily: fonts.body600, fontSize: 13, color: colors.lime },
});
