import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotes } from '../src/store/NotesContext';
import { useSettings } from '../src/store/SettingsContext';
import { useModal } from '../src/hooks/useModal';

import { Button } from '../src/components/common/Button';
import { OfflineNotice } from '../src/components/common/OfflineNotice';
import { ResponsiveContainer } from '../src/components/common/ResponsiveContainer';
import { AppHeader } from '../src/components/AppHeader';
import { FilterBanner } from '../src/components/FilterBanner';
import { ActionButtons } from '../src/components/ActionButtons';
import { SyncStatus } from '../src/components/SyncStatus';
import { Modal } from '../src/components/common/Modal';
import NoteList from '../src/components/NoteList';

import { UsernamePrompt } from '../src/components/UsernamePrompt';

export default function HomeScreen() {
  const router = useRouter();

  const {
    activeTag,
    lastSyncedAt,
    actions,
  } = useNotes();

  const { isDark, theme, username, serverUrl, isLoading } = useSettings();

  const usernameModal = useModal(false);

  useEffect(() => {
    if (!isLoading && !username) {
      usernameModal.show();
    }
  }, [isLoading, username]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartAddNote = useCallback((type = 'note') => {
    router.push(`/new?type=${type}`);
  }, [router]);

  const handleRefresh = useCallback(async () => {
    await actions.syncWithServer(true);
    return true;
  }, [actions]);

  const handleClearFilter = useCallback(() => {
    actions.setActiveTag(null);
  }, [actions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ResponsiveContainer>
        <OfflineNotice />

        {username ? (
          <>
            <AppHeader />

            <FilterBanner
              activeTag={activeTag}
              onClearFilter={handleClearFilter}
            />

            <View style={{ flex: 1 }}>
              <ActionButtons
                onAddNote={handleStartAddNote}
                onAddList={handleStartAddNote}
              />
              <NoteList onRefresh={handleRefresh} />
            </View>

            <SyncStatus lastSyncedAt={lastSyncedAt} serverUrl={serverUrl} />
          </>
        ) : (
          <View style={styles.welcomeContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Welcome to Arcanist!
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
              Please set up your username to get started.
            </Text>
            <Button
              title="Set up username"
              onPress={usernameModal.show}
              style={styles.getStartedButton}
            />
          </View>
        )}

        <Modal visible={usernameModal.isVisible} onClose={() => {}}>
          <UsernamePrompt onSave={usernameModal.hide} />
        </Modal>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  getStartedButton: {
    marginTop: 20,
  },
});
