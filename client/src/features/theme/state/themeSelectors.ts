import { createSelector } from '@reduxjs/toolkit';
import { selectPersisted } from '@store/selectors';

/**
 * selectThemeMode
 *
 * Selects the resolved theme mode from persisted UI state.
 *
 * Architectural role:
 * - Reads UX-only state from the persisted reducer tree
 * - Represents the final, resolved theme (`light | dark`)
 *
 * Persistence semantics:
 * - Theme mode is persisted across page reloads
 * - Selector remains valid before and after redux-persist rehydration
 *
 * State source:
 * - Path: state.persisted.theme.mode
 *
 * Return value:
 * - `'light' | 'dark'`
 * - Defaults to `'light'` if persisted state is not yet available
 *
 * Notes:
 * - Safe to use during application bootstrap
 * - Does NOT encode user intent (see `selectThemePreference`)
 */
export const selectThemeMode = createSelector(
  [selectPersisted],
  (persisted) => persisted?.theme?.mode ?? 'light'
);

/**
 * selectThemePreference
 *
 * Selects the user's theme preference from persisted UI state.
 *
 * Architectural role:
 * - Represents user intent, not resolved behavior
 * - Used to determine how the theme mode should be computed
 *
 * Persistence semantics:
 * - Preference is persisted across page reloads
 * - Selector remains valid before and after redux-persist rehydration
 *
 * State source:
 * - Path: state.persisted.theme.preference
 *
 * Return value:
 * - `'light' | 'dark' | 'system' | 'time'`
 * - Defaults to `'system'` if persisted state is not yet available
 *
 * Notes:
 * - Safe to use during application bootstrap
 * - Must be interpreted by theme resolution logic
 * - Should NOT be consumed directly by styling systems
 */
export const selectThemePreference = createSelector(
  [selectPersisted],
  (persisted) => persisted?.theme?.preference ?? 'system'
);
