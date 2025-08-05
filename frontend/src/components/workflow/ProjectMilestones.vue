<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
          Project Milestones & Gate Meetings
        </AlbertaText>
        <AlbertaText variant="body-s" color="secondary">
          Track project progress through gate meetings and key milestones
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3" v-if="canCreateMeetings">
        <Button variant="outline" @click="exportTimeline">
          <Download class="w-4 h-4 mr-2" />
          Export Timeline
        </Button>
        <Button @click="showCreateMeetingDialog = true">
          <Plus class="w-4 h-4 mr-2" />
          Schedule Gate Meeting
        </Button>
      </div>
    </div>

    <!-- Project Progress Overview -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <GitBranch class="h-5 w-5" />
          Project Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <AlbertaText variant="body-m" color="primary" class="font-medium">
                Current Phase: {{ currentPhase || 'Not Set' }}
              </AlbertaText>
              <AlbertaText variant="body-s" color="secondary">
                {{ nextMilestone || 'No upcoming milestones' }}
              </AlbertaText>
            </div>
            <div class="text-right">
              <AlbertaText variant="body-s" color="secondary">Overall Progress</AlbertaText>
              <AlbertaText variant="body-m" color="primary" class="font-medium">
                {{ overallProgress }}%
              </AlbertaText>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="space-y-2">
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div 
                class="bg-blue-500 h-3 rounded-full transition-all duration-300"
                :style="{ width: `${overallProgress}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>Project Initiation</span>
              <span>Design Approval</span>
              <span>Construction Progress</span>
              <span>Project Completion</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Gate Meetings Timeline -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Calendar class="h-5 w-5" />
          Gate Meetings Timeline
        </CardTitle>
        <CardDescription>
          Chronological view of all gate meetings and their outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
        
        <div v-else-if="gateMeetings.length === 0" class="text-center py-8">
          <Calendar class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <AlbertaText variant="body-m" color="secondary">
            No gate meetings scheduled yet
          </AlbertaText>
          <Button 
            v-if="canCreateMeetings" 
            @click="showCreateMeetingDialog = true" 
            class="mt-4"
          >
            Schedule First Gate Meeting
          </Button>
        </div>

        <div v-else class="space-y-6">
          <!-- Timeline -->
          <div class="relative">
            <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div
              v-for="(meeting, index) in gateMeetings"
              :key="meeting.id"
              class="relative flex items-start space-x-4 pb-6"
            >
              <!-- Timeline Node -->
              <div class="relative z-10">
                <div 
                  :class="getTimelineNodeClass(meeting.status)"
                  class="w-4 h-4 rounded-full border-2 bg-white"
                ></div>
              </div>

              <!-- Meeting Card -->
              <div class="flex-1 min-w-0">
                <Card :class="getMeetingCardClass(meeting.status)">
                  <CardContent class="p-4">
                    <div class="flex items-center justify-between mb-3">
                      <div>
                        <h4 class="font-semibold text-gray-900">
                          {{ meeting.gate_type }}
                        </h4>
                        <p class="text-sm text-gray-600">
                          {{ formatMeetingDate(meeting) }}
                        </p>
                      </div>
                      <span 
                        :class="getStatusBadgeClass(meeting.status)"
                        class="px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {{ meeting.status }}
                      </span>
                    </div>

                    <!-- Meeting Details -->
                    <div class="space-y-2">
                      <div v-if="meeting.location" class="flex items-center text-sm text-gray-600">
                        <MapPin class="h-4 w-4 mr-2" />
                        {{ meeting.location }}
                      </div>
                      
                      <div v-if="meeting.chaired_by_name" class="flex items-center text-sm text-gray-600">
                        <User class="h-4 w-4 mr-2" />
                        Chaired by {{ meeting.chaired_by_name }}
                      </div>

                      <div v-if="meeting.decision" class="mt-3">
                        <AlbertaText variant="body-s" color="secondary" class="font-medium">
                          Decision:
                        </AlbertaText>
                        <AlbertaText variant="body-s" class="mt-1">
                          {{ meeting.decision }}
                        </AlbertaText>
                      </div>

                      <div v-if="meeting.action_items && meeting.action_items.length > 0" class="mt-3">
                        <AlbertaText variant="body-s" color="secondary" class="font-medium">
                          Action Items:
                        </AlbertaText>
                        <ul class="mt-1 space-y-1">
                          <li 
                            v-for="item in meeting.action_items" 
                            :key="item.id"
                            class="text-sm text-gray-700 flex items-start"
                          >
                            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {{ item.description }}
                          </li>
                        </ul>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div v-if="canEditMeetings" class="flex items-center space-x-2 mt-4 pt-3 border-t border-gray-100">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        @click="editMeeting(meeting)"
                      >
                        <Edit class="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button 
                        v-if="meeting.status === 'completed' && meeting.decision && !meeting.version_submitted"
                        @click="promptVersionSubmission(meeting)"
                        size="sm"
                      >
                        <FileText class="h-4 w-4 mr-1" />
                        Submit Version for Approval
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Create Meeting Dialog -->
    <Dialog v-model:open="showCreateMeetingDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Gate Meeting</DialogTitle>
          <DialogDescription>
            Schedule a new gate meeting for this project
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="createMeeting" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Gate Type
            </label>
            <select
              v-model="newMeeting.gateType"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select gate type</option>
              <option value="Gate 1 - Project Initiation">Gate 1 - Project Initiation</option>
              <option value="Gate 2 - Design Approval">Gate 2 - Design Approval</option>
              <option value="Gate 3 - Construction Progress Review">Gate 3 - Construction Progress Review</option>
              <option value="Gate 4 - Project Completion">Gate 4 - Project Completion</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Planned Date
            </label>
            <input
              v-model="newMeeting.plannedDate"
              type="datetime-local"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              v-model="newMeeting.location"
              type="text"
              placeholder="Meeting location or video conference link"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              @click="showCreateMeetingDialog = false"
            >
              Cancel
            </Button>
            <Button type="submit" :disabled="creatingMeeting">
              <span v-if="creatingMeeting">Creating...</span>
              <span v-else>Schedule Meeting</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  LoadingSpinner
} from '@/components/ui'
import { AlbertaText } from '@/components/ui'
import { useAuth } from '@/composables/useAuth'
import { 
  Calendar, 
  GitBranch, 
  Download, 
  Plus, 
  Edit, 
  FileText,
  MapPin,
  User
} from 'lucide-vue-next'

