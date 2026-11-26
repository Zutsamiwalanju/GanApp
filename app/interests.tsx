import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BackButton, Body, Button, Eyebrow, H1, Screen, Spacer } from '../src/components/ui';
import { useApp } from '../src/store';
import { C, CAT, CATEGORIES } from '../src/theme';

export default function Interests() {
  const { profile, updateProfile } = useApp();
  const [picked, setPicked] = useState<string[]>(profile.interests.length ? profile.interests : ['Food', 'Music', 'Art']);
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <Screen
      footer={
        <Button
          title={picked.length ? `Continue with ${picked.length} interest${picked.length > 1 ? 's' : ''}` : 'Pick at least one'}
          disabled={!picked.length}
          onPress={async () => {
            await updateProfile({ interests: picked });
            router.push('/location');
          }}
        />
      }
    >
      <BackButton />
      <Spacer h={20} />
      <Eyebrow>FIND YOUR THING</Eyebrow>
      <H1>What are{'\n'}you into?</H1>
      <Body style={{ marginTop: 8, marginBottom: 20 }}>A few favorites help us find your kind of plans. You can change these anytime.</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {CATEGORIES.map((c) => {
          const on = picked.includes(c);
          return (
            <Pressable
              key={c}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggle(c)}
              style={{
                width: '31%',
                aspectRatio: 1,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? C.mint : C.white,
                borderWidth: on ? 2 : 1,
                borderColor: on ? C.primary : C.line,
              }}
            >
              <Text style={{ fontSize: 30 }}>{CAT[c].emoji}</Text>
              <Text style={{ marginTop: 6, fontWeight: '600', color: C.dark }}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
