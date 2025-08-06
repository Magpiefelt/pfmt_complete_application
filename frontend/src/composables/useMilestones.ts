// Milestone Management Composable for PFMT Application
// Provides reactive state management and API integration for milestone tracking with versioning

import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { ProjectMilestones, MilestoneData } from '@/types/milestones'
import { createDefaultProjectMilestones, validateMilestoneData } from '@/types/milestones'

export function useMilestones() {
  const authStore = useAuthStore()
  
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const milestones = ref<ProjectMilestones>(createDefaultProjectMilestones())
  const hasUnsavedChanges = ref(false)
  
  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const currentUser = authStore.currentUser
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (currentUser) {
      headers['X-User-Id'] = currentUser.id.toString()
      headers['X-User-Role'] = currentUser.role
      headers['X-User-Name'] = currentUser.name
    }
    
    return headers
  }
  
  // Load milestones from project version data
  const loadMilestones = async (projectId: string, versionId?: number) => {
    loading.value = true
    error.value = null
    
    try {
      // If versionId is provided, load from specific version
      // Otherwise, load from current project data
      const endpoint = versionId 
        ? `http://localhost:3002/api/phase2/projects/${projectId}/versions/${versionId}`
        : `http://localhost:3002/api/projects/${projectId}`
      
      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to load milestones')
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        // Extract milestones from version_data or project data
        let milestoneData: ProjectMilestones = createDefaultProjectMilestones()
        
        if (versionId && result.data.version_data?.milestones) {
          milestoneData = result.data.version_data.milestones
        } else if (result.data.project?.milestones) {
          milestoneData = result.data.project.milestones
        } else if (result.data.milestones) {
          milestoneData = result.data.milestones
        }
        
        milestones.value = milestoneData
        hasUnsavedChanges.value = false
        
        return milestoneData
      }
      
      // If no milestone data found, use defaults
      milestones.value = createDefaultProjectMilestones()
      return milestones.value
      
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to load milestones:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Save milestones to draft version
  const saveMilestones = async (projectId: string, milestoneData: ProjectMilestones) => {
    loading.value = true
    error.value = null
    
    try {
      // Validate milestone data before saving
      const validationErrors: string[] = []
      Object.entries(milestoneData).forEach(([milestoneId, data]) => {
        const errors = validateMilestoneData(data)
        errors.forEach(error => {
          validationErrors.push(`${milestoneId}: ${error}`)
        })
      })
      
      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join(', ')}`)
      }
      
      // First, check if there's a draft version
      const versionsResponse = await fetch(`http://localhost:3002/api/phase2/projects/${projectId}/versions`, {
        headers: getAuthHeaders()
      })
      
      if (!versionsResponse.ok) {
        throw new Error('Failed to check project versions')
      }
      
      const versionsResult = await versionsResponse.json()
      let draftVersion = null
      
      if (versionsResult.success && versionsResult.data) {
        draftVersion = versionsResult.data.find((v: any) => v.status === 'Draft')
      }
      
      // If no draft version exists, create one
      if (!draftVersion) {
        const createDraftResponse = await fetch(`http://localhost:3002/api/phase2/projects/${projectId}/versions`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            versionNumber: (versionsResult.data?.length || 0) + 1,
            dataSnapshot: {},
            changeSummary: 'Created draft for milestone updates'
          })
        })
        
        if (!createDraftResponse.ok) {
          throw new Error('Failed to create draft version')
        }
        
        const createResult = await createDraftResponse.json()
        draftVersion = createResult.data
      }
      
      // Update the draft version with milestone data
      const updateResponse = await fetch(`http://localhost:3002/api/phase2/${projectId}/versions/${draftVersion.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          version_data: {
            ...draftVersion.version_data,
            milestones: milestoneData
          },
          changeSummary: 'Updated project milestones'
        })
      })
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || 'Failed to save milestones')
      }
      
      const result = await updateResponse.json()
      
      // Update local state
      milestones.value = milestoneData
      hasUnsavedChanges.value = false
      
      return result.data
      
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to save milestones:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Update milestone data locally
  const updateMilestone = (milestoneId: string, data: Partial<MilestoneData>) => {
    if (milestones.value[milestoneId]) {
      milestones.value[milestoneId] = {
        ...milestones.value[milestoneId],
        ...data
      }
      hasUnsavedChanges.value = true
    }
  }
  
  // Update multiple milestones
  const updateMilestones = (updates: Partial<ProjectMilestones>) => {
    Object.entries(updates).forEach(([milestoneId, data]) => {
      if (data) {
        milestones.value[milestoneId] = {
          ...milestones.value[milestoneId],
          ...data
        }
      }
    })
    hasUnsavedChanges.value = true
  }
  
  // Reset milestone data to defaults
  const resetMilestones = () => {
    milestones.value = createDefaultProjectMilestones()
    hasUnsavedChanges.value = false
  }
  
  // Get milestone statistics
  const getMilestoneStats = () => {
    const stats = {
      total: 0,
      completed: 0,
      planned: 0,
      overdue: 0,
      notApplicable: 0,
      notStarted: 0
    }
    
    Object.values(milestones.value).forEach(milestone => {
      stats.total++
      
      if (milestone.is_na) {
        stats.notApplicable++
      } else if (milestone.actual_date) {
        stats.completed++
      } else if (milestone.planned_date) {
        const plannedDate = new Date(milestone.planned_date)
        const today = new Date()
        if (today > plannedDate) {
          stats.overdue++
        } else {
          stats.planned++
        }
      } else {
        stats.notStarted++
      }
    })
    
    return stats
  }
  
  // Validate all milestones
  const validateAllMilestones = () => {
    const errors: string[] = []
    
    Object.entries(milestones.value).forEach(([milestoneId, data]) => {
      const milestoneErrors = validateMilestoneData(data)
      milestoneErrors.forEach(error => {
        errors.push(`${milestoneId}: ${error}`)
      })
    })
    
    return errors
  }
  
  // Check if milestone data has changed
  const hasChanges = computed(() => hasUnsavedChanges.value)
  
  return {
    // State
    milestones,
    loading,
    error,
    hasChanges,
    
    // Methods
    loadMilestones,
    saveMilestones,
    updateMilestone,
    updateMilestones,
    resetMilestones,
    getMilestoneStats,
    validateAllMilestones
  }
}

