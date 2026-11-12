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
 * Performance notes:
 * - sphere, meridian and orbit geometry is precomputed once into typed
 *   arrays, so the frame loop never calls trigonometry per point;
 * - projected coordinates are written into reusable buffers, so drawing
 *   allocates no per-point objects and creates no garbage;
 * - all square nodes are batched into alpha buckets and filled with a small
 *   number of paths instead of one state change per dot;
 * - halo and satellite glows are cached sprites, rebuilt only when the
 *   accent changes.
 *
 * It is decorative only:
 * - `prefers-reduced-motion` renders a static frame and stops the idle loop.
 * - the canvas pauses while the tab is hidden.
 * - the device pixel ratio is capped to keep phones smooth.
 */

const SEGMENTS = 72;
const MERIDIANS = 7;
const MERIDIAN_STEPS = 40;
const LATITUDE_RINGS = [-67.5, -45, -22.5, 0, 22.5, 45, 67.5];
const ORBIT_SEGMENTS = 144;
const ORBIT_TILT = 0.62;
const ORBIT_RADIUS = 1.45;
const DRIFT_COUNT = 46;
const SURFACE_COUNT = 52;
const TAU = Math.PI * 2;

/** Depth buckets: back of the planet fades out, front stays crisp. */
const DEPTH_ALPHA = [0.06, 0.22, 0.55, 0.95];
const DEPTH_WIDTH_DESKTOP = [0.9, 1.15, 1.5, 2];
const DEPTH_WIDTH_MOBILE = [0.6, 0.8, 1, 1.35];

/**
 * Node brightness is quantized into this many steps. The largest possible
 * error is well under 1% opacity, invisible on 1–3px squares, and it lets a
 * few hundred nodes render with a few dozen fills.
 */
const NODE_BUCKETS = 48;
const NODE_MAX_ALPHA = 0.85;

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface NodeGeometry {
  x: number;
  y: number;
  z: number;
  size: number;
}

interface RingField {
  /** Unit-sphere xyz triplets, precomputed once. */
  vectors: Float32Array;
  /** Reused screen-space xyz buffer, rewritten every frame. */
  projected: Float32Array;
  count: number;
  closed: boolean;
  alpha: number;
}

