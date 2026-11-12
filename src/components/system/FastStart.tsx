'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { prefetchPublicData } from '@/lib/client-cache';

const PREFETCH_ROUTES = ['/notices', '/activities', '/projects', '/about', '/attendance'];

/**
 * Warms the public routes and public API responses once the first screen is
 * interactive. Runs during idle time so it never competes with hydration or
 * the initial data fetch.
 */
export function FastStart() {
  const pathname = usePathname();
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || pathname?.startsWith('/admin')) return;
    started.current = true;

    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      for (const route of PREFETCH_ROUTES) {
        router.prefetch(route);
      }
      void prefetchPublicData();
    };

    const idleId =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(run, { timeout: 2500 })
        : window.setTimeout(run, 900);

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [pathname, router]);

  return null;
}
