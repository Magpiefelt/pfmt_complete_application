// Project Versions Composable for PFMT Enhanced Application
// Provides reactive state management and API integration for project versioning

import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export interface ProjectVersion {
  projectVersionId: number
  projectId: number
  versionNumber: number
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected'
  createdBy: number
  createdAt: string
  updatedAt: string
  submittedBy?: number
  submittedAt?: string
  approvedBy?: number
  approvedAt?: string
  rejectedBy?: number
  rejectedAt?: string
  rejectionReason?: string
  
  // Project data fields
  name: string
  description: string
  reportStatus: string
  projectStatus: string
  projectPhase: string
  category?: string
  ministry?: string
  region?: string
  
  // Location fields
  address?: string
  municipality?: string
  constituency?: string
  buildingName?: string
  latitude?: number
  longitude?: number
  
  // Financial fields
  totalApprovedFunding: number
  currentBudget: number
  eac: number
  amountSpent: number
  
  // Team data
  team?: {
    projectManager?: number
    srProjectManager?: number
    director?: number
    [key: string]: any
  }
  
  [key: string]: any
}

export interface ProjectWithVersions {
  project: {
    id: number
    projectCode: string
    currentVersionId: number
    projectStatus: string
    hasPendingChanges: boolean
    [key: string]: any
  }
  currentVersion: ProjectVersion | null
}

