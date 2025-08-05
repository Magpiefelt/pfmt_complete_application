<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-2">
        Welcome back, {{ currentUser.name }}
      </h1>
      <p class="text-muted-foreground">
        {{ currentUser.role === 'Vendor' ? 
          'Manage your project submissions and track progress.' :
          'Access your project management tools and resources.'
        }}
      </p>
    </div>

    <!-- Navigation Tiles -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card 
        v-for="tile in visibleTiles" 
        :key="tile.title"
        class="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        @click="handleTileClick(tile.path, tile.filter)"
      >
        <CardHeader class="pb-3">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-primary/10 rounded-lg">
              <component :is="tile.icon" class="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle class="text-lg">{{ tile.title }}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground text-sm">{{ tile.description }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Stats (if user has projects) -->
    <div v-if="currentUser.role !== 'Vendor'" class="mt-12">
      <h2 class="text-xl font-semibold mb-6">Quick Overview</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.activeProjects }}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatCurrency(stats.totalBudget) }}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-muted-foreground">Reports Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.reportsDue }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-muted-foreground">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ upcomingMeetings.length }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- Upcoming Gate Meetings Widget -->
      <div v-if="upcomingMeetings.length > 0" class="mt-8">
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Calendar class="h-5 w-5" />
                <CardTitle>Upcoming Gate Meetings</CardTitle>
              </div>
              <Button variant="outline" size="sm" @click="$router.push('/workflow')">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="meeting in upcomingMeetings.slice(0, 5)"
                :key="meeting.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                @click="navigateToProject(meeting.project_id)"
              >
                <div class="flex-1">
                  <div class="font-medium text-gray-900">{{ meeting.gate_type }}</div>
                  <div class="text-sm text-gray-600">{{ meeting.project_name }}</div>
                  <div class="text-xs text-gray-500">{{ formatMeetingDate(meeting.planned_date) }}</div>
                </div>
                <div class="flex items-center space-x-2">
                  <span 
                    :class="getMeetingStatusClass(meeting.planned_date)"
                    class="px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ getMeetingStatus(meeting.planned_date) }}
                  </span>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { useAuth } from '@/composables/useAuth'
import { 
  FolderOpen, 
  Plus, 
  Upload,
  FileText, 
  Settings, 
  BarChart3,
  Building,
  Users,
  GitBranch,
  Calendar
} from 'lucide-vue-next'

interface NavigationTile {
  title: string
  description: string
  path: string
  filter?: string
  roles: string[]
  icon: any
}

const router = useRouter()
const { currentUser } = useAuth()

const stats = ref({
  activeProjects: 12,
  totalBudget: 45000000,
  reportsDue: 3
})

// Upcoming gate meetings data
const upcomingMeetings = ref([])

// Load upcoming gate meetings
const loadUpcomingMeetings = async () => {
  try {
    const response = await fetch('/api/gate-meetings/upcoming')
    const data = await response.json()
    
    if (data.success) {
      // Filter based on user role
      const userRoleKey = roleMap[currentUser.value.role] || 'vendor'
      if (userRoleKey === 'director') {
        // Directors see all upcoming meetings
        upcomingMeetings.value = data.data
      } else {
        // PMs/SPMs see only their project meetings
        upcomingMeetings.value = data.data.filter(meeting => 
          meeting.project_manager_id === currentUser.value.id
        )
      }
    }
  } catch (error) {
    console.error('Error loading upcoming meetings:', error)
  }
}

// Navigate to project detail page
const navigateToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`)
}

// Format meeting date
const formatMeetingDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `In ${diffDays} days`
  
  return date.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

// Get meeting status based on date
const getMeetingStatus = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Today'
  if (diffDays <= 3) return 'Soon'
  return 'Upcoming'
}

// Get meeting status CSS class
const getMeetingStatusClass = (dateString: string) => {
  const status = getMeetingStatus(dateString)
  switch (status) {
    case 'Overdue':
      return 'bg-red-100 text-red-800'
    case 'Today':
      return 'bg-orange-100 text-orange-800'
    case 'Soon':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

const navigationTiles: NavigationTile[] = [
  { 
    title: 'My Projects', 
    description: 'View and manage your assigned projects', 
    path: '/projects',
    filter: 'my',
    roles: ['pm', 'spm', 'director', 'admin'],
    icon: FolderOpen
  },
  { 
    title: 'All Projects', 
    description: 'Browse all projects in the system', 
    path: '/projects',
    filter: 'all',
    roles: ['spm', 'director', 'admin'],
    icon: Building
  },
  { 
    title: 'Vendor Management', 
    description: 'Manage vendor profiles and assignments', 
    path: '/vendors',
    roles: ['pm', 'spm', 'director', 'admin'],
    icon: Users
  },
  { 
    title: 'Workflow Management', 
    description: 'Manage tasks, meetings, and approvals', 
    path: '/workflow',
    roles: ['pm', 'spm', 'director', 'admin'],
    icon: GitBranch
  },
  { 
    title: 'Create New Project', 
    description: 'Start a new project with guided setup wizard', 
    path: '/projects/new',
    roles: ['pm', 'spm', 'director', 'admin'],
    icon: Plus
  },
  { 
    title: 'Reporting', 
    description: 'Generate and view project reports', 
    path: '/reports',
    roles: ['pm', 'spm', 'director', 'admin'],
    icon: FileText
  },
  { 
    title: 'Analytics', 
    description: 'View project analytics and insights', 
    path: '/analytics',
    roles: ['spm', 'director', 'admin'],
    icon: BarChart3
  },
  { 
    title: 'Settings', 
    description: 'Manage your account and preferences', 
    path: '/settings',
    roles: ['pm', 'spm', 'director', 'admin', 'vendor'],
    icon: Settings
  }
]

const roleMap: Record<string, string> = {
  'Project Manager': 'pm',
  'Senior Project Manager': 'spm',
  'Director': 'director',
  'Vendor': 'vendor'
}

const visibleTiles = computed(() => {
  const userRoleKey = roleMap[currentUser.value.role] || 'vendor'
  return navigationTiles.filter(tile => 
    tile.roles.includes(userRoleKey)
  )
})

const handleTileClick = (path: string, filter?: string) => {
  if (filter) {
    router.push(`${path}?filter=${filter}`)
  } else {
    router.push(path)
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Load data on component mount
onMounted(() => {
  loadUpcomingMeetings()
})
</script>

