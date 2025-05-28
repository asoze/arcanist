// src/components/settings/SettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useSettings } from '../../store/SettingsContext';
import { useNotes } from '../../store/NotesContext';
import { Button } from '../common/Button';
import { TextInput } from '../common/TextInput';

/**
 * Settings screen component
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the settings screen
 * @returns {React.ReactNode}
 */
export function SettingsScreen({ onClose }) {
  const { 
    username, 
    setUsername, 
    serverUrl, 
    setServerUrl,
    isDark,
    themeOverride,
    setThemeOverride,
    toggleTheme,
    useSystemTheme
  } = useSettings();
  
  const { actions, lastSyncedAt, isSyncing } = useNotes();
  
  const [usernameInput, setUsernameInput] = useState(username || '');
  const [serverUrlInput, setServerUrlInput] = useState(serverUrl || '');
  
  const handleSaveUsername = () => {
    if (usernameInput.trim()) {
      setUsername(usernameInput.trim());
    }
  };
  
  const handleSaveServerUrl = () => {
    if (serverUrlInput.trim()) {
      setServerUrl(serverUrlInput.trim());
    }
  };
  
  // Use a ref to track the last sync time to prevent rapid clicking
  const lastSyncTimeRef = React.useRef(0);
  
  const handleSyncNow = () => {
    const now = Date.now();
    // Prevent rapid clicking by enforcing a 3-second delay between syncs
    if (now - lastSyncTimeRef.current < 3000) return;
    
    lastSyncTimeRef.current = now;
    actions.syncWithServer(true);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Settings</Text>
        <TextInput
          label="Username"
          value={usernameInput}
          onChangeText={setUsernameInput}
          placeholder="Enter your username"
        />
        <Button 
          title="Save Username" 
          onPress={handleSaveUsername} 
          style={styles.button}
          disabled={!usernameInput.trim() || usernameInput.trim() === username}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Settings</Text>
        <TextInput
          label="Server URL"
          value={serverUrlInput}
          onChangeText={setServerUrlInput}
          placeholder="Enter server URL"
        />
        <Button 
          title="Save Server URL" 
          onPress={handleSaveServerUrl} 
          style={styles.button}
          disabled={!serverUrlInput.trim() || serverUrlInput.trim() === serverUrl}
        />
        
        <Button 
          title={isSyncing ? "Syncing..." : "Sync Now"} 
          onPress={handleSyncNow} 
          style={styles.button}
          disabled={isSyncing}
        />
        
        {lastSyncedAt > 0 && (
          <Text style={styles.syncInfo}>
            Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
          </Text>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Follow system theme</Text>
          <Switch
            value={themeOverride === null}
            onValueChange={(useSystem) => useSystem ? useSystemTheme() : setThemeOverride(isDark ? 'dark' : 'light')}
          />
        </View>
        
        {themeOverride !== null && (
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
            />
          </View>
        )}
        
        <Text style={styles.themeNote}>
          Note: System theme is used by default
        </Text>
      </View>
      
      <Button 
        title="Close" 
        onPress={onClose} 
        variant="secondary"
        style={styles.closeButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  closeButton: {
    marginTop: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  syncInfo: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
  },
  themeNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    color: '#666',
  },
});

export default SettingsScreen;
