import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import PropTypes from 'prop-types';
import { useRouter } from 'expo-router';

import { useThemeContext as useTheme } from '../store/ThemeContext';
import { useModal } from '../hooks/useModal';
import { useNotes } from '../store/NotesContext';
import { useErrorHandler } from '../utils/errorHandler';
import { stringToColor, generatePreview, generateListPreview } from 'arcanist-common';
import { createCommonStyles, createResponsiveStyles } from '../styles/commonStyles';
import { ConfirmationModal } from './common/ConfirmationModal';

/**
 * Individual note item component for better performance and separation of concerns
 */
const NoteItem = React.memo(({ 
  item, 
  onView, 
  onDelete, 
  onTagPress, 
  activeTag,
  theme,
  commonStyles,
  responsive 
}) => {
  const markdownStyles = useMemo(() => ({
    body: {
      color: theme.colors.text,
      fontSize: responsive.bodySize,
    },
    heading1: { 
      fontSize: responsive.titleSize + 4, 
      marginBottom: theme.spacing.xs,
      color: theme.colors.text,
    },
    heading2: { 
      fontSize: responsive.titleSize, 
      marginBottom: theme.spacing.xs,
      color: theme.colors.text,
    },
    heading3: { color: theme.colors.text },
    heading4: { color: theme.colors.text },
    heading5: { color: theme.colors.text },
    heading6: { color: theme.colors.text },
    link: { color: theme.colors.primary },
  }), [theme.colors, responsive]);

  const itemStyles = useMemo(() => ({
    noteItem: {
      ...commonStyles.listItem,
      minHeight: responsive.isSmall ? 80 : 100,
    },
    noteTitle: {
      ...commonStyles.subtitle,
      fontSize: responsive.titleSize,
      marginBottom: theme.spacing.xs,
    },
    preview: {
      ...commonStyles.body,
      fontStyle: 'italic',
      color: theme.colors.subtext,
      marginBottom: theme.spacing.xs,
      fontSize: responsive.bodySize,
    },
    timestamp: {
      ...commonStyles.caption,
      marginBottom: theme.spacing.xs,
    },
    lastEditedBy: {
      ...commonStyles.caption,
      fontSize: responsive.bodySize - 2,
      color: theme.colors.subtext,
      fontStyle: 'italic',
      marginBottom: theme.spacing.xs / 2,
    },
    sharedLabel: {
      ...commonStyles.caption,
      fontWeight: 'bold',
      color: theme.colors.success,
      marginBottom: theme.spacing.xs,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.xs,
    },
    activeTag: {
      borderWidth: 1,
      borderColor: theme.colors.text,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
  }), [theme, commonStyles, responsive]);

  return (
    <View style={itemStyles.noteItem}>
      <Pressable
        style={[commonStyles.flex1, commonStyles.touchable]}
        onPress={() => onView(item.id)}
      >
        {(item.sharing?.isShared || item.username === "All") && (
          <Text style={itemStyles.sharedLabel}>🌐 Shared</Text>
        )}
        <Text style={itemStyles.noteTitle}>
          {item.type === "list" ? "🧾 " : "📝 "}
          {item.title}
        </Text>
        {item.type === "list" ? (
          <Text style={itemStyles.preview}>
            {generateListPreview(item.items)}
          </Text>
        ) : (
          item.content?.text && (
            <Markdown style={{ body: itemStyles.preview }}>
              {generatePreview(item.content.text)}
            </Markdown>
          )
        )}
        <View style={itemStyles.tagsContainer}>
          {item.tags?.map((tag, i) => (
            <Pressable
              key={i}
              style={[
                commonStyles.tag,
                { backgroundColor: stringToColor(tag) },
                activeTag === tag && itemStyles.activeTag,
              ]}
              onPress={(event) => {
                event.stopPropagation();
                onTagPress(tag);
              }}
            >
              <Text style={commonStyles.tagText}>{tag}</Text>
            </Pressable>
          ))}
        </View>
        {item.lastModifiedBy && (
          <Text style={itemStyles.lastEditedBy}>
            Last edited by {item.lastModifiedBy}
          </Text>
        )}
        <Text style={itemStyles.timestamp}>
          {new Date(item.lastModifiedOn || item.updatedAt).toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })}
        </Text>
      </Pressable>

      <View style={itemStyles.actionButtons}>
        <Pressable
          onPress={() => onDelete(item.id)}
          style={commonStyles.dangerButton}
          accessibilityLabel="Delete note"
          accessibilityRole="button"
        >
          <Text style={commonStyles.dangerButtonText}>×</Text>
        </Pressable>
      </View>
    </View>
  );
});

