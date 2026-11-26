import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { BackButton, Body, Card, Empty, H1, Screen, Spacer } from '../src/components/ui';
import { fmtDistance } from '../src/geo';
import { useApp } from '../src/store';
import { C, catMeta } from '../src/theme';
import { fmtAgo, fmtLeft } from '../src/time';

// Built from what's live around you right now (push notifications come later).
export default function Notifications() {
  const { nearby, profile, now } = useApp();
  const items = [...nearby]
    .sort((a, b) => Number(profile.interests.includes(b.category)) - Number(profile.interests.includes(a.category)))
    .slice(0, 10);

  return (
    <Screen>
      <BackButton />
      <Spacer h={20} />
      <H1>Your city is buzzing</H1>
      <Body style={{ marginTop: 6, marginBottom: 20 }}>Live pings that reach where you are.</Body>
      {items.length === 0 ? <Empty icon="notifications-outline" title="All quiet for now" body="We’ll show new pings near you here." /> : null}
      {items.map((p) => (
        <Card key={p.id} style={{ marginBottom: 12 }} onPress={() => router.push(`/ping/${p.id}`)}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ fontSize: 26, marginRight: 12 }}>{catMeta(p.category).emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: C.dark }}>
                {p.isPromoted ? `${p.title} is promoted near you` : `${p.title} is live`}
              </Text>
              <Body>
                {fmtDistance(p.distance)} away · ends in {fmtLeft(p.pingEndsAt, now)}. Grab your people and head over.
              </Body>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{fmtAgo(p.createdAt, now)}</Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
