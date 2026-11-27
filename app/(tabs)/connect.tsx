import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Text } from '../../src/components/Text';
import { Badge, Body, Button, Card, Empty, Eyebrow, H1, H2, Photo, Screen, Spacer } from '../../src/components/ui';
import { fmtDistance } from '../../src/geo';
import { PingView, useApp } from '../../src/store';
import { C } from '../../src/theme';
import { whenShort } from '../../src/time';

export default function Connect() {
  const router = useRouter();
  const { nearby, goingIds, now } = useApp();
  const events = nearby.filter((p) => p.kind === 'event');
  const mine = events.filter((p) => goingIds.has(p.id));
  const others = events.filter((p) => !goingIds.has(p.id));

  const CircleCard = ({ p }: { p: PingView }) => (
    <Card style={{ marginBottom: 12 }} onPress={() => router.push(`/chat/${p.id}`)}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Photo ping={p} style={{ width: 56, height: 56 }} rounded={14} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark }} numberOfLines={1}>
            {p.title}
          </Text>
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
            {p.going} going · {whenShort(p, now)} · {fmtDistance(p.distance)}
          </Text>
        </View>
        {goingIds.has(p.id) ? <Badge text="Going" /> : null}
      </View>
    </Card>
  );

  return (
    <Screen>
      <Eyebrow>GO PLACES. TOGETHER.</Eyebrow>
      <H1>Find your kind of crowd.</H1>
      <Body style={{ marginTop: 8 }}>Every event has a public chat circle. Say hi, plan where to meet, then go.</Body>
      <Spacer h={22} />
      <H2>Your circles</H2>
      <Spacer h={10} />
      {mine.length ? mine.map((p) => <CircleCard key={p.id} p={p} />) : <Empty title="No circles yet" body="Tap “I’m going” on an event and its circle shows up here." />}
      <Spacer h={22} />
      <H2>Nearby circles</H2>
      <Spacer h={10} />
      {others.length ? others.map((p) => <CircleCard key={p.id} p={p} />) : <Body>No other events around you right now.</Body>}
      <Spacer />
      <Button title="Find more nearby plans" variant="outline" onPress={() => router.push('/(tabs)')} />
    </Screen>
  );
}