NoteItem.propTypes = {
  item: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onTagPress: PropTypes.func.isRequired,
  activeTag: PropTypes.string,
  theme: PropTypes.object.isRequired,
  commonStyles: PropTypes.object.isRequired,
  responsive: PropTypes.object.isRequired,
};

/**
 * Main NoteList component with reduced prop drilling and improved performance
 */
export default function NoteList({ onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const { width } = useWindowDimensions();
  const router = useRouter();
  
  const { 
    visibleNotes, 
    allTags, 
    activeTag, 
    actions 
  } = useNotes();
  
  const { theme } = useTheme();
  const { handleError } = useErrorHandler();
  
  const deleteModal = useModal(false);

  // Responsive styles
  const responsive = useMemo(() => createResponsiveStyles(width), [width]);
  const commonStyles = useMemo(() => createCommonStyles(theme), [theme]);

  // Memoized refresh handler with error handling
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        handleError(error, 'NoteList.handleRefresh');
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh, handleError]);

  const handleView = useCallback((noteId) => {
    router.push(`/note/${noteId}`);
  }, [router]);

  const handleDeleteRequest = useCallback((noteId) => {
    const note = visibleNotes.find(n => n.id === noteId);
    setNoteToDelete(note);
    deleteModal.show();
  }, [visibleNotes, deleteModal]);
  
  const handleConfirmDelete = useCallback(() => {
    if (noteToDelete) {
      try {
        actions.deleteNote(noteToDelete.id);
        setNoteToDelete(null);
        deleteModal.hide();
      } catch (error) {
        handleError(error, 'NoteList.handleConfirmDelete');
      }
    }
  }, [noteToDelete, actions, deleteModal, handleError]);
  
  const handleCancelDelete = useCallback(() => {
    setNoteToDelete(null);
    deleteModal.hide();
  }, [deleteModal]);

  const handleTagPress = useCallback((tag) => {
    actions.setActiveTag(tag);
  }, [actions]);

  const renderItem = useCallback(({ item }) => (
    <NoteItem
      item={item}
      onView={handleView}
      onDelete={handleDeleteRequest}
      onTagPress={handleTagPress}
      activeTag={activeTag}
      theme={theme}
      commonStyles={commonStyles}
      responsive={responsive}
    />
  ), [
    handleView, handleDeleteRequest, handleTagPress, activeTag,
    theme, commonStyles, responsive
  ]);

  // Memoized sorted notes
  const sortedNotes = useMemo(() => 
    [...visibleNotes].sort((a, b) => (b.lastModifiedOn || b.updatedAt) - (a.lastModifiedOn || a.updatedAt)), 
    [visibleNotes]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const listStyles = useMemo(() => ({
    list: { 
      marginTop: theme.spacing.md,
      paddingHorizontal: responsive.containerPadding,
    },
  }), [theme.spacing, responsive]);

  return (
    <>
      <FlatList
        data={sortedNotes}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        style={listStyles.list}
        refreshControl={
          <RefreshControl
            testID="refresh-control"
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]} // Android
            tintColor={theme.colors.primary} // iOS
          />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        showsVerticalScrollIndicator={false}
      />
      
      {noteToDelete && (
        <ConfirmationModal
          visible={deleteModal.isVisible}
          title="Delete Note"
          message={`Are you sure you want to delete "${noteToDelete.title || 'this note'}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          confirmVariant="danger"
        />
      )}
    </>
  );
}

NoteList.propTypes = {
  onRefresh: PropTypes.func,
};

NoteList.defaultProps = {
  onRefresh: null,
};
