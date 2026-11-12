'use client';

import { useEffect, useRef } from 'react';

/**
 * Homepage-only, scroll-reactive wireframe globe.
 *
 * A lightweight 2D canvas renders a 3D point grid: the globe rotates with
 * page scroll and time, drifts with the pointer, and takes its colour from
 * the active accent palette. No Three.js, no WebGL, no extra requests.
 *
 * It is decorative only:
 * - `prefers-reduced-motion` renders a static frame and stops the idle loop.
 * - the canvas pauses while the tab is hidden.
 * - the device pixel ratio is capped to keep phones smooth.
 */

const SEGMENTS = 64;
const MERIDIANS = 8;
const LATITUDE_RINGS = [-60, -30, 0, 30, 60];
const PARTICLE_COUNT = 42;
const TAU = Math.PI * 2;

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
}

function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function buildParticles(): Particle[] {
  const random = makeRandom(1337);
  return Array.from({ length: PARTICLE_COUNT }, () => {
    // Uniform-ish direction, then push some points outside the globe shell.
    const theta = random() * TAU;
    const y = random() * 2 - 1;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const shell = 1.08 + random() * 0.42;
    return {
      x: Math.cos(theta) * radius * shell,
      y: y * shell,
      z: Math.sin(theta) * radius * shell,
      size: 0.7 + random() * 1.4,
    };
  });
}

const PARTICLES = buildParticles();

