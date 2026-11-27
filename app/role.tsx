import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { UI } from '../src/assets';
import { Text } from '../src/components/Text';
import { BackButton, Body, Button, Eyebrow, Field, H1, Screen, Spacer } from '../src/components/ui';
import { useApp } from '../src/store';
import { C } from '../src/theme';
import type { Role } from '../src/types';

export default function RoleScreen() {
  const router = useRouter();
  const { profile, updateProfile, resetDraft } = useApp();
  const [role, setRole] = useState<Role>(profile.role);
  const [name, setName] = useState(profile.displayName);
  const [busy, setBusy] = useState(false);

  const next = async () => {
    setBusy(true);
    try {
      await updateProfile({ role, displayName: name.trim() || profile.displayName });
      resetDraft();
      router.push(role === 'promoter' ? '/location' : '/interests');
    } catch (e: any) {
      Alert.alert('Couldn’t save', e?.message ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const Option = ({ value, title, body, art }: { value: Role; title: string; body: string; art: number }) => {
    const on = role === value;
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: on }}
        onPress={() => setRole(value)}
        style={{
          backgroundColor: on ? C.mint : C.white,
          borderColor: on ? C.primary : C.line,
          borderWidth: on ? 2 : 1,
          borderRadius: 20,
          padding: 14,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Image source={art} style={{ width: 64, height: 64, marginRight: 14 }} contentFit="contain" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.dark }}>{title}</Text>
          <Text style={{ color: C.muted, marginTop: 4 }}>{body}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen footer={<Button title="Continue" onPress={next} loading={busy} />}>
      <BackButton onPress={() => router.replace('/onboarding')} />
      <Spacer h={20} />
      <Eyebrow>DO YOUR THING</Eyebrow>
      <H1>How will you{'\n'}use GanApp?</H1>
      <Body style={{ marginTop: 8, marginBottom: 20 }}>Good discoveries start with you.</Body>
      <Option value="explorer" art={UI.roleExplorer} title="Explorer" body="Find your next “you had to be there.”" />
      <Option value="promoter" art={UI.rolePromoter} title="Promoter / Establishment" body="Put your place on everyone’s radar." />
      <Spacer h={8} />
      <Field
        label={role === 'promoter' ? 'Business or event name' : 'What should people call you?'}
        placeholder={role === 'promoter' ? 'e.g. Poblacion Rooftop' : 'e.g. Errol'}
        value={name}
        onChangeText={setName}
        maxLength={40}
      />
      <Body style={{ textAlign: 'center' }}>No sign up needed. You can change this anytime.</Body>
    </Screen>
  );
}
