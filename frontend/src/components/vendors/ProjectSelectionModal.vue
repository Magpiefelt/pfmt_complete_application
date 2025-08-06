<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>Assign {{ vendorName }} to Project</DialogTitle>
        <DialogDescription>
          Select a project to assign this vendor to. You can search by project name or filter by status and phase.
        </DialogDescription>
      </DialogHeader>

      <!-- Search and Filters -->
      <div class="flex-shrink-0 space-y-4 border-b pb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label for="project-search">Search Projects</Label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="project-search"
                v-model="searchTerm"
                placeholder="Search by project name..."
                class="pl-10"
                @input="debouncedSearch"
              />
            </div>
          </div>
          
          <div>
            <Label for="status-filter">Project Status</Label>
            <Select v-model="selectedStatus" @update:model-value="loadProjects">
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="phase-filter">Project Phase</Label>
            <Select v-model="selectedPhase" @update:model-value="loadProjects">
              <SelectTrigger>
                <SelectValue placeholder="All Phases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Phases</SelectItem>
                <SelectItem value="initiation">Initiation</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="execution">Execution</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="closure">Closure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600">
            {{ projects.length }} project{{ projects.length !== 1 ? 's' : '' }} found
          </p>
          <Button variant="outline" @click="clearFilters" size="sm">
            Clear Filters
          </Button>
        </div>
      </div>

      <!-- Project List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <p class="text-red-600 mb-2">{{ error }}</p>
          <Button variant="outline" @click="loadProjects" size="sm">
            Try Again
          </Button>
        </div>

        <!-- Empty State -->
        <div v-else-if="projects.length === 0" class="text-center py-8">
          <FolderOpen class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 mb-2">No projects found</p>
          <p class="text-sm text-gray-400">Try adjusting your search criteria</p>
        </div>

        <!-- Project Cards -->
        <div v-else class="space-y-3 p-1">
          <div
            v-for="project in projects"
            :key="project.id"
            class="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            :class="{
              'ring-2 ring-blue-500 bg-blue-50': selectedProject?.id === project.id
            }"
            @click="selectProject(project)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderOpen class="h-5 w-5 text-green-600" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="text-lg font-medium text-gray-900 truncate">{{ project.project_name }}</h4>
                    <p class="text-sm text-gray-600 truncate">{{ project.program || 'No program specified' }}</p>
                  </div>
                </div>

                <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div class="flex items-center text-gray-600">
                    <MapPin class="h-4 w-4 mr-2 flex-shrink-0" />
                    <span class="truncate">{{ project.geographic_region || 'No region specified' }}</span>
                  </div>
                  <div class="flex items-center text-gray-600">
                    <Calendar class="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{{ project.approval_year || 'No year specified' }}</span>
                  </div>
                  <div class="flex items-center text-gray-600">
                    <Building class="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{{ project.project_type || 'No type specified' }}</span>
                  </div>
                  <div class="flex items-center text-gray-600">
                    <Truck class="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{{ project.delivery_type || 'No delivery type' }}</span>
                  </div>
                </div>

                <div class="mt-2 flex items-center space-x-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusClass(project.project_status)"
                  >
                    {{ formatStatus(project.project_status) }}
                  </span>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getPhaseClass(project.project_phase)"
                  >
                    {{ formatStatus(project.project_phase) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assignment Form -->
      <div v-if="selectedProject" class="flex-shrink-0 border-t pt-4 space-y-4">
        <h4 class="font-medium">Assignment Details for {{ selectedProject.project_name }}</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label for="vendor-role">Role/Specialization *</Label>
            <Select v-model="assignmentData.role" required>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General Contractor">General Contractor</SelectItem>
                <SelectItem value="Architect">Architect</SelectItem>
                <SelectItem value="Engineer">Engineer</SelectItem>
                <SelectItem value="Electrical Contractor">Electrical Contractor</SelectItem>
                <SelectItem value="Plumbing Contractor">Plumbing Contractor</SelectItem>
                <SelectItem value="HVAC Contractor">HVAC Contractor</SelectItem>
                <SelectItem value="Consultant">Consultant</SelectItem>
                <SelectItem value="Supplier">Supplier</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="contract-value">Contract Value</Label>
            <Input
              id="contract-value"
              v-model="assignmentData.contract_value"
              type="number"
              min="0"
              step="1000"
              placeholder="0"
            />
          </div>

          <div>
            <Label for="start-date">Start Date</Label>
            <Input
              id="start-date"
              v-model="assignmentData.start_date"
              type="date"
            />
          </div>

          <div>
            <Label for="end-date">End Date</Label>
            <Input
              id="end-date"
              v-model="assignmentData.end_date"
              type="date"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeModal">
          Cancel
        </Button>
        <Button 
          @click="assignToProject" 
          :disabled="!selectedProject || !assignmentData.role || assigning"
        >
          <div v-if="assigning" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {{ assigning ? 'Assigning...' : 'Assign to Project' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Search, 
  FolderOpen, 
  MapPin, 
  Calendar, 
  Building, 
  Truck 
} from 'lucide-vue-next'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFormat } from '@/composables/useFormat'
import { apiService } from '@/services/apiService'

interface Project {
  id: string
  project_name: string
  project_status: string
  project_phase: string
  program?: string
  geographic_region?: string
  project_type?: string
  delivery_type?: string
  approval_year?: number
}

interface AssignmentData {
  role: string
  contract_value: number | null
  start_date: string
  end_date: string
}

interface Props {
  vendorId: string
  vendorName: string
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'project-assigned': [project: Project, assignmentData: AssignmentData]
}>()

const { formatStatus } = useFormat()

// Local state
const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const assigning = ref(false)
const searchTerm = ref('')
const selectedStatus = ref('')
const selectedPhase = ref('')
const selectedProject = ref<Project | null>(null)
const assignmentData = ref<AssignmentData>({
  role: '',
  contract_value: null,
  start_date: '',
  end_date: ''
})

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Methods
const loadProjects = async () => {
  try {
    loading.value = true
    error.value = null

    const params = new URLSearchParams()
    if (searchTerm.value) params.append('search', searchTerm.value)
    if (selectedStatus.value) params.append('status', selectedStatus.value)
    if (selectedPhase.value) params.append('phase', selectedPhase.value)
    params.append('limit', '50')

    const response = await apiService.get(`/projects?${params.toString()}`)
    
    if (response.success) {
      projects.value = response.data || []
    } else {
      throw new Error(response.error?.message || 'Failed to load projects')
    }
  } catch (err) {
    console.error('Error loading projects:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load projects'
  } finally {
    loading.value = false
  }
}

const debouncedSearch = (() => {
  let timeout: NodeJS.Timeout
  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      loadProjects()
    }, 300)
  }
})()

