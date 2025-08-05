<template>
  <ErrorBoundary fallback-message="The PFMT application encountered an unexpected error. Please refresh the page to continue.">
    <AppContent />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import ErrorBoundary from '@/components/shared/ErrorBoundary.vue'
import AppContent from '@/components/AppContent.vue'

// Provide global error handler
provide('errorHandler', (error: Error) => {
  console.error('Global error:', error)
})
</script>

<style>
/* Global styles are imported in main.ts */
</style>

