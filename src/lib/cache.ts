export interface CacheConfig {
  ttl?: number;
  encrypt?: boolean;
  storage?: 'localStorage' | 'sessionStorage';
  maxSize?: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
  signature: string;
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
  ttl: 60 * 60 * 1000,
  encrypt: true,
  storage: 'localStorage',
  maxSize: 1024 * 1024,
};

function simpleXOREncrypt(text: string, key: string): string {
  try {
    const utf8Bytes = new TextEncoder().encode(text);
    const keyBytes = new TextEncoder().encode(key);

    const xorBytes = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
      xorBytes[i] = utf8Bytes[i] ^ keyBytes[i % keyBytes.length];
    }

    const binaryString = String.fromCharCode.apply(null, Array.from(xorBytes));
    return btoa(binaryString);
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
}

function simpleXORDecrypt(encrypted: string, key: string): string {
  try {
    const binaryString = atob(encrypted);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const keyBytes = new TextEncoder().encode(key);
    const xorBytes = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      xorBytes[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return new TextDecoder().decode(xorBytes);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

function generateSignature(data: string, salt: string): string {
  const combined = data + salt;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function verifySignature(data: string, signature: string, salt: string): boolean {
  const expectedSignature = generateSignature(data, salt);
  return signature === expectedSignature;
}

function getStorageObject(storage: 'localStorage' | 'sessionStorage'): Storage {
  if (typeof window === 'undefined') {
    throw new Error('Cache system only works in browser environment');
  }
  return storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
}

export class SecureCache {
  private static readonly CACHE_PREFIX = '__secure_cache_';
  private static readonly ENCRYPTION_KEY = '__cache_key_' + (typeof window !== 'undefined' ? window.location.hostname : '');

  static set<T = unknown>(
    key: string,
    value: T,
    config: CacheConfig = {}
  ): boolean {
    try {
      const finalConfig = { ...DEFAULT_CONFIG, ...config };
      const fullKey = this.CACHE_PREFIX + key;

      const serialized = JSON.stringify(value);
      if (serialized.length > finalConfig.maxSize) {
        console.warn(`Cache value for "${key}" exceeds max size limit`);
        return false;
      }

      const now = Date.now();
      const entry: CacheEntry<T> = {
        value,
        timestamp: now,
        expiresAt: now + (finalConfig.ttl ?? DEFAULT_CONFIG.ttl),
        signature: generateSignature(serialized, fullKey),
      };

      let dataToStore = JSON.stringify(entry);

      if (finalConfig.encrypt) {
        dataToStore = simpleXOREncrypt(dataToStore, this.ENCRYPTION_KEY);
      }

      const storage = getStorageObject(finalConfig.storage);
      storage.setItem(fullKey, dataToStore);

      return true;
    } catch (error) {
      console.error(`Failed to set cache for "${key}":`, error);
      return false;
    }
  }

  static get<T = unknown>(key: string, config: CacheConfig = {}): T | null {
    try {
      const finalConfig = { ...DEFAULT_CONFIG, ...config };
      const fullKey = this.CACHE_PREFIX + key;
      const storage = getStorageObject(finalConfig.storage);

      const stored = storage.getItem(fullKey);
      if (!stored) return null;

      let dataStr = stored;

      if (finalConfig.encrypt) {
        dataStr = simpleXORDecrypt(stored, this.ENCRYPTION_KEY);
        if (!dataStr) return null;
      }

      const entry: CacheEntry<T> = JSON.parse(dataStr);

      if (Date.now() > entry.expiresAt) {
        this.remove(key, config);
        return null;
      }

      const serialized = JSON.stringify(entry.value);
      if (!verifySignature(serialized, entry.signature, fullKey)) {
        console.warn(`Cache signature verification failed for "${key}", removing...`);
        this.remove(key, config);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error(`Failed to get cache for "${key}":`, error);
      return null;
    }
  }

  static remove(key: string, config: CacheConfig = {}): boolean {
    try {
      const finalConfig = { ...DEFAULT_CONFIG, ...config };
      const fullKey = this.CACHE_PREFIX + key;
      const storage = getStorageObject(finalConfig.storage);
      storage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Failed to remove cache for "${key}":`, error);
      return false;
    }
  }

  static clear(storage: 'localStorage' | 'sessionStorage' = 'localStorage'): void {
    try {
      const st = getStorageObject(storage);
      const keysToRemove: string[] = [];

      for (let i = 0; i < st.length; i++) {
        const key = st.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => st.removeItem(key));
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  static getStats(storage: 'localStorage' | 'sessionStorage' = 'localStorage'): {
    count: number;
    totalSize: number;
    entries: Array<{ key: string; size: number; expiresIn: number }>;
  } {
    try {
      const st = getStorageObject(storage);
      let totalSize = 0;
      const entries: Array<{ key: string; size: number; expiresIn: number }> = [];

      for (let i = 0; i < st.length; i++) {
        const key = st.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          const stored = st.getItem(key);
          const size = stored ? stored.length : 0;
          totalSize += size;

          try {
            let dataStr = stored;
            if (stored) {
              dataStr = simpleXORDecrypt(stored, this.ENCRYPTION_KEY);
              const entry = JSON.parse(dataStr || '{}') as CacheEntry<unknown>;
              const expiresIn = Math.max(0, entry.expiresAt - Date.now());
              entries.push({
                key: key.replace(this.CACHE_PREFIX, ''),
                size,
                expiresIn,
              });
            }
          } catch {
            entries.push({
              key: key.replace(this.CACHE_PREFIX, ''),
              size,
              expiresIn: -1,
            });
          }
        }
      }

      return {
        count: entries.length,
        totalSize,
        entries,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { count: 0, totalSize: 0, entries: [] };
    }
  }

  static verify(key: string, config: CacheConfig = {}): boolean {
    try {
      const finalConfig = { ...DEFAULT_CONFIG, ...config };
      const fullKey = this.CACHE_PREFIX + key;
      const storage = getStorageObject(finalConfig.storage);

      const stored = storage.getItem(fullKey);
      if (!stored) return false;

      let dataStr = stored;

      if (finalConfig.encrypt) {
        dataStr = simpleXORDecrypt(stored, this.ENCRYPTION_KEY);
        if (!dataStr) return false;
      }

      const entry: CacheEntry<unknown> = JSON.parse(dataStr);

      if (Date.now() > entry.expiresAt) {
        return false;
      }

      const serialized = JSON.stringify(entry.value);
      return verifySignature(serialized, entry.signature, fullKey);
    } catch {
      return false;
    }
  }
}

export function useCache<T = unknown>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = {}
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const refetch = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const cached = SecureCache.get<T>(key, config);
      if (cached) {
        setData(cached);
        return;
      }

      const result = await fetcher();
      SecureCache.set(key, result, config);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, config]);

  const invalidate = React.useCallback(() => {
    SecureCache.remove(key, config);
    setData(null);
  }, [key, config]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch, invalidate };
}

import React from 'react';
