import React from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";
import { stringToColor } from "../utils/stringToColor";
import Markdown from "react-native-markdown-display";

export default function NoteViewer({ note, onEdit, onBack, isDark }) {
    if (!note) return null;

    const styles = createStyles(isDark);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{note.title || "Untitled Note"}</Text>

            <ScrollView style={styles.content}>
                <Markdown style={{ body: styles.noteText }}>
                    {note.content?.text || note.text}
                </Markdown>
                {note.tags?.length > 0 && (
                    <View style={styles.tags}>
                        <Text style={styles.tagsLabel}>Tags:</Text>
                        <View style={styles.tagContainer}>
                            {note.tags.map((tag) => (
                                <View key={tag} style={[styles.tagBadge, { backgroundColor: stringToColor(tag) }]}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={styles.buttons}>
                <Button title="Edit" onPress={onEdit} />
                <View style={styles.spacer} />
                <Button title="Back" onPress={onBack} color="#999" />
            </View>
        </View>
    );
}

const createStyles = (isDark) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: isDark ? "#2b2b2b" : "#ffffff",
        },
        title: {
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 16,
            color: isDark ? "#eee" : "#000",
        },
        content: {
            flex: 1,
            marginBottom: 20,
        },
        noteText: {
            fontSize: 16,
            color: isDark ? "#ccc" : "#333",
        },
        tags: {
            marginTop: 16,
        },
        tagsLabel: {
            fontWeight: "bold",
            color: isDark ? "#bbb" : "#444",
        },
        tagContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 8,
        },
        tagBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
        },
        tagText: {
            fontSize: 12,
            color: isDark ? "#eee" : "#333",
        },
        buttons: {
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 10,
        },
        spacer: {
            width: 10,
        },
    });
