'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';

export function BreathingToggle() {
  const { breathingEffectEnabled, setBreathingEffectEnabled } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleToggle = () => {
    setBreathingEffectEnabled(!breathingEffectEnabled);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-lg
        transition-all duration-200 ease-in-out
        ${breathingEffectEnabled
          ? 'bg-[#1c3328] hover:bg-[#254433] text-[#13ec80]'
          : 'bg-[#162a21] hover:bg-[#1c3328] text-[#666]'
        }
        dark:${breathingEffectEnabled
          ? 'bg-[#162a21] hover:bg-[#1c3328] text-[#13ec80]'
          : 'bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[#999]'
        }
      `}
      title={breathingEffectEnabled ? '关闭呼吸效果' : '启用呼吸效果'}
      aria-label={breathingEffectEnabled ? 'Disable breathing effect' : 'Enable breathing effect'}
    >
      <span className="relative">
        <span className="material-symbols-outlined text-lg">
          {breathingEffectEnabled ? 'favorite' : 'favorite_border'}
        </span>
        {breathingEffectEnabled && (
          <span className={`
            absolute inset-0 rounded-full
            animate-pulse
            bg-[#13ec80]/30
          `} />
        )}
      </span>

      <span className="hidden sm:inline text-sm font-medium">
        {breathingEffectEnabled ? '呼吸中' : '呼吸已关闭'}
      </span>
    </button>
  );
}

export function BreathingToggleCompact() {
  const { breathingEffectEnabled, setBreathingEffectEnabled } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setBreathingEffectEnabled(!breathingEffectEnabled)}
      className={`
        inline-flex items-center justify-center
        w-10 h-10 rounded-lg
        transition-colors duration-200
        ${breathingEffectEnabled
          ? 'bg-[#1c3328] hover:bg-[#254433] text-[#13ec80]'
          : 'bg-[#162a21] hover:bg-[#1c3328] text-[#666]'
        }
      `}
      title={breathingEffectEnabled ? '关闭呼吸效果' : '启用呼吸效果'}
      aria-label={breathingEffectEnabled ? 'Disable breathing' : 'Enable breathing'}
    >
      <span className="material-symbols-outlined">
        {breathingEffectEnabled ? 'favorite' : 'favorite_border'}
      </span>
    </button>
  );
}

export function BreathingToggleSettings() {
  const { breathingEffectEnabled, setBreathingEffectEnabled } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 rounded-lg bg-[#162a21] dark:bg-white/5">
        <div>
          <h3 className="font-semibold text-[#13ec80]">呼吸光效</h3>
          <p className="text-sm text-[#888] mt-1">
            {breathingEffectEnabled
              ? '按钮和链接显示主题颜色呼吸动画'
              : '禁用呼吸动画效果'}
          </p>
        </div>
        <button
          onClick={() => setBreathingEffectEnabled(!breathingEffectEnabled)}
          className={`
            relative inline-flex h-8 w-14 items-center rounded-full
            transition-colors duration-200
            ${breathingEffectEnabled
              ? 'bg-[#13ec80]'
              : 'bg-[#666]'
            }
          `}
        >
          <span
            className={`
              inline-block h-6 w-6 transform rounded-full
              bg-white transition-transform duration-200
              ${breathingEffectEnabled ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </div>
  );
}
