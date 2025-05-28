// src/hooks/useTheme.js
import { useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '../styles/theme';

/**
 * Custom hook for theme management
 * @returns {Object} Theme state and functions
 */
export function useTheme() {
  const [themeOverride, setThemeOverride] = useState(null);
  const systemScheme = useColorScheme();
  // Force dark mode for testing
  // const isDark = true;
  
  // Use system theme with fallback to device settings
  const isDark = themeOverride === null 
    ? (systemScheme === "dark" || (systemScheme === null && Platform.OS === 'android'))
    : themeOverride === "dark";
  
  // Always use system theme by default
  useEffect(() => {
    // Clear any saved theme preference to ensure system theme is used
    AsyncStorage.removeItem('themePreference')
      .catch(err => console.error('Failed to clear theme preference:', err));
  }, []);
  
  // Save theme preference when changed
  const setThemePreference = (preference) => {
    setThemeOverride(preference);
    AsyncStorage.setItem('themePreference', preference)
      .catch(err => console.error('Failed to save theme preference:', err));
  };
  
  return {
    isDark,
    themeOverride,
    setThemeOverride: setThemePreference,
    toggleTheme: () => setThemePreference(isDark ? 'light' : 'dark'),
    useSystemTheme: () => setThemePreference(null),
    theme: getTheme(isDark),
  };
}
