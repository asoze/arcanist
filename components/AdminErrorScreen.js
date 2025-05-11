import React from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { getErrorLog, clearErrorLog } from '../utils/logger';

const typeStyles = {
    info:     { emoji: 'ℹ️',  color: '#007AFF' },
    warning:  { emoji: '⚠️',  color: '#FFA500' },
    error:    { emoji: '❌',  color: '#FF3B30' },
    critical: { emoji: '🔥',  color: '#C00000' },
    default:  { emoji: '📝',  color: '#999999' },
};

export default function AdminErrorScreen({ onClose }) {
    const [errors, setErrors] = React.useState(getErrorLog());
    const [filterType, setFilterType] = React.useState("all");

    const handleClear = () => {
        clearErrorLog();
        setErrors([]);
    };

    const filtered = errors.filter(entry =>
        filterType === "all" || entry.type === filterType
    );

    return (
        <>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                Client Logs
            </Text>

            {/* Filter Buttons */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {["all", "info", "warning", "error", "critical"].map((type) => (
                    <View key={type} style={{ marginRight: 8, marginBottom: 8 }}>
                        <Button
                            title={type.toUpperCase()}
                            onPress={() => setFilterType(type)}
                            color={filterType === type ? '#333' : '#888'}
                        />
                    </View>
                ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <Button title="Clear Log" onPress={handleClear} />
                <View style={{ width: 10 }} />
                <Button title="Close" onPress={onClose} />
            </View>

            {/* Scrollable Log Entries */}
            <ScrollView style={{ marginTop: 10 }}>
                {filtered.length === 0 ? (
                    <Text>No messages logged.</Text>
                ) : (
                    filtered.map((entry, idx) => {
                        const style = typeStyles[entry.type] || typeStyles.default;
                        return (
                            <View key={idx} style={{ marginBottom: 14 }}>
                                <Text style={{ color: style.color, fontWeight: 'bold' }}>
                                    {style.emoji} {entry.type?.toUpperCase()} — {entry.timestamp}
                                </Text>
                                <Text style={{ color: '#333' }}>{entry.message}</Text>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </>
    );
}
