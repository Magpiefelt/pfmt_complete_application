import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { apiCache } from './useCache'

export interface AsyncDataOptions<T> {
  immediate?: boolean
  cache?: boolean
  cacheKey?: string
  cacheTtl?: number
  retry?: number
  retryDelay?: number
  timeout?: number
  transform?: (data: any) => T
  onError?: (error: Error) => void
  onSuccess?: (data: T) => void
  dependencies?: Ref<any>[]
  debounce?: number
}

export interface AsyncDataState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  pending: Ref<boolean>
  refresh: () => Promise<void>
  execute: () => Promise<void>
  cancel: () => void
  clear: () => void
}

/**
 * Composable for async data fetching with caching, retry, and error handling
 * Provides a comprehensive solution for API calls and data management
 */
export function useAsyncData<T = any>(
  fetcher: () => Promise<T>,
  options: AsyncDataOptions<T> = {}
): AsyncDataState<T> {
  const {
    immediate = true,
    cache = true,
    cacheKey,
    cacheTtl,
    retry = 3,
    retryDelay = 1000,
    timeout = 30000,
    transform,
    onError,
    onSuccess,
    dependencies = [],
    debounce = 0
  } = options

  // State
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const pending = ref(false)

  // Internal state
  const abortController = ref<AbortController | null>(null)
  const retryCount = ref(0)
  const debounceTimer = ref<NodeJS.Timeout | null>(null)

  // Generate cache key if not provided
  const getCacheKey = (): string => {
    if (cacheKey) return cacheKey
    
    // Generate key based on fetcher function and dependencies
    const depValues = dependencies.map(dep => JSON.stringify(dep.value)).join('|')
    const fetcherStr = fetcher.toString()
    return `async-data:${btoa(fetcherStr + depValues).slice(0, 32)}`
  }

  // Execute the fetcher with retry logic
  const executeWithRetry = async (attempt = 0): Promise<T> => {
    try {
      // Create abort controller for this request
      abortController.value = new AbortController()
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        abortController.value?.abort()
      }, timeout)

      // Execute fetcher
      const result = await fetcher()
      
      clearTimeout(timeoutId)
      
      // Transform data if transformer provided
      return transform ? transform(result) : result
    } catch (err) {
      const error = err as Error
      
      // Don't retry if request was aborted
      if (error.name === 'AbortError') {
        throw error
      }
      
      // Retry logic
      if (attempt < retry) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
        return executeWithRetry(attempt + 1)
      }
      
      throw error
    }
  }

  // Main execute function
  const execute = async (): Promise<void> => {
    // Cancel any pending request
    cancel()
    
    // Clear previous error
    error.value = null
    loading.value = true
    pending.value = true
    retryCount.value = 0

    try {
      const key = getCacheKey()
      
      // Check cache first
      if (cache && apiCache.has(key)) {
        const cachedData = apiCache.get(key)
        if (cachedData !== null) {
          data.value = cachedData
          loading.value = false
          pending.value = false
          
          // If data is stale, fetch in background
          if (apiCache.isStale(key)) {
            executeWithRetry()
              .then(result => {
                data.value = result
                apiCache.set(key, result, cacheTtl)
                onSuccess?.(result)
              })
              .catch(err => {
                console.warn('Background refresh failed:', err)
              })
          } else {
            onSuccess?.(cachedData)
          }
          return
        }
      }

      // Fetch fresh data
      const result = await executeWithRetry()
      
      // Update state
      data.value = result
      
      // Cache the result
      if (cache) {
        apiCache.set(key, result, cacheTtl)
      }
      
      onSuccess?.(result)
    } catch (err) {
      const errorObj = err as Error
      error.value = errorObj
      onError?.(errorObj)
    } finally {
      loading.value = false
      pending.value = false
      abortController.value = null
    }
  }

  // Debounced execute function
  const debouncedExecute = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value)
      }
      
      debounceTimer.value = setTimeout(async () => {
        try {
          await execute()
          resolve()
        } catch (err) {
          reject(err)
        }
      }, debounce)
    })
  }

  // Public execute function (with debounce if configured)
  const publicExecute = debounce > 0 ? debouncedExecute : execute

  // Refresh function (always bypasses cache)
  const refresh = async (): Promise<void> => {
    if (cache) {
      const key = getCacheKey()
      apiCache.remove(key)
    }
    await execute()
  }

  // Cancel ongoing request
  const cancel = (): void => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
      debounceTimer.value = null
    }
    
    loading.value = false
    pending.value = false
  }

  // Clear data and state
  const clear = (): void => {
    cancel()
    data.value = null
    error.value = null
    
    if (cache) {
      const key = getCacheKey()
      apiCache.remove(key)
    }
  }

  // Computed properties
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const hasData = computed(() => data.value !== null)
  const isEmpty = computed(() => {
    if (!data.value) return true
    if (Array.isArray(data.value)) return data.value.length === 0
    if (typeof data.value === 'object') return Object.keys(data.value).length === 0
    return false
  })

  // Watch dependencies and re-execute
  if (dependencies.length > 0) {
    watch(
      dependencies,
      () => {
        if (hasData.value || loading.value) {
          publicExecute()
        }
      },
      { deep: true }
    )
  }

  // Auto-execute on mount if immediate is true
  if (immediate) {
    onMounted(() => {
      publicExecute()
    })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cancel()
  })

  return {
    // State
    data,
    loading,
    error,
    pending,

    // Computed
    isLoading,
    hasError,
    hasData,
    isEmpty,

    // Methods
    execute: publicExecute,
    refresh,
    cancel,
    clear
  }
}

