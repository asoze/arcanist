// src/__tests__/screens/NoteApp.test.js
import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { NoteApp } from '../../screens/NoteApp';
import { useNotes } from '../../store/NotesContext';
import { useSettings } from '../../store/SettingsContext';
import { useModal } from '../../hooks/useModal';

// Mock dependencies
jest.mock('../../store/NotesContext', () => ({
  useNotes: jest.fn(),
}));

jest.mock('../../store/SettingsContext', () => ({
  useSettings: jest.fn(),
}));

jest.mock('../../hooks/useModal', () => ({
  useModal: jest.fn(),
}));

jest.mock('../../components/NoteList', () => {
  const React = require('react');
  const { View, Text, Button } = require('react-native');
  
  return {
    __esModule: true,
    default: ({ notes, onViewNote, deleteNote, setActiveTag, onRefresh }) => (
      <View testID="note-list">
        <Text testID="notes-count">{notes.length}</Text>
        <Button 
          testID="view-note-btn" 
          title="View Note" 
          onPress={() => onViewNote('1')} 
        />
        <Button 
          testID="delete-note-btn" 
          title="Delete Note" 
          onPress={() => deleteNote('1')} 
        />
        <Button 
          testID="set-tag-btn" 
          title="Set Tag" 
          onPress={() => setActiveTag('tag1')} 
        />
        {onRefresh && (
          <Button 
            testID="refresh-btn" 
            title="Refresh" 
            onPress={onRefresh} 
          />
        )}
      </View>
    ),
  };
});

jest.mock('../../components/NoteViewer', () => {
  const React = require('react');
  const { View, Text, Button } = require('react-native');
  
  return {
    __esModule: true,
    default: ({ note, onEdit, onBack }) => (
      <View testID="note-viewer">
        <Text testID="note-title">{note.title}</Text>
        <Button 
          testID="edit-note-btn" 
          title="Edit" 
          onPress={onEdit} 
        />
        <Button 
          testID="back-btn" 
          title="Back" 
          onPress={onBack} 
        />
      </View>
    ),
  };
});

