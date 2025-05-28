import React from "react";
import { View, Text, Button, StyleSheet, ScrollView, PanResponder, Animated } from "react-native";
import { stringToColor } from "../utils/stringToColor";
import Markdown from "react-native-markdown-display";

export default function NoteViewer({ note, onEdit, onBack, isDark }) {
    if (!note) return null;

    const styles = createStyles(isDark);
    
    // Gesture handling for swipe-to-go-back using PanResponder
    const translateX = React.useRef(new Animated.Value(0)).current;
    
    const panResponder = React.useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Only respond to horizontal swipes
                return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: (evt, gestureState) => {
                // Only allow right swipe (positive dx)
                if (gestureState.dx > 0) {
                    translateX.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx > 100) {
                    // If swiped more than 100 pixels to the right, go back
                    onBack();
                } else {
                    // Spring back to original position
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Animated.View 
            style={[styles.container, { transform: [{ translateX }] }]}
            {...panResponder.panHandlers}
        >
                <Text style={styles.title}>{note.title || "Untitled Note"}</Text>

                <ScrollView style={styles.content}>
                    <Markdown style={markdownStyles(isDark)}>
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
        </Animated.View>
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

const markdownStyles = (isDark) => ({
    body: {
        fontSize: 16,
        color: isDark ? "#eee" : "#333",
    },
    heading1: { 
        fontSize: 24, 
        marginBottom: 8,
        color: isDark ? "#eee" : "#000",
    },
    heading2: { 
        fontSize: 20, 
        marginBottom: 6,
        color: isDark ? "#eee" : "#000",
    },
    heading3: { 
        color: isDark ? "#eee" : "#000",
    },
    heading4: { 
        color: isDark ? "#eee" : "#000",
    },
    heading5: { 
        color: isDark ? "#eee" : "#000",
    },
    heading6: { 
        color: isDark ? "#eee" : "#000",
    },
    link: { color: isDark ? "#66aaff" : "#3366cc" },
});
