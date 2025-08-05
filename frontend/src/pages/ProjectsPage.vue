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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ProjectList from '@/components/projects/ProjectList.vue'

const route = useRoute()

const filter = computed(() => 
  (route.query.filter as string) || 'all'
)

const handleProjectSelect = (project: any) => {
}
</script>

