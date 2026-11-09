import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext as useTheme } from '../../store/ThemeContext';
import { Modal } from './Modal';
import { Button } from './Button';

/**
 * Reusable confirmation modal component
 * @param {boolean} visible - Whether the modal is visible
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: "Delete")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {function} onConfirm - Callback when user confirms
 * @param {function} onCancel - Callback when user cancels
 * @param {string} confirmVariant - Button variant for confirm button (default: "danger")
 */
export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "danger"
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal visible={visible} onClose={onCancel}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title={cancelText}
            onPress={onCancel}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title={confirmText}
            onPress={onConfirm}
            variant={confirmVariant}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
}

export default ConfirmationModal;

const createStyles = (theme) => StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
  },
});
