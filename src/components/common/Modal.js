// src/components/common/Modal.js
import React from 'react';
import { View, StyleSheet, Modal as RNModal, Pressable, TouchableWithoutFeedback } from 'react-native';
import { useThemeContext as useTheme } from '../../store/ThemeContext';

/**
 * Reusable modal component with consistent styling
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {React.ReactNode} props.children - Modal content
 * @param {Object} props.style - Additional style for the modal content
 * @param {boolean} props.fullScreen - Whether the modal should take up the full screen
 * @returns {React.ReactNode}
 */
export function Modal({ 
  visible, 
  onClose, 
  children, 
  style,
  fullScreen = false
}) {
  const { isDark, theme } = useTheme();
  
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      {fullScreen ? (
        <View style={[styles.fullScreenContainer, { backgroundColor: theme.colors.surface }]}>
          {children}
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View 
                style={[
                  styles.content,
                  { backgroundColor: theme.colors.surface },
                  style
                ]}
              >
                {children}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default Modal;
