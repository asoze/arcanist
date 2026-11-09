import { useColorScheme } from 'react-native';

export const palette = {
  light: {
    background: '#ffffff',
    surface: '#f4f4f5',
    text: '#18181b',
    muted: '#71717a',
    border: '#e4e4e7',
    accent: '#2563eb',
    error: '#dc2626',
  },
  dark: {
    background: '#1c1c1e',
    surface: '#2c2c2e',
    text: '#f4f4f5',
    muted: '#a1a1aa',
    border: '#3f3f46',
    accent: '#3b82f6',
    error: '#f87171',
  },
};

export function useColors() {
  const isDark = useColorScheme() === 'dark';
  return { isDark, colors: isDark ? palette.dark : palette.light };
}
