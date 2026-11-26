import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { BackButton, Badge, Body, Button, Card, ChipGroup, Eyebrow, H1, Label, Photo, Screen, Spacer, Toggle } from '../../src/components/ui';
import { radiusLabel } from '../../src/geo';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';
import { fmtTime, fmtUntil, hoursLabel } from '../../src/time';

const EXPLORER_HOURS = [1, 3, 6, 24];
const EXPLORER_RADII = [500, 1000, 5000];
const PROMOTER_HOURS = [6, 12, 24, 168];
const PROMOTER_RADII = [1000, 3000, 5000];

export default function Settings() {
  const { draft, updateDraft, publish, profile, now } = useApp();
  const [busy, setBusy] = useState(false);
  const promoter = profile.role === 'promoter';
  const hours = promoter ? PROMOTER_HOURS : EXPLORER_HOURS;
  const radii = promoter ? PROMOTER_RADII : EXPLORER_RADII;

  // If the role changed since the draft was made, snap to a valid option.
  const durationH = hours.includes(draft.durationH) ? draft.durationH : hours[hours.length - 2];
  const radiusM = radii.includes(draft.radiusM) ? draft.radiusM : radii[1];
  const endsAt = new Date(now.getTime() + durationH * 3600000);

  const go = async () => {
    setBusy(true);
    try {
      const ping = await publish({ durationH, radiusM });
      router.replace(promoter ? `/promoter/live/${ping.id}` : `/create/published?id=${ping.id}`);
    } catch (e: any) {
      Alert.alert('Couldn’t publish', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title={promoter ? 'Publish promoted ping' : 'Publish pin'} onPress={go} loading={busy} />}>
      <BackButton />
      <Spacer h={20} />
      <Eyebrow>ALMOST THERE</Eyebrow>
      <H1>Set your ping.</H1>
      <Body style={{ marginTop: 6, marginBottom: 20 }}>Pings disappear on their own, so the map only shows what’s happening now.</Body>

      <Label>Ping lasts</Label>
      <ChipGroup options={hours} value={durationH} onChange={(h) => updateDraft({ durationH: h })} label={hoursLabel} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 8, marginBottom: 20 }}>
        Disappears automatically {fmtUntil(endsAt, now).replace('Until', 'at')}
        {durationH === 168 ? ' (runs for a week)' : ''}.
      </Text>

      <Label>{promoter ? 'Reach' : 'Who can see it'}</Label>
      <ChipGroup options={radii} value={radiusM} onChange={(r) => updateDraft({ radiusM: r })} label={radiusLabel} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 8, marginBottom: 20 }}>
        Only people within {radiusLabel(radiusM)} see it on their map.
      </Text>

      {promoter ? (
        <>
          <Toggle label="Show as “Promoted” to explorers" value={draft.isPromoted} onChange={(v) => updateDraft({ isPromoted: v })} />
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 8, marginBottom: 20 }}>Labeled clearly so reviews stay honest.</Text>
        </>
      ) : null}

      <Label>Preview</Label>
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Photo ping={{ photoUrl: draft.photoUri, category: draft.category }} style={{ width: 72, height: 72 }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: C.dark }} numberOfLines={1}>
            {draft.title || 'Your event'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 13 }} numberOfLines={1}>
            {draft.placeName} · {draft.category} · {fmtTime(draft.startsAt)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge text={`⏱ Disappears in ${hoursLabel(durationH) === 'Weekly' ? '7d' : `${durationH}h`}`} />
            <Badge text={`Within ${radiusLabel(radiusM)}`} tone="grey" />
            {promoter && draft.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
          </View>
        </View>
      </Card>
      <Spacer />
      <Body>✓  Live photo taken at the spot just now. Pings from the gallery aren’t allowed, so explorers know it’s real.</Body>
    </Screen>
  );
}
