import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BackButton, Body, Button, Eyebrow, Field, H1, Screen, Spacer } from '../src/components/ui';
import { useApp } from '../src/store';
import { C } from '../src/theme';
import type { Role } from '../src/types';

export default function RoleScreen() {
  const { profile, updateProfile, resetDraft } = useApp();
  const [role, setRole] = useState<Role>(profile.role);
  const [name, setName] = useState(profile.displayName === 'Explorer' ? '' : profile.displayName);
  const [busy, setBusy] = useState(false);

  const next = async () => {
    setBusy(true);
    try {
      await updateProfile({ role, displayName: name.trim() || (role === 'promoter' ? 'Promoter' : 'Explorer') });
      resetDraft();
      router.push(role === 'promoter' ? '/location' : '/interests');
    } finally {
      setBusy(false);
    }
  };

  const Option = ({ value, title, body, emoji }: { value: Role; title: string; body: string; emoji: string }) => {
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
          padding: 18,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 34, marginRight: 14 }}>{emoji}</Text>
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
      <Option value="explorer" emoji="🧭" title="Explorer" body="Find your next “you had to be there.”" />
      <Option value="promoter" emoji="📣" title="Promoter / Establishment Owner" body="Put your place on everyone’s radar." />
      <Spacer h={8} />
      <Field
        label={role === 'promoter' ? 'Business or event name' : 'Your first name (optional)'}
        placeholder={role === 'promoter' ? 'e.g. Poblacion Rooftop' : 'e.g. Errol'}
        value={name}
        onChangeText={setName}
        maxLength={40}
      />
      <Body style={{ textAlign: 'center' }}>No sign up needed!</Body>
    </Screen>
  );
}
