import React, { useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useNotes } from '../../../src/store/NotesContext';
import { useSettings } from '../../../src/store/SettingsContext';
import NoteEditor from '../../../src/components/NoteEditor';
import ListEditor from '../../../src/components/ListEditor';

export default function NoteEditScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { notes, allTags, actions } = useNotes();
  const { theme } = useSettings();

  const note = useMemo(
    () => notes.find((n) => n.id === id),
    [notes, id],
  );

  const handleSaveEdit = useCallback((noteId, updates) => {
    actions.updateNote(noteId, updates);
    router.back();
  }, [actions, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (!note) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {note.type === 'list' ? (
        <ListEditor
          note={note}
          onSave={(updatedNote) => {
            actions.updateNote(note.id, updatedNote);
            router.back();
          }}
          onCancel={handleCancel}
        />
      ) : (
        <NoteEditor
          noteTitle={note.title || ''}
          noteContent={note.content?.text || ''}
          tags={(note.tags || []).join(', ')}
          allTags={allTags}
          editingId={note.id}
          originalNote={note}
          onSaveEdit={handleSaveEdit}
          onCancel={handleCancel}
        />
      )}
    </SafeAreaView>
  );
}
