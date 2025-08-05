<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error state -->
    <ErrorMessage 
      v-else-if="error"
      :message="`Failed to load projects: ${error}`"
      @retry="refetch"
    />

    <!-- Empty state -->
    <EmptyState
      v-else-if="projects.length === 0 && pagination.totalProjects === 0"
      title="No projects found"
      description="No projects match the current filter criteria."
    >
      <template #action>
        <Button @click="refetch" variant="outline">
          Refresh
        </Button>
      </template>
    </EmptyState>

    <!-- Projects list -->
    <template v-else>
      <div class="space-y-4">
        <ProjectCard 
          v-for="project in projects" 
          :key="project.id" 
          :project="project" 
          @select="$emit('projectSelect', project)"
        />
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="pagination.totalPages > 1"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        :has-next="pagination.hasNext"
        :has-prev="pagination.hasPrev"
        :page-size="pagination.pageSize"
        :total-items="pagination.totalProjects"
        @next-page="pagination.goToNextPage"
        @prev-page="pagination.goToPreviousPage"
        @page-change="pagination.goToPage"
        @page-size-change="pagination.setPageSize"
        class="mt-6"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjects } from '@/composables/useProjects'
import { Button } from '@/components/ui'
import ProjectCard from './ProjectCard.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import ErrorMessage from '@/components/shared/ErrorMessage.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import Pagination from '@/components/shared/Pagination.vue'

interface Props {
  filter?: string
}

const props = withDefaults(defineProps<Props>(), {
  filter: 'all'
})

const emit = defineEmits<{
  projectSelect: [project: any]
}>()

const { projects, loading, error, pagination, refetch } = useProjects(props.filter)
</script>

