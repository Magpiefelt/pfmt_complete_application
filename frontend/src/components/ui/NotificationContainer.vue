<template>
  <Teleport to="body">
    <div 
      v-if="hasNotifications"
      class="fixed top-4 right-4 z-50 space-y-2 max-w-sm"
    >
      <TransitionGroup
        name="notification"
        tag="div"
        class="space-y-2"
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-80"
          :class="getNotificationClass(notification.type)"
        >
          <div class="flex items-start">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <component 
                :is="getNotificationIcon(notification.type)"
                class="h-5 w-5"
                :class="getIconClass(notification.type)"
              />
            </div>

            <!-- Content -->
            <div class="ml-3 flex-1">
              <h4 class="text-sm font-medium" :class="getTitleClass(notification.type)">
                {{ notification.title }}
              </h4>
              <p class="mt-1 text-sm text-gray-600">
                {{ notification.message }}
              </p>

              <!-- Actions -->
              <div v-if="notification.actions && notification.actions.length > 0" class="mt-3 flex space-x-2">
                <button
                  v-for="action in notification.actions"
                  :key="action.label"
                  @click="action.action"
                  class="text-xs font-medium px-3 py-1 rounded-md transition-colors"
                  :class="getActionClass(action.variant || 'secondary', notification.type)"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>

            <!-- Close button -->
            <div class="ml-4 flex-shrink-0">
              <button
                @click="removeNotification(notification.id)"
                class="inline-flex text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Progress bar for timed notifications -->
          <div 
            v-if="!notification.persistent && notification.duration"
            class="mt-3 w-full bg-gray-200 rounded-full h-1"
          >
            <div 
              class="h-1 rounded-full transition-all duration-100 ease-linear"
              :class="getProgressClass(notification.type)"
              :style="{ width: getProgressWidth(notification) + '%' }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useNotifications } from '@/composables/useNotifications'
import type { Notification } from '@/composables/useNotifications'

const { notifications, hasNotifications, removeNotification } = useNotifications()

// Progress tracking for timed notifications
const progressIntervals = ref<Map<string, NodeJS.Timeout>>(new Map())

const getNotificationIcon = (type: Notification['type']) => {
  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }
  return iconMap[type]
}

const getNotificationClass = (type: Notification['type']) => {
  const classMap = {
    success: 'border-l-4 border-l-green-500',
    error: 'border-l-4 border-l-red-500',
    warning: 'border-l-4 border-l-yellow-500',
    info: 'border-l-4 border-l-blue-500'
  }
  return classMap[type]
}

const getIconClass = (type: Notification['type']) => {
  const classMap = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  }
  return classMap[type]
}

const getTitleClass = (type: Notification['type']) => {
  const classMap = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900'
  }
  return classMap[type]
}

const getActionClass = (variant: 'primary' | 'secondary', type: Notification['type']) => {
  if (variant === 'primary') {
    const classMap = {
      success: 'bg-green-600 text-white hover:bg-green-700',
      error: 'bg-red-600 text-white hover:bg-red-700',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
      info: 'bg-blue-600 text-white hover:bg-blue-700'
    }
    return classMap[type]
  } else {
    const classMap = {
      success: 'bg-green-100 text-green-700 hover:bg-green-200',
      error: 'bg-red-100 text-red-700 hover:bg-red-200',
      warning: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      info: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    }
    return classMap[type]
  }
}

const getProgressClass = (type: Notification['type']) => {
  const classMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }
  return classMap[type]
}

const getProgressWidth = (notification: Notification) => {
  if (!notification.duration || notification.persistent) return 100
  
  const elapsed = Date.now() - notification.createdAt.getTime()
  const progress = Math.max(0, 100 - (elapsed / notification.duration) * 100)
  return progress
}

// Start progress tracking for new notifications
const startProgressTracking = (notification: Notification) => {
  if (notification.persistent || !notification.duration) return

  const interval = setInterval(() => {
    const elapsed = Date.now() - notification.createdAt.getTime()
    if (elapsed >= notification.duration!) {
      clearInterval(interval)
      progressIntervals.value.delete(notification.id)
    }
  }, 100)

  progressIntervals.value.set(notification.id, interval)
}

// Watch for new notifications and start progress tracking
const unwatchNotifications = ref<(() => void) | null>(null)

onMounted(() => {
  // Start progress tracking for existing notifications
  notifications.value.forEach(startProgressTracking)

  // Watch for new notifications
  unwatchNotifications.value = () => {
    // This would be implemented with a proper watcher in a real scenario
  }
})

onUnmounted(() => {
  // Clear all intervals
  progressIntervals.value.forEach(interval => clearInterval(interval))
  progressIntervals.value.clear()

  if (unwatchNotifications.value) {
    unwatchNotifications.value()
  }
})
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>

