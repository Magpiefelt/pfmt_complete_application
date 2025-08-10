/**
 * Standardized loading state management composable
 * Provides consistent loading indicators and state management across components
 */

import { ref, computed, type Ref } from 'vue'

export interface LoadingState {
  isLoading: Ref<boolean>
  loadingMessage: Ref<string>
  setLoading: (loading: boolean, message?: string) => void
  withLoading: <T>(operation: () => Promise<T>, message?: string) => Promise<T>
}

/**
 * Creates a loading state manager
 */
export const useLoading = (initialMessage: string = 'Loading...'): LoadingState => {
  const isLoading = ref(false)
  const loadingMessage = ref(initialMessage)

  const setLoading = (loading: boolean, message?: string) => {
    isLoading.value = loading
    if (message !== undefined) {
      loadingMessage.value = message
    }
  }

  const withLoading = async <T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    setLoading(true, message)
    try {
      const result = await operation()
      return result
    } finally {
      setLoading(false)
    }
  }

  return {
    isLoading,
    loadingMessage,
    setLoading,
    withLoading
  }
}

/**
 * Multiple loading states manager for components with multiple async operations
 */
export const useMultipleLoading = () => {
  const loadingStates = ref<Record<string, { loading: boolean; message: string }>>({})

  const setLoading = (key: string, loading: boolean, message: string = 'Loading...') => {
    loadingStates.value[key] = { loading, message }
  }

  const isLoading = (key: string): boolean => {
    return loadingStates.value[key]?.loading ?? false
  }

  const getLoadingMessage = (key: string): string => {
    return loadingStates.value[key]?.message ?? 'Loading...'
  }

  const isAnyLoading = computed(() => {
    return Object.values(loadingStates.value).some(state => state.loading)
  })

  const withLoading = async <T>(
    key: string,
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    setLoading(key, true, message)
    try {
      const result = await operation()
      return result
    } finally {
      setLoading(key, false)
    }
  }

  const clearLoading = (key: string) => {
    delete loadingStates.value[key]
  }

  const clearAllLoading = () => {
    loadingStates.value = {}
  }

  return {
    loadingStates: computed(() => loadingStates.value),
    setLoading,
    isLoading,
    getLoadingMessage,
    isAnyLoading,
    withLoading,
    clearLoading,
    clearAllLoading
  }
}

/**
 * Loading state for data fetching operations
 */
export const useDataLoading = <T>(
  fetchFunction: () => Promise<T>,
  options: {
    immediate?: boolean
    loadingMessage?: string
    errorMessage?: string
  } = {}
) => {
  const {
    immediate = true,
    loadingMessage = 'Loading data...',
    errorMessage = 'Failed to load data'
  } = options

  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const { isLoading, withLoading } = useLoading(loadingMessage)

  const fetch = async () => {
    error.value = null
    try {
      const result = await withLoading(fetchFunction, loadingMessage)
      data.value = result
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : errorMessage
      error.value = errorMsg
      throw err
    }
  }

  const refetch = () => fetch()

  // Auto-fetch on mount if immediate is true
  if (immediate) {
    fetch()
  }

  return {
    data: computed(() => data.value),
    error: computed(() => error.value),
    isLoading,
    fetch,
    refetch
  }
}

/**
 * Loading state for form submissions
 */
export const useSubmitLoading = () => {
  const { isLoading, withLoading } = useLoading('Submitting...')
  const isSubmitting = computed(() => isLoading.value)

  const withSubmit = async <T>(
    operation: () => Promise<T>,
    message: string = 'Submitting...'
  ): Promise<T> => {
    return withLoading(operation, message)
  }

  return {
    isSubmitting,
    withSubmit
  }
}

/**
 * Common loading messages for consistency
 */
export const LoadingMessages = {
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  SUBMITTING: 'Submitting...',
  DELETING: 'Deleting...',
  UPLOADING: 'Uploading...',
  DOWNLOADING: 'Downloading...',
  PROCESSING: 'Processing...',
  FETCHING: 'Fetching data...',
  CREATING: 'Creating...',
  UPDATING: 'Updating...',
  VALIDATING: 'Validating...',
  SEARCHING: 'Searching...'
} as const

/**
 * Loading state with automatic timeout
 */
export const useLoadingWithTimeout = (
  timeoutMs: number = 30000,
  timeoutMessage: string = 'Operation is taking longer than expected...'
) => {
  const { isLoading, loadingMessage, setLoading, withLoading } = useLoading()
  const isTimedOut = ref(false)
  let timeoutId: NodeJS.Timeout | null = null

  const setLoadingWithTimeout = (loading: boolean, message?: string) => {
    setLoading(loading, message)
    isTimedOut.value = false

    if (loading) {
      timeoutId = setTimeout(() => {
        isTimedOut.value = true
        loadingMessage.value = timeoutMessage
      }, timeoutMs)
    } else if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const withLoadingTimeout = async <T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    setLoadingWithTimeout(true, message)
    try {
      const result = await operation()
      return result
    } finally {
      setLoadingWithTimeout(false)
    }
  }

  return {
    isLoading,
    loadingMessage,
    isTimedOut: computed(() => isTimedOut.value),
    setLoading: setLoadingWithTimeout,
    withLoading: withLoadingTimeout
  }
}

