<template>
  <div class="wizard-layout">
    <WizardContainer />
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { watch } from 'vue'
import WizardContainer from './WizardContainer.vue'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'
import { useWizardPersistence } from '@/composables/useWizardPersistence'

const { wizardStore } = useProjectWizardIntegration()
const { saveState } = useWizardPersistence()

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
</style>
