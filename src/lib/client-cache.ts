/**
 * Small in-memory cache for public read-only API responses.
 *
 * It only lives for the current tab/session, so it cannot leak data between
 * visitors. Auth transitions clear it explicitly. The cache also deduplicates
 * in-flight requests, which keeps the homepage and list pages from asking for
 * the same public data twice during startup.
 */

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

interface FetchOptions {
  ttlMs?: number;
  force?: boolean;
  cache?: boolean;
}

const DEFAULT_TTL_MS = 45_000;

const memoryCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

let generation = 0;

export const publicDataUrls = {
  clubSettings: '/api/club-settings',
  notices: '/api/notices?onlyPublished=true&visibility=public',
  activities: '/api/activities?onlyPublished=true&visibility=public',
  projects: '/api/projects',
} as const;

export function readCachedJson<T>(url: string): T | null {
  const entry = memoryCache.get(url);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(url);
    return null;
  }

  return entry.data as T;
}

export function writeCachedJson<T>(url: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  memoryCache.set(url, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearPublicCache(): void {
  generation += 1;
  memoryCache.clear();
  inFlight.clear();
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = '';
    try {
      message = await response.text();
    } catch {
      // Ignore body read failures; the status is enough for the caller.
    }
    throw new Error(message || `请求失败 (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function fetchCachedJson<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const shouldCache = options.cache !== false;
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;

  if (shouldCache && !options.force) {
    const cached = readCachedJson<T>(url);
    if (cached !== null) return cached;

    const pending = inFlight.get(url);
    if (pending) return pending as Promise<T>;
  }

  const requestGeneration = generation;
  const request = (async () => {
    const response = await fetch(url);
    const data = await readJsonResponse<T>(response);

    // Do not repopulate the cache after logout/login cleared it.
    if (shouldCache && requestGeneration === generation) {
      writeCachedJson(url, data, ttlMs);
    }

    return data;
  })();

  if (shouldCache) {
    inFlight.set(url, request);
  }

  try {
    return await request;
  } finally {
    if (shouldCache && inFlight.get(url) === request) {
      inFlight.delete(url);
    }
  }
}

/**
 * Warm the routes most visitors open next. Called once per full page load
 * during idle time so it does not compete with the first screen.
 */
export async function prefetchPublicData(): Promise<void> {
  await Promise.allSettled([
    fetchCachedJson(publicDataUrls.clubSettings),
    fetchCachedJson(publicDataUrls.notices),
    fetchCachedJson(publicDataUrls.activities),
    fetchCachedJson(publicDataUrls.projects),
  ]);
}
