// Milestone-Gate Meeting Cross-linking Utilities
// Provides functionality to link milestones with corresponding gate meetings

import type { MilestoneDefinition } from '@/types/milestones'
import type { GateMeeting } from '@/composables/useGateMeetings'

// Mapping of milestone IDs to gate meeting types
export const MILESTONE_GATE_MEETING_MAP: Record<string, string> = {
  'business_case': 'Gate 1 - Project Initiation',
  'schematic_design': 'Gate 2 - Design Approval',
  'construction_25': 'Gate 3 - Construction Progress Review',
  'construction_50': 'Gate 3 - Construction Progress Review',
  'construction_85': 'Gate 3 - Construction Progress Review',
  'turnover_occupancy': 'Gate 4 - Project Completion',
  'total_performance': 'Gate 4 - Project Completion'
}

// Reverse mapping for finding milestones by gate meeting type
export const GATE_MEETING_MILESTONE_MAP: Record<string, string[]> = {
  'Gate 1 - Project Initiation': ['business_case'],
  'Gate 2 - Design Approval': ['schematic_design'],
  'Gate 3 - Construction Progress Review': ['construction_25', 'construction_50', 'construction_85'],
  'Gate 4 - Project Completion': ['turnover_occupancy', 'total_performance']
}

// Gate meeting status indicators for milestones
export interface GateMeetingStatus {
  exists: boolean
  status: 'scheduled' | 'completed' | 'cancelled' | 'none'
  meeting?: GateMeeting
  plannedDate?: string
  actualDate?: string
}

/**
 * Find gate meeting associated with a milestone
 */
export function findGateMeetingForMilestone(
  milestone: MilestoneDefinition,
  meetings: GateMeeting[]
): GateMeeting | undefined {
  const gateMeetingType = MILESTONE_GATE_MEETING_MAP[milestone.id]
  if (!gateMeetingType) return undefined
  
  return meetings.find(meeting => meeting.gate_type === gateMeetingType)
}

/**
 * Find milestones associated with a gate meeting
 */
export function findMilestonesForGateMeeting(
  gateMeetingType: string,
  milestones: MilestoneDefinition[]
): MilestoneDefinition[] {
  const milestoneIds = GATE_MEETING_MILESTONE_MAP[gateMeetingType]
  if (!milestoneIds) return []
  
  return milestones.filter(milestone => milestoneIds.includes(milestone.id))
}

/**
 * Get gate meeting status for a milestone
 */
export function getGateMeetingStatusForMilestone(
  milestone: MilestoneDefinition,
  meetings: GateMeeting[]
): GateMeetingStatus {
  const meeting = findGateMeetingForMilestone(milestone, meetings)
  
  if (!meeting) {
    return {
      exists: false,
      status: 'none'
    }
  }
  
  return {
    exists: true,
    status: meeting.status as 'scheduled' | 'completed' | 'cancelled',
    meeting,
    plannedDate: meeting.planned_date,
    actualDate: meeting.actual_date
  }
}

/**
 * Check if milestone and gate meeting dates are synchronized
 */
export function areMilestoneDatesSync(
  milestoneData: { planned_date: string | null; actual_date: string | null },
  meeting: GateMeeting
): {
  plannedSync: boolean
  actualSync: boolean
  suggestions: string[]
} {
  const suggestions: string[] = []
  
  // Check planned date sync
  const plannedSync = milestoneData.planned_date === meeting.planned_date
  if (!plannedSync && milestoneData.planned_date && meeting.planned_date) {
    suggestions.push('Milestone planned date differs from gate meeting date')
  }
  
  // Check actual date sync
  const actualSync = milestoneData.actual_date === meeting.actual_date
  if (!actualSync && meeting.status === 'completed' && meeting.actual_date) {
    if (!milestoneData.actual_date) {
      suggestions.push('Gate meeting is completed but milestone actual date is not set')
    } else {
      suggestions.push('Milestone actual date differs from gate meeting completion date')
    }
  }
  
  return {
    plannedSync,
    actualSync,
    suggestions
  }
}

/**
 * Suggest milestone updates based on gate meeting status
 */
