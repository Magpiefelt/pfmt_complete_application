import { ref, computed, readonly } from 'vue'
import { WorkflowService } from '@/services'

export interface Task {
  id: string
  title: string
  description: string
  projectId: string
  assignedTo: string
  assignedBy: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  tags: string[]
}

export interface Approval {
  id: string
  type: 'project' | 'budget' | 'contract' | 'document'
  itemId: string
  itemTitle: string
  requestedBy: string
  approvers: string[]
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  requestedAt: string
  respondedAt?: string
  comments?: string
  priority: 'normal' | 'urgent'
}

export interface Notification {
  id: string
  type: 'task' | 'approval' | 'deadline' | 'update'
  title: string
  message: string
  userId: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface WorkflowMetrics {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  pendingApprovals: number
  averageCompletionTime: number
  taskCompletionRate: number
}

export function useWorkflow() {
  const tasks = ref<Task[]>([])
  const approvals = ref<Approval[]>([])
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const tasksByStatus = computed(() => {
    return tasks.value.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = []
      }
      acc[task.status].push(task)
      return acc
    }, {} as Record<string, Task[]>)
  })

  const approvalsByStatus = computed(() => {
    return approvals.value.reduce((acc, approval) => {
      if (!acc[approval.status]) {
        acc[approval.status] = []
      }
      acc[approval.status].push(approval)
      return acc
    }, {} as Record<string, Approval[]>)
  })

  const unreadNotifications = computed(() => {
    return notifications.value.filter(notification => !notification.read)
  })

  const overdueTasks = computed(() => {
    const now = new Date()
    return tasks.value.filter(task => 
      task.status !== 'completed' && 
      task.status !== 'cancelled' && 
      new Date(task.dueDate) < now
    )
  })

  const urgentApprovals = computed(() => {
    return approvals.value.filter(approval => 
      approval.status === 'pending' && 
      approval.priority === 'urgent'
    )
  })

  // Actions
  const fetchWorkflowItems = async (filters?: {
    projectId?: string
    assignedTo?: string
    status?: string
    type?: string
  }) => {
    loading.value = true
    error.value = null
    try {
      const [tasksData, approvalsData, notificationsData] = await Promise.all([
        WorkflowService.getTasks(filters),
        WorkflowService.getApprovals(filters),
        WorkflowService.getNotifications()
      ])
      
      tasks.value = tasksData
      approvals.value = approvalsData
      notifications.value = notificationsData
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch workflow items'
    } finally {
      loading.value = false
    }
  }

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true
    error.value = null
    try {
      const newTask = await WorkflowService.createTask(taskData)
      tasks.value.push(newTask)
      return newTask
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create task'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    loading.value = true
    error.value = null
    try {
      const updatedTask = await WorkflowService.updateTask(id, updates)
      const index = tasks.value.findIndex(task => task.id === id)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
      return updatedTask
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update task'
      throw err
    } finally {
      loading.value = false
    }
  }

  const completeTask = async (id: string, comments?: string) => {
    return updateTask(id, { 
      status: 'completed', 
      completedAt: new Date().toISOString(),
      description: comments ? `${tasks.value.find(t => t.id === id)?.description}\n\nCompletion notes: ${comments}` : undefined
    })
  }

  const submitForApproval = async (approvalData: Omit<Approval, 'id' | 'requestedAt' | 'status'>) => {
    loading.value = true
    error.value = null
    try {
      const newApproval = await WorkflowService.createApproval(approvalData)
      approvals.value.push(newApproval)
      return newApproval
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit for approval'
      throw err
    } finally {
      loading.value = false
    }
  }

  const processApproval = async (id: string, action: 'approve' | 'reject', comments?: string) => {
    loading.value = true
    error.value = null
    try {
      const updatedApproval = await WorkflowService.processApproval(id, action, comments)
      const index = approvals.value.findIndex(approval => approval.id === id)
      if (index !== -1) {
        approvals.value[index] = updatedApproval
      }
      return updatedApproval
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to ${action} approval`
      throw err
    } finally {
      loading.value = false
    }
  }

  const markNotificationAsRead = async (id: string) => {
    try {
      await WorkflowService.markNotificationAsRead(id)
      const index = notifications.value.findIndex(notification => notification.id === id)
      if (index !== -1) {
        notifications.value[index].read = true
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to mark notification as read'
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      await WorkflowService.markAllNotificationsAsRead()
      notifications.value.forEach(notification => {
        notification.read = true
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to mark all notifications as read'
    }
  }

  // Utility functions
  const getTaskStatusClass = (status: Task['status']): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityClass = (priority: Task['priority']): string => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800'
      case 'medium':
        return 'bg-blue-100 text-blue-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'urgent':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getApprovalStatusClass = (status: Approval['status']): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatWorkflowDate = (date: string): string => {
    const now = new Date()
    const targetDate = new Date(date)
    const diffInHours = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (Math.abs(diffInHours) < 24) {
      if (diffInHours > 0) {
        return `Due in ${Math.ceil(diffInHours)} hours`
      } else {
        return `Overdue by ${Math.ceil(Math.abs(diffInHours))} hours`
      }
    } else {
      const diffInDays = Math.ceil(diffInHours / 24)
      if (diffInDays > 0) {
        return `Due in ${diffInDays} days`
      } else {
        return `Overdue by ${Math.abs(diffInDays)} days`
      }
    }
  }

  const isTaskOverdue = (task: Task): boolean => {
    return task.status !== 'completed' && 
           task.status !== 'cancelled' && 
           new Date(task.dueDate) < new Date()
  }

  return {
    // State
    tasks: readonly(tasks),
    approvals: readonly(approvals),
    notifications: readonly(notifications),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    tasksByStatus,
    approvalsByStatus,
    unreadNotifications,
    overdueTasks,
    urgentApprovals,

    // Actions
    fetchWorkflowItems,
    createTask,
    updateTask,
    completeTask,
    submitForApproval,
    processApproval,
    markNotificationAsRead,
    markAllNotificationsAsRead,

    // Utilities
    getTaskStatusClass,
    getPriorityClass,
    getApprovalStatusClass,
    formatWorkflowDate,
    isTaskOverdue
  }
}

