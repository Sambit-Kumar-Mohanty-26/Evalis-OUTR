// Simple in-memory TTL cache — no Redis required
interface CacheEntry {
    value: any;
    expiresAt: number;
}

const store = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const cache = {
    get<T>(key: string): T | null {
        const entry = store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            store.delete(key);
            return null;
        }
        return entry.value as T;
    },

    set(key: string, value: any, ttlMs = DEFAULT_TTL_MS): void {
        store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },

    invalidate(prefix: string): void {
        for (const key of store.keys()) {
            if (key.startsWith(prefix)) store.delete(key);
        }
    },

    key(...parts: string[]): string {
        return parts.join(':');
    }
};
