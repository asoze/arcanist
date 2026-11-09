/**
 * Shared fetch logic with retry, timeout, and HTTP fallback for SSL errors
 */
import { logInfo, logError } from '../utils/logger';
import { API_TIMEOUT_MS, API_RETRIES } from '../constants/api';

/**
 * Check if error is due to SSL/TLS/certificate issues
 * @param {Error} error
 * @returns {boolean}
 */
function isSslError(error) {
  const msg = error?.message || '';
  return msg.includes('SSL') || msg.includes('TLS') || msg.includes('certificate');
}

/**
 * Execute a fetch with retry logic, timeout, and HTTP fallback
 * @param {string} url - Full URL to fetch
 * @param {RequestInit} fetchOptions - Options passed to fetch()
 * @param {Object} options - Additional options
 * @param {number} options.timeout - Timeout in ms
 * @param {number} options.retries - Number of retries
 * @param {string} [options.httpFallbackUrl] - HTTP URL to try if HTTPS fails with SSL error
 * @returns {Promise<Response>}
 */
export async function requestWithRetry(url, fetchOptions = {}, options = {}) {
  const {
    timeout = API_TIMEOUT_MS,
    retries = API_RETRIES,
    httpFallbackUrl,
  } = options;

  let lastError;
  let useHttpFallback = false;
  const baseUrl = url;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const endpoint = useHttpFallback && httpFallbackUrl ? httpFallbackUrl : baseUrl;

      const response = await fetch(endpoint, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`Request failed: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return response;
    } catch (error) {
      lastError = error;

      if (error.status && error.status >= 400 && error.status < 500) {
        logError(`Client error (${error.status}), not retrying:`, error);
        break;
      }

      if (error.name === 'AbortError') {
        logError(`Request timed out after ${timeout}ms`);
        lastError = new Error(`Request timed out after ${timeout}ms`);
        continue;
      }

      if (isSslError(error) && httpFallbackUrl && !useHttpFallback) {
        logInfo('SSL/TLS error detected, trying HTTP fallback');
        useHttpFallback = true;
        continue;
      }

      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        logInfo(`Retrying in ${delay}ms... (Attempt ${attempt + 1} of ${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
