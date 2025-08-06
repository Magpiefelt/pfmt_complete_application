<template>
  <Teleport to="body">
    <Transition
      name="modal"
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>

        <!-- Modal Container -->
        <Transition
          name="modal-content"
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-300"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="modelValue"
            class="relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden"
            :class="[
              sizeClasses,
              fullscreen ? 'w-screen h-screen rounded-none' : ''
            ]"
            @click.stop
          >
            <!-- Header -->
            <div
              v-if="!hideHeader"
              class="flex items-center justify-between p-6 border-b border-gray-200"
              :class="{ 'pb-4': !title && !$slots.header }"
            >
              <div class="flex-1">
                <slot name="header">
                  <h2 v-if="title" class="text-xl font-semibold text-gray-900">
                    {{ title }}
                  </h2>
                  <p v-if="description" class="mt-1 text-sm text-gray-500">
                    {{ description }}
                  </p>
                </slot>
              </div>
              
              <button
                v-if="!hideCloseButton"
                @click="close"
                class="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                :disabled="loading"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <!-- Content -->
            <div
              class="flex-1 overflow-y-auto"
              :class="[
                contentPadding ? 'p-6' : '',
                !hideHeader && !hideFooter ? '' : '',
                hideHeader && !hideFooter ? 'pt-6' : '',
                !hideHeader && hideFooter ? 'pb-6' : '',
                hideHeader && hideFooter ? 'p-6' : ''
              ]"
            >
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="!hideFooter"
              class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50"
            >
              <slot name="footer">
                <Button
                  v-if="!hideCancelButton"
                  variant="outline"
                  @click="cancel"
                  :disabled="loading"
                >
                  {{ cancelText }}
                </Button>
                <Button
                  v-if="!hideConfirmButton"
                  :variant="confirmVariant"
                  @click="confirm"
                  :loading="loading"
                  :disabled="confirmDisabled"
                >
                  {{ confirmText }}
                </Button>
              </slot>
            </div>

            <!-- Loading Overlay -->
            <div
              v-if="loading"
              class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center"
            >
              <div class="flex items-center space-x-3">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span class="text-gray-600">{{ loadingText }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue'
import { X } from 'lucide-vue-next'
import { Button } from './Button.vue'

interface Props {
  modelValue: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  fullscreen?: boolean
  hideHeader?: boolean
  hideFooter?: boolean
  hideCloseButton?: boolean
  hideCancelButton?: boolean
  hideConfirmButton?: boolean
  cancelText?: string
  confirmText?: string
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  confirmDisabled?: boolean
  loading?: boolean
  loadingText?: string
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  contentPadding?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  fullscreen: false,
  hideHeader: false,
  hideFooter: false,
  hideCloseButton: false,
  hideCancelButton: false,
  hideConfirmButton: false,
  cancelText: 'Cancel',
  confirmText: 'Confirm',
  confirmVariant: 'default',
  confirmDisabled: false,
  loading: false,
  loadingText: 'Loading...',
  closeOnBackdrop: true,
  closeOnEscape: true,
  contentPadding: true,
  persistent: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'cancel': []
  'confirm': []
  'opened': []
  'closed': []
}>()

// Computed properties
const sizeClasses = computed(() => {
  if (props.fullscreen) return ''
  
  const sizeMap = {
    sm: 'w-full max-w-md',
    md: 'w-full max-w-lg',
    lg: 'w-full max-w-2xl',
    xl: 'w-full max-w-4xl',
    '2xl': 'w-full max-w-6xl',
    full: 'w-full max-w-7xl'
  }
  
  return sizeMap[props.size]
})

// Methods
const close = () => {
  if (props.persistent || props.loading) return
  emit('update:modelValue', false)
  emit('close')
}

const cancel = () => {
  if (props.loading) return
  emit('cancel')
  if (!props.persistent) {
    emit('update:modelValue', false)
  }
}

const confirm = () => {
  if (props.loading || props.confirmDisabled) return
  emit('confirm')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop && !props.persistent && !props.loading) {
    close()
  }
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && !props.persistent && !props.loading) {
    close()
  }
}

// Focus management
const focusFirstElement = () => {
  nextTick(() => {
    const modal = document.querySelector('[role="dialog"]')
    if (modal) {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      if (firstElement) {
        firstElement.focus()
      }
    }
  })
}

const trapFocus = (event: KeyboardEvent) => {
  if (event.key !== 'Tab') return

  const modal = document.querySelector('[role="dialog"]')
  if (!modal) return

  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

// Watchers
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleEscapeKey)
    document.addEventListener('keydown', trapFocus)
    document.body.style.overflow = 'hidden'
    focusFirstElement()
    emit('opened')
  } else {
    document.removeEventListener('keydown', handleEscapeKey)
    document.removeEventListener('keydown', trapFocus)
    document.body.style.overflow = ''
    emit('closed')
  }
})

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  document.removeEventListener('keydown', trapFocus)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Additional styles for better modal behavior */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-content-enter-active,
.modal-content-leave-active {
  transition: all 0.3s ease;
}

.modal-content-enter-from,
.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(1rem);
}
</style>

