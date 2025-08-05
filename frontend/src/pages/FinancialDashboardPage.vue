<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <AlbertaText tag="h1" variant="heading-xl" color="primary" class="mb-2">
          Financial Dashboard
        </AlbertaText>
        <AlbertaText variant="body-l" color="secondary">
          Monitor financial performance across all projects and departments
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="exportDashboard">
          <Download class="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button @click="openReportBuilder">
          <Plus class="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>
    </div>

    <!-- Financial Dashboard Component -->
    <BudgetDashboard />
  </div>
</template>

<script setup lang="ts">
import { Download, Plus } from 'lucide-vue-next'
import { AlbertaText, Button } from '@/components/ui'
import BudgetDashboard from '@/components/financial/BudgetDashboard.vue'

// Methods
const exportDashboard = () => {
}

const openReportBuilder = () => {
}
</script>

<style scoped>
/* Page-specific styles */
.container {
  max-width: 1400px;
}
</style>

