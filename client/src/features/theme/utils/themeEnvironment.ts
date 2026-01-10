import SunCalc from 'suncalc';

/**
 * Geographic coordinates used for sun-based theme resolution.
 */
type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * Loads cached coordinates from localStorage.
 * Used to avoid repeated geolocation permission prompts.
 */
export const loadStoredCoords = (): Coordinates | null => {
  try {
    const raw = localStorage.getItem('theme_coords');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Determines theme mode based on real sunrise/sunset times.
 */
export const getSunBasedTheme = (
  latitude: number,
  longitude: number
): 'light' | 'dark' => {
  const now = new Date();
  const times = SunCalc.getTimes(now, latitude, longitude);
  
  return now >= times.sunrise && now < times.sunset
    ? 'light'
    : 'dark';
};

/**
 * Determines theme mode based on OS preference.
 */
export const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';