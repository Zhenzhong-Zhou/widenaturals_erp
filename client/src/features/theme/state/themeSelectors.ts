import { createSelector } from '@reduxjs/toolkit';
import { selectPersisted } from '@store/selectors';

/**
 * Selects the current theme mode from persisted UI state.
 *
 * Architectural role:
 * - Reads UX-only state from the persisted reducer tree.
 * - Must NOT depend on runtime or security-sensitive state.
 *
 * Persistence semantics:
 * - Theme mode is persisted across page reloads.
 * - Selector remains valid before and after redux-persist rehydration.
 *
 * State source:
 * - Path: state.persisted.theme.mode
 *
 * Return value:
 * - `'light' | 'dark'`
 * - Defaults to `'light'` if persisted state is not yet available.
 *
 * Notes:
 * - This selector is safe to use during app bootstrap.
 * - Components using this selector will not cause auth coupling.
 */
export const selectThemeMode = createSelector(
  [selectPersisted],
  (persisted) => persisted?.theme?.mode ?? 'light'
);
