/**
 * Standardized pagination composable
 * Provides consistent pagination functionality across components
 */

import { ref, computed, watch, type Ref } from 'vue'

export interface PaginationOptions {
  initialPage?: number
  initialPageSize?: number
  pageSizeOptions?: number[]
  maxVisiblePages?: number
}

export interface PaginationState {
  currentPage: Ref<number>
  pageSize: Ref<number>
  totalItems: Ref<number>
  totalPages: Ref<number>
  startIndex: Ref<number>
  endIndex: Ref<number>
  hasNext: Ref<boolean>
  hasPrev: Ref<boolean>
  visiblePages: Ref<number[]>
  pageSizeOptions: Ref<number[]>
  
  // Methods
  goToPage: (page: number) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  setPageSize: (size: number) => void
  setTotalItems: (total: number) => void
  reset: () => void
}

/**
 * Creates a pagination state manager
 */
export const usePagination = (options: PaginationOptions = {}): PaginationState => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [5, 10, 25, 50, 100],
    maxVisiblePages = 5
  } = options

  // Reactive state
  const currentPage = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const totalItems = ref(0)
  const pageSizeOptionsRef = ref(pageSizeOptions)

  // Computed properties
  const totalPages = computed(() => {
    return Math.ceil(totalItems.value / pageSize.value) || 1
  })

  const startIndex = computed(() => {
    return (currentPage.value - 1) * pageSize.value
  })

  const endIndex = computed(() => {
    return Math.min(startIndex.value + pageSize.value - 1, totalItems.value - 1)
  })

  const hasNext = computed(() => {
    return currentPage.value < totalPages.value
  })

  const hasPrev = computed(() => {
    return currentPage.value > 1
  })

  const visiblePages = computed(() => {
    const total = totalPages.value
    const current = currentPage.value
    const max = maxVisiblePages

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }

    const half = Math.floor(max / 2)
    let start = Math.max(1, current - half)
    let end = Math.min(total, start + max - 1)

    if (end - start + 1 < max) {
      start = Math.max(1, end - max + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })

  // Methods
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const goToNextPage = () => {
    if (hasNext.value) {
      currentPage.value++
    }
  }

  const goToPreviousPage = () => {
    if (hasPrev.value) {
      currentPage.value--
    }
  }

  const goToFirstPage = () => {
    currentPage.value = 1
  }

  const goToLastPage = () => {
    currentPage.value = totalPages.value
  }

  const setPageSize = (size: number) => {
    pageSize.value = size
    // Reset to first page when page size changes
    currentPage.value = 1
  }

  const setTotalItems = (total: number) => {
    totalItems.value = total
    // Ensure current page is valid
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value)
    }
  }

  const reset = () => {
    currentPage.value = initialPage
    pageSize.value = initialPageSize
    totalItems.value = 0
  }

  // Watch for page size changes to reset current page
  watch(pageSize, () => {
    currentPage.value = 1
  })

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasNext,
    hasPrev,
    visiblePages,
    pageSizeOptions: pageSizeOptionsRef,
    
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,
    setTotalItems,
    reset
  }
}

/**
 * Pagination for data arrays (client-side pagination)
 */
export const useArrayPagination = <T>(
  data: Ref<T[]>,
  options: PaginationOptions = {}
) => {
  const pagination = usePagination(options)

  // Update total items when data changes
  watch(data, (newData) => {
    pagination.setTotalItems(newData.length)
  }, { immediate: true })

  // Computed paginated data
  const paginatedData = computed(() => {
    const start = pagination.startIndex.value
    const end = start + pagination.pageSize.value
    return data.value.slice(start, end)
  })

  return {
    ...pagination,
    paginatedData
  }
}

/**
 * Pagination for server-side data
 */
export const useServerPagination = <T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{
    data: T[]
    total: number
    page: number
    pageSize: number
  }>,
  options: PaginationOptions = {}
) => {
  const pagination = usePagination(options)
  const data = ref<T[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchData = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await fetchFunction(
        pagination.currentPage.value,
        pagination.pageSize.value
      )

      data.value = result.data
      pagination.setTotalItems(result.total)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch data'
      console.error('Pagination fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  // Watch for page or page size changes
  watch([pagination.currentPage, pagination.pageSize], fetchData, { immediate: true })

  const refresh = () => {
    fetchData()
  }

  return {
    ...pagination,
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    refresh,
    fetchData
  }
}

/**
 * Pagination info helper
 */
export const usePaginationInfo = (pagination: PaginationState) => {
  const info = computed(() => {
    const start = pagination.startIndex.value + 1
    const end = pagination.endIndex.value + 1
    const total = pagination.totalItems.value

    if (total === 0) {
      return 'No items'
    }

    if (start === end) {
      return `${start} of ${total}`
    }

    return `${start}-${end} of ${total}`
  })

  const pageInfo = computed(() => {
    return `Page ${pagination.currentPage.value} of ${pagination.totalPages.value}`
  })

  return {
    info,
    pageInfo
  }
}

/**
 * Common pagination configurations
 */
export const PaginationConfigs = {
  small: {
    initialPageSize: 5,
    pageSizeOptions: [5, 10, 15],
    maxVisiblePages: 3
  },
  medium: {
    initialPageSize: 10,
    pageSizeOptions: [10, 25, 50],
    maxVisiblePages: 5
  },
  large: {
    initialPageSize: 25,
    pageSizeOptions: [25, 50, 100, 200],
    maxVisiblePages: 7
  },
  table: {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxVisiblePages: 5
  },
  dashboard: {
    initialPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    maxVisiblePages: 5
  }
} as const

