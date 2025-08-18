<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h2" variant="heading-l" color="primary" class="mb-2">
          Budget Management
        </AlbertaText>
        <AlbertaText variant="body-m" color="secondary">
          Manage project budgets, categories, and financial allocations
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="exportBudget" :disabled="!currentBudget">
          <Download class="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button @click="openBudgetModal" v-if="!currentBudget">
          <Plus class="w-4 h-4 mr-2" />
          Create Budget
        </Button>
        <Button @click="submitForApproval" v-else-if="currentBudget?.status === 'Draft'">
          <CheckCircle class="w-4 h-4 mr-2" />
          Submit for Approval
        </Button>
      </div>
    </div>

    <!-- Budget Overview -->
    <Card v-if="currentBudget">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <AlbertaText tag="h3" variant="heading-s" color="primary">
              Budget Overview - {{ currentBudget.fiscal_year }}
            </AlbertaText>
            <AlbertaText variant="body-s" color="secondary">
              Version {{ currentBudget.version }} • {{ currentBudget.status }}
            </AlbertaText>
          </div>
          <div class="flex items-center space-x-2">
            <span 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="getBudgetStatusColor(currentBudget.status)"
            >
              {{ currentBudget.status }}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="text-center">
            <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
              Total Budget
            </AlbertaText>
            <AlbertaText variant="heading-m" color="primary" class="font-bold">
              ${{ formatCurrency(currentBudget.total_budget) }}
            </AlbertaText>
          </div>
          <div class="text-center">
            <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
              Allocated
            </AlbertaText>
            <AlbertaText variant="heading-m" color="primary" class="font-bold">
              ${{ formatCurrency(totalAllocated) }}
            </AlbertaText>
          </div>
          <div class="text-center">
            <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
              Spent
            </AlbertaText>
            <AlbertaText variant="heading-m" color="primary" class="font-bold">
              ${{ formatCurrency(totalSpent) }}
            </AlbertaText>
          </div>
          <div class="text-center">
            <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
              Remaining
            </AlbertaText>
            <AlbertaText variant="heading-m" color="primary" class="font-bold">
              ${{ formatCurrency(totalAllocated - totalSpent) }}
            </AlbertaText>
          </div>
        </div>

        <!-- Budget Progress Bar -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <AlbertaText variant="body-s" color="secondary">
              Budget Utilization
            </AlbertaText>
            <AlbertaText variant="body-s" color="secondary">
              {{ utilizationPercent.toFixed(1) }}%
            </AlbertaText>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div 
              class="h-3 rounded-full transition-all duration-300"
              :class="getUtilizationColor(utilizationPercent)"
              :style="{ width: `${Math.min(utilizationPercent, 100)}%` }"
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Budget Categories -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <AlbertaText tag="h3" variant="heading-s" color="primary">
            Budget Categories
          </AlbertaText>
          <Button 
            variant="outline" 
            size="sm" 
            @click="openCategoryModal"
            :disabled="!currentBudget || currentBudget.status !== 'Draft'"
          >
            <Plus class="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex items-center justify-center py-8">
          <LoadingSpinner size="md" message="Loading budget categories..." />
        </div>

        <div v-else-if="categories.length === 0" class="text-center py-8">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PieChart class="w-8 h-8 text-gray-400" />
          </div>
          <AlbertaText tag="h4" variant="heading-s" color="primary" class="mb-2">
            No Budget Categories
          </AlbertaText>
          <AlbertaText variant="body-m" color="secondary" class="mb-4">
            Create budget categories to organize your project expenses
          </AlbertaText>
          <Button @click="openCategoryModal" :disabled="!currentBudget">
            <Plus class="w-4 h-4 mr-2" />
            Add First Category
          </Button>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-3" :style="{ backgroundColor: getCategoryColor(category.id) }"></div>
                <div>
                  <AlbertaText variant="body-s" color="primary" class="font-medium">
                    {{ category.category_name }}
                  </AlbertaText>
                  <AlbertaText variant="body-xs" color="secondary" v-if="category.category_code">
                    {{ category.category_code }}
                  </AlbertaText>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  @click="transferBudget(category)"
                  :disabled="currentBudget?.status !== 'Active'"
                >
                  <ArrowRightLeft class="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  @click="editCategory(category)"
                  :disabled="currentBudget?.status !== 'Draft'"
                >
                  <Edit class="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  @click="deleteCategory(category)"
                  :disabled="currentBudget?.status !== 'Draft'"
                >
                  <Trash2 class="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <AlbertaText variant="body-xs" color="secondary" class="mb-1">
                  Allocated Amount
                </AlbertaText>
                <AlbertaText variant="body-s" color="primary" class="font-medium">
                  ${{ formatCurrency(category.allocated_amount) }}
                </AlbertaText>
              </div>
              <div>
                <AlbertaText variant="body-xs" color="secondary" class="mb-1">
                  Spent Amount
                </AlbertaText>
                <AlbertaText variant="body-s" color="primary" class="font-medium">
                  ${{ formatCurrency(getCategorySpent(category.id)) }}
                </AlbertaText>
              </div>
              <div>
                <AlbertaText variant="body-xs" color="secondary" class="mb-1">
                  Remaining
                </AlbertaText>
                <AlbertaText variant="body-s" color="primary" class="font-medium">
                  ${{ formatCurrency(category.allocated_amount - getCategorySpent(category.id)) }}
                </AlbertaText>
              </div>
            </div>

            <!-- Category Progress Bar -->
            <div class="mb-3">
              <div class="flex items-center justify-between mb-1">
                <AlbertaText variant="body-xs" color="secondary">
                  Category Utilization
                </AlbertaText>
                <AlbertaText variant="body-xs" color="secondary">
                  {{ getCategoryUtilization(category).toFixed(1) }}%
                </AlbertaText>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300"
                  :class="getUtilizationColor(getCategoryUtilization(category))"
                  :style="{ width: `${Math.min(getCategoryUtilization(category), 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- Category Description -->
            <AlbertaText variant="body-xs" color="secondary" v-if="category.description">
              {{ category.description }}
            </AlbertaText>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Recent Budget Entries -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <AlbertaText tag="h3" variant="heading-s" color="primary">
            Recent Budget Entries
          </AlbertaText>
          <Button variant="outline" size="sm" @click="viewAllEntries">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="recentEntries.length === 0" class="text-center py-8">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt class="w-8 h-8 text-gray-400" />
          </div>
          <AlbertaText tag="h4" variant="heading-s" color="primary" class="mb-2">
            No Budget Entries
          </AlbertaText>
          <AlbertaText variant="body-m" color="secondary">
            Budget entries will appear here as expenses are recorded
          </AlbertaText>
        </div>

        <div v-else class="space-y-3">
          <div 
            v-for="entry in recentEntries" 
            :key="entry.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center">
              <div 
                class="w-2 h-2 rounded-full mr-3"
                :style="{ backgroundColor: getCategoryColor(entry.category_id) }"
              ></div>
              <div>
                <AlbertaText variant="body-s" color="primary" class="font-medium">
                  {{ entry.description }}
                </AlbertaText>
                <AlbertaText variant="body-xs" color="secondary">
                  {{ entry.category_name }} • {{ formatDate(entry.created_at) }}
                </AlbertaText>
              </div>
            </div>
            <div class="text-right">
              <AlbertaText variant="body-s" color="primary" class="font-medium">
                ${{ formatCurrency(entry.amount) }}
              </AlbertaText>
              <span 
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="getEntryStatusColor(entry.status)"
              >
                {{ entry.status }}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Budget Category Modal -->
    <Modal v-model:open="showCategoryModal" title="Budget Category">
      <form @submit.prevent="saveBudgetCategory" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            v-model="categoryForm.category_name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter category name"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Category Code
          </label>
          <input
            v-model="categoryForm.category_code"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter category code (optional)"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Allocated Amount *
          </label>
          <input
            v-model.number="categoryForm.allocated_amount"
            type="number"
            step="0.01"
            min="0"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            v-model="categoryForm.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter category description (optional)"
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" @click="showCategoryModal = false">
            Cancel
          </Button>
          <Button type="submit" :disabled="savingCategory">
            {{ savingCategory ? 'Saving...' : (editingCategory ? 'Update' : 'Create') }}
          </Button>
        </div>
      </form>
    </Modal>

    <!-- Budget Transfer Modal -->
    <Modal v-model:open="showTransferModal" title="Transfer Budget">
      <form @submit.prevent="executeTransfer" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            From Category
          </label>
          <select
            v-model="transferForm.from_category_id"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select source category</option>
            <option 
              v-for="category in categories" 
              :key="category.id" 
              :value="category.id"
            >
              {{ category.category_name }} - ${{ formatCurrency(category.allocated_amount - getCategorySpent(category.id)) }} available
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            To Category
          </label>
          <select
            v-model="transferForm.to_category_id"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select destination category</option>
            <option 
              v-for="category in categories" 
              :key="category.id" 
              :value="category.id"
              :disabled="category.id === transferForm.from_category_id"
            >
              {{ category.category_name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Transfer Amount *
          </label>
          <input
            v-model.number="transferForm.amount"
            type="number"
            step="0.01"
            min="0.01"
            :max="getAvailableForTransfer(transferForm.from_category_id)"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
          <AlbertaText variant="body-xs" color="secondary" class="mt-1">
            Maximum available: ${{ formatCurrency(getAvailableForTransfer(transferForm.from_category_id)) }}
          </AlbertaText>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Reason for Transfer *
          </label>
          <textarea
            v-model="transferForm.reason"
            rows="3"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Explain the reason for this budget transfer"
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" @click="showTransferModal = false">
            Cancel
          </Button>
          <Button type="submit" :disabled="executingTransfer">
            {{ executingTransfer ? 'Processing...' : 'Transfer Budget' }}
          </Button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Plus, Download, CheckCircle, PieChart, Edit, Trash2, 
  ArrowRightLeft, Receipt 
} from 'lucide-vue-next'
import { AlbertaText, Button } from '@/components/ui'
import { Card, CardHeader, CardContent } from '@/components/ui'
import Modal from '@/components/shared/Modal.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import { formatCurrency, formatDate } from '@/utils'

// Props
const props = defineProps<{
  projectId: number
}>()

// State
const loading = ref(false)
const currentBudget = ref(null)
const categories = ref([])
const recentEntries = ref([])
const showCategoryModal = ref(false)
const showTransferModal = ref(false)
const savingCategory = ref(false)
const executingTransfer = ref(false)
const editingCategory = ref(false)

// Forms
const categoryForm = reactive({
  id: null,
  category_name: '',
  category_code: '',
  allocated_amount: 0,
  description: ''
})

const transferForm = reactive({
  from_category_id: '',
  to_category_id: '',
  amount: 0,
  reason: ''
})

// Computed
const totalAllocated = computed(() => {
  return categories.value.reduce((sum, cat) => sum + parseFloat(cat.allocated_amount), 0)
})

const totalSpent = computed(() => {
  return categories.value.reduce((sum, cat) => sum + getCategorySpent(cat.id), 0)
})

const utilizationPercent = computed(() => {
  return totalAllocated.value > 0 ? (totalSpent.value / totalAllocated.value) * 100 : 0
})

// Methods
const loadBudgetData = async () => {
  try {
    loading.value = true

    // Load current budget
    const budgetResponse = await fetch(`/api/budget/project/${props.projectId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (budgetResponse.ok) {
      const budgetData = await budgetResponse.json()
      currentBudget.value = budgetData.budget
      categories.value = budgetData.categories || []
      recentEntries.value = budgetData.recentEntries || []
    }

  } catch (error) {
    console.error('Error loading budget data:', error)
  } finally {
    loading.value = false
  }
}

const openCategoryModal = () => {
  resetCategoryForm()
  editingCategory.value = false
  showCategoryModal.value = true
}

const editCategory = (category) => {
  categoryForm.id = category.id
  categoryForm.category_name = category.category_name
  categoryForm.category_code = category.category_code || ''
  categoryForm.allocated_amount = parseFloat(category.allocated_amount)
  categoryForm.description = category.description || ''
  editingCategory.value = true
  showCategoryModal.value = true
}

const resetCategoryForm = () => {
  categoryForm.id = null
  categoryForm.category_name = ''
  categoryForm.category_code = ''
  categoryForm.allocated_amount = 0
  categoryForm.description = ''
}

const saveBudgetCategory = async () => {
  try {
    savingCategory.value = true

    const url = editingCategory.value 
      ? `/api/budget/categories/${categoryForm.id}`
      : `/api/budget/project/${props.projectId}/categories`
    
    const method = editingCategory.value ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(categoryForm)
    })

    if (response.ok) {
      showCategoryModal.value = false
      await loadBudgetData()
    } else {
      throw new Error('Failed to save category')
    }

  } catch (error) {
    console.error('Error saving category:', error)
  } finally {
    savingCategory.value = false
  }
}

const deleteCategory = async (category) => {
  if (!confirm(`Are you sure you want to delete the category "${category.category_name}"?`)) {
    return
  }

  try {
    const response = await fetch(`/api/budget/categories/${category.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      await loadBudgetData()
    } else {
      throw new Error('Failed to delete category')
    }

  } catch (error) {
    console.error('Error deleting category:', error)
  }
}

const transferBudget = (category) => {
  transferForm.from_category_id = category.id
  transferForm.to_category_id = ''
  transferForm.amount = 0
  transferForm.reason = ''
  showTransferModal.value = true
}

const executeTransfer = async () => {
  try {
    executingTransfer.value = true

    const response = await fetch(`/api/budget/project/${props.projectId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(transferForm)
    })

    if (response.ok) {
      showTransferModal.value = false
      await loadBudgetData()
    } else {
      throw new Error('Failed to transfer budget')
    }

  } catch (error) {
    console.error('Error transferring budget:', error)
  } finally {
    executingTransfer.value = false
  }
}

const submitForApproval = async () => {
  if (!confirm('Are you sure you want to submit this budget for approval? You will not be able to make changes after submission.')) {
    return
  }

  try {
    const response = await fetch(`/api/approval/budget/${currentBudget.value.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        comments: 'Budget submitted for approval',
        urgency: 'Normal'
      })
    })

    if (response.ok) {
      await loadBudgetData()
    } else {
      throw new Error('Failed to submit for approval')
    }

  } catch (error) {
    console.error('Error submitting for approval:', error)
  }
}

