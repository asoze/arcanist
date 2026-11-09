// src/__tests__/components/NoteList.test.js
import React from 'react';
import { act, render, fireEvent, screen } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import NoteList from '../../components/NoteList';
import { useNotes } from '../../store/NotesContext';
import { stringToColor } from 'arcanist-common';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock('../../store/NotesContext', () => ({
  useNotes: jest.fn(),
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
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      roundness: 8,
    },
  }),
}));

jest.mock('arcanist-common', () => ({
  stringToColor: jest.fn().mockReturnValue('#123456'),
  generatePreview: (text = '') => text,
  generateListPreview: (items = []) => {
    const total = items.length;
    const unchecked = items.filter((i) => !i.checked).length;
    return total > 0 ? `${unchecked}/${total} items` : '0 items';
  },
}));

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
  const T = 1_000_000;
  const mockNotes = [
    {
      id: '1',
      title: 'Note 1',
      content: { text: 'Content 1' },
      tags: ['tag1', 'tag2'],
      updatedAt: T + 3000,
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
      updatedAt: T + 2000,
      username: 'testuser',
      type: 'list',
    },
    {
      id: '3',
      title: 'Shared Note',
      content: { text: 'Shared content' },
      tags: ['tag1'],
      updatedAt: T + 1000,
      username: 'All',
      type: 'note',
    },
  ];

  const mockViewNote = jest.fn();
  const mockDeleteNote = jest.fn();
  const mockSetActiveTag = jest.fn();
  const mockOnRefresh = jest.fn().mockImplementation(() => Promise.resolve());

  const defaultUseNotes = (overrides = {}) => ({
    visibleNotes: mockNotes,
    allTags: ['tag1', 'tag2', 'tag3'],
    activeTag: null,
    actions: {
      deleteNote: mockDeleteNote,
      setActiveTag: mockSetActiveTag,
      updateNote: jest.fn(),
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    useNotes.mockReturnValue(defaultUseNotes());
  });

  it('should render a list of notes', () => {
    render(<NoteList onRefresh={mockOnRefresh} />);

    expect(screen.getByText(/Note 1/)).toBeTruthy();
    expect(screen.getByText(/List 1/)).toBeTruthy();
    expect(screen.getByText(/Shared Note/)).toBeTruthy();
    expect(screen.getByText(/1\/2 items/)).toBeTruthy();
    expect(screen.getByText('🌐 Shared')).toBeTruthy();
  });

  it('should navigate to note view when a note is pressed', () => {
    render(<NoteList onRefresh={mockOnRefresh} />);

    fireEvent.press(screen.getByText(/Note 1/));

    expect(mockPush).toHaveBeenCalledWith('/note/1');
  });

  it('should call deleteNote after confirming delete', async () => {
    render(<NoteList onRefresh={mockOnRefresh} />);

    fireEvent.press(screen.getAllByLabelText('Delete note')[0]);

    await act(async () => {
      await Promise.resolve();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.press(deleteButtons[deleteButtons.length - 1]);

    expect(mockDeleteNote).toHaveBeenCalledWith('1');
  });

  it('should call setActiveTag when a tag is pressed', () => {
    render(<NoteList onRefresh={mockOnRefresh} />);

    const tags = screen.getAllByText('tag1');
    fireEvent.press(tags[0], { stopPropagation: jest.fn() });

    expect(mockSetActiveTag).toHaveBeenCalledWith('tag1');
  });

  it('should highlight the active tag', () => {
    useNotes.mockReturnValue(defaultUseNotes({ activeTag: 'tag1' }));
    const { getAllByText } = render(<NoteList onRefresh={mockOnRefresh} />);

    getAllByText('tag1');

    expect(stringToColor).toHaveBeenCalledWith('tag1');
  });

  it('should call onRefresh when pull-to-refresh is triggered', async () => {
    const { UNSAFE_getByType } = render(<NoteList onRefresh={mockOnRefresh} />);
    const flat = UNSAFE_getByType(FlatList);
    const rc = flat.props.refreshControl;

    await act(async () => {
      rc.props.onRefresh();
    });

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('should sort notes by updatedAt in descending order', () => {
    render(<NoteList onRefresh={mockOnRefresh} />);
    for (const re of [
      /📝\s*Note 1/,
      /🧾\s*List 1/,
      /📝\s*Shared Note/,
    ]) {
      expect(screen.getByText(re)).toBeTruthy();
    }
  });
});
