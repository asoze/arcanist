import React from 'react';
import { logError } from './logger';

/**
 * Error types for consistent error handling
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  STORAGE: 'STORAGE',
  SYNC: 'SYNC',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.context = context;
    this.timestamp = Date.now();
  }
}

/**
 * Error handler utility for consistent error processing
 */
export class ErrorHandler {
  /**
   * Handle and categorize errors
   * @param {Error} error - The error to handle
   * @param {string} context - Context where the error occurred
   * @returns {AppError} - Processed error
   */
  static handle(error, context = 'Unknown') {
    let appError;

    if (error instanceof AppError) {
      appError = error;
    } else {
      // Categorize error based on message and properties
      const type = this.categorizeError(error);
      appError = new AppError(error.message, type, { 
        originalError: error,
        context,
        stack: error.stack 
      });
    }

    // Log the error
    logError(`[${context}] ${appError.type}: ${appError.message}`, appError.context);

    return appError;
  }

  /**
   * Categorize error based on its properties
   * @param {Error} error - The error to categorize
   * @returns {string} - Error type
   */
  static categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch') || message.includes('offline')) {
      return ErrorTypes.NETWORK;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorTypes.VALIDATION;
    }
    
    if (message.includes('storage') || message.includes('asyncstorage')) {
      return ErrorTypes.STORAGE;
    }
    
    if (message.includes('sync') || message.includes('reconcile')) {
      return ErrorTypes.SYNC;
    }
    
    return ErrorTypes.UNKNOWN;
  }

  /**
   * Get user-friendly error message
   * @param {AppError} error - The error to get message for
   * @returns {string} - User-friendly message
   */
  static getUserMessage(error) {
    switch (error.type) {
      case ErrorTypes.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      case ErrorTypes.VALIDATION:
        return 'Invalid input. Please check your data and try again.';
      case ErrorTypes.STORAGE:
        return 'Storage issue. Please restart the app and try again.';
      case ErrorTypes.SYNC:
        return 'Sync issue. Your changes are saved locally and will sync when connection is restored.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error is recoverable
   * @param {AppError} error - The error to check
   * @returns {boolean} - Whether the error is recoverable
   */
  static isRecoverable(error) {
    return [ErrorTypes.NETWORK, ErrorTypes.SYNC].includes(error.type);
  }
}

/**
 * Higher-order function to wrap async functions with error handling
 * @param {Function} fn - The async function to wrap
 * @param {string} context - Context for error handling
 * @returns {Function} - Wrapped function
 */
export const withErrorHandling = (fn, context) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw ErrorHandler.handle(error, context);
    }
  };
};

/**
 * React hook for error state management
 * @returns {object} - Error state and handlers
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((error, context) => {
    const appError = ErrorHandler.handle(error, context);
    setError(appError);
    return appError;
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const retryAction = React.useCallback((action) => {
    if (error && ErrorHandler.isRecoverable(error)) {
      clearError();
      return action();
    }
  }, [error, clearError]);

  return {
    error,
    hasError: !!error,
    errorMessage: error ? ErrorHandler.getUserMessage(error) : null,
    isRecoverable: error ? ErrorHandler.isRecoverable(error) : false,
    handleError,
    clearError,
    retryAction,
  };
};
