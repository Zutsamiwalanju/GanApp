import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { UI } from '../src/assets';
import { Text } from '../src/components/Text';
import { Body, Button, Eyebrow, H1, Logo, Screen } from '../src/components/ui';
import { C } from '../src/theme';

const SLIDES = [
  {
    tag: '01 / DISCOVER NEARBY',
    title: 'Your next favorite\nis right here.',
    body: 'From rooftop sets to tucked-away cafés. Find the good stuff around you, right now.',
    art: UI.onboardingDiscover,
  },
  {
    tag: '02 / MEET PEOPLE',
    title: 'Good plans.\nGreat company.',
    body: 'Turn shared interests into shared moments. Every event has its own chat circle.',
    art: UI.onboardingPeople,
  },
  {
    tag: '03 / TRUST THE REVIEWS',
    title: 'Real places.\nReal opinions.',
    body: 'Live photos only. Reviews stay up only when people vote them helpful.',
    art: UI.onboardingReviews,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <Screen scroll={false} footer={<Button title={last ? 'Let’s find your people' : 'Next'} onPress={() => (last ? router.replace('/role') : setI(i + 1))} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={30} />
        <Pressable onPress={() => router.replace('/role')} hitSlop={10}>
          <Text style={{ color: C.primary, fontWeight: '600' }}>Skip intro</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, marginVertical: 20, borderRadius: 28, overflow: 'hidden', backgroundColor: C.mint }}>
        <Image source={slide.art} style={{ flex: 1 }} contentFit="cover" transition={250} accessibilityLabel={slide.tag} />
      </View>

      <Eyebrow>{slide.tag}</Eyebrow>
      <H1>{slide.title}</H1>
      <Body style={{ marginTop: 10 }}>{slide.body}</Body>

      <View style={{ flexDirection: 'row', gap: 6, marginTop: 18 }}>
        {SLIDES.map((_, k) => (
          <Pressable key={k} onPress={() => setI(k)} hitSlop={8} accessibilityLabel={`Slide ${k + 1}`}>
            <View style={{ height: 6, width: k === i ? 24 : 6, borderRadius: 3, backgroundColor: k === i ? C.primary : C.line }} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
