import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * User-configurable theme preference.
 *
 * - `light` / `dark`: explicit user choice
 * - `system`: follow OS preference
 * - `time`: resolve via sunrise / sunset
 */
export type ThemePreference = 'light' | 'dark' | 'system' | 'time';

/**
 * Concrete theme mode used for rendering.
 *
 * Always resolved to a deterministic value.
 */
export type ThemeMode = 'light' | 'dark';

/**
 * ThemeState
 *
 * Internal Redux state for the theme domain.
 *
 * Notes:
 * - `preference` is persisted and represents user intent
 * - `mode` is derived but cached for MUI + SSR stability
 */
interface ThemeState {
  /**
   * Persisted user preference (intent).
   */
  preference: ThemePreference;
  
  /**
   * Resolved theme mode used by the UI.
   *
   * This value is derived externally and cached here to:
   * - Avoid recomputation during render
   * - Ensure stable hydration for SSR / MUI
   */
  mode: ThemeMode;
}

/**
 * Determines the user's system-preferred theme.
 *
 * Notes:
 * - Evaluated only during initial state creation
 * - Safe for SSR (defaults to 'light')
 * - Persisted Redux state will override this value after rehydration
 */
const getSystemThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const initialState: ThemeState = {
  preference: 'system',
  mode: getSystemThemeMode(),
};

/**
 * Theme slice
 *
 * Domain:
 * - UI / appearance (UX-only state)
 *
 * Responsibilities:
 * - Store the user's theme *preference* (intent)
 * - Cache the resolved theme *mode* for rendering stability
 *
 * Architectural classification:
 * - Client-only
 * - Safe to persist via redux-persist
 *
 * Explicitly NOT responsible for:
 * - Reading from localStorage
 * - Resolving system or time-based themes
 * - Handling geolocation or environment signals
 * - Authentication or identity concerns
 *
 * Resolution model:
 * - `preference` represents user intent
 * - `mode` represents the resolved, concrete theme (`light | dark`)
 * - Resolution is performed externally (e.g. in `useThemeMode`)
 */
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  
  reducers: {
    /**
     * Sets the user's theme preference explicitly.
     *
     * Intended usage:
     * - Settings UI
     * - Programmatic preference updates
     *
     * Note:
     * - Does NOT resolve the final theme mode
     */
    setThemePreference: (
      state,
      action: PayloadAction<ThemePreference>
    ) => {
      state.preference = action.payload;
    },
    
    /**
     * Internal resolver for the final theme mode.
     *
     * Intended usage:
     * - Called by hooks or listeners after resolving
     *   system or time-based preferences.
     *
     * Note:
     * - Should not be dispatched directly by UI components.
     */
    resolveThemeMode: (
      state,
      action: PayloadAction<ThemeMode>
    ) => {
      state.mode = action.payload;
    },
  },
});

export const {
  setThemePreference,
  resolveThemeMode,
} = themeSlice.actions;

export default themeSlice.reducer;
