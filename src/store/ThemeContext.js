import React, { createContext, useContext } from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeContext = createContext(null);

export function ThemeContextProvider({ children }) {
  const value = useTheme();
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return ctx;
}

export default ThemeContext;
