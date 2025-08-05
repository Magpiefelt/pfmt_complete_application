<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2">
      <span class="text-sm text-gray-700">
        Showing {{ startItem }} to {{ endItem }} of {{ totalItems }} results
      </span>
    </div>
    
    <div class="flex items-center space-x-2">
      <Button
        @click="$emit('prevPage')"
        :disabled="!hasPrev"
        variant="outline"
        size="sm"
      >
        Previous
      </Button>
      
      <div class="flex items-center space-x-1">
        <Button
          v-for="page in visiblePages"
          :key="page"
          @click="$emit('pageChange', page)"
          :variant="page === currentPage ? 'default' : 'outline'"
          size="sm"
          class="w-8 h-8 p-0"
        >
          {{ page }}
        </Button>
      </div>
      
      <Button
        @click="$emit('nextPage')"
        :disabled="!hasNext"
        variant="outline"
        size="sm"
      >
        Next
      </Button>
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

defineEmits<{
  nextPage: []
  prevPage: []
  pageChange: [page: number]
  pageSizeChange: [size: number]
}>()

const startItem = computed(() => 
  (props.currentPage - 1) * props.pageSize + 1
)

const endItem = computed(() => 
  Math.min(props.currentPage * props.pageSize, props.totalItems)
)

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(props.totalPages, props.currentPage + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})
</script>

