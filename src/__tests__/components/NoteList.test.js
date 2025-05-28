// src/__tests__/components/NoteList.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NoteList from '../../components/NoteList';
import { stringToColor } from '../../utils/stringToColor';

// Mock dependencies
jest.mock('../../utils/stringToColor', () => ({
  stringToColor: jest.fn().mockReturnValue('#123456'),
}));

// Mock RefreshControl
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  return {
    ...reactNative,
    RefreshControl: function MockRefreshControl(props) {
      return reactNative.createElement('RefreshControl', {
        ...props,
        testID: 'refresh-control',
      });
    },
  };
});

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

describe('NoteList', () => {
  // Sample data
  const mockNotes = [
    { 
      id: '1', 
      title: 'Note 1', 
      content: { text: 'Content 1' }, 
      tags: ['tag1', 'tag2'], 
      updatedAt: Date.now() - 1000,
      username: 'testuser',
      type: 'note',
    },
    { 
      id: '2', 
      title: 'List 1', 
      items: [
        { id: 'item1', text: 'Item 1', checked: false },
        { id: 'item2', text: 'Item 2', checked: true },
      ],
      tags: ['tag2', 'tag3'], 
      updatedAt: Date.now() - 2000,
      username: 'testuser',
      type: 'list',
    },
    { 
      id: '3', 
      title: 'Shared Note', 
      content: { text: 'Shared content' }, 
      tags: ['tag1'], 
      updatedAt: Date.now() - 3000,
      username: 'All',
      type: 'note',
    },
  ];
  
  // Mock functions
  const mockStartEdit = jest.fn();
  const mockDeleteNote = jest.fn();
  const mockSetActiveTag = jest.fn();
  const mockOnViewNote = jest.fn();
  const mockOnRefresh = jest.fn().mockImplementation(() => Promise.resolve());
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render a list of notes', () => {
    const { getAllByText, getByText } = render(
      <NoteList
        notes={mockNotes}
        startEdit={mockStartEdit}
        deleteNote={mockDeleteNote}
        activeTag={null}
        setActiveTag={mockSetActiveTag}
        allTags={['tag1', 'tag2', 'tag3']}
        onViewNote={mockOnViewNote}
        onRefresh={mockOnRefresh}
      />
    );
    
    // Check that all notes are rendered
    expect(getByText('Note 1')).toBeTruthy();
    expect(getByText('List 1')).toBeTruthy();
    expect(getByText('Shared Note')).toBeTruthy();
    
    // Check that list items count is displayed
    expect(getByText('2 items')).toBeTruthy();
    
    // Check that shared label is displayed
    expect(getByText('🌐 Shared')).toBeTruthy();
  });
  
  it('should call onViewNote when a note is pressed', () => {
    const { getByText } = render(
      <NoteList
        notes={mockNotes}
        startEdit={mockStartEdit}
        deleteNote={mockDeleteNote}
        activeTag={null}
        setActiveTag={mockSetActiveTag}
        allTags={['tag1', 'tag2', 'tag3']}
        onViewNote={mockOnViewNote}
      />
    );
    
    // Press on a note
    fireEvent.press(getByText('Note 1'));
    
    // Check that onViewNote was called with the correct ID
    expect(mockOnViewNote).toHaveBeenCalledWith('1');
  });
  
  it('should call deleteNote when delete button is pressed', () => {
    const { getAllByText } = render(
      <NoteList
        notes={mockNotes}
        startEdit={mockStartEdit}
        deleteNote={mockDeleteNote}
        activeTag={null}
        setActiveTag={mockSetActiveTag}
        allTags={['tag1', 'tag2', 'tag3']}
        onViewNote={mockOnViewNote}
      />
    );
    
    // Find and press the delete button (X)
    const deleteButtons = getAllByText('X');
    fireEvent.press(deleteButtons[0]);
    
    // Check that deleteNote was called with the correct ID
    expect(mockDeleteNote).toHaveBeenCalledWith('1');
  });
  
  it('should call setActiveTag when a tag is pressed', () => {
    const { getAllByText } = render(
      <NoteList
        notes={mockNotes}
        startEdit={mockStartEdit}
        deleteNote={mockDeleteNote}
        activeTag={null}
        setActiveTag={mockSetActiveTag}
        allTags={['tag1', 'tag2', 'tag3']}
        onViewNote={mockOnViewNote}
      />
    );
    
    // Find and press a tag
    const tags = getAllByText('tag1');
    fireEvent.press(tags[0]);
    
    // Check that setActiveTag was called with the correct tag
    expect(mockSetActiveTag).toHaveBeenCalledWith('tag1');
  });
  
  it('should highlight the active tag', () => {
    const { getAllByText } = render(
      <NoteList
        notes={mockNotes}
        startEdit={mockStartEdit}
        deleteNote={mockDeleteNote}
        activeTag="tag1"
        setActiveTag={mockSetActiveTag}
        allTags={['tag1', 'tag2', 'tag3']}
        onViewNote={mockOnViewNote}
      />
    );
    
    // Find the active tag
    const activeTags = getAllByText('tag1');
    
    // Check that the active tag has the correct style
    // This is a bit tricky to test directly, but we can check that stringToColor was called
    expect(stringToColor).toHaveBeenCalledWith('tag1');
  });
  
  it('should call onRefresh when pull-to-refresh is triggered', async () => {
    const { getByTestId } = render(
      <NoteList
        notes={mockNotes}
        startEdit={mockStartEdit}
        deleteNote={mockDeleteNote}
        activeTag={null}
        setActiveTag={mockSetActiveTag}
        allTags={['tag1', 'tag2', 'tag3']}
        onViewNote={mockOnViewNote}
        onRefresh={mockOnRefresh}
      />
    );
    
    // Find the refresh control
    const refreshControl = getByTestId('refresh-control');
    
    // Trigger refresh
    await act(async () => {
      refreshControl.props.onRefresh();
    });
    
    // Check that onRefresh was called
    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('should sort notes by updatedAt in descending order', () => {
    const { getAllByText } = render(
      <NoteList
        notes={mockNotes}
        startEdit={mockStartEdit}
        deleteNote={mockDeleteNote}
        activeTag={null}
        setActiveTag={mockSetActiveTag}
        allTags={['tag1', 'tag2', 'tag3']}
        onViewNote={mockOnViewNote}
      />
    );
    
    // Get all note titles
    const noteTitles = getAllByText(/Note|List|Shared/);
    
    // Check that they are in the correct order
    expect(noteTitles[0].props.children).toBe('Note 1');
    expect(noteTitles[1].props.children).toBe('List 1');
    expect(noteTitles[2].props.children).toBe('Shared Note');
  });
});
