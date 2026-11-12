'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_CLUB_SETTINGS,
  normalizeClubSettings,
  type ClubSettings,
} from '@/lib/club-settings';
import { fetchCachedJson, publicDataUrls } from '@/lib/client-cache';

const STORAGE_KEY = 'club-settings-v2';
const STORAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredSettings {
  data: unknown;
  savedAt?: number;
}

interface ClubContextType {
  clubInfo: ClubSettings;
  settings: ClubSettings;
  updateClubInfo: (info: Partial<ClubSettings>) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

function persistSettings(settings: ClubSettings) {
  try {
    const payload: StoredSettings = { data: settings, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage can be unavailable in private browsing; the API remains the source of truth.
  }
}

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const [clubInfo, setClubInfo] = useState<ClubSettings>(DEFAULT_CLUB_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClubInfo = useCallback(async (force = false) => {
    try {
      const data = await fetchCachedJson<unknown>(publicDataUrls.clubSettings, { force });
      const normalized = normalizeClubSettings(data);
      setClubInfo(normalized);
      persistSettings(normalized);
    } catch (error) {
      console.error('Failed to fetch club info from API:', error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadClubInfo = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as StoredSettings;
          const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : 0;
          if (Date.now() - savedAt < STORAGE_MAX_AGE_MS && !cancelled) {
            setClubInfo(normalizeClubSettings(parsed.data));
          }
        }
        // Remove the legacy two-field cache so old values do not linger.
        localStorage.removeItem('clubInfo');
      } catch (error) {
        console.error('Failed to load cached club info:', error);
      }

      await fetchClubInfo();
      if (!cancelled) setIsLoading(false);
    };

    void loadClubInfo();

    return () => {
      cancelled = true;
    };
  }, [fetchClubInfo]);

  const updateClubInfo = useCallback((info: Partial<ClubSettings>) => {
    setClubInfo((prev) => {
      const updated = normalizeClubSettings({ ...prev, ...info });
      persistSettings(updated);
      return updated;
    });
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchClubInfo(true);
    setIsLoading(false);
  }, [fetchClubInfo]);

  return (
    <ClubContext.Provider value={{ clubInfo, settings: clubInfo, updateClubInfo, isLoading, refetch }}>
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
}
