// src/hooks/useModal.js
import { useState, useCallback } from 'react';

/**
 * Custom hook for modal management
 * @param {boolean} initialState - Initial visibility state
 * @returns {Object} Modal state and functions
 */
export function useModal(initialState = false) {
  const [isVisible, setIsVisible] = useState(initialState);
  
  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible(prev => !prev), []);
  
  return {
    isVisible,
    show,
    hide,
    toggle
  };
}
