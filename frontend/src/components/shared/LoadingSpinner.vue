<template>
  <div :class="cn('flex items-center justify-center', sizeClasses)">
    <div 
      :class="cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        spinnerSizeClasses
      )"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }
  return sizes[props.size]
})

const spinnerSizeClasses = computed(() => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }
  return sizes[props.size]
})
</script>