interface NodeField {
  vectors: Float32Array;
  projected: Float32Array;
  sizes: Float32Array;
  count: number;
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
function buildSurfaceNodes(): NodeGeometry[] {
  const random = makeRandom(90210);
  const points: NodeGeometry[] = [];

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

function buildDriftNodes(): NodeGeometry[] {
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

function toNodeField(nodes: NodeGeometry[]): NodeField {
  const vectors = new Float32Array(nodes.length * 3);
  const sizes = new Float32Array(nodes.length);

  nodes.forEach((node, index) => {
    vectors[index * 3] = node.x;
    vectors[index * 3 + 1] = node.y;
    vectors[index * 3 + 2] = node.z;
    sizes[index] = node.size;
  });

  return {
    vectors,
    projected: new Float32Array(vectors.length),
    sizes,
    count: nodes.length,
  };
}

function buildLatitudeRings(): RingField[] {
  return LATITUDE_RINGS.map((latitude) => {
    const lat = (latitude * Math.PI) / 180;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const vectors = new Float32Array(SEGMENTS * 3);

    for (let index = 0; index < SEGMENTS; index += 1) {
      const lon = (index / SEGMENTS) * TAU;
      vectors[index * 3] = cosLat * Math.cos(lon);
      vectors[index * 3 + 1] = sinLat;
      vectors[index * 3 + 2] = cosLat * Math.sin(lon);
    }

    return {
      vectors,
      projected: new Float32Array(vectors.length),
      count: SEGMENTS,
      closed: true,
      // The equator reads as the horizon and gets slightly more weight.
      alpha: Math.abs(latitude) < 1 ? 0.78 : 0.52,
    };
  });
}

function buildMeridians(): RingField[] {
  return Array.from({ length: MERIDIANS }, (_, index) => {
    const lon = (index / MERIDIANS) * Math.PI;
    const cosLon = Math.cos(lon);
    const sinLon = Math.sin(lon);
    const count = MERIDIAN_STEPS + 1;
    const vectors = new Float32Array(count * 3);

    for (let step = 0; step < count; step += 1) {
      const lat = -Math.PI / 2 + (step / MERIDIAN_STEPS) * Math.PI;
      const cosLat = Math.cos(lat);
      vectors[step * 3] = cosLat * cosLon;
      vectors[step * 3 + 1] = Math.sin(lat);
      vectors[step * 3 + 2] = cosLat * sinLon;
    }

    return {
      vectors,
      projected: new Float32Array(vectors.length),
      count,
      closed: false,
      alpha: 0.44,
    };
  });
}

function buildOrbit(): RingField {
  const count = ORBIT_SEGMENTS + 1;
  const cosOrbit = Math.cos(ORBIT_TILT);
  const sinOrbit = Math.sin(ORBIT_TILT);
  const vectors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const angle = (index / ORBIT_SEGMENTS) * TAU;
    vectors[index * 3] = Math.cos(angle) * ORBIT_RADIUS;
    vectors[index * 3 + 1] = Math.sin(angle) * sinOrbit;
    vectors[index * 3 + 2] = Math.sin(angle) * cosOrbit;
  }

  return {
    vectors,
    projected: new Float32Array(vectors.length),
    count,
    closed: false,
    alpha: 1,
  };
}

const LATITUDE_FIELDS = buildLatitudeRings();
const MERIDIAN_FIELDS = buildMeridians();
const ORBIT_FIELD = buildOrbit();
const SURFACE_FIELD = toNodeField(buildSurfaceNodes());
const DRIFT_FIELD = toNodeField(buildDriftNodes());
const ORBIT_COS = Math.cos(ORBIT_TILT);
const ORBIT_SIN = Math.sin(ORBIT_TILT);

function createHaloSprite(accent: string): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const spriteCtx = canvas.getContext('2d');
  if (!spriteCtx) return canvas;

  const half = size / 2;
  // Same inner/outer radius ratio as the previous per-frame gradient:
  // inner radius = 0.1 × planet radius, outer = 1.6 × planet radius.
  const gradient = spriteCtx.createRadialGradient(
    half,
    half,
    half * (0.1 / 1.6),
    half,
    half,
    half
  );
  gradient.addColorStop(0, `rgba(${accent}, 0.1)`);
  gradient.addColorStop(0.55, `rgba(${accent}, 0.035)`);
  gradient.addColorStop(1, `rgba(${accent}, 0)`);
  spriteCtx.fillStyle = gradient;
  spriteCtx.fillRect(0, 0, size, size);
  return canvas;
}

function createGlowSprite(accent: string): HTMLCanvasElement {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const spriteCtx = canvas.getContext('2d');
  if (!spriteCtx) return canvas;

  const half = size / 2;
  const gradient = spriteCtx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, `rgba(${accent}, 1)`);
  gradient.addColorStop(1, `rgba(${accent}, 0)`);
  spriteCtx.fillStyle = gradient;
  spriteCtx.fillRect(0, 0, size, size);
  return canvas;
}

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

    let haloAccent = '';
    let haloSprite: HTMLCanvasElement | null = null;
    let glowSprite: HTMLCanvasElement | null = null;

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
    let disposed = false;

    // Reading scrollHeight forces layout, so the page range is cached and
    // refreshed on resize / content changes instead of on every scroll event.
    let viewportRange = 1;
    let metricsFrame = 0;
    let metricsQueued = false;

    let resizeFrame = 0;

    const readTheme = () => {
      const styles = getComputedStyle(document.documentElement);
      const currentAccent = styles.getPropertyValue('--primary-rgb').trim();
      if (currentAccent) accent = currentAccent;
      isLight = document.documentElement.classList.contains('light');
    };

    const ensureSprites = () => {
      // The halo is tinted per accent, but its brightness is applied with
      // globalAlpha, so light / dark mode can reuse the same bitmap.
      if (haloSprite && glowSprite && haloAccent === accent) return;
      haloAccent = accent;
      haloSprite = createHaloSprite(accent);
      glowSprite = createGlowSprite(accent);
    };

    const updateScrollMetrics = () => {
      metricsFrame = 0;
      metricsQueued = false;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      // Two viewports is the full transformation, but short pages reach the
      // end of the range at their own bottom instead of only halfway.
      viewportRange = Math.min(
        Math.max(1, window.innerHeight * 2.2),
        maxScroll
      );
      readScroll();
    };

    const queueScrollMetrics = () => {
      if (metricsQueued) return;
      metricsQueued = true;
      metricsFrame = window.requestAnimationFrame(updateScrollMetrics);
    };

    const readScroll = () => {
      targetProgress = Math.min(1, Math.max(0, window.scrollY / viewportRange));
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
      updateScrollMetrics();
      if (reduceMotion) draw(0);
    };

    const queueResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        if (!disposed) resize();
      });
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

      const projectPoint = (x: number, y: number, z: number) => {
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

      const projectField = (field: RingField | NodeField) => {
        const src = field.vectors;
        const dst = field.projected;

        for (let index = 0; index < src.length; index += 3) {
          const x = src[index];
          const y = src[index + 1];
          const z = src[index + 2];
          const rotatedX = x * cosY + z * sinY;
          const rotatedZ = -x * sinY + z * cosY;
          const tiltedY = y * cosTilt - rotatedZ * sinTilt;
          const tiltedZ = y * sinTilt + rotatedZ * cosTilt;
          const perspective = 1 + tiltedZ * 0.3;

          dst[index] = centerX + rotatedX * radius * perspective;
          dst[index + 1] = centerY + tiltedY * radius * perspective;
          dst[index + 2] = tiltedZ;
        }
      };

      projectField(ORBIT_FIELD);
      LATITUDE_FIELDS.forEach(projectField);
      MERIDIAN_FIELDS.forEach(projectField);
      projectField(SURFACE_FIELD);
      projectField(DRIFT_FIELD);

      // A soft halo gives the wireframe some depth without heavy shadows.
      // It is a cached sprite now, drawn at the planet's bounds.
      if (haloSprite) {
        const haloRadius = radius * 1.6;
        ctx.globalAlpha = lightFactor;
        ctx.drawImage(
          haloSprite,
          centerX - haloRadius,
          centerY - haloRadius,
          haloRadius * 2,
          haloRadius * 2
        );
        ctx.globalAlpha = 1;
      }

      const newBuckets = () => [
        new Path2D(),
        new Path2D(),
        new Path2D(),
        new Path2D(),
      ];

      const addRingSegments = (field: RingField, buckets: Path2D[]) => {
        const points = field.projected;
        const count = field.count;
        const segmentCount = field.closed ? count : count - 1;

        for (let index = 0; index < segmentCount; index += 1) {
          const start = index * 3;
          const end = ((index + 1) % count) * 3;
          const depth = (points[start + 2] + points[end + 2]) / 2;
          const bucket = Math.max(
            0,
            Math.min(3, Math.floor(((depth + 1) / 2) * 4))
          );
          const path = buckets[bucket];
          path.moveTo(points[start], points[start + 1]);
          path.lineTo(points[end], points[end + 1]);
        }
      };

      const strokeBuckets = (buckets: Path2D[], baseAlpha: number) => {
        for (let index = 0; index < buckets.length; index += 1) {
          const alpha = baseAlpha * DEPTH_ALPHA[index] * lightFactor;
          if (alpha <= 0.002) continue;
          ctx.lineWidth = isCompact
            ? DEPTH_WIDTH_MOBILE[index]
            : DEPTH_WIDTH_DESKTOP[index];
          ctx.strokeStyle = `rgba(${accent}, ${alpha})`;
          ctx.stroke(buckets[index]);
        }
      };

      // ── Orbit ring, split into behind/in-front passes ──────────────
      const drawOrbitSide = (front: boolean) => {
        const path = new Path2D();
        const points = ORBIT_FIELD.projected;

        for (let index = 0; index < ORBIT_SEGMENTS; index += 1) {
          const start = index * 3;
          const end = (index + 1) * 3;
          const depth = (points[start + 2] + points[end + 2]) / 2;
          if (front ? depth < 0 : depth >= 0) continue;
          path.moveTo(points[start], points[start + 1]);
          path.lineTo(points[end], points[end + 1]);
        }

        ctx.lineWidth = front ? 1.4 : 0.9;
        ctx.strokeStyle = `rgba(${accent}, ${
          (front ? 0.5 : 0.16) * lightFactor
        })`;
        ctx.stroke(path);
      };

      drawOrbitSide(false);

      // ── Planet wireframe ──────────────────────────────────────────
      // Rings never overlap each other, so one stroke per depth bucket is
      // visually identical to stroking every ring separately.
      const latitudeBuckets = newBuckets();
      const equatorBuckets = newBuckets();

      LATITUDE_FIELDS.forEach((field) => {
        addRingSegments(
          field,
          field.alpha > 0.6 ? equatorBuckets : latitudeBuckets
        );
      });

      strokeBuckets(latitudeBuckets, 0.52);
      strokeBuckets(equatorBuckets, 0.78);

      // Meridians stay as individual strokes: they all meet at the poles,
      // and separate strokes preserve the brighter convergence there.
      MERIDIAN_FIELDS.forEach((field) => {
        const buckets = newBuckets();
        addRingSegments(field, buckets);
        strokeBuckets(buckets, 0.44);
      });

      // Square nodes echo the site's pixel-grid style. They are collected
      // into alpha buckets, then filled with one path per bucket.
      const nodePaths = new Array<Path2D | null>(NODE_BUCKETS).fill(null);

      const addNode = (
        x: number,
        y: number,
        size: number,
        alphaBase: number
      ) => {
        const bucket = Math.max(
          0,
          Math.min(
            NODE_BUCKETS - 1,
            Math.round((alphaBase / NODE_MAX_ALPHA) * (NODE_BUCKETS - 1))
          )
        );
        let path = nodePaths[bucket];
        if (!path) {
          path = new Path2D();
          nodePaths[bucket] = path;
        }
        path.rect(x - size / 2, y - size / 2, size, size);
      };

      LATITUDE_FIELDS.forEach((field) => {
        const points = field.projected;

        for (let index = 0; index < field.count; index += 6) {
          const offset = index * 3;
          const depthMix = (points[offset + 2] + 1) / 2;
          const size =
            (0.9 + Math.pow(depthMix, 1.6) * 1.5) *
            (isCompact ? 0.8 : 1);

          addNode(
            points[offset],
            points[offset + 1],
            size,
            0.04 + Math.pow(depthMix, 2) * 0.72
          );
        }
      });

      // Irregular surface dots: the main cue that the planet is turning.
      const surfacePoints = SURFACE_FIELD.projected;
      const surfaceSizes = SURFACE_FIELD.sizes;

      for (let index = 0; index < SURFACE_FIELD.count; index += 1) {
        const offset = index * 3;
        const depthMix = (surfacePoints[offset + 2] + 1) / 2;
        const size =
          surfaceSizes[index] *
          (0.55 + depthMix * 1.2) *
          (isCompact ? 0.85 : 1);

        addNode(
          surfacePoints[offset],
          surfacePoints[offset + 1],
          size,
          0.05 + Math.pow(depthMix, 1.9) * 0.8
        );
      }

      // Free-floating particles around the planet add depth layers.
      const driftPoints = DRIFT_FIELD.projected;
      const driftSizes = DRIFT_FIELD.sizes;

      for (let index = 0; index < DRIFT_FIELD.count; index += 1) {
        const offset = index * 3;
        const depthMix = (driftPoints[offset + 2] + 1) / 2;
        const size =
          driftSizes[index] *
          (0.8 + depthMix * 0.9) *
          (isCompact ? 0.85 : 1);

        addNode(
          driftPoints[offset],
          driftPoints[offset + 1],
          size,
          0.05 + Math.pow(depthMix, 1.7) * 0.5
        );
      }

      for (let bucket = 0; bucket < NODE_BUCKETS; bucket += 1) {
        const path = nodePaths[bucket];
        if (!path) continue;
        const alpha =
          (bucket / (NODE_BUCKETS - 1)) * NODE_MAX_ALPHA * lightFactor;
        if (alpha <= 0.002) continue;
        ctx.fillStyle = `rgba(${accent}, ${alpha})`;
        ctx.fill(path);
      }

      // ── In-front orbit pass and satellite ─────────────────────────
      const satelliteAngle = now * 0.0005 + progress * TAU * 1.1;
      const satellite = projectPoint(
        Math.cos(satelliteAngle) * ORBIT_RADIUS,
        Math.sin(satelliteAngle) * ORBIT_SIN,
        Math.sin(satelliteAngle) * ORBIT_COS
      );

      const drawSatellite = (front: boolean) => {
        const glowRadius = front ? 20 : 12;
        if (glowSprite) {
          ctx.globalAlpha = (front ? 0.55 : 0.18) * lightFactor;
          ctx.drawImage(
            glowSprite,
            satellite.x - glowRadius,
            satellite.y - glowRadius,
            glowRadius * 2,
            glowRadius * 2
          );
          ctx.globalAlpha = 1;
        }

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
      ensureSprites();
      if (reduceMotion) draw(0);
    });

    // Async content (fonts, images, lists) can change the page height; keep
    // the cached scroll range in sync without reading it on every scroll.
    const bodyObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => queueScrollMetrics())
        : null;

    readTheme();
    ensureSprites();
    resize();
    draw(0);
    start();

    bodyObserver?.observe(document.body);
    window.addEventListener('resize', queueResize);
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
      disposed = true;
      stop();
      bodyObserver?.disconnect();
      themeObserver.disconnect();
      window.cancelAnimationFrame(metricsFrame);
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', queueResize);
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
