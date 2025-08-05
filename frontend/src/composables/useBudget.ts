import { ref, computed, readonly } from 'vue'
import { BudgetService } from '@/services'

export interface Budget {
  id: string
  projectId: string
  category: string
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
  status: 'active' | 'completed' | 'overbudget'
  lastUpdated: string
}

export interface BudgetTransfer {
  id: string
  fromCategory: string
  toCategory: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  requestedBy: string
  requestedAt: string
}

export interface BudgetSummary {
  totalAllocated: number
  totalSpent: number
  totalRemaining: number
  utilizationPercentage: number
  categoriesOverBudget: number
}

export function useBudget() {
  const budgets = ref<Budget[]>([])
  const transfers = ref<BudgetTransfer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const budgetSummary = computed<BudgetSummary>(() => {
    const totalAllocated = budgets.value.reduce((sum, budget) => sum + budget.allocatedAmount, 0)
    const totalSpent = budgets.value.reduce((sum, budget) => sum + budget.spentAmount, 0)
    const totalRemaining = budgets.value.reduce((sum, budget) => sum + budget.remainingAmount, 0)
    const utilizationPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0
    const categoriesOverBudget = budgets.value.filter(budget => budget.status === 'overbudget').length

    return {
      totalAllocated,
      totalSpent,
      totalRemaining,
      utilizationPercentage,
      categoriesOverBudget
    }
  })

  const budgetsByCategory = computed(() => {
    return budgets.value.reduce((acc, budget) => {
      if (!acc[budget.category]) {
        acc[budget.category] = []
      }
      acc[budget.category].push(budget)
      return acc
    }, {} as Record<string, Budget[]>)
  })

  // Actions
  const fetchProjectBudgets = async (projectId: string) => {
    loading.value = true
    error.value = null
    try {
      budgets.value = await BudgetService.getProjectBudgets(projectId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch budgets'
    } finally {
      loading.value = false
    }
  }

  const createBudgetItem = async (budgetData: Omit<Budget, 'id' | 'lastUpdated'>) => {
    loading.value = true
    error.value = null
    try {
      const newBudget = await BudgetService.createBudgetItem(budgetData)
      budgets.value.push(newBudget)
      return newBudget
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create budget item'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateBudgetItem = async (id: string, updates: Partial<Budget>) => {
    loading.value = true
    error.value = null
    try {
      const updatedBudget = await BudgetService.updateBudgetItem(id, updates)
      const index = budgets.value.findIndex(budget => budget.id === id)
      if (index !== -1) {
        budgets.value[index] = updatedBudget
      }
      return updatedBudget
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update budget item'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createBudgetTransfer = async (transferData: Omit<BudgetTransfer, 'id' | 'requestedAt' | 'status'>) => {
    loading.value = true
    error.value = null
    try {
      const newTransfer = await BudgetService.createBudgetTransfer(transferData)
      transfers.value.push(newTransfer)
      return newTransfer
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create budget transfer'
      throw err
    } finally {
      loading.value = false
    }
  }

  const approveBudgetTransfer = async (transferId: string) => {
    loading.value = true
    error.value = null
    try {
      await BudgetService.approveBudgetTransfer(transferId)
      const index = transfers.value.findIndex(transfer => transfer.id === transferId)
      if (index !== -1) {
        transfers.value[index].status = 'approved'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to approve transfer'
      throw err
    } finally {
      loading.value = false
    }
  }

  const rejectBudgetTransfer = async (transferId: string) => {
    loading.value = true
    error.value = null
    try {
      await BudgetService.rejectBudgetTransfer(transferId)
      const index = transfers.value.findIndex(transfer => transfer.id === transferId)
      if (index !== -1) {
        transfers.value[index].status = 'rejected'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reject transfer'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Utility functions
  const formatBudgetAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  const getBudgetStatusClass = (budget: Budget): string => {
    switch (budget.status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'overbudget':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateUtilization = (budget: Budget): number => {
    return budget.allocatedAmount > 0 ? (budget.spentAmount / budget.allocatedAmount) * 100 : 0
  }

  const getUtilizationColor = (utilization: number): string => {
    if (utilization <= 75) return 'text-green-600'
    if (utilization <= 90) return 'text-yellow-600'
    return 'text-red-600'
  }

  return {
    // State
    budgets: readonly(budgets),
    transfers: readonly(transfers),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    budgetSummary,
    budgetsByCategory,

    // Actions
    fetchProjectBudgets,
    createBudgetItem,
    updateBudgetItem,
    createBudgetTransfer,
    approveBudgetTransfer,
    rejectBudgetTransfer,

    // Utilities
    formatBudgetAmount,
    getBudgetStatusClass,
    calculateUtilization,
    getUtilizationColor
  }
}

