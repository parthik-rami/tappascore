/**
 * Centralized API & Socket configuration helper
 * Uses VITE_API_URL and VITE_SOCKET_URL env vars when set (e.g. in Vercel production),
 * falling back to empty string (which uses relative paths like /api/... for local Vite proxy).
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const RAW_SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

// Detect if running in local browser environment (localhost / 127.0.0.1)
const isLocalBrowser =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0');

// In local dev, if env var points to remote Render, ignore it and use relative path
// so Vite's dev server proxy (/api and /socket.io -> http://127.0.0.1:5000) handles it locally.
const effectiveApiUrl =
  isLocalBrowser && RAW_API_URL.includes('onrender.com') ? '' : RAW_API_URL;
const effectiveSocketUrl =
  isLocalBrowser && RAW_SOCKET_URL.includes('onrender.com') ? '' : RAW_SOCKET_URL;

// Clean API Base URL (removes trailing slash if provided)
export const API_BASE_URL = effectiveApiUrl.replace(/\/+$/, '');

// Clean Socket URL (removes trailing slash if provided, defaults to API_BASE_URL or empty)
export const SOCKET_URL = (effectiveSocketUrl || API_BASE_URL).replace(/\/+$/, '');

/**
 * Builds a full API URL given an endpoint path (e.g., '/api/matches/sync')
 * If endpoint already starts with http:// or https://, returns as is.
 */
export const buildApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanPath}`;
};
