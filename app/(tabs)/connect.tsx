import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { Badge, Body, Button, Card, Empty, Eyebrow, H1, H2, Photo, Screen, Spacer } from '../../src/components/ui';
import { fmtDistance } from '../../src/geo';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';

export default function Connect() {
  const { nearby, goingIds } = useApp();
  const events = nearby.filter((p) => p.kind === 'event');
  const mine = events.filter((p) => goingIds.has(p.id));
  const others = events.filter((p) => !goingIds.has(p.id));

  const Circle = ({ id }: { id: string }) => {
    const p = events.find((x) => x.id === id)!;
    return (
      <Card style={{ marginBottom: 12 }} onPress={() => router.push(`/chat/${p.id}`)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Photo ping={p} style={{ width: 56, height: 56 }} rounded={14} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark }}>{p.title}</Text>
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>
              {p.going} going · {p.category} lovers · {fmtDistance(p.distance)}
            </Text>
          </View>
          {goingIds.has(p.id) ? <Badge text="You’re going" /> : null}
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <Eyebrow>GO PLACES. TOGETHER.</Eyebrow>
      <H1>Find your kind of crowd.</H1>
      <Body style={{ marginTop: 8 }}>Shared interests. Real-life connections. Every live event has a public chat circle.</Body>
      <Spacer h={22} />
      <H2>Your event circles</H2>
      <Spacer h={10} />
      {mine.length ? (
        mine.map((p) => <Circle key={p.id} id={p.id} />)
      ) : (
        <Empty icon="people-outline" title="No circles yet" body="Tap “I’m going” on an event and its circle shows up here." />
      )}
      <Spacer h={22} />
      <H2>Nearby circles</H2>
      <Spacer h={10} />
      {others.length ? others.map((p) => <Circle key={p.id} id={p.id} />) : <Body>No other live events around you.</Body>}
      <Spacer />
      <Button title="Find more nearby plans" variant="outline" onPress={() => router.push('/(tabs)')} />
    </Screen>
  );
}
