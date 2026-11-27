import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AreaSwitcher } from '../../src/components/AreaSwitcher';
import { Text } from '../../src/components/Text';
import { Badge, Body, Button, Chip, Empty, H2, IconButton, Photo, PingRow, s, Spacer, StatusBadge } from '../../src/components/ui';
import { fmtDistance } from '../../src/geo';
import { PingView, useApp } from '../../src/store';
import { C } from '../../src/theme';
import { dayDiff, isHappeningNow, whenShort } from '../../src/time';

type Filter = 'all' | 'now' | 'today' | 'free' | 'near';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'now', label: 'Happening now' },
  { key: 'today', label: 'Today' },
  { key: 'free', label: 'Free' },
  { key: 'near', label: 'Near me' },
];

function applyFilter(list: PingView[], f: Filter, now: Date) {
  switch (f) {
    case 'now':
      return list.filter((p) => isHappeningNow(p, now));
    case 'today':
      return list.filter((p) => p.kind === 'place' || (!!p.startsAt && dayDiff(new Date(p.startsAt), now) <= 0));
    case 'free':
      return list.filter((p) => /free/i.test(p.priceLabel));
    case 'near':
      return list.filter((p) => p.distance <= 1000);
    default:
      return list;
  }
}

export default function Explore() {
  const router = useRouter();
  const { nearby, now, profile, savedIds, toggleSave, usingSample, reload, setLocationMode } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const list = useMemo(() => applyFilter(nearby, filter, now), [nearby, filter, now]);
  const featured = list.slice(0, 5);
  const rest = list
    .slice(5)
    .sort((a, b) => Number(profile.interests.includes(b.category)) - Number(profile.interests.includes(a.category)));
  const happeningCount = nearby.filter((p) => isHappeningNow(p, now)).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } catch {
      /* the list keeps what it had */
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.pad} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>
        <AreaSwitcher />
        <Text style={{ fontSize: 26, fontWeight: '700', color: C.dark, marginTop: 4, letterSpacing: -0.5 }}>Find your next good thing.</Text>

        <View style={[s.row, { gap: 8, marginTop: 14 }]}>
          <Pressable onPress={() => router.push('/search')} style={[s.input, s.row, { flex: 1 }]} accessibilityLabel="Search">
            <Ionicons name="search" size={18} color={C.muted} />
            <Text style={{ color: '#9AA9A6', marginLeft: 8 }} numberOfLines={1}>
              Events, places, little adventures
            </Text>
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
          <H2>Around you</H2>
          {happeningCount ? <Badge text={`●  ${happeningCount} HAPPENING NOW`} tone="live" /> : null}
        </View>

        {list.length === 0 ? (
          <Empty
            title={filter === 'all' ? 'Nothing pinned around you yet' : 'Nothing matches that filter'}
            body={
              filter !== 'all'
                ? 'Try another filter.'
                : usingSample
                  ? 'Be the first to pin something here.'
                  : 'No pings reach your spot right now. Pin something, or look around a sample area.'
            }
            action={
              filter !== 'all' ? (
                <Button title="Show everything" variant="outline" onPress={() => setFilter('all')} />
              ) : usingSample ? (
                <Button title="Pin something" icon="camera" onPress={() => router.push('/create/camera')} />
              ) : (
                <View style={{ gap: 8 }}>
                  <Button title="Look around Intramuros" variant="outline" onPress={() => setLocationMode('intramuros')} />
                  <Button title="Look around Makati" variant="outline" onPress={() => setLocationMode('makati')} />
                </View>
              )
            }
          />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
            {featured.map((p) => (
              <Pressable key={p.id} onPress={() => router.push(`/ping/${p.id}`)} style={[s.card, { width: 250, padding: 10 }]}>
                <Photo ping={p} style={{ width: '100%', height: 150 }} />
                <View style={{ position: 'absolute', top: 18, left: 18, flexDirection: 'row', gap: 6, right: 50, flexWrap: 'wrap' }}>
                  <StatusBadge ping={p} now={now} />
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
                  {fmtDistance(p.distance)} · {p.category} · {whenShort(p, now)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {rest.length ? (
          <>
            <Spacer h={26} />
            <H2>Recommended for you</H2>
            <Body style={{ marginBottom: 12 }}>
              {profile.interests.length ? `A little ${profile.interests.slice(0, 3).join(', ')}. A lot of you.` : 'Picked from what’s around you.'}
            </Body>
            {rest.map((p) => (
              <PingRow key={p.id} ping={p} now={now} saved={savedIds.has(p.id)} onSave={() => toggleSave(p.id)} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
