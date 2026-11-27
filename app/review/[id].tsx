import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { addReview } from '../../src/api';
import { Text } from '../../src/components/Text';
import { BackButton, Body, Button, Field, H1, Photo, Screen, Spacer } from '../../src/components/ui';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';

const WORDS = ['', 'Not worth it', 'Meh', 'Pretty good', 'Really good', 'Worth the pin!'];

export default function WriteReview() {
  const router = useRouter();
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
      {ping ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Photo ping={ping} style={{ width: 52, height: 52 }} rounded={12} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontWeight: '700', color: C.dark }} numberOfLines={1}>
              {ping.title}
            </Text>
            <Text style={{ color: C.muted, fontSize: 13 }} numberOfLines={1}>
              {ping.placeName}
            </Text>
          </View>
        </View>
      ) : null}
      <H1>Worth the pin?</H1>
      <Spacer h={16} />
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} accessibilityLabel={`${n} stars`} hitSlop={6}>
            <Text style={{ fontSize: 38, color: n <= rating ? '#F5A524' : C.line }}>★</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: C.primary, fontWeight: '600', marginBottom: 18 }}>{WORDS[rating]}</Text>
      <Field label="Headline" placeholder="The sunset alone is worth it." value={title} onChangeText={setTitle} maxLength={80} />
      <Field label="Your review" placeholder="What should the next person know?" value={body} onChangeText={setBody} multiline maxLength={600} />
      <Body>
        Posted as {profile.displayName}. One review per place. Reviews disappear after 30 days unless people vote them helpful.
      </Body>
    </Screen>
  );
}
