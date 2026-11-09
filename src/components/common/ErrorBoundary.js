import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';

/**
 * Error boundary component - catches React errors and shows a fallback UI
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Function} [props.onRetry] - Called when user taps Retry
 * @param {Object} [props.theme] - Theme colors for fallback UI
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const { theme } = this.props;
      const colors = theme?.colors || { text: '#333', subtext: '#666', background: '#fff' };

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
          <Text style={[styles.message, { color: colors.subtext }]}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          {this.props.onRetry && (
            <Button title="Retry" onPress={this.handleRetry} style={styles.button} />
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 120,
  },
});
