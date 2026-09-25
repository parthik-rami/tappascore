/**
 * Centralized API & Socket configuration helper
 * Uses VITE_API_URL and VITE_SOCKET_URL env vars when set (e.g. in Vercel production),
 * falling back to empty string (which uses relative paths like /api/... for local Vite proxy).
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const RAW_SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

// Clean API Base URL (removes trailing slash if provided)
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

// Clean Socket URL (removes trailing slash if provided, defaults to API_BASE_URL or empty)
export const SOCKET_URL = (RAW_SOCKET_URL || API_BASE_URL).replace(/\/+$/, '');

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
