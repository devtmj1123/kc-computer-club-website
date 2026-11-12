'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ClubMarkProps {
  size?: number;
  priority?: boolean;
  className?: string;
  src?: string;
  alt?: string;
}

export function ClubMark({
  size = 36,
  priority = false,
  className = '',
  src,
  alt = '坤成中学电脑学会',
}: ClubMarkProps) {
  const [failed, setFailed] = useState(false);
  const requestedSrc = src?.trim();

  useEffect(() => {
    setFailed(false);
  }, [requestedSrc]);

  return (
    <img
      src={!failed && requestedSrc ? requestedSrc : '/logo.svg'}
      alt={alt}
      width={size}
      height={size}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      onError={() => setFailed(true)}
      className={cn('shrink-0 object-contain', className)}
    />
  );
}
