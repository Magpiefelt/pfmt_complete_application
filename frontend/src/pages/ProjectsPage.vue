<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h2>
      <p class="text-gray-600">{{ pageDescription }}</p>
    </div>
    
    <ProjectList 
      :filter="filter"
      @project-select="handleProjectSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectList from '@/components/projects/ProjectList.vue'
import { useLoading } from '@/composables/useLoading'

const route = useRoute()
const router = useRouter()

// Use standardized loading state
const { isLoading: pageLoading } = useLoading('Loading projects...')

// Determine if this is "My Projects" or "All Projects" view
const isMyView = computed(() => 
  route.meta.view === 'my' || route.name === 'projects'
)

// Dynamic page title and description based on view
const pageTitle = computed(() => 
  isMyView.value ? 'My Projects' : 'All Projects'
)

const pageDescription = computed(() => 
  isMyView.value 
    ? 'Manage and view projects you are involved with' 
    : 'Manage and view all projects in the system'
)

const filter = computed(() => {
  // If it's "My Projects" view, we'll pass 'my' as the filter
  // If it's "All Projects" view, we'll pass 'all' as the filter
  // This can be overridden by query parameters
  const queryFilter = route.query.filter as string
  if (queryFilter) {
    return queryFilter
  }
  return isMyView.value ? 'my' : 'all'
})

// Watch for route changes to update filter immediately
watch(() => route.query.filter, (newFilter) => {
  // This will automatically trigger the useProjects composable to update
  // since we're using a computed that watches route.query.filter
}, { immediate: true })

const handleProjectSelect = (project: any) => {
  // Navigate to the selected project's detail page
  router.push(`/projects/${project.id}`)
}
</script>

