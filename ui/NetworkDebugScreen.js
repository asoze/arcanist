import React, { useState } from 'react';
import { ScrollView, Button, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export default function NetworkDebugScreen() {
    const [log, setLog] = useState([]);

    const push = (msg) => setLog((prev) => [...prev, msg]);

    async function run() {
        // device connectivity
        const info = await NetInfo.fetch();
        push(`📶  ${info.type} / connected=${info.isConnected}`);

        // one real fetch to your API
        const t0 = Date.now();
        try {
            const res = await fetch('https://home.andrewrsweeney.com/notes');
            push(`✅  ${res.status} ${res.statusText} (${Date.now() - t0} ms)`);
        } catch (e) {
            push(`❌  fetch error: ${e.message}`);
        }

        push('ℹ️  Check adb / Xcode logs for SSL or policy errors');
    }

    return (
        <ScrollView style={styles.root}>
            <Button title="Run network tests" onPress={run} />
            {log.map((l, i) => (
                <Text key={i} style={styles.line}>{l}</Text>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, padding: 16 },
    line: { marginTop: 8, fontFamily: 'Courier' },
});
