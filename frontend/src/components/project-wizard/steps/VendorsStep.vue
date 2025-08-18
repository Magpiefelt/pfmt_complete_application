<template>
  <div class="space-y-6">
    <!-- Step Header -->
    <div class="text-center">
      <AlbertaText tag="h3" variant="heading-m" color="primary">
        Project Vendors
      </AlbertaText>
      <AlbertaText variant="body-m" color="secondary" class="mt-2">
        Select vendors and contractors for this project
      </AlbertaText>
    </div>

    <!-- Vendor Selection -->
    <div class="space-y-4">
      <!-- Search and Filter -->
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Search Vendors
          </label>
          <input
            v-model="searchTerm"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search by vendor name or capabilities"
          />
        </div>
        <div class="md:w-48">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            v-model="statusFilter"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Vendors</option>
            <option value="active">Active Only</option>
            <option value="preferred">Preferred Vendors</option>
          </select>
        </div>
      </div>

      <!-- Available Vendors -->
      <div class="border border-gray-200 rounded-lg">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <AlbertaText variant="body-m" class="font-medium">
            Available Vendors ({{ filteredVendors.length }})
          </AlbertaText>
        </div>
        
        <div class="max-h-64 overflow-y-auto">
          <div v-if="loading" class="p-4 text-center">
            <LoadingSpinner class="w-6 h-6 mx-auto" />
            <AlbertaText variant="body-s" color="secondary" class="mt-2">
              Loading vendors...
            </AlbertaText>
          </div>
          
          <div v-else-if="filteredVendors.length === 0" class="p-4 text-center">
            <AlbertaText variant="body-s" color="secondary">
              No vendors found matching your criteria
            </AlbertaText>
          </div>
          
          <div v-else class="divide-y divide-gray-200">
            <div
              v-for="vendor in filteredVendors"
              :key="vendor.id"
              class="p-4 hover:bg-gray-50 cursor-pointer"
              @click="selectVendor(vendor)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <AlbertaText variant="body-m" class="font-medium">
                      {{ vendor.name }}
                    </AlbertaText>
                    <span
                      v-if="vendor.certification_level"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {{ vendor.certification_level }}
                    </span>
                  </div>
                  <AlbertaText variant="body-s" color="secondary" class="mt-1">
                    {{ vendor.capabilities || 'No capabilities listed' }}
                  </AlbertaText>
                  <div v-if="vendor.performance_rating" class="flex items-center mt-1">
                    <Star
                      v-for="i in 5"
                      :key="i"
                      class="h-4 w-4"
                      :class="i <= vendor.performance_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'"
                    />
                    <AlbertaText variant="body-xs" color="secondary" class="ml-2">
                      {{ vendor.performance_rating }}/5
                    </AlbertaText>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  @click.stop="selectVendor(vendor)"
                >
                  <Plus class="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Vendors -->
      <div class="border border-gray-200 rounded-lg">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <AlbertaText variant="body-m" class="font-medium">
            Selected Vendors ({{ formData.selectedVendors.length }})
          </AlbertaText>
        </div>
        
        <div v-if="formData.selectedVendors.length === 0" class="p-4 text-center">
          <AlbertaText variant="body-s" color="secondary">
            No vendors selected yet. Select vendors from the list above.
          </AlbertaText>
        </div>
        
        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="(selectedVendor, index) in formData.selectedVendors"
            :key="selectedVendor.vendorId"
            class="p-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <AlbertaText variant="body-m" class="font-medium">
                  {{ selectedVendor.vendorName }}
                </AlbertaText>
                
                <!-- Role Selection -->
                <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      v-model="selectedVendor.role"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      @change="validateForm"
                    >
                      <option value="">Select role</option>
                      <option value="General Contractor">General Contractor</option>
                      <option value="Subcontractor">Subcontractor</option>
                      <option value="Consultant">Consultant</option>
                      <option value="Supplier">Supplier</option>
                      <option value="Design Professional">Design Professional</option>
                      <option value="Project Manager">Project Manager</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Contract Value
                    </label>
                    <input
                      v-model.number="selectedVendor.contractValue"
                      type="number"
                      min="0"
                      step="1000"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                @click="removeVendor(index)"
                class="ml-4 text-red-600 hover:text-red-700"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation Summary -->
    <div v-if="Object.keys(errors).length > 0" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <AlertCircle class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <AlbertaText variant="body-s" class="text-red-800 font-medium">
            Please fix the following errors:
          </AlbertaText>
          <ul class="mt-2 text-sm text-red-700 list-disc list-inside">
            <li v-for="error in Object.values(errors)" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Help Text -->
    <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
      <div class="flex">
        <Info class="h-5 w-5 text-blue-400" />
        <div class="ml-3">
          <AlbertaText variant="body-s" class="text-blue-800">
            <strong>Tip:</strong> Select at least one vendor to proceed. You can specify their roles 
            and estimated contract values. Additional vendors can be added later from the project detail page.
          </AlbertaText>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { AlertCircle, Info, Plus, Trash2, Star } from 'lucide-vue-next'
