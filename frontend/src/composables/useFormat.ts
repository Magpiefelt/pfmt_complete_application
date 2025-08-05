/**
 * Composable for common formatting utilities
 * Provides consistent formatting across the application
 */
export function useFormat() {
  
  /**
   * Format currency values
   */
  const formatCurrency = (amount: number, currency = 'CAD'): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Format numbers with thousands separators
   */
  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat('en-CA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    }).format(num)
  }

  /**
   * Format percentage values
   */
  const formatPercentage = (value: number, decimals = 1): string => {
    return `${value.toFixed(decimals)}%`
  }

  /**
   * Format date with various options
   */
  const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }

    return dateObj.toLocaleDateString('en-CA', { ...defaultOptions, ...options })
  }

  /**
   * Format date and time
   */
  const formatDateTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    return dateObj.toLocaleString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Format meeting date with relative formatting
   */
  const formatMeetingDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
    if (diffDays < 7) return `In ${diffDays} days`

    return date.toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  /**
   * Format relative time (e.g., "2 hours ago", "in 3 days")
   */
  const formatRelativeTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = dateObj.getTime() - now.getTime()
    const diffSecs = Math.round(diffMs / 1000)
    const diffMins = Math.round(diffSecs / 60)
    const diffHours = Math.round(diffMins / 60)
    const diffDays = Math.round(diffHours / 24)

    if (Math.abs(diffSecs) < 60) {
      return diffSecs >= 0 ? 'in a few seconds' : 'a few seconds ago'
    } else if (Math.abs(diffMins) < 60) {
      return diffMins >= 0 ? `in ${diffMins} minutes` : `${Math.abs(diffMins)} minutes ago`
    } else if (Math.abs(diffHours) < 24) {
      return diffHours >= 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`
    } else if (Math.abs(diffDays) < 7) {
      return diffDays >= 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`
    } else {
      return formatDate(dateObj)
    }
  }

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Format phone number (Canadian format)
   */
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    
    return phone // Return original if format not recognized
  }

  /**
   * Format postal code (Canadian format)
   */
  const formatPostalCode = (postalCode: string): string => {
    const cleaned = postalCode.replace(/\s/g, '').toUpperCase()
    
    if (cleaned.length === 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    }
    
    return postalCode // Return original if format not recognized
  }

  /**
   * Truncate text with ellipsis
   */
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
  }

  /**
   * Format status text for display
   */
  const formatStatus = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Format project phase for display
   */
  const formatProjectPhase = (phase: string): string => {
    const phaseMap: Record<string, string> = {
      'planning': 'Planning',
      'design': 'Design',
      'construction': 'Construction',
      'completion': 'Completion',
      'maintenance': 'Maintenance'
    }
    
    return phaseMap[phase.toLowerCase()] || formatStatus(phase)
  }

  return {
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatDate,
    formatDateTime,
    formatMeetingDate,
    formatRelativeTime,
    formatFileSize,
    formatPhoneNumber,
    formatPostalCode,
    truncateText,
    formatStatus,
    formatProjectPhase
  }
}

