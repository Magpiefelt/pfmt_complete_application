<template>
  <div class="space-y-6">
    <!-- Step Header -->
    <div class="text-center">
      <AlbertaText tag="h3" variant="heading-m" color="primary">
        Project Details
      </AlbertaText>
      <AlbertaText variant="body-m" color="secondary" class="mt-2">
        Provide basic information about your project
      </AlbertaText>
    </div>

    <!-- Project Details Form -->
    <div class="space-y-6">
      <!-- Project Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Project Name *
        </label>
        <input
          v-model="formData.projectName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter a descriptive project name"
          @input="validateForm"
        />
        <p v-if="errors.projectName" class="mt-1 text-sm text-red-600">
          {{ errors.projectName }}
        </p>
      </div>

      <!-- Project Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Project Description *
        </label>
        <textarea
          v-model="formData.description"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the project scope, objectives, and key deliverables"
          @input="validateForm"
        ></textarea>
        <p v-if="errors.description" class="mt-1 text-sm text-red-600">
          {{ errors.description }}
        </p>
      </div>

      <!-- Project Category and Type -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Project Category *
          </label>
          <select
            v-model="formData.category"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="validateForm"
          >
            <option value="">Select category</option>
            <option value="construction">Construction</option>
            <option value="renovation">Renovation</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="technology">Technology</option>
            <option value="consulting">Consulting</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <p v-if="errors.category" class="mt-1 text-sm text-red-600">
            {{ errors.category }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Project Type
          </label>
          <select
            v-model="formData.projectType"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select type</option>
            <option value="new_construction">New Construction</option>
            <option value="renovation">Renovation</option>
            <option value="expansion">Expansion</option>
            <option value="upgrade">Upgrade</option>
            <option value="maintenance">Maintenance</option>
            <option value="consulting">Consulting</option>
          </select>
        </div>
      </div>

      <!-- Delivery Information -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Delivery Type
          </label>
          <select
            v-model="formData.deliveryType"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select delivery type</option>
            <option value="design_bid_build">Design-Bid-Build</option>
            <option value="design_build">Design-Build</option>
            <option value="construction_management">Construction Management</option>
            <option value="public_private_partnership">Public-Private Partnership</option>
            <option value="traditional">Traditional</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Program
          </label>
          <select
            v-model="formData.program"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select program</option>
            <option value="government_facilities">Government Facilities</option>
            <option value="education">Education</option>
            <option value="healthcare">Healthcare</option>
            <option value="justice">Justice</option>
            <option value="transportation">Transportation</option>
            <option value="utilities">Utilities</option>
          </select>
        </div>
      </div>

      <!-- Geographic Region -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Geographic Region
          </label>
          <select
            v-model="formData.region"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select region</option>
            <option value="central">Central Alberta</option>
            <option value="north">Northern Alberta</option>
            <option value="south">Southern Alberta</option>
            <option value="northeast">Northeast Alberta</option>
            <option value="northwest">Northwest Alberta</option>
            <option value="provincial">Provincial</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Funded to Complete
          </label>
          <div class="flex items-center space-x-4 mt-3">
            <label class="flex items-center">
              <input
                v-model="formData.fundedToComplete"
                type="radio"
                :value="true"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span class="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="formData.fundedToComplete"
                type="radio"
                :value="false"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span class="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Project Dates -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Planned Start Date
          </label>
          <input
            v-model="formData.startDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Expected Completion Date
          </label>
          <input
            v-model="formData.expectedCompletion"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
            <strong>Tip:</strong> Provide clear and descriptive information about your project. 
            This information will be used throughout the project lifecycle and will be visible 
            to all stakeholders. Required fields are marked with an asterisk (*).
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
  template?: any
}>()

// Emits
const emit = defineEmits<{
  dataUpdated: [data: any]
  stepCompleted: [isValid: boolean]
}>()

// Form data
const formData = ref({
  projectName: '',
  description: '',
  category: '',
  projectType: '',
  deliveryType: '',
  program: '',
  region: '',
  fundedToComplete: false,
  startDate: '',
  expectedCompletion: ''
})

// Validation errors
const errors = ref<Record<string, string>>({})

// Computed
const isValid = computed(() => {
  return Object.keys(errors.value).length === 0 && 
         formData.value.projectName.trim().length > 0 &&
         formData.value.description.trim().length > 0 &&
         formData.value.category.length > 0
})

// Methods
const validateForm = () => {
  errors.value = {}

  // Validate required fields
  if (!formData.value.projectName || formData.value.projectName.trim().length < 3) {
    errors.value.projectName = 'Project name must be at least 3 characters'
  }

  if (!formData.value.description || formData.value.description.trim().length < 10) {
    errors.value.description = 'Description must be at least 10 characters'
  }

  if (!formData.value.category) {
    errors.value.category = 'Project category is required'
  }

  // Validate date logic
  if (formData.value.startDate && formData.value.expectedCompletion) {
    const startDate = new Date(formData.value.startDate)
    const endDate = new Date(formData.value.expectedCompletion)
    
    if (endDate <= startDate) {
      errors.value.expectedCompletion = 'Expected completion date must be after start date'
    }
  }

  // Emit validation status
  emit('stepCompleted', isValid.value)
}

// Watch for form changes
watch(formData, (newData) => {
  emit('dataUpdated', { ...newData })
}, { deep: true })

// Initialize with existing data or template
onMounted(() => {
  if (props.data) {
    Object.assign(formData.value, props.data)
  }
  
  // Pre-fill from template if provided
  if (props.template) {
    if (props.template.category) {
      formData.value.category = props.template.category
    }
    if (props.template.template_data) {
      const templateData = typeof props.template.template_data === 'string' 
        ? JSON.parse(props.template.template_data) 
        : props.template.template_data
      
      if (templateData.projectType) {
        formData.value.projectType = templateData.projectType
      }
      if (templateData.deliveryType) {
        formData.value.deliveryType = templateData.deliveryType
      }
      if (templateData.program) {
        formData.value.program = templateData.program
      }
    }
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