interface GateMeeting {
  id: string
  gate_type: string
  planned_date: string
  actual_date?: string
  status: string
  location?: string
  chaired_by_name?: string
  decision?: string
  action_items?: Array<{ id: string; description: string }>
  version_submitted?: boolean
}

interface NewMeeting {
  gateType: string
  plannedDate: string
  location: string
}

const route = useRoute()
const { currentUser } = useAuth()

// Reactive data
const loading = ref(true)
const gateMeetings = ref<GateMeeting[]>([])
const showCreateMeetingDialog = ref(false)
const creatingMeeting = ref(false)
const newMeeting = ref<NewMeeting>({
  gateType: '',
  plannedDate: '',
  location: ''
})

// Computed properties
const projectId = computed(() => route.params.id as string)

const canCreateMeetings = computed(() => {
  return ['Project Manager', 'Senior Project Manager'].includes(currentUser.value?.role || '')
})

const canEditMeetings = computed(() => {
  return ['Project Manager', 'Senior Project Manager'].includes(currentUser.value?.role || '')
})

const currentPhase = computed(() => {
  const completedMeetings = gateMeetings.value.filter(m => m.status === 'completed')
  if (completedMeetings.length === 0) return 'Project Initiation'
  
  const lastCompleted = completedMeetings[completedMeetings.length - 1]
  if (lastCompleted.gate_type.includes('Gate 1')) return 'Design Phase'
  if (lastCompleted.gate_type.includes('Gate 2')) return 'Construction Phase'
  if (lastCompleted.gate_type.includes('Gate 3')) return 'Project Completion'
  return 'Project Completed'
})

