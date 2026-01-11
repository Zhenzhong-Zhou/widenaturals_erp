/**
 * Redux store configuration.
 *
 * Responsibilities:
 * - Create the single Redux store instance
 * - Attach the root reducer (runtime + persisted state)
 * - Configure middleware and devtools
 * - Initialize redux-persist rehydration
 *
 * Persistence model:
 * - Only UX-related state (e.g. theme) is persisted
 * - Authentication, session, permissions, and domain data
 *   are intentionally NOT persisted
 *
 * Authentication model:
 * - Access tokens are stored in memory only
 * - Session continuity across page reloads is restored
 *   via an explicit bootstrap refresh-token flow
 *
 * Security guarantees:
 * - No credentials, tokens, or permissions are stored
 *   in localStorage or sessionStorage
 * - A hard reload always starts from a clean runtime state
 *   until bootstrap completes
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import rootReducer from './rootReducer';

const isDevelopment = import.meta.env.NODE_ENV === 'development';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // redux-persist injects non-serializable metadata
      serializableCheck: false,
    }),
  devTools: isDevelopment,
});

/**
 * Redux Persist controller.
 *
 * Used by <PersistGate> to delay rendering until
 * persisted UX state has been rehydrated.
 */
export const persistor = persistStore(store);

// Centralized store typings
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
