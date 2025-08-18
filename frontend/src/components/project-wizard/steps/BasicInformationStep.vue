<template>
  <div class="space-y-6">
    <!-- Step Header -->
    <div class="text-center">
      <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
        {{ template?.id === 'pfmt' ? 'Upload PFMT Excel File' : 'Project Information' }}
      </AlbertaText>
      <AlbertaText variant="body-m" color="secondary" class="max-w-2xl mx-auto">
        {{ template?.id === 'pfmt' 
          ? 'Upload your PFMT Excel file to automatically populate project details. You can review and modify the extracted information below.'
          : 'Provide the basic information about your project. This information will be used throughout the project lifecycle and can be updated later if needed.'
        }}
      </AlbertaText>
    </div>

    <!-- PFMT Upload Section (only shown for PFMT template) -->
    <div v-if="template?.id === 'pfmt'" class="max-w-2xl mx-auto">
      <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div class="flex items-center mb-4">
          <Upload class="w-6 h-6 text-green-600 mr-3" />
          <AlbertaText tag="h4" variant="heading-s" color="primary">
            PFMT Excel Upload
          </AlbertaText>
        </div>
        
        <PFMTExtractor 
          @data-extracted="handlePFMTData"
          @error="handlePFMTError"
          :show-header="false"
          class="mb-4"
        />
        
        <div v-if="pfmtData" class="mt-4 p-3 bg-white border border-green-300 rounded-md">
          <div class="flex items-center text-green-700 mb-2">
            <CheckCircle class="w-4 h-4 mr-2" />
            <span class="text-sm font-medium">PFMT data extracted successfully</span>
          </div>
          <p class="text-sm text-green-600">
            {{ Object.keys(pfmtData).length }} fields extracted. Review and modify the information below as needed.
          </p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Project Name -->
      <div>
        <Label for="projectName" class="text-sm font-medium text-gray-700 mb-2 block">
          Project Name *
        </Label>
        <input
          id="projectName"
          v-model="formData.projectName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': errors.projectName }"
          placeholder="Enter project name"
          @blur="validateField('projectName')"
        />
        <p v-if="errors.projectName" class="mt-1 text-sm text-red-600">
          {{ errors.projectName }}
        </p>
      </div>

      <!-- Project Description -->
      <div>
        <Label for="description" class="text-sm font-medium text-gray-700 mb-2 block">
          Project Description *
        </Label>
        <textarea
          id="description"
          v-model="formData.description"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': errors.description }"
          placeholder="Describe the project objectives, scope, and key deliverables"
          @blur="validateField('description')"
        ></textarea>
        <p v-if="errors.description" class="mt-1 text-sm text-red-600">
          {{ errors.description }}
        </p>
        <p class="mt-1 text-sm text-gray-500">
          {{ formData.description.length }}/500 characters
        </p>
      </div>

      <!-- Project Category -->
      <div>
        <Label for="category" class="text-sm font-medium text-gray-700 mb-2 block">
          Project Category *
        </Label>
        <select
          id="category"
          v-model="formData.category"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': errors.category }"
          @change="validateField('category')"
        >
          <option value="">Select a category</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="Technology">Technology</option>
          <option value="Construction">Construction</option>
          <option value="Research">Research</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Renovation">Renovation</option>
          <option value="Other">Other</option>
        </select>
        <p v-if="errors.category" class="mt-1 text-sm text-red-600">
          {{ errors.category }}
        </p>
      </div>

      <!-- Project Type and Region Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Project Type -->
        <div>
          <Label for="projectType" class="text-sm font-medium text-gray-700 mb-2 block">
            Project Type
          </Label>
          <select
            id="projectType"
            v-model="formData.projectType"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Standard">Standard</option>
            <option value="Fast-Track">Fast-Track</option>
            <option value="Emergency">Emergency</option>
            <option value="Pilot">Pilot</option>
            <option value="Research">Research</option>
          </select>
        </div>

        <!-- Region -->
        <div>
          <Label for="region" class="text-sm font-medium text-gray-700 mb-2 block">
            Region
          </Label>
          <select
            id="region"
            v-model="formData.region"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Alberta">Alberta</option>
            <option value="Calgary">Calgary</option>
            <option value="Edmonton">Edmonton</option>
            <option value="Northern Alberta">Northern Alberta</option>
            <option value="Southern Alberta">Southern Alberta</option>
            <option value="Central Alberta">Central Alberta</option>
          </select>
        </div>
      </div>

      <!-- Ministry -->
      <div>
        <Label for="ministry" class="text-sm font-medium text-gray-700 mb-2 block">
          Ministry/Department
        </Label>
        <select
          id="ministry"
          v-model="formData.ministry"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="Infrastructure">Infrastructure</option>
          <option value="Transportation">Transportation</option>
          <option value="Education">Education</option>
          <option value="Health">Health</option>
          <option value="Environment">Environment</option>
          <option value="Technology and Innovation">Technology and Innovation</option>
          <option value="Municipal Affairs">Municipal Affairs</option>
          <option value="Energy">Energy</option>
          <option value="Agriculture">Agriculture</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <!-- Project Timeline Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Start Date -->
        <div>
          <Label for="startDate" class="text-sm font-medium text-gray-700 mb-2 block">
            Planned Start Date
          </Label>
          <input
            id="startDate"
            v-model="formData.startDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :min="today"
          />
        </div>

        <!-- Expected Completion -->
        <div>
          <Label for="expectedCompletion" class="text-sm font-medium text-gray-700 mb-2 block">
            Expected Completion
          </Label>
          <input
            id="expectedCompletion"
            v-model="formData.expectedCompletion"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :min="formData.startDate || today"
          />
        </div>
      </div>

      <!-- Team A Budget Fields Section -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <div class="flex items-center mb-4">
          <div class="w-5 h-5 text-blue-500 mr-3 flex-shrink-0">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8a2 2 0 000 4h8a2 2 0 000-4H6z"/>
            </svg>
          </div>
          <AlbertaText tag="h4" variant="heading-s" color="primary">
            Budget Information
          </AlbertaText>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Budget Estimate -->
          <div>
            <Label for="budgetEstimate" class="text-sm font-medium text-gray-700 mb-2 block">
              Budget Estimate
            </Label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                id="budgetEstimate"
                v-model.number="formData.budgetEstimate"
                type="number"
                step="0.01"
                min="0"
                class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Contingency -->
          <div>
            <Label for="contingency" class="text-sm font-medium text-gray-700 mb-2 block">
              Contingency
            </Label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                id="contingency"
                v-model.number="formData.contingency"
                type="number"
                step="0.01"
                min="0"
                class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Management Reserve -->
          <div>
            <Label for="managementReserve" class="text-sm font-medium text-gray-700 mb-2 block">
              Management Reserve
            </Label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                id="managementReserve"
                v-model.number="formData.managementReserve"
                type="number"
                step="0.01"
                min="0"
                class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Assigned PM -->
          <div>
            <Label for="assignedPm" class="text-sm font-medium text-gray-700 mb-2 block">
              Assigned Project Manager
            </Label>
            <select
              id="assignedPm"
              v-model="formData.assignedPm"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Project Manager</option>
              <option v-for="pm in projectManagers" :key="pm.id" :value="pm.id">
                {{ pm.first_name }} {{ pm.last_name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Total Budget Display -->
        <div v-if="totalBudget > 0" class="mt-4 p-3 bg-white border border-blue-300 rounded-md">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-700">Total Project Budget:</span>
            <span class="text-lg font-bold text-blue-600">${{ formatCurrency(totalBudget) }}</span>
          </div>
        </div>
      </div>

      <!-- Priority Level -->
      <div>
        <Label class="text-sm font-medium text-gray-700 mb-3 block">
          Project Priority
        </Label>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div
            v-for="priority in priorityOptions"
            :key="priority.value"
            class="relative"
          >
            <input
              :id="`priority-${priority.value}`"
              v-model="formData.priority"
              :value="priority.value"
              type="radio"
              name="priority"
              class="sr-only"
            />
            <label
              :for="`priority-${priority.value}`"
              class="flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all"
              :class="formData.priority === priority.value
                ? `border-${priority.color}-500 bg-${priority.color}-50 text-${priority.color}-700`
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'"
            >
              <div class="text-center">
                <div :class="`w-3 h-3 rounded-full bg-${priority.color}-500 mx-auto mb-1`"></div>
                <div class="text-sm font-medium">{{ priority.label }}</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Template Information (if template selected) -->
      <div v-if="template && template.id !== 'custom'" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
          <div class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <AlbertaText tag="h5" variant="heading-xs" color="primary" class="mb-1">
              Template: {{ template.name }}
            </AlbertaText>
            <AlbertaText variant="body-s" color="secondary">
              Some fields have been pre-filled based on your selected template. You can modify any of these values as needed.
            </AlbertaText>
          </div>
        </div>
      </div>

      <!-- Validation Summary -->
      <div v-if="Object.keys(errors).length > 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start">
          <div class="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <AlbertaText tag="h5" variant="heading-xs" color="primary" class="mb-1">
              Please fix the following errors:
            </AlbertaText>
            <ul class="text-sm text-red-600 space-y-1">
              <li v-for="(error, field) in errors" :key="field">
                • {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Upload, CheckCircle } from 'lucide-vue-next'
import { AlbertaText, Label } from '@/components/ui'
import PFMTExtractor from '@/components/pfmt/PFMTExtractor.vue'

// Props
const props = defineProps<{
  template?: any
  data: any
}>()

// Emits
const emit = defineEmits<{
  dataUpdated: [data: any]
  stepCompleted: [data: any]
}>()

// Form data
const formData = reactive({
  projectName: '',
  description: '',
  category: '',
  projectType: 'Standard',
  region: 'Alberta',
  ministry: 'Infrastructure',
  startDate: null,
  expectedCompletion: null,
  priority: 'Medium',
  // Team A budget fields
  budgetEstimate: 0,
  contingency: 0,
  managementReserve: 0,
  assignedPm: '',
  ...props.data
})

// Validation errors
const errors = reactive({})

// PFMT data
const pfmtData = ref(null)

// Project managers data (this would typically come from an API)
const projectManagers = ref([
  { id: 1, first_name: 'John', last_name: 'Smith' },
  { id: 2, first_name: 'Sarah', last_name: 'Johnson' },
  { id: 3, first_name: 'Michael', last_name: 'Brown' },
  { id: 4, first_name: 'Emily', last_name: 'Davis' },
  { id: 5, first_name: 'David', last_name: 'Wilson' }
])

// PFMT handling methods
const handlePFMTData = (data: any) => {
  pfmtData.value = data
  
  // Pre-populate form data from PFMT
  if (data.projectName) formData.projectName = data.projectName
  if (data.description) formData.description = data.description
  if (data.category) formData.category = data.category
  if (data.ministry) formData.ministry = data.ministry
  if (data.region) formData.region = data.region
  if (data.projectType) formData.projectType = data.projectType
  if (data.startDate) formData.startDate = data.startDate
  if (data.expectedCompletion) formData.expectedCompletion = data.expectedCompletion
  if (data.priority) formData.priority = data.priority
  
  // Team A budget fields from PFMT
  if (data.budgetEstimate) formData.budgetEstimate = data.budgetEstimate
  if (data.contingency) formData.contingency = data.contingency
  if (data.managementReserve) formData.managementReserve = data.managementReserve
  if (data.assignedPm) formData.assignedPm = data.assignedPm
  
  // Emit updated data
  emit('dataUpdated', { ...formData, pfmtData: data })
}

const handlePFMTError = (error: any) => {
  console.error('PFMT extraction error:', error)
  // Handle error display - could show a toast or error message
}

// Priority options
const priorityOptions = [
  { value: 'Low', label: 'Low', color: 'green' },
  { value: 'Medium', label: 'Medium', color: 'blue' },
  { value: 'High', label: 'High', color: 'orange' },
  { value: 'Critical', label: 'Critical', color: 'red' }
]

// Computed
const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const isValid = computed(() => {
  return Object.keys(errors).length === 0 && 
         formData.projectName.trim().length >= 3 &&
         formData.description.trim().length >= 10 &&
         formData.category
})

// Team A computed properties
const totalBudget = computed(() => {
  const budget = (formData.budgetEstimate || 0) + (formData.contingency || 0) + (formData.managementReserve || 0)
  return budget
})

// Methods
const validateField = (fieldName: string) => {
  delete errors[fieldName]

  switch (fieldName) {
    case 'projectName':
      if (!formData.projectName.trim()) {
        errors[fieldName] = 'Project name is required'
      } else if (formData.projectName.trim().length < 3) {
        errors[fieldName] = 'Project name must be at least 3 characters'
      } else if (formData.projectName.length > 100) {
        errors[fieldName] = 'Project name must be less than 100 characters'
      }
      break

    case 'description':
      if (!formData.description.trim()) {
        errors[fieldName] = 'Project description is required'
      } else if (formData.description.trim().length < 10) {
        errors[fieldName] = 'Description must be at least 10 characters'
      } else if (formData.description.length > 500) {
        errors[fieldName] = 'Description must be less than 500 characters'
      }
      break

    case 'category':
      if (!formData.category) {
        errors[fieldName] = 'Project category is required'
      }
      break
  }
}

const validateAllFields = () => {
  validateField('projectName')
  validateField('description')
  validateField('category')
}

// Team A utility methods
const formatCurrency = (value: number) => {
  if (!value) return '0.00'
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Watch for changes and emit updates
watch(formData, (newData) => {
  emit('dataUpdated', { ...newData })



  
  if (isValid.value) {
    emit('stepCompleted', { ...formData })
  }
}, { deep: true })

// Pre-fill from template
watch(() => props.template, (newTemplate) => {
  if (newTemplate && newTemplate.id !== 'custom') {
    formData.category = newTemplate.category
    formData.projectType = newTemplate.template_data?.type || 'Standard'
    
    // Set estimated completion based on duration
    if (newTemplate.estimated_duration && formData.startDate) {
      const startDate = new Date(formData.startDate)
      const completionDate = new Date(startDate)
      completionDate.setDate(startDate.getDate() + newTemplate.estimated_duration)
      formData.expectedCompletion = completionDate.toISOString().split('T')[0]
    }
  }
}, { immediate: true })

// Set default start date to today
onMounted(() => {
  if (!formData.startDate) {
    formData.startDate = today.value
  }
  
  // Set default completion date (1 year from start)
  if (!formData.expectedCompletion && formData.startDate) {
    const startDate = new Date(formData.startDate)
    const completionDate = new Date(startDate)
    completionDate.setFullYear(startDate.getFullYear() + 1)
    formData.expectedCompletion = completionDate.toISOString().split('T')[0]
  }
})
</script>

<style scoped>
/* Custom styles for priority selection */
.priority-option {
  transition: all 0.2s ease-in-out;
}

.priority-option:hover {
  transform: translateY(-1px);
}

/* Character counter styling */
textarea + p {
  text-align: right;
}
</style>

