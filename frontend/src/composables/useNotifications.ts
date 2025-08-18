import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'primary' | 'secondary'
  }>
  createdAt: Date
}

/**
 * Composable for managing application notifications
 * Provides toast-style notifications with different types and actions
 */
export function useNotifications() {
  const notifications: Ref<Notification[]> = ref([])

  /**
   * Add a new notification
   */
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const newNotification: Notification = {
      id,
      createdAt: new Date(),
      duration: notification.duration ?? 5000, // Default 5 seconds
      persistent: notification.persistent ?? false,
      ...notification
    }

    notifications.value.push(newNotification)

    // Auto-remove non-persistent notifications
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  /**
   * Remove a notification by ID
   */
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * Clear all notifications
   */
  const clearAll = () => {
    notifications.value = []
  }

  /**
   * Clear notifications by type
   */
  const clearByType = (type: Notification['type']) => {
    notifications.value = notifications.value.filter(n => n.type !== type)
  }

  // Convenience methods for different notification types
  const success = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  const error = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      persistent: true, // Errors are persistent by default
      ...options
    })
  }

  const warning = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  const info = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  // Version workflow specific notifications
  const versionCreated = (versionNumber: number) => {
    return success(
      'Draft Version Created',
      `Version ${versionNumber} has been created and is ready for editing.`,
      {
        actions: [
          {
            label: 'Edit Now',
            action: () => {
              // Navigate to edit mode
              console.log('Navigate to edit mode')
            },
            variant: 'primary'
          }
        ]
      }
    )
  }

  const versionSubmitted = (versionNumber: number) => {
    return info(
      'Version Submitted for Approval',
      `Version ${versionNumber} has been submitted and is awaiting director approval.`,
      {
        duration: 7000
      }
    )
  }

  const versionApproved = (versionNumber: number) => {
    return success(
      'Version Approved',
      `Version ${versionNumber} has been approved and is now the current version.`,
      {
        duration: 7000
      }
    )
  }

  const versionRejected = (versionNumber: number, reason?: string) => {
    return warning(
      'Version Rejected',
      `Version ${versionNumber} has been rejected. ${reason ? `Reason: ${reason}` : 'Please review and resubmit.'}`,
      {
        persistent: true,
        actions: [
          {
            label: 'View Details',
            action: () => {
              // Navigate to version details
              console.log('Navigate to version details')
            },
            variant: 'primary'
          }
        ]
      }
    )
  }

  const meetingScheduled = (meetingType: string, date: string) => {
    return info(
      'Meeting Scheduled',
      `${meetingType} has been scheduled for ${date}.`,
      {
        duration: 6000
      }
    )
  }

  const meetingCompleted = (meetingType: string, decision?: string) => {
    return success(
      'Meeting Completed',
      `${meetingType} has been completed. ${decision ? `Decision: ${decision}` : ''}`,
      {
        duration: 6000
      }
    )
  }

  const taskCompleted = (taskTitle: string) => {
    return success(
      'Task Completed',
      `"${taskTitle}" has been marked as completed.`,
      {
        duration: 4000
      }
    )
  }

  const taskAssigned = (taskTitle: string, assignee: string) => {
    return info(
      'Task Assigned',
      `"${taskTitle}" has been assigned to ${assignee}.`,
      {
        duration: 5000
      }
    )
  }

  // Computed properties
  const hasNotifications = computed(() => notifications.value.length > 0)
  const unreadCount = computed(() => notifications.value.length)
  const errorNotifications = computed(() => notifications.value.filter(n => n.type === 'error'))
  const hasErrors = computed(() => errorNotifications.value.length > 0)

  return {
    // State
    notifications,

    // Computed
    hasNotifications,
    unreadCount,
    errorNotifications,
    hasErrors,

    // General methods
    addNotification,
    removeNotification,
    clearAll,
    clearByType,

    // Convenience methods
    success,
    error,
    warning,
    info,

    // Workflow-specific methods
    versionCreated,
    versionSubmitted,
    versionApproved,
    versionRejected,
    meetingScheduled,
    meetingCompleted,
    taskCompleted,
    taskAssigned
  }
}

