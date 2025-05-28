// src/__tests__/store/NotesContext.test.js
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react-native';
import { NotesProvider, useNotes } from '../../store/NotesContext';
import { useNoteSync } from '../../hooks/useNoteSync';
import { usePersistedNotes } from '../../hooks/usePersistedNotes';

// Mock hooks
jest.mock('../../hooks/useNoteSync', () => ({
  useNoteSync: jest.fn(),
}));

jest.mock('../../hooks/usePersistedNotes', () => ({
  __esModule: true,
  default: jest.fn(),
  usePersistedNotes: jest.fn(),
}));

// Test component that uses the notes context
function TestComponent({ testId = 'test-component' }) {
  const { 
    notes, 
    visibleNotes, 
    allTags, 
    activeTag, 
    actions 
  } = useNotes();
  
  return (
    <>
      <div testID={testId}>
        <div testID="notes-count">{notes.length}</div>
        <div testID="visible-notes-count">{visibleNotes.length}</div>
        <div testID="all-tags">{allTags.join(',')}</div>
        <div testID="active-tag">{activeTag || 'none'}</div>
      </div>
      <button 
        testID="add-note-btn" 
        onPress={() => actions.addNote({ title: 'New Note', content: { text: 'Content' } })}
      />
      <button 
        testID="delete-note-btn" 
        onPress={() => actions.deleteNote('1')}
      />
      <button 
        testID="set-tag-btn" 
        onPress={() => actions.setActiveTag('test-tag')}
      />
      <button 
        testID="sync-btn" 
        onPress={() => actions.syncWithServer(true)}
      />
    </>
  );
}

describe('NotesContext', () => {
  // Sample data
  const mockNotes = [
    { id: '1', title: 'Note 1', content: { text: 'Content 1' }, tags: ['tag1', 'tag2'], username: 'testuser' },
    { id: '2', title: 'Note 2', content: { text: 'Content 2' }, tags: ['tag2', 'tag3'], username: 'testuser' },
    { id: '3', title: 'Note 3', content: { text: 'Content 3' }, tags: ['tag1', 'tag3'], username: 'otheruser', deleted: true },
    { id: '4', title: 'Note 4', content: { text: 'Content 4' }, tags: ['tag4'], username: 'All' },
  ];
  
  const mockSyncNotes = jest.fn();
  const mockDebouncedSync = jest.fn();
  const mockSetPersistedNotes = jest.fn();
  
  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock usePersistedNotes
    usePersistedNotes.mockReturnValue({
      notes: mockNotes,
      setNotes: mockSetPersistedNotes,
      loading: false,
      error: null,
    });
    
    // Mock useNoteSync
    useNoteSync.mockReturnValue({
      syncNotes: mockSyncNotes,
      debouncedSync: mockDebouncedSync,
      skipEffectRef: { current: false },
      lastSyncedAt: 1234567890,
      isSyncing: false,
      syncError: null,
    });
  });
  
  it('should provide notes and computed values', () => {
    render(
      <NotesProvider serverUrl="https://example.com" username="testuser">
        <TestComponent />
      </NotesProvider>
    );
    
    // Check that notes are provided
    expect(screen.getByTestId('notes-count').props.children).toBe(4);
    
    // Check that visible notes are filtered correctly (not deleted and username matches)
    expect(screen.getByTestId('visible-notes-count').props.children).toBe(3);
    
    // Check that all tags are extracted
    expect(screen.getByTestId('all-tags').props.children).toBe('tag1,tag2,tag3,tag4');
    
    // Check that active tag is initially null
    expect(screen.getByTestId('active-tag').props.children).toBe('none');
  });
  
  it('should add a note', async () => {
    render(
      <NotesProvider serverUrl="https://example.com" username="testuser">
        <TestComponent />
      </NotesProvider>
    );
    
    // Initial count
    expect(screen.getByTestId('notes-count').props.children).toBe(4);
    
    // Add a note
    act(() => {
      screen.getByTestId('add-note-btn').props.onPress();
    });
    
    // Check that setNotes was called with the new note
    expect(mockSetPersistedNotes).toHaveBeenCalled();
    const newNotes = mockSetPersistedNotes.mock.calls[0][0];
    expect(newNotes.length).toBe(5);
    expect(newNotes[4].title).toBe('New Note');
    
    // Check that sync was triggered
    expect(mockDebouncedSync).toHaveBeenCalled();
  });
  
  it('should delete a note', async () => {
    render(
      <NotesProvider serverUrl="https://example.com" username="testuser">
        <TestComponent />
      </NotesProvider>
    );
    
    // Delete a note
    act(() => {
      screen.getByTestId('delete-note-btn').props.onPress();
    });
    
    // Check that setNotes was called with the updated notes
    expect(mockSetPersistedNotes).toHaveBeenCalled();
    const updatedNotes = mockSetPersistedNotes.mock.calls[0][0];
    
    // Find the deleted note
    const deletedNote = updatedNotes.find(n => n.id === '1');
    expect(deletedNote.deleted).toBe(true);
    
    // Check that sync was triggered
    expect(mockDebouncedSync).toHaveBeenCalled();
  });
  
  it('should set active tag', async () => {
    render(
      <NotesProvider serverUrl="https://example.com" username="testuser">
        <TestComponent />
      </NotesProvider>
    );
    
    // Initial active tag
    expect(screen.getByTestId('active-tag').props.children).toBe('none');
    
    // Set active tag
    act(() => {
      screen.getByTestId('set-tag-btn').props.onPress();
    });
    
    // Check that active tag was updated
    await waitFor(() => {
      expect(screen.getByTestId('active-tag').props.children).toBe('test-tag');
    });
  });
  
  it('should sync with server', async () => {
    render(
      <NotesProvider serverUrl="https://example.com" username="testuser">
        <TestComponent />
      </NotesProvider>
    );
    
    // Trigger sync
    act(() => {
      screen.getByTestId('sync-btn').props.onPress();
    });
    
    // Check that sync was called
    expect(mockSyncNotes).toHaveBeenCalledWith(true, mockNotes);
  });
  
  it('should filter notes by active tag', async () => {
    // Mock the useNotes hook to have an active tag
    const TestWithActiveTag = () => {
      const { visibleNotes, actions } = useNotes();
      
      // Set active tag on mount
      React.useEffect(() => {
        actions.setActiveTag('tag1');
      }, [actions]);
      
      return (
        <div testID="filtered-notes-count">{visibleNotes.length}</div>
      );
    };
    
    render(
      <NotesProvider serverUrl="https://example.com" username="testuser">
        <TestWithActiveTag />
      </NotesProvider>
    );
    
    // Check that notes are filtered by tag
    await waitFor(() => {
      expect(screen.getByTestId('filtered-notes-count').props.children).toBe(1);
    });
  });
});
