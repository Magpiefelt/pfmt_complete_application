<template>
  <div class="search-and-filter">
    <!-- Search Bar -->
    <div class="flex items-center space-x-4 mb-4">
      <div class="flex-1 relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-5 w-5 text-gray-400" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div v-if="searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            @click="clearSearch"
            class="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <!-- Filter Toggle -->
      <Button
        variant="outline"
        @click="showFilters = !showFilters"
        :class="{ 'bg-indigo-50 border-indigo-300': hasActiveFilters }"
      >
        <Filter class="h-4 w-4 mr-2" />
        Filters
        <span v-if="hasActiveFilters" class="ml-2 bg-indigo-600 text-white text-xs rounded-full px-2 py-1">
          {{ activeFilterCount }}
        </span>
      </Button>

      <!-- Sort Options -->
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <ArrowUpDown class="h-4 w-4 mr-2" />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem
            v-for="option in sortOptions"
            :key="option.value"
            @click="setSorting(option.value)"
            :class="{ 'bg-indigo-50': sortBy === option.value }"
          >
            <component :is="option.icon" class="h-4 w-4 mr-2" />
            {{ option.label }}
            <ArrowUp v-if="sortBy === option.value && sortOrder === 'asc'" class="h-3 w-3 ml-auto" />
            <ArrowDown v-if="sortBy === option.value && sortOrder === 'desc'" class="h-3 w-3 ml-auto" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Filters Panel -->
    <Transition name="slide-down">
      <div v-if="showFilters" class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Status Filter -->
          <div v-if="availableStatuses.length > 0">
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <label
                v-for="status in availableStatuses"
                :key="status"
                class="flex items-center"
              >
                <input
                  type="checkbox"
                  :value="status"
                  v-model="filters.status"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">{{ formatStatus(status) }}</span>
              </label>
            </div>
          </div>

          <!-- Assignee Filter -->
          <div v-if="availableAssignees.length > 0">
            <label class="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <label
                v-for="assignee in availableAssignees"
                :key="assignee"
                class="flex items-center"
              >
                <input
                  type="checkbox"
                  :value="assignee"
                  v-model="filters.assignee"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">{{ assignee }}</span>
              </label>
            </div>
          </div>

          <!-- Priority Filter -->
          <div v-if="availablePriorities.length > 0">
            <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <label
                v-for="priority in availablePriorities"
                :key="priority"
                class="flex items-center"
              >
                <input
                  type="checkbox"
                  :value="priority"
                  v-model="filters.priority"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">{{ formatPriority(priority) }}</span>
              </label>
            </div>
          </div>

          <!-- Tags Filter -->
          <div v-if="availableTags.length > 0">
            <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <label
                v-for="tag in availableTags"
                :key="tag"
                class="flex items-center"
              >
                <input
                  type="checkbox"
                  :value="tag"
                  v-model="filters.tags"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">{{ tag }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Date Range Filter -->
        <div v-if="showDateFilter" class="mt-4 pt-4 border-t border-gray-200">
          <label class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <div class="flex items-center space-x-2">
            <input
              type="date"
              v-model="dateRange.start"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span class="text-gray-500">to</span>
            <input
              type="date"
              v-model="dateRange.end"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- Filter Actions -->
        <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Showing {{ resultCount }} of {{ totalCount }} items
          </div>
          <div class="flex items-center space-x-2">
            <Button variant="outline" size="sm" @click="clearAllFilters">
              Clear All
            </Button>
            <Button variant="outline" size="sm" @click="showFilters = false">
              Done
            </Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Active Filters Display -->
    <div v-if="hasActiveFilters && !showFilters" class="flex flex-wrap items-center gap-2 mb-4">
      <span class="text-sm text-gray-600">Active filters:</span>
      
      <!-- Search Query Badge -->
      <span v-if="searchQuery" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
        "{{ searchQuery }}"
        <button @click="clearSearch" class="ml-1 text-indigo-600 hover:text-indigo-800">
          <X class="h-3 w-3" />
        </button>
      </span>

      <!-- Status Badges -->
      <span
        v-for="status in filters.status"
        :key="`status-${status}`"
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
      >
        {{ formatStatus(status) }}
        <button @click="removeStatusFilter(status)" class="ml-1 text-blue-600 hover:text-blue-800">
          <X class="h-3 w-3" />
        </button>
      </span>

      <!-- Clear All Button -->
      <Button variant="ghost" size="sm" @click="clearAllFilters" class="text-gray-500 hover:text-gray-700">
        Clear all
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Search, 
  Filter, 
  X, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Calendar,
  User,
  Flag,
  Tag
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SearchFilters } from '@/composables/useSearch'