export function suggestMilestoneUpdates(
  milestone: MilestoneDefinition,
  milestoneData: { planned_date: string | null; actual_date: string | null },
  meetings: GateMeeting[]
): {
  hasUpdates: boolean
  updates: Partial<{ planned_date: string; actual_date: string }>
  reasons: string[]
} {
  const meeting = findGateMeetingForMilestone(milestone, meetings)
  const updates: Partial<{ planned_date: string; actual_date: string }> = {}
  const reasons: string[] = []
  
  if (!meeting) {
    return { hasUpdates: false, updates, reasons }
  }
  
  // Suggest planned date update
  if (meeting.planned_date && !milestoneData.planned_date) {
    updates.planned_date = meeting.planned_date
    reasons.push('Set planned date from gate meeting')
  } else if (meeting.planned_date && milestoneData.planned_date !== meeting.planned_date) {
    updates.planned_date = meeting.planned_date
    reasons.push('Sync planned date with gate meeting')
  }
  
  // Suggest actual date update
  if (meeting.status === 'completed' && meeting.actual_date && !milestoneData.actual_date) {
    updates.actual_date = meeting.actual_date
    reasons.push('Set actual date from completed gate meeting')
  } else if (meeting.status === 'completed' && meeting.actual_date && milestoneData.actual_date !== meeting.actual_date) {
    updates.actual_date = meeting.actual_date
    reasons.push('Sync actual date with completed gate meeting')
  }
  
  return {
    hasUpdates: Object.keys(updates).length > 0,
    updates,
    reasons
  }
}

/**
 * Get CSS classes for gate meeting status indicator
 */
export function getGateMeetingStatusClasses(status: GateMeetingStatus['status']): string {
  const classMap = {
    'none': 'bg-gray-100 text-gray-600',
    'scheduled': 'bg-blue-100 text-blue-700',
    'completed': 'bg-green-100 text-green-700',
    'cancelled': 'bg-red-100 text-red-700'
  }
  
  return classMap[status] || classMap.none
}

/**
 * Get human-readable status label
 */
export function getGateMeetingStatusLabel(status: GateMeetingStatus['status']): string {
  const labelMap = {
    'none': 'No Meeting',
    'scheduled': 'Scheduled',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  }
  
  return labelMap[status] || 'Unknown'
}

/**
 * Generate gate meeting creation data from milestone
 */
export function createGateMeetingFromMilestone(
  milestone: MilestoneDefinition,
  milestoneData: { planned_date: string | null; actual_date: string | null },
  projectId: string
): {
  gate_type: string
  planned_date: string
  agenda: string
  project_id: string
} | null {
  const gateMeetingType = MILESTONE_GATE_MEETING_MAP[milestone.id]
  if (!gateMeetingType || !milestoneData.planned_date) {
    return null
  }
  
  return {
    gate_type: gateMeetingType,
    planned_date: milestoneData.planned_date,
    agenda: `Gate meeting for ${milestone.name} milestone`,
    project_id: projectId
  }
}

/**
 * Check if milestone can create a gate meeting
 */
export function canCreateGateMeetingFromMilestone(
  milestone: MilestoneDefinition,
  milestoneData: { planned_date: string | null; actual_date: string | null },
  meetings: GateMeeting[]
): boolean {
  // Must have a gate meeting type mapping
  const gateMeetingType = MILESTONE_GATE_MEETING_MAP[milestone.id]
  if (!gateMeetingType) return false
  
  // Must have a planned date
  if (!milestoneData.planned_date) return false
  
  // Must not already have a meeting of this type
  const existingMeeting = meetings.find(m => m.gate_type === gateMeetingType)
  return !existingMeeting
}

/**
 * Get all milestone-gate meeting relationships for a project
 */
export function getMilestoneGateMeetingRelationships(
  milestones: MilestoneDefinition[],
  meetings: GateMeeting[]
): Array<{
  milestone: MilestoneDefinition
  gateMeetingType?: string
  meeting?: GateMeeting
  status: GateMeetingStatus['status']
}> {
  return milestones
    .filter(milestone => MILESTONE_GATE_MEETING_MAP[milestone.id])
    .map(milestone => {
      const gateMeetingType = MILESTONE_GATE_MEETING_MAP[milestone.id]
      const meeting = findGateMeetingForMilestone(milestone, meetings)
      const status = meeting ? (meeting.status as GateMeetingStatus['status']) : 'none'
      
      return {
        milestone,
        gateMeetingType,
        meeting,
        status
      }
    })
}

