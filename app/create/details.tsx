import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { BackButton, Body, Button, Card, Chip, Eyebrow, Field, H1, Label, Screen, Spacer, Stepper } from '../../src/components/ui';
import { useApp } from '../../src/store';
import { C, CAT, CATEGORIES } from '../../src/theme';
import { dayLabel, fmtTime } from '../../src/time';

export default function Details() {
  const { draft, updateDraft, profile } = useApp();
  const start = new Date(draft.startsAt);
  const end = new Date(start.getTime() + draft.lengthMin * 60000);
  const isFree = /free/i.test(draft.priceLabel);

  const shiftStart = (mins: number) => {
    const next = new Date(start.getTime() + mins * 60000);
    const min = Date.now() - 6 * 3600000; // allow events that already started today
    if (next.getTime() < min) return;
    updateDraft({ startsAt: next.toISOString() });
  };
  const shiftLength = (mins: number) => updateDraft({ lengthMin: Math.min(24 * 60, Math.max(30, draft.lengthMin + mins)) });

  const canNext = !!draft.photoUri && draft.title.trim().length > 0 && draft.placeName.trim().length > 0;

  return (
    <Screen
      footer={
        <Button
          title="Next: duration & vicinity"
          disabled={!canNext}
          onPress={() => router.push('/create/settings')}
        />
      }
    >
      <BackButton onPress={() => router.replace('/create/camera')} />
      <Spacer h={20} />
      <Eyebrow>{profile.role === 'promoter' ? 'NEW PROMOTED PING' : 'PUT SOMETHING GOOD ON THE MAP'}</Eyebrow>
      <H1>{profile.role === 'promoter' ? 'Put it on the map.' : 'Make your next pin.'}</H1>
      <Body style={{ marginTop: 6, marginBottom: 18 }}>Live photo captured. Now add the details.</Body>

      <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        {draft.photoUri ? <Image source={{ uri: draft.photoUri }} style={{ width: 64, height: 64, borderRadius: 12 }} /> : null}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontWeight: '700', color: C.dark }}>Live photo · taken just now ✓</Text>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
            {draft.locationVerified ? 'Location checked at the spot.' : 'Placed in the Makati sample city.'} Tap back to retake.
          </Text>
        </View>
      </Card>

      <Field label="Event name" placeholder="e.g. Sunset Sessions" value={draft.title} onChangeText={(t) => updateDraft({ title: t })} maxLength={80} />

      <Label>Category</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, marginBottom: 14 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={`${CAT[c].emoji} ${c}`} selected={draft.category === c} onPress={() => updateDraft({ category: c })} />
        ))}
      </ScrollView>

      <Field label="Where" placeholder="e.g. Poblacion Rooftop" value={draft.placeName} onChangeText={(t) => updateDraft({ placeName: t })} maxLength={120} />
      <Field label="Address (optional)" placeholder="e.g. P. Burgos St., Poblacion, Makati" value={draft.address} onChangeText={(t) => updateDraft({ address: t })} maxLength={160} />

      <Stepper label={`Starts · ${dayLabel(start)}`} value={fmtTime(start)} onMinus={() => shiftStart(-30)} onPlus={() => shiftStart(30)} />
      <Stepper
        label="Ends"
        value={`${fmtTime(end)}${dayLabel(end) !== dayLabel(start) ? ` (${dayLabel(end)})` : ''}`}
        onMinus={() => shiftLength(-30)}
        onPlus={() => shiftLength(30)}
      />

      <Label>Entry</Label>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <Chip label="Free" selected={isFree} onPress={() => updateDraft({ priceLabel: 'Free entry' })} style={{ flex: 1 }} />
        <Chip label="Paid" selected={!isFree} onPress={() => updateDraft({ priceLabel: isFree ? '₱' : draft.priceLabel })} style={{ flex: 1 }} />
      </View>
      {!isFree ? (
        <Field label="Price" placeholder="e.g. ₱300 or ₱150–350" value={draft.priceLabel} onChangeText={(t) => updateDraft({ priceLabel: t })} maxLength={40} />
      ) : null}

      <Field
        label="Description"
        placeholder="What makes it worth the trip?"
        value={draft.description}
        onChangeText={(t) => updateDraft({ description: t })}
        multiline
        maxLength={500}
      />
    </Screen>
  );
}
