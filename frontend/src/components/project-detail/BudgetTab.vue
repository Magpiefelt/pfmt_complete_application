<template>
  <div class="space-y-6">
    <!-- Budget Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <DollarSign class="h-5 w-5 text-green-600" />
            <div>
              <p class="text-sm font-medium text-gray-600">Total Approved</p>
              <p class="text-2xl font-bold text-green-600">{{ formatCurrency(budgetData.total_approved_funding) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <TrendingUp class="h-5 w-5 text-blue-600" />
            <div>
              <p class="text-sm font-medium text-gray-600">Current Budget</p>
              <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(budgetData.current_budget) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <TrendingDown class="h-5 w-5 text-orange-600" />
            <div>
              <p class="text-sm font-medium text-gray-600">Amount Spent</p>
              <p class="text-2xl font-bold text-orange-600">{{ formatCurrency(budgetData.amount_spent) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <Calculator class="h-5 w-5" :class="remainingAmountClass" />
            <div>
              <p class="text-sm font-medium text-gray-600">Remaining</p>
              <p class="text-2xl font-bold" :class="remainingAmountClass">{{ formatCurrency(remainingAmount) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Budget Progress -->
    <Card>
      <CardHeader>
        <CardTitle>Budget Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center justify-between text-sm">
            <span>Budget Utilization</span>
            <span class="font-medium">{{ budgetUtilizationPercentage }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div 
              class="h-3 rounded-full transition-all duration-300"
              :class="budgetProgressClass"
              :style="{ width: `${Math.min(budgetUtilizationPercentage, 100)}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-gray-500">
            <span>{{ formatCurrency(0) }}</span>
            <span>{{ formatCurrency(budgetData.current_budget) }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Budget Details Form -->
    <Card>
      <CardHeader>
        <CardTitle>Budget Information</CardTitle>
        <CardDescription v-if="!canEdit">
          View detailed budget breakdown and financial information.
        </CardDescription>
        <CardDescription v-else>
          Update budget allocations and financial details.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Main Budget Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="total-approved">Total Approved Funding *</Label>
            <div class="relative mt-1">
              <DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="total-approved"
                v-model="budgetData.total_approved_funding"
                :disabled="!canEdit"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                class="pl-10"
                @input="calculateDerived"
              />
            </div>
          </div>

          <div>
            <Label for="current-budget">Current Budget</Label>
            <div class="relative mt-1">
              <DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="current-budget"
                v-model="budgetData.current_budget"
                :disabled="!canEdit"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                class="pl-10"
                @input="calculateDerived"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="amount-spent">Amount Spent</Label>
            <div class="relative mt-1">
              <DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="amount-spent"
                v-model="budgetData.amount_spent"
                :disabled="!canEdit"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                class="pl-10"
                @input="calculateDerived"
              />
            </div>
          </div>

          <div>
            <Label for="eac">Estimate at Completion (EAC)</Label>
            <div class="relative mt-1">
              <DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="eac"
                v-model="budgetData.eac"
                :disabled="!canEdit"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                class="pl-10"
              />
            </div>
          </div>
        </div>

        <!-- Budget Categories -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-900">Budget Breakdown</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label for="design-budget">Design & Engineering</Label>
              <div class="relative mt-1">
                <DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="design-budget"
                  v-model="budgetData.design_budget"
                  :disabled="!canEdit"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  class="pl-10"
                />
              </div>
            </div>

            <div>
              <Label for="construction-budget">Construction</Label>
              <div class="relative mt-1">
                <DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="construction-budget"
                  v-model="budgetData.construction_budget"
                  :disabled="!canEdit"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  class="pl-10"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label for="equipment-budget">Equipment & Furnishing</Label>
              <div class="relative mt-1">
                <DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="equipment-budget"
                  v-model="budgetData.equipment_budget"
                  :disabled="!canEdit"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  class="pl-10"
                />
              </div>
            </div>

            <div>
              <Label for="contingency-budget">Contingency</Label>
              <div class="relative mt-1">
                <DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="contingency-budget"
                  v-model="budgetData.contingency_budget"
                  :disabled="!canEdit"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  class="pl-10"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label for="management-budget">Project Management</Label>
              <div class="relative mt-1">
                <DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="management-budget"
                  v-model="budgetData.management_budget"
                  :disabled="!canEdit"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  class="pl-10"
                />
              </div>
            </div>

            <div>
              <Label for="other-budget">Other Costs</Label>
              <div class="relative mt-1">
                <DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="other-budget"
                  v-model="budgetData.other_budget"
                  :disabled="!canEdit"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  class="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Budget Notes -->
        <div>
          <Label for="budget-notes">Budget Notes & Assumptions</Label>
          <Textarea
            id="budget-notes"
            v-model="budgetData.budget_notes"
            :disabled="!canEdit"
            placeholder="Additional budget information, assumptions, or notes..."
            rows="3"
            class="mt-1"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Budget History -->
    <Card v-if="budgetHistory.length > 0">
      <CardHeader>
        <CardTitle>Budget Change History</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div 
            v-for="change in budgetHistory" 
            :key="change.id"
            class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign class="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">{{ change.description }}</p>
              <div class="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <span>{{ formatDate(change.date) }}</span>
                <span>{{ change.user }}</span>
                <span v-if="change.amount" class="font-medium">{{ formatCurrency(change.amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Action Buttons -->
    <div v-if="canEdit" class="flex items-center justify-end space-x-2">
      <Button variant="outline" @click="resetForm">
        Reset Changes
      </Button>
      <Button @click="saveChanges" :disabled="!hasChanges">
        <Save class="h-4 w-4 mr-2" />
        Save Budget
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Save, DollarSign, TrendingUp, TrendingDown, Calculator } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFormat } from '@/composables/useFormat'

interface BudgetData {
  total_approved_funding: number
  current_budget: number
  amount_spent: number
  eac?: number
  design_budget?: number
  construction_budget?: number
  equipment_budget?: number
  contingency_budget?: number
  management_budget?: number
  other_budget?: number
  budget_notes?: string
  [key: string]: any
}

interface BudgetChange {
  id: string
  description: string
  date: string
  user: string
  amount?: number
}

interface Props {
  project: BudgetData
  viewMode: 'draft' | 'approved'
  canEdit: boolean
  budgetHistory?: BudgetChange[]
}

const props = withDefaults(defineProps<Props>(), {
  budgetHistory: () => []
})

const emit = defineEmits<{
  'update:project': [project: BudgetData]
  'save-changes': [changes: Partial<BudgetData>]
}>()

const { formatCurrency, formatDate } = useFormat()

// Form data
const budgetData = ref<BudgetData>({ 
  total_approved_funding: 0,
  current_budget: 0,
  amount_spent: 0,
  ...props.project 
})
const originalData = ref<BudgetData>({ ...budgetData.value })

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(budgetData.value) !== JSON.stringify(originalData.value)
})

const remainingAmount = computed(() => {
  return budgetData.value.current_budget - budgetData.value.amount_spent
})

const remainingAmountClass = computed(() => {
  const remaining = remainingAmount.value
  if (remaining < 0) return 'text-red-600'
  if (remaining < budgetData.value.current_budget * 0.1) return 'text-orange-600'
  return 'text-green-600'
})

const budgetUtilizationPercentage = computed(() => {
  if (!budgetData.value.current_budget) return 0
  return Math.round((budgetData.value.amount_spent / budgetData.value.current_budget) * 100)
})

const budgetProgressClass = computed(() => {
  const percentage = budgetUtilizationPercentage.value
  if (percentage >= 100) return 'bg-red-500'
  if (percentage >= 90) return 'bg-orange-500'
  if (percentage >= 75) return 'bg-yellow-500'
  return 'bg-green-500'
})

// Methods
const resetForm = () => {
  budgetData.value = { ...originalData.value }
}

const saveChanges = () => {
  const changes: Partial<BudgetData> = {}
  
  // Only include changed fields
  Object.keys(budgetData.value).forEach(key => {
    if (budgetData.value[key] !== originalData.value[key]) {
      changes[key] = budgetData.value[key]
    }
  })

  emit('save-changes', changes)
  originalData.value = { ...budgetData.value }
}

const calculateDerived = () => {
  // Auto-calculate current budget if not set
  if (!budgetData.value.current_budget && budgetData.value.total_approved_funding) {
    budgetData.value.current_budget = budgetData.value.total_approved_funding
  }
}

// Watch for external project changes
watch(() => props.project, (newProject) => {
  budgetData.value = { 
    total_approved_funding: 0,
    current_budget: 0,
    amount_spent: 0,
    ...newProject 
  }
  originalData.value = { ...budgetData.value }
}, { deep: true })

// Watch for form changes and emit updates
watch(budgetData, (newData) => {
  emit('update:project', { ...newData })
}, { deep: true })

onMounted(() => {
  budgetData.value = { 
    total_approved_funding: 0,
    current_budget: 0,
    amount_spent: 0,
    ...props.project 
  }
  originalData.value = { ...budgetData.value }
})
</script>

