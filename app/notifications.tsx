import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Text } from '../src/components/Text';
import { BackButton, Body, Card, CategoryIcon, Empty, H1, Screen, Spacer } from '../src/components/ui';
import { fmtDistance } from '../src/geo';
import { useApp } from '../src/store';
import { C } from '../src/theme';
import { fmtAgo, isHappeningNow, whenShort } from '../src/time';

// Built from what's pinned around you right now. (Push alerts need a store build; see README.)
export default function Notifications() {
  const router = useRouter();
  const { nearby, profile, now } = useApp();
  const items = [...nearby]
    .sort(
      (a, b) =>
        Number(isHappeningNow(b, now)) - Number(isHappeningNow(a, now)) ||
        Number(profile.interests.includes(b.category)) - Number(profile.interests.includes(a.category)),
    )
    .slice(0, 12);

  return (
    <Screen>
      <BackButton />
      <Spacer h={20} />
      <H1>Your city is buzzing</H1>
      <Body style={{ marginTop: 6, marginBottom: 20 }}>New pings that reach where you are.</Body>
      {items.length === 0 ? <Empty title="All quiet for now" body="New pings near you show up here." /> : null}
      {items.map((p) => (
        <Card key={p.id} style={{ marginBottom: 12 }} onPress={() => router.push(`/ping/${p.id}`)}>
          <View style={{ flexDirection: 'row' }}>
            <CategoryIcon category={p.category} size={40} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontWeight: '700', color: C.dark }}>
                {p.isPromoted ? `${p.title} is promoted near you` : isHappeningNow(p, now) ? `${p.title} is on now` : `${p.title} was pinned near you`}
              </Text>
              <Body>
                {fmtDistance(p.distance)} away · {whenShort(p, now)}
              </Body>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{fmtAgo(p.createdAt, now)}</Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
