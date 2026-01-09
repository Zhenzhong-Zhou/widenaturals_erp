/**
 * Theme reducer map.
 *
 * Purpose:
 * - Exposes the theme slice in a reducer-map format
 *   compatible with the application's modular reducer composition.
 *
 * Architectural role:
 * - This reducer is classified as UX-only state.
 * - It is safe to persist across sessions.
 * - It contains no authentication, identity, or server-authoritative data.
 *
 * Persistence:
 * - This reducer is intended to be included ONLY in the
 *   persisted UI reducer group.
 * - It must NOT be combined into the runtime (security-sensitive) reducer tree.
 *
 * Naming convention:
 * - The exported object key (`theme`) defines the Redux state path.
 * - Resulting state shape:
 *     state.persisted.theme
 */

import themeReducer from './themeSlice';

export const themeReducers = {
  theme: themeReducer,
};
