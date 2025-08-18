<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
    <div class="flex items-center space-x-4">
      <span class="text-sm text-gray-700">
        {{ paginationInfo.info }}
      </span>
      
      <!-- Page Size Selector -->
      <div class="flex items-center space-x-2">
        <label for="pageSize" class="text-sm text-gray-700">Show:</label>
        <select
          id="pageSize"
          :value="pageSize"
          @change="handlePageSizeChange"
          class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
        <span class="text-sm text-gray-700">per page</span>
      </div>
    </div>
    
    <div class="flex items-center space-x-2">
      <!-- First Page Button -->
      <Button
        @click="$emit('pageChange', 1)"
        :disabled="currentPage === 1"
        variant="outline"
        size="sm"
        title="First page"
      >
        ««
      </Button>
      
      <!-- Previous Button -->
      <Button
        @click="$emit('prevPage')"
        :disabled="!hasPrev"
        variant="outline"
        size="sm"
        title="Previous page"
      >
        ‹ Previous
      </Button>
      
      <!-- Page Numbers -->
      <div class="flex items-center space-x-1">
        <Button
          v-for="page in visiblePages"
          :key="page"
          @click="$emit('pageChange', page)"
          :variant="page === currentPage ? 'default' : 'outline'"
          size="sm"
          class="min-w-[2.5rem]"
        >
          {{ page }}
        </Button>
      </div>
      
      <!-- Next Button -->
      <Button
        @click="$emit('nextPage')"
        :disabled="!hasNext"
        variant="outline"
        size="sm"
        title="Next page"
      >
        Next ›
      </Button>
      
      <!-- Last Page Button -->
      <Button
        @click="$emit('pageChange', totalPages)"
        :disabled="currentPage === totalPages"
        variant="outline"
        size="sm"
        title="Last page"
      >
        »»
      </Button>
    </div>
    
    <!-- Jump to Page (for large datasets) -->
    <div v-if="totalPages > 10" class="flex items-center space-x-2">
      <label for="jumpToPage" class="text-sm text-gray-700">Go to:</label>
      <input
        id="jumpToPage"
        type="number"
        :min="1"
        :max="totalPages"
        :value="currentPage"
        @keyup.enter="handleJumpToPage($event)"
        @blur="handleJumpToPage($event)"
        class="border border-gray-300 rounded px-2 py-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
        :title="`Enter page number (1-${totalPages})`"
      />
      <span class="text-sm text-gray-700">of {{ totalPages }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui'
import { usePaginationInfo } from '@/composables/usePagination'

interface Props {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  hasNext: boolean
  hasPrev: boolean
  visiblePages: number[]
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [5, 10, 25, 50, 100]
})

const emit = defineEmits<{
  pageChange: [page: number]
  nextPage: []
  prevPage: []
  pageSizeChange: [size: number]
}>()

// Create pagination info using the composable
const paginationState = computed(() => ({
  currentPage: { value: props.currentPage },
  totalItems: { value: props.totalItems },
  pageSize: { value: props.pageSize },
  startIndex: { value: (props.currentPage - 1) * props.pageSize },
  endIndex: { value: Math.min((props.currentPage - 1) * props.pageSize + props.pageSize - 1, props.totalItems - 1) }
}))

const paginationInfo = usePaginationInfo(paginationState.value as any)

const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('pageSizeChange', parseInt(target.value))
}

const handleJumpToPage = (event: Event) => {
  const target = event.target as HTMLInputElement
  const page = parseInt(target.value)
  if (page >= 1 && page <= props.totalPages) {
    emit('pageChange', page)
  } else {
    // Reset to current page if invalid
    target.value = props.currentPage.toString()
  }
}
</script>