jest.mock('../../components/NoteEditor', () => {
  const React = require('react');
  const { View, Text, Button } = require('react-native');
  
  return {
    __esModule: true,
    default: ({ noteTitle, onAdd, onCancel }) => (
      <View testID="note-editor">
        <Text testID="note-title">{noteTitle}</Text>
        <Button 
          testID="save-note-btn" 
          title="Save" 
          onPress={onAdd} 
        />
        <Button 
          testID="cancel-btn" 
          title="Cancel" 
          onPress={onCancel} 
        />
      </View>
    ),
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

describe('NoteApp', () => {
  // Sample data
  const mockNotes = [
    { id: '1', title: 'Note 1', content: { text: 'Content 1' }, tags: ['tag1'] },
    { id: '2', title: 'Note 2', content: { text: 'Content 2' }, tags: ['tag2'] },
  ];
  
  // Mock actions
  const mockActions = {
    addNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
    setActiveTag: jest.fn(),
    viewNote: jest.fn(),
    editNote: jest.fn(),
    startAddNote: jest.fn(),
    cancelEdit: jest.fn(),
    setIsGlobal: jest.fn(),
    syncWithServer: jest.fn(),
  };
  
  // Mock modal hooks
  const mockSettingsModal = {
    isVisible: false,
    show: jest.fn(),
    hide: jest.fn(),
    toggle: jest.fn(),
  };
  
  const mockAdminErrorModal = {
    isVisible: false,
    show: jest.fn(),
    hide: jest.fn(),
    toggle: jest.fn(),
  };
  
  const mockNetworkDebugModal = {
    isVisible: false,
    show: jest.fn(),
    hide: jest.fn(),
    toggle: jest.fn(),
  };
  
  const mockUsernameModal = {
    isVisible: false,
    show: jest.fn(),
    hide: jest.fn(),
    toggle: jest.fn(),
  };
  
  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useNotes
    useNotes.mockReturnValue({
      notes: mockNotes,
      visibleNotes: mockNotes,
      allTags: ['tag1', 'tag2'],
      activeTag: null,
      viewingId: null,
      editingId: null,
      isAdding: false,
      isGlobal: false,
      currentNote: null,
      lastSyncedAt: Date.now(),
      actions: mockActions,
    });
    
    // Mock useSettings
    useSettings.mockReturnValue({
      isDark: false,
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
    
    // Mock useModal
    useModal
      .mockReturnValueOnce(mockSettingsModal)
      .mockReturnValueOnce(mockAdminErrorModal)
      .mockReturnValueOnce(mockNetworkDebugModal)
      .mockReturnValueOnce(mockUsernameModal);
  });
  
  it('should render the note list when not viewing or editing a note', () => {
    const { getByTestId } = render(<NoteApp />);
    
    // Check that note list is rendered
    expect(getByTestId('note-list')).toBeTruthy();
    expect(getByTestId('notes-count').props.children).toBe(2);
  });
  
  it('should show the note viewer when viewing a note', () => {
    // Mock viewing a note
    useNotes.mockReturnValue({
      ...useNotes(),
      viewingId: '1',
      currentNote: { id: '1', title: 'Note 1', content: { text: 'Content 1' } },
    });
    
    const { getByTestId } = render(<NoteApp />);
    
    // Check that note viewer is rendered
    expect(getByTestId('note-viewer')).toBeTruthy();
    expect(getByTestId('note-title').props.children).toBe('Note 1');
  });
  
  it('should show the note editor when editing a note', () => {
    // Mock editing a note
    useNotes.mockReturnValue({
      ...useNotes(),
      isAdding: true,
      editingId: '1',
      currentNote: { id: '1', title: 'Note 1', content: { text: 'Content 1' } },
    });
    
    const { getByTestId } = render(<NoteApp />);
    
    // Check that note editor is rendered
    expect(getByTestId('note-editor')).toBeTruthy();
  });
  
  it('should call viewNote when view note button is pressed', () => {
    const { getByTestId } = render(<NoteApp />);
    
    // Press view note button
    fireEvent.press(getByTestId('view-note-btn'));
    
    // Check that viewNote was called with the correct ID
    expect(mockActions.viewNote).toHaveBeenCalledWith('1');
  });
  
  it('should call deleteNote when delete note button is pressed', () => {
    const { getByTestId } = render(<NoteApp />);
    
    // Press delete note button
    fireEvent.press(getByTestId('delete-note-btn'));
    
    // Check that deleteNote was called with the correct ID
    expect(mockActions.deleteNote).toHaveBeenCalledWith('1');
  });
  
  it('should call setActiveTag when set tag button is pressed', () => {
    const { getByTestId } = render(<NoteApp />);
    
    // Press set tag button
    fireEvent.press(getByTestId('set-tag-btn'));
    
    // Check that setActiveTag was called with the correct tag
    expect(mockActions.setActiveTag).toHaveBeenCalledWith('tag1');
  });
  
  it('should show settings modal when menu button is pressed', () => {
    const { getByText } = render(<NoteApp />);
    
    // Find and press the menu button (☰)
    const menuButton = getByText('☰');
    fireEvent.press(menuButton);
    
    // Check that settings modal was shown
    expect(mockSettingsModal.show).toHaveBeenCalled();
  });
  
  it('should show loading state when username is not available', () => {
    // Mock no username
    useSettings.mockReturnValue({
      ...useSettings(),
      username: null,
    });
    
    const { getByText } = render(<NoteApp />);
    
    // Check that loading state is shown
    expect(getByText('Loading notes...')).toBeTruthy();
  });
  
  it('should call syncWithServer when refresh is triggered', async () => {
    const { getByTestId } = render(<NoteApp />);
    
    // Find and press the refresh button
    const refreshButton = getByTestId('refresh-btn');
    await act(async () => {
      fireEvent.press(refreshButton);
    });
    
    // Check that syncWithServer was called with force=true
    expect(mockActions.syncWithServer).toHaveBeenCalledWith(true);
  });

  it('should show filter banner when activeTag is set', () => {
    // Mock active tag
    useNotes.mockReturnValue({
      ...useNotes(),
      activeTag: 'tag1',
    });
    
    const { getByText } = render(<NoteApp />);
    
    // Check that filter banner is shown
    expect(getByText('Filtering by tag:')).toBeTruthy();
    expect(getByText('tag1')).toBeTruthy();
    
    // Press clear filter button
    fireEvent.press(getByText('✕ Clear Filter'));
    
    // Check that setActiveTag was called with null
    expect(mockActions.setActiveTag).toHaveBeenCalledWith(null);
  });
});
