import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Theme slice.
 *
 * Responsibility:
 * - Manages UI theme preference (light / dark).
 *
 * Architectural classification:
 * - UX-only state
 * - Safe to persist via redux-persist
 *
 * Explicitly NOT responsible for:
 * - Reading from localStorage directly
 * - Authentication or identity concerns
 * - Server-authoritative state
 *
 * Persistence model:
 * - Initial mode is derived from system preference
 * - Persisted value (if present) will override this on rehydration
 */

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
}

/**
 * Determines the user's system-preferred theme.
 *
 * Notes:
 * - Evaluated only on initial load
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
  mode: getSystemThemeMode(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  
  reducers: {
    /**
     * Explicitly sets the theme mode.
     *
     * Intended for:
     * - Manual user selection
     * - Programmatic preference restoration
     */
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
    
    /**
     * Toggles between light and dark modes.
     *
     * Intended for:
     * - UI toggle controls
     */
    toggleTheme: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
  },
});

export const { setThemeMode, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
