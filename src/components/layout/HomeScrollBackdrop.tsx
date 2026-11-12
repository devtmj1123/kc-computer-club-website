'use client';

import { useEffect, useRef } from 'react';

/**
 * Homepage-only, scroll-reactive wireframe planet.
 *
 * A lightweight 2D canvas renders a 3D point grid: the planet rotates with
 * page scroll and time, drifts with the pointer, and takes its colour from
 * the active accent palette. No Three.js, no WebGL, no extra requests.
 *
 * Three details keep the 3D read obvious:
 * - surface points form irregular "continents", breaking the rotational
 *   symmetry of a plain latitude/longitude grid;
 * - a strong perspective makes front geometry larger and brighter than back
 *   geometry;
 * - an inclined orbit ring is drawn in two passes, so it visibly passes
 *   behind and in front of the planet.
 *
 * It is decorative only:
 * - `prefers-reduced-motion` renders a static frame and stops the idle loop.
 * - the canvas pauses while the tab is hidden.
 * - the device pixel ratio is capped to keep phones smooth.
 */

const SEGMENTS = 72;
const MERIDIANS = 7;
const LATITUDE_RINGS = [-67.5, -45, -22.5, 0, 22.5, 45, 67.5];
const ORBIT_SEGMENTS = 144;
const ORBIT_TILT = 0.62;
const DRIFT_COUNT = 46;
const SURFACE_COUNT = 52;
const TAU = Math.PI * 2;

/** Depth buckets: back of the planet fades out, front stays crisp. */
const DEPTH_ALPHA = [0.06, 0.22, 0.55, 0.95];
const DEPTH_WIDTH_DESKTOP = [0.9, 1.15, 1.5, 2];
const DEPTH_WIDTH_MOBILE = [0.6, 0.8, 1, 1.35];

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
}

interface SurfacePoint extends Vec3 {
  size: number;
}

interface DriftParticle extends Vec3 {
  size: number;
}

function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function randomDirection(random: () => number): Vec3 {
  const y = random() * 2 - 1;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const angle = random() * TAU;
  return {
    x: Math.cos(angle) * radius,
    y,
    z: Math.sin(angle) * radius,
  };
}

/**
 * Irregular dots scattered over the sphere. A few dense clusters read as
 * landmasses; the sparse rest gives the surface texture. Because these are
 * not rotationally symmetric, the scroll spin is immediately visible.
 */
function buildSurfacePoints(): SurfacePoint[] {
  const random = makeRandom(90210);
  const points: SurfacePoint[] = [];

  for (let cluster = 0; cluster < 6; cluster += 1) {
    const center = randomDirection(random);
    const count = 20 + Math.floor(random() * 12);

    for (let index = 0; index < count; index += 1) {
      const offset = randomDirection(random);
      const x = center.x * 2.8 + offset.x;
      const y = center.y * 2.8 + offset.y;
      const z = center.z * 2.8 + offset.z;
      const length = Math.hypot(x, y, z) || 1;

      points.push({
        x: x / length,
        y: y / length,
        z: z / length,
        size: 0.8 + random() * 1.4,
      });
    }
  }

  for (let index = 0; index < SURFACE_COUNT; index += 1) {
    const direction = randomDirection(random);
    points.push({ ...direction, size: 0.5 + random() * 0.9 });
  }

  return points;
}

