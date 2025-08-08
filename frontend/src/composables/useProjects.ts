import { computed, watch, onMounted, ref, toRef, isRef, type Ref } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useAuthStore } from '@/stores/auth'

export const useProjects = (filterParam: string | Ref<string> = 'all') => {
  const projectStore = useProjectStore()
  const authStore = useAuthStore()

  // Make filter reactive - handle both string and ref/computed inputs
  const filter = ref(isRef(filterParam) ? filterParam.value : filterParam)

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

  // Watch for filter changes from parent component
  if (isRef(filterParam)) {
    // If filterParam is reactive, watch its value
    watch(filterParam, (newFilter) => {
      filter.value = newFilter
    }, { immediate: true })
  } else {
    // If filterParam is a primitive, watch the primitive directly
    watch(() => filterParam, (newFilter) => {
      filter.value = newFilter
    }, { immediate: true })
  }

  // Set filter and fetch projects when filter changes
  watch(filter, (newFilter) => {
    // Immediately call projectStore.setFilter when filter changes
    projectStore.setFilter(newFilter)
  }, { immediate: true })

  // Fetch projects on mount
  onMounted(() => {
    projectStore.fetchProjects()
  })

  const refetch = async () => {
    try {
      await projectStore.fetchProjects()
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

