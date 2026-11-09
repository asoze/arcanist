// src/hooks/useTheme.js
import { useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '../styles/theme';

const THEME_KEY = 'themePreference';

export function useTheme() {
  const [themeOverride, setThemeOverride] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const systemScheme = useColorScheme();

  const isDark = themeOverride === null
    ? (systemScheme === 'dark' || (systemScheme === null && Platform.OS === 'android'))
    : themeOverride === 'dark';

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === 'dark' || stored === 'light') {
          setThemeOverride(stored);
        }
      })
      .catch((err) => console.error('Failed to load theme preference:', err))
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setThemePreference = (preference) => {
    setThemeOverride(preference);
    if (preference === null) {
      AsyncStorage.removeItem(THEME_KEY)
        .catch((err) => console.error('Failed to clear theme preference:', err));
    } else {
      AsyncStorage.setItem(THEME_KEY, preference)
        .catch((err) => console.error('Failed to save theme preference:', err));
    }
  };

  return {
    isDark,
    themeOverride,
    hydrated,
    setThemeOverride: setThemePreference,
    toggleTheme: () => setThemePreference(isDark ? 'light' : 'dark'),
    useSystemTheme: () => setThemePreference(null),
    theme: getTheme(isDark),
  };
}
