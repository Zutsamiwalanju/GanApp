import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UI } from '../../src/assets';
import { Text } from '../../src/components/Text';
import { Body, Button, H1, s } from '../../src/components/ui';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';

/** Live photo only: there is deliberately no gallery picker anywhere in GanApp. */
export default function LiveCamera() {
  const router = useRouter();
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const { updateDraft, usingSample, setLocationMode } = useApp();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // A ping is placed where its photo is taken, so pinning needs your real location.
  if (usingSample) {
    return (
      <SafeAreaView style={[s.safe, s.pad, { justifyContent: 'center' }]}>
        <Image source={UI.location} style={{ width: 180, height: 180, alignSelf: 'center' }} contentFit="contain" />
        <H1 style={{ marginTop: 16 }}>Turn on location to pin.</H1>
        <Body style={{ marginTop: 8, marginBottom: 24 }}>
          You’re looking around a sample area. Pings are placed exactly where their live photo is taken, so we need your real location to post one.
        </Body>
        <Button
          title="Use my location"
          icon="navigate"
          loading={enabling}
          onPress={async () => {
            setEnabling(true);
            const ok = await setLocationMode('real');
            setEnabling(false);
            if (!ok) Alert.alert('Location is off', 'Allow location for GanApp in your phone settings, then try again.');
          }}
        />
        <Button title="Not now" variant="ghost" onPress={close} style={{ marginTop: 8 }} />
      </SafeAreaView>
    );
  }

  if (!perm) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!perm.granted) {
    return (
      <SafeAreaView style={[s.safe, s.pad, { justifyContent: 'center' }]}>
        <Ionicons name="camera" size={48} color={C.primary} />
        <H1 style={{ marginTop: 16 }}>Snap the spot, right now.</H1>
        <Body style={{ marginTop: 8, marginBottom: 24 }}>GanApp only takes live photos, no gallery uploads, so every ping shows what’s really happening.</Body>
        <Button title="Allow camera" onPress={requestPerm} />
        <Button title="Not now" variant="ghost" onPress={close} style={{ marginTop: 8 }} />
      </SafeAreaView>
    );
  }

  const capture = async () => {
    if (!cam.current || busy || !ready) return;
    setBusy(true);
    try {
      // Start the GPS fix and the photo together.
      const posPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null);
      const shot = await cam.current.takePictureAsync({ quality: 0.8 });
      if (!shot?.uri) throw new Error('No photo');

      // Shrink to 1080 px wide so uploads are fast on mobile data.
      const ctx = ImageManipulator.manipulate(shot.uri);
      ctx.resize({ width: 1080 });
      const rendered = await ctx.renderAsync();
      const small = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });

      const pos = await posPromise;
      if (!pos) throw new Error('Couldn’t get your location. Step outside or check that location is on, then try again.');

      updateDraft({ photoUri: small.uri, photoBase64: small.base64 ?? null, lat: pos.coords.latitude, lng: pos.coords.longitude });
      router.replace('/create/details');
    } catch (e: any) {
      Alert.alert('Couldn’t take the photo', e?.message ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cam} style={{ flex: 1 }} facing={facing} onCameraReady={() => setReady(true)} />
      <SafeAreaView edges={['top', 'bottom']} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
          <Pressable onPress={close} style={[s.round, { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 0 }]} accessibilityLabel="Close camera">
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          <View style={{ backgroundColor: C.coral, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>●  LIVE PHOTO ONLY</Text>
          </View>
          <Pressable onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} style={[s.round, { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 0 }]} accessibilityLabel="Flip camera">
            <Ionicons name="camera-reverse" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={{ alignItems: 'center', paddingBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Snap the spot, right now.</Text>
          <Text style={{ color: '#ddd', marginTop: 4, marginBottom: 18, textAlign: 'center', paddingHorizontal: 30 }}>
            Your ping is placed where you take this photo. Please avoid close-ups of strangers.
          </Text>
          <Pressable
            onPress={capture}
            disabled={!ready}
            accessibilityLabel="Capture photo"
            style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.5 }}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' }} />}
          </Pressable>
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>{ready ? 'Tap to capture' : 'Starting camera…'}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
