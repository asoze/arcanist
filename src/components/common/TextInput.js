// src/components/common/TextInput.js
import React from 'react';
import { TextInput as RNTextInput, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * Reusable text input component with consistent styling
 * @param {Object} props - Component props
 * @param {string} props.value - Input value
 * @param {Function} props.onChangeText - Function to call when text changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.multiline - Whether the input is multiline
 * @param {number} props.numberOfLines - Number of lines for multiline input
 * @param {boolean} props.secureTextEntry - Whether to hide the text (for passwords)
 * @param {string} props.label - Label text to display above the input
 * @param {string} props.error - Error message to display below the input
 * @param {Object} props.style - Additional style for the input
 * @param {Object} props.containerStyle - Additional style for the container
 * @param {Object} props.labelStyle - Additional style for the label
 * @param {Object} props.errorStyle - Additional style for the error message
 * @returns {React.ReactNode}
 */
export function TextInput({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  label,
  error,
  style,
  containerStyle,
  labelStyle,
  errorStyle,
  ...rest
}) {
  const { isDark, theme } = useTheme();
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[
          styles.label, 
          { color: theme.colors.text },
          labelStyle
        ]}>
          {label}
        </Text>
      )}
      
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? theme.colors.subtext : '#999'}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          {
            color: theme.colors.text,
            borderColor: error ? theme.colors.error : theme.colors.border,
            backgroundColor: isDark ? theme.colors.surface : '#fff',
          },
          multiline && styles.multiline,
          style,
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...rest}
      />
      
      {error && (
        <Text style={[
          styles.error, 
          { color: theme.colors.error },
          errorStyle
        ]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  multiline: {
    minHeight: 100,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
  },
});

export default TextInput;
