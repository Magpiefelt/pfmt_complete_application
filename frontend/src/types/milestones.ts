// Milestone Types for PFMT Application
// Defines the data structures for milestone tracking across project phases

export interface MilestoneDefinition {
  id: string
  name: string
  phase: 'Planning' | 'Design' | 'Construction' | 'Post Construction'
  hasBaseline: boolean
  description?: string
  gateMeetingType?: string // Links to gate meeting types
}

export interface MilestoneData {
  is_na: boolean
  planned_date: string | null
  actual_date: string | null
  baseline_date?: string | null
  notes: string
}

export interface MilestoneRecord extends MilestoneDefinition {
  data: MilestoneData
}

export interface ProjectMilestones {
  [milestoneId: string]: MilestoneData
}

// Milestone definitions for each phase
export const PLANNING_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'business_case',
    name: 'Business Case Approval',
    phase: 'Planning',
    hasBaseline: false,
    description: 'Business case approved by stakeholders',
    gateMeetingType: 'Gate 1 - Project Initiation'
  },
  {
    id: 'project_announced',
    name: 'Project Announced',
    phase: 'Planning',
    hasBaseline: false,
    description: 'Public announcement of the project'
  },
  {
    id: 'par',
    name: 'PAR',
    phase: 'Planning',
    hasBaseline: false,
    description: 'Project Authorization Request approved'
  },
  {
    id: 'site_selection',
    name: 'Site Selection',
    phase: 'Planning',
    hasBaseline: false,
    description: 'Project site selected and confirmed'
  },
  {
    id: 'functional_program',
    name: 'Functional Program Approval',
    phase: 'Planning',
    hasBaseline: false,
    description: 'Functional program requirements approved'
  },
  {
    id: 'prime_consultant',
    name: 'Prime Consultant/Designer Contract Award',
    phase: 'Planning',
    hasBaseline: false,
    description: 'Main design consultant contract awarded'
  }
]

export const DESIGN_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'schematic_design',
    name: 'Schematic Design Completion',
    phase: 'Design',
    hasBaseline: true,
    description: 'Schematic design phase completed',
    gateMeetingType: 'Gate 2 - Design Approval'
  },
  {
    id: 'design_development',
    name: 'Design Development Completion',
    phase: 'Design',
    hasBaseline: true,
    description: 'Design development phase completed'
  },
  {
    id: 'contract_documents',
    name: 'Contract Documents/Pre-Tender Estimate Completion',
    phase: 'Design',
    hasBaseline: true,
    description: 'Contract documents and pre-tender estimate completed'
  }
]

export const CONSTRUCTION_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'site_mobilisation',
    name: 'Site/Construction Mobilisation',
    phase: 'Construction',
    hasBaseline: true,
    description: 'Construction site mobilization and setup'
  },
  {
    id: 'construction_25',
    name: '25% Construction',
    phase: 'Construction',
    hasBaseline: true,
    description: '25% construction completion milestone',
    gateMeetingType: 'Gate 3 - Construction Progress Review'
  },
  {
    id: 'construction_50',
    name: '50% Construction',
    phase: 'Construction',
    hasBaseline: true,
    description: '50% construction completion milestone',
    gateMeetingType: 'Gate 3 - Construction Progress Review'
  },
  {
    id: 'construction_85',
    name: '85% Construction',
    phase: 'Construction',
    hasBaseline: true,
    description: '85% construction completion milestone',
    gateMeetingType: 'Gate 3 - Construction Progress Review'
  },
  {
    id: 'construction_100',
    name: '100% Construction Completion/Interim Acceptance',
    phase: 'Construction',
    hasBaseline: true,
    description: 'Construction completion and interim acceptance'
  }
]

export const POST_CONSTRUCTION_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'turnover_occupancy',
    name: 'Turnover/Occupancy',
    phase: 'Post Construction',
    hasBaseline: true,
    description: 'Building turnover and occupancy',
    gateMeetingType: 'Gate 4 - Project Completion'
  },
  {
    id: 'grand_opening',
    name: 'Grand Opening',
    phase: 'Post Construction',
    hasBaseline: false,
    description: 'Official grand opening ceremony'
  },
  {
    id: 'total_performance',
    name: 'Total Performance/Completion',
    phase: 'Post Construction',
    hasBaseline: true,
    description: 'Total performance and project completion',
    gateMeetingType: 'Gate 4 - Project Completion'
  }
]

// Combined milestone definitions
export const ALL_MILESTONES: MilestoneDefinition[] = [
  ...PLANNING_MILESTONES,
  ...DESIGN_MILESTONES,
  ...CONSTRUCTION_MILESTONES,
  ...POST_CONSTRUCTION_MILESTONES
]

// Alias for backward compatibility
export const MILESTONE_DEFINITIONS = ALL_MILESTONES

// Helper functions
export function getMilestonesByPhase(phase: string): MilestoneDefinition[] {
  switch (phase) {
    case 'Planning':
      return PLANNING_MILESTONES
    case 'Design':
      return DESIGN_MILESTONES
    case 'Construction':
      return CONSTRUCTION_MILESTONES
    case 'Post Construction':
      return POST_CONSTRUCTION_MILESTONES
    default:
      return []
  }
}

export function getMilestoneDefinition(id: string): MilestoneDefinition | undefined {
  return ALL_MILESTONES.find(m => m.id === id)
}

export function createEmptyMilestoneData(): MilestoneData {
  return {
    is_na: false,
    planned_date: null,
    actual_date: null,
    baseline_date: null,
    notes: ''
  }
}

export function createDefaultProjectMilestones(): ProjectMilestones {
  const milestones: ProjectMilestones = {}
  
  ALL_MILESTONES.forEach(milestone => {
    milestones[milestone.id] = createEmptyMilestoneData()
  })
  
  return milestones
}

// Validation functions
export function validateMilestoneData(data: MilestoneData): string[] {
  const errors: string[] = []
  
  // If not N/A, planned date should be provided
  if (!data.is_na && !data.planned_date) {
    errors.push('Planned date is required when milestone is not marked as N/A')
  }
  
  // Actual date should not be before planned date
  if (data.planned_date && data.actual_date) {
    const plannedDate = new Date(data.planned_date)
    const actualDate = new Date(data.actual_date)
    if (actualDate < plannedDate) {
      errors.push('Actual date cannot be before planned date')
    }
  }
  
  // Notes character limit
  if (data.notes && data.notes.length > 500) {
    errors.push('Notes cannot exceed 500 characters')
  }
  
  return errors
}

export function getMilestoneStatus(data: MilestoneData): 'not-applicable' | 'not-started' | 'planned' | 'completed' | 'overdue' {
  if (data.is_na) return 'not-applicable'
  if (data.actual_date) return 'completed'
  if (!data.planned_date) return 'not-started'
  
  const plannedDate = new Date(data.planned_date)
  const today = new Date()
  
  if (today > plannedDate) return 'overdue'
  return 'planned'
}

export function getMilestoneStatusClass(status: string): string {
  const statusClasses = {
    'not-applicable': 'bg-gray-100 text-gray-600',
    'not-started': 'bg-gray-100 text-gray-600',
    'planned': 'bg-blue-100 text-blue-700',
    'completed': 'bg-green-100 text-green-700',
    'overdue': 'bg-red-100 text-red-700'
  }
  
  return statusClasses[status as keyof typeof statusClasses] || statusClasses['not-started']
}

