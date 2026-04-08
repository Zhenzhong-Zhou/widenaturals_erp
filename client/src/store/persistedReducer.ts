/**
 * @file persistedReducer.ts
 * @description Persisted Redux reducer — UX state only.
 *
 * Only non-sensitive, user-experience state is persisted here
 * (e.g. theme preferences). Security-sensitive state is explicitly
 * excluded and must never be added to this config.
 *
 * Explicitly NOT persisted:
 *   - Authentication state
 *   - Session tokens
 *   - Permissions
 *   - User identity
 *   - Any server-authoritative or security-sensitive data
 *
 * Rationale:
 *   - Prevents credential leakage via localStorage
 *   - Ensures deterministic runtime state on page reload
 *   - Auth is restored exclusively via the refresh-token bootstrap flow
 *
 * Storage:
 *   - localStorage via redux-persist
 *   - Scoped under the `ui` persistence key
 */

import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storageImport from 'redux-persist/lib/storage';
import { themeReducers } from '@features/theme/state';

// ---------------------------------------------------------------------------
// ESM/CJS interop
// redux-persist/lib/storage may expose its default export nested under
// `.default` depending on bundler and moduleResolution settings.
// This unwraps it safely and falls back to the raw import if not nested.
// ---------------------------------------------------------------------------
const storage = (storageImport as typeof storageImport & {
  default?: typeof storageImport;
}).default ?? storageImport;

// ---------------------------------------------------------------------------
// UX reducer
// ---------------------------------------------------------------------------

/**
 * Combined reducer for persisted UX state.
 *
 * When adding new slices here, ensure they contain no auth, session,
 * or server-authoritative data. If in doubt, do not persist.
 */
const uiReducer = combineReducers({
  ...themeReducers,
});

// ---------------------------------------------------------------------------
// Persist config
// ---------------------------------------------------------------------------

/**
 * redux-persist configuration scoped to the `ui` key in localStorage.
 *
 * `blacklist` is not set here because `uiReducer` is already restricted
 * to safe UX-only slices. If additional reducers are added to `uiReducer`
 * that should not be persisted, add them to a `blacklist` array here
 * rather than allowing silent persistence.
 */
const uiPersistConfig = {
  key: 'ui',
  storage,
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Persisted UX reducer, ready to be registered in the root store. */
export const persistedReducer = persistReducer(uiPersistConfig, uiReducer);
