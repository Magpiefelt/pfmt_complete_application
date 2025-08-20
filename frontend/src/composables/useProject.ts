import { ref, type Ref } from 'vue'
// Use typed ProjectService implementation
import { ProjectService } from '@/services/ProjectService'

interface Project {
  id: string | number
  project_name?: string
  name?: string
  project_description?: string
  description?: string
  project_status?: string
  status?: string
  project_phase?: string
  phase?: string
  geographic_region?: string
  region?: string
  client_ministry_name?: string
  project_manager_name?: string
  projectManager?: string
  primary_contractor_name?: string
  contractor?: string
  total_approved_funding?: number
  totalBudget?: number
  amount_spent?: number
  amountSpent?: number
  created_at?: string
  updated_at?: string
  currentVersion?: {
    id: string
    total_approved_funding: number
    amount_spent: number
    project_phase: string
    report_status: string
    created_at: string
    status: string
  }
  primaryContractor?: {
    id: string
    contractor_id: string
    contractor_name: string
    is_primary: boolean
  }
  versions?: any[]
  [key: string]: any
}

interface UseProjectReturn {
  project: Ref<Project | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  loadProject: (id: string) => Promise<void>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  refreshProject: () => Promise<void>
}

// Global project cache to avoid unnecessary API calls
const projectCache = new Map<string, Project>()

export function useProject(): UseProjectReturn {
  const project = ref<Project | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentProjectId = ref<string | null>(null)

  const loadProject = async (id: string) => {
    if (!id) {
      error.value = 'Project ID is required'
      return
    }

    // Check cache first
    if (projectCache.has(id)) {
      project.value = projectCache.get(id)!
      currentProjectId.value = id
      return
    }

    try {
      loading.value = true
      error.value = null

      console.log('Loading project:', id)

      // Fetch project details using typed service
      const response = await ProjectService.getById(id)
      
      if (!response) {
        throw new Error('Project not found')
      }

      // Normalize project data
      const normalizedProject: Project = {
        ...response,
        // Ensure consistent field names
        name: response.project_name || response.name,
        description: response.project_description || response.description,
        status: response.project_status || response.status,
        phase: response.project_phase || response.phase,
        region: response.geographic_region || response.region,
        projectManager: response.project_manager_name || response.projectManager,
        contractor: response.primary_contractor_name || response.contractor,
        totalBudget: response.currentVersion?.total_approved_funding || response.total_approved_funding || response.totalBudget || 0,
        amountSpent: response.currentVersion?.amount_spent || response.amount_spent || response.amountSpent || 0
      }

      project.value = normalizedProject
      currentProjectId.value = id

      // Cache the project
      projectCache.set(id, normalizedProject)

      console.log('Project loaded successfully:', normalizedProject)

    } catch (err: any) {
      console.error('Error loading project:', err)
      error.value = err.message || 'Failed to load project'
      project.value = null
    } finally {
      loading.value = false
    }
  }

  const updateProject = async (id: string, data: Partial<Project>) => {
    try {
      loading.value = true
      error.value = null

      console.log('Updating project:', id, data)

      const response = await ProjectService.update(id, data)
      
      if (response) {
        // Update local project data
        if (project.value && project.value.id === id) {
          Object.assign(project.value, response)
        }

        // Update cache
        if (projectCache.has(id)) {
          const cachedProject = projectCache.get(id)!
          Object.assign(cachedProject, response)
        }

        console.log('Project updated successfully')
      }

    } catch (err: any) {
      console.error('Error updating project:', err)
      error.value = err.message || 'Failed to update project'
      throw err
    } finally {
      loading.value = false
    }
  }

  const refreshProject = async () => {
    if (currentProjectId.value) {
      // Clear cache for this project
      projectCache.delete(currentProjectId.value)
      await loadProject(currentProjectId.value)
    }
  }

  return {
    project,
    loading,
    error,
    loadProject,
    updateProject,
    refreshProject
  }
}

// Deprecated wrapper removed in favor of typed ProjectService implementation

