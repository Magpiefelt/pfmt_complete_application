<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
          Gate Meetings & Workflow
        </AlbertaText>
        <AlbertaText variant="body-s" color="secondary">
          Manage project gate meetings, decisions, and workflow progression
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="exportMeetings">
          <Download class="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button @click="showScheduleMeetingDialog = true">
          <Plus class="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>
    </div>

    <!-- Project Workflow Status -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <GitBranch class="h-5 w-5" />
          Project Workflow Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <AlbertaText variant="body-m" color="primary" class="font-medium">
                Current State: {{ projectWorkflow.currentState || 'Not Set' }}
              </AlbertaText>
              <AlbertaText variant="body-s" color="secondary">
                {{ projectWorkflow.nextAction || 'No next action defined' }}
              </AlbertaText>
            </div>
            <Button variant="outline" @click="updateWorkflowState">
              <Edit class="w-4 h-4 mr-2" />
              Update State
            </Button>
          </div>
          
          <!-- Workflow Progress -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Workflow Progress</span>
              <span>{{ workflowProgress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${workflowProgress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              v-model="filters.status"
              @change="loadMeetings"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Gate Type</label>
            <select
              v-model="filters.gateType"
              @change="loadMeetings"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="Gate 1 - Project Initiation">Gate 1 - Project Initiation</option>
              <option value="Gate 2 - Design Approval">Gate 2 - Design Approval</option>
              <option value="Gate 3 - Construction Progress Review">Gate 3 - Construction Progress Review</option>
              <option value="Gate 4 - Project Completion">Gate 4 - Project Completion</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Upcoming Only</label>
            <select
              v-model="filters.upcoming"
              @change="loadMeetings"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="false">All Meetings</option>
              <option value="true">Upcoming Only</option>
            </select>
          </div>
          <div class="flex items-end">
            <Button @click="refreshMeetings" class="w-full">
              <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Meetings Timeline -->
    <Card>
      <CardHeader>
        <CardTitle>Gate Meetings Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        
        <div v-else-if="meetings.length === 0" class="text-center py-8">
          <Calendar class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <AlbertaText variant="body-m" color="secondary">
            No gate meetings found. Schedule your first meeting to get started.
          </AlbertaText>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="meeting in meetings" 
            :key="meeting.id" 
            class="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            @click="viewMeetingDetails(meeting)"
          >
            <!-- Timeline Icon -->
            <div class="flex-shrink-0">
              <div class="w-10 h-10 rounded-full flex items-center justify-center"
                   :class="getMeetingStatusClass(meeting.status)">
                <component :is="getMeetingStatusIcon(meeting.status)" class="w-5 h-5" />
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div>
                  <AlbertaText variant="body-m" color="primary" class="font-medium">
                    {{ meeting.gate_type }}
                  </AlbertaText>
                  <div class="flex items-center space-x-2 mt-1">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getStatusBadgeClass(meeting.status)">
                      {{ meeting.status }}
                    </span>
                    <span class="text-sm text-gray-500">
                      {{ formatMeetingDate(meeting) }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <Button variant="outline" size="sm" @click.stop="addMeetingNote(meeting)">
                    <MessageSquare class="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" @click.stop="editMeeting(meeting)">
                    <Edit class="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <!-- Meeting Details -->
              <div class="mt-3 space-y-2">
                <div v-if="meeting.attendees && meeting.attendees.length" class="flex items-center space-x-1">
                  <Users class="w-4 h-4 text-gray-400" />
                  <span class="text-sm text-gray-600">
                    {{ meeting.attendees.length }} attendees
                  </span>
                </div>
                
                <div v-if="meeting.agenda" class="text-sm text-gray-600">
                  <strong>Agenda:</strong> {{ truncateText(meeting.agenda, 100) }}
                </div>
                
                <div v-if="meeting.decisions && meeting.decisions.length" class="text-sm text-gray-600">
                  <strong>Decisions:</strong> {{ meeting.decisions.length }} decision(s) made
                </div>
                
                <div v-if="meeting.action_items && meeting.action_items.length" class="text-sm text-gray-600">
                  <strong>Action Items:</strong> {{ meeting.action_items.length }} item(s)
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Schedule Meeting Dialog -->
    <Dialog v-model:open="showScheduleMeetingDialog">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Gate Meeting</DialogTitle>
          <DialogDescription>
            Schedule a new gate meeting for this project
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Gate Type *</label>
            <select
              v-model="newMeeting.gateType"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Gate Type</option>
              <option value="Gate 1 - Project Initiation">Gate 1 - Project Initiation</option>
              <option value="Gate 2 - Design Approval">Gate 2 - Design Approval</option>
              <option value="Gate 3 - Construction Progress Review">Gate 3 - Construction Progress Review</option>
              <option value="Gate 4 - Project Completion">Gate 4 - Project Completion</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
            <input
              v-model="newMeeting.scheduledDate"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
            <textarea
              v-model="newMeeting.agenda"
              rows="4"
              placeholder="Meeting agenda and topics to discuss..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
            <div class="space-y-2">
              <div v-for="(attendee, index) in newMeeting.attendees" :key="index" class="flex items-center space-x-2">
                <input
                  v-model="attendee.name"
                  type="text"
                  placeholder="Name"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  v-model="attendee.email"
                  type="email"
                  placeholder="Email"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button variant="outline" size="sm" @click="removeAttendee(index)">
                  <X class="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" @click="addAttendee">
                <Plus class="w-4 h-4 mr-2" />
                Add Attendee
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showScheduleMeetingDialog = false">
            Cancel
          </Button>
          <Button @click="scheduleMeeting" :disabled="!isValidMeeting">
            Schedule Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Meeting Details Dialog -->
    <Dialog v-model:open="showMeetingDetailsDialog">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ selectedMeeting?.gate_type }}</DialogTitle>
          <DialogDescription>
            Meeting details and documentation
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedMeeting" class="space-y-6">
          <!-- Meeting Info -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusBadgeClass(selectedMeeting.status)">
                {{ selectedMeeting.status }}
              </span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Date</label>
              <p class="text-sm text-gray-900">{{ formatMeetingDate(selectedMeeting) }}</p>
            </div>
          </div>

          <!-- Agenda -->
          <div v-if="selectedMeeting.agenda">
            <label class="block text-sm font-medium text-gray-700 mb-2">Agenda</label>
            <div class="p-3 bg-gray-50 rounded-md">
              <pre class="text-sm text-gray-900 whitespace-pre-wrap">{{ selectedMeeting.agenda }}</pre>
            </div>
          </div>

          <!-- Attendees -->
          <div v-if="selectedMeeting.attendees && selectedMeeting.attendees.length">
            <label class="block text-sm font-medium text-gray-700 mb-2">Attendees</label>
            <div class="space-y-2">
              <div v-for="attendee in selectedMeeting.attendees" :key="attendee.email" 
                   class="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <User class="w-4 h-4 text-gray-400" />
                <span class="text-sm font-medium">{{ attendee.name }}</span>
                <span class="text-sm text-gray-500">{{ attendee.role }}</span>
                <span class="text-sm text-gray-400">{{ attendee.email }}</span>
              </div>
            </div>
          </div>

          <!-- Minutes -->
          <div v-if="selectedMeeting.minutes">
            <label class="block text-sm font-medium text-gray-700 mb-2">Meeting Minutes</label>
            <div class="p-3 bg-gray-50 rounded-md">
              <pre class="text-sm text-gray-900 whitespace-pre-wrap">{{ selectedMeeting.minutes }}</pre>
            </div>
          </div>

          <!-- Decisions -->
          <div v-if="selectedMeeting.decisions && selectedMeeting.decisions.length">
            <label class="block text-sm font-medium text-gray-700 mb-2">Decisions Made</label>
            <div class="space-y-2">
              <div v-for="(decision, index) in selectedMeeting.decisions" :key="index" 
                   class="p-3 border border-green-200 bg-green-50 rounded-md">
                <div class="font-medium text-green-800">{{ decision.decision }}</div>
                <div class="text-sm text-green-600 mt-1">{{ decision.rationale }}</div>
              </div>
            </div>
          </div>

          <!-- Action Items -->
          <div v-if="selectedMeeting.action_items && selectedMeeting.action_items.length">
            <label class="block text-sm font-medium text-gray-700 mb-2">Action Items</label>
            <div class="space-y-2">
              <div v-for="(item, index) in selectedMeeting.action_items" :key="index" 
                   class="p-3 border border-blue-200 bg-blue-50 rounded-md">
                <div class="flex items-center justify-between">
                  <div class="font-medium text-blue-800">{{ item.action }}</div>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        :class="getActionItemStatusClass(item.status)">
                    {{ item.status }}
                  </span>
                </div>
                <div class="text-sm text-blue-600 mt-1">
                  Assigned to: {{ item.assignee }} | Due: {{ formatDate(item.due_date) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showMeetingDetailsDialog = false">
            Close
          </Button>
          <Button v-if="selectedMeeting?.status === 'scheduled'" @click="completeMeeting">
            Mark Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlbertaText } from '@/components/ui/alberta-text'
import { 
  Download, 
  Plus, 
  RefreshCw,
  GitBranch,
  Edit,
  Calendar,
  MessageSquare,
  Users,
  User,
  X,
  Check,
  Clock,
  AlertCircle
} from 'lucide-vue-next'
import { useGateMeetings } from '@/composables/useGateMeetings'
import { useFormat } from '@/composables/useFormat'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

const emit = defineEmits<{
  'meeting-scheduled': [meeting: any]
  'meeting-completed': [meeting: any]
  'meeting-updated': [meeting: any]
  'meeting-deleted': [meetingId: string]
}>()

// Use composables
const {
  meetings,
  loading,
  error,
  statistics,
  fetchProjectMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  completeMeeting: completeMeetingComposable,
  formatMeetingDate,
  getMeetingStatus,
  getMeetingStatusClass
} = useGateMeetings()

const { formatDate } = useFormat()

// Reactive data
const projectWorkflow = ref({
  currentState: '',
  nextAction: ''
})

const showScheduleMeetingDialog = ref(false)
const showMeetingDetailsDialog = ref(false)
const selectedMeeting = ref(null)

const filters = ref({
  status: '',
  gateType: '',
  upcoming: 'false'
})

const newMeeting = ref({
  gateType: '',
  scheduledDate: '',
  agenda: '',
  attendees: [{ name: '', email: '', role: '' }]
})

// Computed properties
const workflowProgress = computed(() => {
  const completedMeetings = meetings.value.filter(m => m.status === 'completed').length
  const totalMeetings = meetings.value.length || 1
  return Math.round((completedMeetings / totalMeetings) * 100)
})

const isValidMeeting = computed(() => {
  return newMeeting.value.gateType && newMeeting.value.scheduledDate
})

// Methods
const loadMeetings = async () => {
  await fetchProjectMeetings(props.projectId)
}

const loadProjectWorkflow = async () => {
  try {
    const response = await fetch(`/api/projects/${props.projectId}`)
    const data = await response.json()
    
    if (data.success) {
      projectWorkflow.value = {
        currentState: data.data.workflow_state,
        nextAction: data.data.next_action
      }
    }
  } catch (error) {
    console.error('Error loading project workflow:', error)
  }
}

const addAttendee = () => {
  newMeeting.value.attendees.push({ name: '', email: '', role: '' })
}

const removeAttendee = (index) => {
  newMeeting.value.attendees.splice(index, 1)
}

const scheduleMeeting = async () => {
  try {
    const response = await fetch(`/api/gate-meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: props.projectId,
        gate_type: newMeeting.value.gateType,
        scheduled_date: newMeeting.value.scheduledDate,
        agenda: newMeeting.value.agenda,
        attendees: newMeeting.value.attendees.filter(a => a.name && a.email)
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      showScheduleMeetingDialog.value = false
      newMeeting.value = {
        gateType: '',
        scheduledDate: '',
        agenda: '',
        attendees: [{ name: '', email: '', role: '' }]
      }
      await loadMeetings()
    }
  } catch (error) {
    console.error('Error scheduling meeting:', error)
  }
}

const viewMeetingDetails = (meeting) => {
  selectedMeeting.value = meeting
  showMeetingDetailsDialog.value = true
}

const addMeetingNote = async (meeting) => {
  const note = prompt('Add a note to this meeting:')
  if (note) {
    try {
      const response = await fetch(`/api/phase1/gate-meetings/${meeting.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note })
      })
      
      if (response.ok) {
        await loadMeetings()
      }
    } catch (error) {
      console.error('Error adding meeting note:', error)
    }
  }
}

