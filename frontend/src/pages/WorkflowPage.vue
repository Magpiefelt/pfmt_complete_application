<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <AlbertaText tag="h1" size="heading-xl" mb="xs">Workflow Management</AlbertaText>
        <AlbertaText color="secondary">Manage tasks, gate meetings, and approval workflows</AlbertaText>
      </div>
      <div class="flex space-x-2">
        <Button @click="showCreateTaskModal = true" variant="outline">
          <Plus class="h-4 w-4 mr-2" />
          New Task
        </Button>
        <Button @click="showCreateMeetingModal = true">
          <Calendar class="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>
    </div>

    <!-- Workflow Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-4">
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="meetings">Gate Meetings</TabsTrigger>
        <TabsTrigger value="approvals">Approvals</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>

      <!-- Tasks Tab -->
      <TabsContent value="tasks" class="space-y-6">
        <!-- Task Filters -->
        <Card>
          <CardContent class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label for="taskProject">Project</Label>
                <select
                  id="taskProject"
                  v-model="taskFilters.projectId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Projects</option>
                  <option v-for="project in projects" :key="project.id" :value="project.id">
                    {{ project.name }}
                  </option>
                </select>
              </div>
              <div>
                <Label for="taskStatus">Status</Label>
                <select
                  id="taskStatus"
                  v-model="taskFilters.status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <Label for="taskPriority">Priority</Label>
                <select
                  id="taskPriority"
                  v-model="taskFilters.priority"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <Label for="taskAssignee">Assignee</Label>
                <select
                  id="taskAssignee"
                  v-model="taskFilters.assigneeId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Assignees</option>
                  <option v-for="user in users" :key="user.id" :value="user.id">
                    {{ user.first_name }} {{ user.last_name }}
                  </option>
                </select>
              </div>
              <div class="flex items-end">
                <Button @click="clearTaskFilters" variant="outline" class="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Tasks List -->
        <div class="space-y-4">
          <Card v-for="task in filteredTasks" :key="task.id" class="hover:shadow-md transition-shadow">
            <CardContent class="p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <h3 class="font-semibold text-lg">{{ task.title }}</h3>
                    <span 
                      :class="getTaskStatusBadgeClass(task.status)"
                      class="px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {{ task.status.replace('_', ' ').toUpperCase() }}
                    </span>
                    <span 
                      :class="getTaskPriorityBadgeClass(task.priority)"
                      class="px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {{ task.priority.toUpperCase() }}
                    </span>
                  </div>
                  <p class="text-gray-600 mb-3">{{ task.description }}</p>
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <div class="flex items-center space-x-1">
                      <Building class="h-4 w-4" />
                      <span>{{ getProjectName(task.projectId) }}</span>
                    </div>
                    <div class="flex items-center space-x-1">
                      <User class="h-4 w-4" />
                      <span>{{ getUserName(task.assigneeId) }}</span>
                    </div>
                    <div class="flex items-center space-x-1">
                      <Calendar class="h-4 w-4" />
                      <span>Due: {{ formatDate(task.dueDate) }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <Button @click="editTask(task)" variant="outline" size="sm">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button @click="updateTaskStatus(task)" size="sm">
                    <CheckCircle class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTasks.length === 0" class="text-center py-12">
          <CheckCircle class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <AlbertaText size="heading-m" color="secondary" mb="xs">No tasks found</AlbertaText>
          <AlbertaText color="secondary">Create a new task or adjust your filters.</AlbertaText>
        </div>
      </TabsContent>

      <!-- Gate Meetings Tab -->
      <TabsContent value="meetings" class="space-y-6">
        <!-- Meetings Calendar View -->
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Gate Meetings</CardTitle>
            <CardDescription>Scheduled project milestone meetings and reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div v-for="meeting in upcomingMeetings" :key="meeting.id" class="border rounded-lg p-4">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-semibold text-lg">{{ meeting.title }}</h3>
                    <p class="text-gray-600 mb-2">{{ meeting.description }}</p>
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                      <div class="flex items-center space-x-1">
                        <Calendar class="h-4 w-4" />
                        <span>{{ formatDateTime(meeting.scheduledDate) }}</span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <MapPin class="h-4 w-4" />
                        <span>{{ meeting.location || 'Virtual' }}</span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <Users class="h-4 w-4" />
                        <span>{{ meeting.attendees?.length || 0 }} attendees</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <Button @click="viewMeeting(meeting)" variant="outline" size="sm">
                      <Eye class="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button @click="editMeeting(meeting)" variant="outline" size="sm">
                      <Edit class="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Approvals Tab -->
      <TabsContent value="approvals" class="space-y-6">
        <!-- Pending Approvals -->
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Items requiring your approval or review</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div v-for="approval in pendingApprovals" :key="approval.id" class="border rounded-lg p-4">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-semibold text-lg">{{ approval.title }}</h3>
                    <p class="text-gray-600 mb-2">{{ approval.description }}</p>
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                      <div class="flex items-center space-x-1">
                        <Building class="h-4 w-4" />
                        <span>{{ getProjectName(approval.projectId) }}</span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <User class="h-4 w-4" />
                        <span>Requested by: {{ getUserName(approval.requestedBy) }}</span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <Clock class="h-4 w-4" />
                        <span>{{ formatDate(approval.requestedDate) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <Button @click="approveItem(approval)" variant="outline" size="sm" class="text-green-600 border-green-600">
                      <CheckCircle class="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button @click="rejectItem(approval)" variant="outline" size="sm" class="text-red-600 border-red-600">
                      <XCircle class="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Timeline Tab -->
      <TabsContent value="timeline" class="space-y-6">
        <!-- Project Timeline -->
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
            <CardDescription>Visual timeline of project milestones and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <div v-for="event in timelineEvents" :key="event.id" class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                  <div 
                    :class="getTimelineEventClass(event.type)"
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    <component :is="getTimelineIcon(event.type)" class="h-4 w-4 text-white" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold">{{ event.title }}</h3>
                    <span class="text-sm text-gray-500">{{ formatDate(event.date) }}</span>
                  </div>
                  <p class="text-gray-600">{{ event.description }}</p>
                  <div class="text-sm text-gray-500 mt-1">
                    {{ getProjectName(event.projectId) }}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- Create Task Modal -->
    <div v-if="showCreateTaskModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Create New Task</h2>
          <Button @click="showCreateTaskModal = false" variant="outline" size="sm">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <form @submit.prevent="createTask" class="space-y-4">
          <div>
            <Label for="taskTitle">Task Title *</Label>
            <input
              id="taskTitle"
              v-model="taskForm.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label for="taskDescription">Description</Label>
            <textarea
              id="taskDescription"
              v-model="taskForm.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label for="taskProjectSelect">Project *</Label>
              <select
                id="taskProjectSelect"
                v-model="taskForm.projectId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Project</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">
                  {{ project.name }}
                </option>
              </select>
            </div>
            <div>
              <Label for="taskAssigneeSelect">Assignee *</Label>
              <select
                id="taskAssigneeSelect"
                v-model="taskForm.assigneeId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Assignee</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.first_name }} {{ user.last_name }}
                </option>
              </select>
            </div>
            <div>
              <Label for="taskPrioritySelect">Priority</Label>
              <select
                id="taskPrioritySelect"
                v-model="taskForm.priority"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <Label for="taskDueDate">Due Date</Label>
            <input
              id="taskDueDate"
              v-model="taskForm.dueDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="flex justify-end space-x-2 pt-4">
            <Button @click="showCreateTaskModal = false" variant="outline" type="button">
              Cancel
            </Button>
            <Button type="submit">
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </div>

    <!-- Create Meeting Modal -->
    <div v-if="showCreateMeetingModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Schedule Gate Meeting</h2>
          <Button @click="showCreateMeetingModal = false" variant="outline" size="sm">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <form @submit.prevent="createMeeting" class="space-y-4">
          <div>
            <Label for="meetingTitle">Meeting Title *</Label>
            <input
              id="meetingTitle"
              v-model="meetingForm.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label for="meetingDescription">Description</Label>
            <textarea
              id="meetingDescription"
              v-model="meetingForm.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="meetingProject">Project *</Label>
              <select
                id="meetingProject"
                v-model="meetingForm.projectId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Project</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">
                  {{ project.name }}
                </option>
              </select>
            </div>
            <div>
              <Label for="meetingType">Meeting Type</Label>
              <select
                id="meetingType"
                v-model="meetingForm.type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gate_0">Gate 0 - Project Initiation</option>
                <option value="gate_1">Gate 1 - Concept</option>
                <option value="gate_2">Gate 2 - Planning</option>
                <option value="gate_3">Gate 3 - Implementation</option>
                <option value="gate_4">Gate 4 - Closeout</option>
                <option value="review">Project Review</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="meetingDate">Date *</Label>
              <input
                id="meetingDate"
                v-model="meetingForm.date"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label for="meetingTime">Time *</Label>
              <input
                id="meetingTime"
                v-model="meetingForm.time"
                type="time"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <Label for="meetingLocation">Location</Label>
            <input
              id="meetingLocation"
              v-model="meetingForm.location"
              type="text"
              placeholder="Meeting room or virtual link"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="flex justify-end space-x-2 pt-4">
            <Button @click="showCreateMeetingModal = false" variant="outline" type="button">
              Cancel
            </Button>
            <Button type="submit">
              Schedule Meeting
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Plus, Calendar, Edit, CheckCircle, Building, User, Users, Eye, 
  MapPin, Clock, XCircle, X
} from 'lucide-vue-next'
import { Button, AlbertaText } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { Label } from '@/components/ui'
import { ProjectAPI, UserAPI } from '@/services/apiService'

// Reactive state
const activeTab = ref('tasks')
const loading = ref(false)
const error = ref('')

// Data
const projects = ref([])
const users = ref([])
const tasks = ref([])
const meetings = ref([])
const approvals = ref([])
const timelineEvents = ref([])

// Modals
const showCreateTaskModal = ref(false)
const showCreateMeetingModal = ref(false)

// Filters
const taskFilters = ref({
  projectId: '',
  status: '',
  priority: '',
  assigneeId: ''
})

// Forms
const taskForm = ref({
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  priority: 'medium',
  dueDate: ''
})

const meetingForm = ref({
  title: '',
  description: '',
  projectId: '',
  type: 'review',
  date: '',
  time: '',
  location: ''
})

// Computed properties
const filteredTasks = computed(() => {
  let filtered = tasks.value

  if (taskFilters.value.projectId) {
    filtered = filtered.filter(task => task.projectId === taskFilters.value.projectId)
  }
  if (taskFilters.value.status) {
    filtered = filtered.filter(task => task.status === taskFilters.value.status)
  }
  if (taskFilters.value.priority) {
    filtered = filtered.filter(task => task.priority === taskFilters.value.priority)
  }
  if (taskFilters.value.assigneeId) {
    filtered = filtered.filter(task => task.assigneeId === taskFilters.value.assigneeId)
  }

  return filtered
})

const upcomingMeetings = computed(() => {
  return meetings.value.filter(meeting => new Date(meeting.scheduledDate) >= new Date())
})

const pendingApprovals = computed(() => {
  return approvals.value.filter(approval => approval.status === 'pending')
})

// Methods
const loadData = async () => {
  loading.value = true
  try {
    // Load projects
    const projectsResponse = await ProjectAPI.getProjects()
    if (projectsResponse.success && projectsResponse.data?.projects) {
      projects.value = projectsResponse.data.projects
    }

    // Load users
    const usersResponse = await UserAPI.getUsers()
    if (usersResponse.success) {
      users.value = usersResponse.data
    }

    // Load sample data for demo
    loadSampleData()
  } catch (err) {
    error.value = 'Failed to load data'
    console.error('Error loading data:', err)
  } finally {
    loading.value = false
  }
}

const loadSampleData = () => {
  // Sample tasks
  tasks.value = [
    {
      id: 1,
      title: 'Review architectural drawings',
      description: 'Review and approve the latest architectural drawings for the justice centre',
      projectId: projects.value[0]?.id || '1',
      assigneeId: users.value[0]?.id || '1',
      status: 'pending',
      priority: 'high',
      dueDate: '2025-08-15'
    },
    {
      id: 2,
      title: 'Vendor selection for HVAC',
      description: 'Complete vendor selection process for HVAC systems',
      projectId: projects.value[0]?.id || '1',
      assigneeId: users.value[1]?.id || '2',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2025-08-20'
    }
  ]

  // Sample meetings
  meetings.value = [
    {
      id: 1,
      title: 'Gate 2 Planning Review',
      description: 'Review planning phase deliverables and approve progression to implementation',
      projectId: projects.value[0]?.id || '1',
      type: 'gate_2',
      scheduledDate: '2025-08-10T10:00:00',
      location: 'Conference Room A',
      attendees: ['1', '2', '3']
    }
  ]

  // Sample approvals
  approvals.value = [
    {
      id: 1,
      title: 'Budget Increase Request',
      description: 'Request for additional $500K for site preparation',
      projectId: projects.value[0]?.id || '1',
      requestedBy: users.value[0]?.id || '1',
      requestedDate: '2025-08-01',
      status: 'pending'
    }
  ]

  // Sample timeline events
  timelineEvents.value = [
    {
      id: 1,
      title: 'Project Initiated',
      description: 'Red Deer Justice Centre project officially started',
      projectId: projects.value[0]?.id || '1',
      type: 'milestone',
      date: '2024-01-15'
    },
    {
      id: 2,
      title: 'Design Phase Completed',
      description: 'Architectural and engineering designs finalized',
      projectId: projects.value[0]?.id || '1',
      type: 'milestone',
      date: '2024-06-30'
    }
  ]
}

const getTaskStatusBadgeClass = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'overdue':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTaskPriorityBadgeClass = (priority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTimelineEventClass = (type) => {
  switch (type) {
    case 'milestone':
      return 'bg-blue-500'
    case 'meeting':
      return 'bg-green-500'
    case 'approval':
      return 'bg-purple-500'
    default:
      return 'bg-gray-500'
  }
}

const getTimelineIcon = (type) => {
  switch (type) {
    case 'milestone':
      return CheckCircle
    case 'meeting':
      return Calendar
    case 'approval':
      return User
    default:
      return Building
  }
}

const getProjectName = (projectId) => {
  const project = projects.value.find(p => p.id === projectId)
  return project?.name || project?.project_name || 'Unknown Project'
}

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user ? `${user.first_name} ${user.last_name}` : 'Unknown User'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString()
}

const clearTaskFilters = () => {
  taskFilters.value = {
    projectId: '',
    status: '',
    priority: '',
    assigneeId: ''
  }
}

const editTask = (task) => {
  // TODO: Implement task editing
  console.log('Edit task:', task)
}

const updateTaskStatus = (task) => {
  // TODO: Implement task status update
  console.log('Update task status:', task)
}

const viewMeeting = (meeting) => {
  // TODO: Implement meeting view
  console.log('View meeting:', meeting)
}

const editMeeting = (meeting) => {
  // TODO: Implement meeting editing
  console.log('Edit meeting:', meeting)
}

const approveItem = (approval) => {
  // TODO: Implement approval
  console.log('Approve:', approval)
}

const rejectItem = (approval) => {
  // TODO: Implement rejection
  console.log('Reject:', approval)
}

const createTask = () => {
  // TODO: Implement task creation
  console.log('Create task:', taskForm.value)
  showCreateTaskModal.value = false
}

const createMeeting = () => {
  // TODO: Implement meeting creation
  console.log('Create meeting:', meetingForm.value)
  showCreateMeetingModal.value = false
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

