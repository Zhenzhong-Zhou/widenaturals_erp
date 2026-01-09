/**
 * Persisted (UX-only) reducer configuration.
 *
 * Purpose:
 * - Persist non-sensitive, user-experience state only
 *   (e.g. theme preferences).
 *
 * Explicitly NOT persisted:
 * - Authentication state
 * - Session tokens
 * - Permissions
 * - User identity
 * - Any server-authoritative or security-sensitive data
 *
 * Rationale:
 * - Prevents credential leakage via localStorage
 * - Ensures a clean, deterministic runtime state on page reload
 * - Authentication is restored exclusively via
 *   a refresh-token bootstrap flow
 *
 * Storage:
 * - Uses localStorage via redux-persist
 * - Scoped under the `ui` persistence key
 */

import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// =========================
// Persisted reducers (UX ONLY)
// =========================

// Safe-to-persist UI slices
import { themeReducers } from '@features/theme/state';

// Combine UX reducers
const uiReducer = combineReducers({
  ...themeReducers,
});

// Persistence configuration (UX scope only)
const uiPersistConfig = {
  key: 'ui',
  storage,
};

// Export persisted UX reducer
export const persistedReducer = persistReducer(
  uiPersistConfig,
  uiReducer
);
