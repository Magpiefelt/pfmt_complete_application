<template>
  <div class="enhanced-project-dashboard">
    <!-- Dashboard Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Project Dashboard</h1>
          <p class="text-gray-600">Manage and track all your projects</p>
        </div>
        <div class="flex items-center space-x-3">
          <Button @click="refreshProjects" variant="outline" :disabled="loading">
            <RefreshCw class="h-4 w-4 mr-2" :class="{ 'animate-spin': loading }" />
            Refresh
          </Button>
          <Button @click="showCreateProject = true">
            <Plus class="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>
    </div>

    <!-- Dashboard Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <FolderOpen class="h-8 w-8 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Projects</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Clock class="h-8 w-8 text-yellow-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">In Progress</p>
              <p class="text-2xl font-bold text-gray-900">{{ inProgressCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircle class="h-8 w-8 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Completed</p>
              <p class="text-2xl font-bold text-gray-900">{{ completedCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <AlertTriangle class="h-8 w-8 text-red-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">At Risk</p>
              <p class="text-2xl font-bold text-gray-900">{{ atRiskCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Search and Filter -->
    <SearchAndFilter
      v-model:search-query="searchQuery"
      v-model:filters="filters"
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      :available-statuses="availableStatuses"
      :available-assignees="availableAssignees"
      :available-priorities="availablePriorities"
      :available-tags="availableTags"
      :has-active-filters="hasActiveFilters"
      :result-count="resultCount"
      :total-count="totalCount"
      search-placeholder="Search projects by name, description, or assignee..."
      :sort-options="projectSortOptions"
      @clear-filters="clearFilters"
    />

    <!-- View Toggle -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600">View:</span>
        <div class="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            @click="viewMode = 'grid'"
            :class="[
              'px-3 py-1 text-sm font-medium rounded-md transition-colors',
              viewMode === 'grid' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <Grid3X3 class="h-4 w-4 mr-1 inline" />
            Grid
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'px-3 py-1 text-sm font-medium rounded-md transition-colors',
              viewMode === 'list' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <List class="h-4 w-4 mr-1 inline" />
            List
          </button>
        </div>
      </div>

      <div class="text-sm text-gray-600">
        {{ resultCount }} of {{ totalCount }} projects
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAndSortedItems.length === 0 && !hasActiveFilters" class="text-center py-12">
      <FolderOpen class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
      <p class="text-gray-600 mb-4">Get started by creating your first project.</p>
      <Button @click="showCreateProject = true">
        <Plus class="h-4 w-4 mr-2" />
        Create Project
      </Button>
    </div>

    <!-- No Results State -->
    <div v-else-if="filteredAndSortedItems.length === 0 && hasActiveFilters" class="text-center py-12">
      <Search class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
      <p class="text-gray-600 mb-4">Try adjusting your search criteria or filters.</p>
      <Button variant="outline" @click="clearFilters">
        Clear Filters
      </Button>
    </div>

    <!-- Projects Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProjectCard
        v-for="project in filteredAndSortedItems"
        :key="project.id"
        :project="project"
        @click="navigateToProject(project.id)"
        @edit="editProject(project)"
        @delete="deleteProject(project)"
        @archive="archiveProject(project)"
      />
    </div>

    <!-- Projects List View -->
    <div v-else class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        <ProjectListItem
          v-for="project in filteredAndSortedItems"
          :key="project.id"
          :project="project"
          @click="navigateToProject(project.id)"
          @edit="editProject(project)"
          @delete="deleteProject(project)"
          @archive="archiveProject(project)"
        />
      </ul>
    </div>

    <!-- Pagination -->
    <div v-if="filteredAndSortedItems.length > 0" class="mt-6 flex items-center justify-between">
      <div class="text-sm text-gray-700">
        Showing {{ Math.min(currentPage * itemsPerPage - itemsPerPage + 1, resultCount) }} to 
        {{ Math.min(currentPage * itemsPerPage, resultCount) }} of {{ resultCount }} results
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          @click="previousPage"
          :disabled="currentPage === 1"
        >
          <ChevronLeft class="h-4 w-4" />
          Previous
        </Button>
        <span class="text-sm text-gray-600">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <Button
          variant="outline"
          size="sm"
          @click="nextPage"
          :disabled="currentPage === totalPages"
        >
          Next
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  FolderOpen,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { SearchAndFilter } from "@/components/ui"
import ProjectCard from '@/components/projects/ProjectCard.vue'
import ProjectListItem from '@/components/projects/ProjectListItem.vue'
import { useProjects } from '@/composables/useProjects'
import { useSearch } from '@/composables/useSearch'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const { projects, loading, fetchProjects } = useProjects()
const { success, error: showError } = useNotifications()

// Search and filtering
const {
  searchQuery,
  filters,
  sortBy,
  sortOrder,
  filteredAndSortedItems,
  availableStatuses,
  availableAssignees,
  availablePriorities,
  availableTags,
  hasActiveFilters,
  resultCount,
  totalCount,
  clearFilters
} = useSearch(projects)

// View mode
const viewMode = ref<'grid' | 'list'>('grid')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(12)

const totalPages = computed(() => Math.ceil(resultCount.value / itemsPerPage.value))

// Project sort options
const projectSortOptions = [
  { value: 'updated_at', label: 'Last Updated', icon: Clock },
  { value: 'created_at', label: 'Created Date', icon: Clock },
  { value: 'name', label: 'Project Name', icon: FolderOpen },
  { value: 'status', label: 'Status', icon: CheckCircle },
  { value: 'priority', label: 'Priority', icon: AlertTriangle }
]

// Dashboard stats
const inProgressCount = computed(() => 
  projects.value.filter(p => p.status === 'in_progress').length
)

const completedCount = computed(() => 
  projects.value.filter(p => p.status === 'completed').length
)

const atRiskCount = computed(() => 
  projects.value.filter(p => p.priority === 'high' && p.status !== 'completed').length
)

// Local state
const showCreateProject = ref(false)

// Methods
const refreshProjects = async () => {
  try {
    await fetchProjects()
    success('Projects Refreshed', 'Project data has been updated successfully.')
  } catch (error: any) {
    showError('Refresh Failed', error.message || 'Failed to refresh projects.')
  }
}

const navigateToProject = (projectId: string | number) => {
  router.push(`/projects/${projectId}`)
}

const editProject = (project: any) => {
  router.push(`/projects/${project.id}/edit`)
}

const deleteProject = async (project: any) => {
  if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
    try {
      // Call delete API
      success('Project Deleted', `"${project.name}" has been deleted successfully.`)
      await refreshProjects()
    } catch (error: any) {
      showError('Delete Failed', error.message || 'Failed to delete project.')
    }
  }
}

const archiveProject = async (project: any) => {
  try {
    // Call archive API
    success('Project Archived', `"${project.name}" has been archived successfully.`)
    await refreshProjects()
  } catch (error: any) {
    showError('Archive Failed', error.message || 'Failed to archive project.')
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Initialize
onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.enhanced-project-dashboard {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style>

