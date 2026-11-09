import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext as useTheme } from '../store/ThemeContext';

export function SyncStatus({ lastSyncedAt, serverUrl }) {
  const { theme } = useTheme();

  if (!lastSyncedAt || lastSyncedAt <= 0) return null;

  return (
    <View style={styles.footer}>
      <Text style={[styles.footerText, { color: theme.colors.subtext }]}>
        Last synced at: {new Date(lastSyncedAt).toLocaleTimeString()}
        {'\n'}
        Connected to: {serverUrl || 'default server'}
      </Text>
    </View>
  );
}

SyncStatus.propTypes = {
  lastSyncedAt: PropTypes.number,
  serverUrl: PropTypes.string,
};

const styles = StyleSheet.create({
  footer: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
