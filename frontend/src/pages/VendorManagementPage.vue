<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <AlbertaText tag="h1" size="heading-xl" mb="xs">Vendor Management</AlbertaText>
        <AlbertaText color="secondary">Manage vendor profiles, capabilities, and project assignments</AlbertaText>
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
            <input
              id="search"
              v-model="searchTerm"
              type="text"
              placeholder="Search by name or capability..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <Label for="capability">Capability</Label>
            <select
              id="capability"
              v-model="selectedCapability"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Capabilities</option>
              <option value="construction">Construction</option>
              <option value="design">Design</option>
              <option value="consulting">Consulting</option>
              <option value="engineering">Engineering</option>
            </select>
          </div>
          <div>
            <Label for="status">Status</Label>
            <select
              id="status"
              v-model="selectedStatus"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
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
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <ErrorMessage 
      v-else-if="error" 
      :message="error"
      @retry="loadVendors"
    />

    <!-- Vendors Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="vendor in filteredVendors" :key="vendor.id" class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex items-start justify-between">
            <div>
              <CardTitle class="text-lg">{{ vendor.name }}</CardTitle>
              <CardDescription>{{ vendor.industry }}</CardDescription>
            </div>
            <span 
              :class="getStatusBadgeClass(vendor.status)"
              class="px-2 py-1 rounded-full text-xs font-medium"
            >
              {{ vendor.status }}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <!-- Contact Info -->
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <Mail class="h-4 w-4" />
              <span>{{ vendor.email }}</span>
            </div>
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <Phone class="h-4 w-4" />
              <span>{{ vendor.phone }}</span>
            </div>
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin class="h-4 w-4" />
              <span>{{ vendor.location }}</span>
            </div>

            <!-- Capabilities -->
            <div>
              <Label class="text-sm font-medium">Capabilities</Label>
              <div class="flex flex-wrap gap-1 mt-1">
                <span 
                  v-for="capability in vendor.capabilities" 
                  :key="capability"
                  class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {{ capability }}
                </span>
              </div>
            </div>

            <!-- Performance Rating -->
            <div class="flex items-center justify-between">
              <Label class="text-sm font-medium">Performance</Label>
              <div class="flex items-center space-x-1">
                <Star 
                  v-for="i in 5" 
                  :key="i"
                  :class="i <= vendor.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'"
                  class="h-4 w-4"
                />
                <span class="text-sm text-gray-600 ml-1">({{ vendor.rating }}/5)</span>
              </div>
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
    <div v-if="!loading && !error && filteredVendors.length === 0" class="text-center py-12">
      <Building class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <AlbertaText size="heading-m" color="secondary" mb="xs">No vendors found</AlbertaText>
      <AlbertaText color="secondary">Try adjusting your search criteria or add a new vendor.</AlbertaText>
    </div>

    <!-- Add/Edit Vendor Modal -->
    <div v-if="showAddVendorModal || showEditVendorModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">
            {{ showAddVendorModal ? 'Add New Vendor' : 'Edit Vendor' }}
          </h2>
          <Button @click="closeModals" variant="outline" size="sm">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <form @submit.prevent="saveVendor" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="vendorName">Vendor Name *</Label>
              <input
                id="vendorName"
                v-model="vendorForm.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label for="industry">Industry</Label>
              <input
                id="industry"
                v-model="vendorForm.industry"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label for="email">Email *</Label>
              <input
                id="email"
                v-model="vendorForm.email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label for="phone">Phone</Label>
              <input
                id="phone"
                v-model="vendorForm.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <Label for="location">Location</Label>
            <input
              id="location"
              v-model="vendorForm.location"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label for="capabilities">Capabilities (comma-separated)</Label>
            <input
              id="capabilities"
              v-model="vendorForm.capabilitiesText"
              type="text"
              placeholder="e.g., construction, design, consulting"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label for="description">Description</Label>
            <textarea
              id="description"
              v-model="vendorForm.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="flex justify-end space-x-2 pt-4">
            <Button @click="closeModals" variant="outline" type="button">
              Cancel
            </Button>
            <Button type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : (showAddVendorModal ? 'Add Vendor' : 'Update Vendor') }}
            </Button>
          </div>
        </form>
      </div>
    </div>

    <!-- Project Assignment Modal -->
    <div v-if="showAssignModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-lg">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Assign to Project</h2>
          <Button @click="showAssignModal = false" variant="outline" size="sm">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <div class="space-y-4">
          <div>
            <Label>Vendor: {{ selectedVendor?.name }}</Label>
          </div>
          <div>
            <Label for="project">Select Project</Label>
            <select
              id="project"
              v-model="selectedProjectId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a project...</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>
          <div>
            <Label for="role">Role</Label>
            <input
              id="role"
              v-model="assignmentRole"
              type="text"
              placeholder="e.g., General Contractor, Architect"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-2 pt-4">
          <Button @click="showAssignModal = false" variant="outline">
            Cancel
          </Button>
          <Button @click="confirmAssignment" :disabled="!selectedProjectId">
            Assign Vendor
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Plus, Mail, Phone, MapPin, Star, Eye, Edit, Building, X
} from 'lucide-vue-next'
import { Button, AlbertaText } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui'
import { Label } from '@/components/ui'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import ErrorMessage from '@/components/shared/ErrorMessage.vue'
import { VendorAPI, ProjectAPI } from '@/services/apiService'

