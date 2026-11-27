import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FONTS } from '../src/assets';
import { Text } from '../src/components/Text';
import { Button, Logo } from '../src/components/ui';
import { AppProvider, useApp } from '../src/store';
import { C } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate() {
  const { ready, error, retry } = useApp();

  useEffect(() => {
    if (ready || error) SplashScreen.hideAsync().catch(() => {});
  }, [ready, error]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 28 }}>
        <Logo size={36} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: C.dark, marginTop: 24 }}>Can’t reach GanApp</Text>
        <Text style={{ color: C.muted, marginTop: 8, marginBottom: 20, lineHeight: 20 }}>{error}</Text>
        <Button title="Try again" onPress={retry} />
      </View>
    );
  }
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Logo size={44} />
        <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONTS);
  if (!fontsLoaded && !fontError) return null; // splash stays up while Inter loads
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Gate />
      </AppProvider>
    </SafeAreaProvider>
  );
}
