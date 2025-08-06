import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'

interface GlobalStateOptions {
  persist?: boolean
  storageKey?: string
  storage?: Storage
}

interface LoadingState {
  [key: string]: boolean
}

interface ErrorState {
  [key: string]: Error | string | null
}

/**
 * Global state management composable
 * Provides centralized state management for loading, errors, and UI state
 */
export function useGlobalState() {
  // Loading states
  const loadingStates = ref<LoadingState>({})
  
  // Error states
  const errorStates = ref<ErrorState>({})
  
  // UI states
  const sidebarCollapsed = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
    persistent?: boolean
  }>>([])

  // Loading state management
  const setLoading = (key: string, loading: boolean) => {
    if (loading) {
      loadingStates.value[key] = true
    } else {
      delete loadingStates.value[key]
    }
  }

  const isLoading = (key?: string) => {
    if (key) {
      return loadingStates.value[key] || false
    }
    return Object.keys(loadingStates.value).length > 0
  }

  const clearLoading = (key?: string) => {
    if (key) {
      delete loadingStates.value[key]
    } else {
      loadingStates.value = {}
    }
  }

  // Error state management
  const setError = (key: string, error: Error | string | null) => {
    if (error) {
      errorStates.value[key] = error
    } else {
      delete errorStates.value[key]
    }
  }

  const getError = (key: string) => {
    return errorStates.value[key] || null
  }

  const hasError = (key?: string) => {
    if (key) {
      return !!errorStates.value[key]
    }
    return Object.keys(errorStates.value).length > 0
  }

  const clearError = (key?: string) => {
    if (key) {
      delete errorStates.value[key]
    } else {
      errorStates.value = {}
    }
  }

  // Notification management
  const addNotification = (notification: Omit<typeof notifications.value[0], 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification = {
      id,
      duration: 5000,
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // Auto-remove non-persistent notifications
    if (!newNotification.persistent && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  // Convenience notification methods
  const notifySuccess = (title: string, message?: string, options?: Partial<typeof notifications.value[0]>) => {
    return addNotification({ type: 'success', title, message, ...options })
  }

  const notifyError = (title: string, message?: string, options?: Partial<typeof notifications.value[0]>) => {
    return addNotification({ type: 'error', title, message, persistent: true, ...options })
  }

  const notifyWarning = (title: string, message?: string, options?: Partial<typeof notifications.value[0]>) => {
    return addNotification({ type: 'warning', title, message, ...options })
  }

  const notifyInfo = (title: string, message?: string, options?: Partial<typeof notifications.value[0]>) => {
    return addNotification({ type: 'info', title, message, ...options })
  }

  // UI state management
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
  }

  // Computed properties
  const anyLoading = computed(() => isLoading())
  const anyErrors = computed(() => hasError())
  const loadingKeys = computed(() => Object.keys(loadingStates.value))
  const errorKeys = computed(() => Object.keys(errorStates.value))
  const notificationCount = computed(() => notifications.value.length)

  return {
    // Loading state
    loadingStates,
    setLoading,
    isLoading,
    clearLoading,
    anyLoading,
    loadingKeys,

    // Error state
    errorStates,
    setError,
    getError,
    hasError,
    clearError,
    anyErrors,
    errorKeys,

    // Notifications
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notificationCount,

    // UI state
    sidebarCollapsed,
    theme,
    toggleSidebar,
    setSidebarCollapsed,
    toggleTheme,
    setTheme
  }
}

/**
 * Persistent state composable
 * Automatically saves and restores state from localStorage
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: GlobalStateOptions = {}
): [Ref<T>, (value: T) => void] {
  const {
    persist = true,
    storageKey = key,
    storage = localStorage
  } = options

  // Initialize state from storage or default
  const getInitialValue = (): T => {
    if (!persist || typeof window === 'undefined') {
      return defaultValue
    }

    try {
      const stored = storage.getItem(storageKey)
      if (stored !== null) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn(`Failed to parse stored value for key "${storageKey}":`, error)
    }

    return defaultValue
  }

  const state = ref<T>(getInitialValue())

  // Save to storage when state changes
  const setState = (value: T) => {
    state.value = value

    if (persist && typeof window !== 'undefined') {
      try {
        storage.setItem(storageKey, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save state for key "${storageKey}":`, error)
      }
    }
  }

  // Watch for changes and persist
  if (persist) {
    watch(
      state,
      (newValue) => {
        if (typeof window !== 'undefined') {
          try {
            storage.setItem(storageKey, JSON.stringify(newValue))
          } catch (error) {
            console.warn(`Failed to persist state for key "${storageKey}":`, error)
          }
        }
      },
      { deep: true }
    )
  }

  return [state, setState]
}

/**
 * Global state instance
 */
export const globalState = useGlobalState()

/**
 * Commonly used persistent states
 */
export const [userPreferences, setUserPreferences] = usePersistentState('user-preferences', {
  theme: 'light' as 'light' | 'dark',
  sidebarCollapsed: false,
  language: 'en',
  timezone: 'America/Edmonton',
  dateFormat: 'MM/DD/YYYY',
  currency: 'CAD'
})

export const [recentProjects, setRecentProjects] = usePersistentState<string[]>('recent-projects', [])

export const [dashboardLayout, setDashboardLayout] = usePersistentState('dashboard-layout', {
  widgets: ['projects', 'budget', 'meetings', 'reports'],
  columns: 2
})

/**
 * Helper hook for managing async operations with global state
 */
export function useAsyncOperation<T = any>(key: string) {
  const { setLoading, setError, clearError } = globalState

  const execute = async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(key, true)
      clearError(key)
      
      const result = await operation()
      return result
    } catch (error) {
      setError(key, error as Error)
      return null
    } finally {
      setLoading(key, false)
    }
  }

  return {
    execute,
    isLoading: computed(() => globalState.isLoading(key)),
    error: computed(() => globalState.getError(key)),
    clearError: () => clearError(key)
  }
}

