// src/screens/NoteApp.js
import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput as RNTextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNotes } from '../store/NotesContext';
import { useSettings } from '../store/SettingsContext';
import { useModal } from '../hooks/useModal';

// Components
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';
import NoteViewer from '../components/NoteViewer';
import ListEditor from '../components/ListEditor';
import ListViewer from '../components/ListViewer';
import AdminErrorScreen from '../components/AdminErrorScreen';
import SettingsScreen from '../components/settings/SettingsScreen';
import NetworkDebugScreen from './NetworkDebugScreen';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { TagList } from '../components/common/TagList';
import { TextInput } from '../components/common/TextInput';
import { OfflineNotice } from '../components/common/OfflineNotice';

/**
 * Main application component
 * @returns {React.ReactNode}
 */
export function NoteApp() {
  // Context hooks
  const { 
    notes, 
    visibleNotes, 
    allTags, 
    activeTag, 
    viewingId, 
    editingId, 
    isAdding,
    isGlobal,
    currentNote,
    lastSyncedAt,
    actions 
  } = useNotes();
  
  const { isDark, theme, username, serverUrl } = useSettings();
  
  // Modal visibility state using custom hooks
  const settingsModal = useModal(false);
  const adminErrorModal = useModal(false);
  const networkDebugModal = useModal(false);
  const usernameModal = useModal(!username);
  
  // Handle note actions
  const handleStartAddNote = (type = 'note') => {
    actions.startAddNote();
    const newNote = {
      id: Date.now().toString(),
      title: '',
      content: type === 'note' ? { text: '' } : undefined,
      tags: [],
      items: type === 'list' ? [] : undefined,
      type,
    };
    // Don't add to backend immediately - only add when user saves
    actions.editNote(newNote.id, newNote);
  };
  
  // Render loading state
  if (!username) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Loading notes...</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineNotice />
      
      {/* Header with menu button */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Arcanist</Text>
        
        <Pressable
          onPress={settingsModal.show}
          style={styles.menuButton}
        >
          <Text style={[styles.menuButtonText, { color: theme.colors.text }]}>☰</Text>
        </Pressable>
      </View>
      
      {/* Tag filter banner */}
      {activeTag && (
        <View style={[styles.filterBanner, { backgroundColor: isDark ? theme.colors.surface : '#eef' }]}>
          <Text style={[styles.filterText, { color: theme.colors.text }]}>
            Filtering by tag:
          </Text>
          <Text style={[styles.filterTag, { color: theme.colors.primary }]}>
            {activeTag}
          </Text>
          <Text
            onPress={() => actions.setActiveTag(null)}
            style={styles.clearFilter}
          >
            ✕ Clear Filter
          </Text>
        </View>
      )}
      
      {/* Main content area */}
      {viewingId && currentNote && (
        currentNote.type === 'list' ? (
          <ListViewer
            note={currentNote}
            items={currentNote.items}
            onEdit={() => actions.editNote(currentNote.id)}
            onBack={() => actions.viewNote(null)}
            onToggleItem={(itemId) => {
              const updatedItems = currentNote.items.map((i) =>
                i.id === itemId ? { ...i, checked: !i.checked } : i
              );
              actions.updateNote(currentNote.id, { items: updatedItems });
            }}
          />
        ) : (
          <NoteViewer
            note={currentNote}
            onEdit={() => actions.editNote(currentNote.id)}
            onBack={() => actions.viewNote(null)}
            isDark={isDark}
          />
        )
      )}
      
      {isAdding && currentNote && (
        currentNote.type === 'list' ? (
          <ListEditor
            note={currentNote}
            onSave={(updatedNote) => {
              // Add note to backend when saving for the first time
              actions.addNote(updatedNote);
              actions.cancelEdit();
            }}
            onCancel={actions.cancelEdit}
            isGlobal={isGlobal}
            setIsGlobal={(value) => actions.setIsGlobal(value)}
          />
        ) : (
          <NoteEditor
            noteTitle={currentNote.title || ''}
            setNoteTitle={(title) => {
              // Store changes locally in the component, not in the global state
              // This will be handled by onSaveEdit
            }}
            noteContent={currentNote.content?.text || ''}
            setNoteContent={(text) => {
              // Store changes locally in the component, not in the global state
              // This will be handled by onSaveEdit
            }}
            tags={(currentNote.tags || []).join(', ')}
            setTags={(tagsString) => {
              // Store changes locally in the component, not in the global state
              // This will be handled by onSaveEdit
            }}
            allTags={allTags}
            isGlobal={isGlobal}
            setIsGlobal={(value) => actions.setIsGlobal(value)}
            editingId={editingId}
            originalNote={currentNote}
            onAdd={() => actions.cancelEdit()}
            onCancel={() => actions.cancelEdit()}
            onSaveEdit={(id, updates) => {
              // Add note to backend when saving for the first time
              actions.addNote({ id, ...updates });
              actions.cancelEdit();
            }}
          />
        )
      )}
      
      {!isAdding && !viewingId && (
        <>
          <View style={styles.actionButtons}>
            <Pressable 
              onPress={() => handleStartAddNote('note')}
              style={styles.iconButton}
            >
              <Text style={styles.iconButtonText}>📝</Text>
              <Text style={styles.iconButtonLabel}>Note</Text>
            </Pressable>
            <Pressable 
              onPress={() => handleStartAddNote('list')}
              style={styles.iconButton}
            >
              <Text style={styles.iconButtonText}>🧾</Text>
              <Text style={styles.iconButtonLabel}>List</Text>
            </Pressable>
          </View>
          
          <NoteList
            notes={visibleNotes}
            startEdit={(note) => actions.editNote(note.id)}
            deleteNote={actions.deleteNote}
            activeTag={activeTag}
            setActiveTag={actions.setActiveTag}
            allTags={allTags}
            onStartAdd={handleStartAddNote}
            onViewNote={actions.viewNote}
            onRefresh={async () => {
              // Force sync with server when user pulls to refresh
              await actions.syncWithServer(true);
              return true;
            }}
          />
        </>
      )}
      
      {/* Sync status footer */}
      {lastSyncedAt > 0 && (
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.subtext }]}>
            Last synced at: {new Date(lastSyncedAt).toLocaleTimeString()}
            {'\n'}
            Connected to: {serverUrl || 'default server'}
          </Text>
        </View>
      )}
      
      {/* Modals */}
      <Modal visible={settingsModal.isVisible} onClose={settingsModal.hide}>
        <SettingsScreen onClose={settingsModal.hide} />
      </Modal>
      
      <Modal visible={adminErrorModal.isVisible} onClose={adminErrorModal.hide}>
        <AdminErrorScreen onClose={adminErrorModal.hide} />
      </Modal>
      
      <Modal visible={networkDebugModal.isVisible} onClose={networkDebugModal.hide} fullScreen>
        <NetworkDebugScreen onClose={networkDebugModal.hide} />
      </Modal>
      
      <Modal visible={usernameModal.isVisible} onClose={() => {}}>
        <UsernamePrompt onSave={usernameModal.hide} />
      </Modal>
    </View>
  );
}

/**
 * Username prompt component
 * @param {Object} props - Component props
 * @param {Function} props.onSave - Function to call when username is saved
 * @returns {React.ReactNode}
 */
function UsernamePrompt({ onSave }) {
  const [usernameInput, setUsernameInput] = React.useState('');
  const { setUsername } = useSettings();
  
  const handleSave = () => {
    if (usernameInput.trim()) {
      setUsername(usernameInput.trim());
      onSave();
    }
  };
  
  return (
    <View style={styles.usernamePrompt}>
      <Text style={styles.modalTitle}>Enter a username</Text>
      <TextInput
        value={usernameInput}
        onChangeText={setUsernameInput}
        placeholder="Enter your username"
      />
      <Button title="Save" onPress={handleSave} style={styles.saveButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  menuButtonText: {
    fontSize: 18,
  },
  filterBanner: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  filterText: {
    marginBottom: 4,
  },
  filterTag: {
    fontWeight: 'bold',
  },
  clearFilter: {
    color: '#cc3333',
    marginTop: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  usernamePrompt: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  saveButton: {
    marginTop: 10,
  },
  iconButton: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  iconButtonText: {
    fontSize: 32,
    marginBottom: 4,
  },
  iconButtonLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NoteApp;
