'use client';

import { useEffect, useRef } from 'react';

/**
 * Fixed background grid for the whole site.
 * A faint 64px grid stays visible; the same lines brighten softly around
 * the pointer through a small radial mask. Decorative only.
 */
export function GridBackdrop() {
  const hotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hot = hotRef.current;
    if (!hot) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.38;

    const paint = () => {
      hot.style.setProperty('--mx', `${x}px`);
      hot.style.setProperty('--my', `${y}px`);
    };

    const onPointerMove = (event: PointerEvent | MouseEvent) => {
      x = event.clientX;
      y = event.clientY;
      paint();
    };

    // Paint once so the grid reads as alive before the first movement.
    paint();
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onPointerMove);
    };
  }, []);

  return (
    <div className="grid-backdrop" aria-hidden="true">
      <div className="grid-backdrop__base" />
      <div ref={hotRef} className="grid-backdrop__hot" />
      <div className="grid-backdrop__vignette" />
      <div className="grid-backdrop__noise" />
    </div>
  );
}
