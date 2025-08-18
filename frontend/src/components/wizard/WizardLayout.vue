<template>
  <div class="wizard-layout">
    <WizardContainer />
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
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>

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
import { RouterView } from 'vue-router'
import { ref, watch } from 'vue'
import WizardContainer from './WizardContainer.vue'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'
import { useWizardPersistence } from '@/composables/useWizardPersistence'
import { useProjectWizardStore } from '@/stores/projectWizard'

useProjectWizardIntegration()
const { saveState, persistenceState } = useWizardPersistence()
const wizardStore = useProjectWizardStore()

const loading = ref(false)
const error = ref('')

watch(
  () => wizardStore.$state,
  () => saveState(),
  { deep: true }
)

export const layoutName = 'WizardLayout'
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
