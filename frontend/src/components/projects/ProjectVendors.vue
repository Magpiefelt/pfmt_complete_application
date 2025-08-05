<template>
  <div class="space-y-6">
    <!-- Vendors Overview -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Users class="h-5 w-5" />
          Project Vendors & Contractors
        </CardTitle>
        <CardContent class="text-sm text-gray-600">
          Manage vendors, contractors, and service providers for this project
        </CardContent>
      </CardHeader>
      <CardContent>
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-600">
              Total Vendors: <span class="font-medium text-gray-900">{{ vendors.length }}</span>
            </div>
            <div class="text-sm text-gray-600">
              Active Contracts: <span class="font-medium text-gray-900">{{ activeVendors.length }}</span>
            </div>
          </div>
          <Button v-if="isEditing" @click="addVendor" size="sm">
            <Plus class="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        <!-- Vendors List -->
        <div class="space-y-4">
          <div v-for="(vendor, index) in vendors" :key="vendor.id || index"
               class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <div class="flex items-start justify-between">
              <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Vendor Basic Info -->
                <div class="space-y-3">
                  <div>
                    <Label class="text-sm font-medium text-gray-700">Company Name</Label>
                    <Input
                      v-model="vendor.companyName"
                      :disabled="!isEditing"
                      class="mt-1"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label class="text-sm font-medium text-gray-700">Vendor Type</Label>
                    <select
                      v-model="vendor.vendorType"
                      :disabled="!isEditing"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                    >
                      <option value="">Select type</option>
                      <option value="General Contractor">General Contractor</option>
                      <option value="Subcontractor">Subcontractor</option>
                      <option value="Consultant">Consultant</option>
                      <option value="Supplier">Supplier</option>
                      <option value="Service Provider">Service Provider</option>
                    </select>
                  </div>
                  <div>
                    <Label class="text-sm font-medium text-gray-700">Status</Label>
                    <select
                      v-model="vendor.status"
                      :disabled="!isEditing"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>

                <!-- Contact Information -->
                <div class="space-y-3">
                  <div>
                    <Label class="text-sm font-medium text-gray-700">Contact Person</Label>
                    <Input
                      v-model="vendor.contactPerson"
                      :disabled="!isEditing"
                      class="mt-1"
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <Label class="text-sm font-medium text-gray-700">Phone</Label>
                    <Input
                      v-model="vendor.phone"
                      :disabled="!isEditing"
                      class="mt-1"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label class="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      v-model="vendor.email"
                      :disabled="!isEditing"
                      type="email"
                      class="mt-1"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <!-- Contract Information -->
                <div class="space-y-3">
                  <div>
                    <Label class="text-sm font-medium text-gray-700">Contract Value</Label>
                    <div class="relative mt-1">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        v-model="vendor.contractValue"
                        :disabled="!isEditing"
                        type="number"
                        class="pl-8"
                        placeholder="Enter contract value"
                      />
                    </div>
                  </div>
                  <div>
                    <Label class="text-sm font-medium text-gray-700">Start Date</Label>
                    <Input
                      v-model="vendor.startDate"
                      :disabled="!isEditing"
                      type="date"
                      class="mt-1"
                    />
                  </div>
                  <div>
                    <Label class="text-sm font-medium text-gray-700">End Date</Label>
                    <Input
                      v-model="vendor.endDate"
                      :disabled="!isEditing"
                      type="date"
                      class="mt-1"
                    />
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div v-if="isEditing" class="ml-4">
                <Button @click="removeVendor(index)" variant="outline" size="sm">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <!-- Additional Details -->
            <div class="mt-4 pt-4 border-t border-gray-200">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium text-gray-700">Services/Scope</Label>
                  <textarea
                    v-model="vendor.scope"
                    :disabled="!isEditing"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                    rows="2"
                    placeholder="Describe services or scope of work"
                  />
                </div>
                <div>
                  <Label class="text-sm font-medium text-gray-700">Notes</Label>
                  <textarea
                    v-model="vendor.notes"
                    :disabled="!isEditing"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                    rows="2"
                    placeholder="Additional notes or comments"
                  />
                </div>
              </div>
            </div>

            <!-- Status Badge -->
            <div class="mt-3 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <Badge :class="getVendorStatusColor(vendor.status)">
                  {{ vendor.status || 'Unknown' }}
                </Badge>
                <Badge variant="outline">
                  {{ vendor.vendorType || 'Unspecified' }}
                </Badge>
              </div>
              <div v-if="vendor.contractValue" class="text-sm text-gray-600">
                Contract Value: <span class="font-medium">${{ Number(vendor.contractValue).toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="vendors.length === 0" class="text-center py-8">
            <Users class="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Vendors Added</h3>
            <p class="text-gray-600 mb-4">Add vendors and contractors to track project relationships</p>
            <Button v-if="isEditing" @click="addVendor">
              <Plus class="h-4 w-4 mr-2" />
              Add First Vendor
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Vendor Summary Statistics -->
    <div v-if="vendors.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Total Contract Value</p>
              <p class="text-2xl font-bold text-gray-900">${{ totalContractValue.toLocaleString() }}</p>
            </div>
            <DollarSign class="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Active Vendors</p>
              <p class="text-2xl font-bold text-gray-900">{{ activeVendors.length }}</p>
            </div>
            <Users class="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Pending Vendors</p>
              <p class="text-2xl font-bold text-gray-900">{{ pendingVendors.length }}</p>
            </div>
            <Clock class="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Completed</p>
              <p class="text-2xl font-bold text-gray-900">{{ completedVendors.length }}</p>
            </div>
            <CheckCircle class="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Users, Plus, Trash2, DollarSign, Clock, CheckCircle } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Input } from '@/components/ui/Input.vue'
import { Label } from '@/components/ui/Label.vue'
import { Button } from '@/components/ui/Button.vue'
import { Badge } from '@/components/ui/Badge.vue'

interface Props {
  project: any
  isEditing: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [data: any]
}>()

const vendors = ref<any[]>([])

// Initialize vendors from project data
watch(() => props.project, (newProject) => {
  if (newProject?.vendors) {
    vendors.value = [...newProject.vendors]
  } else {
    // Initialize with sample vendor data if none exists
    vendors.value = [
      {
        id: 1,
        companyName: 'ABC Construction Ltd.',
        vendorType: 'General Contractor',
        status: 'Active',
        contactPerson: 'John Smith',
        phone: '(403) 555-0123',
        email: 'john.smith@abcconstruction.com',
        contractValue: 1500000,
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        scope: 'Primary construction contractor for building renovation and infrastructure upgrades',
        notes: 'Excellent track record with government projects'
      },
      {
        id: 2,
        companyName: 'Elite Engineering Consultants',
        vendorType: 'Consultant',
        status: 'Active',
        contactPerson: 'Sarah Johnson',
        phone: '(403) 555-0456',
        email: 'sarah.johnson@eliteeng.com',
        contractValue: 250000,
        startDate: '2023-12-01',
        endDate: '2024-06-30',
        scope: 'Structural engineering design and consultation services',
        notes: 'Specialized in healthcare facility design'
      },
      {
        id: 3,
        companyName: 'Mountain View Electrical',
        vendorType: 'Subcontractor',
        status: 'Completed',
        contactPerson: 'Mike Wilson',
        phone: '(403) 555-0789',
        email: 'mike.wilson@mvelectrical.com',
        contractValue: 180000,
        startDate: '2024-02-01',
        endDate: '2024-05-15',
        scope: 'Electrical system installation and upgrades',
        notes: 'Completed ahead of schedule'
      }
    ]
  }
}, { immediate: true })

// Watch vendors changes and emit updates
watch(vendors, (newVendors) => {
  emit('update', { vendors: newVendors })
}, { deep: true })

const activeVendors = computed(() => 
  vendors.value.filter(v => v.status === 'Active')
)

const pendingVendors = computed(() => 
  vendors.value.filter(v => v.status === 'Pending')
)

const completedVendors = computed(() => 
  vendors.value.filter(v => v.status === 'Completed')
)

const totalContractValue = computed(() => 
  vendors.value.reduce((total, vendor) => total + (Number(vendor.contractValue) || 0), 0)
)

const addVendor = () => {
  const newVendor = {
    id: Date.now(),
    companyName: '',
    vendorType: '',
    status: 'Pending',
    contactPerson: '',
    phone: '',
    email: '',
    contractValue: '',
    startDate: '',
    endDate: '',
    scope: '',
    notes: ''
  }
  vendors.value.push(newVendor)
}

const removeVendor = (index: number) => {
  vendors.value.splice(index, 1)
}

const getVendorStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Active': 'bg-green-100 text-green-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-blue-100 text-blue-800',
    'Terminated': 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
</script>

