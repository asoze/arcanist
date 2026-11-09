import { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { useNotes } from '../src/notes/NotesContext';
import { SyncStatus } from '../src/notes/SyncStatus';
import { htmlToPreview } from '../src/notes/preview';
import { useSettings } from '../src/settings/SettingsContext';
import { useColors } from '../src/theme';

function formatUpdated(timestamp) {
  const date = new Date(timestamp);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function TagChip({ label, active, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.tag,
        { borderColor: active ? colors.accent : colors.border },
        active && { backgroundColor: colors.accent },
      ]}
    >
      <Text style={[styles.tagText, { color: active ? '#ffffff' : colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

function Welcome({ colors }) {
  const router = useRouter();
  return (
    <View style={styles.welcome}>
      <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome to Arcanist</Text>
      <Text style={[styles.welcomeBody, { color: colors.muted }]}>
        Pick a username, and add your server details to sync notes between devices.
      </Text>
      <Pressable
        onPress={() => router.push('/settings')}
        accessibilityRole="button"
        style={[styles.welcomeButton, { backgroundColor: colors.accent }]}
      >
        <Text style={styles.welcomeButtonText}>Get started</Text>
      </Pressable>
    </View>
  );
}

export default function NoteList() {
  const router = useRouter();
  const { colors } = useColors();
  const settings = useSettings();
  const { notes, loaded, sync, createNote } = useNotes();
  const [activeTag, setActiveTag] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await sync();
    setRefreshing(false);
  };

  const allTags = useMemo(
    () => [...new Set(notes.flatMap((note) => note.tags))].sort((a, b) => a.localeCompare(b)),
    [notes]
  );

  const visibleNotes = useMemo(
    () =>
      notes
        .filter((note) => !activeTag || note.tags.includes(activeTag))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [notes, activeTag]
  );

  const openNew = () => {
    const id = createNote();
    router.push({ pathname: '/note/[id]', params: { id, isNew: '1' } });
  };

  const header = <Stack.Screen options={{ headerRight: () => <SyncStatus /> }} />;

  if (!settings.loaded || !loaded) return header;
  if (!settings.username) {
    return (
      <>
        {header}
        <Welcome colors={colors} />
      </>
    );
  }

  return (
    <View style={[styles.screen, Platform.OS === 'web' && styles.screenWide]}>
      {header}
      {allTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagBar}
          contentContainerStyle={styles.tagBarContent}
        >
          <TagChip label="All" active={!activeTag} onPress={() => setActiveTag(null)} colors={colors} />
          {allTags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              active={activeTag === tag}
              onPress={() => setActiveTag(activeTag === tag ? null : tag)}
              colors={colors}
            />
          ))}
        </ScrollView>
      )}

      <FlatList
        data={visibleNotes}
        keyExtractor={(note) => note.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={refresh}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.muted }]}>No notes yet. Tap + to start one.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/note/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}
          >
            <View style={styles.rowHeader}>
              <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title || 'Untitled'}
              </Text>
              <Text style={[styles.rowDate, { color: colors.muted }]}>{formatUpdated(item.updatedAt)}</Text>
            </View>
            <Text style={[styles.rowPreview, { color: colors.muted }]} numberOfLines={2}>
              {htmlToPreview(item.html) || 'No content'}
            </Text>
            <View style={styles.rowFooter}>
              {item.tags.length > 0 && (
                <Text style={[styles.rowTags, { color: colors.accent }]} numberOfLines={1}>
                  {item.tags.map((tag) => `#${tag}`).join('  ')}
                </Text>
              )}
              {item.createdBy && item.createdBy !== settings.username ? (
                <Text style={[styles.rowMeta, { color: colors.muted }]}>from {item.createdBy}</Text>
              ) : (
                item.shared && <Text style={[styles.rowMeta, { color: colors.muted }]}>Shared</Text>
              )}
            </View>
          </Pressable>
        )}
      />

      <Pressable
        onPress={openNew}
        accessibilityRole="button"
        accessibilityLabel="New note"
        style={[styles.fab, { backgroundColor: colors.accent }]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenWide: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  tagBar: { flexGrow: 0 },
  tagBarContent: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 14 },
  list: { paddingBottom: 96 },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  row: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  rowHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  rowTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  rowDate: { fontSize: 13 },
  rowPreview: { fontSize: 15, lineHeight: 20 },
  rowFooter: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  rowTags: { flex: 1, fontSize: 13 },
  rowMeta: { marginLeft: 'auto', fontSize: 13 },
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  welcomeTitle: { fontSize: 24, fontWeight: '700' },
  welcomeBody: { fontSize: 16, lineHeight: 22, textAlign: 'center', maxWidth: 360 },
  welcomeButton: { marginTop: 8, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  welcomeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 48, fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: '#ffffff', fontSize: 30, lineHeight: 32 },
});
