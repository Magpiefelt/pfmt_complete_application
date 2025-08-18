<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Vendor Management</h1>
        <p class="text-gray-600">Manage vendor profiles, capabilities, and project assignments</p>
      </div>
      <Button @click="showAddVendorModal = true" class="flex items-center space-x-2">
        <Plus class="h-4 w-4" />
        <span>Add Vendor</span>
      </Button>
    </div>

    <!-- Search and Filters -->
    <Card class="mb-6">
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label for="search">Search Vendors</Label>
            <Input
              id="search"
              v-model="searchTerm"
              type="text"
              placeholder="Search by name or capability..."
              @input="debouncedSearch"
            />
          </div>
          <div>
            <Label for="capability">Capability</Label>
            <Select v-model="selectedCapability" @update:model-value="loadVendors">
              <SelectTrigger>
                <SelectValue placeholder="All Capabilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Capabilities</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="architecture">Architecture</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label for="status">Status</Label>
            <Select v-model="selectedStatus" @update:model-value="loadVendors">
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-end">
            <Button @click="clearFilters" variant="outline" class="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600 mb-2">{{ error }}</p>
      <Button variant="outline" @click="loadVendors">
        Try Again
      </Button>
    </div>

    <!-- Vendors Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="vendor in vendors" :key="vendor.id" class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <CardTitle class="text-lg">{{ vendor.name }}</CardTitle>
              <CardDescription>{{ vendor.description || 'No description available' }}</CardDescription>
            </div>
            <span 
              :class="getStatusBadgeClass(vendor.status)"
              class="px-2 py-1 rounded-full text-xs font-medium"
            >
              {{ formatStatus(vendor.status) }}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <!-- Contact Info -->
            <div v-if="vendor.contact_email" class="flex items-center space-x-2 text-sm text-gray-600">
              <Mail class="h-4 w-4" />
              <span class="truncate">{{ vendor.contact_email }}</span>
            </div>
            <div v-if="vendor.contact_phone" class="flex items-center space-x-2 text-sm text-gray-600">
              <Phone class="h-4 w-4" />
              <span>{{ vendor.contact_phone }}</span>
            </div>
            <div v-if="vendor.address" class="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin class="h-4 w-4" />
              <span class="truncate">{{ vendor.address }}</span>
            </div>

            <!-- Capabilities -->
            <div v-if="vendor.capabilities">
              <Label class="text-sm font-medium">Capabilities</Label>
              <div class="flex flex-wrap gap-1 mt-1">
                <span 
                  v-for="capability in getCapabilities(vendor.capabilities)" 
                  :key="capability"
                  class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {{ capability }}
                </span>
              </div>
            </div>

            <!-- Performance Rating -->
            <div v-if="vendor.performance_rating" class="flex items-center justify-between">
              <Label class="text-sm font-medium">Performance</Label>
              <div class="flex items-center space-x-1">
                <Star 
                  v-for="i in 5" 
                  :key="i"
                  :class="i <= vendor.performance_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'"
                  class="h-4 w-4"
                />
                <span class="text-sm text-gray-600 ml-1">({{ vendor.performance_rating }}/5)</span>
              </div>
            </div>

            <!-- Certification Level -->
            <div v-if="vendor.certification_level" class="flex items-center space-x-2 text-sm text-gray-600">
              <Award class="h-4 w-4" />
              <span>{{ vendor.certification_level }}</span>
            </div>

            <!-- Actions -->
            <div class="flex space-x-2 pt-2">
              <Button 
                @click="viewVendor(vendor)" 
                variant="outline" 
                size="sm" 
                class="flex-1"
              >
                <Eye class="h-4 w-4 mr-1" />
                View
              </Button>
              <Button 
                @click="editVendor(vendor)" 
                variant="outline" 
                size="sm" 
                class="flex-1"
              >
                <Edit class="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                @click="assignToProject(vendor)" 
                size="sm" 
                class="flex-1"
              >
                <Building class="h-4 w-4 mr-1" />
                Assign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && vendors.length === 0" class="text-center py-12">
      <Building class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
      <p class="text-gray-600">Try adjusting your search criteria or add a new vendor.</p>
    </div>

    <!-- Add/Edit Vendor Modal -->
    <Dialog v-model:open="showAddVendorModal">
      <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Create a new vendor profile with contact information and capabilities.
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="saveVendor" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="vendorName">Vendor Name *</Label>
              <Input
                id="vendorName"
                v-model="vendorForm.name"
                type="text"
                required
                placeholder="Enter vendor name"
              />
            </div>
            <div>
              <Label for="vendorEmail">Contact Email *</Label>
              <Input
                id="vendorEmail"
                v-model="vendorForm.contact_email"
                type="email"
                required
                placeholder="contact@vendor.com"
              />
            </div>
            <div>
              <Label for="vendorPhone">Contact Phone</Label>
              <Input
                id="vendorPhone"
                v-model="vendorForm.contact_phone"
                type="tel"
                placeholder="(403) 555-0123"
              />
            </div>
            <div>
              <Label for="vendorWebsite">Website</Label>
              <Input
                id="vendorWebsite"
                v-model="vendorForm.website"
                type="url"
                placeholder="https://vendor.com"
              />
            </div>
          </div>

          <div>
            <Label for="vendorAddress">Address</Label>
            <Input
              id="vendorAddress"
              v-model="vendorForm.address"
              type="text"
              placeholder="Full address"
            />
          </div>

          <div>
            <Label for="vendorCapabilities">Capabilities</Label>
            <Input
              id="vendorCapabilities"
              v-model="vendorForm.capabilities"
              type="text"
              placeholder="e.g., construction, design, consulting (comma-separated)"
            />
          </div>

          <div>
            <Label for="vendorDescription">Description</Label>
            <Textarea
              id="vendorDescription"
              v-model="vendorForm.description"
              rows="3"
              placeholder="Brief description of the vendor's services and expertise..."
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="certificationLevel">Certification Level</Label>
              <Select v-model="vendorForm.certification_level">
                <SelectTrigger>
                  <SelectValue placeholder="Select certification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label for="vendorStatus">Status</Label>
              <Select v-model="vendorForm.status">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" @click="showAddVendorModal = false">
            Cancel
          </Button>
          <Button @click="saveVendor" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Vendor' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Project Assignment Modal -->
    <ProjectSelectionModal
      v-model:open="showProjectAssignmentModal"
      :vendor-id="selectedVendor?.id || ''"
      :vendor-name="selectedVendor?.name || ''"
      @project-assigned="handleProjectAssigned"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Eye, 
  Edit, 
  Building, 
  Award
} from 'lucide-vue-next'
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription, Modal, Select } from '@/components/ui'
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

