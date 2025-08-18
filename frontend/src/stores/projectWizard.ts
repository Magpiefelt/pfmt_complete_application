/**
 * Project Wizard Store
 * Centralized state management for the project wizard workflow
 * Integrates with API service layer and auth store
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from './auth'
import { 
  ProjectWorkflowAPI, 
  type InitiationPayload, 
  type AssignmentPayload, 
  type FinalizationPayload,
  type ProjectSummary,
  type WorkflowStatusResponse
} from '@/services/projectWorkflowApi'

// Type definitions for wizard state
export interface WizardProject {
  id?: string
  workflow_status?: 'initiated' | 'assigned' | 'finalized' | 'active' | 'on_hold' | 'complete' | 'archived'
  created_by?: string
  assigned_pm?: string | null
  assigned_spm?: string | null
  assigned_by?: string | null
  finalized_by?: string | null
  finalized_at?: string | null
  project_name?: string
  project_description?: string
  estimated_budget?: number
  start_date?: string
  end_date?: string
  project_type?: string
  delivery_method?: string
  project_category?: string
  geographic_region?: string
  detailed_description?: string
  risk_assessment?: string
  budget_breakdown?: Record<string, any>
  created_at?: string
  updated_at?: string
  workflow_updated_at?: string
}

export interface WizardInitiation {
  name: string
  description: string
  estimated_budget?: number | null
  start_date?: string | null
  end_date?: string | null
  project_type?: string | null
  delivery_method?: string | null
  project_category?: string | null
  geographic_region?: string | null
}

export interface WizardAssignment {
  assigned_pm: string
  assigned_spm?: string | null
}

export interface WizardOverview {
  detailed_description?: string
  risk_assessment?: string
}

export interface WizardVendors {
  vendors: Array<{
    vendor_id: string
    role?: string
    notes?: string
  }>
}

export interface WizardBudget {
  budget_breakdown: Record<string, any>
}

export interface WizardMilestone {
  title: string
  type?: string | null
  planned_start: string
  planned_finish?: string | null
}

export interface WizardError {
  message: string
  code?: string
  details?: string
  field?: string
}

export interface WizardValidation {
  isValid: boolean
  errors: WizardError[]
  warnings: string[]
}

export const useProjectWizardStore = defineStore('projectWizard', () => {
  // Get auth store for user context
  const authStore = useAuthStore()

  // Core state
  const project = ref<WizardProject | null>(null)
  const loading = ref(false)
  const error = ref<WizardError | null>(null)
  const lastSavedAt = ref<string | null>(null)

  // Wizard step data
  const initiation = ref<WizardInitiation>({
    name: '',
    description: '',
    estimated_budget: null,
    start_date: null,
    end_date: null,
    project_type: null,
    delivery_method: null,
    project_category: null,
    geographic_region: null
  })

  const assignment = ref<WizardAssignment>({
    assigned_pm: '',
    assigned_spm: null
  })

  const overview = ref<WizardOverview>({
    detailed_description: '',
    risk_assessment: ''
  })

  const vendors = ref<WizardVendors>({
    vendors: []
  })

  const budget = ref<WizardBudget>({
    budget_breakdown: {}
  })

  const milestone1 = ref<WizardMilestone>({
    title: '',
    type: null,
    planned_start: '',
    planned_finish: null
  })

  // Dirty state tracking
  const dirty = ref(new Set<string>())
  const autoSaveEnabled = ref(true)
  const autoSaveInterval = ref<NodeJS.Timeout | null>(null)

  // Available users and vendors for dropdowns
  const availableUsers = ref<Array<{
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
  }>>([])

  const availableVendors = ref<Array<{
    id: string
    name: string
    category: string
    description?: string
    status: string
  }>>([])

  // Computed properties
  const hasUnsavedChanges = computed(() => dirty.value.size > 0)

  const currentStep = computed(() => {
    if (!project.value || !authStore.currentUser) return null
    
    return ProjectWorkflowAPI.getNextStepForUser(
      authStore.currentUser.role,
      project.value.workflow_status || '',
      project.value.assigned_pm,
      project.value.assigned_spm,
      authStore.currentUser.id.toString()
    )
  })

  const canUserAccessStep = computed(() => (step: string) => {
    if (!authStore.currentUser) return false
    
    const userRole = authStore.currentUser.role
    const projectStatus = project.value?.workflow_status || ''
    
    return ProjectWorkflowAPI.canUserPerformAction(
      userRole,
      step as 'initiate' | 'assign' | 'finalize',
      projectStatus
    )
  })

  const isInitiationValid = computed((): WizardValidation => {
    const errors: WizardError[] = []
    
    if (!initiation.value.name?.trim()) {
      errors.push({ message: 'Project name is required', field: 'name' })
    }
    
    if (!initiation.value.description?.trim()) {
      errors.push({ message: 'Project description is required', field: 'description' })
    }
    
    if (initiation.value.estimated_budget && initiation.value.estimated_budget <= 0) {
      errors.push({ message: 'Budget must be greater than 0', field: 'estimated_budget' })
    }
    
    if (initiation.value.start_date && initiation.value.end_date) {
      if (new Date(initiation.value.start_date) >= new Date(initiation.value.end_date)) {
        errors.push({ message: 'End date must be after start date', field: 'end_date' })
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  })

  const isAssignmentValid = computed((): WizardValidation => {
    const errors: WizardError[] = []
    
    if (!assignment.value.assigned_pm) {
      errors.push({ message: 'Project Manager is required', field: 'assigned_pm' })
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  })

  const isFinalizationValid = computed((): WizardValidation => {
    const errors: WizardError[] = []
    const warnings: string[] = []
    
    // Milestone validation
    if (!milestone1.value.title?.trim()) {
      errors.push({ message: 'First milestone title is required', field: 'milestone_title' })
    }
    
    if (!milestone1.value.planned_start) {
      errors.push({ message: 'Milestone start date is required', field: 'milestone_start' })
    }
    
    // Budget validation
    if (Object.keys(budget.value.budget_breakdown).length === 0) {
      warnings.push('Budget breakdown is recommended for better project tracking')
    }
    
    // Vendor validation
    if (vendors.value.vendors.length === 0) {
      warnings.push('Consider adding vendors for project execution')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  })

  // Actions
  const markDirty = (section: string) => {
    dirty.value.add(section)
    
    // Start auto-save timer if enabled
    if (autoSaveEnabled.value && !autoSaveInterval.value) {
      autoSaveInterval.value = setTimeout(() => {
        if (hasUnsavedChanges.value) {
          console.log('🔄 Auto-saving wizard state...')
          // Auto-save logic would go here
        }
      }, 30000) // 30 seconds
    }
  }

  const markClean = (section: string) => {
    dirty.value.delete(section)
    
    // Clear auto-save timer if no dirty sections
    if (dirty.value.size === 0 && autoSaveInterval.value) {
      clearTimeout(autoSaveInterval.value)
      autoSaveInterval.value = null
    }
  }

  const clearAllDirty = () => {
    dirty.value.clear()
    if (autoSaveInterval.value) {
      clearTimeout(autoSaveInterval.value)
      autoSaveInterval.value = null
    }
  }

  const loadProject = async (projectId: string) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('📋 Loading project for wizard:', projectId)
      
      // Get workflow status and full project details
      const [statusResponse, projectResponse] = await Promise.all([
        ProjectWorkflowAPI.getWorkflowStatus(projectId),
        ProjectWorkflowAPI.getProject(projectId)
      ])
      
      // Merge the responses
      const projectData = {
        ...projectResponse.project,
        ...statusResponse
      }
      
      project.value = projectData
      
      // Hydrate wizard sections from project data
      if (projectData.project_name) {
        initiation.value = {
          name: projectData.project_name || '',
          description: projectData.project_description || '',
          estimated_budget: projectData.estimated_budget || null,
          start_date: projectData.start_date || null,
          end_date: projectData.end_date || null,
          project_type: projectData.project_type || null,
          delivery_method: projectData.delivery_method || null,
          project_category: projectData.project_category || null,
          geographic_region: projectData.geographic_region || null
        }
      }
      
      if (projectData.assigned_pm || projectData.assigned_spm) {
        assignment.value = {
          assigned_pm: projectData.assigned_pm || '',
          assigned_spm: projectData.assigned_spm || null
        }
      }
      
      if (projectData.detailed_description || projectData.risk_assessment) {
        overview.value = {
          detailed_description: projectData.detailed_description || '',
          risk_assessment: projectData.risk_assessment || ''
        }
      }
      
      if (projectData.budget_breakdown) {
        budget.value = {
          budget_breakdown: projectData.budget_breakdown || {}
        }
      }
      
      // Clear dirty state after loading
      clearAllDirty()
      
      console.log('✅ Project loaded successfully:', projectData.workflow_status)
      
    } catch (err: any) {
      console.error('❌ Failed to load project:', err)
      error.value = {
        message: err.message || 'Failed to load project',
        code: 'LOAD_FAILED'
      }
    } finally {
      loading.value = false
    }
  }

  const submitInitiation = async (): Promise<string | null> => {
    if (!isInitiationValid.value.isValid) {
      error.value = {
        message: 'Please fix validation errors before submitting',
        code: 'VALIDATION_FAILED'
      }
      return null
    }
    
    loading.value = true
    error.value = null
    
    try {
      console.log('🚀 Submitting project initiation...')
      
      const response = await ProjectWorkflowAPI.initiateProject(initiation.value)
      
      if (response.success && response.project) {
        project.value = response.project
        lastSavedAt.value = new Date().toISOString()
        markClean('initiation')
        
        console.log('✅ Project initiated successfully:', response.project.id)
        return response.project.id!
      } else {
        throw new Error(response.error?.message || 'Failed to initiate project')
      }
      
    } catch (err: any) {
      console.error('❌ Project initiation failed:', err)
      error.value = {
        message: err.message || 'Failed to initiate project',
        code: 'INITIATION_FAILED'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  const submitAssignment = async (): Promise<boolean> => {
    if (!project.value?.id || !isAssignmentValid.value.isValid) {
      error.value = {
        message: 'Project not loaded or validation errors present',
        code: 'VALIDATION_FAILED'
      }
      return false
    }
    
    loading.value = true
    error.value = null
    
    try {
      console.log('👥 Submitting team assignment...')
      
      const response = await ProjectWorkflowAPI.assignTeam(project.value.id, assignment.value)
      
      if (response.success && response.project) {
        project.value = response.project
        lastSavedAt.value = new Date().toISOString()
        markClean('assignment')
        
        console.log('✅ Team assigned successfully')
        return true
      } else {
        throw new Error(response.error?.message || 'Failed to assign team')
      }
      
    } catch (err: any) {
      console.error('❌ Team assignment failed:', err)
      error.value = {
        message: err.message || 'Failed to assign team',
        code: 'ASSIGNMENT_FAILED'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  const submitFinalization = async (): Promise<boolean> => {
    if (!project.value?.id || !isFinalizationValid.value.isValid) {
      error.value = {
        message: 'Project not loaded or validation errors present',
        code: 'VALIDATION_FAILED'
      }
      return false
    }
    
    loading.value = true
    error.value = null
    
    try {
      console.log('🏁 Submitting project finalization...')
      
      const finalizationPayload: FinalizationPayload = {
        vendors: vendors.value.vendors,
        budget_breakdown: budget.value.budget_breakdown,
        detailed_description: overview.value.detailed_description || '',
        risk_assessment: overview.value.risk_assessment || '',
        milestones: [{
          title: milestone1.value.title,
          type: milestone1.value.type,
          planned_start: milestone1.value.planned_start,
          planned_finish: milestone1.value.planned_finish
        }]
      }
      
      const response = await ProjectWorkflowAPI.finalizeProject(project.value.id, finalizationPayload)
      
      if (response.success && response.project) {
        project.value = response.project
        lastSavedAt.value = new Date().toISOString()
        clearAllDirty()
        
        console.log('✅ Project finalized successfully')
        return true
      } else {
        throw new Error(response.error?.message || 'Failed to finalize project')
      }
      
    } catch (err: any) {
      console.error('❌ Project finalization failed:', err)
      error.value = {
        message: err.message || 'Failed to finalize project',
        code: 'FINALIZATION_FAILED'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  const loadAvailableUsers = async (roles: string[] = ['pm', 'spm']) => {
    try {
      console.log('👤 Loading available users for roles:', roles)
      
      const users = await ProjectWorkflowAPI.getAvailableUsers(roles)
      availableUsers.value = users
      
      console.log('✅ Available users loaded:', users.length)
      
    } catch (err: any) {
      console.error('❌ Failed to load available users:', err)
      // Use fallback users from auth store
      const authUsers = authStore.users.filter(u => 
        roles.includes(u.role) && u.is_active !== false
      )
      availableUsers.value = authUsers.map(u => ({
        id: u.id.toString(),
        first_name: u.first_name || u.name.split(' ')[0] || '',
        last_name: u.last_name || u.name.split(' ')[1] || '',
        email: u.email || '',
        role: u.role
      }))
    }
  }

  const loadAvailableVendors = async () => {
    try {
      console.log('🏢 Loading available vendors...')
      
      const vendorList = await ProjectWorkflowAPI.getAvailableVendors()
      availableVendors.value = vendorList
      
      console.log('✅ Available vendors loaded:', vendorList.length)
      
    } catch (err: any) {
      console.error('❌ Failed to load available vendors:', err)
      // Provide fallback vendors
      availableVendors.value = [
        { id: '1', name: 'Alberta Construction Corp', category: 'Construction', status: 'active' },
        { id: '2', name: 'Prairie Design Studio', category: 'Design', status: 'active' },
        { id: '3', name: 'Northern Supply Corp', category: 'Supply', status: 'active' }
      ]
    }
  }

  const resetWizard = () => {
    console.log('🔄 Resetting wizard state...')
    
    project.value = null
    error.value = null
    lastSavedAt.value = null
    
    // Reset all step data
    initiation.value = {
      name: '',
      description: '',
      estimated_budget: null,
      start_date: null,
      end_date: null,
      project_type: null,
      delivery_method: null,
      project_category: null,
      geographic_region: null
    }
    
    assignment.value = {
      assigned_pm: '',
      assigned_spm: null
    }
    
    overview.value = {
      detailed_description: '',
      risk_assessment: ''
    }
    
    vendors.value = {
      vendors: []
    }
    
    budget.value = {
      budget_breakdown: {}
    }
    
    milestone1.value = {
      title: '',
      type: null,
      planned_start: '',
      planned_finish: null
    }
    
    clearAllDirty()
  }

  const clearError = () => {
    error.value = null
  }

  // Watch for changes to mark sections dirty
  watch(initiation, () => markDirty('initiation'), { deep: true })
  watch(assignment, () => markDirty('assignment'), { deep: true })
  watch(overview, () => markDirty('overview'), { deep: true })
  watch(vendors, () => markDirty('vendors'), { deep: true })
  watch(budget, () => markDirty('budget'), { deep: true })
  watch(milestone1, () => markDirty('milestone1'), { deep: true })

  return {
    // State
    project,
    loading,
    error,
    lastSavedAt,
    initiation,
    assignment,
    overview,
    vendors,
    budget,
    milestone1,
    dirty,
    autoSaveEnabled,
    availableUsers,
    availableVendors,
    
    // Computed
    hasUnsavedChanges,
    currentStep,
    canUserAccessStep,
    isInitiationValid,
    isAssignmentValid,
    isFinalizationValid,
    
    // Actions
    markDirty,
    markClean,
    clearAllDirty,
    loadProject,
    submitInitiation,
    submitAssignment,
    submitFinalization,
    loadAvailableUsers,
    loadAvailableVendors,
    resetWizard,
    clearError
  }
})

