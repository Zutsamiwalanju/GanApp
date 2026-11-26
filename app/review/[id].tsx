import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { addReview } from '../../src/api';
import { BackButton, Body, Button, Field, H1, Screen, Spacer } from '../../src/components/ui';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';

export default function WriteReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPing, uid, profile } = useApp();
  const ping = getPing(id);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const post = async () => {
    setBusy(true);
    try {
      await addReview({ pingId: id, uid, authorName: profile.displayName, rating, title, body });
      Alert.alert('Your take is on the map.', 'Thanks for helping the next explorer.');
      router.back();
    } catch (e: any) {
      Alert.alert('Couldn’t post', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title="Post review" onPress={post} loading={busy} disabled={!title.trim() && !body.trim()} />}>
      <BackButton />
      <Spacer h={20} />
      <H1>Worth the pin?</H1>
      <Body style={{ marginTop: 6 }}>{ping ? `${ping.title} · ${ping.placeName}` : ''}</Body>
      <Spacer h={20} />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} accessibilityLabel={`${n} stars`} hitSlop={6}>
            <Text style={{ fontSize: 36, color: n <= rating ? '#F5A524' : C.line }}>★</Text>
          </Pressable>
        ))}
      </View>
      <Field label="Headline" placeholder="The sunset alone is worth it." value={title} onChangeText={setTitle} maxLength={80} />
      <Field label="Your review" placeholder="What should the next person know?" value={body} onChangeText={setBody} multiline maxLength={600} />
      <Body>Posted as {profile.displayName}. Reviews expire after 30 days unless people vote them helpful.</Body>
    </Screen>
  );
}
