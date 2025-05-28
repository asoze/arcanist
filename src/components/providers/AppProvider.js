// src/components/providers/AppProvider.js
import React from 'react';
import { SettingsProvider } from '../../store/SettingsContext';
import { NotesProvider } from '../../store/NotesContext';
import { ThemeProvider } from './ThemeProvider';
import { useSettings } from '../../store/SettingsContext';

/**
 * Inner provider that has access to settings context
 */
function InnerProviders({ children }) {
  const { serverUrl, username } = useSettings();
  
  return (
    <ThemeProvider>
      <NotesProvider serverUrl={serverUrl} username={username}>
        {children}
      </NotesProvider>
    </ThemeProvider>
  );
}

/**
 * Main app provider that combines all providers
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactNode}
 */
export function AppProvider({ children }) {
  return (
    <SettingsProvider>
      <InnerProviders>
        {children}
      </InnerProviders>
    </SettingsProvider>
  );
}

export default AppProvider;
