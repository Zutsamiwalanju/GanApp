import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '../../src/components/Text';
import { Badge, Body, Button, Card, Empty, Eyebrow, H1, H2, IconButton, Logo, Photo, Screen, Spacer, Stat, StatusBadge } from '../../src/components/ui';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';
import { fmtAgo, fmtLeft, fmtWhen } from '../../src/time';

export default function PromoterDashboard() {
  const router = useRouter();
  const { pings, uid, profile, now, reload, resetDraft, addPracticePing } = useApp();
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reload().catch(() => {});
    }, [reload]),
  );

  const mine = pings.filter((p) => p.creatorId === uid);
  const live = mine.filter((p) => p.live);
  const earlier = mine.filter((p) => !p.live);
  const total = (k: 'views' | 'directions' | 'going') => live.reduce((a, p) => a + p[k], 0);

  const practice = async () => {
    setBusy(true);
    try {
      const id = await addPracticePing();
      router.push(`/promoter/live/${id}`);
    } catch (e: any) {
      Alert.alert('Couldn’t create it', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo size={28} />
        <IconButton name="person-circle-outline" label="Profile" onPress={() => router.push('/profile')} />
      </View>
      <Spacer h={18} />
      <Eyebrow>PROMOTER  ·  {profile.displayName.toUpperCase()}</Eyebrow>
      <H1>Your pings today.</H1>
      <Body style={{ marginTop: 6 }}>See who’s finding you, and put your next event on the map.</Body>
      <Spacer />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat value={total('views').toLocaleString()} label="People reached" />
        <Stat value={total('directions')} label="Got directions" />
        <Stat value={total('going')} label="Going" />
      </View>

      <Spacer h={24} />
      <H2>Live now</H2>
      <Spacer h={10} />
      {live.length === 0 ? (
        <Empty
          title="No live pings yet"
          body="Create a promoted ping, or try a practice one first. Only you can see the practice ping."
          action={<Button title="Try a practice ping" variant="outline" icon="school-outline" loading={busy} onPress={practice} />}
        />
      ) : (
        live.map((p) => (
          <Card key={p.id} style={{ marginBottom: 12 }} onPress={() => router.push(`/promoter/live/${p.id}`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Photo ping={p} style={{ width: 64, height: 64 }} rounded={14} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', fontSize: 16, color: C.dark }} numberOfLines={1}>
                  {p.title}
                </Text>
                <Text style={{ color: C.muted, fontSize: 13 }} numberOfLines={1}>
                  {p.category} · {fmtWhen(p.startsAt, p.endsAt, now)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <StatusBadge ping={p} now={now} />
                  <Badge text={`⏱ Ping ends in ${fmtLeft(p.pingEndsAt, now)}`} />
                  {p.isPrivate ? <Badge text="PRACTICE" tone="grey" /> : p.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
                </View>
              </View>
            </View>
            <Pressable onPress={() => router.push(`/promoter/live/${p.id}`)} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
              <Text style={{ color: C.primary, fontWeight: '600' }}>View insights  →</Text>
            </Pressable>
          </Card>
        ))
      )}

      {earlier.length ? (
        <>
          <Spacer h={14} />
          <H2>Earlier</H2>
          <Spacer h={10} />
          {earlier.map((p) => (
            <Card key={p.id} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push(`/promoter/live/${p.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: C.dark }}>{p.title}</Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>
                  Ended {fmtAgo(p.pingEndsAt, now).toLowerCase()} · {p.views} reached
                </Text>
              </View>
              <Badge text="Ended" tone="grey" />
            </Card>
          ))}
        </>
      ) : null}

      <Spacer />
      <Button
        title="+  Create a promoted ping"
        onPress={() => {
          resetDraft();
          router.push('/create/camera');
        }}
      />
      <Pressable onPress={() => router.push('/(tabs)')} style={{ padding: 14, alignItems: 'center' }}>
        <Text style={{ color: C.primary, fontWeight: '600' }}>Switch to Explorer view →</Text>
      </Pressable>
    </Screen>
  );
}
