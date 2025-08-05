import { BaseService } from './BaseService'
import type { Task, Approval, Notification } from '@/composables/useWorkflow'

export interface WorkflowFilters {
  projectId?: string
  assignedTo?: string
  status?: string
  type?: string
  priority?: string
  dateFrom?: string
  dateTo?: string
}

export interface WorkflowMetrics {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  pendingApprovals: number
  averageCompletionTime: number
  taskCompletionRate: number
}

export class WorkflowService extends BaseService {
  /**
   * Get tasks with optional filtering
   */
  static async getTasks(filters?: WorkflowFilters): Promise<Task[]> {
    const queryParams = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
    return this.request<Task[]>(`/api/workflow/tasks${queryParams ? `?${queryParams}` : ''}`)
  }

  /**
   * Get task by ID
   */
  static async getTaskById(id: string): Promise<Task> {
    return this.request<Task>(`/api/workflow/tasks/${id}`)
  }

  /**
   * Create a new task
   */
  static async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return this.request<Task>('/api/workflow/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    })
  }

  /**
   * Update an existing task
   */
  static async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/api/workflow/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  /**
   * Delete a task
   */
  static async deleteTask(id: string): Promise<void> {
    return this.request<void>(`/api/workflow/tasks/${id}`, {
      method: 'DELETE'
    })
  }

  /**
   * Assign task to user
   */
  static async assignTask(taskId: string, userId: string): Promise<Task> {
    return this.request<Task>(`/api/workflow/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    })
  }

  /**
   * Get approvals with optional filtering
   */
  static async getApprovals(filters?: WorkflowFilters): Promise<Approval[]> {
    const queryParams = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
    return this.request<Approval[]>(`/api/workflow/approvals${queryParams ? `?${queryParams}` : ''}`)
  }

  /**
   * Get approval by ID
   */
  static async getApprovalById(id: string): Promise<Approval> {
    return this.request<Approval>(`/api/workflow/approvals/${id}`)
  }

  /**
   * Create a new approval request
   */
  static async createApproval(approvalData: Omit<Approval, 'id' | 'requestedAt' | 'status'>): Promise<Approval> {
    return this.request<Approval>('/api/workflow/approvals', {
      method: 'POST',
      body: JSON.stringify(approvalData)
    })
  }

  /**
   * Process an approval (approve or reject)
   */
  static async processApproval(id: string, action: 'approve' | 'reject', comments?: string): Promise<Approval> {
    return this.request<Approval>(`/api/workflow/approvals/${id}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    })
  }

  /**
   * Cancel an approval request
   */
  static async cancelApproval(id: string): Promise<Approval> {
    return this.request<Approval>(`/api/workflow/approvals/${id}/cancel`, {
      method: 'POST'
    })
  }

  /**
   * Get notifications for current user
   */
  static async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/api/workflow/notifications')
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(id: string): Promise<void> {
    return this.request<void>(`/api/workflow/notifications/${id}/read`, {
      method: 'POST'
    })
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsAsRead(): Promise<void> {
    return this.request<void>('/api/workflow/notifications/read-all', {
      method: 'POST'
    })
  }

  /**
   * Delete notification
   */
  static async deleteNotification(id: string): Promise<void> {
    return this.request<void>(`/api/workflow/notifications/${id}`, {
      method: 'DELETE'
    })
  }

  /**
   * Get workflow metrics
   */
  static async getWorkflowMetrics(projectId?: string): Promise<WorkflowMetrics> {
    const queryParams = projectId ? `?projectId=${projectId}` : ''
    return this.request<WorkflowMetrics>(`/api/workflow/metrics${queryParams}`)
  }

  /**
   * Get workflow dashboard data
   */
  static async getWorkflowDashboard(): Promise<{
    recentTasks: Task[]
    pendingApprovals: Approval[]
    overdueTasks: Task[]
    metrics: WorkflowMetrics
  }> {
    return this.request('/api/workflow/dashboard')
  }

  /**
   * Bulk update tasks
   */
  static async bulkUpdateTasks(updates: Array<{ id: string; updates: Partial<Task> }>): Promise<Task[]> {
    return this.request<Task[]>('/api/workflow/tasks/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ updates })
    })
  }

  /**
   * Get task templates
   */
  static async getTaskTemplates(): Promise<Array<{
    id: string
    name: string
    description: string
    defaultPriority: Task['priority']
    estimatedDuration: number
    tags: string[]
  }>> {
    return this.request('/api/workflow/task-templates')
  }

  /**
   * Create task from template
   */
  static async createTaskFromTemplate(templateId: string, projectId: string, customizations?: Partial<Task>): Promise<Task> {
    return this.request<Task>('/api/workflow/tasks/from-template', {
      method: 'POST',
      body: JSON.stringify({ templateId, projectId, customizations })
    })
  }

  /**
   * Get approval workflow for item type
   */
  static async getApprovalWorkflow(itemType: string): Promise<{
    steps: Array<{
      order: number
      approverRole: string
      required: boolean
      description: string
    }>
    estimatedDuration: number
  }> {
    return this.request(`/api/workflow/approval-workflows/${itemType}`)
  }

  /**
   * Get workflow analytics
   */
  static async getWorkflowAnalytics(timeframe: 'week' | 'month' | 'quarter'): Promise<{
    task_completion_trend: Array<{ date: string; completed: number; created: number }>
    approval_processing_time: Array<{ type: string; averageHours: number }>
    bottlenecks: Array<{ stage: string; averageWaitTime: number; count: number }>
    productivity_metrics: {
      tasksPerUser: Array<{ userId: string; userName: string; taskCount: number }>
      approvalEfficiency: Array<{ userId: string; userName: string; averageProcessingTime: number }>
    }
  }> {
    return this.request(`/api/workflow/analytics`, {
      method: 'POST',
      body: JSON.stringify({ timeframe })
    })
  }

  /**
   * Export workflow data
   */
  static async exportWorkflowData(filters: WorkflowFilters, format: 'csv' | 'excel'): Promise<Blob> {
    return this.request<Blob>('/api/workflow/export', {
      method: 'POST',
      body: JSON.stringify({ filters, format }),
      headers: {
        ...this.getHeaders(),
        'Accept': 'application/octet-stream'
      }
    })
  }

  /**
   * Get workflow calendar events
   */
  static async getWorkflowCalendar(startDate: string, endDate: string): Promise<Array<{
    id: string
    title: string
    type: 'task' | 'approval' | 'deadline'
    date: string
    priority: string
    projectId: string
    projectName: string
  }>> {
    return this.request(`/api/workflow/calendar`, {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate })
    })
  }
}

