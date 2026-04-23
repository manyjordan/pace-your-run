const CACHE_VERSION = "v1";
const TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export const cache = {
  get<T>(key: string): T | null {
    try {
      const storage = getStorage();
      if (!storage) return null;
      const raw = storage.getItem(`pace_cache_${key}`);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (entry.version !== CACHE_VERSION) return null;
      if (Date.now() - entry.timestamp > TTL_MS) return null;
      return entry.data;
    } catch {
      return null;
    }
  },

  set<T>(key: string, data: T): void {
    try {
      const storage = getStorage();
      if (!storage) return;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      storage.setItem(`pace_cache_${key}`, JSON.stringify(entry));
    } catch {
      // localStorage full or unavailable
    }
  },

  invalidate(key: string): void {
    try {
      const storage = getStorage();
      if (!storage) return;
      storage.removeItem(`pace_cache_${key}`);
    } catch {
      // ignore
    }
  },

  invalidateAll(): void {
    try {
      const storage = getStorage();
      if (!storage) return;
      Object.keys(storage)
        .filter((key) => key.startsWith("pace_cache_"))
        .forEach((key) => storage.removeItem(key));
    } catch {
      // ignore
    }
  },
};
