<template>
  <div class="space-y-6">
    <!-- Step Header -->
    <div class="text-center">
      <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
        Budget Configuration
      </AlbertaText>
      <AlbertaText variant="body-m" color="secondary" class="max-w-2xl mx-auto">
        Set up your project budget and financial planning. You can adjust these values later
        as your project requirements become more defined.
      </AlbertaText>
    </div>

    <!-- Form -->
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Template Budget Info -->
      <div v-if="template && template.id !== 'custom' && template.default_budget" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
          <div class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <AlbertaText tag="h5" variant="heading-xs" color="primary" class="mb-1">
              Template Budget: ${{ formatCurrency(template.default_budget) }}
            </AlbertaText>
            <AlbertaText variant="body-s" color="secondary">
              This is the recommended budget for {{ template.name }} projects. You can adjust this amount based on your specific requirements.
            </AlbertaText>
          </div>
        </div>
      </div>

      <!-- Total Budget -->
      <div>
        <Label for="totalBudget" class="text-sm font-medium text-gray-700 mb-2 block">
          Total Project Budget *
        </Label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            id="totalBudget"
            v-model.number="formData.totalBudget"
            type="number"
            step="1000"
            min="0"
            class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': errors.totalBudget }"
            placeholder="0"
            @blur="validateField('totalBudget')"
            @input="updateBudgetCalculations"
          />
        </div>
        <p v-if="errors.totalBudget" class="mt-1 text-sm text-red-600">
          {{ errors.totalBudget }}
        </p>
        <p class="mt-1 text-sm text-gray-500">
          Enter the total approved budget for this project
        </p>
      </div>

      <!-- Initial Budget Allocation -->
      <div>
        <Label for="initialBudget" class="text-sm font-medium text-gray-700 mb-2 block">
          Initial Budget Allocation
        </Label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            id="initialBudget"
            v-model.number="formData.initialBudget"
            type="number"
            step="1000"
            min="0"
            :max="formData.totalBudget"
            class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': errors.initialBudget }"
            placeholder="0"
            @blur="validateField('initialBudget')"
          />
        </div>
        <p v-if="errors.initialBudget" class="mt-1 text-sm text-red-600">
          {{ errors.initialBudget }}
        </p>
        <p class="mt-1 text-sm text-gray-500">
          Amount available for immediate use ({{ initialBudgetPercentage }}% of total budget)
        </p>
      </div>

      <!-- Budget Breakdown -->
      <div>
        <Label class="text-sm font-medium text-gray-700 mb-3 block">
          Budget Breakdown (Optional)
        </Label>
        <div class="space-y-3">
          <div
            v-for="(category, index) in budgetCategories"
            :key="index"
            class="flex items-center space-x-3"
          >
            <div class="flex-1">
              <input
                v-model="category.name"
                type="text"
                placeholder="Category name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div class="w-32">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 text-sm">$</span>
                </div>
                <input
                  v-model.number="category.amount"
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="0"
                  class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  @input="updateBudgetCalculations"
                />
              </div>
            </div>
            <button
              @click="removeBudgetCategory(index)"
              class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
              :disabled="budgetCategories.length <= 1"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          @click="addBudgetCategory"
          class="mt-3"
        >
          <Plus class="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <!-- Budget Summary -->
      <div v-if="formData.totalBudget > 0" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <AlbertaText tag="h5" variant="heading-xs" color="primary" class="mb-3">
          Budget Summary
        </AlbertaText>
        
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Total Budget:</span>
            <span class="text-sm font-medium">${{ formatCurrency(formData.totalBudget) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Initial Allocation:</span>
            <span class="text-sm font-medium">${{ formatCurrency(formData.initialBudget) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Reserved:</span>
            <span class="text-sm font-medium">${{ formatCurrency(formData.totalBudget - formData.initialBudget) }}</span>
          </div>
          
          <div v-if="budgetCategoriesTotal > 0" class="pt-2 border-t border-gray-300">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Categories Total:</span>
              <span class="text-sm font-medium">${{ formatCurrency(budgetCategoriesTotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Unallocated:</span>
              <span 
                class="text-sm font-medium"
                :class="budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                ${{ formatCurrency(Math.abs(budgetVariance)) }}
                {{ budgetVariance >= 0 ? 'remaining' : 'over budget' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Budget Visualization -->
        <div v-if="budgetCategoriesTotal > 0" class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div 
              class="bg-blue-500 h-3 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min((budgetCategoriesTotal / formData.totalBudget) * 100, 100)}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-500 mt-1 text-center">
            {{ Math.round((budgetCategoriesTotal / formData.totalBudget) * 100) }}% allocated
          </p>
        </div>
      </div>

      <!-- Project Duration -->
      <div>
        <Label for="estimatedDuration" class="text-sm font-medium text-gray-700 mb-2 block">
          Estimated Duration (Days)
        </Label>
        <input
          id="estimatedDuration"
          v-model.number="formData.estimatedDuration"
          type="number"
          min="1"
          max="3650"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="365"
        />
        <p class="mt-1 text-sm text-gray-500">
          Approximately {{ Math.round(formData.estimatedDuration / 30) }} months
          ({{ Math.round(formData.estimatedDuration / 365 * 10) / 10 }} years)
        </p>
      </div>

      <!-- Funding Source -->
      <div>
        <Label for="fundingSource" class="text-sm font-medium text-gray-700 mb-2 block">
          Primary Funding Source
        </Label>
        <select
          id="fundingSource"
          v-model="formData.fundingSource"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="Provincial Budget">Provincial Budget</option>
          <option value="Federal Grant">Federal Grant</option>
          <option value="Municipal Partnership">Municipal Partnership</option>
          <option value="Private Partnership">Private Partnership</option>
          <option value="Special Fund">Special Fund</option>
          <option value="Emergency Fund">Emergency Fund</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <!-- Budget Approval Required -->
      <div class="flex items-center space-x-3">
        <input
          id="requiresApproval"
          v-model="formData.requiresApproval"
          type="checkbox"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <Label for="requiresApproval" class="text-sm text-gray-700">
          This budget requires additional approval before project start
        </Label>
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
import { X, Plus } from 'lucide-vue-next'
import { AlbertaText, Label, Button } from '@/components/ui'
import { formatCurrency } from '@/utils'

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
  totalBudget: 0,
  initialBudget: 0,
  estimatedDuration: 365,
  fundingSource: 'Provincial Budget',
  requiresApproval: false,
  budgetBreakdown: [],
  ...props.data
})

// Budget categories for breakdown
const budgetCategories = ref([
  { name: 'Personnel', amount: 0 },
  { name: 'Materials', amount: 0 },
  { name: 'Equipment', amount: 0 },
  { name: 'Contingency', amount: 0 }
])

// Validation errors
const errors = reactive({})

// Computed properties
const initialBudgetPercentage = computed(() => {
  if (formData.totalBudget === 0) return 0
  return Math.round((formData.initialBudget / formData.totalBudget) * 100)
})

const budgetCategoriesTotal = computed(() => {
  return budgetCategories.value.reduce((total, category) => total + (category.amount || 0), 0)
})

const budgetVariance = computed(() => {
  return formData.totalBudget - budgetCategoriesTotal.value
})

const isValid = computed(() => {
  return Object.keys(errors).length === 0 && formData.totalBudget > 0
})

// Methods
const validateField = (fieldName: string) => {
  delete errors[fieldName]

  switch (fieldName) {
    case 'totalBudget':
      if (!formData.totalBudget || formData.totalBudget <= 0) {
        errors[fieldName] = 'Total budget must be greater than 0'
      } else if (formData.totalBudget > 100000000) {
        errors[fieldName] = 'Total budget seems unreasonably high'
      }
      break

    case 'initialBudget':
      if (formData.initialBudget > formData.totalBudget) {
        errors[fieldName] = 'Initial budget cannot exceed total budget'
      }
      break
  }
}

const updateBudgetCalculations = () => {
  // Auto-set initial budget to 50% of total if not set
  if (formData.totalBudget > 0 && formData.initialBudget === 0) {
    formData.initialBudget = Math.round(formData.totalBudget * 0.5)
  }
  
  validateField('totalBudget')
  validateField('initialBudget')
}

const addBudgetCategory = () => {
  budgetCategories.value.push({ name: '', amount: 0 })
}

const removeBudgetCategory = (index: number) => {
  if (budgetCategories.value.length > 1) {
    budgetCategories.value.splice(index, 1)
    updateBudgetCalculations()
  }
}

// Watch for changes and emit updates
watch(formData, (newData) => {
  const dataWithBreakdown = {
    ...newData,
    budgetBreakdown: budgetCategories.value.filter(cat => cat.name && cat.amount > 0)
  }
  emit('dataUpdated', dataWithBreakdown)
  
  if (isValid.value) {
    emit('stepCompleted', dataWithBreakdown)
  }
}, { deep: true })

watch(budgetCategories, () => {
  updateBudgetCalculations()
}, { deep: true })

// Pre-fill from template
watch(() => props.template, (newTemplate) => {
  if (newTemplate && newTemplate.id !== 'custom') {
    if (newTemplate.default_budget) {
      formData.totalBudget = newTemplate.default_budget
      formData.initialBudget = Math.round(newTemplate.default_budget * 0.5)
    }
    
    if (newTemplate.estimated_duration) {
      formData.estimatedDuration = newTemplate.estimated_duration
    }
  }
}, { immediate: true })

// Initialize
onMounted(() => {
  if (formData.totalBudget > 0 && formData.initialBudget === 0) {
    formData.initialBudget = Math.round(formData.totalBudget * 0.5)
  }
})
</script>

<style scoped>
/* Custom styles for budget visualization */
.budget-bar {
  transition: width 0.3s ease-in-out;
}

/* Number input styling */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>

