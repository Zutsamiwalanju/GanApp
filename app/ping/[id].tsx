import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../../src/api';
import { SafetyMenu } from '../../src/components/Safety';
import { Text } from '../../src/components/Text';
import { Badge, Body, Button, Card, CategoryIcon, Empty, Footer, H2, Photo, s, Spacer, StatusBadge } from '../../src/components/ui';
import { directionsUrl, fmtDistance, walkMinutes } from '../../src/geo';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';
import { ageDays, fmtAgo, fmtHours, fmtLeft, fmtWhen } from '../../src/time';
import type { Review } from '../../src/types';

type Tab = 'about' | 'reviews' | 'going';

export default function PingDetail() {
  const router = useRouter();
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const { getPing, now, savedIds, goingIds, toggleSave, toggleGoing, uid, blockedIds, hiddenIds } = useApp();
  const ping = getPing(id);
  const [tab, setTab] = useState<Tab>(initialTab ?? 'about');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [menu, setMenu] = useState<{ target: 'ping' | 'review'; id: string; authorId: string | null; authorName: string } | null>(null);

  useEffect(() => {
    if (id) api.bumpStat(id, 'views');
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!ping) return;
    try {
      const [r, v] = await Promise.all([api.fetchPlaceReviews(ping.placeKey, ping.id), api.fetchMyVotes(uid)]);
      setReviews(r);
      setMyVotes(new Set(v));
    } catch {
      /* keep what we have */
    } finally {
      setLoadingReviews(false);
    }
  }, [ping?.placeKey, ping?.id, uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews]),
  );

  if (!ping) {
    return (
      <SafeAreaView style={[s.safe, s.pad]}>
        <Empty title="This ping is gone" body="It may have ended, been removed, or hidden after reports." action={<Button title="Back to Explore" onPress={() => router.replace('/(tabs)')} />} />
      </SafeAreaView>
    );
  }

  const visibleReviews = reviews.filter((r) => !hiddenIds.has(r.id) && !(r.authorId && blockedIds.has(r.authorId)));
  const avg = visibleReviews.length ? visibleReviews.reduce((a, r) => a + r.rating, 0) / visibleReviews.length : 0;
  const isGoing = goingIds.has(ping.id);
  const isSaved = savedIds.has(ping.id);
  const isMine = ping.creatorId === uid;
  const myReview = reviews.find((r) => r.authorId === uid);

  const vote = async (r: Review) => {
    if (r.authorId === uid) return Alert.alert('That’s your review', 'Other people decide if it’s helpful.');
    const on = !myVotes.has(r.id);
    const apply = (value: boolean) => {
      setMyVotes((v) => {
        const n = new Set(v);
        value ? n.add(r.id) : n.delete(r.id);
        return n;
      });
      setReviews((rs) => rs.map((x) => (x.id === r.id ? { ...x, upvotes: Math.max(0, x.upvotes + (value ? 1 : -1)) } : x)));
    };
    apply(on);
    try {
      await api.setVote(uid, r.id, on);
    } catch (e: any) {
      apply(!on);
      Alert.alert('Vote didn’t go through', e.message);
    }
  };

  const share = () =>
    Share.share({ message: `${ping.title} — ${fmtWhen(ping.startsAt, ping.endsAt, now)} at ${ping.placeName || ping.address}. Found on GanApp.` });

  const directions = () => {
    api.bumpStat(ping.id, 'directions');
    Linking.openURL(directionsUrl(ping));
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View>
          <Photo ping={ping} style={{ width: '100%', height: 290 }} rounded={0} />
          <View style={{ position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={s.round} accessibilityLabel="Back">
              <Ionicons name="arrow-back" size={20} color={C.dark} />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => toggleSave(ping.id)} style={s.round} accessibilityLabel={isSaved ? 'Unsave' : 'Save'}>
                <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={C.primary} />
              </Pressable>
              {!isMine ? (
                <Pressable onPress={() => setMenu({ target: 'ping', id: ping.id, authorId: ping.creatorId, authorName: ping.creatorName })} style={s.round} accessibilityLabel="More options">
                  <Ionicons name="ellipsis-horizontal" size={20} color={C.dark} />
                </Pressable>
              ) : null}
            </View>
          </View>
          <View style={{ position: 'absolute', bottom: 14, left: 16, right: 16, flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <StatusBadge ping={ping} now={now} />
            {ping.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
            {ping.isPrivate ? <Badge text="PRACTICE · ONLY YOU" tone="grey" /> : null}
          </View>
        </View>

        <View style={{ padding: 24 }}>
          <View style={[s.row, { gap: 8 }]}>
            <CategoryIcon category={ping.category} size={22} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: C.primary, letterSpacing: 0.6 }}>
              {ping.category.toUpperCase()}  /  {ping.kind === 'place' ? 'PLACE' : 'EVENT'}
            </Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '700', color: C.dark, marginTop: 6, letterSpacing: -0.5 }}>{ping.title}</Text>
          <Body style={{ marginTop: 4 }}>
            {fmtDistance(ping.distance)} away · {ping.placeName || ping.address}
          </Body>
          <Text style={{ color: C.dark, fontWeight: '600', marginTop: 8 }}>
            {ping.kind === 'place' ? fmtHours(ping) : fmtWhen(ping.startsAt, ping.endsAt, now)}  ·  {ping.priceLabel}
          </Text>
          <View style={[s.row, { marginTop: 8, gap: 10 }]}>
            <Text style={{ color: C.dark, fontWeight: '600' }}>{visibleReviews.length ? `★ ${avg.toFixed(1)}  (${visibleReviews.length} review${visibleReviews.length > 1 ? 's' : ''})` : 'No reviews yet'}</Text>
            {ping.going >= 20 ? <Text style={{ color: C.primary, fontWeight: '600' }}>Trending ↗</Text> : null}
          </View>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>
            Pinned by {ping.creatorName} · {ping.live ? `ping disappears in ${fmtLeft(ping.pingEndsAt, now)}` : 'ping ended'}
          </Text>

          {isMine ? (
            <View style={[s.row, { gap: 10, marginTop: 14 }]}>
              <Button title="Edit" icon="create-outline" variant="outline" style={{ flex: 1 }} onPress={() => router.push(`/ping/edit/${ping.id}`)} />
              <Button title="Insights" icon="stats-chart" variant="outline" style={{ flex: 1 }} onPress={() => router.push(`/promoter/live/${ping.id}`)} />
            </View>
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
              <Body style={{ marginBottom: 12 }}>
                Reviews for {ping.placeName || 'this place'}. They disappear after 30 days unless {api.KEEP_VOTES}+ people vote them helpful.
              </Body>
              {loadingReviews ? <Body>Loading…</Body> : null}
              {!loadingReviews && visibleReviews.length === 0 ? <Empty title="No reviews yet" body="Been here? Be the first." /> : null}
              {visibleReviews.map((r) => (
                <Card key={r.id} style={{ marginBottom: 12 }}>
                  <View style={[s.row, { justifyContent: 'space-between' }]}>
                    <Text style={{ color: '#F5A524', fontSize: 15 }}>
                      {'★'.repeat(r.rating)}
                      <Text style={{ color: C.line }}>{'★'.repeat(5 - r.rating)}</Text>
                    </Text>
                    {r.authorId !== uid ? (
                      <Pressable onPress={() => setMenu({ target: 'review', id: r.id, authorId: r.authorId, authorName: r.authorName })} hitSlop={10} accessibilityLabel="Review options">
                        <Ionicons name="ellipsis-horizontal" size={18} color={C.muted} />
                      </Pressable>
                    ) : null}
                  </View>
                  {r.title ? <Text style={{ fontWeight: '700', color: C.dark, fontSize: 16, marginTop: 4 }}>“{r.title}”</Text> : null}
                  {r.body ? <Body style={{ marginTop: 4 }}>{r.body}</Body> : null}
                  <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
                    {r.authorName}
                    {r.authorId === uid ? ' (you)' : ''} · {fmtAgo(r.createdAt, now)}
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
              {isMine ? (
                <Body style={{ textAlign: 'center' }}>You can’t review your own ping.</Body>
              ) : myReview ? (
                <Body style={{ textAlign: 'center' }}>You’ve reviewed this place. Thanks!</Body>
              ) : (
                <Button title="Write a review" variant="outline" icon="create-outline" onPress={() => router.push(`/review/${ping.id}`)} />
              )}
            </View>
          )}

          {tab === 'going' && (
            <View>
              <H2>Good plans. Better company.</H2>
              <Text style={{ fontSize: 32, fontWeight: '700', color: C.dark, marginTop: 10 }}>{ping.going}</Text>
              <Body>{ping.going === 1 ? 'person is going' : 'people are going'}. New here? You’re in good company.</Body>
              <Spacer />
              <Button title="Join the conversation" icon="chatbubbles-outline" onPress={() => router.push(`/chat/${ping.id}`)} />
            </View>
          )}
        </View>
      </ScrollView>

      <Footer style={[s.row, { gap: 10 }]}>
        <Button
          title={isGoing ? '✓  You’re going' : ping.kind === 'place' ? 'I’m heading there' : 'I’m going'}
          variant={isGoing ? 'outline' : 'primary'}
          style={{ flex: 1 }}
          disabled={!ping.live}
          onPress={() => toggleGoing(ping.id)}
        />
        <Button title="Share" icon="share-outline" variant="outline" style={{ width: 120 }} onPress={share} />
      </Footer>

      {menu ? (
        <SafetyMenu
          visible={!!menu}
          onClose={() => setMenu(null)}
          target={menu.target}
          id={menu.id}
          authorId={menu.authorId}
          authorName={menu.authorName}
          onDone={() => {
            if (menu.target === 'ping') router.replace('/(tabs)');
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
