import { useRouter } from 'expo-router';
import React from 'react';
import { BackButton, Body, Button, Empty, H1, PingRow, Screen, Spacer } from '../src/components/ui';
import { useApp } from '../src/store';

export default function Saved() {
  const router = useRouter();
  const { pings, savedIds, toggleSave, now } = useApp();
  const saved = pings.filter((p) => savedIds.has(p.id)).sort((a, b) => Number(b.live) - Number(a.live));
  return (
    <Screen>
      <BackButton />
      <Spacer h={20} />
      <H1>Saved places</H1>
      <Body style={{ marginTop: 6, marginBottom: 20 }}>A few pins for your next adventure.</Body>
      {saved.length ? (
        saved.map((p) => <PingRow key={p.id} ping={p} now={now} saved onSave={() => toggleSave(p.id)} />)
      ) : (
        <Empty title="Good plans, kept close." body="Tap the bookmark on any ping and it lives here." action={<Button title="Explore" onPress={() => router.replace('/(tabs)')} />} />
      )}
    </Screen>
  );
}
