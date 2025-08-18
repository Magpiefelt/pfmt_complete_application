import { ref, computed } from 'vue'
import type { Ref } from 'vue'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
  staleWhileRevalidate?: boolean // Return stale data while fetching fresh data
}

/**
 * Composable for caching API responses and other data
 * Provides in-memory caching with TTL and size limits
 */
export function useCache<T = any>(options: CacheOptions = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    maxSize = 100,
    staleWhileRevalidate = true
  } = options

  const cache = ref<Map<string, CacheEntry<T>>>(new Map())
  const loading = ref<Set<string>>(new Set())

  /**
   * Get data from cache
   */
  const get = (key: string): T | null => {
    const entry = cache.value.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      cache.value.delete(key)
      return null
    }
    
    return entry.data
  }

  /**
   * Set data in cache
   */
  const set = (key: string, data: T, customTtl?: number): void => {
    const now = Date.now()
    const expirationTime = customTtl || ttl
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + expirationTime
    }
    
    // Remove oldest entries if cache is full
    if (cache.value.size >= maxSize) {
      const oldestKey = cache.value.keys().next().value
      if (oldestKey) {
        cache.value.delete(oldestKey)
      }
    }
    
    cache.value.set(key, entry)
  }

  /**
   * Check if key exists and is not expired
   */
  const has = (key: string): boolean => {
    const entry = cache.value.get(key)
    
    if (!entry) return false
    
    if (Date.now() > entry.expiresAt) {
      cache.value.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Check if data is stale (exists but close to expiration)
   */
  const isStale = (key: string, staleThreshold = 0.8): boolean => {
    const entry = cache.value.get(key)
    
    if (!entry) return false
    
    const age = Date.now() - entry.timestamp
    const maxAge = entry.expiresAt - entry.timestamp
    
    return age / maxAge > staleThreshold
  }

  /**
   * Remove specific key from cache
   */
  const remove = (key: string): boolean => {
    return cache.value.delete(key)
  }

  /**
   * Clear all cache entries
   */
  const clear = (): void => {
    cache.value.clear()
    loading.value.clear()
  }

  /**
   * Get or fetch data with caching
   */
  const getOrFetch = async <R = T>(
    key: string,
    fetcher: () => Promise<R>,
    options: { 
      force?: boolean
      customTtl?: number
      background?: boolean
    } = {}
  ): Promise<R> => {
    const { force = false, customTtl, background = false } = options

    // Return cached data if available and not forced
    if (!force && has(key)) {
      const cachedData = get(key) as R
      
      // If stale and staleWhileRevalidate is enabled, fetch in background
      if (staleWhileRevalidate && isStale(key) && !loading.value.has(key)) {
        fetchInBackground(key, fetcher, customTtl)
      }
      
      return cachedData
    }

    // Prevent duplicate requests
    if (loading.value.has(key) && !force) {
      // Wait for ongoing request
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!loading.value.has(key)) {
            clearInterval(checkInterval)
            const data = get(key) as R
            if (data !== null) {
              resolve(data)
            } else {
              reject(new Error('Failed to fetch data'))
            }
          }
        }, 50)
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error('Request timeout'))
        }, 30000)
      })
    }

    // Fetch data
    loading.value.add(key)
    
    try {
      const data = await fetcher()
      set(key, data as T, customTtl)
      return data
    } catch (error) {
      // If we have stale data and this is a background refresh, return stale data
      if (background && has(key)) {
        return get(key) as R
      }
      throw error
    } finally {
      loading.value.delete(key)
    }
  }

  /**
   * Fetch data in background without blocking
   */
  const fetchInBackground = async <R = T>(
    key: string,
    fetcher: () => Promise<R>,
    customTtl?: number
  ): Promise<void> => {
    if (loading.value.has(key)) return

    loading.value.add(key)
    
    try {
      const data = await fetcher()
      set(key, data as T, customTtl)
    } catch (error) {
      console.warn(`Background fetch failed for key: ${key}`, error)
    } finally {
      loading.value.delete(key)
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  const invalidatePattern = (pattern: string | RegExp): number => {
    let count = 0
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    
    for (const key of cache.value.keys()) {
      if (regex.test(key)) {
        cache.value.delete(key)
        count++
      }
    }
    
    return count
  }

  /**
   * Get cache statistics
   */
  const stats = computed(() => ({
    size: cache.value.size,
    maxSize,
    loadingCount: loading.value.size,
    hitRate: 0, // Could be implemented with hit/miss counters
    entries: Array.from(cache.value.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.data).length,
      age: Date.now() - entry.timestamp,
      ttl: entry.expiresAt - entry.timestamp,
      isStale: isStale(key)
    }))
  }))

  /**
   * Cleanup expired entries
   */
  const cleanup = (): number => {
    let count = 0
    const now = Date.now()
    
    for (const [key, entry] of cache.value.entries()) {
      if (now > entry.expiresAt) {
        cache.value.delete(key)
        count++
      }
    }
    
    return count
  }

  // Auto cleanup every 5 minutes
  setInterval(cleanup, 5 * 60 * 1000)

  return {
    // Core methods
    get,
    set,
    has,
    remove,
    clear,
    
    // Advanced methods
    getOrFetch,
    fetchInBackground,
    invalidatePattern,
    isStale,
    cleanup,
    
    // State
    loading: computed(() => Array.from(loading.value)),
    stats
  }
}

/**
 * Global cache instance for application-wide caching
 */
export const globalCache = useCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 200,
  staleWhileRevalidate: true
})

/**
 * Specialized cache for API responses
 */
export const apiCache = useCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 150,
  staleWhileRevalidate: true
})

/**
 * Short-term cache for UI state
 */
export const uiCache = useCache({
  ttl: 2 * 60 * 1000, // 2 minutes
  maxSize: 50,
  staleWhileRevalidate: false
})

