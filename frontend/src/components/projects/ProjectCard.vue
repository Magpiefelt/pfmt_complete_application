<template>
  <Card 
    class="hover:shadow-md transition-shadow cursor-pointer" 
    @click="navigateToProject"
  >
    <CardHeader>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <AlbertaText tag="h3" size="heading-s" mb="xs">{{ normalizedProject.name || 'Unnamed Project' }}</AlbertaText>
          <AlbertaText size="body-s" color="secondary">
            {{ contractorPhaseDisplay }}
          </AlbertaText>
        </div>
        <div class="flex items-center space-x-2">
          <Badge variant="outline">{{ normalizedProject.status || 'Unknown' }}</Badge>
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
            <AlbertaText size="body-s" color="secondary">
              {{ startDate ? `Started ${formatDate(startDate)}` : 'Start date TBD' }}
            </AlbertaText>
          </div>
          <div class="flex items-center">
            <Users class="h-4 w-4 mr-2 text-gray-600" />
            <AlbertaText size="body-s" color="secondary">
              {{ projectManager ? `PM: ${projectManager}` : 'PM: TBD' }}
            </AlbertaText>
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
import { Badge } from "@/components/ui"
import { formatCurrency, formatDate, getStatusColor } from '@/utils'
import { normalizeProject } from '@/utils/fieldNormalization'

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

const emit = defineEmits<{
  select: [Project]
}>()

const router = useRouter()

// Use field normalization for consistent data access
const normalizedProject = computed(() => normalizeProject(props.project))

// Computed properties using normalized data
const contractor = computed(() => {
  return normalizedProject.value.contractor || ''
})

const phase = computed(() => {
  return normalizedProject.value.phase || ''
})

const region = computed(() => {
  return normalizedProject.value.region || ''
})

const startDate = computed(() => {
  return normalizedProject.value.startDate || ''
})

const projectManager = computed(() => {
  return normalizedProject.value.projectManager || ''
})

// Computed property for contractor and phase display with conditional separator
const contractorPhaseDisplay = computed(() => {
  const contractorValue = contractor.value
  const phaseValue = phase.value
  
  if (contractorValue && phaseValue) {
    return `${contractorValue} • ${phaseValue}`
  } else if (contractorValue) {
    return contractorValue
  } else if (phaseValue) {
    return phaseValue
  } else {
    return ''
  }
})

const reportStatus = computed(() => {
  return normalizedProject.value.reportStatus || 'Update Required'
})

const totalBudget = computed(() => {
  return normalizedProject.value.totalBudget || 0
})

const amountSpent = computed(() => {
  return normalizedProject.value.amountSpent || 0
})

const scheduleStatus = computed(() => {
  return normalizedProject.value.scheduleStatus || 'On Track'
})

const budgetStatus = computed(() => {
  return normalizedProject.value.budgetStatus || 'On Track'
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
  // Emit select event first
  emit('select', props.project)
  // Then navigate
  router.push(`/projects/${props.project.id}`)
}
</script>

