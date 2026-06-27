'use client';

import { useClub } from '@/contexts/ClubContext';
import { useState } from 'react';

interface ClubLogoProps {
  className?: string;
  size?: number;
}

export function ClubLogo({ className = '', size = 32 }: ClubLogoProps) {
  const { clubInfo } = useClub();
  const [imageError, setImageError] = useState(false);

  if (!clubInfo.logoUrl || imageError) {
    return (
      <div
        className={`rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-primary font-black text-sm">KC</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0 bg-white dark:bg-[#1c3328] ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={clubInfo.logoUrl}
        alt={clubInfo.clubName || 'Club Logo'}
        className="w-full h-full object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
