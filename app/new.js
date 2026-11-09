import React, { useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useNotes } from '../src/store/NotesContext';
import { useSettings } from '../src/store/SettingsContext';
import NoteEditor from '../src/components/NoteEditor';
import ListEditor from '../src/components/ListEditor';

export default function NewNoteScreen() {
  const { type = 'note' } = useLocalSearchParams();
  const router = useRouter();
  const { allTags, actions } = useNotes();
  const { theme } = useSettings();

  const draftNote = useMemo(() => ({
    id: Date.now().toString(),
    title: '',
    content: type === 'note' ? { text: '' } : undefined,
    tags: [],
    items: type === 'list' ? [] : undefined,
    type,
  }), [type]);

  const handleSave = useCallback((noteData) => {
    actions.addNote(noteData);
    router.back();
  }, [actions, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {type === 'list' ? (
        <ListEditor
          note={draftNote}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <NoteEditor
          noteTitle=""
          noteContent=""
          tags=""
          allTags={allTags}
          onAdd={handleSave}
          onCancel={handleCancel}
        />
      )}
    </SafeAreaView>
  );
}
