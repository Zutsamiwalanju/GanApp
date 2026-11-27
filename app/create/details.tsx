import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { CAT_ICON } from '../../src/assets';
import { Text } from '../../src/components/Text';
import { WhenPicker } from '../../src/components/WhenPicker';
import { BackButton, Body, Button, Card, Chip, Eyebrow, Field, H1, Label, Screen, Spacer } from '../../src/components/ui';
import { useApp } from '../../src/store';
import { C, CATEGORIES } from '../../src/theme';

export default function Details() {
  const router = useRouter();
  const { draft, updateDraft, profile } = useApp();
  const isFree = /free/i.test(draft.priceLabel);
  const canNext = !!draft.photoUri && draft.title.trim().length > 0 && draft.placeName.trim().length > 0;

  return (
    <Screen footer={<Button title="Next: duration & reach" disabled={!canNext} onPress={() => router.push('/create/settings')} />}>
      <BackButton onPress={() => router.replace('/create/camera')} />
      <Spacer h={20} />
      <Eyebrow>{profile.role === 'promoter' ? 'NEW PROMOTED PING' : 'PUT SOMETHING GOOD ON THE MAP'}</Eyebrow>
      <H1>{profile.role === 'promoter' ? 'Put it on the map.' : 'Make your next pin.'}</H1>
      <Body style={{ marginTop: 6, marginBottom: 18 }}>Live photo captured. Now add the details.</Body>

      <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        {draft.photoUri ? <Image source={{ uri: draft.photoUri }} style={{ width: 64, height: 64, borderRadius: 12 }} contentFit="cover" /> : null}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontWeight: '700', color: C.dark }}>Live photo · taken just now ✓</Text>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Placed where you took it. Tap back to retake.</Text>
        </View>
      </Card>

      <Field label="Event name" placeholder="e.g. Sunset Sessions" value={draft.title} onChangeText={(t) => updateDraft({ title: t })} maxLength={80} />

      <Label>Category</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, marginBottom: 14 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} icon={CAT_ICON[c]} selected={draft.category === c} onPress={() => updateDraft({ category: c })} />
        ))}
      </ScrollView>

      <Field label="Where" placeholder="e.g. Poblacion Rooftop" value={draft.placeName} onChangeText={(t) => updateDraft({ placeName: t })} maxLength={120} />
      <Field label="Address (optional)" placeholder="e.g. P. Burgos St., Poblacion, Makati" value={draft.address} onChangeText={(t) => updateDraft({ address: t })} maxLength={160} />

      <WhenPicker startsAt={draft.startsAt} lengthMin={draft.lengthMin} onChange={(v) => updateDraft(v)} />

      <Label>Entry</Label>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <Chip label="Free" selected={isFree} onPress={() => updateDraft({ priceLabel: 'Free entry' })} style={{ flex: 1 }} />
        <Chip label="Paid" selected={!isFree} onPress={() => updateDraft({ priceLabel: isFree ? '₱' : draft.priceLabel })} style={{ flex: 1 }} />
      </View>
      {!isFree ? <Field label="Price" placeholder="e.g. ₱300 or ₱150–350" value={draft.priceLabel} onChangeText={(t) => updateDraft({ priceLabel: t })} maxLength={40} /> : null}

      <Field label="Description" placeholder="What makes it worth the trip?" value={draft.description} onChangeText={(t) => updateDraft({ description: t })} multiline maxLength={500} />
    </Screen>
  );
}
