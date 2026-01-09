import type { RootState } from '@store/store';

/**
 * Selects the runtime state subtree.
 *
 * Runtime state characteristics:
 * - Contains all security-sensitive and server-authoritative data
 *   (authentication, session, permissions, user identity, domain data).
 * - Lives entirely in memory.
 * - Is fully reset on page reload or logout.
 *
 * Persistence guarantees:
 * - MUST NOT be persisted to localStorage.
 * - MUST NOT be read by persisted selectors.
 *
 * Usage:
 * - Base selector for all runtime-domain selectors.
 * - Should be composed with `createSelector` in feature modules.
 *
 * State path:
 * - state.runtime
 */
export const selectRuntime = (state: RootState) => state.runtime;

/**
 * Selects the persisted (UX-only) state subtree.
 *
 * Persisted state characteristics:
 * - Contains user-experience preferences only
 *   (e.g. theme, UI layout flags).
 * - Safe to store in localStorage via redux-persist.
 *
 * Explicit exclusions:
 * - Authentication
 * - Session tokens
 * - Permissions
 * - User identity
 *
 * Usage:
 * - Base selector for persisted UX selectors.
 * - Safe to use during application bootstrap.
 *
 * State path:
 * - state.persisted
 */
export const selectPersisted = (state: RootState) => state.persisted;
