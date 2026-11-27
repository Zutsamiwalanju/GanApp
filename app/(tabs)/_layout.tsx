import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../src/theme';

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        // Height includes the phone's bottom inset so labels never sit under the nav bar.
        tabBarStyle: { backgroundColor: C.white, borderTopColor: C.line, height: 60 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Explore', tabBarIcon: ({ color, size }) => <Ionicons name="compass" color={color} size={size} /> }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} /> }} />
      <Tabs.Screen
        name="pin"
        options={{ title: 'Pin', tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size + 6} /> }}
        listeners={{
          tabPress: (e) => {
            // The Pin tab opens the live camera instead of a tab page.
            e.preventDefault();
            router.push('/create/camera');
          },
        }}
      />
      <Tabs.Screen name="connect" options={{ title: 'Connect', tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} /> }} />
    </Tabs>
  );
}