function buildDriftParticles(): DriftParticle[] {
  const random = makeRandom(1337);
  return Array.from({ length: DRIFT_COUNT }, () => {
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

const SURFACE_POINTS = buildSurfacePoints();
const DRIFT_PARTICLES = buildDriftParticles();

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

    // Scroll state is eased towards the target every frame. Progress is
    // measured in viewports (not the whole page) so one or two swipes of the
    // wheel produce a full, clearly visible transformation.
    let progress = 0;
    let targetProgress = 0;
    let scrollSpin = 0;
    let targetSpin = 0;

    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;

    let animationFrame = 0;
    let running = false;
    let lastPaint = 0;
    let initialized = false;

    const readTheme = () => {
      const styles = getComputedStyle(document.documentElement);
      const currentAccent = styles.getPropertyValue('--primary-rgb').trim();
      if (currentAccent) accent = currentAccent;
      isLight = document.documentElement.classList.contains('light');
    };

    const readScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      // Two viewports is the full transformation, but short pages reach the
      // end of the range at their own bottom instead of only halfway.
      const viewportRange = Math.min(
        Math.max(1, window.innerHeight * 2.2),
        maxScroll
      );
      targetProgress = Math.min(
        1,
        Math.max(0, window.scrollY / viewportRange)
      );
      targetSpin = window.scrollY * 0.0012;

      if (reduceMotion || !initialized) {
        progress = targetProgress;
        scrollSpin = targetSpin;
        initialized = true;
      }

      if (reduceMotion) draw(0);
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
      readScroll();
    };

    const draw = (time: number) => {
      if (!width || !height) return;

      const now = reduceMotion ? 0 : time;
      const px = reduceMotion ? 0 : pointerX;
      const py = reduceMotion ? 0 : pointerY;
      const isCompact = width < 640;

      ctx.clearRect(0, 0, width, height);

      const lightFactor = (isLight ? 0.7 : 1) * (isCompact ? 0.82 : 1);
      const radius =
        Math.min(width, height) *
        (isCompact ? 0.36 : 0.42) *
        (1 + progress * 0.24);
      const centerX =
        width * (width < 768 ? 0.5 : 0.68) +
        px * 26 -
        progress * width * 0.04;
      const centerY = height * (0.44 - progress * 0.16) + py * 20;
      const angleY =
        scrollSpin +
        progress * TAU * 0.75 +
        now * 0.0001 +
        px * 0.35;
      const tilt = -0.5 + progress * 0.62 + py * 0.18;
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
        // Strong perspective: the front hemisphere is noticeably larger.
        const perspective = 1 + tiltedZ * 0.3;

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
        radius * 1.6
      );
      halo.addColorStop(0, `rgba(${accent}, ${0.1 * lightFactor})`);
      halo.addColorStop(0.55, `rgba(${accent}, ${0.035 * lightFactor})`);
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

        buckets.forEach((path, index) => {
          const alpha = baseAlpha * DEPTH_ALPHA[index] * lightFactor;
          if (alpha <= 0.002) return;
          ctx.lineWidth = isCompact
            ? DEPTH_WIDTH_MOBILE[index]
            : DEPTH_WIDTH_DESKTOP[index];
          ctx.strokeStyle = `rgba(${accent}, ${alpha})`;
          ctx.stroke(path);
        });
      };

      // ── Orbit ring, split into behind/in-front passes ──────────────
      const orbitPoints: ProjectedPoint[] = [];
      const cosOrbit = Math.cos(ORBIT_TILT);
      const sinOrbit = Math.sin(ORBIT_TILT);
      const orbitRadius = 1.45;

      for (let index = 0; index <= ORBIT_SEGMENTS; index += 1) {
        const angle = (index / ORBIT_SEGMENTS) * TAU;
        orbitPoints.push(
          project(
            Math.cos(angle) * orbitRadius,
            Math.sin(angle) * sinOrbit,
            Math.sin(angle) * cosOrbit
          )
        );
      }

      const drawOrbitSide = (front: boolean) => {
        const path = new Path2D();
        for (let index = 0; index < ORBIT_SEGMENTS; index += 1) {
          const start = orbitPoints[index];
          const end = orbitPoints[index + 1];
          const depth = (start.z + end.z) / 2;
          if (front ? depth < 0 : depth >= 0) continue;
          path.moveTo(start.x, start.y);
          path.lineTo(end.x, end.y);
        }
        ctx.lineWidth = front ? 1.4 : 0.9;
        ctx.strokeStyle = `rgba(${accent}, ${
          (front ? 0.5 : 0.16) * lightFactor
        })`;
        ctx.stroke(path);
      };

      drawOrbitSide(false);

      // ── Planet wireframe ──────────────────────────────────────────
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

        // The equator reads as the horizon and gets slightly more weight.
        strokeSegments(points, true, Math.abs(latitude) < 1 ? 0.78 : 0.52);

        // Square nodes echo the site's pixel-grid style.
        for (let index = 0; index < SEGMENTS; index += 6) {
          const point = points[index];
          const depthMix = (point.z + 1) / 2;
          const size =
            (0.9 + Math.pow(depthMix, 1.6) * 1.5) *
            (isCompact ? 0.8 : 1);
          ctx.fillStyle = `rgba(${accent}, ${
            (0.04 + Math.pow(depthMix, 2) * 0.72) * lightFactor
          })`;
          ctx.fillRect(
            point.x - size / 2,
            point.y - size / 2,
            size,
            size
          );
        }
      });

      // Meridian lines (half great circles from pole to pole).
      for (let index = 0; index < MERIDIANS; index += 1) {
        const lon = (index / MERIDIANS) * Math.PI;
        const cosLon = Math.cos(lon);
        const sinLon = Math.sin(lon);
        const points: ProjectedPoint[] = [];

        for (let step = 0; step <= 40; step += 1) {
          const lat = -Math.PI / 2 + (step / 40) * Math.PI;
          const cosLat = Math.cos(lat);
          points.push(
            project(
              cosLat * cosLon,
              Math.sin(lat),
              cosLat * sinLon
            )
          );
        }

        strokeSegments(points, false, 0.44);
      }

      // Irregular surface dots: the main cue that the planet is turning.
      SURFACE_POINTS.forEach((point) => {
        const projected = project(point.x, point.y, point.z);
        const depthMix = (projected.z + 1) / 2;
        const size =
          point.size *
          (0.55 + depthMix * 1.2) *
          (isCompact ? 0.85 : 1);
        ctx.fillStyle = `rgba(${accent}, ${
          (0.05 + Math.pow(depthMix, 1.9) * 0.8) * lightFactor
        })`;
        ctx.fillRect(
          projected.x - size / 2,
          projected.y - size / 2,
          size,
          size
        );
      });

      // Free-floating particles around the planet add depth layers.
      DRIFT_PARTICLES.forEach((particle) => {
        const point = project(particle.x, particle.y, particle.z);
        const depthMix = (point.z + 1) / 2;
        const size =
          particle.size * (0.8 + depthMix * 0.9) * (isCompact ? 0.85 : 1);
        ctx.fillStyle = `rgba(${accent}, ${
          (0.05 + Math.pow(depthMix, 1.7) * 0.5) * lightFactor
        })`;
        ctx.fillRect(
          point.x - size / 2,
          point.y - size / 2,
          size,
          size
        );
      });

      // ── In-front orbit pass and satellite ─────────────────────────
      const satelliteAngle = now * 0.0005 + progress * TAU * 1.1;
      const satellite = project(
        Math.cos(satelliteAngle) * orbitRadius,
        Math.sin(satelliteAngle) * sinOrbit,
        Math.sin(satelliteAngle) * cosOrbit
      );

      const drawSatellite = (front: boolean) => {
        const glowRadius = front ? 20 : 12;
        const glow = ctx.createRadialGradient(
          satellite.x,
          satellite.y,
          0,
          satellite.x,
          satellite.y,
          glowRadius
        );
        glow.addColorStop(
          0,
          `rgba(${accent}, ${(front ? 0.55 : 0.18) * lightFactor})`
        );
        glow.addColorStop(1, `rgba(${accent}, 0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(
          satellite.x - glowRadius,
          satellite.y - glowRadius,
          glowRadius * 2,
          glowRadius * 2
        );

        const size = front ? 3.4 : 2.2;
        ctx.fillStyle = `rgba(${accent}, ${
          (front ? 0.95 : 0.35) * lightFactor
        })`;
        ctx.fillRect(
          satellite.x - size / 2,
          satellite.y - size / 2,
          size,
          size
        );
      };

      if (satellite.z < 0) {
        // The satellite sits behind the planet: keep it dim and let the
        // front half of the orbit ring pass over it.
        drawSatellite(false);
        drawOrbitSide(true);
      } else {
        drawOrbitSide(true);
        drawSatellite(true);
      }
    };

    const tick = (time: number) => {
      if (!running) return;

      pointerX += (targetX - pointerX) * 0.06;
      pointerY += (targetY - pointerY) * 0.06;
      progress += (targetProgress - progress) * 0.12;
      scrollSpin += (targetSpin - scrollSpin) * 0.12;

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
      readScroll();
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
        progress = targetProgress;
        scrollSpin = targetSpin;
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
