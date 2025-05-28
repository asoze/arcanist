// src/store/SettingsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { logInfo, logError } from '../utils/logger';

// Create context
const SettingsContext = createContext();

/**
 * Provider component for app settings
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactNode}
 */
export function SettingsProvider({ children }) {
  const [username, setUsernameState] = useState('testuser');
  const [serverUrl, setServerUrlState] = useState('https://home.andrewrsweeney.com');
  const [isLoading, setIsLoading] = useState(true);
  
  // Use theme hook
  const themeContext = useTheme();
  
  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Always use 'testuser' as the default username
        setUsernameState('testuser');
        await AsyncStorage.setItem('username', 'testuser');
        logInfo('[SettingsContext] Using default username: testuser');
        
        // Load server URL
        const storedServerUrl = await AsyncStorage.getItem('serverUrl');
        if (storedServerUrl) {
          setServerUrlState(storedServerUrl);
          logInfo('[SettingsContext] Loaded serverUrl:', storedServerUrl);
        }
      } catch (error) {
        logError('[SettingsContext] Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save username to AsyncStorage
  const setUsername = async (newUsername) => {
    if (newUsername && newUsername.trim()) {
      try {
        await AsyncStorage.setItem('username', newUsername.trim());
        setUsernameState(newUsername.trim());
        logInfo('[SettingsContext] Saved username:', newUsername.trim());
      } catch (error) {
        logError('[SettingsContext] Error saving username:', error);
      }
    }
  };
  
  // Save server URL to AsyncStorage
  const setServerUrl = async (newServerUrl) => {
    if (newServerUrl && newServerUrl.trim()) {
      try {
        await AsyncStorage.setItem('serverUrl', newServerUrl.trim());
        setServerUrlState(newServerUrl.trim());
        logInfo('[SettingsContext] Saved serverUrl:', newServerUrl.trim());
      } catch (error) {
        logError('[SettingsContext] Error saving serverUrl:', error);
      }
    }
  };
  
  // Context value
  const value = {
    username,
    setUsername,
    serverUrl,
    setServerUrl,
    isLoading,
    ...themeContext,
  };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to use settings context
 * @returns {Object} Settings context value
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default SettingsContext;
