'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  resolvedMode: ThemeMode;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_MODE = 'theme-mode';

function getPreferredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [resolvedMode, setResolvedMode] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((themeMode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.toggle('light', themeMode === 'light');
    root.classList.toggle('dark', themeMode === 'dark');
    setResolvedMode(themeMode);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_MODE);
    const initial =
      stored === 'light' || stored === 'dark' ? stored : getPreferredMode();
    setModeState(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(mode);
  }, [mode, mounted, applyTheme]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY_MODE, next);
      return next;
    });
  }, []);

  const resetTheme = useCallback(() => {
    const preferred = getPreferredMode();
    setModeState(preferred);
    localStorage.removeItem(STORAGE_KEY_MODE);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ mode, setMode, toggleMode, resolvedMode, resetTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      mode: 'dark' as ThemeMode,
      setMode: () => {},
      toggleMode: () => {},
      resolvedMode: 'dark' as ThemeMode,
      resetTheme: () => {},
    };
  }
  return context;
}
