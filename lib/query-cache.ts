// Simple in-memory query cache with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const queryCache = new Map<string, CacheEntry<any>>()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export function getCachedQuery<T>(key: string): T | null {
  const entry = queryCache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > DEFAULT_TTL) {
    queryCache.delete(key)
    return null
  }

  return entry.data as T
}

export function setCachedQuery<T>(key: string, data: T): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

export function clearCache(): void {
  queryCache.clear()
}
