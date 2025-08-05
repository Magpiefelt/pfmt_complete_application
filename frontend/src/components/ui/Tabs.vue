<template>
  <div class="tabs-root">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue'

interface Props {
  defaultValue?: string
  value?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultValue: ''
})

const emit = defineEmits<{
  'update:value': [value: string]
}>()

const activeTab = ref(props.value || props.defaultValue)

const setActiveTab = (value: string) => {
  activeTab.value = value
  emit('update:value', value)
}

provide('tabsContext', {
  activeTab,
  setActiveTab
})
</script>

<style scoped>
.tabs-root {
  @apply w-full;
}
</style>

