import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'

export interface SearchFilters {
  query: string
  status?: string[]
  dateRange?: {
    start: string
    end: string
  }
  assignee?: string[]
  priority?: string[]
  tags?: string[]
}

export interface SearchableItem {
  id: string | number
  title?: string
  name?: string
  description?: string
  status?: string
  created_at?: string
  updated_at?: string
  assignee?: string
  priority?: string
  tags?: string[]
  [key: string]: any
}

/**
 * Composable for search and filtering functionality
 * Provides client-side search with multiple filter options
 */
export function useSearch<T extends SearchableItem>(items: Ref<T[]>) {
  const searchQuery = ref('')
  const filters = ref<SearchFilters>({
    query: '',
    status: [],
    assignee: [],
    priority: [],
    tags: []
  })
  const sortBy = ref<string>('updated_at')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  // Debounced search query
  const debouncedQuery = ref('')
  let debounceTimer: NodeJS.Timeout | null = null

  watch(searchQuery, (newQuery) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      debouncedQuery.value = newQuery
      filters.value.query = newQuery
    }, 300)
  })

  /**
   * Filter items based on search query
   */
  const searchItems = (items: T[], query: string): T[] => {
    if (!query.trim()) return items

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
    
    return items.filter(item => {
      const searchableText = [
        item.title || item.name || '',
        item.description || '',
        item.status || '',
        item.assignee || '',
        ...(item.tags || [])
      ].join(' ').toLowerCase()

      return searchTerms.every(term => searchableText.includes(term))
    })
  }

  /**
   * Filter items based on status
   */
  const filterByStatus = (items: T[], statuses: string[]): T[] => {
    if (!statuses || statuses.length === 0) return items
    return items.filter(item => item.status && statuses.includes(item.status))
  }

  /**
   * Filter items based on date range
   */
  const filterByDateRange = (items: T[], dateRange?: { start: string; end: string }): T[] => {
    if (!dateRange || !dateRange.start || !dateRange.end) return items

    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)

    return items.filter(item => {
      const itemDate = new Date(item.updated_at || item.created_at || '')
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  /**
   * Filter items based on assignee
   */
  const filterByAssignee = (items: T[], assignees: string[]): T[] => {
    if (!assignees || assignees.length === 0) return items
    return items.filter(item => item.assignee && assignees.includes(item.assignee))
  }

  /**
   * Filter items based on priority
   */
  const filterByPriority = (items: T[], priorities: string[]): T[] => {
    if (!priorities || priorities.length === 0) return items
    return items.filter(item => item.priority && priorities.includes(item.priority))
  }

  /**
   * Filter items based on tags
   */
  const filterByTags = (items: T[], tags: string[]): T[] => {
    if (!tags || tags.length === 0) return items
    return items.filter(item => 
      item.tags && item.tags.some(tag => tags.includes(tag))
    )
  }

  /**
   * Sort items based on field and order
   */
  const sortItems = (items: T[], field: string, order: 'asc' | 'desc'): T[] => {
    return [...items].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]

      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1

      let comparison = 0
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        // Convert to strings for comparison
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return order === 'desc' ? -comparison : comparison
    })
  }

  /**
   * Apply all filters and sorting
   */
  const filteredAndSortedItems = computed(() => {
    let result = [...items.value]

    // Apply search query
    if (debouncedQuery.value) {
      result = searchItems(result, debouncedQuery.value)
    }

    // Apply status filter
    if (filters.value.status && filters.value.status.length > 0) {
      result = filterByStatus(result, filters.value.status)
    }

    // Apply date range filter
    if (filters.value.dateRange) {
      result = filterByDateRange(result, filters.value.dateRange)
    }

    // Apply assignee filter
    if (filters.value.assignee && filters.value.assignee.length > 0) {
      result = filterByAssignee(result, filters.value.assignee)
    }

    // Apply priority filter
    if (filters.value.priority && filters.value.priority.length > 0) {
      result = filterByPriority(result, filters.value.priority)
    }

    // Apply tags filter
    if (filters.value.tags && filters.value.tags.length > 0) {
      result = filterByTags(result, filters.value.tags)
    }

    // Apply sorting
    result = sortItems(result, sortBy.value, sortOrder.value)

    return result
  })

  /**
   * Get unique values for filter options
   */
  const getUniqueValues = (field: keyof T): string[] => {
    const values = items.value
      .map(item => item[field])
      .filter(value => value !== undefined && value !== null)
      .map(value => String(value))

    return [...new Set(values)].sort()
  }

  /**
   * Get unique status values
   */
  const availableStatuses = computed(() => getUniqueValues('status'))

  /**
   * Get unique assignee values
   */
  const availableAssignees = computed(() => getUniqueValues('assignee'))

  /**
   * Get unique priority values
   */
  const availablePriorities = computed(() => getUniqueValues('priority'))

  /**
   * Get unique tags
   */
  const availableTags = computed(() => {
    const allTags = items.value
      .flatMap(item => item.tags || [])
      .filter(tag => tag && tag.trim())

    return [...new Set(allTags)].sort()
  })

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    searchQuery.value = ''
    debouncedQuery.value = ''
    filters.value = {
      query: '',
      status: [],
      assignee: [],
      priority: [],
      tags: []
    }
  }

  /**
   * Set search query
   */
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  /**
   * Set filters
   */
  const setFilters = (newFilters: Partial<SearchFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  /**
   * Set sorting
   */
  const setSorting = (field: string, order: 'asc' | 'desc' = 'desc') => {
    sortBy.value = field
    sortOrder.value = order
  }

  /**
   * Toggle sort order
   */
  const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  }

  // Computed properties for UI
  const hasActiveFilters = computed(() => {
    return !!(
      debouncedQuery.value ||
      (filters.value.status && filters.value.status.length > 0) ||
      (filters.value.assignee && filters.value.assignee.length > 0) ||
      (filters.value.priority && filters.value.priority.length > 0) ||
      (filters.value.tags && filters.value.tags.length > 0) ||
      filters.value.dateRange
    )
  })

  const resultCount = computed(() => filteredAndSortedItems.value.length)
  const totalCount = computed(() => items.value.length)

  return {
    // State
    searchQuery,
    filters,
    sortBy,
    sortOrder,

    // Computed
    filteredAndSortedItems,
    availableStatuses,
    availableAssignees,
    availablePriorities,
    availableTags,
    hasActiveFilters,
    resultCount,
    totalCount,

    // Methods
    setSearchQuery,
    setFilters,
    setSorting,
    toggleSortOrder,
    clearFilters
  }
}

