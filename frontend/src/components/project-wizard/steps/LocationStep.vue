<template>
  <div class="space-y-6">
    <!-- Step Header -->
    <div class="text-center">
      <AlbertaText tag="h3" variant="heading-m" color="primary">
        Project Location
      </AlbertaText>
      <AlbertaText variant="body-m" color="secondary" class="mt-2">
        Specify where this project will be located
      </AlbertaText>
    </div>

    <!-- Location Form -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Primary Location -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Primary Location *
        </label>
        <input
          v-model="formData.location"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Calgary, Edmonton, Red Deer"
          @input="validateForm"
        />
        <p v-if="errors.location" class="mt-1 text-sm text-red-600">
          {{ errors.location }}
        </p>
      </div>

      <!-- Municipality -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Municipality
        </label>
        <input
          v-model="formData.municipality"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="City or municipality"
          @input="validateForm"
        />
      </div>

      <!-- Urban/Rural -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Area Type
        </label>
        <select
          v-model="formData.urbanRural"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @change="validateForm"
        >
          <option value="">Select area type</option>
          <option value="urban">Urban</option>
          <option value="rural">Rural</option>
          <option value="suburban">Suburban</option>
        </select>
      </div>

      <!-- Project Address -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Project Address
        </label>
        <textarea
          v-model="formData.address"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Full street address of the project site"
          @input="validateForm"
        ></textarea>
      </div>

      <!-- Building Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Building/Facility Name
        </label>
        <input
          v-model="formData.buildingName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Name of the building or facility"
          @input="validateForm"
        />
      </div>

      <!-- Constituency -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Constituency
        </label>
        <input
          v-model="formData.constituency"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Electoral constituency"
          @input="validateForm"
        />
      </div>

      <!-- Coordinates Section -->
      <div class="md:col-span-2">
        <div class="border-t pt-4">
          <AlbertaText variant="body-m" class="font-medium mb-3">
            Geographic Coordinates (Optional)
          </AlbertaText>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Latitude -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                v-model.number="formData.latitude"
                type="number"
                step="any"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 51.0447"
                @input="validateForm"
              />
            </div>

            <!-- Longitude -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                v-model.number="formData.longitude"
                type="number"
                step="any"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., -114.0719"
                @input="validateForm"
              />
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
            <strong>Tip:</strong> Providing accurate location information helps with project planning, 
            resource allocation, and stakeholder communication. The primary location field is required, 
            but additional details help create a complete project profile.
          </AlbertaText>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { AlertCircle, Info } from 'lucide-vue-next'
import { AlbertaText } from '@/components/ui'

// Props
const props = defineProps<{
  data?: any
}>()

// Emits
const emit = defineEmits<{
  dataUpdated: [data: any]
  stepCompleted: [isValid: boolean]
}>()

// Form data
const formData = ref({
  location: '',
  municipality: '',
  urbanRural: '',
  address: '',
  buildingName: '',
  constituency: '',
  latitude: null as number | null,
  longitude: null as number | null
})

// Validation errors
const errors = ref<Record<string, string>>({})

// Computed
const isValid = computed(() => {
  return Object.keys(errors.value).length === 0 && formData.value.location.trim().length > 0
})

// Methods
const validateForm = () => {
  errors.value = {}

  // Validate required fields
  if (!formData.value.location || formData.value.location.trim().length === 0) {
    errors.value.location = 'Primary location is required'
  }

  // Validate coordinates if provided
  if (formData.value.latitude !== null && (formData.value.latitude < -90 || formData.value.latitude > 90)) {
    errors.value.latitude = 'Latitude must be between -90 and 90'
  }

  if (formData.value.longitude !== null && (formData.value.longitude < -180 || formData.value.longitude > 180)) {
    errors.value.longitude = 'Longitude must be between -180 and 180'
  }

  // Emit validation status
  emit('stepCompleted', isValid.value)
}

// Watch for form changes
watch(formData, (newData) => {
  emit('dataUpdated', { ...newData })
}, { deep: true })

// Initialize with existing data
onMounted(() => {
  if (props.data) {
    Object.assign(formData.value, props.data)
  }
  validateForm()
})
</script>

<style scoped>
/* Component-specific styles */
.form-section {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.error-input {
  @apply border-red-300 focus:ring-red-500;
}
</style>

