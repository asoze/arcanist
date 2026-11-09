import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../store/SettingsContext';
import { useThemeContext as useTheme } from '../store/ThemeContext';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';

export function UsernamePrompt({ onSave }) {
  const [usernameInput, setUsernameInput] = useState('');
  const { setUsername } = useSettings();
  const { theme } = useTheme();

  const handleSave = useCallback(() => {
    if (usernameInput.trim()) {
      setUsername(usernameInput.trim());
      onSave();
    }
  }, [usernameInput, setUsername, onSave]);

  const handleKeyPress = useCallback((event) => {
    if (event.nativeEvent.key === 'Enter') {
      handleSave();
    }
  }, [handleSave]);

  return (
    <View style={[styles.usernamePrompt, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
        Welcome to Arcanist!
      </Text>
      <Text style={[styles.modalSubtitle, { color: theme.colors.subtext }]}>
        Please enter a username to get started:
      </Text>
      <TextInput
        value={usernameInput}
        onChangeText={setUsernameInput}
        placeholder="Enter your username"
        onKeyPress={handleKeyPress}
        autoFocus={true}
        style={styles.usernameInput}
      />
      <Button
        title="Save"
        onPress={handleSave}
        style={styles.saveButton}
        disabled={!usernameInput.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  usernamePrompt: {
    padding: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  usernameInput: {
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 10,
  },
});
