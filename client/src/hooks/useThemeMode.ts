import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectThemeMode,
  selectThemePreference,
} from '@features/theme/state/themeSelectors';
import {
  resolveThemeMode,
  setThemePreference,
  type ThemePreference,
} from '@features/theme/state/themeSlice';
import {
  loadStoredCoords,
  normalizeCoords,
  getSunBasedTheme,
  getSystemTheme,
} from '@features/theme/utils';

/**
 * Geographic coordinates used for sun-based theme resolution.
 */
type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * useThemeMode
 *
 * Central authority for resolving and controlling application theme behavior.
 *
 * Responsibilities:
 * - Read persisted theme preference from Redux
 * - Resolve the actual theme mode (light | dark)
 * - Optionally use geolocation + SunCalc for time-based themes
 * - Cache coordinates locally (never in Redux)
 *
 * Architecture rules:
 * - Redux stores intent (preference), not environment data
 * - LocalStorage stores environmental cache (coordinates)
 * - UI consumes resolved mode only
 */
const useThemeMode = () => {
  const dispatch = useAppDispatch();

  const mode = useAppSelector(selectThemeMode);
  const preference = useAppSelector(selectThemePreference);

  const [coords, setCoords] = useState<Coordinates | null>(loadStoredCoords);

  /**
   * Request geolocation ONLY when time-based mode is selected
   * and no cached coordinates exist.
   */
  useEffect(() => {
    if (preference !== 'time') return;
    if (!('geolocation' in navigator)) return;
    if (coords) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoords(
          normalizeCoords({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
        );
      },
      () => {
        // Silent fallback to system theme
      },
      {
        maximumAge: 1000 * 60 * 60 * 12, // 12 hours
        timeout: 5000,
      }
    );
  }, [preference, coords]);

  /**
   * Persist coordinates once granted.
   */
  useEffect(() => {
    if (coords) {
      localStorage.setItem('theme_coords', JSON.stringify(coords));
    }
  }, [coords]);

  /**
   * Resolve final theme mode whenever preference or environment changes.
   */
  useEffect(() => {
    let resolved: 'light' | 'dark';

    switch (preference) {
      case 'light':
      case 'dark':
        resolved = preference;
        break;

      case 'time':
        if (coords) {
          const normalized = normalizeCoords(coords);
          resolved = getSunBasedTheme(
            normalized.latitude,
            normalized.longitude
          );
        } else {
          resolved = getSystemTheme();
        }
        break;

      case 'system':
      default:
        resolved = getSystemTheme();
    }

    dispatch(resolveThemeMode(resolved));
  }, [preference, coords, dispatch]);

  /**
   * Explicit preference setter.
   * Preferred over toggle for multi-mode systems.
   */
  const setPreference = (p: ThemePreference) => {
    dispatch(setThemePreference(p));
  };

  /**
   * Quick override toggle.
   * Forces explicit light/dark preference.
   */
  const toggleTheme = () => {
    setPreference(mode === 'dark' ? 'light' : 'dark');
  };

  return {
    mode, // resolved theme (for MUI)
    preference, // persisted user intent
    actions: {
      setPreference,
      toggleTheme,
    },
  };
};

export default useThemeMode;
