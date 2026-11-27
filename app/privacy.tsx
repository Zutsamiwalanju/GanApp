import React from 'react';
import { View } from 'react-native';
import { Text } from '../src/components/Text';
import { BackButton, Body, Eyebrow, H1, H2, Screen, Spacer } from '../src/components/ui';
import { C } from '../src/theme';

const RULES = [
  ['Post what’s real, right now.', 'Live photos only, taken at the spot. No old photos, no fake events.'],
  ['Respect people in your photos.', 'Avoid close-ups of strangers. Never post kids, IDs, plates, or anyone who asked not to be photographed.'],
  ['Be kind in reviews and chats.', 'No hate, harassment, threats, or sharing someone’s private info.'],
  ['Label promotions.', 'Businesses must use the Promoted label. Paying for reviews isn’t allowed.'],
  ['Stay safe.', 'Meet in public, tell a friend where you’re going, and leave if something feels off.'],
];

const DATA = [
  ['What we keep', 'Your display name, role and interests; pings, photos, reviews and messages you post; what you save or mark “going”.'],
  ['Location', 'Used on your phone to show nearby pings and to place a ping where its photo was taken. We don’t store a history of where you go.'],
  ['Photos', 'Ping photos are public to anyone who can see the ping. Remove a ping and its photo is deleted.'],
  ['Reports', '3 reports from different people hide a ping, review or message for everyone until it’s reviewed.'],
  ['Your rights', 'Under the Philippine Data Privacy Act (RA 10173) you can ask to see, correct or delete your data. Contact the GanApp team.'],
];

export default function Privacy() {
  return (
    <Screen>
      <BackButton />
      <Spacer h={20} />
      <Eyebrow>PRIVACY & COMMUNITY</Eyebrow>
      <H1>Keeping GanApp real and safe</H1>
      <Body style={{ marginTop: 8 }}>A plain-language summary. This is a student project, so it isn’t a formal legal policy yet.</Body>
      <Spacer h={22} />
      <H2>Community rules</H2>
      <Spacer h={10} />
      {RULES.map(([t, d], i) => (
        <View key={t} style={{ flexDirection: 'row', marginBottom: 14 }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ color: C.primary, fontWeight: '700', fontSize: 12 }}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.dark, fontWeight: '700' }}>{t}</Text>
            <Body>{d}</Body>
          </View>
        </View>
      ))}
      <Spacer h={10} />
      <H2>Your data</H2>
      <Spacer h={10} />
      {DATA.map(([t, d]) => (
        <View key={t} style={{ marginBottom: 14 }}>
          <Text style={{ color: C.dark, fontWeight: '700' }}>{t}</Text>
          <Body>{d}</Body>
        </View>
      ))}
    </Screen>
  );
}
