// src/store/SettingsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from './ThemeContext';
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
  const [username, setUsernameState] = useState(null);
  const [serverUrl, setServerUrlState] = useState('https://home.andrewrsweeney.com');
  const [isLoading, setIsLoading] = useState(true);
  
  const themeContext = useThemeContext();
  
  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load username from storage
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsernameState(storedUsername);
          logInfo('[SettingsContext] Loaded username:', storedUsername);
        } else {
          logInfo('[SettingsContext] No username found in storage - user will be prompted');
        }
        
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
        const trimmedUsername = newUsername.trim();
        await AsyncStorage.setItem('username', trimmedUsername);
        setUsernameState(trimmedUsername);
        logInfo('[SettingsContext] Saved username:', trimmedUsername);
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
