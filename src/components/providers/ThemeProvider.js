// src/components/providers/ThemeProvider.js
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';

/**
 * Provider component for theme
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactNode}
 */
export function ThemeProvider({ children }) {
  const { isDark, theme } = useTheme();
  
  return (
    <PaperProvider theme={theme}>
      {children}
    </PaperProvider>
  );
}

export default ThemeProvider;
