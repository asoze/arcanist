import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSettings } from '../src/store/SettingsContext';
import { SettingsScreen } from '../src/components/settings/SettingsScreen';

export default function SettingsRoute() {
  const router = useRouter();
  const { theme } = useSettings();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SettingsScreen onClose={handleClose} />
    </SafeAreaView>
  );
}
