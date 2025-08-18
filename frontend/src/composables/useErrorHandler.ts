import { ref, computed } from 'vue'

export interface ErrorState {
  message: string
  code?: string | number
  details?: any
  timestamp: Date
}

export const useErrorHandler = () => {
  const error = ref<ErrorState | null>(null)
  const isLoading = ref(false)

  const hasError = computed(() => error.value !== null)

  const setError = (message: string, code?: string | number, details?: any) => {
    error.value = {
      message,
      code,
      details,
      timestamp: new Date()
    }
  }

  const clearError = () => {
    error.value = null
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
    if (loading) {
      clearError() // Clear previous errors when starting new operation
    }
  }

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    setLoading(true)
    clearError()

    try {
      const result = await operation()
      return result
    } catch (err: any) {
      const message = errorMessage || err.message || 'An unexpected error occurred'
      setError(message, err.code || err.status, err)
      console.error('Operation failed:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const retry = async <T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    return handleAsyncOperation(operation, errorMessage)
  }

  return {
    error: computed(() => error.value),
    hasError,
    isLoading: computed(() => isLoading.value),
    setError,
    clearError,
    setLoading,
    handleAsyncOperation,
    retry
  }
}

