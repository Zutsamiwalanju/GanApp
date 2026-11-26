import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { BackButton, Body, Button, ChipGroup, Field, H1, Label, Screen, Spacer } from '../src/components/ui';
import { useApp } from '../src/store';
import type { Role } from '../src/types';

export default function Profile() {
  const { profile, updateProfile, usingSample, setLocationMode, resetOnboarding, resetDraft } = useApp();
  const [name, setName] = useState(profile.displayName);
  const [role, setRole] = useState<Role>(profile.role);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({ displayName: name.trim() || 'Explorer', role });
      resetDraft();
      router.replace(role === 'promoter' ? '/promoter' : '/(tabs)');
    } catch (e: any) {
      Alert.alert('Couldn’t save', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title="Save" onPress={save} loading={busy} />}>
      <BackButton />
      <Spacer h={20} />
      <H1>You</H1>
      <Body style={{ marginTop: 6, marginBottom: 20 }}>No account needed. Your profile lives on this phone.</Body>
      <Field label={role === 'promoter' ? 'Business or event name' : 'Display name'} value={name} onChangeText={setName} maxLength={40} />
      <Label>I’m using GanApp as</Label>
      <ChipGroup<Role> options={['explorer', 'promoter']} value={role} onChange={setRole} label={(r) => (r === 'explorer' ? 'Explorer' : 'Promoter')} />
      <Spacer h={24} />
      <Label>Location</Label>
      <Body style={{ marginBottom: 10 }}>{usingSample ? 'Showing the Makati sample city.' : 'Using your real location.'}</Body>
      <View style={{ gap: 10 }}>
        {usingSample ? (
          <Button
            title="Use my real location"
            variant="outline"
            icon="navigate"
            onPress={async () => {
              const ok = await setLocationMode('real');
              if (!ok) Alert.alert('Location is off', 'Allow location for GanApp in your phone settings.');
            }}
          />
        ) : (
          <Button title="Switch to Makati sample" variant="outline" onPress={() => setLocationMode('sample')} />
        )}
        <Button title="Interests" variant="outline" icon="heart-outline" onPress={() => router.push('/interests')} />
        <Button
          title="Replay the intro"
          variant="ghost"
          onPress={async () => {
            await resetOnboarding();
            router.replace('/onboarding');
          }}
        />
      </View>
    </Screen>
  );
}
