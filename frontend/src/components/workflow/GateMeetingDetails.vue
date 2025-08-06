<template>
  <div class="space-y-6">
    <!-- Meeting Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">{{ meeting.gate_type }}</h3>
        <p class="text-sm text-gray-600">{{ formatMeetingDate(meeting) }}</p>
      </div>
      <div class="flex items-center space-x-2">
        <Badge :variant="getStatusVariant(meeting.status)">
          {{ formatStatus(meeting.status) }}
        </Badge>
        <Button 
          v-if="canEdit && meeting.status === 'scheduled'" 
          variant="outline" 
          size="sm"
          @click="showEditDialog = true"
        >
          <Edit class="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
    </div>

    <!-- Meeting Overview -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <Calendar class="h-5 w-5" />
          <span>Meeting Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label class="text-sm font-medium text-gray-700">Scheduled Date</Label>
            <p class="text-sm text-gray-900">{{ formatDate(meeting.scheduled_date) }}</p>
          </div>
          <div v-if="meeting.actual_date">
            <Label class="text-sm font-medium text-gray-700">Actual Date</Label>
            <p class="text-sm text-gray-900">{{ formatDate(meeting.actual_date) }}</p>
          </div>
        </div>
        
        <div v-if="meeting.created_by">
          <Label class="text-sm font-medium text-gray-700">Created By</Label>
          <p class="text-sm text-gray-900">{{ meeting.created_by_name || 'Unknown User' }}</p>
        </div>
      </CardContent>
    </Card>

    <!-- Agenda -->
    <Card v-if="meeting.agenda">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <FileText class="h-5 w-5" />
          <span>Agenda</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="prose prose-sm max-w-none">
          <pre class="whitespace-pre-wrap text-sm text-gray-900 bg-gray-50 p-4 rounded-md">{{ meeting.agenda }}</pre>
        </div>
      </CardContent>
    </Card>

    <!-- Attendees -->
    <Card v-if="attendees.length > 0">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <Users class="h-5 w-5" />
          <span>Attendees ({{ attendees.length }})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div 
            v-for="attendee in attendees" 
            :key="attendee.email"
            class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <Avatar class="h-8 w-8">
              <AvatarImage :src="attendee.avatar" />
              <AvatarFallback>{{ getInitials(attendee.name) }}</AvatarFallback>
            </Avatar>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">{{ attendee.name }}</p>
              <p class="text-xs text-gray-500">{{ attendee.role || 'Attendee' }}</p>
              <p class="text-xs text-gray-400">{{ attendee.email }}</p>
            </div>
            <div v-if="attendee.attendance_status" class="flex-shrink-0">
              <Badge 
                :variant="getAttendanceVariant(attendee.attendance_status)"
                class="text-xs"
              >
                {{ attendee.attendance_status }}
              </Badge>
            </div>
          </div>
        </div>
        
        <!-- Edit Attendees -->
        <div v-if="canEdit && meeting.status === 'scheduled'" class="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" @click="showAttendeesDialog = true">
            <Plus class="h-4 w-4 mr-2" />
            Manage Attendees
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Meeting Minutes -->
    <Card v-if="meeting.minutes">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <MessageSquare class="h-5 w-5" />
          <span>Meeting Minutes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="prose prose-sm max-w-none">
          <pre class="whitespace-pre-wrap text-sm text-gray-900 bg-gray-50 p-4 rounded-md">{{ meeting.minutes }}</pre>
        </div>
        <div v-if="canEdit && meeting.status === 'completed'" class="mt-4">
          <Button variant="outline" size="sm" @click="editMinutes">
            <Edit class="h-4 w-4 mr-2" />
            Edit Minutes
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Decisions Made -->
    <Card v-if="decisions.length > 0">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <CheckCircle class="h-5 w-5" />
          <span>Decisions Made ({{ decisions.length }})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div 
            v-for="(decision, index) in decisions" 
            :key="index"
            class="p-4 border border-green-200 bg-green-50 rounded-lg"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-green-800">{{ decision.decision }}</h4>
                <p v-if="decision.rationale" class="text-sm text-green-600 mt-1">
                  {{ decision.rationale }}
                </p>
                <div v-if="decision.impact" class="text-xs text-green-500 mt-2">
                  Impact: {{ decision.impact }}
                </div>
              </div>
              <div v-if="decision.decision_maker" class="text-xs text-green-600">
                By: {{ decision.decision_maker }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Add Decision -->
        <div v-if="canEdit && meeting.status === 'completed'" class="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" @click="showDecisionDialog = true">
            <Plus class="h-4 w-4 mr-2" />
            Add Decision
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Action Items -->
    <Card v-if="actionItems.length > 0">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <ListTodo class="h-5 w-5" />
          <span>Action Items ({{ actionItems.length }})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div 
            v-for="(item, index) in actionItems" 
            :key="index"
            class="p-4 border border-blue-200 bg-blue-50 rounded-lg"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <h4 class="font-medium text-blue-800">{{ item.action }}</h4>
                  <Badge 
                    :variant="getActionItemVariant(item.status)"
                    class="text-xs"
                  >
                    {{ item.status }}
                  </Badge>
                </div>
                <div class="text-sm text-blue-600 mt-1">
                  <span v-if="item.assignee">Assigned to: {{ item.assignee }}</span>
                  <span v-if="item.due_date" class="ml-4">Due: {{ formatDate(item.due_date) }}</span>
                </div>
                <p v-if="item.description" class="text-sm text-blue-600 mt-2">
                  {{ item.description }}
                </p>
              </div>
              <div v-if="canEdit" class="flex items-center space-x-1">
                <Button 
                  v-if="item.status !== 'completed'"
                  variant="ghost" 
                  size="sm"
                  @click="markActionItemComplete(index)"
                >
                  <Check class="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  @click="editActionItem(index)"
                >
                  <Edit class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Add Action Item -->
        <div v-if="canEdit && meeting.status === 'completed'" class="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" @click="showActionItemDialog = true">
            <Plus class="h-4 w-4 mr-2" />
            Add Action Item
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Edit Meeting Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Meeting</DialogTitle>
          <DialogDescription>
            Update meeting details and information.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label for="scheduled-date">Scheduled Date</Label>
            <Input
              id="scheduled-date"
              v-model="editForm.scheduled_date"
              type="date"
              class="mt-1"
            />
          </div>
          <div>
            <Label for="agenda">Agenda</Label>
            <Textarea
              id="agenda"
              v-model="editForm.agenda"
              rows="4"
              placeholder="Meeting agenda..."
              class="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showEditDialog = false">
            Cancel
          </Button>
          <Button @click="saveMeetingChanges">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Action Item Dialog -->
    <Dialog v-model:open="showActionItemDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingActionItem !== null ? 'Edit' : 'Add' }} Action Item</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label for="action">Action</Label>
            <Input
              id="action"
              v-model="actionItemForm.action"
              placeholder="Describe the action to be taken..."
              class="mt-1"
            />
          </div>
          <div>
            <Label for="assignee">Assignee</Label>
            <Input
              id="assignee"
              v-model="actionItemForm.assignee"
              placeholder="Who is responsible?"
              class="mt-1"
            />
          </div>
          <div>
            <Label for="due-date">Due Date</Label>
            <Input
              id="due-date"
              v-model="actionItemForm.due_date"
              type="date"
              class="mt-1"
            />
          </div>
          <div>
            <Label for="description">Description (Optional)</Label>
            <Textarea
              id="description"
              v-model="actionItemForm.description"
              rows="3"
              placeholder="Additional details..."
              class="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="cancelActionItem">
            Cancel
          </Button>
          <Button @click="saveActionItem" :disabled="!actionItemForm.action">
            {{ editingActionItem !== null ? 'Update' : 'Add' }} Action Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Calendar, FileText, Users, MessageSquare, CheckCircle, ListTodo, 
  Edit, Plus, Check
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Attendee {
  name: string
  email: string
  role?: string
  avatar?: string
  attendance_status?: 'confirmed' | 'tentative' | 'declined' | 'no_response'
}

interface Decision {
  decision: string
  rationale?: string
  impact?: string
  decision_maker?: string
}

interface ActionItem {
  action: string
  assignee?: string
  due_date?: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface GateMeeting {
  id: string
  project_id: string
  gate_type: string
  scheduled_date: string
  actual_date?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  attendees?: Attendee[]
  agenda?: string
  minutes?: string
  decisions?: Decision[]
  action_items?: ActionItem[]
  created_by?: string
  created_by_name?: string
  created_at: string
  updated_at: string
}

interface Props {
  meeting: GateMeeting
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'meeting-updated': [meeting: GateMeeting]
  'action-item-updated': [actionItem: ActionItem, index: number]
}>()

// State
const showEditDialog = ref(false)
const showAttendeesDialog = ref(false)
const showDecisionDialog = ref(false)
const showActionItemDialog = ref(false)
const editingActionItem = ref<number | null>(null)

const editForm = ref({
  scheduled_date: '',
  agenda: ''
})

const actionItemForm = ref({
  action: '',
  assignee: '',
  due_date: '',
  description: '',
  status: 'pending' as ActionItem['status']
})

// Computed
const attendees = computed(() => props.meeting.attendees || [])
const decisions = computed(() => props.meeting.decisions || [])
const actionItems = computed(() => props.meeting.action_items || [])

// Methods
const formatDate = (dateString: string) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-CA')
}

const formatMeetingDate = (meeting: GateMeeting) => {
  if (meeting.actual_date) {
    return `Held on ${formatDate(meeting.actual_date)}`
  }
  return `Scheduled for ${formatDate(meeting.scheduled_date)}`
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default'
    case 'scheduled':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getAttendanceVariant = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'default'
    case 'tentative':
      return 'secondary'
    case 'declined':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getActionItemVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default'
    case 'in_progress':
      return 'secondary'
    case 'pending':
      return 'outline'
    default:
      return 'outline'
  }
}

