import React from 'react';
import { SettingsProvider } from '../../store/SettingsContext';
import { NotesProvider } from '../../store/NotesContext';
import { ThemeProvider } from './ThemeProvider';
import { ThemeContextProvider } from '../../store/ThemeContext';
import { useSettings } from '../../store/SettingsContext';

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

export function AppProvider({ children }) {
  return (
    <ThemeContextProvider>
      <SettingsProvider>
        <InnerProviders>
          {children}
        </InnerProviders>
      </SettingsProvider>
    </ThemeContextProvider>
  );
}

export default AppProvider;