const router = useRouter()
const { formatStatus } = useFormat()

// Reactive state
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const vendors = ref<Vendor[]>([])

// Search and filters
const searchTerm = ref('')
const selectedCapability = ref('')
const selectedStatus = ref('')

// Modals
const showAddVendorModal = ref(false)
const showProjectAssignmentModal = ref(false)

// Form data
const vendorForm = ref({
  name: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  address: '',
  capabilities: '',
  description: '',
  certification_level: '',
  status: 'active'
})

// Assignment data
const selectedVendor = ref<Vendor | null>(null)

// Methods
const loadVendors = async () => {
  try {
    loading.value = true
    error.value = null

    const params = new URLSearchParams()
    if (searchTerm.value) params.append('search', searchTerm.value)
    if (selectedCapability.value) params.append('capability', selectedCapability.value)
    if (selectedStatus.value) params.append('status', selectedStatus.value)
    params.append('limit', '50')

    const response = await apiService.get(`/vendors?${params.toString()}`)
    
    if (response.success) {
      vendors.value = response.data || []
    } else {
      throw new Error(response.error?.message || 'Failed to load vendors')
    }
  } catch (err) {
    console.error('Error loading vendors:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load vendors'
  } finally {
    loading.value = false
  }
}

const debouncedSearch = (() => {
  let timeout: NodeJS.Timeout
  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      loadVendors()
    }, 300)
  }
})()

const clearFilters = () => {
  searchTerm.value = ''
  selectedCapability.value = ''
  selectedStatus.value = ''
  loadVendors()
}

const viewVendor = (vendor: Vendor) => {
  router.push(`/vendors/${vendor.id}`)
}

const editVendor = (vendor: Vendor) => {
  // TODO: Implement edit functionality
  console.log('Edit vendor:', vendor)
}

const assignToProject = (vendor: Vendor) => {
  selectedVendor.value = vendor
  showProjectAssignmentModal.value = true
}

const saveVendor = async () => {
  try {
    saving.value = true

    const response = await apiService.post('/vendors', vendorForm.value)
    
    if (response.success) {
      showAddVendorModal.value = false
      resetVendorForm()
      loadVendors() // Refresh the list
    } else {
      throw new Error(response.error?.message || 'Failed to save vendor')
    }
  } catch (err) {
    console.error('Error saving vendor:', err)
    error.value = err instanceof Error ? err.message : 'Failed to save vendor'
  } finally {
    saving.value = false
  }
}

const handleProjectAssigned = (project: any, assignmentData: any) => {
  console.log('Vendor assigned to project:', { project, assignmentData })
  // Could show a success notification here
}

const resetVendorForm = () => {
  vendorForm.value = {
    name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    address: '',
    capabilities: '',
    description: '',
    certification_level: '',
    status: 'active'
  }
}

const getStatusBadgeClass = (status: string) => {
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

const getCapabilities = (capabilities: string): string[] => {
  if (!capabilities) return []
  return capabilities.split(',').map(cap => cap.trim()).filter(Boolean)
}

// Lifecycle
onMounted(() => {
  loadVendors()
})
</script>

