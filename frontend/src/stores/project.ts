import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ProjectAPI } from '@/services/apiService'
import { useAuthStore } from './auth'

export interface Project {
  id: number
  name: string
  status: string
  reportStatus?: string
  ownerId?: number
  createdByUserId?: number
  projectManager?: string
  [key: string]: any
}

export interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export const useProjectStore = defineStore('project', () => {
  // State
  const projects = ref<Project[]>([])
  const selectedProject = ref<Project | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filter = ref('all')
  
  // Pagination state
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalProjects = ref(0)
  const totalPages = ref(0)
  const hasNext = ref(false)
  const hasPrev = ref(false)

  // Getters
  const filteredProjects = computed(() => {
    // Since backend now handles all filtering properly, 
    // return projects as-is to avoid conflicts
    return projects.value
  })

  // Actions
  const setProjects = (newProjects: Project[]) => {
    projects.value = newProjects
  }

  const setSelectedProject = (project: Project | null) => {
    selectedProject.value = project
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const setFilter = (newFilter: string) => {
    const oldFilter = filter.value
    filter.value = newFilter
    
    // Reset state when filter changes
    if (oldFilter !== newFilter) {
      setProjects([]) // Clear previous projects
      setCurrentPage(1) // Reset to first page
      setError(null) // Clear any previous errors
      
      // Automatically refetch with new filter
      fetchProjects()
    }
  }

  const setCurrentPage = (page: number) => {
    currentPage.value = page
  }

  const setPageSize = (size: number) => {
    pageSize.value = size
    currentPage.value = 1 // Reset to first page when changing page size
    fetchProjects() // Refetch with new page size
  }

  const setPaginationData = (pagination: PaginationData) => {
    currentPage.value = pagination.page
    // Ensure pageSize is never zero - use fallback values
    const newPageSize = pagination.limit > 0 ? pagination.limit : (pageSize.value > 0 ? pageSize.value : 10)
    pageSize.value = newPageSize
    totalProjects.value = pagination.total
    totalPages.value = pagination.totalPages
    hasNext.value = pagination.hasNext
    hasPrev.value = pagination.hasPrev
  }

  const fetchProjects = async (options: any = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const authStore = useAuthStore()
      const currentUser = authStore.currentUser
      
      const apiOptions = {
        page: options.page || currentPage.value,
        limit: options.limit || pageSize.value,
        ...options
      }

      if (filter.value !== 'all') {
        switch (filter.value) {
          case 'active':
            // Map UI "active" to backend "underway" for project_status
            apiOptions.status = 'underway'
            break
          case 'completed':
            // Map UI "completed" to backend "complete" for project_status
            apiOptions.status = 'complete'
            break
          case 'pending':
            // Map UI "pending" to backend "update_required" for report_status
            apiOptions.reportStatus = 'update_required'
            break
          case 'my':
            // Use backend "mine" parameter instead of client-side filtering
            apiOptions.mine = 'true'
            break
        }
      }

      // Always include user context for proper role-based filtering
      if (currentUser) {
        apiOptions.userRole = currentUser.role
        
        // Role-based filtering logic
        switch (currentUser.role) {
          case 'Director':
            apiOptions.approvedOnly = false
            apiOptions.includePendingDrafts = true
            break
          case 'Senior Project Manager':
            apiOptions.approvedOnly = false
            apiOptions.includePendingDrafts = true
            break
          case 'Project Manager':
            apiOptions.approvedOnly = false
            apiOptions.includePendingDrafts = true
            break
          case 'Vendor':
            apiOptions.approvedOnly = true
            apiOptions.includePendingDrafts = false
            break
          default:
            apiOptions.approvedOnly = false
            apiOptions.includePendingDrafts = true
        }
      }

      // Include version information only if versioning is supported
      apiOptions.includeVersions = false

      const response = await ProjectAPI.getProjects(apiOptions)
      
      // Handle nested data structure from backend
      let projectsData = response.data?.projects || response.data || []
      
      // Normalize project data - map backend fields to frontend properties
      const normalizedProjects = projectsData.map((project: any) => ({
        ...project,
        // Ensure consistent field mapping
        name: project.name || project.projectName || project.project_name || '',
        status: project.workflow_status || project.status || project.projectStatus || project.project_status || '',
        phase: project.phase || project.projectPhase || project.project_phase || project.currentVersion?.projectPhase || '',
        region: project.region || project.geographicRegion || project.geographic_region || '',
        projectManager: project.projectManager || project.project_manager || project.modifiedByName || project.modified_by_name || currentUser?.name || '',
        startDate: project.startDate || project.createdAt || project.created_at || '',
        totalBudget: project.totalBudget || project.totalApprovedFunding || project.total_approved_funding || project.currentVersion?.totalApprovedFunding || 0,
        amountSpent: project.amountSpent || project.amount_spent || project.fundedToComplete || project.funded_to_complete || project.currentVersion?.amountSpent || 0,
        reportStatus: project.reportStatus || project.report_status || 'Current',
        // Keep original fields for backward compatibility
        ownerId: project.ownerId || project.owner_id || project.createdByUserId || project.created_by_user_id,
        createdByUserId: project.createdByUserId || project.created_by_user_id,
        modifiedBy: project.modifiedBy || project.modified_by
      }))

      // Use backend filtering for all cases
      setProjects(normalizedProjects)
      
      // Handle nested pagination structure
      const paginationData = response.data?.pagination || response.pagination
      if (paginationData) {
        setPaginationData({
          page: paginationData.currentPage || paginationData.page || currentPage.value,
          limit: paginationData.projectsPerPage || paginationData.limit || pageSize.value,
          total: paginationData.totalProjects || paginationData.total || normalizedProjects.length,
          totalPages: paginationData.totalPages || paginationData.pages || Math.ceil((paginationData.totalProjects || paginationData.total || normalizedProjects.length) / (paginationData.projectsPerPage || paginationData.limit || pageSize.value)),
          hasNext: paginationData.hasNextPage || paginationData.hasNext || false,
          hasPrev: paginationData.hasPrevPage || paginationData.hasPrev || false
        })
      } else {
        // Fallback pagination if not provided by backend
        setPaginationData({
          page: currentPage.value,
          limit: pageSize.value,
          total: normalizedProjects.length,
          totalPages: Math.ceil(normalizedProjects.length / pageSize.value),
          hasNext: false,
          hasPrev: false
        })
      }
    } catch (err: any) {
      console.error('❌ Project fetch error:', err)
      setError(err.message)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const goToNextPage = () => {
    if (hasNext.value) {
      const nextPage = currentPage.value + 1
      setCurrentPage(nextPage)
      fetchProjects({ page: nextPage })
    }
  }

  const goToPreviousPage = () => {
    if (hasPrev.value) {
      const prevPage = currentPage.value - 1
      setCurrentPage(prevPage)
      fetchProjects({ page: prevPage })
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      setCurrentPage(page)
      fetchProjects({ page })
    }
  }

  const updateProject = async (id: number, updates: Partial<Project>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await ProjectAPI.updateProject(id, updates)
      const updatedProject = response.data
      
      // Update projects list
      const updatedProjects = projects.value.map(project =>
        project.id === id ? updatedProject : project
      )
      setProjects(updatedProjects)
      
      // Update selected project if it's the one being updated
      if (selectedProject.value && selectedProject.value.id === id) {
        setSelectedProject(updatedProject)
      }
      
      return updatedProject
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addProject = async (projectData: Partial<Project>) => {
    // If projectData has an ID, it means the project was already created
    // (e.g., by the wizard), so we just need to refresh the list
    if (projectData.id) {
      console.log('Project already created, refreshing list...')
      
      // Add the project to the current list immediately for better UX
      const normalizedProject = {
        ...projectData,
        // Ensure consistent field mapping
        name: projectData.name || projectData.projectName || projectData.project_name || '',
        status: projectData.status || projectData.projectStatus || projectData.project_status || '',
        reportStatus: projectData.reportStatus || projectData.report_status || 'Current',
      } as Project
      
      // Add to beginning of list (most recent first)
      projects.value = [normalizedProject, ...projects.value]
      
      // Also refresh from server to ensure consistency
      await fetchProjects()
      return normalizedProject
    }
    
    // Otherwise, create a new project via API
    setLoading(true)
    setError(null)
    
    try {
      // Ensure user context is included in project creation
      const authStore = useAuthStore()
      const currentUser = authStore.currentUser
      
      const projectWithContext = {
        ...projectData
      }
      
      if (currentUser) {
        projectWithContext.ownerId = currentUser.id
        projectWithContext.createdByUserId = currentUser.id
        projectWithContext.projectManager = currentUser.name
      }
      
      const response = await ProjectAPI.createProject(projectWithContext)
      const newProject = response.data
      
      // Refresh the projects list to maintain proper pagination
      await fetchProjects()
      
      return newProject
    } catch (err: any) {
      console.error('❌ Project creation error:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeProject = async (id: number) => {
    setLoading(true)
    setError(null)
    
    try {
      await ProjectAPI.deleteProject(id)
      
      // Refresh the projects list
      await fetchProjects()
      
      // Clear selected project if it's the one being removed
      if (selectedProject.value && selectedProject.value.id === id) {
        setSelectedProject(null)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getProjectById = async (id: number) => {
    setLoading(true)
    setError(null)
    
    
    try {
      const response = await ProjectAPI.getProject(id)
      const project = response.data
      
      setSelectedProject(project)
      return project
    } catch (err: any) {
      console.error('❌ Project retrieval error:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const uploadExcelFile = async (projectId: number, file: File) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await ProjectAPI.uploadPFMTExcel(projectId, file)
      const updatedProject = response.data
      
      // Update the project in the list
      const updatedProjects = projects.value.map(project =>
        project.id === projectId ? updatedProject : project
      )
      setProjects(updatedProjects)
      
      // Update selected project if it's the one being updated
      if (selectedProject.value && selectedProject.value.id === projectId) {
        setSelectedProject(updatedProject)
      }
      
      return response
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    // State
    projects,
    selectedProject,
    loading,
    error,
    filter,
    currentPage,
    pageSize,
    totalProjects,
    totalPages,
    hasNext,
    hasPrev,
    
    // Getters
    filteredProjects,
    
    // Actions
    setProjects,
    setSelectedProject,
    setLoading,
    setError,
    setFilter,
    setCurrentPage,
    setPageSize,
    setPaginationData,
    fetchProjects,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    updateProject,
    addProject,
    removeProject,
    getProjectById,
    uploadExcelFile
  }
})

