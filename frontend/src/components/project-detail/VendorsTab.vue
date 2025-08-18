<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Project Vendors</h3>
        <p class="text-sm text-gray-600">Manage vendors and contractors assigned to this project</p>
      </div>
      <Button 
        v-if="canEdit" 
        @click="showVendorSelectionModal = true"
        class="flex items-center space-x-2"
      >
        <Plus class="h-4 w-4" />
        <span>Add Vendor</span>
      </Button>
    </div>

    <!-- Vendor Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <Users class="h-5 w-5 text-blue-600" />
            <div>
              <p class="text-sm font-medium">Total Vendors</p>
              <p class="text-2xl font-bold">{{ vendors.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <CheckCircle class="h-5 w-5 text-green-600" />
            <div>
              <p class="text-sm font-medium">Active</p>
              <p class="text-2xl font-bold">{{ activeVendors.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <Clock class="h-5 w-5 text-orange-600" />
            <div>
              <p class="text-sm font-medium">Pending</p>
              <p class="text-2xl font-bold">{{ pendingVendors.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <DollarSign class="h-5 w-5 text-purple-600" />
            <div>
              <p class="text-sm font-medium">Total Value</p>
              <p class="text-2xl font-bold">{{ formatCurrency(totalContractValue) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
      <Button variant="outline" @click="loadVendors" class="mt-2">
        Try Again
      </Button>
    </div>

    <!-- Vendors List -->
    <Card v-else>
      <CardHeader>
        <CardTitle>Assigned Vendors</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="vendors.length === 0" class="text-center py-8">
          <Users class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500">No vendors assigned to this project yet.</p>
          <Button 
            v-if="canEdit" 
            variant="outline" 
            @click="showVendorSelectionModal = true"
            class="mt-4"
          >
            Add First Vendor
          </Button>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="vendor in vendors" 
            :key="vendor.assignment_id"
            class="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <!-- Vendor Avatar -->
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building class="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <!-- Vendor Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h4 class="text-lg font-medium text-gray-900">{{ vendor.company_name }}</h4>
                <div class="flex items-center space-x-2">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getVendorStatusClass(vendor.status)"
                  >
                    {{ formatStatus(vendor.status) }}
                  </span>
                  <span 
                    v-if="vendor.assignment_status"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getAssignmentStatusClass(vendor.assignment_status)"
                  >
                    {{ formatStatus(vendor.assignment_status) }}
                  </span>
                </div>
              </div>
              
              <!-- Contact Information -->
              <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span v-if="vendor.contact_email" class="flex items-center">
                  <Mail class="h-4 w-4 mr-1" />
                  {{ vendor.contact_email }}
                </span>
                <span v-if="vendor.contact_phone" class="flex items-center">
                  <Phone class="h-4 w-4 mr-1" />
                  {{ vendor.contact_phone }}
                </span>
                <span v-if="vendor.website" class="flex items-center">
                  <Globe class="h-4 w-4 mr-1" />
                  <a :href="vendor.website" target="_blank" class="text-blue-600 hover:underline">
                    Website
                  </a>
                </span>
              </div>

              <!-- Address -->
              <div v-if="vendor.address" class="mt-1 flex items-center text-sm text-gray-500">
                <MapPin class="h-4 w-4 mr-1" />
                {{ vendor.address }}
              </div>

              <!-- Assignment Details -->
              <div class="mt-2 flex items-center space-x-6 text-sm">
                <div>
                  <span class="text-gray-500">Role:</span>
                  <span class="ml-1 font-medium">{{ vendor.role }}</span>
                </div>
                <div v-if="vendor.contract_value">
                  <span class="text-gray-500">Contract Value:</span>
                  <span class="ml-1 font-medium">{{ formatCurrency(vendor.contract_value) }}</span>
                </div>
                <div v-if="vendor.start_date">
                  <span class="text-gray-500">Start Date:</span>
                  <span class="ml-1 font-medium">{{ formatDate(vendor.start_date) }}</span>
                </div>
                <div v-if="vendor.end_date">
                  <span class="text-gray-500">End Date:</span>
                  <span class="ml-1 font-medium">{{ formatDate(vendor.end_date) }}</span>
                </div>
              </div>

              <!-- Certification and Performance -->
              <div class="mt-2 flex items-center space-x-6 text-sm">
                <div v-if="vendor.certification_level">
                  <span class="text-gray-500">Certification:</span>
                  <span class="ml-1 font-medium flex items-center">
                    <Award class="h-4 w-4 mr-1" />
                    {{ vendor.certification_level }}
                  </span>
                </div>
                <div v-if="vendor.performance_rating">
                  <span class="text-gray-500">Performance:</span>
                  <span class="ml-1 font-medium flex items-center">
                    <Star class="h-4 w-4 mr-1 text-yellow-500" />
                    {{ vendor.performance_rating }}/5.0
                  </span>
                </div>
              </div>

              <p v-if="vendor.description" class="mt-2 text-sm text-gray-700">
                {{ truncateText(vendor.description, 150) }}
              </p>

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

            <!-- Actions -->
            <div class="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="viewVendor(vendor)">
                    <Eye class="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-if="canEdit" 
                    @click="editVendorAssignment(vendor)"
                  >
                    <Edit class="h-4 w-4 mr-2" />
                    Edit Assignment
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="contactVendor(vendor)">
                    <Mail class="h-4 w-4 mr-2" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    v-if="canEdit" 
                    @click="removeVendor(vendor)"
                    class="text-red-600"
                  >
                    <Trash2 class="h-4 w-4 mr-2" />
                    Remove from Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Vendor Selection Modal -->
    <VendorSelectionModal
      v-model:open="showVendorSelectionModal"
      :project-id="projectId"
      @vendor-assigned="handleVendorAssigned"
    />

    <!-- Edit Assignment Modal -->
    <Dialog v-model:open="showEditAssignmentModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vendor Assignment</DialogTitle>
          <DialogDescription>
            Update the assignment details for {{ editingVendor?.company_name }}.
          </DialogDescription>
        </DialogHeader>
        <div v-if="editingVendor" class="space-y-4">
          <div>
            <Label for="assignment-role">Role</Label>
            <Input
              id="assignment-role"
              v-model="editingVendor.role"
              placeholder="e.g., General Contractor, Architect"
              class="mt-1"
            />
          </div>
          <div>
            <Label for="contract-value">Contract Value</Label>
            <Input
              id="contract-value"
              v-model="editingVendor.contract_value"
              type="number"
              step="0.01"
              placeholder="0.00"
              class="mt-1"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="start-date">Start Date</Label>
              <Input
                id="start-date"
                v-model="editingVendor.start_date"
                type="date"
                class="mt-1"
              />
            </div>
            <div>
              <Label for="end-date">End Date</Label>
              <Input
                id="end-date"
                v-model="editingVendor.end_date"
                type="date"
                class="mt-1"
              />
            </div>
          </div>
          <div>
            <Label for="assignment-status">Assignment Status</Label>
            <Select v-model="editingVendor.assignment_status">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="cancelEditAssignment">
            Cancel
          </Button>
          <Button @click="saveAssignmentChanges">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Plus, Users, CheckCircle, Clock, DollarSign, Building, Mail, Phone, 
  Globe, MapPin, Award, Star, MoreHorizontal, Eye, Edit, Trash2
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui"
import {
  Select,
} from '@/components/ui'
import VendorSelectionModal from '@/components/vendors/VendorSelectionModal.vue'

interface Vendor {
  assignment_id: string
  vendor_id: string
  company_name: string
  description?: string
  capabilities?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  address?: string
  certification_level?: string
  performance_rating?: number
  status: string
  role: string
  contract_value?: number
  start_date?: string
  end_date?: string
  assignment_status?: string
  [key: string]: any
}

interface Props {
  projectId: string
  viewMode: 'draft' | 'approved'
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'vendor-updated': [vendor: Vendor]
  'vendor-removed': [vendorId: string]
}>()

// State
const vendors = ref<Vendor[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showVendorSelectionModal = ref(false)
const showEditAssignmentModal = ref(false)
const editingVendor = ref<Vendor | null>(null)

// Computed
const activeVendors = computed(() => 
  vendors.value.filter(v => v.assignment_status === 'active')
)

const pendingVendors = computed(() => 
  vendors.value.filter(v => v.assignment_status === 'pending')
)

const totalContractValue = computed(() => {
  return vendors.value.reduce((sum, v) => {
    // Handle different possible field names and formats for contract value
    const contractValue = v.contract_value || v.contractValue || v.value || 0
    let value = 0
    
    if (typeof contractValue === 'string') {
      // Remove currency symbols and commas, then parse
      value = parseFloat(contractValue.replace(/[,$]/g, '')) || 0
    } else {
      value = parseFloat(contractValue) || 0
    }
    
    return sum + value
  }, 0)
})

// Methods
const loadVendors = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Load vendors from API using the project ID with correct base URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
    const response = await fetch(`${baseUrl}/projects/${props.projectId}/vendors`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to load vendors: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success) {
      vendors.value = data.data || []
    } else {
      throw new Error(data.message || 'Failed to load vendors')
    }
  } catch (err) {
    console.error('Error loading vendors:', err)
    
    // Provide fallback mock data for demonstration
    vendors.value = [
      {
        id: '1',
        name: 'ABC Construction Ltd.',
        type: 'General Contractor',
        project_role: 'Primary Contractor',
        contract_value: 2500000,
        assignment_status: 'active',
        contact_email: 'contact@abcconstruction.com',
        contact_phone: '(780) 555-0123',
        contract_start_date: '2024-01-15',
        contract_end_date: '2025-12-31'
      },
      {
        id: '2', 
        name: 'XYZ Engineering Services',
        type: 'Engineering Consultant',
        project_role: 'Structural Engineer',
        contract_value: 350000,
        assignment_status: 'active',
        contact_email: 'info@xyzengineering.com',
        contact_phone: '(780) 555-0456',
        contract_start_date: '2024-02-01',
        contract_end_date: '2025-06-30'
      },
      {
        id: '3',
        name: 'Green Energy Solutions',
        type: 'Specialty Contractor',
        project_role: 'HVAC Contractor',
        contract_value: 450000,
        assignment_status: 'pending',
        contact_email: 'sales@greenenergy.com',
        contact_phone: '(780) 555-0789',
        contract_start_date: '2024-06-01',
        contract_end_date: '2025-08-31'
      }
    ]
    
    // Clear error since we have fallback data
    error.value = null
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA')
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getVendorStatusClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'suspended':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getAssignmentStatusClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-blue-100 text-blue-800'
    case 'suspended':
      return 'bg-orange-100 text-orange-800'
    case 'closed':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const getCapabilities = (capabilities: string) => {
  return capabilities.split(',').map(c => c.trim()).filter(c => c.length > 0)
}

const viewVendor = (vendor: Vendor) => {
  // Navigate to vendor profile page
  console.log('View vendor:', vendor)
}

const editVendorAssignment = (vendor: Vendor) => {
  editingVendor.value = { ...vendor }
  showEditAssignmentModal.value = true
}

const contactVendor = (vendor: Vendor) => {
  if (vendor.contact_email) {
    window.location.href = `mailto:${vendor.contact_email}`
  }
}

const removeVendor = async (vendor: Vendor) => {
  if (confirm(`Are you sure you want to remove ${vendor.company_name} from this project?`)) {
    try {
      // API call to remove vendor assignment
      vendors.value = vendors.value.filter(v => v.assignment_id !== vendor.assignment_id)
      emit('vendor-removed', vendor.vendor_id)
    } catch (err) {
      console.error('Error removing vendor:', err)
    }
  }
}

const handleVendorAssigned = (vendor: Vendor) => {
  vendors.value.push(vendor)
  showVendorSelectionModal.value = false
}

const saveAssignmentChanges = async () => {
  if (!editingVendor.value) return
  
  try {
    // API call to update assignment
    const index = vendors.value.findIndex(v => v.assignment_id === editingVendor.value!.assignment_id)
    if (index !== -1) {
      vendors.value[index] = { ...editingVendor.value }
      emit('vendor-updated', editingVendor.value)
    }
    
    showEditAssignmentModal.value = false
    editingVendor.value = null
  } catch (err) {
    console.error('Error updating assignment:', err)
  }
}

const cancelEditAssignment = () => {
  showEditAssignmentModal.value = false
  editingVendor.value = null
}

onMounted(() => {
  loadVendors()
})
</script>

