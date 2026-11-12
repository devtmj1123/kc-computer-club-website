'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  isAccentId,
  type AccentId,
  type AccentPreset,
} from '@/lib/theme-accents';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  resolvedMode: ThemeMode;
  accent: AccentId;
  setAccent: (accent: AccentId) => void;
  accents: readonly AccentPreset[];
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_MODE = 'theme-mode';
const STORAGE_KEY_ACCENT = 'theme-accent';

function getPreferredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [accent, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);
  const [resolvedMode, setResolvedMode] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((themeMode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.toggle('light', themeMode === 'light');
    root.classList.toggle('dark', themeMode === 'dark');
    setResolvedMode(themeMode);
  }, []);

  const applyAccent = useCallback((nextAccent: AccentId) => {
    const root = document.documentElement;
    if (nextAccent === DEFAULT_ACCENT) {
      root.removeAttribute('data-accent');
    } else {
      root.setAttribute('data-accent', nextAccent);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_MODE);
    const initial =
      stored === 'light' || stored === 'dark' ? stored : getPreferredMode();
    const storedAccent = localStorage.getItem(STORAGE_KEY_ACCENT);
    const initialAccent = isAccentId(storedAccent)
      ? storedAccent
      : DEFAULT_ACCENT;

    setModeState(initial);
    setAccentState(initialAccent);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(mode);
  }, [mode, mounted, applyTheme]);

  useEffect(() => {
    if (!mounted) return;
    applyAccent(accent);
  }, [accent, mounted, applyAccent]);

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

  const setAccent = useCallback((nextAccent: AccentId) => {
    setAccentState(nextAccent);
    localStorage.setItem(STORAGE_KEY_ACCENT, nextAccent);
  }, []);

  const resetTheme = useCallback(() => {
    const preferred = getPreferredMode();
    setModeState(preferred);
    setAccentState(DEFAULT_ACCENT);
    localStorage.removeItem(STORAGE_KEY_MODE);
    localStorage.removeItem(STORAGE_KEY_ACCENT);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        resolvedMode,
        accent,
        setAccent,
        accents: ACCENT_PRESETS,
        resetTheme,
      }}
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
      accent: DEFAULT_ACCENT,
      setAccent: () => {},
      accents: ACCENT_PRESETS,
      resetTheme: () => {},
    };
  }
  return context;
}
