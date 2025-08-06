import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGateMeetings } from '../useGateMeetings'

// Mock fetch globally
global.fetch = vi.fn()

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    currentUser: {
      id: 1,
      name: 'Test User',
      role: 'Project Manager'
    }
  })
}))

describe('useGateMeetings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('role-based access controls', () => {
    it('should allow Project Manager to create meetings', () => {
      const { canCreateMeeting } = useGateMeetings()
      expect(canCreateMeeting.value).toBe(true)
    })

    it('should allow Project Manager to edit meetings', () => {
      const { canEditMeeting } = useGateMeetings()
      expect(canEditMeeting.value).toBe(true)
    })

    it('should not allow Project Manager to delete meetings', () => {
      const { canDeleteMeeting } = useGateMeetings()
      expect(canDeleteMeeting.value).toBe(false)
    })

    it('should allow Project Manager to reschedule meetings', () => {
      const { canRescheduleMeeting } = useGateMeetings()
      expect(canRescheduleMeeting.value).toBe(true)
    })

    it('should allow Project Manager to cancel meetings', () => {
      const { canCancelMeeting } = useGateMeetings()
      expect(canCancelMeeting.value).toBe(true)
    })

    it('should allow Project Manager to complete meetings', () => {
      const { canCompleteMeeting } = useGateMeetings()
      expect(canCompleteMeeting.value).toBe(true)
    })

    it('should not allow Project Manager to view all meetings', () => {
      const { canViewAllMeetings } = useGateMeetings()
      expect(canViewAllMeetings.value).toBe(false)
    })
  })

  describe('formatMeetingDate', () => {
    it('should format today as "Today"', () => {
      const { formatMeetingDate } = useGateMeetings()
      const today = new Date().toISOString()
      expect(formatMeetingDate(today)).toBe('Today')
    })

    it('should format tomorrow as "Tomorrow"', () => {
      const { formatMeetingDate } = useGateMeetings()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(formatMeetingDate(tomorrow.toISOString())).toBe('Tomorrow')
    })

    it('should format yesterday as "Yesterday"', () => {
      const { formatMeetingDate } = useGateMeetings()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(formatMeetingDate(yesterday.toISOString())).toBe('Yesterday')
    })

    it('should format future dates correctly', () => {
      const { formatMeetingDate } = useGateMeetings()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      expect(formatMeetingDate(futureDate.toISOString())).toBe('In 5 days')
    })

    it('should format past dates correctly', () => {
      const { formatMeetingDate } = useGateMeetings()
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      expect(formatMeetingDate(pastDate.toISOString())).toBe('5 days ago')
    })
  })

  describe('getMeetingStatus', () => {
    it('should return "Overdue" for past dates', () => {
      const { getMeetingStatus } = useGateMeetings()
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(getMeetingStatus(pastDate.toISOString())).toBe('Overdue')
    })

    it('should return "Today" for today', () => {
      const { getMeetingStatus } = useGateMeetings()
      const today = new Date().toISOString()
      expect(getMeetingStatus(today)).toBe('Today')
    })

    it('should return "Soon" for dates within 3 days', () => {
      const { getMeetingStatus } = useGateMeetings()
      const soonDate = new Date()
      soonDate.setDate(soonDate.getDate() + 2)
      expect(getMeetingStatus(soonDate.toISOString())).toBe('Soon')
    })

    it('should return "Upcoming" for future dates beyond 3 days', () => {
      const { getMeetingStatus } = useGateMeetings()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      expect(getMeetingStatus(futureDate.toISOString())).toBe('Upcoming')
    })
  })

  describe('getMeetingStatusClass', () => {
    it('should return correct CSS classes for different statuses', () => {
      const { getMeetingStatusClass } = useGateMeetings()
      
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(getMeetingStatusClass(pastDate.toISOString())).toBe('bg-red-100 text-red-800')

      const today = new Date().toISOString()
      expect(getMeetingStatusClass(today)).toBe('bg-orange-100 text-orange-800')

      const soonDate = new Date()
      soonDate.setDate(soonDate.getDate() + 2)
      expect(getMeetingStatusClass(soonDate.toISOString())).toBe('bg-yellow-100 text-yellow-800')

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      expect(getMeetingStatusClass(futureDate.toISOString())).toBe('bg-blue-100 text-blue-800')
    })
  })

  describe('fetchUpcomingMeetings', () => {
    it('should fetch meetings successfully', async () => {
      const mockMeetings = [
        {
          id: '1',
          project_id: 'proj1',
          project_name: 'Test Project',
          project_manager_id: 'pm1',
          gate_type: 'Gate 1',
          planned_date: '2024-01-15',
          status: 'scheduled'
        }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockMeetings })
      })

      const { fetchUpcomingMeetings, meetings } = useGateMeetings()
      await fetchUpcomingMeetings()

      expect(meetings.value).toEqual(mockMeetings)
    })

    it('should handle fetch errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: false, message: 'Failed to fetch' })
      })

      const { fetchUpcomingMeetings, error } = useGateMeetings()
      await fetchUpcomingMeetings()

      expect(error.value).toBe('Failed to fetch')
    })

    it('should filter meetings by user role', async () => {
      const mockMeetings = [
        {
          id: '1',
          project_id: 'proj1',
          project_name: 'Test Project 1',
          project_manager_id: 'pm1',
          gate_type: 'Gate 1',
          planned_date: '2024-01-15',
          status: 'scheduled'
        },
        {
          id: '2',
          project_id: 'proj2',
          project_name: 'Test Project 2',
          project_manager_id: 'pm2',
          gate_type: 'Gate 2',
          planned_date: '2024-01-16',
          status: 'scheduled'
        }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockMeetings })
      })

      const { fetchUpcomingMeetings, meetings } = useGateMeetings()
      await fetchUpcomingMeetings({
        userRole: 'Project Manager',
        userId: 'pm1'
      })

      expect(meetings.value).toHaveLength(1)
      expect(meetings.value[0].project_manager_id).toBe('pm1')
    })

    it('should show all meetings for directors', async () => {
      const mockMeetings = [
        {
          id: '1',
          project_id: 'proj1',
          project_name: 'Test Project 1',
          project_manager_id: 'pm1',
          gate_type: 'Gate 1',
          planned_date: '2024-01-15',
          status: 'scheduled'
        },
        {
          id: '2',
          project_id: 'proj2',
          project_name: 'Test Project 2',
          project_manager_id: 'pm2',
          gate_type: 'Gate 2',
          planned_date: '2024-01-16',
          status: 'scheduled'
        }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockMeetings })
      })

      const { fetchUpcomingMeetings, meetings } = useGateMeetings()
      await fetchUpcomingMeetings({
        userRole: 'Director',
        userId: 'director1'
      })

      expect(meetings.value).toHaveLength(2)
    })
  })

  describe('createMeeting', () => {
    it('should create a meeting successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true })
      })

      const { createMeeting } = useGateMeetings()
      const result = await createMeeting({
        project_id: 'proj1',
        gate_type: 'Gate 1',
        planned_date: '2024-01-15'
      })

      expect(result).toBe(true)
    })

    it('should handle creation errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: false, message: 'Creation failed' })
      })

      const { createMeeting, error } = useGateMeetings()
      const result = await createMeeting({
        project_id: 'proj1',
        gate_type: 'Gate 1',
        planned_date: '2024-01-15'
      })

      expect(result).toBe(false)
      expect(error.value).toBe('Creation failed')
    })
  })

  describe('updateMeeting', () => {
    it('should update a meeting successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true })
      })

      const { updateMeeting } = useGateMeetings()
      const result = await updateMeeting('meeting1', {
        planned_date: '2024-01-16'
      })

      expect(result).toBe(true)
    })
  })

  describe('rescheduleMeeting', () => {
    it('should reschedule a meeting successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true })
      })

      const { rescheduleMeeting } = useGateMeetings()
      const result = await rescheduleMeeting('meeting1', '2024-01-20')

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/gate-meetings/meeting1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planned_date: '2024-01-20',
          status: 'scheduled'
        })
      })
    })
  })

  describe('cancelMeeting', () => {
    it('should cancel a meeting successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true })
      })

      const { cancelMeeting } = useGateMeetings()
      const result = await cancelMeeting('meeting1', 'Resource unavailable')

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/gate-meetings/meeting1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
          notes: 'Cancelled: Resource unavailable'
        })
      })
    })
  })

  describe('completeMeeting', () => {
    it('should complete a meeting successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true })
      })

      const { completeMeeting } = useGateMeetings()
      const result = await completeMeeting('meeting1', {
        decision: 'Approved',
        notes: 'All requirements met'
      })

      expect(result).toBe(true)
      
      // Check that the API was called correctly, but be flexible with timestamp
      const callArgs = (global.fetch as any).mock.calls.find(call => 
        call[0] === '/api/gate-meetings/meeting1' && call[1]?.method === 'PATCH'
      )
      
      expect(callArgs).toBeDefined()
      expect(callArgs[1].headers['Content-Type']).toBe('application/json')
      
      const body = JSON.parse(callArgs[1].body)
      expect(body.status).toBe('completed')
      expect(body.decision).toBe('Approved')
      expect(body.notes).toBe('All requirements met')
      expect(body.attendees).toBeUndefined()
      expect(typeof body.actual_date).toBe('string')
      expect(body.actual_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/) // ISO timestamp format
    })
  })

  describe('computed properties', () => {
    it('should filter upcoming meetings correctly', () => {
      const { meetings, upcomingMeetings } = useGateMeetings()
      
      meetings.value = [
        { id: '1', status: 'scheduled', planned_date: '2024-01-15' },
        { id: '2', status: 'completed', planned_date: '2024-01-10' },
        { id: '3', status: 'scheduled', planned_date: '2024-01-20' }
      ] as any

      expect(upcomingMeetings.value).toHaveLength(2)
      expect(upcomingMeetings.value.every(m => m.status === 'scheduled')).toBe(true)
    })
  })
})

