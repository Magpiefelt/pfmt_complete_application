<template>
  <div :class="cn('flex items-center justify-center', containerClasses)">
    <div 
      :class="cn(
        'animate-spin rounded-full border-2',
        spinnerSizeClasses,
        colorClasses
      )"
    ></div>
    <p v-if="message" :class="messageClasses">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  message?: string
  centered?: boolean
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  centered: false,
  overlay: false
})

const containerClasses = computed(() => {
  const classes = []
  
  if (props.centered) {
    classes.push('min-h-[200px]')
  }
  
  if (props.overlay) {
    classes.push('fixed inset-0 bg-white bg-opacity-75 z-50')
  }
  
  if (props.message) {
    classes.push('flex-col space-y-2')
  }
  
  return classes.join(' ')
})

const spinnerSizeClasses = computed(() => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }
  return sizes[props.size]
})

const colorClasses = computed(() => {
  const colors = {
    primary: 'border-gray-300 border-t-blue-600',
    secondary: 'border-gray-200 border-t-gray-600',
    white: 'border-gray-400 border-t-white',
    gray: 'border-gray-200 border-t-gray-400'
  }
  return colors[props.color]
})

const messageClasses = computed(() => {
  const classes = ['text-sm']
  
  if (props.color === 'white') {
    classes.push('text-white')
  } else {
    classes.push('text-gray-600')
  }
  
  return classes.join(' ')
})
</script>

