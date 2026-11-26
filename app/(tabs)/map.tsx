import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, Button, ChipGroup, Photo, s } from '../../src/components/ui';
import { bumpStat } from '../../src/api';
import { directionsUrl, fmtDistance, radiusLabel } from '../../src/geo';
import { useApp } from '../../src/store';
import { C, catMeta } from '../../src/theme';
import { fmtLeft, fmtWhen } from '../../src/time';

const RADII = [500, 1000, 5000];

export default function MapTab() {
  const { nearby, location, now, savedIds, toggleSave } = useApp();
  const [radius, setRadius] = useState(1000);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const shown = useMemo(() => nearby.filter((p) => p.distance <= radius), [nearby, radius]);
  const selected = shown.find((p) => p.id === selectedId) ?? null;
  const delta = radius <= 500 ? 0.012 : radius <= 1000 ? 0.022 : 0.09;
  const mapRef = useRef<MapView>(null);

  // Re-center when the radius or your location changes; otherwise the map stays where you drag it.
  useEffect(() => {
    mapRef.current?.animateToRegion({ latitude: location.lat, longitude: location.lng, latitudeDelta: delta, longitudeDelta: delta }, 400);
  }, [location.lat, location.lng, delta]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{ latitude: location.lat, longitude: location.lng, latitudeDelta: delta, longitudeDelta: delta }}
        showsUserLocation
        onPress={() => setSelectedId(null)}
      >
        <Circle
          center={{ latitude: location.lat, longitude: location.lng }}
          radius={radius}
          strokeColor="rgba(8,127,112,0.6)"
          fillColor="rgba(8,127,112,0.08)"
        />
        {shown.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            pinColor={catMeta(p.category).color}
            title={p.title}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedId(p.id);
            }}
          />
        ))}
      </MapView>

      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={[s.card, { margin: 16, padding: 14 }]}>
          <View style={[s.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark }}>Around you</Text>
            <Pressable onPress={() => router.push('/search')} hitSlop={8}>
              <Ionicons name="search" size={20} color={C.dark} />
            </Pressable>
          </View>
          <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600', marginBottom: 6 }}>SEARCH RADIUS · {shown.length} LIVE</Text>
          <ChipGroup options={RADII} value={radius} onChange={(r) => { setRadius(r); setSelectedId(null); }} label={radiusLabel} />
        </View>
      </SafeAreaView>

      {selected ? (
        <View style={[s.card, { position: 'absolute', left: 16, right: 16, bottom: 16, padding: 14 }]}>
          <Pressable onPress={() => router.push(`/ping/${selected.id}`)} style={s.row}>
            <Photo ping={selected} style={{ width: 72, height: 72 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={[s.row, { gap: 6 }]}>
                <Badge text={`● LIVE / ${selected.category.toUpperCase()}`} tone="live" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: C.dark, marginTop: 6 }} numberOfLines={1}>
                {selected.title}
              </Text>
              <Text style={{ color: C.muted, fontSize: 13 }} numberOfLines={1}>
                {fmtDistance(selected.distance)} · {fmtWhen(selected.startsAt, selected.endsAt, now)}
              </Text>
              <Text style={{ color: C.primary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>⏱ Ping ends in {fmtLeft(selected.pingEndsAt, now)}</Text>
            </View>
          </Pressable>
          <View style={[s.row, { gap: 10, marginTop: 12 }]}>
            <Button
              title="Get directions"
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
      ) : shown.length === 0 ? (
        <View style={[s.card, { position: 'absolute', left: 16, right: 16, bottom: 16 }]}>
          <Text style={{ color: C.dark, fontWeight: '600' }}>Nothing live within {radiusLabel(radius)}.</Text>
          <Text style={{ color: C.muted, marginTop: 4 }}>Try a bigger radius, or tap Pin to put something on the map.</Text>
        </View>
      ) : (
        <View style={[s.card, { position: 'absolute', left: 16, right: 16, bottom: 16 }]}>
          <Text style={{ color: C.muted }}>Your next good thing is a pin away. Tap a colored pin to explore.</Text>
        </View>
      )}
    </View>
  );
}
