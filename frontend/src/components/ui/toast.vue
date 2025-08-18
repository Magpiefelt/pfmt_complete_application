<template>
  <div class="toast-container">
    <TransitionGroup
      name="toast"
      tag="div"
      class="fixed top-4 right-4 z-50 space-y-2"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="toast-item max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
        :class="getToastClass(notification.type)"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <component
                :is="getIcon(notification.type)"
                class="h-6 w-6"
                :class="getIconClass(notification.type)"
              />
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">
                {{ notification.title }}
              </p>
              <p class="mt-1 text-sm text-gray-500">
                {{ notification.message }}
              </p>
              <div v-if="notification.actions && notification.actions.length > 0" class="mt-3 flex space-x-2">
                <button
                  v-for="action in notification.actions"
                  :key="action.label"
                  @click="handleAction(action, notification.id)"
                  class="text-sm font-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  :class="getActionClass(action.variant || 'secondary')"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="removeNotification(notification.id)"
                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span class="sr-only">Close</span>
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <!-- Progress bar for timed notifications -->
        <div
          v-if="!notification.persistent && notification.duration"
          class="h-1 bg-gray-200"
        >
          <div
            class="h-full transition-all ease-linear"
            :class="getProgressBarClass(notification.type)"
            :style="{ 
              width: '100%',
              animation: `toast-progress ${notification.duration}ms linear forwards`
            }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useNotifications } from '@/composables/useNotifications'
import type { Notification } from '@/composables/useNotifications'

const { notifications, removeNotification } = useNotifications()

const getIcon = (type: Notification['type']) => {
  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }
  return iconMap[type]
}

const getIconClass = (type: Notification['type']) => {
  const classMap = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  }
  return classMap[type]
}

const getToastClass = (type: Notification['type']) => {
  const classMap = {
    success: 'border-l-4 border-green-400',
    error: 'border-l-4 border-red-400',
    warning: 'border-l-4 border-yellow-400',
    info: 'border-l-4 border-blue-400'
  }
  return classMap[type]
}

const getProgressBarClass = (type: Notification['type']) => {
  const classMap = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    warning: 'bg-yellow-400',
    info: 'bg-blue-400'
  }
  return classMap[type]
}

const getActionClass = (variant: 'primary' | 'secondary') => {
  const classMap = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500 border border-gray-300'
  }
  return classMap[variant]
}

const handleAction = (action: { action: () => void }, notificationId: string) => {
  action.action()
  removeNotification(notificationId)
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>

