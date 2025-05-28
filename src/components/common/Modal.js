// src/components/common/Modal.js
import React from 'react';
import { View, StyleSheet, Modal as RNModal, Pressable } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

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
    >
      <Pressable 
        style={styles.overlay} 
        onPress={onClose}
      >
        <Pressable 
          style={[
            styles.content,
            { backgroundColor: theme.colors.surface },
            fullScreen && styles.fullScreen,
            style
          ]}
          onPress={e => e.stopPropagation()}
        >
          {children}
        </Pressable>
      </Pressable>
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
  fullScreen: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
});

export default Modal;
