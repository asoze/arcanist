// src/components/common/Button.js
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * Reusable button component with consistent styling
 * @param {Object} props - Component props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {string} props.variant - Button variant ('primary', 'secondary', 'danger', 'success')
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {Object} props.style - Additional style for the button
 * @param {Object} props.textStyle - Additional style for the button text
 * @returns {React.ReactNode}
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}) {
  const { theme } = useTheme();
  
  // Determine button colors based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          textColor: '#fff',
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
          textColor: '#fff',
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          textColor: '#fff',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: 1,
        };
      case 'primary':
      default:
        return {
          backgroundColor: theme.colors.primary,
          textColor: '#fff',
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: variantStyles.backgroundColor },
        variantStyles.borderColor && { borderColor: variantStyles.borderColor },
        variantStyles.borderWidth && { borderWidth: variantStyles.borderWidth },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          { color: variantStyles.textColor },
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  disabledText: {
    color: '#999',
  },
});

export default Button;
