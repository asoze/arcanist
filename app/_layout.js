import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import 'expo-system-ui';
import { setLogLevel } from '../src/utils/logger';

import { AppProvider } from '../src/components/providers/AppProvider';
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';
import { useSettings } from '../src/store/SettingsContext';

function StackLayout() {
  const { isDark, theme } = useSettings();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="settings"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="new" />
        <Stack.Screen name="note/[id]/index" />
        <Stack.Screen name="note/[id]/edit" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const logLevel = Platform.OS === 'android' ? 0 : 3;
    setLogLevel(logLevel);
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <StackLayout />
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