const getCategorySpent = (categoryId) => {
  const entries = recentEntries.value.filter(entry => entry.category_id === categoryId)
  return entries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0)
}

const getCategoryUtilization = (category) => {
  const spent = getCategorySpent(category.id)
  return category.allocated_amount > 0 ? (spent / category.allocated_amount) * 100 : 0
}

const getAvailableForTransfer = (categoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId)
  if (!category) return 0
  return category.allocated_amount - getCategorySpent(categoryId)
}

const getCategoryColor = (categoryId) => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ]
  return colors[categoryId % colors.length]
}

const getBudgetStatusColor = (status) => {
  const colors = {
    'Draft': 'bg-gray-100 text-gray-800',
    'Pending Approval': 'bg-yellow-100 text-yellow-800',
    'Active': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getEntryStatusColor = (status) => {
  const colors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Paid': 'bg-blue-100 text-blue-800',
    'Cancelled': 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getUtilizationColor = (percent) => {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 75) return 'bg-orange-500'
  if (percent >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

const exportBudget = () => {
  // Export budget data
}

const viewAllEntries = () => {
  // Navigate to budget entries page
}

const openBudgetModal = () => {
  // Open budget creation modal
}

// Lifecycle
onMounted(() => {
  loadBudgetData()
})
</script>

<style scoped>
/* Custom styles for budget manager */
.budget-category {
  transition: all 0.2s ease-in-out;
}

.budget-category:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  transition: width 0.3s ease-in-out;
}
</style>

