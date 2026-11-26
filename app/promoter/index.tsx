import { router, useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Body, Button, Card, Empty, Eyebrow, H1, H2, IconButton, Photo, Screen, Spacer, Stat } from '../../src/components/ui';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';
import { fmtAgo, fmtLeft, fmtWhen } from '../../src/time';

export default function PromoterDashboard() {
  const { pings, uid, profile, now, reload, resetDraft } = useApp();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const mine = pings.filter((p) => p.creatorId === uid);
  const live = mine.filter((p) => p.live);
  const earlier = mine.filter((p) => !p.live);
  const total = (k: 'views' | 'directions' | 'going') => live.reduce((a, p) => a + p[k], 0);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.white, fontWeight: '700' }}>{profile.displayName.slice(0, 2).toUpperCase()}</Text>
        </View>
        <IconButton name="person-circle-outline" label="Profile" onPress={() => router.push('/profile')} />
      </View>
      <Spacer h={18} />
      <Eyebrow>PROMOTER  ·  {profile.displayName.toUpperCase()}</Eyebrow>
      <H1>Your pings today.</H1>
      <Body style={{ marginTop: 6 }}>See who’s finding you, and put your next event on the map.</Body>
      <Spacer />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat value={total('views').toLocaleString()} label="People reached" />
        <Stat value={total('directions')} label="Got directions" />
        <Stat value={total('going')} label="Going" />
      </View>

      <Spacer h={24} />
      <H2>Live now</H2>
      <Spacer h={10} />
      {live.length === 0 ? (
        <Empty icon="megaphone-outline" title="No live pings" body="Create a promoted ping to show up on explorers’ maps." />
      ) : (
        live.map((p) => (
          <Card key={p.id} style={{ marginBottom: 12 }} onPress={() => router.push(`/promoter/live/${p.id}`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Photo ping={p} style={{ width: 64, height: 64 }} rounded={14} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', fontSize: 16, color: C.dark }}>{p.title}</Text>
                <Text style={{ color: C.muted, fontSize: 13 }}>
                  {p.category} · {fmtWhen(p.startsAt, p.endsAt, now)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <Badge text="● LIVE" tone="live" />
                  <Badge text={`⏱ Ends in ${fmtLeft(p.pingEndsAt, now)}`} />
                  {p.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
                </View>
              </View>
            </View>
            <Pressable onPress={() => router.push(`/promoter/live/${p.id}`)} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
              <Text style={{ color: C.primary, fontWeight: '600' }}>View insights  →</Text>
            </Pressable>
          </Card>
        ))
      )}

      {earlier.length ? (
        <>
          <Spacer h={14} />
          <H2>Earlier</H2>
          <Spacer h={10} />
          {earlier.map((p) => (
            <Card key={p.id} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push(`/promoter/live/${p.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: C.dark }}>{p.title}</Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>
                  Expired {fmtAgo(p.pingEndsAt, now).toLowerCase()} · {p.views} reached
                </Text>
              </View>
              <Badge text="Expired" tone="grey" />
            </Card>
          ))}
        </>
      ) : null}

      <Spacer />
      <Button
        title="+  Create a promoted ping"
        onPress={() => {
          resetDraft();
          router.push('/create/camera');
        }}
      />
      <Pressable onPress={() => router.push('/(tabs)')} style={{ padding: 14, alignItems: 'center' }}>
        <Text style={{ color: C.primary, fontWeight: '600' }}>Switch to Explorer view →</Text>
      </Pressable>
    </Screen>
  );
}
