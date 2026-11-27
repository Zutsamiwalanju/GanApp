import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { CAT_ICON } from '../../../src/assets';
import { WhenPicker } from '../../../src/components/WhenPicker';
import { BackButton, Button, Chip, Empty, Field, H1, Label, Screen, Spacer } from '../../../src/components/ui';
import { useApp } from '../../../src/store';
import { CATEGORIES } from '../../../src/theme';

export default function EditPing() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPing, editPing, uid } = useApp();
  const ping = getPing(id);

  const [title, setTitle] = useState(ping?.title ?? '');
  const [category, setCategory] = useState(ping?.category ?? 'Music');
  const [placeName, setPlaceName] = useState(ping?.placeName ?? '');
  const [address, setAddress] = useState(ping?.address ?? '');
  const [description, setDescription] = useState(ping?.description ?? '');
  const [priceLabel, setPriceLabel] = useState(ping?.priceLabel ?? 'Free entry');
  const initialStart = ping?.startsAt ?? new Date().toISOString();
  const initialLen = ping?.startsAt && ping?.endsAt ? Math.round((new Date(ping.endsAt).getTime() - new Date(ping.startsAt).getTime()) / 60000) : 180;
  const [when, setWhen] = useState({ startsAt: initialStart, lengthMin: initialLen });
  const [busy, setBusy] = useState(false);

  if (!ping || ping.creatorId !== uid) {
    return (
      <Screen>
        <Empty title="You can only edit your own pings" action={<Button title="Back" onPress={() => router.back()} />} />
      </Screen>
    );
  }

  const save = async () => {
    setBusy(true);
    try {
      const endsAt = new Date(new Date(when.startsAt).getTime() + when.lengthMin * 60000).toISOString();
      await editPing(ping.id, { title, category, placeName, address, description, priceLabel, startsAt: when.startsAt, endsAt });
      router.back();
    } catch (e: any) {
      Alert.alert('Couldn’t save', e?.message ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title="Save changes" onPress={save} loading={busy} disabled={!title.trim() || !placeName.trim()} />}>
      <BackButton />
      <Spacer h={20} />
      <H1>Edit your ping</H1>
      <Spacer />
      <Field label="Event name" value={title} onChangeText={setTitle} maxLength={80} />
      <Label>Category</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, marginBottom: 14 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} icon={CAT_ICON[c]} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>
      <Field label="Where" value={placeName} onChangeText={setPlaceName} maxLength={120} />
      <Field label="Address (optional)" value={address} onChangeText={setAddress} maxLength={160} />
      {ping.kind === 'event' ? <WhenPicker startsAt={when.startsAt} lengthMin={when.lengthMin} onChange={setWhen} /> : null}
      <Field label="Entry / price" value={priceLabel} onChangeText={setPriceLabel} maxLength={40} />
      <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={500} />
      <View />
    </Screen>
  );
}
