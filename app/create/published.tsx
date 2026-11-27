import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Text } from '../../src/components/Text';
import { Body, Button, Card, H1, Photo, Screen, Spacer } from '../../src/components/ui';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';
import { fmtLeft, fmtWhen } from '../../src/time';

export default function Published() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPing, now } = useApp();
  const ping = getPing(id);

  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Button title="View your pin" onPress={() => router.replace(`/ping/${id}`)} />
          <Button title="Back to Explore" variant="ghost" onPress={() => router.replace('/(tabs)')} />
        </View>
      }
    >
      <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 24 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark" size={52} color={C.primary} />
        </View>
      </View>
      <H1 style={{ textAlign: 'center' }}>You’re on the map.</H1>
      <Body style={{ textAlign: 'center', marginTop: 8 }}>Your pin is live for explorers nearby.{'\n'}Good plans deserve to be found.</Body>
      <Spacer h={24} />
      {ping ? (
        <Card onPress={() => router.replace(`/ping/${ping.id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Photo ping={ping} style={{ width: 72, height: 72 }} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: C.dark }}>{ping.title}</Text>
            <Text style={{ color: C.primary, fontSize: 13, marginTop: 2 }}>
              ● Published · {ping.category} · {fmtWhen(ping.startsAt, ping.endsAt, now)}
            </Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Disappears in {fmtLeft(ping.pingEndsAt, now)}</Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
