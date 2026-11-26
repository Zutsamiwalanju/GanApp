import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Body, Button, Eyebrow, H1, Screen } from '../src/components/ui';
import { C } from '../src/theme';

const SLIDES = [
  {
    tag: '01 / DISCOVER NEARBY',
    title: 'Your next favorite\nis right here.',
    body: 'From rooftop sets to tucked-away cafés.\nFind the good stuff around you.',
    emoji: '📍',
  },
  {
    tag: '02 / MEET PEOPLE',
    title: 'Good plans.\nGreat company.',
    body: 'Turn shared interests into shared moments.\nFind your people, one pin at a time.',
    emoji: '🤝',
  },
  {
    tag: '03 / TRUST THE REVIEWS',
    title: 'Real places.\nReal opinions.',
    body: 'Live photos only. Reviews stay up only when people vote them helpful.',
    emoji: '⭐',
  },
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <Screen
      scroll={false}
      footer={<Button title={last ? 'Let’s find your people' : 'Next'} onPress={() => (last ? router.replace('/role') : setI(i + 1))} />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="location" size={24} color={C.primary} />
          <Text style={{ fontSize: 24, fontWeight: '700', color: C.dark, marginLeft: 6 }}>ganapp</Text>
        </View>
        <Pressable onPress={() => router.replace('/role')} hitSlop={10}>
          <Text style={{ color: C.primary, fontWeight: '600' }}>Skip intro</Text>
        </Pressable>
      </View>

      <View
        style={{
          flex: 1,
          marginVertical: 24,
          borderRadius: 20,
          backgroundColor: C.mint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 110 }}>{slide.emoji}</Text>
      </View>

      <Eyebrow>{slide.tag}</Eyebrow>
      <H1>{slide.title}</H1>
      <Body style={{ marginTop: 10 }}>{slide.body}</Body>

      <View style={{ flexDirection: 'row', gap: 6, marginTop: 20 }}>
        {SLIDES.map((_, k) => (
          <View key={k} style={{ height: 6, width: k === i ? 24 : 6, borderRadius: 3, backgroundColor: k === i ? C.primary : C.line }} />
        ))}
      </View>
    </Screen>
  );
}
