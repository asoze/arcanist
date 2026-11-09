import React from 'react';
import { View, Text, StyleSheet, ScrollView, PanResponder, Animated } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { useThemeContext as useTheme } from '../store/ThemeContext';
import { stringToColor } from 'arcanist-common';
import { Button } from './common/Button';

export default function NoteViewer({ note, onEdit, onBack }) {
    const { isDark, theme } = useTheme();
    const styles = createStyles(theme);
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

    if (!note) return null;

    return (
        <Animated.View 
            style={[styles.container, { transform: [{ translateX }] }]}
            {...panResponder.panHandlers}
        >
                <Text style={styles.title}>{note.title || "Untitled Note"}</Text>

                <ScrollView style={styles.content}>
                    <Markdown style={markdownStyles(theme)}>
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
                    <Button title="Back" onPress={onBack} variant="secondary" />
                </View>
        </Animated.View>
    );
}

const createStyles = (theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.background,
        },
        title: {
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: theme.spacing.md,
            color: theme.colors.text,
        },
        content: {
            flex: 1,
            marginBottom: theme.spacing.lg,
        },
        noteText: {
            fontSize: 16,
            color: theme.colors.text,
        },
        tags: {
            marginTop: theme.spacing.md,
        },
        tagsLabel: {
            fontWeight: "bold",
            color: theme.colors.text,
        },
        tagContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.spacing.xs + 2,
            marginTop: theme.spacing.sm,
        },
        tagBadge: {
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            borderRadius: theme.roundness + 4,
        },
        tagText: {
            fontSize: 12,
            color: '#fff',
        },
        buttons: {
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: theme.spacing.sm + 2,
            gap: theme.spacing.sm + 2,
        },
        spacer: {
            width: theme.spacing.sm + 2,
        },
    });

const markdownStyles = (theme) => ({
    body: {
        fontSize: 16,
        color: theme.colors.text,
    },
    heading1: { 
        fontSize: 24, 
        marginBottom: theme.spacing.sm,
        color: theme.colors.text,
    },
    heading2: { 
        fontSize: 20, 
        marginBottom: theme.spacing.xs + 2,
        color: theme.colors.text,
    },
    heading3: { 
        color: theme.colors.text,
    },
    heading4: { 
        color: theme.colors.text,
    },
    heading5: { 
        color: theme.colors.text,
    },
    heading6: { 
        color: theme.colors.text,
    },
    link: { color: theme.colors.primary },
});
