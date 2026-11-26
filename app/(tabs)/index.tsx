import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, Body, Button, Chip, Empty, H2, IconButton, Photo, PingRow, s, Spacer } from '../../src/components/ui';
import { fmtDistance } from '../../src/geo';
import { PingView, useApp } from '../../src/store';
import { C } from '../../src/theme';
import { fmtLeft, fmtUntil } from '../../src/time';

type Filter = 'all' | 'now' | 'today' | 'free' | 'near';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'now', label: 'Happening now' },
  { key: 'today', label: 'Today' },
  { key: 'free', label: 'Free' },
  { key: 'near', label: 'Near me' },
];

function applyFilter(list: PingView[], f: Filter, now: Date) {
  const sameDay = (iso: string | null) => !!iso && new Date(iso).toDateString() === now.toDateString();
  switch (f) {
    case 'now':
      return list.filter((p) => p.kind === 'place' || (p.startsAt && new Date(p.startsAt) <= now && (!p.endsAt || new Date(p.endsAt) >= now)));
    case 'today':
      return list.filter((p) => p.kind === 'place' || sameDay(p.startsAt));
    case 'free':
      return list.filter((p) => /free/i.test(p.priceLabel));
    case 'near':
      return list.filter((p) => p.distance <= 1000);
    default:
      return list;
  }
}

export default function Explore() {
  const { nearby, now, profile, savedIds, toggleSave, usingSample, reload, setLocationMode } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const list = useMemo(() => applyFilter(nearby, filter, now), [nearby, filter, now]);
  const live = list.filter((p) => p.kind === 'event');
  const forYou = list
    .filter((p) => !live.slice(0, 6).includes(p) || p.kind === 'place')
    .sort((a, b) => Number(profile.interests.includes(b.category)) - Number(profile.interests.includes(a.category)));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.pad}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.muted, fontSize: 13 }}>
              <Ionicons name="location" size={13} color={C.primary} /> {usingSample ? 'Makati, Philippines · sample' : 'Near you'}
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '700', color: C.dark, marginTop: 2 }}>Find your next good thing.</Text>
          </View>
        </View>
        <View style={[s.row, { gap: 8, marginTop: 14 }]}>
          <Pressable onPress={() => router.push('/search')} style={[s.input, s.row, { flex: 1 }]}>
            <Ionicons name="search" size={18} color={C.muted} />
            <Text style={{ color: '#9AA9A6', marginLeft: 8 }}>Events, places, little adventures</Text>
          </Pressable>
          <IconButton name="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
          <IconButton name="bookmark-outline" label="Saved places" onPress={() => router.push('/saved')} />
          <IconButton name="person-circle-outline" label="Profile" onPress={() => router.push('/profile')} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>

        <Spacer h={22} />
        <View style={[s.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
          <H2>Live nearby</H2>
          <Badge text={`●  ${live.length} LIVE`} tone="live" />
        </View>

        {live.length === 0 ? (
          <Empty
            icon="radio-outline"
            title="Nothing live around you yet"
            body={usingSample ? 'Try another filter, or be the first to pin something.' : 'No pings reach your spot right now. Pin something, or look around the Makati sample city.'}
            action={
              usingSample ? (
                <Button title="Pin something" icon="camera" onPress={() => router.push('/create/camera')} />
              ) : (
                <Button title="Explore Makati sample" variant="outline" onPress={() => setLocationMode('sample')} />
              )
            }
          />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
            {live.slice(0, 6).map((p) => (
              <Pressable key={p.id} onPress={() => router.push(`/ping/${p.id}`)} style={[s.card, { width: 240, padding: 10 }]}>
                <Photo ping={p} style={{ width: '100%', height: 140 }} />
                <View style={{ position: 'absolute', top: 18, left: 18, flexDirection: 'row', gap: 6 }}>
                  <Badge text="● LIVE" tone="live" />
                  {p.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
                </View>
                <Pressable
                  accessibilityLabel={savedIds.has(p.id) ? 'Unsave' : 'Save'}
                  onPress={() => toggleSave(p.id)}
                  style={{ position: 'absolute', top: 16, right: 16, backgroundColor: C.white, borderRadius: 16, padding: 6 }}
                >
                  <Ionicons name={savedIds.has(p.id) ? 'bookmark' : 'bookmark-outline'} size={18} color={C.primary} />
                </Pressable>
                <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark, marginTop: 10 }} numberOfLines={1}>
                  {p.title}
                </Text>
                <Text style={{ color: C.muted, marginTop: 2, fontSize: 13 }} numberOfLines={1}>
                  {fmtDistance(p.distance)} · {p.category} · {fmtUntil(p.pingEndsAt, now)}
                </Text>
                <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                  <Badge text={`⏱ Ends in ${fmtLeft(p.pingEndsAt, now)}`} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Spacer h={26} />
        <H2>Recommended for you</H2>
        <Body style={{ marginBottom: 12 }}>
          {profile.interests.length ? `A little ${profile.interests.slice(0, 3).join(', ')}. A lot of you.` : 'Picked from what’s around you.'}
        </Body>
        {forYou.length === 0 ? (
          <Body>Nothing else nearby right now.</Body>
        ) : (
          forYou.map((p) => <PingRow key={p.id} ping={p} now={now} saved={savedIds.has(p.id)} onSave={() => toggleSave(p.id)} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