// Reactive state
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const vendors = ref([])
const projects = ref([])

// Search and filters
const searchTerm = ref('')
const selectedCapability = ref('')
const selectedStatus = ref('')

// Modals
const showAddVendorModal = ref(false)
const showEditVendorModal = ref(false)
const showAssignModal = ref(false)

// Form data
const vendorForm = ref({
  id: null,
  name: '',
  industry: '',
  email: '',
  phone: '',
  location: '',
  capabilitiesText: '',
  description: '',
  status: 'active'
})

// Assignment data
const selectedVendor = ref(null)
const selectedProjectId = ref('')
const assignmentRole = ref('')

// Computed properties
const filteredVendors = computed(() => {
  let filtered = vendors.value

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(vendor => 
      vendor.name.toLowerCase().includes(search) ||
      vendor.capabilities.some(cap => cap.toLowerCase().includes(search))
    )
  }

  if (selectedCapability.value) {
    filtered = filtered.filter(vendor => 
      vendor.capabilities.includes(selectedCapability.value)
    )
  }

  if (selectedStatus.value) {
    filtered = filtered.filter(vendor => vendor.status === selectedStatus.value)
  }

  return filtered
})

// Methods
const loadVendors = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await VendorAPI.getVendors()
    if (response.success) {
      vendors.value = response.data.map(vendor => ({
        ...vendor,
        capabilities: vendor.capabilities || [],
        rating: vendor.rating || 4.0,
        status: vendor.status || 'active'
      }))
    }
  } catch (err) {
    error.value = 'Failed to load vendors'
    console.error('Error loading vendors:', err)
  } finally {
    loading.value = false
  }
}

const loadProjects = async () => {
  try {
    const response = await ProjectAPI.getProjects()
    if (response.success && response.data?.projects) {
      projects.value = response.data.projects
    }
  } catch (err) {
    console.error('Error loading projects:', err)
  }
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const clearFilters = () => {
  searchTerm.value = ''
  selectedCapability.value = ''
  selectedStatus.value = ''
}

const viewVendor = (vendor) => {
}

const editVendor = (vendor) => {
  vendorForm.value = {
    id: vendor.id,
    name: vendor.name,
    industry: vendor.industry || '',
    email: vendor.email || '',
    phone: vendor.phone || '',
    location: vendor.location || '',
    capabilitiesText: vendor.capabilities.join(', '),
    description: vendor.description || '',
    status: vendor.status || 'active'
  }
  showEditVendorModal.value = true
}

const assignToProject = (vendor) => {
  selectedVendor.value = vendor
  selectedProjectId.value = ''
  assignmentRole.value = ''
  showAssignModal.value = true
}

const closeModals = () => {
  showAddVendorModal.value = false
  showEditVendorModal.value = false
  showAssignModal.value = false
  
  // Reset form
  vendorForm.value = {
    id: null,
    name: '',
    industry: '',
    email: '',
    phone: '',
    location: '',
    capabilitiesText: '',
    description: '',
    status: 'active'
  }
}

const saveVendor = async () => {
  saving.value = true
  
  try {
    const vendorData = {
      ...vendorForm.value,
      capabilities: vendorForm.value.capabilitiesText
        .split(',')
        .map(cap => cap.trim())
        .filter(cap => cap.length > 0)
    }
    
    let response
    if (showAddVendorModal.value) {
      response = await VendorAPI.createVendor(vendorData)
    } else {
      response = await VendorAPI.updateVendor(vendorData.id, vendorData)
    }
    
    if (response.success) {
      await loadVendors()
      closeModals()
    }
  } catch (err) {
    error.value = 'Failed to save vendor'
    console.error('Error saving vendor:', err)
  } finally {
    saving.value = false
  }
}

const confirmAssignment = async () => {
  try {
    const response = await VendorAPI.addVendorToProject(selectedProjectId.value, {
      vendorId: selectedVendor.value.id,
      role: assignmentRole.value
    })
    
    if (response.success) {
      showAssignModal.value = false
      // Show success message
    }
  } catch (err) {
    error.value = 'Failed to assign vendor to project'
    console.error('Error assigning vendor:', err)
  }
}

// Lifecycle
onMounted(() => {
  loadVendors()
  loadProjects()
})
</script>

