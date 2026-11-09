import React, { useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useNotes } from '../../../src/store/NotesContext';
import { useSettings } from '../../../src/store/SettingsContext';
import NoteViewer from '../../../src/components/NoteViewer';
import ListViewer from '../../../src/components/ListViewer';

export default function NoteViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { notes, actions } = useNotes();
  const { theme } = useSettings();

  const note = useMemo(
    () => notes.find((n) => n.id === id),
    [notes, id],
  );

  const handleEdit = useCallback(() => {
    router.push(`/note/${id}/edit`);
  }, [router, id]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleToggleItem = useCallback((itemId) => {
    if (!note) return;
    const updatedItems = note.items.map((i) =>
      i.id === itemId ? { ...i, checked: !i.checked } : i,
    );
    actions.updateNote(note.id, { items: updatedItems });
  }, [note, actions]);

  if (!note) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {note.type === 'list' ? (
        <ListViewer
          note={note}
          items={note.items}
          onEdit={handleEdit}
          onBack={handleBack}
          onToggleItem={handleToggleItem}
        />
      ) : (
        <NoteViewer
          note={note}
          onEdit={handleEdit}
          onBack={handleBack}
        />
      )}
    </SafeAreaView>
  );
}