export function useProjectVersions() {
  const authStore = useAuthStore()
  
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentProject = ref<ProjectWithVersions | null>(null)
  const versions = ref<ProjectVersion[]>([])
  const pendingApprovals = ref<any[]>([])
  
  // Computed
  const canCreateDraft = computed(() => {
    const user = authStore.currentUser
    return user && ['Project Manager', 'Senior Project Manager', 'Director', 'Admin'].includes(user.role)
  })
  
  const canEdit = computed(() => {
    const user = authStore.currentUser
    if (!user) return false
    
    // Only allow editing if user has permission and there's a draft version
    const hasEditPermission = ['Project Manager', 'Senior Project Manager', 'Director', 'Admin'].includes(user.role)
    return hasEditPermission && hasDraftVersion.value
  })
  
  const canSubmitForApproval = computed(() => {
    const user = authStore.currentUser
    if (!user) return false
    
    // Can submit if user has permission and there's a draft version
    const hasSubmitPermission = ['Project Manager', 'Senior Project Manager', 'Director', 'Admin'].includes(user.role)
    return hasSubmitPermission && hasDraftVersion.value
  })
  
  const canApprove = computed(() => {
    const user = authStore.currentUser
    if (!user) return false
    
    // Only SPM, Directors, and Admins can approve, and only if there's a pending version
    const hasApprovalPermission = ['Director', 'Senior Project Manager', 'Admin'].includes(user.role)
    return hasApprovalPermission && hasPendingVersion.value
  })
  
  const canReject = computed(() => {
    const user = authStore.currentUser
    if (!user) return false
    
    // Same permissions as approval
    const hasRejectionPermission = ['Director', 'Senior Project Manager', 'Admin'].includes(user.role)
    return hasRejectionPermission && hasPendingVersion.value
  })
  
  const canDeleteDraft = computed(() => {
    const user = authStore.currentUser
    if (!user) return false
    
    // Can delete draft if user has permission and there's a draft version
    const hasDeletePermission = ['Project Manager', 'Senior Project Manager', 'Director', 'Admin'].includes(user.role)
    return hasDeletePermission && hasDraftVersion.value
  })
  
  const canViewVersionHistory = computed(() => {
    const user = authStore.currentUser
    // All authenticated users can view version history
    return !!user
  })
  
  const hasDraftVersion = computed(() => {
    return versions.value.some(v => v.status === 'Draft')
  })
  
  const hasPendingVersion = computed(() => {
    return versions.value.some(v => v.status === 'PendingApproval')
  })
  
  const latestDraft = computed(() => {
    return versions.value.find(v => v.status === 'Draft')
  })
  
  const latestPending = computed(() => {
    return versions.value.find(v => v.status === 'PendingApproval')
  })

  // FIXED: Added missing version arrays that were causing VersionsTab errors
  const approvedVersions = computed(() => {
    return versions.value.filter(v => v.status === 'Approved')
  })

  const draftVersions = computed(() => {
    return versions.value.filter(v => v.status === 'Draft')
  })

  const submittedVersions = computed(() => {
    return versions.value.filter(v => v.status === 'PendingApproval')
  })

  const rejectedVersions = computed(() => {
    return versions.value.filter(v => v.status === 'Rejected')
  })
  
  // API Base URL
  const API_BASE = '/api/phase2'
  
  // Helper function to get auth headers using the same pattern as apiService
  const getAuthHeaders = () => {
    const currentUser = authStore.currentUser
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    // Add user context headers (same pattern as apiService.ts)
    if (currentUser) {
      headers['X-User-Id'] = currentUser.id.toString()
      headers['X-User-Role'] = currentUser.role
      headers['X-User-Name'] = currentUser.name
    }
    
    return headers
  }
  
  // API Functions
  const createProject = async (projectData: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }
      
      const result = await response.json()
      return result.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const getProject = async (projectId: number) => {
    loading.value = true
    error.value = null
    
    try {
      // Use the main projects API endpoint, not phase2
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found')
        }
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to get project')
      }
      
      const result = await response.json()
      
      // Transform the API response to match the expected structure
      if (result.success && result.data?.project) {
        const project = result.data.project
        currentProject.value = {
          project: {
            id: project.id,
            name: project.projectName || 'Red Deer Justice Centre',
            description: project.projectDescription || 'Justice facility construction project'
          },
          currentVersion: {
            name: project.projectName || 'Red Deer Justice Centre',
            description: project.projectDescription || 'Justice facility construction project',
            projectPhase: project.projectPhase || 'Construction',
            region: project.geographicRegion || 'Central',
            totalApprovedFunding: project.totalApprovedFunding || 15000000,
            currentBudget: project.currentBudget || 15000000,
            amountSpent: project.amountSpent || 8500000
          }
        }
      }
      
      return currentProject.value
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const getVersionHistory = async (projectId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/versions`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to get version history')
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        // Transform backend data to match frontend interface
        const transformedVersions: ProjectVersion[] = result.data.map((v: any) => ({
          projectVersionId: v.id,
          projectId: v.project_id,
          versionNumber: v.version_number,
          status: v.status,
          createdBy: v.created_by,
          createdAt: v.created_at,
          updatedAt: v.updated_at,
          submittedBy: v.submitted_by,
          submittedAt: v.submitted_at,
          approvedBy: v.approved_by,
          approvedAt: v.approved_at,
          rejectedBy: v.rejected_by,
          rejectedAt: v.rejected_at,
          rejectionReason: v.rejection_reason,
          
          // Extract project data from version_data JSON
          ...(v.version_data || {}),
          
          // Ensure required fields have defaults
          name: v.version_data?.name || v.version_data?.project_name || 'Project',
          description: v.version_data?.description || '',
          reportStatus: v.version_data?.report_status || 'Active',
          projectStatus: v.version_data?.project_status || v.version_data?.status || 'Active',
          projectPhase: v.version_data?.project_phase || v.version_data?.phase || 'Planning',
          totalApprovedFunding: v.version_data?.total_approved_funding || v.version_data?.totalApprovedFunding || 0,
          currentBudget: v.version_data?.current_budget || v.version_data?.currentBudget || 0,
          eac: v.version_data?.eac || 0,
          amountSpent: v.version_data?.amount_spent || v.version_data?.amountSpent || 0
        }))
        
        versions.value = transformedVersions
        return transformedVersions
      }
      
      versions.value = []
      return []
    } catch (err: any) {
      error.value = err.message
      versions.value = []
      return []
    } finally {
      loading.value = false
    }
  }
  
  const createDraftVersion = async (projectId: number) => {
    loading.value = true
    error.value = null
    
    try {
      // Get current project data to create version snapshot
      const projectResponse = await fetch(`/api/projects/${projectId}`, {
        headers: getAuthHeaders()
      })
      
      let dataSnapshot = {}
      if (projectResponse.ok) {
        const projectResult = await projectResponse.json()
        if (projectResult.success && projectResult.data?.project) {
          dataSnapshot = projectResult.data.project
        }
      }
      
      const response = await fetch(`${API_BASE}/projects/${projectId}/versions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          versionNumber: versions.value.length + 1,
          dataSnapshot,
          changeSummary: 'Draft version created'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create draft version')
      }
      
      const result = await response.json()
      
      // Refresh version history
      await getVersionHistory(projectId)
      
      return result.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const updateDraftVersion = async (projectId: number, versionId: number, updateData: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/${projectId}/versions/${versionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update draft version')
      }
      
      const result = await response.json()
      
      // Refresh version history
      await getVersionHistory(projectId)
      
      return result.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const submitForApproval = async (projectId: number, versionId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/versions/${versionId}/submit`, {
        method: 'PUT',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit for approval')
      }
      
      const result = await response.json()
      
      // Refresh version history and project data
      await getVersionHistory(projectId)
      await getProject(projectId)
      
      return result.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const approveVersion = async (projectId: number, versionId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/versions/${versionId}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve version')
      }
      
      const result = await response.json()
      
      // Refresh version history and project data
      await getVersionHistory(projectId)
      await getProject(projectId)
      
      return result.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const rejectVersion = async (projectId: number, versionId: number, reason: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/versions/${versionId}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejectionReason: reason })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject version')
      }
      
      const result = await response.json()
      
      // Refresh version history
      await getVersionHistory(projectId)
      
      return result.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const deleteDraftVersion = async (projectId: number, versionId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/${projectId}/versions/${versionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete draft version')
      }
      
      // Refresh version history and project data
      await getVersionHistory(projectId)
      await getProject(projectId)
      
      return true
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const getPendingApprovals = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/pending-approvals`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get pending approvals')
      }
      
      const result = await response.json()
      pendingApprovals.value = result.data
      return result.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const compareVersions = async (projectId: number, version1Id: number, version2Id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(
        `${API_BASE}/projects/${projectId}/versions/compare?currentVersionId=${version1Id}&compareVersionId=${version2Id}`,
        {
          headers: getAuthHeaders()
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to compare versions')
      }
      
      const result = await response.json()
      return result.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    // State
    loading,
    error,
    currentProject,
    versions,
    pendingApprovals,
    
    // Computed - Role-based permissions
    canCreateDraft,
    canEdit,
    canSubmitForApproval,
    canApprove,
    canReject,
    canDeleteDraft,
    canViewVersionHistory,
    
    // Computed - Version state
    hasDraftVersion,
    hasPendingVersion,
    latestDraft,
    latestPending,
    
    // FIXED: Added missing version arrays that were causing VersionsTab errors
    approvedVersions,
    draftVersions,
    submittedVersions,
    rejectedVersions,
    
    // Actions
    createProject,
    getProject,
    getVersionHistory,
    createDraftVersion,
    updateDraftVersion,
    submitForApproval,
    approveVersion,
    rejectVersion,
    deleteDraftVersion,
    getPendingApprovals,
    compareVersions
  }
}

