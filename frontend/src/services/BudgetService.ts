import { BaseService } from './BaseService'
import type { Budget, BudgetTransfer } from '@/composables/useBudget'

export interface BudgetFilters {
  projectId?: string
  category?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface BudgetReport {
  id: string
  title: string
  generatedAt: string
  data: any
  format: 'pdf' | 'excel' | 'csv'
}

export class BudgetService extends BaseService {
  /**
   * Get all budgets for a project
   */
  static async getProjectBudgets(projectId: string): Promise<Budget[]> {
    return this.request<Budget[]>(`/api/projects/${projectId}/budgets`)
  }

  /**
   * Get budget by ID
   */
  static async getBudgetById(id: string): Promise<Budget> {
    return this.request<Budget>(`/api/budgets/${id}`)
  }

  /**
   * Create a new budget item
   */
  static async createBudgetItem(budgetData: Omit<Budget, 'id' | 'lastUpdated'>): Promise<Budget> {
    return this.request<Budget>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData)
    })
  }

  /**
   * Update an existing budget item
   */
  static async updateBudgetItem(id: string, updates: Partial<Budget>): Promise<Budget> {
    return this.request<Budget>(`/api/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  /**
   * Delete a budget item
   */
  static async deleteBudgetItem(id: string): Promise<void> {
    return this.request<void>(`/api/budgets/${id}`, {
      method: 'DELETE'
    })
  }

  /**
   * Get budget transfers for a project
   */
  static async getBudgetTransfers(projectId: string): Promise<BudgetTransfer[]> {
    return this.request<BudgetTransfer[]>(`/api/projects/${projectId}/budget-transfers`)
  }

  /**
   * Create a new budget transfer request
   */
  static async createBudgetTransfer(transferData: Omit<BudgetTransfer, 'id' | 'requestedAt' | 'status'>): Promise<BudgetTransfer> {
    return this.request<BudgetTransfer>('/api/budget-transfers', {
      method: 'POST',
      body: JSON.stringify(transferData)
    })
  }

  /**
   * Approve a budget transfer
   */
  static async approveBudgetTransfer(transferId: string): Promise<void> {
    return this.request<void>(`/api/budget-transfers/${transferId}/approve`, {
      method: 'POST'
    })
  }

  /**
   * Reject a budget transfer
   */
  static async rejectBudgetTransfer(transferId: string): Promise<void> {
    return this.request<void>(`/api/budget-transfers/${transferId}/reject`, {
      method: 'POST'
    })
  }

  /**
   * Get budget summary for a project
   */
  static async getBudgetSummary(projectId: string): Promise<{
    totalAllocated: number
    totalSpent: number
    totalRemaining: number
    utilizationPercentage: number
    categoriesOverBudget: number
  }> {
    return this.request(`/api/projects/${projectId}/budget-summary`)
  }

  /**
   * Generate budget report
   */
  static async generateBudgetReport(filters: BudgetFilters): Promise<BudgetReport> {
    return this.request<BudgetReport>('/api/budgets/reports', {
      method: 'POST',
      body: JSON.stringify(filters)
    })
  }

  /**
   * Export budget data
   */
  static async exportBudgetData(projectId: string, format: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
    const response = await this.request<Blob>(`/api/projects/${projectId}/budgets/export`, {
      method: 'POST',
      body: JSON.stringify({ format }),
      headers: {
        ...this.getHeaders(),
        'Accept': 'application/octet-stream'
      }
    })
    return response
  }

  /**
   * Get budget categories
   */
  static async getBudgetCategories(): Promise<string[]> {
    return this.request<string[]>('/api/budgets/categories')
  }

  /**
   * Get budget analytics
   */
  static async getBudgetAnalytics(projectId: string, timeframe: 'month' | 'quarter' | 'year'): Promise<{
    spending_trend: Array<{ date: string; amount: number }>
    category_breakdown: Array<{ category: string; amount: number; percentage: number }>
    variance_analysis: Array<{ category: string; budgeted: number; actual: number; variance: number }>
  }> {
    return this.request(`/api/projects/${projectId}/budget-analytics`, {
      method: 'POST',
      body: JSON.stringify({ timeframe })
    })
  }

  /**
   * Bulk update budget items
   */
  static async bulkUpdateBudgets(updates: Array<{ id: string; updates: Partial<Budget> }>): Promise<Budget[]> {
    return this.request<Budget[]>('/api/budgets/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ updates })
    })
  }

  /**
   * Get budget history for an item
   */
  static async getBudgetHistory(budgetId: string): Promise<Array<{
    id: string
    budgetId: string
    field: string
    oldValue: any
    newValue: any
    changedBy: string
    changedAt: string
    reason?: string
  }>> {
    return this.request(`/api/budgets/${budgetId}/history`)
  }

  /**
   * Forecast budget utilization
   */
  static async forecastBudgetUtilization(projectId: string, months: number): Promise<{
    projected_spending: Array<{ month: string; amount: number }>
    risk_categories: Array<{ category: string; risk_level: 'low' | 'medium' | 'high'; projected_overrun: number }>
    recommendations: string[]
  }> {
    return this.request(`/api/projects/${projectId}/budget-forecast`, {
      method: 'POST',
      body: JSON.stringify({ months })
    })
  }
}

