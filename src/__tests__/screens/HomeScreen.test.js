// src/__tests__/screens/HomeScreen.test.js
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import HomeScreen from '../../../app/index';
import { useNotes } from '../../store/NotesContext';
import { useSettings } from '../../store/SettingsContext';
import { useModal } from '../../hooks/useModal';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock('../../store/NotesContext', () => ({
  useNotes: jest.fn(),
}));

jest.mock('../../store/SettingsContext', () => ({
  useSettings: jest.fn(),
}));

jest.mock('../../hooks/useModal', () => ({
  useModal: jest.fn(),
}));

jest.mock('../../store/ThemeContext', () => ({
  useThemeContext: () => ({
    isDark: false,
    theme: {
      colors: {
        primary: '#007bff',
        text: '#000000',
        subtext: '#888888',
        surface: '#f8f9fa',
        border: '#cccccc',
        error: '#cc3333',
        secondary: '#6c757d',
        success: '#28a745',
        background: '#ffffff',
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      roundness: 8,
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}));

jest.mock('../../components/NoteList', () => {
  const React = require('react');
  const { View, Text, Button } = require('react-native');

  return {
    __esModule: true,
    default: ({ onRefresh }) => {
      return (
        <View testID="note-list">
          <Text testID="notes-count">2</Text>
          {onRefresh && (
            <Button
              testID="refresh-btn"
              title="Refresh"
              onPress={onRefresh}
            />
          )}
        </View>
      );
    },
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

describe('HomeScreen', () => {
  const mockActions = {
    addNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
    setActiveTag: jest.fn(),
    syncWithServer: jest.fn(),
  };

  const mockUsernameModal = {
    isVisible: false,
    show: jest.fn(),
    hide: jest.fn(),
    toggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();

    useModal.mockReturnValue(mockUsernameModal);

    useNotes.mockReturnValue({
      notes: [],
      visibleNotes: [],
      allTags: ['tag1', 'tag2'],
      activeTag: null,
      lastSyncedAt: Date.now(),
      actions: mockActions,
    });

    useSettings.mockReturnValue({
      isDark: false,
      isLoading: false,
      theme: {
        colors: {
          background: '#ffffff',
          text: '#000000',
          primary: '#007bff',
          subtext: '#888888',
          surface: '#f8f9fa',
        },
      },
      username: 'testuser',
      serverUrl: 'https://example.com',
    });
  });

  it('should render the note list when username is set', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('note-list')).toBeTruthy();
  });

  it('should navigate to settings when menu button is pressed', () => {
    const { getByText } = render(<HomeScreen />);

    const menuButton = getByText('☰');
    fireEvent.press(menuButton);

    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('should navigate to new note screen when add note is pressed', () => {
    const { getByLabelText } = render(<HomeScreen />);

    fireEvent.press(getByLabelText('Add note'));

    expect(mockPush).toHaveBeenCalledWith('/new?type=note');
  });

  it('should navigate to new list screen when add list is pressed', () => {
    const { getByLabelText } = render(<HomeScreen />);

    fireEvent.press(getByLabelText('Add list'));

    expect(mockPush).toHaveBeenCalledWith('/new?type=list');
  });

  it('should show welcome state when username is not available', () => {
    useSettings.mockReturnValue({
      isDark: false,
      isLoading: false,
      theme: {
        colors: {
          background: '#ffffff',
          text: '#000000',
          primary: '#007bff',
          subtext: '#888888',
          surface: '#f8f9fa',
        },
      },
      username: null,
      serverUrl: 'https://example.com',
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Welcome to Arcanist!')).toBeTruthy();
    expect(
      getByText('Please set up your username to get started.')
    ).toBeTruthy();
  });

  it('should call syncWithServer when refresh is triggered', async () => {
    const { getByTestId } = render(<HomeScreen />);

    const refreshButton = getByTestId('refresh-btn');
    await act(async () => {
      fireEvent.press(refreshButton);
    });

    expect(mockActions.syncWithServer).toHaveBeenCalledWith(true);
  });

  it('should show filter banner when activeTag is set', () => {
    useNotes.mockReturnValue({
      ...useNotes(),
      activeTag: 'tag1',
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Filtering by tag:')).toBeTruthy();
    expect(getByText('tag1')).toBeTruthy();

    fireEvent.press(getByText('✕ Clear Filter'));

    expect(mockActions.setActiveTag).toHaveBeenCalledWith(null);
  });
});
