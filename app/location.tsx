import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { UI } from '../src/assets';
import { Text } from '../src/components/Text';
import { BackButton, Body, Button, H1, Label, Screen, Spacer } from '../src/components/ui';
import { SAMPLE_AREAS, SampleArea } from '../src/geo';
import { useApp } from '../src/store';
import { C } from '../src/theme';

export default function LocationScreen() {
  const router = useRouter();
  const { setLocationMode, finishOnboarding, profile } = useApp();
  const [busy, setBusy] = useState(false);

  const done = async () => {
    await finishOnboarding();
    router.replace(profile.role === 'promoter' ? '/promoter' : '/(tabs)');
  };

  const enable = async () => {
    setBusy(true);
    const ok = await setLocationMode('real');
    setBusy(false);
    if (!ok) {
      Alert.alert('Location is off', 'No problem. We’ll show the Makati sample area for now. You can turn location on later in your profile.');
      await setLocationMode('makati');
    }
    await done();
  };

  const sample = async (area: SampleArea) => {
    await setLocationMode(area);
    await done();
  };

  return (
    <Screen footer={<Button title="Use my location" icon="navigate" onPress={enable} loading={busy} />}>
      <BackButton />
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <Image source={UI.location} style={{ width: 220, height: 220 }} contentFit="contain" />
      </View>
      <H1>A whole city.{'\n'}Right around you.</H1>
      <Body style={{ marginTop: 10 }}>Turn on location to see live events, hidden gems and great people nearby, and to pin things yourself.</Body>
      <Spacer />
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.line }}>
        <Ionicons name="lock-closed" size={18} color={C.primary} />
        <Body style={{ marginLeft: 10, flex: 1 }}>Your location stays yours. It’s only used to show what’s nearby and to place your pings.</Body>
      </View>
      <Spacer h={22} />
      <Label>Or look around a sample area</Label>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {(Object.keys(SAMPLE_AREAS) as SampleArea[]).map((k) => (
          <Pressable
            key={k}
            onPress={() => sample(k)}
            style={{ flex: 1, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14 }}
          >
            <Text style={{ fontWeight: '700', color: C.dark }}>{SAMPLE_AREAS[k].label}</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{SAMPLE_AREAS[k].detail}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
