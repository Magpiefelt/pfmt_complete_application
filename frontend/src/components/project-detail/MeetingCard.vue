<template>
  <div 
    class="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
    :class="borderClass"
  >
    <!-- Status Icon -->
    <div class="flex-shrink-0 mt-1">
      <div 
        class="w-8 h-8 rounded-full flex items-center justify-center"
        :class="iconBgClass"
      >
        <component 
          :is="statusIcon" 
          class="h-4 w-4"
          :class="iconClass"
        />
      </div>
    </div>

    <!-- Meeting Details -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium text-gray-900">{{ meeting.gate_type }}</h4>
        <span 
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="statusClass"
        >
          {{ statusText }}
        </span>
      </div>
      
      <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
        <span class="flex items-center">
          <Calendar class="h-4 w-4 mr-1" />
          {{ formattedDate }}
        </span>
        <span v-if="meeting.attendees?.length" class="flex items-center">
          <Users class="h-4 w-4 mr-1" />
          {{ meeting.attendees.length }} attendees
        </span>
      </div>

      <p v-if="meeting.agenda" class="mt-2 text-sm text-gray-700">
        {{ truncatedAgenda }}
      </p>

      <div v-if="meeting.status === 'completed'" class="mt-2">
        <div class="flex items-center space-x-2 text-sm">
          <CheckCircle class="h-4 w-4 text-green-600" />
          <span class="text-green-700">Completed on {{ formattedActualDate }}</span>
          <span v-if="meeting.decision" class="text-gray-500">• Decision: {{ meeting.decision }}</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex-shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="$emit('view')">
            <Eye class="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem 
            v-if="canEdit" 
            @click="$emit('edit')"
          >
            <Edit class="h-4 w-4 mr-2" />
            Edit Meeting
          </DropdownMenuItem>
          <DropdownMenuItem 
            v-if="canComplete" 
            @click="$emit('complete')"
          >
            <CheckCircle class="h-4 w-4 mr-2" />
            Mark Complete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            v-if="canDelete" 
            @click="$emit('delete')"
            class="text-red-600"
          >
            <Trash2 class="h-4 w-4 mr-2" />
            Delete Meeting
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Calendar, 
  CheckCircle, 
  Users, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  AlertTriangle
} from 'lucide-vue-next'
import { Button } from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui'
import { useFormat } from '@/composables/useFormat'
import type { GateMeeting } from '@/composables/useGateMeetings'

interface Props {
  meeting: GateMeeting
  canEdit: boolean
  canComplete: boolean
  canDelete: boolean
}

const props = defineProps<Props>()

defineEmits<{
  'view': []
  'edit': []
  'complete': []
  'delete': []
}>()

const { formatDate, truncateText } = useFormat()

const formattedDate = computed(() => {
  return formatDate(props.meeting.planned_date)
})

const formattedActualDate = computed(() => {
  return props.meeting.actual_date ? formatDate(props.meeting.actual_date) : ''
})

const truncatedAgenda = computed(() => {
  return props.meeting.agenda ? truncateText(props.meeting.agenda, 150) : ''
})

const statusText = computed(() => {
  if (props.meeting.status === 'completed') return 'Completed'
  if (props.meeting.status === 'cancelled') return 'Cancelled'
  
  const today = new Date()
  const meetingDate = new Date(props.meeting.planned_date)
  
  if (meetingDate < today) return 'Overdue'
  if (meetingDate.toDateString() === today.toDateString()) return 'Today'
  
  const diffTime = meetingDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 7) return 'Soon'
  return 'Upcoming'
})

const statusClass = computed(() => {
  const status = statusText.value
  const classMap: Record<string, string> = {
    'Completed': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'Overdue': 'bg-red-100 text-red-800',
    'Today': 'bg-orange-100 text-orange-800',
    'Soon': 'bg-yellow-100 text-yellow-800',
    'Upcoming': 'bg-blue-100 text-blue-800'
  }
  return classMap[status] || 'bg-gray-100 text-gray-800'
})

const statusIcon = computed(() => {
  if (props.meeting.status === 'completed') return CheckCircle
  if (props.meeting.status === 'cancelled') return AlertTriangle
  return Calendar
})

const iconClass = computed(() => {
  if (props.meeting.status === 'completed') return 'text-green-600'
  if (props.meeting.status === 'cancelled') return 'text-red-600'
  
  const status = statusText.value
  const classMap: Record<string, string> = {
    'Overdue': 'text-red-600',
    'Today': 'text-orange-600',
    'Soon': 'text-yellow-600',
    'Upcoming': 'text-blue-600'
  }
  return classMap[status] || 'text-blue-600'
})

const iconBgClass = computed(() => {
  if (props.meeting.status === 'completed') return 'bg-green-100'
  if (props.meeting.status === 'cancelled') return 'bg-red-100'
  
  const status = statusText.value
  const classMap: Record<string, string> = {
    'Overdue': 'bg-red-100',
    'Today': 'bg-orange-100',
    'Soon': 'bg-yellow-100',
    'Upcoming': 'bg-blue-100'
  }
  return classMap[status] || 'bg-blue-100'
})

const borderClass = computed(() => {
  if (props.meeting.status === 'completed') return 'border-green-200'
  if (props.meeting.status === 'cancelled') return 'border-red-200'
  
  const status = statusText.value
  const classMap: Record<string, string> = {
    'Overdue': 'border-red-200',
    'Today': 'border-orange-200',
    'Soon': 'border-yellow-200',
    'Upcoming': 'border-blue-200'
  }
  return classMap[status] || 'border-gray-200'
})
</script>