/**
 * Specialized composable for paginated data
 */
export function usePaginatedData<T = any>(
  fetcher: (page: number, limit: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  options: Omit<AsyncDataOptions<T>, 'transform'> & {
    initialPage?: number
    pageSize?: number
    autoLoad?: boolean
  } = {}
) {
  const {
    initialPage = 1,
    pageSize = 10,
    autoLoad = true,
    ...asyncOptions
  } = options

  const currentPage = ref(initialPage)
  const items = ref<T[]>([])
  const total = ref(0)
  const hasMore = ref(true)

  const paginatedFetcher = async () => {
    const result = await fetcher(currentPage.value, pageSize)
    
    if (currentPage.value === 1) {
      items.value = result.data
    } else {
      items.value.push(...result.data)
    }
    
    total.value = result.total
    hasMore.value = result.hasMore
    
    return result
  }

  const asyncData = useAsyncData(paginatedFetcher, {
    ...asyncOptions,
    immediate: autoLoad,
    cacheKey: options.cacheKey ? `${options.cacheKey}:page:${currentPage.value}` : undefined
  })

  const loadMore = async () => {
    if (!hasMore.value || asyncData.loading.value) return
    
    currentPage.value++
    await asyncData.execute()
  }

  const reset = () => {
    currentPage.value = initialPage
    items.value = []
    total.value = 0
    hasMore.value = true
    asyncData.clear()
  }

  const refresh = async () => {
    currentPage.value = initialPage
    items.value = []
    await asyncData.refresh()
  }

  return {
    // Paginated state
    items,
    currentPage,
    total,
    hasMore,
    pageSize,

    // Async state
    loading: asyncData.loading,
    error: asyncData.error,
    pending: asyncData.pending,

    // Methods
    loadMore,
    reset,
    refresh,
    execute: asyncData.execute
  }
}

/**
 * Specialized composable for infinite scroll data
 */
export function useInfiniteData<T = any>(
  fetcher: (cursor?: string) => Promise<{ data: T[]; nextCursor?: string }>,
  options: Omit<AsyncDataOptions<T>, 'transform'> = {}
) {
  const items = ref<T[]>([])
  const nextCursor = ref<string | undefined>()
  const hasMore = ref(true)

  const infiniteFetcher = async () => {
    const result = await fetcher(nextCursor.value)
    
    if (!nextCursor.value) {
      items.value = result.data
    } else {
      items.value.push(...result.data)
    }
    
    nextCursor.value = result.nextCursor
    hasMore.value = !!result.nextCursor
    
    return result
  }

  const asyncData = useAsyncData(infiniteFetcher, {
    ...options,
    cacheKey: options.cacheKey ? `${options.cacheKey}:cursor:${nextCursor.value || 'initial'}` : undefined
  })

  const loadMore = async () => {
    if (!hasMore.value || asyncData.loading.value) return
    await asyncData.execute()
  }

  const reset = () => {
    items.value = []
    nextCursor.value = undefined
    hasMore.value = true
    asyncData.clear()
  }

  return {
    // Infinite state
    items,
    hasMore,
    nextCursor,

    // Async state
    loading: asyncData.loading,
    error: asyncData.error,
    pending: asyncData.pending,

    // Methods
    loadMore,
    reset,
    refresh: asyncData.refresh,
    execute: asyncData.execute
  }
}

