/**
 * Composable for status badge styling and display logic
 * Provides consistent status indicators across the application
 */
export function useStatusBadge() {

  /**
   * Get CSS classes for meeting status
   */
  const getMeetingStatusClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      'Overdue': 'bg-red-100 text-red-800 border-red-200',
      'Today': 'bg-orange-100 text-orange-800 border-orange-200',
      'Soon': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Upcoming': 'bg-blue-100 text-blue-800 border-blue-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    return statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  /**
   * Get CSS classes for project version status
   */
  const getVersionStatusClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      'draft': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'Draft': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'PendingApproval': 'bg-blue-100 text-blue-800 border-blue-200',
      'Approved': 'bg-green-100 text-green-800 border-green-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200'
    }
    
    return statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  /**
   * Get CSS classes for project status
   */
  const getProjectStatusClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'planning': 'bg-blue-100 text-blue-800 border-blue-200',
      'design': 'bg-purple-100 text-purple-800 border-purple-200',
      'construction': 'bg-orange-100 text-orange-800 border-orange-200',
      'completion': 'bg-green-100 text-green-800 border-green-200',
      'on_hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'completed': 'bg-blue-100 text-blue-800 border-blue-200'
    }
    
    return statusClasses[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  /**
   * Get CSS classes for workflow status
   */
  const getWorkflowStatusClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'blocked': 'bg-red-100 text-red-800 border-red-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    return statusClasses[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  /**
   * Get CSS classes for priority levels
   */
  const getPriorityClass = (priority: string): string => {
    const priorityClasses: Record<string, string> = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200',
      'critical': 'bg-red-200 text-red-900 border-red-300'
    }
    
    return priorityClasses[priority.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  /**
   * Get icon name for meeting status
   */
  const getMeetingStatusIcon = (status: string): string => {
    const statusIcons: Record<string, string> = {
      'Overdue': 'AlertTriangle',
      'Today': 'Clock',
      'Soon': 'Calendar',
      'Upcoming': 'CalendarDays',
      'Completed': 'CheckCircle',
      'Cancelled': 'XCircle'
    }
    
    return statusIcons[status] || 'Calendar'
  }

  /**
   * Get icon name for version status
   */
  const getVersionStatusIcon = (status: string): string => {
    const statusIcons: Record<string, string> = {
      'draft': 'Edit',
      'submitted': 'Send',
      'approved': 'CheckCircle',
      'rejected': 'XCircle',
      'Draft': 'Edit',
      'PendingApproval': 'Send',
      'Approved': 'CheckCircle',
      'Rejected': 'XCircle'
    }
    
    return statusIcons[status] || 'FileText'
  }

  /**
   * Get icon name for project status
   */
  const getProjectStatusIcon = (status: string): string => {
    const statusIcons: Record<string, string> = {
      'active': 'Play',
      'planning': 'FileText',
      'design': 'Compass',
      'construction': 'Hammer',
      'completion': 'CheckCircle',
      'on_hold': 'Pause',
      'cancelled': 'XCircle',
      'completed': 'CheckCircle2'
    }
    
    return statusIcons[status.toLowerCase()] || 'FileText'
  }

  /**
   * Get icon name for priority levels
   */
  const getPriorityIcon = (priority: string): string => {
    const priorityIcons: Record<string, string> = {
      'high': 'ArrowUp',
      'medium': 'Minus',
      'low': 'ArrowDown',
      'critical': 'AlertTriangle'
    }
    
    return priorityIcons[priority.toLowerCase()] || 'Minus'
  }

  /**
   * Get complete badge configuration for meeting status
   */
  const getMeetingBadge = (status: string) => {
    return {
      class: getMeetingStatusClass(status),
      icon: getMeetingStatusIcon(status),
      text: status
    }
  }

  /**
   * Get complete badge configuration for version status
   */
  const getVersionBadge = (status: string) => {
    return {
      class: getVersionStatusClass(status),
      icon: getVersionStatusIcon(status),
      text: status
    }
  }

  /**
   * Get complete badge configuration for project status
   */
  const getProjectBadge = (status: string) => {
    return {
      class: getProjectStatusClass(status),
      icon: getProjectStatusIcon(status),
      text: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    }
  }

  /**
   * Get complete badge configuration for priority
   */
  const getPriorityBadge = (priority: string) => {
    return {
      class: getPriorityClass(priority),
      icon: getPriorityIcon(priority),
      text: priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
    }
  }

  /**
   * Get base badge classes (common styling)
   */
  const getBaseBadgeClass = (): string => {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border'
  }

  /**
   * Generic status class getter (for backward compatibility)
   */
  const getStatusClass = (status: string | null | undefined, type: string = 'project'): string => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    // Handle meeting status mapping
    if (type === 'meeting') {
      const meetingStatusMap: Record<string, string> = {
        'scheduled': 'bg-blue-100 text-blue-800',
        'overdue': 'bg-red-100 text-red-800',
        'today': 'bg-orange-100 text-orange-800',
        'soon': 'bg-yellow-100 text-yellow-800',
        'upcoming': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
        'rescheduled': 'bg-yellow-100 text-yellow-800'
      }
      return meetingStatusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
    }
    
    // Handle version status mapping
    if (type === 'version') {
      const versionStatusMap: Record<string, string> = {
        'draft': 'bg-yellow-100 text-yellow-800',
        'submitted': 'bg-blue-100 text-blue-800',
        'pending_approval': 'bg-orange-100 text-orange-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
      }
      return versionStatusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
    }
    
    // Handle task status mapping
    if (type === 'task') {
      const taskStatusMap: Record<string, string> = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'in_progress': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800',
        'blocked': 'bg-red-100 text-red-800'
      }
      return taskStatusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
    }
    
    // For unknown types, return default gray
    if (type !== 'project' && type !== 'meeting' && type !== 'priority' && 
        type !== 'version' && type !== 'task' && type !== 'workflow') {
      return 'bg-gray-100 text-gray-800'
    }
    
    let baseClass = ''
    switch (type) {
      case 'workflow':
        baseClass = getWorkflowStatusClass(status)
        break
      case 'priority':
        baseClass = getPriorityClass(status)
        break
      default:
        baseClass = getProjectStatusClass(status)
    }
    
    // Remove border classes for backward compatibility
    return baseClass.replace(/\s*border-\w+-\d+/g, '')
  }

  /**
   * Generic status icon getter (for backward compatibility)
   */
  const getStatusIcon = (status: string | null | undefined, type: string = 'project'): string => {
    if (!status) return '●'
    
    // Map to emoji icons for backward compatibility
    const iconMap: Record<string, string> = {
      // Project status icons
      'active': '▶',
      'planning': '📋',
      'design': '🎨',
      'construction': '🔨',
      'completion': '✅',
      'on_hold': '⏸',
      'cancelled': '✕',
      'completed': '✓',
      
      // Meeting status icons
      'overdue': '🔴',
      'today': '🟠',
      'soon': '🟡',
      'upcoming': '🔵',
      'scheduled': '📅',
      'rescheduled': '🔄',
      
      // Priority icons
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢',
      'critical': '🔴',
      
      // Version status icons
      'draft': '📝',
      'submitted': '📤',
      'pending_approval': '⏳',
      'approved': '✅',
      'rejected': '❌',
      
      // Task status icons
      'pending': '⏳',
      'in_progress': '🔄',
      'blocked': '🚫'
    }
    
    const statusKey = status.toLowerCase()
    
    // Special handling for meeting and task completed status
    if ((type === 'meeting' || type === 'task') && statusKey === 'completed') {
      return '✅'
    }
    
    // Special handling for meeting cancelled status
    if (type === 'meeting' && statusKey === 'cancelled') {
      return '❌'
    }
    
    // For unknown types, return bullet for unknown status or default to project behavior
    if (type !== 'project' && type !== 'meeting' && type !== 'priority' && 
        type !== 'version' && type !== 'task' && type !== 'workflow') {
      return '●'
    }
    
    return iconMap[statusKey] || '●'
  }

  /**
   * Generic status text formatter (for backward compatibility)
   */
  const getStatusText = (status: string | null | undefined): string => {
    if (!status) return ''
    
    // Handle underscores and capitalize first letter of each word
    // But preserve dashes and spaces as-is (only capitalize first letter)
    if (status.includes('_')) {
      return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    
    // For dashes and spaces, only capitalize the first letter
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  /**
   * Format complete status badge (for backward compatibility)
   */
  const formatStatusBadge = (status: string, type: string = 'project') => {
    return {
      text: getStatusText(status),
      class: getStatusClass(status, type),
      icon: getStatusIcon(status, type)
    }
  }

  return {
    // Individual class getters
    getMeetingStatusClass,
    getVersionStatusClass,
    getProjectStatusClass,
    getWorkflowStatusClass,
    getPriorityClass,

    // Individual icon getters
    getMeetingStatusIcon,
    getVersionStatusIcon,
    getProjectStatusIcon,
    getPriorityIcon,

    // Complete badge configurations
    getMeetingBadge,
    getVersionBadge,
    getProjectBadge,
    getPriorityBadge,

    // Utility
    getBaseBadgeClass,

    // Backward compatibility functions
    getStatusClass,
    getStatusIcon,
    getStatusText,
    formatStatusBadge
  }
}