const nextMilestone = computed(() => {
  const upcomingMeetings = gateMeetings.value.filter(m => 
    m.status === 'scheduled' && new Date(m.planned_date) > new Date()
  )
  if (upcomingMeetings.length === 0) return 'No upcoming milestones'
  
  const nextMeeting = upcomingMeetings[0]
  return `Next: ${nextMeeting.gate_type} on ${formatDate(nextMeeting.planned_date)}`
})

const overallProgress = computed(() => {
  const totalGates = 4
  const completedGates = gateMeetings.value.filter(m => m.status === 'completed').length
  return Math.round((completedGates / totalGates) * 100)
})

// Methods
const loadGateMeetings = async () => {
  try {
    loading.value = true
    const response = await fetch(`/api/gate-meetings?project_id=${projectId.value}`)
    const data = await response.json()
    
    if (data.success) {
      gateMeetings.value = data.data.sort((a: GateMeeting, b: GateMeeting) => 
        new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime()
      )
    }
  } catch (error) {
    console.error('Error loading gate meetings:', error)
  } finally {
    loading.value = false
  }
}

const createMeeting = async () => {
  try {
    creatingMeeting.value = true
    const response = await fetch('/api/gate-meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: projectId.value,
        gate_type: newMeeting.value.gateType,
        planned_date: newMeeting.value.plannedDate,
        location: newMeeting.value.location
      })
    })
    
    const data = await response.json()
    if (data.success) {
      showCreateMeetingDialog.value = false
      newMeeting.value = { gateType: '', plannedDate: '', location: '' }
      await loadGateMeetings()
    }
  } catch (error) {
    console.error('Error creating meeting:', error)
  } finally {
    creatingMeeting.value = false
  }
}

const editMeeting = (meeting: GateMeeting) => {
  // Emit event to parent component or navigate to edit page
  // This would typically open a more detailed edit dialog
}

const promptVersionSubmission = (meeting: GateMeeting) => {
  // Emit event to trigger version submission workflow
  // This would typically show a confirmation dialog and then submit the version
  // Emit to parent component to handle version submission
  emit('submitVersionForApproval', meeting)
}

// Complete a gate meeting and trigger version submission workflow
const completeMeeting = async (meeting: GateMeeting) => {
  try {
    const response = await fetch(`/api/gate-meetings/${meeting.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed',
        actual_date: new Date().toISOString(),
        decision: 'approved' // This could be captured from a form
      })
    })
    
    if (response.ok) {
      // Reload meetings
      await loadGateMeetings()
      
      // Prompt for version submission if user has permission
      if (canCreateMeetings.value) {
        const shouldSubmit = confirm(
          `Gate meeting "${meeting.gate_type}" has been completed. Would you like to update the project draft with the meeting outcomes and submit it for approval?`
        )
        
        if (shouldSubmit) {
          promptVersionSubmission(meeting)
        }
      }
    }
  } catch (error) {
    console.error('Error completing meeting:', error)
  }
}

const exportTimeline = () => {
  // Export timeline functionality
}

const formatMeetingDate = (meeting: GateMeeting) => {
  const date = meeting.actual_date || meeting.planned_date
  return formatDate(date)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTimelineNodeClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'border-green-500 bg-green-500'
    case 'scheduled':
      return 'border-blue-500 bg-blue-500'
    case 'cancelled':
      return 'border-red-500 bg-red-500'
    default:
      return 'border-gray-300 bg-gray-300'
  }
}

const getMeetingCardClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'border-green-200 bg-green-50'
    case 'scheduled':
      return 'border-blue-200 bg-blue-50'
    case 'cancelled':
      return 'border-red-200 bg-red-50'
    default:
      return ''
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Events
const emit = defineEmits(['submitVersionForApproval'])

// Lifecycle
onMounted(() => {
  loadGateMeetings()
})

// Watch for project changes
watch(() => route.params.id, () => {
  if (route.params.id) {
    loadGateMeetings()
  }
})
</script>