const selectProject = (project: Project) => {
  selectedProject.value = project
  // Reset assignment data when selecting a new project
  assignmentData.value = {
    role: '',
    contract_value: null,
    start_date: '',
    end_date: ''
  }
}

const assignToProject = async () => {
  if (!selectedProject.value || !assignmentData.value.role) return

  try {
    assigning.value = true
    
    const payload = {
      project_id: selectedProject.value.id,
      role: assignmentData.value.role,
      contract_value: assignmentData.value.contract_value,
      start_date: assignmentData.value.start_date || null,
      end_date: assignmentData.value.end_date || null
    }

    const response = await apiService.post(`/vendors/${props.vendorId}/assign-to-project`, payload)
    
    if (response.success) {
      emit('project-assigned', selectedProject.value, assignmentData.value)
      closeModal()
    } else {
      throw new Error(response.error?.message || 'Failed to assign vendor to project')
    }
  } catch (err) {
    console.error('Error assigning vendor to project:', err)
    error.value = err instanceof Error ? err.message : 'Failed to assign vendor to project'
  } finally {
    assigning.value = false
  }
}

const clearFilters = () => {
  searchTerm.value = ''
  selectedStatus.value = ''
  selectedPhase.value = ''
  loadProjects()
}

const closeModal = () => {
  selectedProject.value = null
  assignmentData.value = {
    role: '',
    contract_value: null,
    start_date: '',
    end_date: ''
  }
  error.value = null
  emit('update:open', false)
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'planning':
      return 'bg-blue-100 text-blue-800'
    case 'on-hold':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPhaseClass = (phase: string) => {
  switch (phase) {
    case 'initiation':
      return 'bg-purple-100 text-purple-800'
    case 'planning':
      return 'bg-blue-100 text-blue-800'
    case 'execution':
      return 'bg-green-100 text-green-800'
    case 'monitoring':
      return 'bg-orange-100 text-orange-800'
    case 'closure':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Watchers
watch(() => props.open, (newValue) => {
  if (newValue) {
    loadProjects()
  }
})

// Lifecycle
onMounted(() => {
  if (props.open) {
    loadProjects()
  }
})
</script>

