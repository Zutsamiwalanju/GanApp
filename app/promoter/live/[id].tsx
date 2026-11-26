import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import * as api from '../../../src/api';
import { BackButton, Badge, Body, Button, Card, Empty, Eyebrow, H1, Label, Photo, Screen, Spacer, Stat } from '../../../src/components/ui';
import { fmtDistance, radiusLabel } from '../../../src/geo';
import { useApp } from '../../../src/store';
import { C } from '../../../src/theme';
import { fmtLeft, fmtUntil } from '../../../src/time';

const EXTEND_HOURS = 6;
const MAX_DAYS = 8;

export default function PingLive() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPing, extend, removePing, now, uid, profile } = useApp();
  const ping = getPing(id);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);

  useEffect(() => {
    api
      .fetchReviews(id)
      .then((r) => setRating(r.length ? { avg: r.reduce((a, x) => a + x.rating, 0) / r.length, count: r.length } : { avg: 0, count: 0 }))
      .catch(() => setRating(null));
  }, [id]);

  if (!ping) {
    return (
      <Screen>
        <Empty title="Ping not found" action={<Button title="Back" onPress={() => router.back()} />} />
      </Screen>
    );
  }

  const mine = ping.creatorId === uid;
  const maxEnd = new Date(ping.createdAt).getTime() + MAX_DAYS * 86400000;
  const canExtend = mine && new Date(ping.pingEndsAt).getTime() + 60000 < maxEnd;
  const back = () => router.replace(profile.role === 'promoter' ? '/promoter' : '/(tabs)');

  const onExtend = async () => {
    setBusy(true);
    try {
      await extend(ping.id, EXTEND_HOURS); // the card's "Until" time and "Ends in" update right away
    } catch (e: any) {
      Alert.alert('Couldn’t extend', e.message);
    } finally {
      setBusy(false);
    }
  };

  const onEnd = () =>
    Alert.alert('Remove this ping?', 'It disappears from everyone’s map right away.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removePing(ping.id);
          back();
        },
      },
    ]);

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          {mine ? (
            <Button
              title={`Extend ping +${EXTEND_HOURS} hrs`}
              variant="outline"
              loading={busy}
              disabled={!canExtend}
              onPress={onExtend}
            />
          ) : null}
          <Button title={profile.role === 'promoter' ? 'Back to dashboard' : 'Back to Explore'} onPress={back} />
        </View>
      }
    >
      <BackButton onPress={back} />
      <Spacer h={20} />
      <Eyebrow>{ping.live ? 'YOUR PING IS LIVE' : 'THIS PING HAS ENDED'}</Eyebrow>
      <H1>{ping.live ? 'People nearby can\nsee it now.' : 'Thanks for putting\nit on the map.'}</H1>
      <Spacer />

      <Label>How explorers see it</Label>
      <Card onPress={() => router.push(`/ping/${ping.id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Photo ping={ping} style={{ width: 84, height: 84 }} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.dark }} numberOfLines={1}>
            {ping.title}
          </Text>
          {/* Not hardcoded: recomputed from pingEndsAt, in 12-hour time. */}
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
            {fmtDistance(ping.distance)} · {ping.category} · {ping.live ? fmtUntil(ping.pingEndsAt, now) : 'Ended'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {ping.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
            <Badge text={ping.live ? `⏱ Ends in ${fmtLeft(ping.pingEndsAt, now)}` : 'Expired'} tone={ping.live ? 'mint' : 'grey'} />
          </View>
        </View>
      </Card>

      <Spacer h={22} />
      <Label>Since you posted</Label>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <Stat value={ping.views.toLocaleString()} label={`Reached within ${radiusLabel(ping.radiusM)}`} />
        <Stat value={ping.saved} label="Saved it" />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat value={ping.directions} label="Got directions" />
        <Stat value={ping.going} label="Tapped “I’m going”" />
      </View>
      <Spacer />
      <View style={{ backgroundColor: C.mint, borderRadius: 16, padding: 14 }}>
        <Text style={{ color: C.primary, lineHeight: 20 }}>
          {rating && rating.count
            ? `★ ${rating.avg.toFixed(1)} from ${rating.count} review${rating.count > 1 ? 's' : ''}. `
            : 'No reviews yet. '}
          Reviews people upvote stay up after your ping ends.
        </Text>
      </View>
      {mine && !canExtend && ping.live ? (
        <Body style={{ marginTop: 10 }}>Pings can run up to {MAX_DAYS} days in total, so this one can’t be extended further.</Body>
      ) : null}
      {mine ? <Button title="Remove ping" variant="ghost" onPress={onEnd} style={{ marginTop: 10 }} /> : null}
    </Screen>
  );
}
