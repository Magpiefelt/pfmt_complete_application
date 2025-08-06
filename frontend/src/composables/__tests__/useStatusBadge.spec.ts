import { describe, it, expect } from 'vitest'
import { useStatusBadge } from '../useStatusBadge'

describe('useStatusBadge', () => {
  describe('getStatusClass', () => {
    it('should return correct classes for project statuses', () => {
      const { getStatusClass } = useStatusBadge()

      expect(getStatusClass('active', 'project')).toBe('bg-green-100 text-green-800')
      expect(getStatusClass('on_hold', 'project')).toBe('bg-yellow-100 text-yellow-800')
      expect(getStatusClass('cancelled', 'project')).toBe('bg-red-100 text-red-800')
      expect(getStatusClass('completed', 'project')).toBe('bg-blue-100 text-blue-800')
      expect(getStatusClass('unknown_status', 'project')).toBe('bg-gray-100 text-gray-800')
    })

    it('should return correct classes for meeting statuses', () => {
      const { getStatusClass } = useStatusBadge()

      expect(getStatusClass('scheduled', 'meeting')).toBe('bg-blue-100 text-blue-800')
      expect(getStatusClass('completed', 'meeting')).toBe('bg-green-100 text-green-800')
      expect(getStatusClass('cancelled', 'meeting')).toBe('bg-red-100 text-red-800')
      expect(getStatusClass('rescheduled', 'meeting')).toBe('bg-yellow-100 text-yellow-800')
      expect(getStatusClass('unknown_status', 'meeting')).toBe('bg-gray-100 text-gray-800')
    })

    it('should return correct classes for version statuses', () => {
      const { getStatusClass } = useStatusBadge()

      expect(getStatusClass('draft', 'version')).toBe('bg-yellow-100 text-yellow-800')
      expect(getStatusClass('pending_approval', 'version')).toBe('bg-orange-100 text-orange-800')
      expect(getStatusClass('approved', 'version')).toBe('bg-green-100 text-green-800')
      expect(getStatusClass('rejected', 'version')).toBe('bg-red-100 text-red-800')
      expect(getStatusClass('unknown_status', 'version')).toBe('bg-gray-100 text-gray-800')
    })

    it('should return correct classes for task statuses', () => {
      const { getStatusClass } = useStatusBadge()

      expect(getStatusClass('pending', 'task')).toBe('bg-yellow-100 text-yellow-800')
      expect(getStatusClass('in_progress', 'task')).toBe('bg-blue-100 text-blue-800')
      expect(getStatusClass('completed', 'task')).toBe('bg-green-100 text-green-800')
      expect(getStatusClass('blocked', 'task')).toBe('bg-red-100 text-red-800')
      expect(getStatusClass('unknown_status', 'task')).toBe('bg-gray-100 text-gray-800')
    })

    it('should return correct classes for priority levels', () => {
      const { getStatusClass } = useStatusBadge()

      expect(getStatusClass('high', 'priority')).toBe('bg-red-100 text-red-800')
      expect(getStatusClass('medium', 'priority')).toBe('bg-yellow-100 text-yellow-800')
      expect(getStatusClass('low', 'priority')).toBe('bg-green-100 text-green-800')
      expect(getStatusClass('unknown_priority', 'priority')).toBe('bg-gray-100 text-gray-800')
    })

    it('should handle case insensitive status values', () => {
      const { getStatusClass } = useStatusBadge()

      expect(getStatusClass('ACTIVE', 'project')).toBe('bg-green-100 text-green-800')
      expect(getStatusClass('Active', 'project')).toBe('bg-green-100 text-green-800')
      expect(getStatusClass('SCHEDULED', 'meeting')).toBe('bg-blue-100 text-blue-800')
      expect(getStatusClass('Scheduled', 'meeting')).toBe('bg-blue-100 text-blue-800')
    })

    it('should default to gray for unknown types', () => {
      const { getStatusClass } = useStatusBadge()

      expect(getStatusClass('active', 'unknown_type' as any)).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('getStatusIcon', () => {
    it('should return correct icons for project statuses', () => {
      const { getStatusIcon } = useStatusBadge()

      expect(getStatusIcon('active', 'project')).toBe('▶')
      expect(getStatusIcon('on_hold', 'project')).toBe('⏸')
      expect(getStatusIcon('cancelled', 'project')).toBe('✕')
      expect(getStatusIcon('completed', 'project')).toBe('✓')
      expect(getStatusIcon('unknown_status', 'project')).toBe('●')
    })

    it('should return correct icons for meeting statuses', () => {
      const { getStatusIcon } = useStatusBadge()

      expect(getStatusIcon('scheduled', 'meeting')).toBe('📅')
      expect(getStatusIcon('completed', 'meeting')).toBe('✅')
      expect(getStatusIcon('cancelled', 'meeting')).toBe('❌')
      expect(getStatusIcon('rescheduled', 'meeting')).toBe('🔄')
      expect(getStatusIcon('unknown_status', 'meeting')).toBe('●')
    })

    it('should return correct icons for version statuses', () => {
      const { getStatusIcon } = useStatusBadge()

      expect(getStatusIcon('draft', 'version')).toBe('📝')
      expect(getStatusIcon('pending_approval', 'version')).toBe('⏳')
      expect(getStatusIcon('approved', 'version')).toBe('✅')
      expect(getStatusIcon('rejected', 'version')).toBe('❌')
      expect(getStatusIcon('unknown_status', 'version')).toBe('●')
    })

    it('should return correct icons for task statuses', () => {
      const { getStatusIcon } = useStatusBadge()

      expect(getStatusIcon('pending', 'task')).toBe('⏳')
      expect(getStatusIcon('in_progress', 'task')).toBe('🔄')
      expect(getStatusIcon('completed', 'task')).toBe('✅')
      expect(getStatusIcon('blocked', 'task')).toBe('🚫')
      expect(getStatusIcon('unknown_status', 'task')).toBe('●')
    })

    it('should return correct icons for priority levels', () => {
      const { getStatusIcon } = useStatusBadge()

      expect(getStatusIcon('high', 'priority')).toBe('🔴')
      expect(getStatusIcon('medium', 'priority')).toBe('🟡')
      expect(getStatusIcon('low', 'priority')).toBe('🟢')
      expect(getStatusIcon('unknown_priority', 'priority')).toBe('●')
    })

    it('should handle case insensitive status values', () => {
      const { getStatusIcon } = useStatusBadge()

      expect(getStatusIcon('ACTIVE', 'project')).toBe('▶')
      expect(getStatusIcon('Active', 'project')).toBe('▶')
      expect(getStatusIcon('SCHEDULED', 'meeting')).toBe('📅')
      expect(getStatusIcon('Scheduled', 'meeting')).toBe('📅')
    })

    it('should default to bullet for unknown types', () => {
      const { getStatusIcon } = useStatusBadge()

      expect(getStatusIcon('active', 'unknown_type' as any)).toBe('●')
    })
  })

  describe('getStatusText', () => {
    it('should return formatted status text', () => {
      const { getStatusText } = useStatusBadge()

      expect(getStatusText('active')).toBe('Active')
      expect(getStatusText('on_hold')).toBe('On Hold')
      expect(getStatusText('pending_approval')).toBe('Pending Approval')
      expect(getStatusText('in_progress')).toBe('In Progress')
      expect(getStatusText('cancelled')).toBe('Cancelled')
    })

    it('should handle already formatted text', () => {
      const { getStatusText } = useStatusBadge()

      expect(getStatusText('Active')).toBe('Active')
      expect(getStatusText('On Hold')).toBe('On Hold')
      expect(getStatusText('Pending Approval')).toBe('Pending Approval')
    })

    it('should handle single words', () => {
      const { getStatusText } = useStatusBadge()

      expect(getStatusText('draft')).toBe('Draft')
      expect(getStatusText('completed')).toBe('Completed')
      expect(getStatusText('scheduled')).toBe('Scheduled')
    })

    it('should handle empty or undefined input', () => {
      const { getStatusText } = useStatusBadge()

      expect(getStatusText('')).toBe('')
      expect(getStatusText(undefined as any)).toBe('')
      expect(getStatusText(null as any)).toBe('')
    })
  })

  describe('formatStatusBadge', () => {
    it('should return complete badge configuration', () => {
      const { formatStatusBadge } = useStatusBadge()

      const badge = formatStatusBadge('active', 'project')

      expect(badge).toEqual({
        text: 'Active',
        class: 'bg-green-100 text-green-800',
        icon: '▶'
      })
    })

    it('should work with different status types', () => {
      const { formatStatusBadge } = useStatusBadge()

      const meetingBadge = formatStatusBadge('scheduled', 'meeting')
      expect(meetingBadge).toEqual({
        text: 'Scheduled',
        class: 'bg-blue-100 text-blue-800',
        icon: '📅'
      })

      const versionBadge = formatStatusBadge('pending_approval', 'version')
      expect(versionBadge).toEqual({
        text: 'Pending Approval',
        class: 'bg-orange-100 text-orange-800',
        icon: '⏳'
      })
    })

    it('should handle unknown statuses gracefully', () => {
      const { formatStatusBadge } = useStatusBadge()

      const unknownBadge = formatStatusBadge('unknown_status', 'project')
      expect(unknownBadge).toEqual({
        text: 'Unknown Status',
        class: 'bg-gray-100 text-gray-800',
        icon: '●'
      })
    })
  })

  describe('edge cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      const { getStatusClass, getStatusIcon, getStatusText } = useStatusBadge()

      expect(getStatusClass(null as any, 'project')).toBe('bg-gray-100 text-gray-800')
      expect(getStatusClass(undefined as any, 'project')).toBe('bg-gray-100 text-gray-800')
      
      expect(getStatusIcon(null as any, 'project')).toBe('●')
      expect(getStatusIcon(undefined as any, 'project')).toBe('●')
      
      expect(getStatusText(null as any)).toBe('')
      expect(getStatusText(undefined as any)).toBe('')
    })

    it('should handle empty strings', () => {
      const { getStatusClass, getStatusIcon, getStatusText } = useStatusBadge()

      expect(getStatusClass('', 'project')).toBe('bg-gray-100 text-gray-800')
      expect(getStatusIcon('', 'project')).toBe('●')
      expect(getStatusText('')).toBe('')
    })

    it('should handle special characters in status', () => {
      const { getStatusText } = useStatusBadge()

      expect(getStatusText('status_with_underscores')).toBe('Status With Underscores')
      expect(getStatusText('status-with-dashes')).toBe('Status-with-dashes')
      expect(getStatusText('status with spaces')).toBe('Status with spaces')
    })
  })
})

