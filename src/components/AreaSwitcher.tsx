import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { SAMPLE_AREAS } from '../geo';
import { useApp } from '../store';
import { C } from '../theme';
import { Text } from './Text';
import { ActionSheet } from './ui';

/** "Near you" label that lets people switch between real location and sample areas. */
export function AreaSwitcher() {
  const { locationMode, setLocationMode } = useApp();
  const [open, setOpen] = useState(false);
  const label = locationMode === 'real' ? 'Near you' : `${SAMPLE_AREAS[locationMode].label} · sample area`;

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityLabel="Change area">
        <Ionicons name="location" size={14} color={C.primary} />
        <Text style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>{label}</Text>
        <Ionicons name="chevron-down" size={14} color={C.muted} style={{ marginLeft: 2 }} />
      </Pressable>
      <ActionSheet
        visible={open}
        title="Where do you want to look?"
        onClose={() => setOpen(false)}
        options={[
          {
            label: 'Use my location',
            icon: 'navigate',
            onPress: async () => {
              const ok = await setLocationMode('real');
              if (!ok) Alert.alert('Location is off', 'Allow location for GanApp in your phone settings, then try again.');
            },
          },
          { label: `${SAMPLE_AREAS.makati.label} (sample)`, icon: 'business-outline', onPress: () => setLocationMode('makati') },
          { label: `${SAMPLE_AREAS.intramuros.label} (sample)`, icon: 'school-outline', onPress: () => setLocationMode('intramuros') },
        ]}
      />
    </>
  );
}
