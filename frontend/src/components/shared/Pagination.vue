<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
    <div class="flex items-center space-x-4">
      <span class="text-sm text-gray-700">
        Showing {{ startItem }} to {{ endItem }} of {{ totalItems }} results
      </span>
      
      <!-- Page Size Selector -->
      <div class="flex items-center space-x-2">
        <label for="pageSize" class="text-sm text-gray-700">Show:</label>
        <select
          id="pageSize"
          :value="pageSize"
          @change="$emit('pageSizeChange', parseInt(($event.target as HTMLSelectElement).value))"
          class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
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
        <!-- Show ellipsis if there are pages before visible range -->
        <span v-if="showStartEllipsis" class="px-2 text-gray-500">...</span>
        
        <Button
          v-for="page in visiblePages"
          :key="page"
          @click="$emit('pageChange', page)"
          :variant="page === currentPage ? 'default' : 'outline'"
          size="sm"
          class="w-8 h-8 p-0"
          :title="`Go to page ${page}`"
        >
          {{ page }}
        </Button>
        
        <!-- Show ellipsis if there are pages after visible range -->
        <span v-if="showEndEllipsis" class="px-2 text-gray-500">...</span>
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

interface Props {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  pageSize: number
  totalItems: number
}

const props = defineProps<Props>()

const startItem = computed(() => 
  props.totalItems === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1
)

const endItem = computed(() => 
  Math.min(props.currentPage * props.pageSize, props.totalItems)
)

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(props.totalPages, start + maxVisible - 1)
  
  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const showStartEllipsis = computed(() => {
  return visiblePages.value.length > 0 && visiblePages.value[0] > 1
})

const showEndEllipsis = computed(() => {
  return visiblePages.value.length > 0 && visiblePages.value[visiblePages.value.length - 1] < props.totalPages
})

const emit = defineEmits<{
  nextPage: []
  prevPage: []
  pageChange: [page: number]
  pageSizeChange: [size: number]
}>()

const handleJumpToPage = (event: Event) => {
  const target = event.target as HTMLInputElement
  const page = parseInt(target.value)
  
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('pageChange', page)
  } else {
    // Reset to current page if invalid
    target.value = props.currentPage.toString()
  }
}
</script>

