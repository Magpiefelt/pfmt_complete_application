<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-600 mb-4">{{ error }}</p>
      <Button variant="outline" @click="loadVendorData">
        Try Again
      </Button>
    </div>

    <!-- Vendor Profile Content -->
    <div v-else-if="vendor" class="space-y-8">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-4">
          <div class="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building class="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">{{ vendor.name }}</h1>
            <p class="text-gray-600 mt-1">{{ vendor.description || 'No description available' }}</p>
            <div class="flex items-center space-x-4 mt-2">
              <span 
                :class="getStatusClass(vendor.status)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ formatStatus(vendor.status) }}
              </span>
              <div v-if="vendor.performance_rating" class="flex items-center space-x-1">
                <Star 
                  v-for="i in 5" 
                  :key="i"
                  :class="i <= vendor.performance_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'"
                  class="h-4 w-4"
                />
                <span class="text-sm text-gray-600 ml-1">({{ vendor.performance_rating }}/5.0)</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex space-x-2">
          <Button variant="outline" @click="editVendor">
            <Edit class="h-4 w-4 mr-2" />
            Edit Vendor
          </Button>
          <Button @click="assignToProject">
            <Plus class="h-4 w-4 mr-2" />
            Assign to Project
          </Button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <FolderOpen class="h-5 w-5 text-blue-600" />
              <div>
                <p class="text-sm font-medium text-gray-600">Active Projects</p>
                <p class="text-2xl font-bold">{{ activeProjectsCount }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <DollarSign class="h-5 w-5 text-green-600" />
              <div>
                <p class="text-sm font-medium text-gray-600">Total Contract Value</p>
                <p class="text-2xl font-bold">{{ formatCurrency(totalContractValue) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <Award class="h-5 w-5 text-purple-600" />
              <div>
                <p class="text-sm font-medium text-gray-600">Certification</p>
                <p class="text-2xl font-bold">{{ vendor.certification_level || 'N/A' }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <Calendar class="h-5 w-5 text-orange-600" />
              <div>
                <p class="text-sm font-medium text-gray-600">Member Since</p>
                <p class="text-2xl font-bold">{{ formatYear(vendor.created_at) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Vendor Details -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Contact Information -->
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div v-if="vendor.contact_email" class="flex items-center space-x-3">
                <Mail class="h-5 w-5 text-gray-400" />
                <div>
                  <p class="text-sm font-medium text-gray-900">Email</p>
                  <a :href="`mailto:${vendor.contact_email}`" class="text-blue-600 hover:text-blue-800">
                    {{ vendor.contact_email }}
                  </a>
                </div>
              </div>

              <div v-if="vendor.contact_phone" class="flex items-center space-x-3">
                <Phone class="h-5 w-5 text-gray-400" />
                <div>
                  <p class="text-sm font-medium text-gray-900">Phone</p>
                  <a :href="`tel:${vendor.contact_phone}`" class="text-blue-600 hover:text-blue-800">
                    {{ vendor.contact_phone }}
                  </a>
                </div>
              </div>

              <div v-if="vendor.website" class="flex items-center space-x-3">
                <Globe class="h-5 w-5 text-gray-400" />
                <div>
                  <p class="text-sm font-medium text-gray-900">Website</p>
                  <a :href="vendor.website" target="_blank" class="text-blue-600 hover:text-blue-800">
                    {{ vendor.website }}
                  </a>
                </div>
              </div>

              <div v-if="vendor.address" class="flex items-center space-x-3">
                <MapPin class="h-5 w-5 text-gray-400" />
                <div>
                  <p class="text-sm font-medium text-gray-900">Address</p>
                  <p class="text-gray-600">{{ vendor.address }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Capabilities -->
          <Card v-if="vendor.capabilities">
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="capability in getCapabilities(vendor.capabilities)"
                  :key="capability"
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {{ capability }}
                </span>
              </div>
            </CardContent>
          </Card>

          <!-- Performance Metrics -->
          <Card v-if="vendor.performance_rating">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">Overall Rating</span>
                    <span class="text-sm text-gray-600">{{ vendor.performance_rating }}/5.0</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="bg-yellow-400 h-2 rounded-full" 
                      :style="{ width: `${(vendor.performance_rating / 5) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Right Column - Projects -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Active Projects -->
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <CardTitle>Project Assignments</CardTitle>
                <Button variant="outline" size="sm" @click="assignToProject">
                  <Plus class="h-4 w-4 mr-2" />
                  Assign to Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <!-- Loading Projects -->
              <div v-if="projectsLoading" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>

              <!-- No Projects -->
              <div v-else-if="projects.length === 0" class="text-center py-8">
                <FolderOpen class="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p class="text-gray-500">No project assignments found</p>
                <Button variant="outline" @click="assignToProject" class="mt-4">
                  Assign to First Project
                </Button>
              </div>

              <!-- Projects List -->
              <div v-else class="space-y-4">
                <div
                  v-for="project in projects"
                  :key="project.assignment_id"
                  class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FolderOpen class="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 class="text-lg font-medium text-gray-900">{{ project.project_name }}</h4>
                          <p class="text-sm text-gray-600">{{ project.program || 'No program specified' }}</p>
                        </div>
                      </div>

                      <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span class="text-gray-500">Role:</span>
                          <span class="ml-1 font-medium">{{ project.role }}</span>
                        </div>
                        <div v-if="project.contract_value">
                          <span class="text-gray-500">Contract Value:</span>
                          <span class="ml-1 font-medium">{{ formatCurrency(project.contract_value) }}</span>
                        </div>
                        <div v-if="project.start_date">
                          <span class="text-gray-500">Start Date:</span>
                          <span class="ml-1 font-medium">{{ formatDate(project.start_date) }}</span>
                        </div>
                        <div v-if="project.end_date">
                          <span class="text-gray-500">End Date:</span>
                          <span class="ml-1 font-medium">{{ formatDate(project.end_date) }}</span>
                        </div>
                      </div>

                      <div class="mt-2 flex items-center space-x-4">
                        <span
                          :class="getStatusClass(project.project_status)"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        >
                          {{ formatStatus(project.project_status) }}
                        </span>
                        <span
                          :class="getPhaseClass(project.project_phase)"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        >
                          {{ formatStatus(project.project_phase) }}
                        </span>
                        <span
                          :class="getAssignmentStatusClass(project.assignment_status)"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        >
                          {{ formatStatus(project.assignment_status) }}
                        </span>
                      </div>
                    </div>

                    <div class="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal class="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem @click="viewProject(project)">
                            <Eye class="h-4 w-4 mr-2" />
                            View Project
                          </DropdownMenuItem>
                          <DropdownMenuItem @click="editAssignment(project)">
                            <Edit class="h-4 w-4 mr-2" />
                            Edit Assignment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            @click="removeFromProject(project)"
                            class="text-red-600"
                          >
                            <UserMinus class="h-4 w-4 mr-2" />
                            Remove from Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Project Assignment Modal -->
    <ProjectSelectionModal
      v-model:open="showProjectAssignmentModal"
      :vendor-id="vendorId"
      :vendor-name="vendor?.name || ''"
      @project-assigned="handleProjectAssigned"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Building, 
  Edit, 
  Plus, 
  FolderOpen, 
  DollarSign, 
  Award, 
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  Eye,
  MoreHorizontal,
  UserMinus
} from 'lucide-vue-next'
import { Button } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui"
import { useFormat } from '@/composables/useFormat'
import { apiService } from '@/services/apiService'
import ProjectSelectionModal from '@/components/vendors/ProjectSelectionModal.vue'

interface Vendor {
  id: string
  name: string
  description?: string
  capabilities?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  address?: string
  certification_level?: string
  performance_rating?: number
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
}

interface VendorProject {
  assignment_id: string
  role: string
  contract_value?: number
  start_date?: string
  end_date?: string
  assignment_status: string
  project_id: string
  project_name: string
  project_status: string
  project_phase: string
  program?: string
  geographic_region?: string
  project_type?: string
}

const route = useRoute()
const router = useRouter()
const { formatCurrency, formatDate, formatStatus } = useFormat()

// State
const vendor = ref<Vendor | null>(null)
const projects = ref<VendorProject[]>([])
const loading = ref(false)
const projectsLoading = ref(false)
const error = ref<string | null>(null)
const showProjectAssignmentModal = ref(false)

// Computed
const vendorId = computed(() => route.params.id as string)

const activeProjectsCount = computed(() => 
  projects.value.filter(p => p.assignment_status === 'active').length
)

const totalContractValue = computed(() => 
  projects.value.reduce((sum, project) => sum + (project.contract_value || 0), 0)
)

// Methods
const loadVendorData = async () => {
  try {
    loading.value = true
    error.value = null

    const [vendorResponse, projectsResponse] = await Promise.all([
      apiService.get(`/vendors/${vendorId.value}`),
      loadVendorProjects()
    ])

    if (vendorResponse.success) {
      vendor.value = vendorResponse.data
    } else {
      throw new Error(vendorResponse.error?.message || 'Failed to load vendor')
    }
  } catch (err) {
    console.error('Error loading vendor data:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load vendor data'
  } finally {
    loading.value = false
  }
}

const loadVendorProjects = async () => {
  try {
    projectsLoading.value = true

    const response = await apiService.get(`/vendors/${vendorId.value}/projects`)
    
    if (response.success) {
      projects.value = response.data || []
    } else {
      throw new Error(response.error?.message || 'Failed to load vendor projects')
    }
  } catch (err) {
    console.error('Error loading vendor projects:', err)
  } finally {
    projectsLoading.value = false
  }
}

const editVendor = () => {
  // TODO: Implement edit vendor functionality
  console.log('Edit vendor:', vendor.value)
}

const assignToProject = () => {
  showProjectAssignmentModal.value = true
}

const viewProject = (project: VendorProject) => {
  router.push(`/projects/${project.project_id}`)
}

const editAssignment = (project: VendorProject) => {
  // TODO: Implement edit assignment functionality
  console.log('Edit assignment:', project)
}

const removeFromProject = async (project: VendorProject) => {
  if (!confirm(`Are you sure you want to remove this vendor from ${project.project_name}?`)) {
    return
  }

  try {
    const response = await apiService.delete(`/projects/${project.project_id}/vendors/${vendorId.value}`)
    
    if (response.success) {
      loadVendorProjects() // Refresh the projects list
    } else {
      throw new Error(response.error?.message || 'Failed to remove vendor from project')
    }
  } catch (err) {
    console.error('Error removing vendor from project:', err)
    error.value = err instanceof Error ? err.message : 'Failed to remove vendor from project'
  }
}

const handleProjectAssigned = () => {
  loadVendorProjects() // Refresh the projects list
}

const getCapabilities = (capabilities: string): string[] => {
  if (!capabilities) return []
  return capabilities.split(',').map(cap => cap.trim()).filter(Boolean)
}

const formatYear = (dateString: string): string => {
  return new Date(dateString).getFullYear().toString()
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
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
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

const getAssignmentStatusClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Lifecycle
onMounted(() => {
  loadVendorData()
})
</script>

