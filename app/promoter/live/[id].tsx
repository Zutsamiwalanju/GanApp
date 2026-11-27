import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import * as api from '../../../src/api';
import { Text } from '../../../src/components/Text';
import { BackButton, Badge, Body, Button, Card, Empty, Eyebrow, H1, Label, Photo, Screen, Spacer, Stat, StatusBadge } from '../../../src/components/ui';
import { fmtDistance, radiusLabel } from '../../../src/geo';
import { useApp } from '../../../src/store';
import { C } from '../../../src/theme';
import { fmtLeft, fmtUntil, whenShort } from '../../../src/time';

const EXTEND_HOURS = 6;
const MAX_DAYS = 8;

export default function PingLive() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPing, extend, removePing, now, uid, profile } = useApp();
  const ping = getPing(id);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);

  useEffect(() => {
    if (!ping) return;
    api
      .fetchPlaceReviews(ping.placeKey, ping.id)
      .then((r) => setRating({ avg: r.length ? r.reduce((a, x) => a + x.rating, 0) / r.length : 0, count: r.length }))
      .catch(() => setRating(null));
  }, [ping?.id, ping?.placeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const back = () => router.replace(profile.role === 'promoter' ? '/promoter' : '/(tabs)');

  if (!ping) {
    return (
      <Screen>
        <Empty title="Ping not found" action={<Button title="Back" onPress={back} />} />
      </Screen>
    );
  }

  const mine = ping.creatorId === uid;
  const maxEnd = new Date(ping.createdAt).getTime() + MAX_DAYS * 86400000;
  const canExtend = mine && new Date(ping.pingEndsAt).getTime() + 60000 < maxEnd;

  const onExtend = async () => {
    setBusy(true);
    try {
      await extend(ping.id, EXTEND_HOURS); // "Ping until…" and "Ends in…" update right away
    } catch (e: any) {
      Alert.alert('Couldn’t extend', e.message);
    } finally {
      setBusy(false);
    }
  };

  const onRemove = () =>
    Alert.alert('Remove this ping?', 'It disappears from everyone’s map right away, and its photo is deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removePing(ping.id);
            back();
          } catch (e: any) {
            Alert.alert('Couldn’t remove', e.message);
          }
        },
      },
    ]);

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          {mine ? <Button title={`Extend ping +${EXTEND_HOURS} hrs`} variant="outline" icon="time-outline" loading={busy} disabled={!canExtend} onPress={onExtend} /> : null}
          <Button title={profile.role === 'promoter' ? 'Back to dashboard' : 'Back to Explore'} onPress={back} />
        </View>
      }
    >
      <BackButton onPress={back} />
      <Spacer h={20} />
      <Eyebrow>{ping.isPrivate ? 'PRACTICE PING · ONLY YOU CAN SEE IT' : ping.live ? 'YOUR PING IS LIVE' : 'THIS PING HAS ENDED'}</Eyebrow>
      <H1>{ping.live ? 'People nearby can\nsee it now.' : 'Thanks for putting\nit on the map.'}</H1>
      <Spacer />

      <Label>How explorers see it</Label>
      <Card onPress={() => router.push(`/ping/${ping.id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Photo ping={ping} style={{ width: 84, height: 84 }} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.dark }} numberOfLines={1}>
            {ping.title}
          </Text>
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
            {fmtDistance(ping.distance)} · {ping.category} · {whenShort(ping, now)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <StatusBadge ping={ping} now={now} />
            {ping.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
          </View>
        </View>
      </Card>

      {/* Not hardcoded: recomputed from the ping's end time, in 12-hour format. */}
      <View style={{ backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.muted, fontSize: 12 }}>Ping visible</Text>
          <Text style={{ color: C.dark, fontWeight: '700', fontSize: 16, marginTop: 2 }}>{ping.live ? fmtUntil(ping.pingEndsAt, now) : 'Ended'}</Text>
        </View>
        <Badge text={ping.live ? `⏱ Ends in ${fmtLeft(ping.pingEndsAt, now)}` : 'Expired'} tone={ping.live ? 'mint' : 'grey'} />
      </View>

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
      <Body style={{ marginTop: 8, fontSize: 12 }}>Each person counts once. Your own views don’t count.</Body>
      <Spacer h={12} />
      <View style={{ backgroundColor: C.mint, borderRadius: 16, padding: 14 }}>
        <Text style={{ color: C.primary, lineHeight: 20 }}>
          {rating && rating.count ? `★ ${rating.avg.toFixed(1)} from ${rating.count} review${rating.count > 1 ? 's' : ''} of ${ping.placeName}. ` : 'No reviews yet. '}
          Reviews people upvote stay up after your ping ends.
        </Text>
      </View>
      {mine && !canExtend && ping.live ? <Body style={{ marginTop: 10 }}>Pings can run up to {MAX_DAYS} days in total, so this one can’t be extended further.</Body> : null}
      {mine ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {!ping.isPrivate ? <Button title="Edit" variant="outline" icon="create-outline" style={{ flex: 1 }} onPress={() => router.push(`/ping/edit/${ping.id}`)} /> : null}
          <Button title="Remove" variant="ghost" icon="trash-outline" style={{ flex: 1 }} onPress={onRemove} />
        </View>
      ) : null}
    </Screen>
  );
}
