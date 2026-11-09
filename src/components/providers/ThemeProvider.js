import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { useThemeContext } from '../../store/ThemeContext';

export function ThemeProvider({ children }) {
  const { theme } = useThemeContext();
  return (
    <PaperProvider theme={theme}>
      {children}
    </PaperProvider>
  );
}

export default ThemeProvider;
