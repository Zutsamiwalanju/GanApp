import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui';
import { AppProvider, useApp } from '../src/store';
import { C } from '../src/theme';

function Gate() {
  const { ready, error, retry } = useApp();
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 28 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: C.dark }}>Can’t reach GanApp</Text>
        <Text style={{ color: C.muted, marginTop: 8, marginBottom: 20, lineHeight: 20 }}>{error}</Text>
        <Button title="Try again" onPress={retry} />
      </View>
    );
  }
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: C.dark, marginBottom: 16 }}>ganapp</Text>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Gate />
      </AppProvider>
    </SafeAreaProvider>
  );
}
