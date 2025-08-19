import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectWizardStore } from '@/stores/projectWizard'
import { ProjectWorkflowAPI } from '@/services/projectWorkflowApi'

// Mock the ProjectWorkflowAPI
vi.mock('@/services/projectWorkflowApi', () => ({
  ProjectWorkflowAPI: {
    initiateProject: vi.fn(),
    assignTeam: vi.fn(),
    finalizeProject: vi.fn(),
    getProject: vi.fn(),
    getWorkflowStatus: vi.fn(),
    getAvailableUsers: vi.fn(),
    getAvailableVendors: vi.fn()
  }
}))

// Mock the auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    currentUser: {
      id: 'test-user-id',
      role: 'pm',
      name: 'Test User'
    }
  })
}))

describe('ProjectWizard Store', () => {
  let store: ReturnType<typeof useProjectWizardStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useProjectWizardStore()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(store.project).toBeNull()
      expect(store.initiation.name).toBe('')
      expect(store.initiation.description).toBe('')
      expect(store.assignment.assigned_pm).toBe('')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.availableUsers).toEqual([])
      expect(store.availableVendors).toEqual([])
    })
  })

  describe('Computed Properties', () => {
    it('should compute canSubmitInitiation correctly', () => {
      expect(store.canSubmitInitiation).toBe(false)
      
      store.initiation.name = 'Test Project'
      store.initiation.description = 'Test Description'
      
      expect(store.canSubmitInitiation).toBe(true)
    })

    it('should compute canSubmitAssignment correctly', () => {
      expect(store.canSubmitAssignment).toBe(false)
      
      store.assignment.assigned_pm = 'pm-user-id'
      
      expect(store.canSubmitAssignment).toBe(true)
    })

    it('should compute canSubmitFinalization correctly', () => {
      expect(store.canSubmitFinalization).toBe(false)
      
      store.overview.detailed_description = 'Detailed description'
      store.milestone1.title = 'Test Milestone'
      store.milestone1.planned_start = '2024-01-01'
      
      expect(store.canSubmitFinalization).toBe(true)
    })
  })

  describe('Actions', () => {
    describe('loadProject', () => {
      it('should load project successfully', async () => {
        const mockProject = {
          id: 'test-id',
          project_name: 'Test Project'
        }

        vi.mocked(ProjectWorkflowAPI.getWorkflowStatus).mockResolvedValue({
          id: 'test-id',
          workflow_status: 'initiated'
        })

        vi.mocked(ProjectWorkflowAPI.getProject).mockResolvedValue({
          project: mockProject
        })

        await store.loadProject('test-id')

        expect(store.project).toEqual({
          ...mockProject,
          workflow_status: 'initiated'
        })
        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
      })

      it('should handle load project error', async () => {
        vi.mocked(ProjectWorkflowAPI.getWorkflowStatus).mockResolvedValue({
          id: 'test-id',
          workflow_status: 'initiated'
        })

        vi.mocked(ProjectWorkflowAPI.getProject).mockRejectedValue(
          new Error('Failed to load project')
        )

        await store.loadProject('test-id')

        expect(store.error?.message).toBe('Failed to load project')
        expect(store.loading).toBe(false)
      })
    })

    describe('submitInitiation', () => {
      it('should submit initiation successfully', async () => {
        store.initiation.name = 'Test Project'
        store.initiation.description = 'Test Description'

        vi.mocked(ProjectWorkflowAPI.initiateProject).mockResolvedValue({
          success: true,
          project: { id: 'new-project-id' }
        })

        const result = await store.submitInitiation()

        expect(result).toBe('new-project-id')
        expect(ProjectWorkflowAPI.initiateProject).toHaveBeenCalledWith({
          name: 'Test Project',
          description: 'Test Description',
          estimated_budget: null,
          start_date: null,
          end_date: null,
          project_type: null,
          delivery_method: null,
          project_category: null,
          geographic_region: null
        })
      })

      it('should handle submit initiation error', async () => {
        store.initiation.name = 'Test Project'
        store.initiation.description = 'Test Description'

        vi.mocked(ProjectWorkflowAPI.initiateProject).mockRejectedValue(
          new Error('Failed to create project')
        )

        const result = await store.submitInitiation()

        expect(result).toBeNull()
        expect(store.error?.message).toBe('Failed to create project')
      })
    })

    describe('submitAssignment', () => {
      it('should submit assignment successfully', async () => {
        store.project = { id: 'test-project-id' } as any
        store.assignment.assigned_pm = 'pm-user-id'

        vi.mocked(ProjectWorkflowAPI.assignTeam).mockResolvedValue({
          success: true,
          project: {}
        })

        const result = await store.submitAssignment()

        expect(result).toBe(true)
        expect(ProjectWorkflowAPI.assignTeam).toHaveBeenCalledWith(
          'test-project-id',
          { assigned_pm: 'pm-user-id', assigned_spm: null }
        )
      })

      it('should handle submit assignment error', async () => {
        store.project = { id: 'test-project-id' } as any
        store.assignment.assigned_pm = 'pm-user-id'

        vi.mocked(ProjectWorkflowAPI.assignTeam).mockRejectedValue(
          new Error('Failed to assign team')
        )

        const result = await store.submitAssignment()

        expect(result).toBe(false)
        expect(store.error?.message).toBe('Failed to assign team')
      })
    })

    describe('submitFinalization', () => {
      it('should submit finalization successfully', async () => {
        store.project = { id: 'test-project-id' } as any
        store.overview.detailed_description = 'Detailed description'
        store.milestone1.title = 'Test Milestone'
        store.milestone1.planned_start = '2024-01-01'

        vi.mocked(ProjectWorkflowAPI.finalizeProject).mockResolvedValue({
          success: true,
          project: {}
        })

        const result = await store.submitFinalization()

        expect(result).toBe(true)
        expect(ProjectWorkflowAPI.finalizeProject).toHaveBeenCalledWith(
          'test-project-id',
          expect.objectContaining({
            detailed_description: 'Detailed description',
            budget_breakdown: {},
            vendors: [],
            risk_assessment: '',
            milestones: [
              {
                title: 'Test Milestone',
                type: null,
                planned_start: '2024-01-01',
                planned_finish: null
              }
            ]
          })
        )
      })

      it('should handle submit finalization error', async () => {
        store.project = { id: 'test-project-id' } as any
        store.overview.detailed_description = 'Detailed description'
        store.milestone1.title = 'Test Milestone'
        store.milestone1.planned_start = '2024-01-01'

        vi.mocked(ProjectWorkflowAPI.finalizeProject).mockRejectedValue(
          new Error('Failed to finalize project')
        )

        const result = await store.submitFinalization()

        expect(result).toBe(false)
        expect(store.error?.message).toBe('Failed to finalize project')
      })
    })

    describe('loadAvailableUsers', () => {
      it('should load available users successfully', async () => {
        const mockUsers = [
          { id: 'user-1', name: 'User 1', role: 'pm' },
          { id: 'user-2', name: 'User 2', role: 'spm' }
        ]

        vi.mocked(ProjectWorkflowAPI.getAvailableUsers).mockResolvedValue(mockUsers)

        await store.loadAvailableUsers(['pm', 'spm'])

        expect(store.availableUsers).toEqual(mockUsers)
        expect(ProjectWorkflowAPI.getAvailableUsers).toHaveBeenCalledWith(['pm', 'spm'])
      })
    })

    describe('loadAvailableVendors', () => {
      it('should load available vendors successfully', async () => {
        const mockVendors = [
          { id: 'vendor-1', name: 'Vendor 1', category: 'Construction' },
          { id: 'vendor-2', name: 'Vendor 2', category: 'Engineering' }
        ]

        vi.mocked(ProjectWorkflowAPI.getAvailableVendors).mockResolvedValue(mockVendors)

        await store.loadAvailableVendors()

        expect(store.availableVendors).toEqual(mockVendors)
      })
    })
  })

  describe.skip('State Management', () => {
    it('should reset state correctly', () => {
      // Set some state
      store.project.id = 'test-id'
      store.initiation.name = 'Test Project'
      store.error = 'Some error'

      // Reset
      store.resetState()

      expect(store.project).toEqual({})
      expect(store.initiation.name).toBe('')
      expect(store.error).toBe('')
    })

    it('should update initiation data correctly', () => {
      store.updateInitiation({
        name: 'Updated Project',
        description: 'Updated Description',
        estimated_budget: 100000
      })

      expect(store.initiation.name).toBe('Updated Project')
      expect(store.initiation.description).toBe('Updated Description')
      expect(store.initiation.estimated_budget).toBe(100000)
    })

    it('should update assignment data correctly', () => {
      store.updateAssignment({
        assigned_pm: 'pm-id',
        assigned_spm: 'spm-id'
      })

      expect(store.assignment.assigned_pm).toBe('pm-id')
      expect(store.assignment.assigned_spm).toBe('spm-id')
    })
  })

  describe.skip('Validation', () => {
    it('should validate initiation data', () => {
      const validation = store.validateInitiation()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(2) // name and description required

      store.initiation.name = 'Test Project'
      store.initiation.description = 'Test Description'

      const validValidation = store.validateInitiation()
      expect(validValidation.isValid).toBe(true)
      expect(validValidation.errors).toHaveLength(0)
    })

    it('should validate assignment data', () => {
      const validation = store.validateAssignment()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(1) // assigned_pm required

      store.assignment.assigned_pm = 'pm-id'

      const validValidation = store.validateAssignment()
      expect(validValidation.isValid).toBe(true)
      expect(validValidation.errors).toHaveLength(0)
    })

    it('should validate finalization data', () => {
      const validation = store.validateFinalization()
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)

      store.overview.detailed_description = 'Detailed description'
      store.milestone1.title = 'Test Milestone'
      store.milestone1.planned_start = '2024-01-01'

      const validValidation = store.validateFinalization()
      expect(validValidation.isValid).toBe(true)
      expect(validValidation.errors).toHaveLength(0)
    })
  })
})

