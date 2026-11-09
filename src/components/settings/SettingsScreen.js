// src/components/settings/SettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ScrollView, Pressable, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../../store/SettingsContext';
import { useNotes } from '../../store/NotesContext';
import { Button } from '../common/Button';
import { TextInput } from '../common/TextInput';
import { CacheManager } from '../../utils/cacheManager';
import { reloadApp } from '../../utils/reloadApp';

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
    useSystemTheme,
    theme
  } = useSettings();
  
  const { actions, lastSyncedAt, isSyncing } = useNotes();
  
  const [usernameInput, setUsernameInput] = useState(username || '');
  const [serverUrlInput, setServerUrlInput] = useState(serverUrl || '');
  const [tokenInput, setTokenInput] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem('apiToken')
      .then((t) => {
        if (t) {
          setTokenInput(t);
          setSavedToken(t);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveToken = async () => {
    const trimmed = tokenInput.trim();
    if (trimmed) {
      await AsyncStorage.setItem('apiToken', trimmed);
    } else {
      await AsyncStorage.removeItem('apiToken');
    }
    setSavedToken(trimmed);
  };
  
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

  // Load storage info on component mount
  React.useEffect(() => {
    const loadStorageInfo = async () => {
      const info = await CacheManager.getStorageInfo();
      setStorageInfo(info);
    };
    loadStorageInfo();
  }, []);

  // Cache clearing functions
  const handleClearAllCache = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your notes, settings, and app data. This action cannot be undone.\n\nAre you sure you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              const result = await CacheManager.clearAllCache();
              if (result.success) {
                Alert.alert(
                  "Success",
                  `Cleared ${result.clearedKeys.length} storage items. The app will reload now.`,
                  [{ text: "OK", onPress: () => { onClose?.(); reloadApp(); } }]
                );
              } else {
                Alert.alert(
                  "Partial Success",
                  `Cleared ${result.clearedKeys.length} items, but ${result.errors.length} errors occurred. Check logs for details.`
                );
              }
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache: " + error.message);
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  const handleClearNotesOnly = () => {
    Alert.alert(
      "Clear Notes Data",
      "This will delete all your notes and sync data, but preserve your settings. This action cannot be undone.\n\nAre you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Notes",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              const result = await CacheManager.clearNotesOnly();
              if (result.success) {
                Alert.alert(
                  "Success",
                  `Cleared notes data (${result.clearedKeys.length} items). The app will reload now.`,
                  [{ text: "OK", onPress: () => { onClose?.(); reloadApp(); } }]
                );
              } else {
                Alert.alert(
                  "Partial Success",
                  `Cleared ${result.clearedKeys.length} items, but ${result.errors.length} errors occurred.`
                );
              }
            } catch (error) {
              Alert.alert("Error", "Failed to clear notes: " + error.message);
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  const handleClearSettingsOnly = () => {
    Alert.alert(
      "Clear Settings",
      "This will reset all your app settings to defaults, but preserve your notes. You'll need to re-enter your username and server URL.\n\nAre you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Settings",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              const result = await CacheManager.clearSettingsOnly();
              if (result.success) {
                Alert.alert(
                  "Success",
                  `Cleared settings (${result.clearedKeys.length} items). The app will reload now.`,
                  [{ text: "OK", onPress: () => { onClose?.(); reloadApp(); } }]
                );
              } else {
                Alert.alert(
                  "Partial Success",
                  `Cleared ${result.clearedKeys.length} items, but ${result.errors.length} errors occurred.`
                );
              }
            } catch (error) {
              Alert.alert("Error", "Failed to clear settings: " + error.message);
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  const handleOpenSystemSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        // Try to open the app's specific settings page
        await Linking.openSettings();
      } else {
        Alert.alert(
          "System Settings",
          "System settings integration is only available on Android devices."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Could not open system settings. Please navigate to Settings > Apps > Arcanist manually."
      );
    }
  };

  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
      </View>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        overScrollMode="auto"
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustContentInsets={false}
      >

        
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

        <TextInput
          label="API Token"
          value={tokenInput}
          onChangeText={setTokenInput}
          placeholder="Optional bearer token"
          secureTextEntry
        />
        <Button
          title="Save Token"
          onPress={handleSaveToken}
          style={styles.button}
          disabled={tokenInput.trim() === savedToken}
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache & Storage</Text>
        
        {storageInfo && (
          <Text style={styles.storageInfo}>
            Storage used: {storageInfo.storageSize} ({storageInfo.appKeys.length} items)
          </Text>
        )}
        
        <View style={styles.clearButtonsRow}>
          <Button 
            title={isClearing ? "Clearing..." : "Clear Notes"} 
            onPress={handleClearNotesOnly} 
            style={styles.clearButton}
            variant="secondary"
            disabled={isClearing}
          />
          
          <Button 
            title={isClearing ? "Clearing..." : "Clear Settings"} 
            onPress={handleClearSettingsOnly} 
            style={styles.clearButton}
            variant="secondary"
            disabled={isClearing}
          />
          
          <Button 
            title={isClearing ? "Clearing..." : "Clear All"} 
            onPress={handleClearAllCache} 
            style={styles.clearButton}
            variant="danger"
            disabled={isClearing}
          />
        </View>
        
        <Button 
          title="Open System Settings" 
          onPress={handleOpenSystemSettings} 
          style={[styles.button, styles.systemSettingsButton]}
          variant="outline"
        />
        
        <Text style={styles.cacheNote}>
          ⚠️ Cache clearing is permanent and cannot be undone. Make sure to sync your notes to the server before clearing.
        </Text>
        
        <Text style={styles.systemNote}>
          💡 You can also clear app cache through Android Settings {'>'}  Apps {'>'} Arcanist {'>'} Storage & cache {'>'} Clear cache
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
    paddingTop: 40, // Add top padding for status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#e0e0e0',
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
    color: theme.colors.text,
  },
  button: {
    marginTop: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  clearButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  syncInfo: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
    color: theme.colors.subtext,
  },
  themeNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    color: theme.colors.subtext,
  },
  storageInfo: {
    fontSize: 14,
    marginBottom: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  cacheNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
    color: theme.colors.error,
    lineHeight: 16,
  },
  systemSettingsButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  systemNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    color: theme.colors.subtext,
    lineHeight: 16,
    backgroundColor: theme.colors.surface || theme.colors.background,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary || '#007bff',
  },
});

export default SettingsScreen;