const editMeeting = (meeting) => {
  // Implementation for editing meeting
}

const completeMeetingSimple = async () => {
  if (selectedMeeting.value) {
    try {
      const success = await completeMeetingComposable(selectedMeeting.value.id, {
        actual_date: new Date().toISOString().split('T')[0]
      })
      
      if (success) {
        showMeetingDetailsDialog.value = false
        emit('meeting-completed', selectedMeeting.value)
      }
    } catch (error) {
      console.error('Error completing meeting:', error)
    }
  }
}

const updateWorkflowState = () => {
  // Implementation for updating workflow state
}

const refreshMeetings = () => {
  loadMeetings()
}

const exportMeetings = () => {
  // Implementation for exporting meetings
}

// Enhanced workflow synchronization
const syncWorkflowWithMeetings = () => {
  const completedMeetings = meetings.value.filter(m => m.status === 'completed')
  const upcomingMeetings = meetings.value.filter(m => 
    m.status === 'scheduled' && new Date(m.scheduled_date) > new Date()
  )
  
  // Update current state based on last completed meeting
  if (completedMeetings.length > 0) {
    const lastCompleted = completedMeetings[completedMeetings.length - 1]
    if (lastCompleted.gate_type.includes('Gate 1')) {
      projectWorkflow.value.currentState = 'Design Phase'
    } else if (lastCompleted.gate_type.includes('Gate 2')) {
      projectWorkflow.value.currentState = 'Construction Phase'
    } else if (lastCompleted.gate_type.includes('Gate 3')) {
      projectWorkflow.value.currentState = 'Project Completion'
    } else if (lastCompleted.gate_type.includes('Gate 4')) {
      projectWorkflow.value.currentState = 'Project Completed'
    }
  }
  
  // Update next action based on upcoming meetings
  if (upcomingMeetings.length > 0) {
    const nextMeeting = upcomingMeetings[0]
    projectWorkflow.value.nextAction = `Prepare for ${nextMeeting.gate_type} on ${formatDate(nextMeeting.scheduled_date)}`
  } else {
    projectWorkflow.value.nextAction = 'Schedule next gate meeting'
  }
}

