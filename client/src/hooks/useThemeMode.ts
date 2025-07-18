import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

const getSystemThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  return stored === 'dark' || stored === 'light'
    ? stored
    : getSystemThemeMode();
};

const useThemeMode = () => {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialThemeMode());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (!localStorage.getItem('theme')) {
        setMode(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    setMode(next);
  };

  return { mode, toggleTheme };
};

export default useThemeMode;
