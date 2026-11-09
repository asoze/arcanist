import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useNotes } from '../src/notes/NotesContext';
import { describeSync } from '../src/notes/SyncStatus';
import { useSettings } from '../src/settings/SettingsContext';
import { createApi } from '../src/sync/api';
import { useColors } from '../src/theme';

function Field({ label, hint, colors, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        {...inputProps}
      />
      {hint ? <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text> : null}
    </View>
  );
}

function Button({ label, onPress, disabled, primary, colors }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        styles.button,
        { borderColor: colors.accent, opacity: disabled ? 0.5 : 1 },
        primary && { backgroundColor: colors.accent },
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? '#ffffff' : colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { loaded } = useSettings();
  return loaded ? <SettingsForm /> : null;
}

function SettingsForm() {
  const router = useRouter();
  const { colors } = useColors();
  const settings = useSettings();
  const { status, sync } = useNotes();
  const [form, setForm] = useState({
    username: settings.username,
    serverUrl: settings.serverUrl,
    apiToken: settings.apiToken,
  });
  const [testResult, setTestResult] = useState(null);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setTestResult(null);
  };

  const isFirstRun = !settings.username;
  const changed = Object.keys(form).some((key) => form[key].trim() !== settings[key]);
  const canSave = form.username.trim() && changed;

  const save = () => {
    settings.saveSettings(form);
    if (isFirstRun) router.back();
  };

  const testConnection = async () => {
    setTestResult({ tone: 'muted', message: 'Checking…' });
    try {
      const api = createApi(form);
      await api.health();
      await api.fetchChanges(Number.MAX_SAFE_INTEGER);
      setTestResult({ tone: 'ok', message: 'Connected. The server accepted the token.' });
    } catch (err) {
      setTestResult({ tone: 'error', message: err.message });
    }
  };

  const syncSummary = describeSync(status);
  const toneColor = (tone) => (tone === 'error' ? colors.error : tone === 'ok' ? colors.accent : colors.muted);

  return (
    <ScrollView contentContainerStyle={[styles.page, Platform.OS === 'web' && styles.pageWide]}>
      {isFirstRun && (
        <Text style={[styles.intro, { color: colors.muted }]}>
          Choose the name your notes are saved under. Server details are optional; without them, notes stay on this
          device.
        </Text>
      )}

      <Field
        label="Username"
        value={form.username}
        onChangeText={set('username')}
        placeholder="e.g. Andrew"
        hint="Your notes, and notes others share, are shown for this name. Changing it hides notes created under the old one."
        colors={colors}
      />
      <Field
        label="Server"
        value={form.serverUrl}
        onChangeText={set('serverUrl')}
        placeholder="https://notes.example.com"
        keyboardType="url"
        colors={colors}
      />
      <Field
        label="API token"
        value={form.apiToken}
        onChangeText={set('apiToken')}
        placeholder="The server's AUTH_TOKEN"
        secureTextEntry
        colors={colors}
      />

      <View style={styles.buttonRow}>
        <Button
          label="Test connection"
          onPress={testConnection}
          disabled={!form.serverUrl.trim()}
          colors={colors}
        />
        <Button label={isFirstRun ? 'Start' : 'Save'} onPress={save} disabled={!canSave} primary colors={colors} />
      </View>
      {testResult && <Text style={[styles.hint, { color: toneColor(testResult.tone) }]}>{testResult.message}</Text>}

      {!isFirstRun && (
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Sync</Text>
          <Text style={{ color: toneColor(syncSummary.tone) }}>
            {syncSummary.label || 'Not synced yet'}
            {status.lastSyncedAt ? ` · last synced ${new Date(status.lastSyncedAt).toLocaleTimeString()}` : ''}
          </Text>
          {status.error && <Text style={[styles.hint, { color: colors.error }]}>{status.error}</Text>}
          <View style={styles.buttonRow}>
            <Button label="Sync now" onPress={sync} disabled={!status.enabled || status.syncing} colors={colors} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16 },
  pageWide: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  intro: { fontSize: 15, lineHeight: 21 },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600' },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  hint: { fontSize: 13, lineHeight: 18 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  button: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  section: { gap: 8, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
