export type AccentId =
  | 'emerald'
  | 'cyan'
  | 'azure'
  | 'violet'
  | 'amber'
  | 'rose';

export interface AccentPreset {
  id: AccentId;
  label: string;
  note: string;
  swatch: {
    dark: string;
    light: string;
  };
}

export const DEFAULT_ACCENT: AccentId = 'emerald';

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  {
    id: 'emerald',
    label: '翡翠',
    note: 'EMERALD',
    swatch: { dark: '#7dffab', light: '#0a6638' },
  },
  {
    id: 'cyan',
    label: '青蓝',
    note: 'CYAN',
    swatch: { dark: '#6ee7ff', light: '#086c80' },
  },
  {
    id: 'azure',
    label: '天蓝',
    note: 'AZURE',
    swatch: { dark: '#8bb8ff', light: '#1f4e8c' },
  },
  {
    id: 'violet',
    label: '紫罗兰',
    note: 'VIOLET',
    swatch: { dark: '#c9a7ff', light: '#5b2a9c' },
  },
  {
    id: 'amber',
    label: '琥珀',
    note: 'AMBER',
    swatch: { dark: '#ffd166', light: '#7a4f00' },
  },
  {
    id: 'rose',
    label: '玫瑰',
    note: 'ROSE',
    swatch: { dark: '#ff9eb1', light: '#a11d3c' },
  },
];

export function isAccentId(value: unknown): value is AccentId {
  return ACCENT_PRESETS.some((preset) => preset.id === value);
}
