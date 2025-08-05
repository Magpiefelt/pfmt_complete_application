import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Project } from './project'

export interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
}

export const useUIStore = defineStore('ui', () => {
  // State
  const showPFMTExtractor = ref(false)
  const selectedProjectForPFMT = ref<Project | null>(null)
  const sidebarOpen = ref(false)
  const notifications = ref<Notification[]>([])

  // Actions
  const setShowPFMTExtractor = (show: boolean) => {
    showPFMTExtractor.value = show
  }

  const setSelectedProjectForPFMT = (project: Project | null) => {
    selectedProjectForPFMT.value = project
  }

  const setSidebarOpen = (open: boolean) => {
    sidebarOpen.value = open
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...notification
    }
    notifications.value.push(newNotification)
  }

  const removeNotification = (id: number) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  return {
    // State
    showPFMTExtractor,
    selectedProjectForPFMT,
    sidebarOpen,
    notifications,
    
    // Actions
    setShowPFMTExtractor,
    setSelectedProjectForPFMT,
    setSidebarOpen,
    addNotification,
    removeNotification,
    clearNotifications
  }
})

