import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, H1, s } from '../../src/components/ui';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';

/** Live photo only: there is deliberately no gallery picker anywhere in GanApp. */
export default function LiveCamera() {
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const { updateDraft, location, usingSample } = useApp();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!perm) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!perm.granted) {
    return (
      <SafeAreaView style={[s.safe, s.pad, { justifyContent: 'center' }]}>
        <Ionicons name="camera" size={48} color={C.primary} />
        <H1 style={{ marginTop: 16 }}>Snap the spot, right now.</H1>
        <Body style={{ marginTop: 8, marginBottom: 24 }}>
          GanApp only takes live photos, no gallery uploads, so every ping shows what’s really happening.
        </Body>
        <Button title="Allow camera" onPress={requestPerm} />
        <Button title="Not now" variant="ghost" onPress={close} style={{ marginTop: 8 }} />
      </SafeAreaView>
    );
  }

  const capture = async () => {
    if (!cam.current || busy) return;
    setBusy(true);
    try {
      const shot = await cam.current.takePictureAsync({ quality: 0.8 });
      if (!shot?.uri) throw new Error('No photo');
      // Shrink to 1080 px wide so uploads are fast on mobile data.
      const small = await manipulateAsync(shot.uri, [{ resize: { width: 1080 } }], {
        compress: 0.6,
        format: SaveFormat.JPEG,
        base64: true,
      });

      // Stamp the ping with where the photo was taken (helps stop fake locations).
      let lat = location.lat;
      let lng = location.lng;
      let verified = false;
      if (!usingSample) {
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          verified = true;
        } catch {
          /* fall back to last known location */
        }
      }

      updateDraft({ photoUri: small.uri, photoBase64: small.base64 ?? null, lat, lng, locationVerified: verified });
      router.replace('/create/details');
    } catch (e: any) {
      Alert.alert('Couldn’t take the photo', e?.message ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cam} style={{ flex: 1 }} facing={facing} />
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
            {usingSample ? 'Sample city mode: your ping will be placed in Makati.' : 'Your ping is placed where you take this photo.'}
          </Text>
          <Pressable onPress={capture} accessibilityLabel="Capture photo" style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            {busy ? <ActivityIndicator color="#fff" /> : <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' }} />}
          </Pressable>
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Tap to capture</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
