<template>
  <div class="pfmt-extractor-placeholder">
    <p>PFMT Extractor Component - Placeholder</p>
  </div>
</template>

<script setup lang="ts">
// Placeholder component for PFMTExtractor
const emit = defineEmits(['data-extracted', 'error'])

// Props
defineProps<{
  showHeader?: boolean
}>()
</script>
