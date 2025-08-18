<template>
  <div class="space-y-4">
    <!-- Table Header with Search and Actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div v-if="searchable" class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            v-model="searchQuery"
            placeholder="Search..."
            class="pl-10 w-64"
          />
        </div>
        <div v-if="filterable && filters.length > 0" class="flex items-center space-x-2">
          <Select v-model="activeFilter">
            <option value="">All</option>
            <option v-for="filter in filters" :key="filter.value" :value="filter.value">
              {{ filter.label }}
            </option>
          </Select>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <slot name="actions" />
        <Button v-if="exportable" variant="outline" @click="exportData">
          <Download class="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>

    <!-- Table -->
    <div class="border rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <!-- Table Header -->
          <thead class="bg-gray-50 border-b">
            <tr>
              <th
                v-if="selectable"
                class="px-4 py-3 text-left"
              >
                <Checkbox
                  :checked="allSelected"
                  :indeterminate="someSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th
                v-for="column in columns"
                :key="column.key"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                :class="[
                  column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : '',
                  column.align === 'center' ? 'text-center' : '',
                  column.align === 'right' ? 'text-right' : ''
                ]"
                @click="column.sortable !== false ? sort(column.key) : null"
              >
                <div class="flex items-center space-x-1">
                  <span>{{ column.title }}</span>
                  <div v-if="column.sortable !== false" class="flex flex-col">
                    <ChevronUp 
                      class="h-3 w-3" 
                      :class="sortKey === column.key && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-300'"
                    />
                    <ChevronDown 
                      class="h-3 w-3 -mt-1" 
                      :class="sortKey === column.key && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-300'"
                    />
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- Loading State -->
            <tr v-if="loading">
              <td :colspan="totalColumns" class="px-4 py-8 text-center">
                <div class="flex items-center justify-center space-x-2">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span class="text-gray-500">Loading...</span>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="filteredData.length === 0">
              <td :colspan="totalColumns" class="px-4 py-8 text-center">
                <div class="flex flex-col items-center space-y-2">
                  <slot name="empty-icon">
                    <FileX class="h-12 w-12 text-gray-400" />
                  </slot>
                  <div>
                    <p class="text-gray-500 font-medium">
                      {{ emptyMessage || 'No data available' }}
                    </p>
                    <p v-if="searchQuery" class="text-sm text-gray-400 mt-1">
                      Try adjusting your search or filters
                    </p>
                  </div>
                  <slot name="empty-actions" />
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-else
              v-for="(item, index) in paginatedData"
              :key="getRowKey(item, index)"
              class="hover:bg-gray-50 transition-colors"
              :class="{ 'bg-blue-50': selectedItems.includes(getRowKey(item, index)) }"
            >
              <!-- Selection Column -->
              <td v-if="selectable" class="px-4 py-3">
                <Checkbox
                  :checked="selectedItems.includes(getRowKey(item, index))"
                  @change="toggleSelect(getRowKey(item, index))"
                />
              </td>

              <!-- Data Columns -->
              <td
                v-for="column in columns"
                :key="column.key"
                class="px-4 py-3 text-sm"
                :class="[
                  column.align === 'center' ? 'text-center' : '',
                  column.align === 'right' ? 'text-right' : ''
                ]"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :item="item"
                  :value="getNestedValue(item, column.key)"
                  :index="index"
                >
                  <component
                    v-if="column.component"
                    :is="column.component"
                    :value="getNestedValue(item, column.key)"
                    :item="item"
                    v-bind="column.componentProps"
                  />
                  <span v-else-if="column.formatter">
                    {{ column.formatter(getNestedValue(item, column.key), item) }}
                  </span>
                  <span v-else>
                    {{ getNestedValue(item, column.key) }}
                  </span>
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="paginated && !loading && filteredData.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      :has-next="currentPage < totalPages"
      :has-prev="currentPage > 1"
      :page-size="pageSize"
      :total-items="filteredData.length"
      @next-page="currentPage++"
      @prev-page="currentPage--"
      @page-change="(page) => currentPage = page"
      @page-size-change="(size) => { pageSize = size; currentPage = 1 }"
    />

    <!-- Selected Items Actions -->
    <div v-if="selectable && selectedItems.length > 0" class="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
      <span class="text-sm text-blue-700">
        {{ selectedItems.length }} item{{ selectedItems.length > 1 ? 's' : '' }} selected
      </span>
      <div class="flex items-center space-x-2">
        <slot name="bulk-actions" :selected-items="selectedItems" />
        <Button variant="outline" size="sm" @click="clearSelection">
          Clear Selection
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Search, 
  Download, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  FileX 
} from 'lucide-vue-next'
import { Button, Input, Checkbox, Select } from '@/components/ui'
import Pagination from '@/components/shared/Pagination.vue'

