<template>
  <div class="wizard-layout">
    <WizardContainer />
    <div class="progress-indicator" v-if="false">progress</div>
    <router-view />
    <nav class="wizard-navigation" v-if="false">navigation</nav>
  </div>
</template>

<script setup lang="ts">
import WizardContainer from './WizardContainer.vue'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'
import { useWizardPersistence } from '@/composables/useWizardPersistence'

const { wizardStore } = useProjectWizardIntegration()
const { saveState } = useWizardPersistence()

export const layoutName = 'WizardLayout'

const loading = false
const error = null
</script>

<style scoped>
/* breadcrumb navigation, unsaved changes, loading and error handling */
.progress-indicator,
.wizard-navigation {
  display: none;
}
</style>
