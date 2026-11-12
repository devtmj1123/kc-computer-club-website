'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const START_PROGRESS = 10;
const MAX_BEFORE_DONE = 92;

/**
 * A lightweight top-of-page progress bar for client-side navigations.
 *
 * Next.js does not expose router events in the App Router, so we start on
 * internal link clicks / back-forward and finish when the pathname commits.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef<number[]>([]);
  const running = useRef(false);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) {
      window.clearInterval(id);
      window.clearTimeout(id);
    }
    timers.current = [];
  }, []);

  const begin = useCallback(() => {
    if (running.current) return;
    running.current = true;
    clearTimers();
    setVisible(true);
    setProgress(START_PROGRESS);

    const interval = window.setInterval(() => {
      setProgress((value) => {
        if (value >= MAX_BEFORE_DONE) return value;
        const remaining = MAX_BEFORE_DONE - value;
        return value + Math.max(0.5, remaining * 0.12);
      });
    }, 180);
    timers.current.push(interval);

    // Never leave the bar stuck if a navigation is interrupted.
    const safety = window.setTimeout(() => {
      running.current = false;
      clearTimers();
      setVisible(false);
      setProgress(0);
    }, 12000);
    timers.current.push(safety);
  }, [clearTimers]);

  const finish = useCallback(() => {
    if (!running.current) return;
    running.current = false;
    clearTimers();
    setProgress(100);
    const timeout = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 260);
    timers.current.push(timeout);
  }, [clearTimers]);

  // Finish once Next commits the new URL.
  useEffect(() => {
    finish();
  }, [pathname, finish]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        anchor.getAttribute('target') === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      begin();
    };

    const handlePopState = () => begin();

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
      clearTimers();
    };
  }, [begin, clearTimers]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[2px] transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-full origin-left bg-[var(--primary)] shadow-[0_0_10px_var(--primary)] transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