import { AlbertaText, Button } from '@/components/ui'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import { ProjectWizardService } from '@/services/projectWizardService'

// Props
const props = defineProps<{
  data?: any
}>()

// Emits
const emit = defineEmits<{
  'update:data': [data: any]
  stepCompleted: [isValid: boolean]
}>()

// State
const loading = ref(false)
const searchTerm = ref('')
const statusFilter = ref('')
const availableVendors = ref<any[]>([])

// Form data
const formData = ref({
  selectedVendors: [] as any[]
})

// Validation errors
const errors = ref<Record<string, string>>({})

// Computed
const filteredVendors = computed(() => {
  // Ensure availableVendors is an array
  let filtered = Array.isArray(availableVendors.value) ? availableVendors.value : []

  // Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(vendor =>
      vendor.name && vendor.name.toLowerCase().includes(term) ||
      (vendor.capabilities && vendor.capabilities.toLowerCase().includes(term))
    )
  }

  // Filter by status
  if (statusFilter.value === 'active') {
    filtered = filtered.filter(vendor => vendor.status === 'active')
  } else if (statusFilter.value === 'preferred') {
    filtered = filtered.filter(vendor => vendor.certification_level)
  }

  // Exclude already selected vendors
  const selectedIds = formData.value.selectedVendors.map(v => v.vendorId)
  filtered = filtered.filter(vendor => !selectedIds.includes(vendor.id))

  return filtered
})

const isValid = computed(() => {
  return Object.keys(errors.value).length === 0 && formData.value.selectedVendors.length > 0
})

// Methods
const loadVendors = async () => {
  try {
    loading.value = true
    const response = await ProjectWizardService.getAvailableVendors()
    
    // Handle different response formats
    if (Array.isArray(response)) {
      availableVendors.value = response
    } else if (response && Array.isArray(response.data)) {
      availableVendors.value = response.data
    } else if (response && response.vendors && Array.isArray(response.vendors)) {
      availableVendors.value = response.vendors
    } else {
      console.warn('Unexpected vendor data format:', response)
      availableVendors.value = []
    }
  } catch (error) {
    console.error('Error loading vendors:', error)
    // Provide fallback data for development
    availableVendors.value = [
      {
        id: '1',
        name: 'ABC Construction Ltd.',
        capabilities: 'General Construction, Project Management',
        certification_level: 'Certified',
        performance_rating: 4.5,
        status: 'active'
      },
      {
        id: '2',
        name: 'XYZ Engineering Inc.',
        capabilities: 'Engineering Design, Consulting',
        certification_level: 'Professional',
        performance_rating: 4.8,
        status: 'active'
      }
    ]
  } finally {
    loading.value = false
  }
}

const selectVendor = (vendor: any) => {
  const selectedVendor = {
    vendorId: vendor.id,
    vendorName: vendor.name,
    role: '',
    contractValue: null
  }
  
  formData.value.selectedVendors.push(selectedVendor)
  validateForm()
}

const removeVendor = (index: number) => {
  formData.value.selectedVendors.splice(index, 1)
  validateForm()
}

const validateForm = () => {
  errors.value = {}

  // Validate that at least one vendor is selected
  if (formData.value.selectedVendors.length === 0) {
    errors.value.vendors = 'At least one vendor must be selected'
  }

  // Validate that all selected vendors have roles
  formData.value.selectedVendors.forEach((vendor, index) => {
    if (!vendor.role) {
      errors.value[`vendor_${index}_role`] = `Role is required for ${vendor.vendorName}`
    }
  })

  // Emit validation status
  emit('stepCompleted', isValid.value)
}

// Watch for form changes
watch(formData, (newData) => {
  emit('update:data', { ...newData })
}, { deep: true })

// Initialize
onMounted(async () => {
  if (props.data) {
    Object.assign(formData.value, props.data)
  }
  
  await loadVendors()
  validateForm()
})
</script>

<style scoped>
/* Component-specific styles */
.vendor-card {
  @apply border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors;
}

.vendor-card.selected {
  @apply border-blue-500 bg-blue-50;
}

.vendor-rating {
  @apply flex items-center space-x-1;
}
</style>

