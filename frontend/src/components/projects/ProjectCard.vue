<template>
  <Card 
    class="hover:shadow-md transition-shadow cursor-pointer" 
    @click="navigateToProject"
  >
    <CardHeader>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <AlbertaText tag="h3" size="heading-s" mb="xs">{{ project.name }}</AlbertaText>
          <AlbertaText size="body-s" color="secondary">
            {{ contractor }} • {{ phase }}
          </AlbertaText>
        </div>
        <div class="flex items-center space-x-2">
          <Badge variant="outline">{{ project.projectStatus || project.status }}</Badge>
          <Badge 
            :variant="reportStatus === 'Current' ? 'default' : 'destructive'"
          >
            {{ reportStatus }}
          </Badge>
          <!-- Pending Draft Badge -->
          <Badge 
            v-if="hasPendingDraft"
            variant="secondary"
            class="bg-yellow-100 text-yellow-800"
          >
            Pending Draft
          </Badge>
        </div>
      </div>
    </CardHeader>
    
    <CardContent>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-2">
          <div class="flex items-center">
            <MapPin class="h-4 w-4 mr-2 text-gray-600" />
            <AlbertaText size="body-s" color="secondary">{{ region }}</AlbertaText>
          </div>
          <div class="flex items-center">
            <Calendar class="h-4 w-4 mr-2 text-gray-600" />
            <AlbertaText size="body-s" color="secondary">Started {{ formatDate(startDate) }}</AlbertaText>
          </div>
          <div class="flex items-center">
            <Users class="h-4 w-4 mr-2 text-gray-600" />
            <AlbertaText size="body-s" color="secondary">PM: {{ projectManager }}</AlbertaText>
          </div>
        </div>
        
        <div class="space-y-2">
          <div class="flex items-center">
            <DollarSign class="h-4 w-4 mr-2 text-gray-600" />
            <AlbertaText size="body-s">{{ formatCurrency(totalBudget) }}</AlbertaText>
          </div>
          <AlbertaText size="body-s" color="secondary">
            Spent: {{ formatCurrency(amountSpent) }} ({{ budgetUtilization.toFixed(1) }}%)
          </AlbertaText>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full" 
              :style="{ width: `${Math.min(budgetUtilization, 100)}%` }"
            ></div>
          </div>
        </div>
        
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">Schedule:</span>
            <Badge :class="getStatusColor(scheduleStatus)">
              {{ scheduleStatus }}
            </Badge>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">Budget:</span>
            <Badge :class="getStatusColor(budgetStatus)">
              {{ budgetStatus }}
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, Calendar, Users, DollarSign } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, AlbertaText } from '@/components/ui'
import Badge from '@/components/ui/Badge.vue'
import { formatCurrency, formatDate, getStatusColor } from '@/utils'

interface Project {
  id: number
  name: string
  projectStatus?: string
  status?: string
  reportStatus: string
  region: string
  projectManager: string
  currentVersion?: {
    totalApprovedFunding: number
    amountSpent: number
    projectPhase: string
    [key: string]: any
  }
  // Legacy fields for backward compatibility
  contractor?: string
  phase?: string
  startDate?: string
  totalBudget?: number
  amountSpent?: number
  scheduleStatus?: string
  budgetStatus?: string
  [key: string]: any
}

const props = defineProps<{
  project: Project
}>()

const router = useRouter()

// Computed properties to handle both new and legacy data structures
const contractor = computed(() => {
  return props.project.contractor || 'ABC Construction Ltd.' // Default for demo
})

const phase = computed(() => {
  return props.project.currentVersion?.projectPhase || 
         props.project.phase || 
         props.project.projectPhase || 
         'Construction'
})

const region = computed(() => {
  return props.project.region || 'Central'
})

const startDate = computed(() => {
  return props.project.startDate || 
         props.project.createdAt || 
         '2024-01-15'
})

const projectManager = computed(() => {
  return props.project.projectManager || 
         props.project.currentVersion?.team?.projectManager ||
         'Sarah Johnson'
})

const reportStatus = computed(() => {
  return props.project.reportStatus || 
         props.project.currentVersion?.reportStatus ||
         'Update Required'
})

const totalBudget = computed(() => {
  return props.project.currentVersion?.totalApprovedFunding || 
         props.project.totalBudget || 
         props.project.totalApprovedFunding ||
         0
})

const amountSpent = computed(() => {
  return props.project.currentVersion?.amountSpent || 
         props.project.amountSpent || 
         0
})

const scheduleStatus = computed(() => {
  return props.project.scheduleStatus || 'On Track'
})

const budgetStatus = computed(() => {
  return props.project.budgetStatus || 'On Track'
})

const budgetUtilization = computed(() => {
  if (totalBudget.value === 0) return 0
  return (amountSpent.value / totalBudget.value) * 100
})

// Check if project has pending draft for approval
const hasPendingDraft = computed(() => {
  return props.project.hasPendingDraft || 
         props.project.versions?.some((v: any) => v.status === 'PendingApproval') ||
         false
})

const navigateToProject = () => {
  router.push(`/projects/${props.project.id}`)
}
</script>

