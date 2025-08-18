<template>
  <div class="detail-tab-adapter">
    <!-- Adapter wrapper for existing DetailsTab -->
    <DetailsTab
      v-if="project"
      :project="project"
      :is-wizard-mode="true"
      @update:project="handleProjectUpdate"
      @validation-change="handleValidationChange"
      @success="handleSuccess"
      @error="handleError"
    />
    
    <!-- Loading state when no project -->
    <div v-else class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading project details...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import DetailsTab from '@/components/project-detail/DetailsTab.vue'

// Props
interface Props {
  project?: any
  isWizardMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isWizardMode: true
})

// Emits
const emit = defineEmits<{
  'update:project': [project: any]
  'validation-change': [isValid: boolean, errors: string[]]
  'success': [message: string]
  'error': [error: string]
}>()

// Local state
const validationErrors = ref<string[]>([])

// Methods
const handleProjectUpdate = (updatedProject: any) => {
  emit('update:project', updatedProject)
}

const handleValidationChange = (isValid: boolean, errors: string[] = []) => {
  validationErrors.value = errors
  emit('validation-change', isValid, errors)
}

const handleSuccess = (message: string) => {
  emit('success', message)
}

const handleError = (error: string) => {
  emit('error', error)
}

// Watch for project changes
watch(() => props.project, (newProject) => {
  if (newProject) {
    // Reset validation when project changes
    validationErrors.value = []
    emit('validation-change', true, [])
  }
})
</script>

<style scoped>
.detail-tab-adapter {
  width: 100%;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e9ecef;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

