import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, Pressable, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bumpStat } from '../../src/api';
import { CAT_GLYPH } from '../../src/assets';
import { AreaSwitcher } from '../../src/components/AreaSwitcher';
import { Text } from '../../src/components/Text';
import { Badge, Button, ChipGroup, Photo, s, StatusBadge } from '../../src/components/ui';
import { directionsUrl, fmtDistance, radiusLabel } from '../../src/geo';
import { PingView, useApp } from '../../src/store';
import { C, catMeta } from '../../src/theme';
import { fmtWhen } from '../../src/time';

const RADII = [500, 1000, 5000];

/** Round category pin. Re-draws only until the icon has loaded (keeps Android smooth). */
function PinMarker({ ping, selected, onPress }: { ping: PingView; selected: boolean; onPress: () => void }) {
  const [track, setTrack] = useState(true);
  const size = selected ? 48 : 38;
  const color = catMeta(ping.category).color;
  return (
    <Marker
      coordinate={{ latitude: ping.lat, longitude: ping.lng }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={track}
      onPress={(e) => {
        e.stopPropagation();
        onPress();
      }}
      accessibilityLabel={ping.title}
    >
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: 3, borderColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={CAT_GLYPH[ping.category]} style={{ width: size * 0.55, height: size * 0.55 }} onLoad={() => setTimeout(() => setTrack(false), 250)} />
        </View>
        <View style={{ width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: C.white, marginTop: -1 }} />
      </View>
    </Marker>
  );
}

export default function MapTab() {
  const router = useRouter();
  const { nearby, location, now, savedIds, toggleSave, usingSample } = useApp();
  const [radius, setRadius] = useState(1000);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  const shown = useMemo(() => nearby.filter((p) => p.distance <= radius), [nearby, radius]);
  const selected = shown.find((p) => p.id === selectedId) ?? null;
  const delta = radius <= 500 ? 0.012 : radius <= 1000 ? 0.022 : 0.09;
  const latKey = Math.round(location.lat * 1000);
  const lngKey = Math.round(location.lng * 1000);

  const recenter = () =>
    mapRef.current?.animateToRegion({ latitude: location.lat, longitude: location.lng, latitudeDelta: delta, longitudeDelta: delta }, 400);

  // Re-center when the radius or area changes; otherwise the map stays where you drag it.
  useEffect(() => {
    recenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delta, usingSample, latKey, lngKey]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{ latitude: location.lat, longitude: location.lng, latitudeDelta: delta, longitudeDelta: delta }}
        showsUserLocation={!usingSample}
        showsMyLocationButton={false}
        onPress={() => setSelectedId(null)}
      >
        <Circle center={{ latitude: location.lat, longitude: location.lng }} radius={radius} strokeColor="rgba(8,127,112,0.6)" fillColor="rgba(8,127,112,0.08)" />
        {usingSample ? (
          <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#2F80ED', borderWidth: 3, borderColor: C.white }} />
          </Marker>
        ) : null}
        {shown.map((p) => (
          <PinMarker key={`${p.id}-${p.id === selectedId}`} ping={p} selected={p.id === selectedId} onPress={() => setSelectedId(p.id)} />
        ))}
      </MapView>

      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={[s.card, { margin: 16, padding: 14 }]}>
          <View style={[s.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
            <AreaSwitcher />
            <Pressable onPress={() => router.push('/search')} hitSlop={8} accessibilityLabel="Search">
              <Ionicons name="search" size={20} color={C.dark} />
            </Pressable>
          </View>
          <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600', marginBottom: 6 }}>SEARCH RADIUS · {shown.length} PINNED</Text>
          <ChipGroup
            options={RADII}
            value={radius}
            onChange={(r) => {
              setRadius(r);
              setSelectedId(null);
            }}
            label={radiusLabel}
          />
        </View>
        <View style={{ alignItems: 'flex-end', paddingHorizontal: 16 }}>
          <Pressable onPress={recenter} style={s.round} accessibilityLabel="Recenter map">
            <Ionicons name="locate" size={20} color={C.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      {selected ? (
        <View style={[s.card, { position: 'absolute', left: 16, right: 16, bottom: 16, padding: 14 }]}>
          <Pressable onPress={() => router.push(`/ping/${selected.id}`)} style={s.row}>
            <Photo ping={selected} style={{ width: 76, height: 76 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={[s.row, { gap: 6, flexWrap: 'wrap' }]}>
                <StatusBadge ping={selected} now={now} />
                {selected.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: C.dark, marginTop: 6 }} numberOfLines={1}>
                {selected.title}
              </Text>
              <Text style={{ color: C.muted, fontSize: 13 }} numberOfLines={1}>
                {fmtDistance(selected.distance)} · {fmtWhen(selected.startsAt, selected.endsAt, now)}
              </Text>
            </View>
          </Pressable>
          <View style={[s.row, { gap: 10, marginTop: 12 }]}>
            <Button
              title="Directions"
              icon="walk"
              style={{ flex: 1 }}
              onPress={() => {
                bumpStat(selected.id, 'directions');
                Linking.openURL(directionsUrl(selected));
              }}
            />
            <Button
              title={savedIds.has(selected.id) ? 'Saved' : 'Save'}
              icon={savedIds.has(selected.id) ? 'bookmark' : 'bookmark-outline'}
              variant="outline"
              style={{ width: 120 }}
              onPress={() => toggleSave(selected.id)}
            />
          </View>
        </View>
      ) : (
        <View style={[s.card, { position: 'absolute', left: 16, right: 16, bottom: 16 }]}>
          <Text style={{ color: shown.length ? C.muted : C.dark, fontWeight: shown.length ? '400' : '600' }}>
            {shown.length ? 'Your next good thing is a pin away. Tap a pin to explore.' : `Nothing pinned within ${radiusLabel(radius)}. Try a bigger radius.`}
          </Text>
        </View>
      )}
    </View>
  );
}
