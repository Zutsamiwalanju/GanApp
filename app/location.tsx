import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { BackButton, Body, Button, H1, Screen, Spacer } from '../src/components/ui';
import { useApp } from '../src/store';
import { C } from '../src/theme';

export default function LocationScreen() {
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
      Alert.alert('Location is off', 'No problem. We’ll show the Makati sample city for now. You can turn location on later in your profile.');
      await setLocationMode('sample');
    }
    await done();
  };

  return (
    <Screen
      footer={
        <View>
          <Button title="Enable location" icon="navigate" onPress={enable} loading={busy} />
          <Pressable
            onPress={async () => {
              await setLocationMode('sample');
              await done();
            }}
            style={{ padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: C.primary, fontWeight: '600' }}>Explore sample city (Makati)</Text>
          </Pressable>
        </View>
      }
    >
      <BackButton />
      <View style={{ alignItems: 'center', marginVertical: 40 }}>
        <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="location" size={72} color={C.primary} />
        </View>
      </View>
      <H1>A whole city.{'\n'}Right around you.</H1>
      <Body style={{ marginTop: 10 }}>Enable location to find live events, hidden gems, and great people nearby.</Body>
      <Spacer />
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.line }}>
        <Ionicons name="lock-closed" size={18} color={C.primary} />
        <Body style={{ marginLeft: 10, flex: 1 }}>Your location stays yours. It’s only used to show what’s nearby and to place your pings.</Body>
      </View>
    </Screen>
  );
}
