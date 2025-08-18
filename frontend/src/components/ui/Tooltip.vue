<template>
  <div
    class="relative inline-block"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focus="showTooltip"
    @blur="hideTooltip"
  >
    <!-- Trigger Element -->
    <slot :show="show" :hide="hide" />

    <!-- Tooltip -->
    <Teleport to="body">
      <Transition
        name="tooltip"
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isVisible"
          ref="tooltipRef"
          class="absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg"
          :class="[
            sizeClasses,
            variantClasses
          ]"
          :style="tooltipStyle"
          role="tooltip"
        >
          <!-- Content -->
          <slot name="content">
            {{ content }}
          </slot>

          <!-- Arrow -->
          <div
            v-if="showArrow"
            class="absolute w-2 h-2 bg-gray-900 transform rotate-45"
            :class="arrowClasses"
            :style="arrowStyle"
          ></div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

interface Props {
  content?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  trigger?: 'hover' | 'click' | 'focus' | 'manual'
  delay?: number
  hideDelay?: number
  disabled?: boolean
  showArrow?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light' | 'error' | 'warning' | 'success'
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  placement: 'top',
  trigger: 'hover',
  delay: 100,
  hideDelay: 100,
  disabled: false,
  showArrow: true,
  size: 'md',
  variant: 'dark',
  maxWidth: '200px'
})

const emit = defineEmits<{
  'show': []
  'hide': []
}>()

// Refs
const tooltipRef = ref<HTMLElement>()
const isVisible = ref(false)
const showTimeout = ref<NodeJS.Timeout>()
const hideTimeout = ref<NodeJS.Timeout>()
const triggerElement = ref<HTMLElement>()

// Computed properties
const sizeClasses = computed(() => {
  const sizeMap = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  }
  return sizeMap[props.size]
})

const variantClasses = computed(() => {
  const variantMap = {
    dark: 'bg-gray-900 text-white',
    light: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-white',
    success: 'bg-green-600 text-white'
  }
  return variantMap[props.variant]
})

const tooltipStyle = ref({})
const arrowStyle = ref({})
const arrowClasses = ref('')

// Methods
const showTooltip = () => {
  if (props.disabled || props.trigger === 'manual') return

  clearTimeout(hideTimeout.value)
  showTimeout.value = setTimeout(() => {
    show()
  }, props.delay)
}

const hideTooltip = () => {
  if (props.disabled || props.trigger === 'manual') return

  clearTimeout(showTimeout.value)
  hideTimeout.value = setTimeout(() => {
    hide()
  }, props.hideDelay)
}

const show = () => {
  if (props.disabled) return

  isVisible.value = true
  emit('show')
  
  nextTick(() => {
    updatePosition()
  })
}

const hide = () => {
  isVisible.value = false
  emit('hide')
}

const updatePosition = () => {
  if (!tooltipRef.value || !triggerElement.value) return

  const trigger = triggerElement.value.getBoundingClientRect()
  const tooltip = tooltipRef.value.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  let top = 0
  let left = 0
  let arrowTop = ''
  let arrowLeft = ''
  let arrowClass = ''

  // Calculate position based on placement
  switch (props.placement) {
    case 'top':
      top = trigger.top - tooltip.height - 8
      left = trigger.left + (trigger.width - tooltip.width) / 2
      arrowTop = '100%'
      arrowLeft = '50%'
      arrowClass = '-translate-x-1/2 -translate-y-1/2'
      break

    case 'bottom':
      top = trigger.bottom + 8
      left = trigger.left + (trigger.width - tooltip.width) / 2
      arrowTop = '-4px'
      arrowLeft = '50%'
      arrowClass = '-translate-x-1/2'
      break

    case 'left':
      top = trigger.top + (trigger.height - tooltip.height) / 2
      left = trigger.left - tooltip.width - 8
      arrowTop = '50%'
      arrowLeft = '100%'
      arrowClass = '-translate-y-1/2 -translate-x-1/2'
      break

    case 'right':
      top = trigger.top + (trigger.height - tooltip.height) / 2
      left = trigger.right + 8
      arrowTop = '50%'
      arrowLeft = '-4px'
      arrowClass = '-translate-y-1/2'
      break

    case 'top-start':
      top = trigger.top - tooltip.height - 8
      left = trigger.left
      arrowTop = '100%'
      arrowLeft = '16px'
      arrowClass = '-translate-y-1/2'
      break

    case 'top-end':
      top = trigger.top - tooltip.height - 8
      left = trigger.right - tooltip.width
      arrowTop = '100%'
      arrowLeft = 'calc(100% - 16px)'
      arrowClass = '-translate-y-1/2'
      break

    case 'bottom-start':
      top = trigger.bottom + 8
      left = trigger.left
      arrowTop = '-4px'
      arrowLeft = '16px'
      arrowClass = ''
      break

    case 'bottom-end':
      top = trigger.bottom + 8
      left = trigger.right - tooltip.width
      arrowTop = '-4px'
      arrowLeft = 'calc(100% - 16px)'
      arrowClass = ''
      break
  }

  // Adjust for viewport boundaries
  if (left < 8) left = 8
  if (left + tooltip.width > viewport.width - 8) {
    left = viewport.width - tooltip.width - 8
  }
  if (top < 8) top = 8
  if (top + tooltip.height > viewport.height - 8) {
    top = viewport.height - tooltip.height - 8
  }

  // Apply styles
  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    maxWidth: props.maxWidth
  }

  arrowStyle.value = {
    top: arrowTop,
    left: arrowLeft
  }

  arrowClasses.value = arrowClass
}

const handleClickOutside = (event: Event) => {
  if (props.trigger === 'click' && isVisible.value) {
    const target = event.target as HTMLElement
    if (!triggerElement.value?.contains(target) && !tooltipRef.value?.contains(target)) {
      hide()
    }
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isVisible.value) {
    hide()
  }
}

// Lifecycle
onMounted(() => {
  // Get the trigger element (first child)
  triggerElement.value = document.querySelector('[data-tooltip-trigger]') as HTMLElement
  
  if (props.trigger === 'click') {
    document.addEventListener('click', handleClickOutside)
  }
  
  document.addEventListener('keydown', handleEscape)
  window.addEventListener('scroll', updatePosition)
  window.addEventListener('resize', updatePosition)
})

onUnmounted(() => {
  clearTimeout(showTimeout.value)
  clearTimeout(hideTimeout.value)
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('scroll', updatePosition)
  window.removeEventListener('resize', updatePosition)
})

// Expose methods for manual control
defineExpose({
  show,
  hide
})
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>

