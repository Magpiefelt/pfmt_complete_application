import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export interface GateMeeting {
  id: string
  project_id: string
  project_name: string
  project_manager_id: string
  gate_type: string
  planned_date: string
  actual_date?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  agenda?: string
  attendees?: Array<{
    name: string
    email: string
  }>
  decision?: string
  notes?: string
}

export interface GateMeetingFilters {
  userRole?: string
  projectId?: string
  status?: string
  userId?: string
}

/**
 * Composable for managing gate meetings
 * Centralizes all gate meeting business logic
 */
export function useGateMeetings() {
  const meetings: Ref<GateMeeting[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Role mapping for filtering
  const roleMap: Record<string, string> = {
    'Project Manager': 'pm',
    'Senior Project Manager': 'spm',
    'Director': 'director',
    'Admin': 'admin',
    'Vendor': 'vendor'
  }

  /**
   * Fetch upcoming gate meetings with role-based filtering
   */
  const fetchUpcomingMeetings = async (filters: GateMeetingFilters = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/gate-meetings/upcoming')
      const data = await response.json()

      if (data.success) {
        let filteredMeetings = data.data

        // Apply role-based filtering
        if (filters.userRole && filters.userId) {
          const userRoleKey = roleMap[filters.userRole] || 'vendor'
          
          if (userRoleKey === 'director' || userRoleKey === 'admin') {
            // Directors and admins see all meetings
            filteredMeetings = data.data
          } else {
            // PMs/SPMs see only their project meetings
            filteredMeetings = data.data.filter((meeting: GateMeeting) => 
              meeting.project_manager_id === filters.userId
            )
          }
        }

        // Apply additional filters
        if (filters.projectId) {
          filteredMeetings = filteredMeetings.filter((meeting: GateMeeting) => 
            meeting.project_id === filters.projectId
          )
        }

        if (filters.status) {
          filteredMeetings = filteredMeetings.filter((meeting: GateMeeting) => 
            meeting.status === filters.status
          )
        }

        meetings.value = filteredMeetings
      } else {
        error.value = data.message || 'Failed to fetch meetings'
      }
    } catch (err) {
      error.value = 'Error loading upcoming meetings'
      console.error('Error loading upcoming meetings:', err)
    } finally {
      loading.value = false
    }
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
   * Get meeting status based on date
   */
  const getMeetingStatus = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) return 'Today'
    if (diffDays <= 3) return 'Soon'
    return 'Upcoming'
  }

  /**
   * Get CSS classes for meeting status
   */
  const getMeetingStatusClass = (dateString: string): string => {
    const status = getMeetingStatus(dateString)
    switch (status) {
      case 'Overdue':
        return 'bg-red-100 text-red-800'
      case 'Today':
        return 'bg-orange-100 text-orange-800'
      case 'Soon':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  /**
   * Create a new gate meeting
   */
  const createMeeting = async (meetingData: Partial<GateMeeting>): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/gate-meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData)
      })

      const data = await response.json()

      if (data.success) {
        // Refresh meetings list
        await fetchUpcomingMeetings()
        return true
      } else {
        error.value = data.message || 'Failed to create meeting'
        return false
      }
    } catch (err) {
      error.value = 'Error creating meeting'
      console.error('Error creating meeting:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing gate meeting
   */
  const updateMeeting = async (id: string, meetingData: Partial<GateMeeting>): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/gate-meetings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData)
      })

      const data = await response.json()

      if (data.success) {
        // Refresh meetings list
        await fetchUpcomingMeetings()
        return true
      } else {
        error.value = data.message || 'Failed to update meeting'
        return false
      }
    } catch (err) {
      error.value = 'Error updating meeting'
      console.error('Error updating meeting:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a gate meeting
   */
  const deleteMeeting = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/gate-meetings/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh meetings list
        await fetchUpcomingMeetings()
        return true
      } else {
        error.value = data.message || 'Failed to delete meeting'
        return false
      }
    } catch (err) {
      error.value = 'Error deleting meeting'
      console.error('Error deleting meeting:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Computed properties
  const upcomingMeetings = computed(() => 
    meetings.value.filter(meeting => meeting.status === 'scheduled')
  )

  const overdueMeetings = computed(() => 
    upcomingMeetings.value.filter(meeting => getMeetingStatus(meeting.planned_date) === 'Overdue')
  )

  const todayMeetings = computed(() => 
    upcomingMeetings.value.filter(meeting => getMeetingStatus(meeting.planned_date) === 'Today')
  )

  const soonMeetings = computed(() => 
    upcomingMeetings.value.filter(meeting => getMeetingStatus(meeting.planned_date) === 'Soon')
  )

  return {
    // State
    meetings,
    loading,
    error,

    // Computed
    upcomingMeetings,
    overdueMeetings,
    todayMeetings,
    soonMeetings,

    // Methods
    fetchUpcomingMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    formatMeetingDate,
    getMeetingStatus,
    getMeetingStatusClass
  }
}