export function HomeScrollBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = motionQuery.matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let accent = '125, 255, 171';
    let isLight = document.documentElement.classList.contains('light');
    let scrollProgress = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let animationFrame = 0;
    let running = false;
    let lastPaint = 0;

    const readTheme = () => {
      const styles = getComputedStyle(document.documentElement);
      const currentAccent = styles.getPropertyValue('--primary-rgb').trim();
      if (currentAccent) accent = currentAccent;
      isLight = document.documentElement.classList.contains('light');
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      updateScroll();
    };

    const updateScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress =
        maxScroll > 0
          ? Math.min(1, Math.max(0, window.scrollY / maxScroll))
          : 0;

      if (reduceMotion) draw(0);
    };

    const draw = (time: number) => {
      if (!width || !height) return;

      const now = reduceMotion ? 0 : time;
      const px = reduceMotion ? 0 : pointerX;
      const py = reduceMotion ? 0 : pointerY;

      ctx.clearRect(0, 0, width, height);

      const lightFactor =
        (isLight ? 0.62 : 1) * (width < 640 ? 0.72 : 1);
      const radius =
        Math.min(width, height) *
        (width < 640 ? 0.32 : 0.36) *
        (1 + scrollProgress * 0.16);
      const centerX =
        width * (width < 768 ? 0.5 : 0.66) + px * 14;
      const centerY =
        height * (0.48 - scrollProgress * 0.1) + py * 10;
      const angleY =
        scrollProgress * TAU * 1.35 +
        now * 0.000075 +
        px * 0.24;
      const tilt = -0.34 + scrollProgress * 0.2 + py * 0.08;
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);

      const project = (
        x: number,
        y: number,
        z: number
      ): ProjectedPoint => {
        const rotatedX = x * cosY + z * sinY;
        const rotatedZ = -x * sinY + z * cosY;
        const tiltedY = y * cosTilt - rotatedZ * sinTilt;
        const tiltedZ = y * sinTilt + rotatedZ * cosTilt;
        const perspective = 1 + tiltedZ * 0.12;

        return {
          x: centerX + rotatedX * radius * perspective,
          y: centerY + tiltedY * radius * perspective,
          z: tiltedZ,
        };
      };

      // A soft halo gives the wireframe some depth without heavy shadows.
      const halo = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.1,
        centerX,
        centerY,
        radius * 1.55
      );
      halo.addColorStop(0, `rgba(${accent}, ${0.07 * lightFactor})`);
      halo.addColorStop(0.55, `rgba(${accent}, ${0.025 * lightFactor})`);
      halo.addColorStop(1, `rgba(${accent}, 0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      const strokeSegments = (
        points: ProjectedPoint[],
        closed: boolean,
        baseAlpha: number
      ) => {
        const buckets = [
          new Path2D(),
          new Path2D(),
          new Path2D(),
          new Path2D(),
        ];
        const count = points.length;
        const segmentCount = closed ? count : count - 1;

        for (let index = 0; index < segmentCount; index += 1) {
          const start = points[index];
          const end = points[(index + 1) % count];
          const depth = (start.z + end.z) / 2;
          const bucket = Math.max(
            0,
            Math.min(3, Math.floor(((depth + 1) / 2) * 4))
          );
          const path = buckets[bucket];
          path.moveTo(start.x, start.y);
          path.lineTo(end.x, end.y);
        }

        ctx.lineWidth = width < 640 ? 0.8 : 1;
        buckets.forEach((path, index) => {
          const depthMix = (index + 0.5) / 4;
          const alpha =
            baseAlpha * (0.25 + depthMix * 0.95) * lightFactor;
          ctx.strokeStyle = `rgba(${accent}, ${alpha})`;
          ctx.stroke(path);
        });
      };

      // Latitude rings.
      LATITUDE_RINGS.forEach((latitude) => {
        const lat = (latitude * Math.PI) / 180;
        const cosLat = Math.cos(lat);
        const sinLat = Math.sin(lat);
        const points: ProjectedPoint[] = [];

        for (let index = 0; index < SEGMENTS; index += 1) {
          const lon = (index / SEGMENTS) * TAU;
          points.push(
            project(
              cosLat * Math.cos(lon),
              sinLat,
              cosLat * Math.sin(lon)
            )
          );
        }

        strokeSegments(points, true, 0.16);

        // Square nodes every few segments echo the site's pixel-grid style.
        if (Math.abs(latitude) < 60) {
          for (let index = 0; index < SEGMENTS; index += 8) {
            const point = points[index];
            const depthMix = (point.z + 1) / 2;
            const size = 1 + depthMix * 1.2;
            ctx.fillStyle = `rgba(${accent}, ${
              (0.14 + depthMix * 0.3) * lightFactor
            })`;
            ctx.fillRect(
              point.x - size / 2,
              point.y - size / 2,
              size,
              size
            );
          }
        }
      });

      // Meridian lines (half great circles from pole to pole).
      for (let index = 0; index < MERIDIANS; index += 1) {
        const lon = (index / MERIDIANS) * Math.PI;
        const cosLon = Math.cos(lon);
        const sinLon = Math.sin(lon);
        const points: ProjectedPoint[] = [];

        for (let step = 0; step <= 36; step += 1) {
          const lat = -Math.PI / 2 + (step / 36) * Math.PI;
          const cosLat = Math.cos(lat);
          points.push(
            project(
              cosLat * cosLon,
              Math.sin(lat),
              cosLat * sinLon
            )
          );
        }

        strokeSegments(points, false, 0.13);
      }

      // Free-floating particles around the globe.
      PARTICLES.forEach((particle) => {
        const point = project(particle.x, particle.y, particle.z);
        const depthMix = (point.z + 1) / 2;
        const size =
          particle.size * (0.8 + depthMix * 0.9);
        ctx.fillStyle = `rgba(${accent}, ${
          (0.08 + depthMix * 0.34) * lightFactor
        })`;
        ctx.fillRect(
          point.x - size / 2,
          point.y - size / 2,
          size,
          size
        );
      });
    };

    const tick = (time: number) => {
      if (!running) return;
      pointerX += (targetX - pointerX) * 0.055;
      pointerY += (targetY - pointerY) * 0.055;

      // A calm 30fps is plenty for a background and saves battery on laptops.
      if (time - lastPaint >= 32) {
        lastPaint = time;
        draw(time);
      }
      animationFrame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      animationFrame = window.requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      window.cancelAnimationFrame(animationFrame);
    };

    const handleScroll = () => {
      updateScroll();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (reduceMotion || event.pointerType === 'touch') return;
      targetX = (event.clientX / Math.max(1, width)) * 2 - 1;
      targetY = (event.clientY / Math.max(1, height)) * 2 - 1;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    const handleMotionChange = () => {
      reduceMotion = motionQuery.matches;
      if (reduceMotion) {
        stop();
        pointerX = 0;
        pointerY = 0;
        draw(0);
      } else {
        start();
      }
    };

    const themeObserver = new MutationObserver(() => {
      readTheme();
      if (reduceMotion) draw(0);
    });

    readTheme();
    resize();
    draw(0);
    start();

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    document.addEventListener('visibilitychange', handleVisibility);
    motionQuery.addEventListener('change', handleMotionChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-accent'],
    });

    return () => {
      stop();
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibility);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
