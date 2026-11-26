import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../../src/api';
import { Badge, Body, Button, Card, Empty, H2, Photo, s, Spacer } from '../../src/components/ui';
import { directionsUrl, fmtDistance, walkMinutes } from '../../src/geo';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';
import { ageDays, fmtAgo, fmtLeft, fmtWhen } from '../../src/time';
import type { Review } from '../../src/types';

type Tab = 'about' | 'reviews' | 'going';

export default function PingDetail() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const { getPing, now, savedIds, goingIds, toggleSave, toggleGoing, uid } = useApp();
  const ping = getPing(id);
  const [tab, setTab] = useState<Tab>(initialTab ?? 'about');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (id) api.bumpStat(id, 'views');
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!id) return;
    try {
      const [r, v] = await Promise.all([api.fetchReviews(id), api.fetchMyVotes(uid)]);
      setReviews(r);
      setMyVotes(new Set(v));
    } finally {
      setLoadingReviews(false);
    }
  }, [id, uid]);

  // Reload reviews whenever we come back (e.g. after writing one).
  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews]),
  );

  if (!ping) {
    return (
      <SafeAreaView style={[s.safe, s.pad]}>
        <Empty title="This ping is gone" body="It may have expired or been removed." action={<Button title="Back to Explore" onPress={() => router.replace('/(tabs)')} />} />
      </SafeAreaView>
    );
  }

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const isGoing = goingIds.has(ping.id);
  const isSaved = savedIds.has(ping.id);
  const isMine = ping.creatorId === uid;

  const vote = async (r: Review) => {
    const on = !myVotes.has(r.id);
    setMyVotes((v) => {
      const n = new Set(v);
      on ? n.add(r.id) : n.delete(r.id);
      return n;
    });
    setReviews((rs) => rs.map((x) => (x.id === r.id ? { ...x, upvotes: Math.max(0, x.upvotes + (on ? 1 : -1)) } : x)));
    try {
      await api.setVote(uid, r.id, on);
    } catch (e: any) {
      Alert.alert('Vote failed', e.message);
      loadReviews();
    }
  };

  const share = () =>
    Share.share({
      message: `${ping.title} — ${fmtWhen(ping.startsAt, ping.endsAt, now)} at ${ping.placeName || ping.address}. Found on GanApp.`,
    });

  const directions = () => {
    api.bumpStat(ping.id, 'directions');
    Linking.openURL(directionsUrl(ping));
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View>
          <Photo ping={ping} style={{ width: '100%', height: 280 }} rounded={0} />
          <View style={{ position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={s.round} accessibilityLabel="Back">
              <Ionicons name="arrow-back" size={20} color={C.dark} />
            </Pressable>
            <Pressable onPress={() => toggleSave(ping.id)} style={s.round} accessibilityLabel={isSaved ? 'Unsave' : 'Save'}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={C.primary} />
            </Pressable>
          </View>
          <View style={{ position: 'absolute', bottom: 14, left: 16, flexDirection: 'row', gap: 6 }}>
            {ping.live ? <Badge text="● LIVE" tone="live" /> : <Badge text="Expired" tone="grey" />}
            {ping.live ? <Badge text={`⏱ PING ENDS IN ${fmtLeft(ping.pingEndsAt, now).toUpperCase()}`} /> : null}
            {ping.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
          </View>
        </View>

        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.primary, letterSpacing: 0.6 }}>
            {ping.category.toUpperCase()}  /  {ping.kind === 'place' ? 'PLACE' : 'EVENT'}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: C.dark, marginTop: 4 }}>{ping.title}</Text>
          <Body style={{ marginTop: 4 }}>
            {fmtDistance(ping.distance)} away · {ping.placeName || ping.address}
          </Body>
          <Text style={{ color: C.dark, fontWeight: '600', marginTop: 8 }}>
            {fmtWhen(ping.startsAt, ping.endsAt, now)}  ·  {ping.priceLabel}
          </Text>
          <View style={[s.row, { marginTop: 8, gap: 10 }]}>
            <Text style={{ color: C.dark, fontWeight: '600' }}>{reviews.length ? `★ ${avg.toFixed(1)}  (${reviews.length} reviews)` : 'No reviews yet'}</Text>
            {ping.going >= 20 ? <Text style={{ color: C.primary, fontWeight: '600' }}>Trending ↗</Text> : null}
          </View>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Pinned by {ping.creatorName} · live photo</Text>

          {isMine ? (
            <Button title="Manage your ping" icon="stats-chart" variant="outline" style={{ marginTop: 14 }} onPress={() => router.push(`/promoter/live/${ping.id}`)} />
          ) : null}

          <View style={[s.row, { marginTop: 18, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 4 }]}>
            {(['about', 'reviews', 'going'] as Tab[]).map((t) => (
              <Pressable key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: tab === t ? C.mint : 'transparent', alignItems: 'center' }}>
                <Text style={{ fontWeight: '600', color: tab === t ? C.primary : C.muted }}>{t === 'about' ? 'About' : t === 'reviews' ? 'Reviews' : 'Who’s going'}</Text>
              </Pressable>
            ))}
          </View>
          <Spacer h={18} />

          {tab === 'about' && (
            <View>
              {isGoing ? (
                <View style={{ backgroundColor: C.mint, padding: 12, borderRadius: 12, marginBottom: 14 }}>
                  <Text style={{ color: C.primary, fontWeight: '600' }}>You’re on the list. See you there!</Text>
                </View>
              ) : null}
              <Body>{ping.description || 'No description yet.'}</Body>
              <Spacer />
              <Card onPress={directions} style={s.row}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="navigate" size={20} color={C.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '700', color: C.dark }}>{ping.placeName || 'Get directions'}</Text>
                  <Text style={{ color: C.muted, fontSize: 13 }}>
                    {ping.address ? `${ping.address} · ` : ''}
                    {walkMinutes(ping.distance)} min walk
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </Card>
            </View>
          )}

          {tab === 'reviews' && (
            <View>
              <H2>Loved by the locals?</H2>
              <Body style={{ marginBottom: 12 }}>Reviews disappear after 30 days unless {api.KEEP_VOTES}+ people vote them helpful.</Body>
              {loadingReviews ? <Body>Loading…</Body> : null}
              {!loadingReviews && reviews.length === 0 ? <Empty icon="star-outline" title="No reviews yet" body="Been here? Be the first." /> : null}
              {reviews.map((r) => (
                <Card key={r.id} style={{ marginBottom: 12 }}>
                  <Text style={{ color: C.goldText }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                  {r.title ? <Text style={{ fontWeight: '700', color: C.dark, fontSize: 16, marginTop: 4 }}>“{r.title}”</Text> : null}
                  {r.body ? <Body style={{ marginTop: 4 }}>{r.body}</Body> : null}
                  <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
                    {r.authorName} · {fmtAgo(r.createdAt, now)}
                  </Text>
                  <View style={[s.row, { marginTop: 10, gap: 8 }]}>
                    <Pressable
                      onPress={() => vote(r)}
                      accessibilityLabel="Helpful"
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: myVotes.has(r.id) ? C.primary : C.mint }}
                    >
                      <Text style={{ color: myVotes.has(r.id) ? C.white : C.primary, fontWeight: '700', fontSize: 12 }}>▲ Helpful · {r.upvotes}</Text>
                    </Pressable>
                    {ageDays(r.createdAt) > 30 ? <Badge text="Kept up by votes" tone="gold" /> : null}
                  </View>
                </Card>
              ))}
              <Button title="Write a review" variant="outline" icon="create-outline" onPress={() => router.push(`/review/${ping.id}`)} />
            </View>
          )}

          {tab === 'going' && (
            <View>
              <H2>Good plans. Better company.</H2>
              <Text style={{ fontSize: 32, fontWeight: '700', color: C.dark, marginTop: 10 }}>{ping.going}</Text>
              <Body>{ping.going === 1 ? 'person is going' : 'people are going'}. New here? You’re in good company.</Body>
              <Spacer />
              <Button title="Join conversation" icon="chatbubbles-outline" onPress={() => router.push(`/chat/${ping.id}`)} />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[s.row, { gap: 10, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 26, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg }]}>
        <Button
          title={isGoing ? '✓  You’re going' : 'I’m going'}
          variant={isGoing ? 'outline' : 'primary'}
          style={{ flex: 1 }}
          disabled={!ping.live}
          onPress={() => toggleGoing(ping.id)}
        />
        <Button title="Share" icon="share-outline" variant="outline" style={{ width: 120 }} onPress={share} />
      </View>
    </SafeAreaView>
  );
}
