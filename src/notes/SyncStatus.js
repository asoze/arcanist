import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { useNotes } from './NotesContext';
import { useColors } from '../theme';

export function describeSync(status) {
  if (!status.enabled) return { label: 'Local only', tone: 'muted' };
  if (status.syncing) return { label: 'Syncing…', tone: 'muted' };
  if (status.error) return { label: 'Not synced', tone: 'error' };
  if (status.pendingCount > 0) return { label: `${status.pendingCount} unsynced`, tone: 'muted' };
  if (status.lastSyncedAt) return { label: 'Synced', tone: 'muted' };
  return { label: '', tone: 'muted' };
}

export function SyncStatus() {
  const router = useRouter();
  const { colors } = useColors();
  const { status } = useNotes();
  const { label, tone } = describeSync(status);

  return (
    <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="Settings">
      <Text style={[styles.text, { color: tone === 'error' ? colors.error : colors.muted }]}>
        {label ? `${label}  ·  ` : ''}
        <Text style={{ color: colors.accent }}>Settings</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 15, paddingHorizontal: 8 },
});
