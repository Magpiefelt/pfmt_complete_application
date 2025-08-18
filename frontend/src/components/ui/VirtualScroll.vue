<template>
  <div
    ref="containerRef"
    class="virtual-scroll-container"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <!-- Spacer for items before visible range -->
    <div :style="{ height: `${offsetBefore}px` }"></div>

    <!-- Visible items -->
    <div
      v-for="(item, index) in visibleItems"
      :key="getItemKey(item, startIndex + index)"
      :style="getItemStyle(startIndex + index)"
      class="virtual-scroll-item"
    >
      <slot
        :item="item"
        :index="startIndex + index"
        :active="startIndex + index === activeIndex"
      >
        {{ item }}
      </slot>
    </div>

    <!-- Spacer for items after visible range -->
    <div :style="{ height: `${offsetAfter}px` }"></div>

    <!-- Loading indicator -->
    <div
      v-if="loading && hasMore"
      class="flex items-center justify-center p-4"
    >
      <Loading size="sm" text="Loading more items..." />
    </div>

    <!-- End of list indicator -->
    <div
      v-else-if="!hasMore && items.length > 0"
      class="flex items-center justify-center p-4 text-gray-500 text-sm"
    >
      <slot name="end-message">
        End of list
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Loading } from './index'

interface Props {
  items: any[]
  itemHeight?: number | ((index: number) => number)
  containerHeight?: number
  overscan?: number
  horizontal?: boolean
  loading?: boolean
  hasMore?: boolean
  threshold?: number
  itemKey?: string | ((item: any, index: number) => string | number)
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 50,
  containerHeight: 400,
  overscan: 5,
  horizontal: false,
  loading: false,
  hasMore: true,
  threshold: 200,
  itemKey: 'id'
})

const emit = defineEmits<{
  'load-more': []
  'scroll': [{ scrollTop: number; scrollLeft: number }]
  'item-click': [{ item: any; index: number }]
}>()

// Refs
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const scrollLeft = ref(0)
const containerSize = ref(0)
const activeIndex = ref(-1)

// Computed properties
const isHorizontal = computed(() => props.horizontal)

const getItemHeight = (index: number): number => {
  if (typeof props.itemHeight === 'function') {
    return props.itemHeight(index)
  }
  return props.itemHeight
}

const totalHeight = computed(() => {
  if (typeof props.itemHeight === 'function') {
    return props.items.reduce((total, _, index) => total + getItemHeight(index), 0)
  }
  return props.items.length * props.itemHeight
})

const containerStyle = computed(() => {
  const style: Record<string, string> = {
    overflow: 'auto',
    position: 'relative'
  }

  if (isHorizontal.value) {
    style.width = '100%'
    style.height = `${props.containerHeight}px`
    style.overflowX = 'auto'
    style.overflowY = 'hidden'
  } else {
    style.height = `${props.containerHeight}px`
    style.overflowY = 'auto'
    style.overflowX = 'hidden'
  }

  return style
})

const visibleRange = computed(() => {
  const scroll = isHorizontal.value ? scrollLeft.value : scrollTop.value
  const containerHeight = props.containerHeight
  
  let startIndex = 0
  let endIndex = props.items.length - 1
  
  if (typeof props.itemHeight === 'function') {
    // Variable height calculation
    let accumulatedHeight = 0
    
    // Find start index
    for (let i = 0; i < props.items.length; i++) {
      const itemHeight = getItemHeight(i)
      if (accumulatedHeight + itemHeight > scroll) {
        startIndex = Math.max(0, i - props.overscan)
        break
      }
      accumulatedHeight += itemHeight
    }
    
    // Find end index
    accumulatedHeight = 0
    for (let i = 0; i < props.items.length; i++) {
      const itemHeight = getItemHeight(i)
      accumulatedHeight += itemHeight
      if (accumulatedHeight > scroll + containerHeight) {
        endIndex = Math.min(props.items.length - 1, i + props.overscan)
        break
      }
    }
  } else {
    // Fixed height calculation
    const itemHeight = props.itemHeight
    startIndex = Math.max(0, Math.floor(scroll / itemHeight) - props.overscan)
    endIndex = Math.min(
      props.items.length - 1,
      Math.ceil((scroll + containerHeight) / itemHeight) + props.overscan
    )
  }

  return { startIndex, endIndex }
})

const startIndex = computed(() => visibleRange.value.startIndex)
const endIndex = computed(() => visibleRange.value.endIndex)

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1)
})

const offsetBefore = computed(() => {
  if (typeof props.itemHeight === 'function') {
    let height = 0
    for (let i = 0; i < startIndex.value; i++) {
      height += getItemHeight(i)
    }
    return height
  }
  return startIndex.value * props.itemHeight
})

