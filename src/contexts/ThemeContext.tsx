'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryGlow: string;
}

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: 'light' | 'dark';
  colors: ThemeColors;
  setColors: (colors: Partial<ThemeColors>) => void;
  presetColors: { name: string; color: string }[];
  applyPreset: (color: string) => void;
  breathingEffectEnabled: boolean;
  setBreathingEffectEnabled: (enabled: boolean) => void;
  resetTheme: () => void;
}

const DEFAULT_COLORS: ThemeColors = {
  primary: '#13ec80',
  primaryHover: '#0fd673',
  primaryLight: 'rgba(19, 236, 128, 0.1)',
  primaryGlow: 'rgba(19, 236, 128, 0.3)',
};

const PRESET_COLORS = [
  { name: '翠绿', color: '#13ec80' },
  { name: '天蓝', color: '#137fec' },
  { name: '紫罗兰', color: '#8b5cf6' },
  { name: '玫瑰红', color: '#f43f5e' },
  { name: '琥珀', color: '#f59e0b' },
  { name: '青色', color: '#06b6d4' },
  { name: '粉红', color: '#ec4899' },
  { name: '石灰', color: '#84cc16' },
];

function generateColorsFromPrimary(primary: string): ThemeColors {
  const hex = primary.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const hoverR = Math.max(0, r - 20);
  const hoverG = Math.max(0, g - 20);
  const hoverB = Math.max(0, b - 20);

  return {
    primary,
    primaryHover: `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`,
    primaryLight: `rgba(${r}, ${g}, ${b}, 0.1)`,
    primaryGlow: `rgba(${r}, ${g}, ${b}, 0.3)`,
  };
}

function extractRGB(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `${r}, ${g}, ${b}`;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_MODE = 'theme-mode';
const STORAGE_KEY_COLORS = 'theme-colors';
const STORAGE_KEY_BREATHING = 'breathing-effect-enabled';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('dark');
  const [colors, setColorsState] = useState<ThemeColors>(DEFAULT_COLORS);
  const [breathingEffectEnabled, setBreathingEffectEnabledState] = useState(true);
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((themeMode: ThemeMode, themeColors: ThemeColors, breathingEnabled: boolean) => {
    const root = document.documentElement;

    const resolved = themeMode;
    setResolvedMode(resolved);

    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    root.style.setProperty('--primary', themeColors.primary);
    root.style.setProperty('--primary-hover', themeColors.primaryHover);
    root.style.setProperty('--primary-light', themeColors.primaryLight);
    root.style.setProperty('--primary-glow', themeColors.primaryGlow);
    root.style.setProperty('--primary-rgb', extractRGB(themeColors.primary));

    if (breathingEnabled) {
      root.classList.add('breathing-enabled');
      root.classList.remove('breathing-disabled');
    } else {
      root.classList.remove('breathing-enabled');
      root.classList.add('breathing-disabled');
    }
  }, []);

  useEffect(() => {
    const storedMode = localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode | null;
    const storedColors = localStorage.getItem(STORAGE_KEY_COLORS);
    const storedBreathing = localStorage.getItem(STORAGE_KEY_BREATHING);

    if (storedMode === 'light' || storedMode === 'dark') {
      setModeState(storedMode);
    }

    if (storedColors) {
      try {
        const parsed = JSON.parse(storedColors);
        setColorsState(parsed);
      } catch {
      }
    }

    if (storedBreathing !== null) {
      setBreathingEffectEnabledState(storedBreathing === 'true');
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(mode, colors, breathingEffectEnabled);
  }, [mode, colors, breathingEffectEnabled, mounted, applyTheme]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
  }, []);

  const setColors = useCallback((newColors: Partial<ThemeColors>) => {
    setColorsState(prev => {
      const updated = { ...prev, ...newColors };
      localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setBreathingEffectEnabled = useCallback((enabled: boolean) => {
    setBreathingEffectEnabledState(enabled);
    localStorage.setItem(STORAGE_KEY_BREATHING, enabled.toString());
  }, []);

  const applyPreset = useCallback((color: string) => {
    const newColors = generateColorsFromPrimary(color);
    setColors(newColors);
  }, [setColors]);

  const resetTheme = useCallback(() => {
    setModeState('dark');
    setColorsState(DEFAULT_COLORS);
    setBreathingEffectEnabledState(true);
    localStorage.removeItem(STORAGE_KEY_MODE);
    localStorage.removeItem(STORAGE_KEY_COLORS);
    localStorage.removeItem(STORAGE_KEY_BREATHING);
  }, []);

  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        resolvedMode,
        colors,
        setColors,
        presetColors: PRESET_COLORS,
        applyPreset,
        breathingEffectEnabled,
        setBreathingEffectEnabled,
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
      resolvedMode: 'dark' as const,
      colors: DEFAULT_COLORS,
      setColors: () => {},
      presetColors: PRESET_COLORS,
      applyPreset: () => {},
      breathingEffectEnabled: true,
      setBreathingEffectEnabled: () => {},
      resetTheme: () => {},
    };
  }
  return context;
}
