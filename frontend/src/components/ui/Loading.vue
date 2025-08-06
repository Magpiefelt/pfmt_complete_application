<template>
  <div
    class="flex items-center justify-center"
    :class="[
      containerClasses,
      fullscreen ? 'fixed inset-0 bg-white bg-opacity-75 z-50' : '',
      overlay ? 'absolute inset-0 bg-white bg-opacity-75' : ''
    ]"
  >
    <div class="flex flex-col items-center space-y-3">
      <!-- Spinner -->
      <div class="relative">
        <component
          :is="spinnerComponent"
          :class="spinnerClasses"
        />
      </div>

      <!-- Text -->
      <div v-if="text || $slots.default" class="text-center">
        <slot>
          <p class="text-gray-600 font-medium">{{ text }}</p>
          <p v-if="subtext" class="text-sm text-gray-500 mt-1">{{ subtext }}</p>
        </slot>
      </div>

      <!-- Progress Bar -->
      <div v-if="showProgress && progress !== undefined" class="w-full max-w-xs">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>{{ progressText }}</span>
          <span>{{ Math.round(progress) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2, RefreshCw, Spinner } from 'lucide-vue-next'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars'
  text?: string
  subtext?: string
  fullscreen?: boolean
  overlay?: boolean
  showProgress?: boolean
  progress?: number
  progressText?: string
  color?: 'blue' | 'gray' | 'green' | 'red' | 'yellow'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'spinner',
  text: '',
  subtext: '',
  fullscreen: false,
  overlay: false,
  showProgress: false,
  progress: undefined,
  progressText: 'Loading...',
  color: 'blue'
})

// Computed properties
const containerClasses = computed(() => {
  const sizeMap = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  }
  return sizeMap[props.size]
})

const spinnerClasses = computed(() => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const colorMap = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600'
  }

  const baseClasses = 'animate-spin'
  
  return `${baseClasses} ${sizeMap[props.size]} ${colorMap[props.color]}`
})

const spinnerComponent = computed(() => {
  switch (props.variant) {
    case 'spinner':
      return Loader2
    case 'dots':
      return DotsSpinner
    case 'pulse':
      return PulseSpinner
    case 'bars':
      return BarsSpinner
    default:
      return Loader2
  }
})
</script>

<!-- Custom Spinner Components -->
<script lang="ts">
import { defineComponent, h } from 'vue'

// Dots Spinner Component
const DotsSpinner = defineComponent({
  name: 'DotsSpinner',
  props: {
    class: String
  },
  setup(props) {
    return () => h('div', {
      class: `inline-flex space-x-1 ${props.class || ''}`
    }, [
      h('div', {
        class: 'w-2 h-2 bg-current rounded-full animate-bounce',
        style: 'animation-delay: 0ms'
      }),
      h('div', {
        class: 'w-2 h-2 bg-current rounded-full animate-bounce',
        style: 'animation-delay: 150ms'
      }),
      h('div', {
        class: 'w-2 h-2 bg-current rounded-full animate-bounce',
        style: 'animation-delay: 300ms'
      })
    ])
  }
})

// Pulse Spinner Component
const PulseSpinner = defineComponent({
  name: 'PulseSpinner',
  props: {
    class: String
  },
  setup(props) {
    return () => h('div', {
      class: `rounded-full bg-current animate-pulse ${props.class || ''}`
    })
  }
})

// Bars Spinner Component
const BarsSpinner = defineComponent({
  name: 'BarsSpinner',
  props: {
    class: String
  },
  setup(props) {
    return () => h('div', {
      class: `inline-flex space-x-1 ${props.class || ''}`
    }, [
      h('div', {
        class: 'w-1 h-4 bg-current animate-pulse',
        style: 'animation-delay: 0ms'
      }),
      h('div', {
        class: 'w-1 h-4 bg-current animate-pulse',
        style: 'animation-delay: 100ms'
      }),
      h('div', {
        class: 'w-1 h-4 bg-current animate-pulse',
        style: 'animation-delay: 200ms'
      }),
      h('div', {
        class: 'w-1 h-4 bg-current animate-pulse',
        style: 'animation-delay: 300ms'
      })
    ])
  }
})

export { DotsSpinner, PulseSpinner, BarsSpinner }
</script>

<style scoped>
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out both;
}
</style>

