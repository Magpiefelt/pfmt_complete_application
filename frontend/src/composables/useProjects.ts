import { computed, watch, onMounted } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useAuthStore } from '@/stores/auth'

export const useProjects = (filter = 'all') => {
  const projectStore = useProjectStore()
  const authStore = useAuthStore()

  // Computed properties from store
  const projects = computed(() => projectStore.filteredProjects)
  const loading = computed(() => projectStore.loading)
  const error = computed(() => projectStore.error)

  const pagination = computed(() => ({
    currentPage: projectStore.currentPage,
    pageSize: projectStore.pageSize,
    totalProjects: projectStore.totalProjects,
    totalPages: projectStore.totalPages,
    hasNext: projectStore.hasNext,
    hasPrev: projectStore.hasPrev,
    goToNextPage: projectStore.goToNextPage,
    goToPreviousPage: projectStore.goToPreviousPage,
    goToPage: projectStore.goToPage,
    setPageSize: projectStore.setPageSize
  }))

  // Set filter and fetch projects when filter changes
  watch(() => filter, (newFilter) => {
    projectStore.setFilter(newFilter)
    projectStore.fetchProjects()
  }, { immediate: true })

  // Fetch projects on mount
  onMounted(() => {
    console.log('useProjects mounted, fetching projects')
    projectStore.fetchProjects()
  })

  const refetch = async () => {
    try {
      await projectStore.fetchProjects()
      console.log('✅ Projects refetched successfully')
    } catch (error) {
      console.error('❌ Failed to refetch projects:', error)
      throw error
    }
  }

  const updateProject = async (id: number, updates: any) => {
    return await projectStore.updateProject(id, updates)
  }

  const addProject = async (projectData: any) => {
    return await projectStore.addProject(projectData)
  }

  const removeProject = async (id: number) => {
    return await projectStore.removeProject(id)
  }

  return {
    projects,
    loading,
    error,
    pagination,
    refetch,
    updateProject,
    addProject,
    removeProject
  }
}

