import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'arcanist:settings';

const DEFAULTS = { username: '', serverUrl: '', apiToken: '' };

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setSettings({ ...DEFAULTS, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const saveSettings = useCallback((changes) => {
    setSettings((current) => {
      const next = {
        ...current,
        ...Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.trim()])),
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ...settings, loaded, saveSettings }), [settings, loaded, saveSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