export interface DataTableColumn {
  key: string
  title: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  formatter?: (value: any, item: any) => string
  component?: any
  componentProps?: Record<string, any>
}

export interface DataTableFilter {
  label: string
  value: string
  filterFn: (item: any) => boolean
}

interface Props {
  data: any[]
  columns: DataTableColumn[]
  loading?: boolean
  searchable?: boolean
  filterable?: boolean
  filters?: DataTableFilter[]
  selectable?: boolean
  paginated?: boolean
  pageSize?: number
  exportable?: boolean
  emptyMessage?: string
  rowKey?: string | ((item: any) => string)
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  searchable: true,
  filterable: false,
  filters: () => [],
  selectable: false,
  paginated: true,
  pageSize: 10,
  exportable: false,
  emptyMessage: '',
  rowKey: 'id'
})

const emit = defineEmits<{
  'row-click': [item: any]
  'selection-change': [selectedItems: string[]]
  'export': [data: any[]]
}>()

// Local state
const searchQuery = ref('')
const activeFilter = ref('')
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const selectedItems = ref<string[]>([])

// Computed properties
const totalColumns = computed(() => {
  return props.columns.length + (props.selectable ? 1 : 0)
})

const filteredData = computed(() => {
  let result = [...props.data]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => {
      return props.columns.some(column => {
        const value = getNestedValue(item, column.key)
        return String(value).toLowerCase().includes(query)
      })
    })
  }

  // Apply active filter
  if (activeFilter.value) {
    const filter = props.filters.find(f => f.value === activeFilter.value)
    if (filter) {
      result = result.filter(filter.filterFn)
    }
  }

  // Apply sorting
  if (sortKey.value) {
    result.sort((a, b) => {
      const aVal = getNestedValue(a, sortKey.value)
      const bVal = getNestedValue(b, sortKey.value)
      
      if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })
  }

  return result
})

const totalPages = computed(() => {
  if (!props.paginated) return 1
  return Math.ceil(filteredData.value.length / props.pageSize)
})

const startIndex = computed(() => {
  if (!props.paginated) return 0
  return (currentPage.value - 1) * props.pageSize
})

const endIndex = computed(() => {
  if (!props.paginated) return filteredData.value.length
  return Math.min(startIndex.value + props.pageSize, filteredData.value.length)
})

const paginatedData = computed(() => {
  if (!props.paginated) return filteredData.value
  return filteredData.value.slice(startIndex.value, endIndex.value)
})

const allSelected = computed(() => {
  const currentPageKeys = paginatedData.value.map((item, index) => getRowKey(item, index))
  return currentPageKeys.length > 0 && currentPageKeys.every(key => selectedItems.value.includes(key))
})

const someSelected = computed(() => {
  const currentPageKeys = paginatedData.value.map((item, index) => getRowKey(item, index))
  return currentPageKeys.some(key => selectedItems.value.includes(key)) && !allSelected.value
})

// Methods
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const getRowKey = (item: any, index: number): string => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(item)
  }
  return getNestedValue(item, props.rowKey) || String(index)
}

const sort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const toggleSelect = (key: string) => {
  const index = selectedItems.value.indexOf(key)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(key)
  }
}

const toggleSelectAll = () => {
  const currentPageKeys = paginatedData.value.map((item, index) => getRowKey(item, index))
  
  if (allSelected.value) {
    // Deselect all current page items
    selectedItems.value = selectedItems.value.filter(key => !currentPageKeys.includes(key))
  } else {
    // Select all current page items
    currentPageKeys.forEach(key => {
      if (!selectedItems.value.includes(key)) {
        selectedItems.value.push(key)
      }
    })
  }
}

const clearSelection = () => {
  selectedItems.value = []
}

const exportData = () => {
  emit('export', filteredData.value)
}

// Watch for selection changes
watch(selectedItems, (newSelection) => {
  emit('selection-change', newSelection)
}, { deep: true })

// Reset page when search or filter changes
watch([searchQuery, activeFilter], () => {
  currentPage.value = 1
})
</script>