const offsetAfter = computed(() => {
  if (typeof props.itemHeight === 'function') {
    let height = 0
    for (let i = endIndex.value + 1; i < props.items.length; i++) {
      height += getItemHeight(i)
    }
    return height
  }
  return (props.items.length - endIndex.value - 1) * props.itemHeight
})

// Methods
const getItemKey = (item: any, index: number): string | number => {
  if (typeof props.itemKey === 'function') {
    return props.itemKey(item, index)
  }
  return item[props.itemKey] || index
}

const getItemStyle = (index: number) => {
  const style: Record<string, string> = {}
  
  if (isHorizontal.value) {
    style.display = 'inline-block'
    style.verticalAlign = 'top'
    style.width = `${getItemHeight(index)}px`
    style.height = '100%'
  } else {
    style.height = `${getItemHeight(index)}px`
  }
  
  return style
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  scrollLeft.value = target.scrollLeft

  emit('scroll', {
    scrollTop: scrollTop.value,
    scrollLeft: scrollLeft.value
  })

  // Check if we need to load more items
  if (props.hasMore && !props.loading) {
    const scrollPosition = isHorizontal.value ? scrollLeft.value : scrollTop.value
    const totalSize = isHorizontal.value ? target.scrollWidth : target.scrollHeight
    const containerSize = isHorizontal.value ? target.clientWidth : target.clientHeight
    
    if (scrollPosition + containerSize >= totalSize - props.threshold) {
      emit('load-more')
    }
  }
}

const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value || index < 0 || index >= props.items.length) return

  let offset = 0
  
  if (typeof props.itemHeight === 'function') {
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i)
    }
  } else {
    offset = index * props.itemHeight
  }

  if (isHorizontal.value) {
    containerRef.value.scrollTo({ left: offset, behavior })
  } else {
    containerRef.value.scrollTo({ top: offset, behavior })
  }
}

const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return
  
  if (isHorizontal.value) {
    containerRef.value.scrollTo({ left: 0, behavior })
  } else {
    containerRef.value.scrollTo({ top: 0, behavior })
  }
}

const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return
  
  if (isHorizontal.value) {
    containerRef.value.scrollTo({ left: containerRef.value.scrollWidth, behavior })
  } else {
    containerRef.value.scrollTo({ top: containerRef.value.scrollHeight, behavior })
  }
}

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.items.length) return

  switch (event.key) {
    case 'ArrowDown':
      if (!isHorizontal.value) {
        event.preventDefault()
        activeIndex.value = Math.min(activeIndex.value + 1, props.items.length - 1)
        scrollToIndex(activeIndex.value)
      }
      break
    case 'ArrowUp':
      if (!isHorizontal.value) {
        event.preventDefault()
        activeIndex.value = Math.max(activeIndex.value - 1, 0)
        scrollToIndex(activeIndex.value)
      }
      break
    case 'ArrowRight':
      if (isHorizontal.value) {
        event.preventDefault()
        activeIndex.value = Math.min(activeIndex.value + 1, props.items.length - 1)
        scrollToIndex(activeIndex.value)
      }
      break
    case 'ArrowLeft':
      if (isHorizontal.value) {
        event.preventDefault()
        activeIndex.value = Math.max(activeIndex.value - 1, 0)
        scrollToIndex(activeIndex.value)
      }
      break
    case 'Home':
      event.preventDefault()
      activeIndex.value = 0
      scrollToIndex(0)
      break
    case 'End':
      event.preventDefault()
      activeIndex.value = props.items.length - 1
      scrollToIndex(props.items.length - 1)
      break
    case 'Enter':
    case ' ':
      if (activeIndex.value >= 0) {
        event.preventDefault()
        emit('item-click', {
          item: props.items[activeIndex.value],
          index: activeIndex.value
        })
      }
      break
  }
}

// Watch for items changes
watch(() => props.items.length, (newLength, oldLength) => {
  // If items were added and we're at the bottom, scroll to show new items
  if (newLength > oldLength && containerRef.value) {
    const container = containerRef.value
    const isAtBottom = isHorizontal.value
      ? container.scrollLeft + container.clientWidth >= container.scrollWidth - 10
      : container.scrollTop + container.clientHeight >= container.scrollHeight - 10
    
    if (isAtBottom) {
      nextTick(() => {
        scrollToBottom('auto')
      })
    }
  }
})

// Lifecycle
onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('keydown', handleKeyDown)
    containerRef.value.setAttribute('tabindex', '0')
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('keydown', handleKeyDown)
  }
})

// Expose methods
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  containerRef
})
</script>

<style scoped>
.virtual-scroll-container {
  outline: none;
}

.virtual-scroll-container:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.virtual-scroll-item {
  transition: background-color 0.15s ease;
}

.virtual-scroll-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>

