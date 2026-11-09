import { DEFAULT_NOTES_ENDPOINT } from '../constants/api';

/**
 * Resolve the notes API endpoint URL from a server URL
 * @param {string|null|undefined} serverUrl - Base server URL (e.g. https://example.com)
 * @returns {string} Full URL to /notes endpoint
 */
export function resolveNotesUrl(serverUrl) {
  if (typeof serverUrl === 'string' && serverUrl.trim()) {
    const trimmed = serverUrl.trim();
    return trimmed.endsWith('/notes') ? trimmed : `${trimmed.replace(/\/$/, '')}/notes`;
  }
  return DEFAULT_NOTES_ENDPOINT;
}
