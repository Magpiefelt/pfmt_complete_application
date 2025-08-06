<template>
  <div class="space-y-6">
    <!-- Project Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Project Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-center space-x-2">
            <component :is="statusIcon" class="h-5 w-5" :class="statusIconClass" />
            <span class="text-lg font-semibold">{{ formatStatus(project.status) }}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatCurrency(project.total_approved_funding || 0) }}</div>
          <p class="text-xs text-muted-foreground">Approved funding</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Amount Spent</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatCurrency(project.amount_spent || 0) }}</div>
          <div class="flex items-center space-x-1 mt-1">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full" 
                :style="{ width: `${spentPercentage}%` }"
              ></div>
            </div>
            <span class="text-xs text-muted-foreground">{{ spentPercentage }}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Project Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-lg font-semibold">{{ formatProjectPhase(project.project_phase) }}</div>
          <p class="text-xs text-muted-foreground">Current phase</p>
        </CardContent>
      </Card>
    </div>

    <!-- Project Description -->
    <Card>
      <CardHeader>
        <CardTitle>Project Description</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-gray-700 leading-relaxed">
          {{ project.description || 'No description available.' }}
        </p>
      </CardContent>
    </Card>

    <!-- Key Information -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Project Details -->
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500">Category</label>
              <p class="text-sm text-gray-900">{{ project.category || 'Not specified' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500">Ministry</label>
              <p class="text-sm text-gray-900">{{ project.ministry || 'Not specified' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500">Region</label>
              <p class="text-sm text-gray-900">{{ project.region || 'Not specified' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500">Project Manager</label>
              <p class="text-sm text-gray-900">{{ project.project_manager_name || 'Not assigned' }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Timeline -->
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500">Created</label>
              <p class="text-sm text-gray-900">{{ formatDate(project.created_at) }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500">Last Updated</label>
              <p class="text-sm text-gray-900">{{ formatDate(project.updated_at) }}</p>
            </div>
            <div v-if="project.start_date">
              <label class="text-sm font-medium text-gray-500">Start Date</label>
              <p class="text-sm text-gray-900">{{ formatDate(project.start_date) }}</p>
            </div>
            <div v-if="project.end_date">
              <label class="text-sm font-medium text-gray-500">End Date</label>
              <p class="text-sm text-gray-900">{{ formatDate(project.end_date) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Activity -->
    <Card v-if="recentActivity.length > 0">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div 
            v-for="activity in recentActivity" 
            :key="activity.id"
            class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <component :is="getActivityIcon(activity.type)" class="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">{{ activity.description }}</p>
              <p class="text-xs text-gray-500">{{ formatRelativeTime(activity.created_at) }}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Building, 
  DollarSign, 
  Calendar, 
  FileText, 
  Users, 
  Settings,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useFormat } from '@/composables/useFormat'
import { useStatusBadge } from '@/composables/useStatusBadge'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  project_phase: string
  category?: string
  ministry?: string
  region?: string
  total_approved_funding?: number
  amount_spent?: number
  project_manager_name?: string
  created_at: string
  updated_at: string
  start_date?: string
  end_date?: string
  [key: string]: any
}

interface Activity {
  id: string
  type: string
  description: string
  created_at: string
}

interface Props {
  project: Project
  recentActivity?: Activity[]
}

const props = withDefaults(defineProps<Props>(), {
  recentActivity: () => []
})

const { formatCurrency, formatDate, formatRelativeTime, formatStatus, formatProjectPhase } = useFormat()
const { getProjectStatusIcon } = useStatusBadge()

const spentPercentage = computed(() => {
  if (!props.project.total_approved_funding || !props.project.amount_spent) return 0
  return Math.round((props.project.amount_spent / props.project.total_approved_funding) * 100)
})

const statusIcon = computed(() => {
  return getProjectStatusIcon(props.project.status)
})

const statusIconClass = computed(() => {
  const statusClasses: Record<string, string> = {
    'active': 'text-green-600',
    'planning': 'text-blue-600',
    'design': 'text-purple-600',
    'construction': 'text-orange-600',
    'completion': 'text-green-600',
    'on_hold': 'text-yellow-600',
    'cancelled': 'text-red-600',
    'completed': 'text-gray-600'
  }
  return statusClasses[props.project.status.toLowerCase()] || 'text-gray-600'
})

const getActivityIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    'project_created': Building,
    'budget_updated': DollarSign,
    'meeting_scheduled': Calendar,
    'document_uploaded': FileText,
    'team_updated': Users,
    'status_changed': Settings,
    'milestone_completed': CheckCircle,
    'deadline_approaching': Clock,
    'issue_reported': AlertTriangle
  }
  return iconMap[type] || FileText
}
</script>