interface SortOption {
  value: string
  label: string
  icon: any
}

interface Props {
  searchQuery: string
  filters: SearchFilters
  sortBy: string
  sortOrder: 'asc' | 'desc'
  availableStatuses: string[]
  availableAssignees: string[]
  availablePriorities: string[]
  availableTags: string[]
  hasActiveFilters: boolean
  resultCount: number
  totalCount: number
  searchPlaceholder?: string
  sortOptions?: SortOption[]
  showDateFilter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search...',
  sortOptions: () => [
    { value: 'updated_at', label: 'Last Updated', icon: Calendar },
    { value: 'created_at', label: 'Created Date', icon: Calendar },
    { value: 'name', label: 'Name', icon: Tag },
    { value: 'status', label: 'Status', icon: Flag }
  ],
  showDateFilter: true
})

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:filters': [value: SearchFilters]
  'update:sortBy': [value: string]
  'update:sortOrder': [value: 'asc' | 'desc']
  'clear-filters': []
}>()

// Local state
const showFilters = ref(false)
const dateRange = ref({
  start: '',
  end: ''
})

// Computed properties
const searchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value)
})

const filters = computed({
  get: () => props.filters,
  set: (value) => emit('update:filters', value)
})

const sortBy = computed({
  get: () => props.sortBy,
  set: (value) => emit('update:sortBy', value)
})

const sortOrder = computed({
  get: () => props.sortOrder,
  set: (value) => emit('update:sortOrder', value)
})

const activeFilterCount = computed(() => {
  let count = 0
  if (props.searchQuery) count++
  if (props.filters.status?.length) count++
  if (props.filters.assignee?.length) count++
  if (props.filters.priority?.length) count++
  if (props.filters.tags?.length) count++
  if (props.filters.dateRange) count++
  return count
})

// Watch date range changes
watch(dateRange, (newRange) => {
  if (newRange.start && newRange.end) {
    const updatedFilters = { ...props.filters, dateRange: newRange }
    emit('update:filters', updatedFilters)
  } else if (!newRange.start && !newRange.end) {
    const updatedFilters = { ...props.filters }
    delete updatedFilters.dateRange
    emit('update:filters', updatedFilters)
  }
}, { deep: true })

// Methods
const clearSearch = () => {
  emit('update:searchQuery', '')
}

const clearAllFilters = () => {
  emit('update:searchQuery', '')
  emit('update:filters', {
    query: '',
    status: [],
    assignee: [],
    priority: [],
    tags: []
  })
  dateRange.value = { start: '', end: '' }
  emit('clear-filters')
}

const removeStatusFilter = (status: string) => {
  const updatedFilters = {
    ...props.filters,
    status: props.filters.status?.filter(s => s !== status) || []
  }
  emit('update:filters', updatedFilters)
}

const setSorting = (field: string) => {
  if (props.sortBy === field) {
    // Toggle order if same field
    emit('update:sortOrder', props.sortOrder === 'asc' ? 'desc' : 'asc')
  } else {
    // Set new field with default desc order
    emit('update:sortBy', field)
    emit('update:sortOrder', 'desc')
  }
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatPriority = (priority: string) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

