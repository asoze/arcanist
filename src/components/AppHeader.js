import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext as useTheme } from '../store/ThemeContext';

export function AppHeader() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Arcanist</Text>
      
      <Pressable
        onPress={() => router.push('/settings')}
        style={[styles.menuButton, { borderColor: theme.colors.border }]}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
      >
        <Text style={[styles.menuButtonText, { color: theme.colors.text }]}>☰</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 18,
  },
});
