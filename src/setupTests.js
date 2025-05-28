// src/setupTests.js
import '@testing-library/jest-native/extend-expect';
import { NativeModules } from 'react-native';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    type: 'wifi',
    isConnected: true,
  })),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock expo modules
NativeModules.StatusBarManager = { getHeight: jest.fn() };

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  return {
    PaperProvider: ({ children }) => children,
    MD3DarkTheme: { colors: {} },
    MD3LightTheme: { colors: {} },
    Checkbox: ({ status, onPress }) => (
      <View testID={`checkbox-${status}`} onPress={onPress}>
        <Text>{status}</Text>
      </View>
    ),
  };
});

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock react-native-markdown-display
jest.mock('react-native-markdown-display', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  return {
    __esModule: true,
    default: ({ children }) => (
      <View testID="markdown-display">
        <Text>{children}</Text>
      </View>
    ),
  };
});
