<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Projects</h2>
      <p class="text-gray-600">Manage and view project information</p>
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

const route = useRoute()
const router = useRouter()

const filter = computed(() => 
  (route.query.filter as string) || 'all'
)

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

