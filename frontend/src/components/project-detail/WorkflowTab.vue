<template>
  <div class="space-y-6">
    <!-- Workflow Header -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Project Workflow</h3>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-500">Status:</span>
          <span :class="getWorkflowStatusClass(workflowStatus)" class="px-2 py-1 rounded-full text-xs font-medium">
            {{ workflowStatus }}
          </span>
        </div>
      </div>
      
      <!-- Workflow Progress -->
      <div class="mb-6">
        <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Workflow Progress</span>
          <span>{{ completedTasks }}/{{ totalTasks }} tasks completed</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${workflowProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div v-if="canEdit" class="flex flex-wrap gap-2">
        <button
          @click="showCreateTaskModal = true"
          class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Task
        </button>
        <button
          @click="showScheduleMeetingModal = true"
          class="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
        >
          Schedule Meeting
        </button>
        <button
          @click="refreshWorkflow"
          class="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Workflow Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Active Tasks -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h4 class="text-md font-semibold text-gray-900 mb-4">Active Tasks</h4>
        
        <div v-if="loading" class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        
        <div v-else-if="activeTasks.length === 0" class="text-center py-4 text-gray-500">
          No active tasks
        </div>
        
        <div v-else class="space-y-3">
          <div
            v-for="task in activeTasks"
            :key="task.id"
            class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between mb-2">
              <h5 class="font-medium text-gray-900">{{ task.title }}</h5>
              <span :class="getTaskPriorityClass(task.priority)" class="px-2 py-1 rounded text-xs font-medium">
                {{ task.priority }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-2">{{ task.description }}</p>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>Due: {{ formatDate(task.dueDate) }}</span>
              <span>Assigned to: {{ task.assignedTo }}</span>
            </div>
            <div v-if="canEdit" class="mt-3 flex space-x-2">
              <button
                @click="completeTask(task.id)"
                class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
              >
                Complete
              </button>
              <button
                @click="editTask(task)"
                class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Meetings -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h4 class="text-md font-semibold text-gray-900 mb-4">Upcoming Meetings</h4>
        
        <div v-if="upcomingMeetings.length === 0" class="text-center py-4 text-gray-500">
          No upcoming meetings
        </div>
        
        <div v-else class="space-y-3">
          <div
            v-for="meeting in upcomingMeetings"
            :key="meeting.id"
            class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between mb-2">
              <h5 class="font-medium text-gray-900">{{ meeting.gate_type }}</h5>
              <span :class="getMeetingStatusClass(meeting.planned_date)" class="px-2 py-1 rounded text-xs font-medium">
                {{ getMeetingStatus(meeting.planned_date) }}
              </span>
            </div>
            <div class="text-sm text-gray-600 mb-2">
              <p>Date: {{ formatMeetingDate(meeting.planned_date) }}</p>
              <p v-if="meeting.agenda">Agenda: {{ meeting.agenda }}</p>
            </div>
            <div v-if="canEdit" class="mt-3 flex space-x-2">
              <button
                @click="completeMeeting(meeting.id)"
                class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
              >
                Complete
              </button>
              <button
                @click="rescheduleMeeting(meeting.id)"
                class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded hover:bg-yellow-200 transition-colors"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h4 class="text-md font-semibold text-gray-900 mb-4">Recent Workflow Activity</h4>
      
      <div v-if="recentActivity.length === 0" class="text-center py-4 text-gray-500">
        No recent activity
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="activity in recentActivity"
          :key="activity.id"
          class="flex items-start space-x-3 p-3 border rounded-lg"
        >
          <div class="flex-shrink-0">
            <div :class="getActivityIconClass(activity.type)" class="w-8 h-8 rounded-full flex items-center justify-center">
              <span class="text-xs font-medium">{{ getActivityIcon(activity.type) }}</span>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900">{{ activity.description }}</p>
            <p class="text-xs text-gray-500">{{ formatDate(activity.createdAt) }} by {{ activity.user }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-700">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWorkflow } from '@/composables/useWorkflow'
import { useGateMeetings } from '@/composables/useGateMeetings'

interface Props {
  projectId: string
  canEdit: boolean
  userRole: string
}

const props = defineProps<Props>()

// Composables
const { 
  tasks, 
  loading, 
  error, 
  fetchProjectTasks, 
  createTask, 
  updateTask, 
  completeTask: completeWorkflowTask,
  getTasksByStatus 
} = useWorkflow()

const {
  upcomingMeetings,
  formatMeetingDate,
  getMeetingStatus,
  getMeetingStatusClass,
  fetchProjectMeetings,
  completeMeeting: completeGateMeeting,
  rescheduleMeeting: rescheduleGateMeeting
} = useGateMeetings()

// Local state
const showCreateTaskModal = ref(false)
const showScheduleMeetingModal = ref(false)
const recentActivity = ref<any[]>([])

// Computed properties
const activeTasks = computed(() => getTasksByStatus('active'))
const completedTasks = computed(() => getTasksByStatus('completed').length)
const totalTasks = computed(() => tasks.value.length)
const workflowProgress = computed(() => 
  totalTasks.value > 0 ? Math.round((completedTasks.value / totalTasks.value) * 100) : 0
)
const workflowStatus = computed(() => {
  if (workflowProgress.value === 100) return 'Completed'
  if (workflowProgress.value >= 75) return 'Nearly Complete'
  if (workflowProgress.value >= 50) return 'In Progress'
  if (workflowProgress.value >= 25) return 'Getting Started'
  return 'Not Started'
})

// Methods
const refreshWorkflow = async () => {
  await Promise.all([
    fetchProjectTasks(props.projectId),
    fetchProjectMeetings(props.projectId)
  ])
}

const completeTask = async (taskId: string) => {
  try {
    await completeWorkflowTask(taskId)
    await refreshWorkflow()
  } catch (err) {
    console.error('Failed to complete task:', err)
  }
}

const editTask = async (task: any) => {
  const newTitle = prompt('Edit task title', task.title)
  if (!newTitle || newTitle === task.title) return

  try {
    await updateTask(task.id, { ...task, title: newTitle })
    await refreshWorkflow()
  } catch (err) {
    console.error('Failed to update task:', err)
  }
}

const completeMeeting = async (meetingId: string) => {
  try {
    await completeGateMeeting(meetingId, {
      actual_date: new Date().toISOString(),
      decision: 'Approved',
      notes: 'Meeting completed successfully'
    })
    await refreshWorkflow()
  } catch (err) {
    console.error('Failed to complete meeting:', err)
  }
}

const rescheduleMeeting = async (meetingId: string) => {
  const newDate = prompt('Enter new meeting date (YYYY-MM-DD)')
  if (!newDate) return

  try {
    await rescheduleGateMeeting(meetingId, { scheduled_date: newDate })
    await refreshWorkflow()
  } catch (err) {
    console.error('Failed to reschedule meeting:', err)
  }
}

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getWorkflowStatusClass = (status: string) => {
  const classes = {
    'Completed': 'bg-green-100 text-green-800',
    'Nearly Complete': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Getting Started': 'bg-orange-100 text-orange-800',
    'Not Started': 'bg-gray-100 text-gray-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getTaskPriorityClass = (priority: string) => {
  const classes = {
    'High': 'bg-red-100 text-red-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800'
  }
  return classes[priority as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getActivityIconClass = (type: string) => {
  const classes = {
    'task_completed': 'bg-green-100 text-green-600',
    'meeting_scheduled': 'bg-blue-100 text-blue-600',
    'meeting_completed': 'bg-purple-100 text-purple-600',
    'task_created': 'bg-yellow-100 text-yellow-600'
  }
  return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-600'
}

const getActivityIcon = (type: string) => {
  const icons = {
    'task_completed': '✓',
    'meeting_scheduled': '📅',
    'meeting_completed': '✅',
    'task_created': '+'
  }
  return icons[type as keyof typeof icons] || '•'
}

// Lifecycle
onMounted(() => {
  refreshWorkflow()
})
</script>

