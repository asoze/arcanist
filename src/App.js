// src/App.js
import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'expo-system-ui';
import { setLogLevel } from './utils/logger';

import { AppProvider } from './components/providers/AppProvider';
import NoteApp from './screens/NoteApp';

/**
 * Root application component
 * @returns {React.ReactNode}
 */
export default function App() {
  // Set log level based on platform
  useEffect(() => {
    // For Android, set to no logs (0) to eliminate console spam
    // For other platforms, use info level (3)
    const logLevel = Platform.OS === 'android' ? 0 : 3;
    setLogLevel(logLevel);
  }, []);

  return (
    <AppProvider>
      <View style={{ flex: 1 }}>
        <NoteApp />
      </View>
    </AppProvider>
  );
}
