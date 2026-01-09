import { useDispatch, useSelector } from 'react-redux';
import { selectThemeMode } from '@features/theme/state/themeSelectors';
import { toggleTheme } from '@features/theme/state/themeSlice';
import type { AppDispatch } from '@store/store';

/**
 * useThemeMode
 *
 * Redux-backed hook for managing the application's theme preference.
 *
 * Responsibilities:
 * - Read the persisted theme mode (`light | dark`)
 * - Dispatch theme toggle actions
 *
 * Architectural role:
 * - UX-only state
 * - Reads from persisted Redux state
 * - Does NOT depend on MUI's theme system
 *
 * Important distinctions:
 * - This hook manages *preference state*
 * - MUI's `useTheme()` reads the *resolved theme object*
 *
 * Usage:
 * - Use this hook in controls (buttons, menus, settings)
 * - Do NOT use it for styling or breakpoints
 */
const useThemeMode = () => {
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector(selectThemeMode);
  
  const onToggleTheme = () => {
    dispatch(toggleTheme());
  };
  
  return {
    mode,
    toggleTheme: onToggleTheme,
  };
};

export default useThemeMode;
