'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ClubInfo {
  logoUrl: string;
  clubName: string;
}

interface ClubContextType {
  clubInfo: ClubInfo;
  updateClubInfo: (info: Partial<ClubInfo>) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const [clubInfo, setClubInfo] = useState<ClubInfo>({
    logoUrl: '',
    clubName: '电脑学会',
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchClubInfo = async () => {
    try {
      const response = await fetch('/api/club-settings');
      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          const updatedInfo = {
            logoUrl: data.logoUrl || data.logo || '',
            clubName: data.aboutTitle || data.clubName || '电脑学会',
          };
          setClubInfo(updatedInfo);
          localStorage.setItem('clubInfo', JSON.stringify(updatedInfo));
        }
      }
    } catch (error) {
      console.error('Failed to fetch club info from API:', error);
    }
  };

  useEffect(() => {
    const loadClubInfo = async () => {
      try {
        const stored = localStorage.getItem('clubInfo');
        if (stored) {
          const parsed = JSON.parse(stored);
          setClubInfo(prev => ({ ...prev, ...parsed }));
        }

        await fetchClubInfo();
      } catch (error) {
        console.error('Failed to load club info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClubInfo();
  }, []);

  const updateClubInfo = (info: Partial<ClubInfo>) => {
    setClubInfo(prev => {
      const updated = { ...prev, ...info };
      try {
        localStorage.setItem('clubInfo', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save club info:', error);
      }
      return updated;
    });
  };

  const refetch = async () => {
    setIsLoading(true);
    await fetchClubInfo();
    setIsLoading(false);
  };

  return (
    <ClubContext.Provider value={{ clubInfo, updateClubInfo, isLoading, refetch }}>
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
