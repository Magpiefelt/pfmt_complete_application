<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>Select Vendor for Project</DialogTitle>
        <DialogDescription>
          Choose from existing vendors to assign to this project. You can search by name or filter by capabilities.
        </DialogDescription>
      </DialogHeader>

      <!-- Search and Filters -->
      <div class="flex-shrink-0 space-y-4 border-b pb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label for="vendor-search">Search Vendors</Label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="vendor-search"
                v-model="searchTerm"
                placeholder="Search by name or description..."
                class="pl-10"
                @input="debouncedSearch"
              />
            </div>
          </div>
          
          <div>
            <Label for="capability-filter">Capability</Label>
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
            <Label for="status-filter">Status</Label>
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
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600">
            {{ vendors.length }} vendor{{ vendors.length !== 1 ? 's' : '' }} found
          </p>
          <Button variant="outline" @click="clearFilters" size="sm">
            Clear Filters
          </Button>
        </div>
      </div>

      <!-- Vendor List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <p class="text-red-600 mb-2">{{ error }}</p>
          <Button variant="outline" @click="loadVendors" size="sm">
            Try Again
          </Button>
        </div>

        <!-- Empty State -->
        <div v-else-if="vendors.length === 0" class="text-center py-8">
          <Building class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 mb-2">No vendors found</p>
          <p class="text-sm text-gray-400">Try adjusting your search criteria</p>
        </div>

        <!-- Vendor Cards -->
        <div v-else class="space-y-3 p-1">
          <div
            v-for="vendor in vendors"
            :key="vendor.id"
            class="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            :class="{
              'ring-2 ring-blue-500 bg-blue-50': selectedVendor?.id === vendor.id
            }"
            @click="selectVendor(vendor)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building class="h-5 w-5 text-blue-600" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="text-lg font-medium text-gray-900 truncate">{{ vendor.name }}</h4>
                    <p class="text-sm text-gray-600 truncate">{{ vendor.description || 'No description available' }}</p>
                  </div>
                </div>

                <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div v-if="vendor.contact_email" class="flex items-center text-gray-600">
                    <Mail class="h-4 w-4 mr-2 flex-shrink-0" />
                    <span class="truncate">{{ vendor.contact_email }}</span>
                  </div>
                  <div v-if="vendor.contact_phone" class="flex items-center text-gray-600">
                    <Phone class="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{{ vendor.contact_phone }}</span>
                  </div>
                  <div v-if="vendor.certification_level" class="flex items-center text-gray-600">
                    <Award class="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{{ vendor.certification_level }}</span>
                  </div>
                  <div v-if="vendor.performance_rating" class="flex items-center text-gray-600">
                    <Star class="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{{ vendor.performance_rating }}/5.0</span>
                  </div>
                </div>

                <div v-if="vendor.capabilities" class="mt-2">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="capability in getCapabilities(vendor.capabilities)"
                      :key="capability"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {{ capability }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex-shrink-0 ml-4">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClass(vendor.status)"
                >
                  {{ formatStatus(vendor.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assignment Form -->
      <div v-if="selectedVendor" class="flex-shrink-0 border-t pt-4 space-y-4">
        <h4 class="font-medium">Assignment Details for {{ selectedVendor.name }}</h4>
        
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
          @click="assignVendor" 
          :disabled="!selectedVendor || !assignmentData.role || assigning"
        >
          <div v-if="assigning" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {{ assigning ? 'Assigning...' : 'Assign Vendor' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Search, 
  Building, 
  Mail, 
  Phone, 
  Award, 
  Star 
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
import { useStatusBadge } from '@/composables/useStatusBadge'
import { apiService } from '@/services/apiService'

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

interface AssignmentData {
  role: string
  contract_value: number | null
  start_date: string
  end_date: string
}

interface Props {
  projectId: string
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'vendor-assigned': [vendor: Vendor, assignmentData: AssignmentData]
}>()

const { formatStatus } = useFormat()
const { getWorkflowStatusClass } = useStatusBadge()

// Local state
const vendors = ref<Vendor[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const assigning = ref(false)
const searchTerm = ref('')
const selectedCapability = ref('')
const selectedStatus = ref('')
const selectedVendor = ref<Vendor | null>(null)
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

const selectVendor = (vendor: Vendor) => {
  selectedVendor.value = vendor
  // Reset assignment data when selecting a new vendor
  assignmentData.value = {
    role: '',
    contract_value: null,
    start_date: '',
    end_date: ''
  }
}

const assignVendor = async () => {
  if (!selectedVendor.value || !assignmentData.value.role) return

  try {
    assigning.value = true
    
    const payload = {
      vendor_id: selectedVendor.value.id,
      role: assignmentData.value.role,
      contract_value: assignmentData.value.contract_value,
      start_date: assignmentData.value.start_date || null,
      end_date: assignmentData.value.end_date || null
    }

    const response = await apiService.post(`/projects/${props.projectId}/vendors`, payload)
    
    if (response.success) {
      emit('vendor-assigned', selectedVendor.value, assignmentData.value)
      closeModal()
    } else {
      throw new Error(response.error?.message || 'Failed to assign vendor')
    }
  } catch (err) {
    console.error('Error assigning vendor:', err)
    error.value = err instanceof Error ? err.message : 'Failed to assign vendor'
  } finally {
    assigning.value = false
  }
}

const clearFilters = () => {
  searchTerm.value = ''
  selectedCapability.value = ''
  selectedStatus.value = ''
  loadVendors()
}

const closeModal = () => {
  selectedVendor.value = null
  assignmentData.value = {
    role: '',
    contract_value: null,
    start_date: '',
    end_date: ''
  }
  error.value = null
  emit('update:open', false)
}

const getCapabilities = (capabilities: string): string[] => {
  if (!capabilities) return []
  return capabilities.split(',').map(cap => cap.trim()).filter(Boolean)
}

const getStatusClass = (status: string) => {
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

// Watchers
watch(() => props.open, (newValue) => {
  if (newValue) {
    loadVendors()
  }
})

// Lifecycle
onMounted(() => {
  if (props.open) {
    loadVendors()
  }
})
</script>

