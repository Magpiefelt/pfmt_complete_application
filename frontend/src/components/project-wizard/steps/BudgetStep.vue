<template>
  <div class="space-y-6">
    <!-- Step Header -->
    <div class="text-center">
      <AlbertaText tag="h3" variant="heading-m" color="primary">
        Project Budget
      </AlbertaText>
      <AlbertaText variant="body-m" color="secondary" class="mt-2">
        Set up the initial budget for your project
      </AlbertaText>
    </div>

    <!-- Budget Form -->
    <div class="space-y-6">
      <!-- Total Budget -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Total Project Budget *
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-gray-500">$</span>
            <input
              v-model.number="formData.totalBudget"
              type="number"
              min="0"
              step="1000"
              class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              @input="validateForm"
            />
          </div>
          <p v-if="errors.totalBudget" class="mt-1 text-sm text-red-600">
            {{ errors.totalBudget }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fiscal Year *
          </label>
          <select
            v-model="formData.fiscalYear"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="validateForm"
          >
            <option value="">Select fiscal year</option>
            <option v-for="year in fiscalYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
          <p v-if="errors.fiscalYear" class="mt-1 text-sm text-red-600">
            {{ errors.fiscalYear }}
          </p>
        </div>
      </div>

      <!-- Budget Categories -->
      <div class="border border-gray-200 rounded-lg">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <AlbertaText variant="body-m" class="font-medium">
            Budget Categories
          </AlbertaText>
          <Button
            variant="outline"
            size="sm"
            @click="addCategory"
            :disabled="!formData.totalBudget"
          >
            <Plus class="w-4 h-4 mr-1" />
            Add Category
          </Button>
        </div>

        <div v-if="formData.categories.length === 0" class="p-4 text-center">
          <AlbertaText variant="body-s" color="secondary">
            No budget categories defined yet. Add categories to organize your budget.
          </AlbertaText>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="(category, index) in formData.categories"
            :key="index"
            class="p-4"
          >
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  v-model="category.name"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Construction, Design"
                  @input="validateForm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Allocated Amount *
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    v-model.number="category.amount"
                    type="number"
                    min="0"
                    step="1000"
                    class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    @input="validateForm"
                  />
                </div>
              </div>

              <div class="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  @click="removeCategory(index)"
                  class="text-red-600 hover:text-red-700"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Budget Summary -->
        <div v-if="formData.categories.length > 0" class="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div class="flex justify-between items-center">
            <AlbertaText variant="body-s" class="font-medium">
              Total Allocated:
            </AlbertaText>
            <AlbertaText 
              variant="body-s" 
              :class="totalAllocated > formData.totalBudget ? 'text-red-600 font-medium' : 'text-gray-900'"
            >
              ${{ formatCurrency(totalAllocated) }}
            </AlbertaText>
          </div>
          <div class="flex justify-between items-center mt-1">
            <AlbertaText variant="body-s" class="font-medium">
              Remaining:
            </AlbertaText>
            <AlbertaText 
              variant="body-s" 
              :class="remaining < 0 ? 'text-red-600 font-medium' : 'text-green-600'"
            >
              ${{ formatCurrency(remaining) }}
            </AlbertaText>
          </div>
          
          <!-- Progress Bar -->
          <div class="mt-3">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                :class="allocationPercentage > 100 ? 'bg-red-500' : 'bg-blue-600'"
                :style="{ width: `${Math.min(allocationPercentage, 100)}%` }"
              ></div>
            </div>
            <AlbertaText variant="body-xs" color="secondary" class="mt-1">
              {{ allocationPercentage.toFixed(1) }}% of total budget allocated
            </AlbertaText>
          </div>
        </div>
      </div>

      <!-- Budget Notes -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Budget Notes
        </label>
        <textarea
          v-model="formData.notes"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add any notes about the budget assumptions, constraints, or special considerations"
        ></textarea>
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

    <!-- Warning for over-allocation -->
    <div v-if="totalAllocated > formData.totalBudget" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div class="flex">
        <AlertTriangle class="h-5 w-5 text-yellow-400" />
        <div class="ml-3">
          <AlbertaText variant="body-s" class="text-yellow-800 font-medium">
            Budget Over-Allocation Warning
          </AlbertaText>
          <AlbertaText variant="body-s" class="text-yellow-700 mt-1">
            Your category allocations (${{ formatCurrency(totalAllocated) }}) exceed the total budget 
            (${{ formatCurrency(formData.totalBudget) }}). Please adjust the allocations or increase the total budget.
          </AlbertaText>
        </div>
      </div>
    </div>

    <!-- Help Text -->
    <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
      <div class="flex">
        <Info class="h-5 w-5 text-blue-400" />
        <div class="ml-3">
          <AlbertaText variant="body-s" class="text-blue-800">
            <strong>Tip:</strong> Set a realistic total budget and break it down into categories for better 
            financial tracking. You can add more detailed budget entries later from the project detail page. 
            Categories help organize expenses and provide better visibility into spending patterns.
          </AlbertaText>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { AlertCircle, AlertTriangle, Info, Plus, Trash2 } from 'lucide-vue-next'
import { AlbertaText, Button } from '@/components/ui'

// Props
const props = defineProps<{
  data?: any
  template?: any
}>()

// Emits
const emit = defineEmits<{
  'update:data': [data: any]
  stepCompleted: [isValid: boolean]
}>()

// Form data
const formData = ref({
  totalBudget: 0,
  fiscalYear: '',
  categories: [] as Array<{
    name: string
    code?: string
    amount: number
  }>,
  notes: ''
})

// Validation errors
const errors = ref<Record<string, string>>({})

// Computed
const currentYear = new Date().getFullYear()
const fiscalYears = computed(() => {
  const years = []
  for (let i = currentYear - 1; i <= currentYear + 5; i++) {
    years.push(i.toString())
  }
  return years
})

const totalAllocated = computed(() => {
  return formData.value.categories.reduce((sum, category) => sum + (category.amount || 0), 0)
})

const remaining = computed(() => {
  return formData.value.totalBudget - totalAllocated.value
})

const allocationPercentage = computed(() => {
  if (formData.value.totalBudget === 0) return 0
  return (totalAllocated.value / formData.value.totalBudget) * 100
})

const isValid = computed(() => {
  return Object.keys(errors.value).length === 0 && 
         formData.value.totalBudget > 0 &&
         formData.value.fiscalYear.length > 0 &&
         totalAllocated.value <= formData.value.totalBudget
})

// Methods
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const addCategory = () => {
  formData.value.categories.push({
    name: '',
    amount: 0
  })
}

const removeCategory = (index: number) => {
  formData.value.categories.splice(index, 1)
  validateForm()
}

const validateForm = () => {
  errors.value = {}

  // Validate required fields
  if (!formData.value.totalBudget || formData.value.totalBudget <= 0) {
    errors.value.totalBudget = 'Total budget must be greater than 0'
  }

  if (!formData.value.fiscalYear) {
    errors.value.fiscalYear = 'Fiscal year is required'
  }

  // Validate categories
  formData.value.categories.forEach((category, index) => {
    if (!category.name || category.name.trim().length === 0) {
      errors.value[`category_${index}_name`] = `Category ${index + 1} name is required`
    }
    if (!category.amount || category.amount <= 0) {
      errors.value[`category_${index}_amount`] = `Category ${index + 1} amount must be greater than 0`
    }
  })

  // Validate total allocation
  if (totalAllocated.value > formData.value.totalBudget) {
    errors.value.allocation = 'Total category allocations cannot exceed total budget'
  }

  // Emit validation status
  emit('stepCompleted', isValid.value)
}

// Watch for form changes
watch(formData, (newData) => {
  emit('update:data', { ...newData })
}, { deep: true })

// Initialize with existing data or template
onMounted(() => {
  if (props.data) {
    Object.assign(formData.value, props.data)
  }
  
  // Pre-fill from template if provided
  if (props.template) {
    if (props.template.default_budget) {
      formData.value.totalBudget = props.template.default_budget
    }
    
    // Set default fiscal year to current year
    if (!formData.value.fiscalYear) {
      formData.value.fiscalYear = currentYear.toString()
    }
    
    // Add default categories if none exist
    if (formData.value.categories.length === 0) {
      formData.value.categories = [
        { name: 'Construction', amount: 0 },
        { name: 'Design & Engineering', amount: 0 },
        { name: 'Project Management', amount: 0 },
        { name: 'Contingency', amount: 0 }
      ]
    }
  } else {
    // Set default fiscal year
    if (!formData.value.fiscalYear) {
      formData.value.fiscalYear = currentYear.toString()
    }
  }
  
  validateForm()
})
</script>

<style scoped>
/* Component-specific styles */
.budget-category {
  @apply border border-gray-200 rounded-lg p-4 space-y-4;
}

.budget-summary {
  @apply bg-gray-50 border-t border-gray-200 p-4;
}

.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-2;
}

.progress-fill {
  @apply h-2 rounded-full transition-all duration-300;
}
</style>

