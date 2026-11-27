import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '../src/components/Text';
import { BackButton, Body, Button, ChipGroup, Field, H1, Label, Logo, Screen, Spacer } from '../src/components/ui';
import { SAMPLE_AREAS } from '../src/geo';
import { useApp } from '../src/store';
import { C } from '../src/theme';
import type { Role } from '../src/types';

function Row({ icon, label, detail, onPress }: { icon: any; label: string; detail?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
      <Ionicons name={icon} size={20} color={C.primary} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: C.dark, fontWeight: '600' }}>{label}</Text>
        {detail ? <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{detail}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.muted} />
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const { profile, updateProfile, locationMode, setLocationMode, resetOnboarding, resetDraft, blockedIds, hiddenIds, unblockAll } = useApp();
  const [name, setName] = useState(profile.displayName);
  const [role, setRole] = useState<Role>(profile.role);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({ displayName: name.trim() || profile.displayName, role });
      resetDraft();
      router.replace(role === 'promoter' ? '/promoter' : '/(tabs)');
    } catch (e: any) {
      Alert.alert('Couldn’t save', e.message);
    } finally {
      setBusy(false);
    }
  };

  const where = locationMode === 'real' ? 'Using your real location' : `Sample area: ${SAMPLE_AREAS[locationMode].label}`;

  return (
    <Screen footer={<Button title="Save" onPress={save} loading={busy} />}>
      <BackButton />
      <Spacer h={20} />
      <H1>You</H1>
      <Body style={{ marginTop: 6, marginBottom: 20 }}>No account needed. Your profile is tied to this phone.</Body>
      <Field label={role === 'promoter' ? 'Business or event name' : 'Display name'} value={name} onChangeText={setName} maxLength={40} />
      <Label>I’m using GanApp as</Label>
      <ChipGroup<Role> options={['explorer', 'promoter']} value={role} onChange={setRole} label={(r) => (r === 'explorer' ? 'Explorer' : 'Promoter')} />
      {role === 'promoter' && !profile.verified ? (
        <Body style={{ marginTop: 8 }}>Promoted pings are labeled clearly. Verified badges for businesses are coming soon.</Body>
      ) : null}
      <Spacer h={18} />
      <Row
        icon="navigate-outline"
        label="Location"
        detail={where}
        onPress={async () => {
          if (locationMode !== 'real') {
            const ok = await setLocationMode('real');
            if (!ok) Alert.alert('Location is off', 'Allow location for GanApp in your phone settings.');
          } else {
            await setLocationMode('makati');
          }
        }}
      />
      <Row icon="heart-outline" label="Interests" detail={profile.interests.join(', ') || 'None yet'} onPress={() => router.push('/interests?from=profile')} />
      <Row icon="shield-checkmark-outline" label="Privacy & community rules" onPress={() => router.push('/privacy')} />
      {blockedIds.size || hiddenIds.size ? (
        <Row
          icon="hand-left-outline"
          label="Blocked & reported"
          detail={`${blockedIds.size} blocked · ${hiddenIds.size} hidden`}
          onPress={() =>
            Alert.alert('Unblock everyone?', 'You’ll see their pings, reviews and messages again, and items you reported will show again.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Unblock all', onPress: () => unblockAll().catch((e) => Alert.alert('Couldn’t update', e.message)) },
            ])
          }
        />
      ) : null}
      <Row
        icon="refresh-outline"
        label="Replay the intro"
        onPress={async () => {
          await resetOnboarding();
          router.replace('/onboarding');
        }}
      />
      <Spacer h={30} />
      <View style={{ alignItems: 'center', opacity: 0.7 }}>
        <Logo size={22} />
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Version 0.2 · IE103-2 Technopreneurship</Text>
      </View>
    </Screen>
  );
}