const editMinutes = () => {
  // Open minutes editor
  console.log('Edit minutes')
}

const markActionItemComplete = (index: number) => {
  const item = { ...actionItems.value[index] }
  item.status = 'completed'
  emit('action-item-updated', item, index)
}

const editActionItem = (index: number) => {
  const item = actionItems.value[index]
  actionItemForm.value = { ...item }
  editingActionItem.value = index
  showActionItemDialog.value = true
}

const saveActionItem = () => {
  const item = { ...actionItemForm.value }
  
  if (editingActionItem.value !== null) {
    emit('action-item-updated', item, editingActionItem.value)
  } else {
    // Add new action item
    emit('action-item-updated', item, -1)
  }
  
  cancelActionItem()
}

const cancelActionItem = () => {
  showActionItemDialog.value = false
  editingActionItem.value = null
  actionItemForm.value = {
    action: '',
    assignee: '',
    due_date: '',
    description: '',
    status: 'pending'
  }
}

const saveMeetingChanges = () => {
  const updatedMeeting = {
    ...props.meeting,
    scheduled_date: editForm.value.scheduled_date,
    agenda: editForm.value.agenda
  }
  
  emit('meeting-updated', updatedMeeting)
  showEditDialog.value = false
}

// Watch for meeting changes
watch(() => props.meeting, (newMeeting) => {
  editForm.value = {
    scheduled_date: newMeeting.scheduled_date,
    agenda: newMeeting.agenda || ''
  }
}, { immediate: true })
</script>

