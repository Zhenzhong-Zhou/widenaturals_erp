import axios from 'axios';

/**
 * Base Axios instance with no interceptors or response normalization.
 *
 * Purpose:
 * - Serves as the lowest-level HTTP client for the application.
 * - Used for bootstrap, authentication, and security-sensitive requests
 *   (e.g. CSRF token fetch, login, refresh) where global interceptors
 *   must not interfere.
 *
 * Configuration:
 * - `baseURL` is resolved from Vite environment variables.
 * - `withCredentials` is enabled to allow cookie-based authentication
 *   (HttpOnly session cookies, CSRF cookies, etc.).
 *
 * Architectural Notes:
 * - This instance must remain interceptor-free.
 * - Higher-level Axios instances may wrap this client and add
 *   interceptors, retry logic, error normalization, or logging.
 * - Do NOT import feature-level state, hooks, or services here.
 */
export const rawAxios = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true,
});
