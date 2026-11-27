import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { CAT_ICON } from '../src/assets';
import { Text } from '../src/components/Text';
import { BackButton, Body, Button, Eyebrow, H1, Screen, Spacer } from '../src/components/ui';
import { useApp } from '../src/store';
import { C, CATEGORIES } from '../src/theme';

export default function Interests() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { profile, updateProfile } = useApp();
  const [picked, setPicked] = useState<string[]>(profile.interests.length ? profile.interests : ['Food', 'Music', 'Art']);
  const [busy, setBusy] = useState(false);
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({ interests: picked });
      if (from === 'profile') router.back(); // editing from Profile: just go back
      else router.push('/location');
    } catch (e: any) {
      Alert.alert('Couldn’t save', e?.message ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <Button
          title={picked.length ? (from === 'profile' ? 'Save interests' : `Continue with ${picked.length} interest${picked.length > 1 ? 's' : ''}`) : 'Pick at least one'}
          disabled={!picked.length}
          loading={busy}
          onPress={save}
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
              <Image source={CAT_ICON[c]} style={{ width: 48, height: 48 }} contentFit="contain" />
              <Text style={{ marginTop: 8, fontWeight: '600', color: C.dark }}>{c}</Text>
              {on ? (
                <View style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.white, fontSize: 12, fontWeight: '700' }}>✓</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
