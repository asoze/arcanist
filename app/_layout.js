import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotesProvider } from '../src/notes/NotesContext';
import { SettingsProvider } from '../src/settings/SettingsContext';
import { useColors } from '../src/theme';

export default function RootLayout() {
  const { colors } = useColors();
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <NotesProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.accent,
              headerTitleStyle: { color: colors.text },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Notes' }} />
            <Stack.Screen name="note/[id]" options={{ title: '' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          </Stack>
        </NotesProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
