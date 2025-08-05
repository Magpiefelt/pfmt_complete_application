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
        @click="showAddVendorDialog = true"
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
            @click="showAddVendorDialog = true"
            class="mt-4"
          >
            Add First Vendor
          </Button>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="vendor in vendors" 
            :key="vendor.id"
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
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getVendorStatusClass(vendor.status)"
                >
                  {{ formatStatus(vendor.status) }}
                </span>
              </div>
              
              <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span class="flex items-center">
                  <User class="h-4 w-4 mr-1" />
                  {{ vendor.contact_name }}
                </span>
                <span class="flex items-center">
                  <Mail class="h-4 w-4 mr-1" />
                  {{ vendor.contact_email }}
                </span>
                <span class="flex items-center">
                  <Phone class="h-4 w-4 mr-1" />
                  {{ vendor.contact_phone }}
                </span>
              </div>

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
              </div>

              <p v-if="vendor.description" class="mt-2 text-sm text-gray-700">
                {{ truncateText(vendor.description, 150) }}
              </p>
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
                    @click="editVendor(vendor)"
                  >
                    <Edit class="h-4 w-4 mr-2" />
                    Edit Vendor
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
                    <UserMinus class="h-4 w-4 mr-2" />
                    Remove Vendor
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Add Vendor Dialog -->
    <Dialog v-model:open="showAddVendorDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Vendor to Project</DialogTitle>
          <DialogDescription>
            Assign a vendor or contractor to this project.
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="addVendor" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <Input 
              v-model="newVendor.company_name" 
              required
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role/Specialization</label>
            <Select v-model="newVendor.role" required>
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
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <Input 
                v-model="newVendor.contact_name" 
                required
                placeholder="Contact person"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <Input 
                v-model="newVendor.contact_email" 
                type="email"
                required
                placeholder="email@company.com"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input 
                v-model="newVendor.contact_phone" 
                type="tel"
                placeholder="(403) 555-0123"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contract Value</label>
              <Input 
                v-model="newVendor.contract_value" 
                type="number"
                min="0"
                step="1000"
                placeholder="0"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <Textarea 
              v-model="newVendor.description" 
              rows="2"
              placeholder="Brief description of vendor's role and responsibilities..."
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" @click="showAddVendorDialog = false">
            Cancel
          </Button>
          <Button @click="addVendor" :disabled="!isValidVendor">
            Add Vendor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Plus, 
  Users, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Building,
  User,
  Mail,
  Phone,
  MoreHorizontal,
  Eye,
  Edit,
  UserMinus
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFormat } from '@/composables/useFormat'
import { useStatusBadge } from '@/composables/useStatusBadge'

interface Vendor {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  role: string
  status: 'active' | 'pending' | 'inactive'
  contract_value?: number
  start_date?: string
  end_date?: string
  description?: string
}

interface Props {
  projectId: string
  canEdit: boolean
  userRole: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'vendor-added': [vendor: Vendor]
  'vendor-updated': [vendor: Vendor]
  'vendor-removed': [vendorId: string]
}>()

const { formatCurrency, formatDate, truncateText, formatStatus } = useFormat()
const { getWorkflowStatusClass } = useStatusBadge()

// Local state
const vendors = ref<Vendor[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showAddVendorDialog = ref(false)
const newVendor = ref({
  company_name: '',
  role: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  contract_value: 0,
  description: ''
})

// Computed properties
const activeVendors = computed(() => 
  vendors.value.filter(v => v.status === 'active')
)

const pendingVendors = computed(() => 
  vendors.value.filter(v => v.status === 'pending')
)

const totalContractValue = computed(() => 
  vendors.value.reduce((sum, vendor) => sum + (vendor.contract_value || 0), 0)
)

const isValidVendor = computed(() => {
  return newVendor.value.company_name && 
         newVendor.value.role && 
         newVendor.value.contact_name && 
         newVendor.value.contact_email
})

// Methods
const loadVendors = async () => {
  loading.value = true
  error.value = null

  try {
    // Mock data for now - replace with actual API call
    vendors.value = [
      {
        id: '1',
        company_name: 'ABC Construction Ltd.',
        contact_name: 'John Smith',
        contact_email: 'john@abcconstruction.com',
        contact_phone: '(403) 555-0123',
        role: 'General Contractor',
        status: 'active',
        contract_value: 8500000,
        start_date: '2024-01-15',
        description: 'Primary general contractor responsible for overall construction management and execution.'
      },
      {
        id: '2',
        company_name: 'Design Solutions Inc.',
        contact_name: 'Sarah Johnson',
        contact_email: 'sarah@designsolutions.com',
        contact_phone: '(403) 555-0456',
        role: 'Architect',
        status: 'active',
        contract_value: 750000,
        start_date: '2023-08-01',
        description: 'Architectural design and planning services for the justice centre project.'
      },
      {
        id: '3',
        company_name: 'Power Systems Corp.',
        contact_name: 'Mike Wilson',
        contact_email: 'mike@powersystems.com',
        contact_phone: '(403) 555-0789',
        role: 'Electrical Contractor',
        status: 'pending',
        contract_value: 1200000,
        description: 'Electrical systems installation and maintenance.'
      }
    ]
  } catch (err) {
    error.value = 'Failed to load vendors'
    console.error('Error loading vendors:', err)
  } finally {
    loading.value = false
  }
}

const addVendor = async () => {
  if (!isValidVendor.value) return

  const vendor: Vendor = {
    id: Date.now().toString(),
    company_name: newVendor.value.company_name,
    role: newVendor.value.role,
    contact_name: newVendor.value.contact_name,
    contact_email: newVendor.value.contact_email,
    contact_phone: newVendor.value.contact_phone,
    contract_value: newVendor.value.contract_value || undefined,
    description: newVendor.value.description || undefined,
    status: 'pending'
  }

  vendors.value.push(vendor)
  
  showAddVendorDialog.value = false
  newVendor.value = {
    company_name: '',
    role: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contract_value: 0,
    description: ''
  }

  emit('vendor-added', vendor)
}

const viewVendor = (vendor: Vendor) => {
  // Navigate to vendor detail or show modal
}

const editVendor = (vendor: Vendor) => {
  // Open edit dialog or navigate to edit page
}

const contactVendor = (vendor: Vendor) => {
  // Open email client
  window.location.href = `mailto:${vendor.contact_email}?subject=Project Update - ${props.projectId}`
}

const removeVendor = async (vendor: Vendor) => {
  if (confirm(`Are you sure you want to remove ${vendor.company_name} from this project?`)) {
    vendors.value = vendors.value.filter(v => v.id !== vendor.id)
    emit('vendor-removed', vendor.id)
  }
}

const getVendorStatusClass = (status: string) => {
  return getWorkflowStatusClass(status)
}

// Lifecycle
onMounted(() => {
  loadVendors()
})
</script>

