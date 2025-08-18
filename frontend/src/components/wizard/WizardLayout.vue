<template>
  <div class="wizard-layout">
    <!-- Breadcrumb navigation -->
    <div class="breadcrumb"></div>

    <!-- Progress indicator -->
    <div class="wizard-progress">
      <progress :value="wizardStore.completedSteps.length" :max="wizardStore.totalSteps"></progress>
    </div>

    <!-- Loading and error states -->
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="wizard-body">
      <!-- Nested routes -->
      <router-view />

      <!-- Wizard navigation controls -->
      <div class="wizard-navigation">
        <span v-if="persistenceState.hasUnsavedChanges" class="unsaved-warning">
          Unsaved changes
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'
import { useWizardPersistence } from '@/composables/useWizardPersistence'
import { useProjectWizardStore } from '@/stores/projectWizard'

// Composables are invoked to ensure wizard integration and persistence setup
useProjectWizardIntegration()
const { persistenceState } = useWizardPersistence()
const wizardStore = useProjectWizardStore()

const loading = ref(false)
const error = ref('')
</script>

<style scoped>
.wizard-layout {
  display: flex;
  flex-direction: column;
}

.wizard-progress {
  margin-bottom: 1rem;
}

.wizard-navigation {
  margin-top: 1rem;
}

.loading {
  color: #666;
}

.error {
  color: #c00;
}
</style>