// Meeting completion handler with version submission trigger
const completeMeeting = async (meeting) => {
  try {
    // Mark meeting as completed
    const response = await fetch(`/api/gate-meetings/${meeting.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed',
        actual_date: new Date().toISOString(),
        decision: meeting.decision || 'approved'
      })
    })
    
    if (response.ok) {
      // Reload meetings and sync workflow
      await loadMeetings()
      syncWorkflowWithMeetings()
      
      // Show version submission prompt if decision was made and user can submit
      if (meeting.decision && canCreateMeetings.value) {
        showVersionSubmissionPrompt(meeting)
      }
      
      // Emit event to parent component
      emit('meetingCompleted', {
        meeting,
        shouldPromptVersionSubmission: meeting.decision && canCreateMeetings.value
      })
    }
  } catch (error) {
    console.error('Error completing meeting:', error)
  }
}

// Show version submission prompt after meeting completion
const showVersionSubmissionPrompt = (meeting) => {
  const message = `Gate meeting "${meeting.gate_type}" has been completed with decision: ${meeting.decision}. 
    Would you like to update the project draft with the meeting outcomes and submit it for approval?`
  
  if (confirm(message)) {
    // Emit event to trigger version submission workflow
    emit('triggerVersionSubmission', {
      meeting,
      outcomes: meeting.decision,
      actionItems: meeting.action_items || []
    })
  }
}

// Watch for meetings changes to sync workflow
watch(meetings, () => {
  syncWorkflowWithMeetings()
}, { deep: true })

// Emit events
const emit = defineEmits(['meetingCompleted'])

// Lifecycle
onMounted(() => {
  loadProjectWorkflow()
  loadMeetings()
})

// Watch for filter changes
watch(filters, () => {
  loadMeetings()
}, { deep: true })
</script>

<style scoped>
.transition-colors {
  transition: background-color 0.2s ease-in-out;
}
</style>

