import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
    const authStore = useAuthStore()
    return authStore.getAccessibleProjects(projects.value)
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
    filter.value = newFilter
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
    pageSize.value = pagination.limit
    totalProjects.value = pagination.total
    totalPages.value = pagination.totalPages
    hasNext.value = pagination.hasNext
    hasPrev.value = pagination.hasPrev
  }

  const fetchProjects = async (options: any = {}) => {
    setLoading(true)
    setError(null)
    
    
    try {
      const apiOptions = {
        page: options.page || currentPage.value,
        limit: options.limit || pageSize.value,
        ...options
      }

      // Enhanced filter handling with user context
      if (filter.value !== 'all') {
        switch (filter.value) {
          case 'active':
            apiOptions.status = 'Active'
            break
          case 'completed':
            apiOptions.status = 'Completed'
            break
          case 'pending':
            apiOptions.reportStatus = 'Update Required'
            break
          case 'my':
            // Better user context retrieval
            const authStore = useAuthStore()
            const currentUser = authStore.currentUser
            if (currentUser) {
              apiOptions.ownerId = currentUser.id
              apiOptions.userId = currentUser.id
              apiOptions.userRole = currentUser.role
            }
            break
        }
      }

      // Always include user context for proper role-based filtering
      const authStore = useAuthStore()
      const currentUser = authStore.currentUser
      if (currentUser && !apiOptions.userId) {
        apiOptions.userId = currentUser.id
        apiOptions.userRole = currentUser.role
        
        // For directors, ensure only approved project data is shown
        if (currentUser.role === 'Director') {
          apiOptions.approvedOnly = true
          apiOptions.includePendingDrafts = true // Include pending draft indicators
        }
      }

      // Include version information for all requests
      apiOptions.includeVersions = true

      const response = await ProjectAPI.getProjects(apiOptions)
      
      // Handle nested data structure from backend
      const projectsData = response.data?.projects || response.data || []
      
      setProjects(projectsData)
      
      // Handle nested pagination structure
      const paginationData = response.data?.pagination || response.pagination
      if (paginationData) {
        setPaginationData({
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          totalPages: paginationData.pages || paginationData.totalPages || Math.ceil(paginationData.total / paginationData.limit),
          hasNext: paginationData.page < (paginationData.pages || paginationData.totalPages || Math.ceil(paginationData.total / paginationData.limit)),
          hasPrev: paginationData.page > 1
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

