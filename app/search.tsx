import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { CAT_ICON } from '../src/assets';
import { BackButton, Body, Chip, Empty, Field, H1, Label, PingRow, Screen, Spacer } from '../src/components/ui';
import { useApp } from '../src/store';

const POPULAR = ['Music', 'Food', 'Art', 'Sports', 'Free', 'Coffee'];

export default function Search() {
  const { nearby, savedIds, toggleSave, now } = useApp();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return nearby;
    return nearby.filter((p) => [p.title, p.category, p.placeName, p.address, p.description, p.priceLabel].some((x) => (x ?? '').toLowerCase().includes(t)));
  }, [q, nearby]);

  return (
    <Screen>
      <BackButton />
      <Spacer h={20} />
      <H1>Find your next pin</H1>
      <Spacer />
      <Field label="Search" placeholder="Events, places, little adventures" value={q} onChangeText={setQ} autoFocus returnKeyType="search" />
      <Label>Popular searches</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {POPULAR.map((p) => (
          <Chip key={p} label={p} icon={CAT_ICON[p]} selected={q.toLowerCase() === p.toLowerCase()} onPress={() => setQ(q.toLowerCase() === p.toLowerCase() ? '' : p)} />
        ))}
      </View>
      <Body style={{ marginBottom: 12 }}>{q ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Around you right now'}</Body>
      {results.length ? (
        results.map((p) => <PingRow key={p.id} ping={p} now={now} saved={savedIds.has(p.id)} onSave={() => toggleSave(p.id)} />)
      ) : (
        <Empty title="No matches nearby" body="Try another word, or switch area from the Explore tab." />
      )}
    </Screen>
  );
}
