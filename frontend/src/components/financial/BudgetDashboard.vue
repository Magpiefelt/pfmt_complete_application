<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h2" variant="heading-l" color="primary" class="mb-2">
          Budget Dashboard
        </AlbertaText>
        <AlbertaText variant="body-m" color="secondary">
          Monitor budget performance and financial metrics across all projects
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <select
          v-model="selectedFiscalYear"
          @change="loadDashboardData"
          class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Fiscal Years</option>
          <option v-for="year in fiscalYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        <Button @click="refreshData" :disabled="loading">
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" message="Loading dashboard data..." />
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="dashboardData" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card class="p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <DollarSign class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide">
                Total Budget
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(dashboardData.summary.total_budget) }}
              </AlbertaText>
            </div>
          </div>
        </Card>

        <Card class="p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <TrendingUp class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide">
                Total Spent
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(dashboardData.summary.total_spent) }}
              </AlbertaText>
            </div>
          </div>
        </Card>

        <Card class="p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <PieChart class="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide">
                Utilization Rate
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                {{ dashboardData.summary.utilizationRate }}%
              </AlbertaText>
            </div>
          </div>
        </Card>

        <Card class="p-6">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <Clock class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide">
                Pending Approvals
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                {{ dashboardData.summary.pendingApprovals }}
              </AlbertaText>
            </div>
          </div>
        </Card>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Monthly Spending Trend -->
        <Card>
          <CardHeader>
            <AlbertaText tag="h3" variant="heading-s" color="primary">
              Monthly Spending Trend
            </AlbertaText>
          </CardHeader>
          <CardContent>
            <div class="h-64">
              <canvas ref="spendingTrendChart"></canvas>
            </div>
          </CardContent>
        </Card>

        <!-- Category Spending -->
        <Card>
          <CardHeader>
            <AlbertaText tag="h3" variant="heading-s" color="primary">
              Spending by Category
            </AlbertaText>
          </CardHeader>
          <CardContent>
            <div class="h-64">
              <canvas ref="categorySpendingChart"></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Top Projects Table -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <AlbertaText tag="h3" variant="heading-s" color="primary">
              Top Spending Projects
            </AlbertaText>
            <Button variant="outline" size="sm" @click="viewAllProjects">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Budget
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="project in dashboardData.topProjects" :key="project.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <AlbertaText variant="body-s" color="primary" class="font-medium">
                        {{ project.project_name }}
                      </AlbertaText>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <AlbertaText variant="body-s" color="secondary">
                      ${{ formatCurrency(project.total_budget) }}
                    </AlbertaText>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <AlbertaText variant="body-s" color="secondary">
                      ${{ formatCurrency(project.total_spent) }}
                    </AlbertaText>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          class="h-2 rounded-full"
                          :class="getUtilizationColor(project.utilization_percent)"
                          :style="{ width: `${Math.min(project.utilization_percent, 100)}%` }"
                        ></div>
                      </div>
                      <AlbertaText variant="body-xs" color="secondary">
                        {{ project.utilization_percent.toFixed(1) }}%
                      </AlbertaText>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getStatusColor(project.utilization_percent)"
                    >
                      {{ getStatusText(project.utilization_percent) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <!-- Vendor Spending -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <AlbertaText tag="h3" variant="heading-s" color="primary">
              Top Vendor Spending
            </AlbertaText>
            <Button variant="outline" size="sm" @click="viewVendorReport">
              View Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div 
              v-for="vendor in dashboardData.vendorSpending" 
              :key="vendor.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Building class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <AlbertaText variant="body-s" color="primary" class="font-medium">
                    {{ vendor.vendor_name }}
                  </AlbertaText>
                  <AlbertaText variant="body-xs" color="secondary">
                    {{ vendor.transaction_count }} transactions
                  </AlbertaText>
                </div>
              </div>
              <div class="text-right">
                <AlbertaText variant="body-s" color="primary" class="font-medium">
                  ${{ formatCurrency(vendor.total_spent) }}
                </AlbertaText>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8 text-red-600" />
      </div>
      <AlbertaText tag="h3" variant="heading-s" color="primary" class="mb-2">
        Failed to Load Dashboard
      </AlbertaText>
      <AlbertaText variant="body-m" color="secondary" class="mb-4">
        {{ error }}
      </AlbertaText>
      <Button @click="loadDashboardData">
        Try Again
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { RefreshCw, DollarSign, TrendingUp, Building, PieChart, BarChart3 } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, AlbertaText } from '@/components/ui'
import { Button } from '@/components/ui'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { formatCurrency } from '@/utils'
import Chart from 'chart.js/auto'

// State
const { error, loading, withErrorHandling } = useErrorHandler()
const dashboardData = ref(null)
const selectedFiscalYear = ref('')
const fiscalYears = ref(['2024-25', '2023-24', '2022-23'])

// Chart refs
const spendingTrendChart = ref(null)
const categorySpendingChart = ref(null)

// Chart instances
let spendingChart = null
let categoryChart = null

// Methods
const loadDashboardData = async () => {
  try {
    loading.value = true
    error.value = ''

    const params = new URLSearchParams()
    if (selectedFiscalYear.value) {
      params.append('fiscalYear', selectedFiscalYear.value)
    }

    const response = await fetch(`/api/reporting/dashboard?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data')
    }

    const data = await response.json()
    dashboardData.value = data.dashboard

    // Update charts after data loads
    await nextTick()
    updateCharts()

  } catch (err) {
    console.error('Error loading dashboard:', err)
    error.value = err.message || 'Failed to load dashboard data'
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadDashboardData()
}

const updateCharts = () => {
  if (dashboardData.value) {
    updateSpendingTrendChart()
    updateCategorySpendingChart()
  }
}

const updateSpendingTrendChart = () => {
  if (spendingChart) {
    spendingChart.destroy()
  }

  const ctx = spendingTrendChart.value?.getContext('2d')
  if (!ctx || !dashboardData.value.monthlyTrend) return

  const monthlyData = dashboardData.value.monthlyTrend
  const labels = monthlyData.map(item => {
    const date = new Date(item.month)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  })
  const data = monthlyData.map(item => parseFloat(item.monthly_spending))

  spendingChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Monthly Spending',
        data: data,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString()
            }
          }
        }
      }
    }
  })
}

const updateCategorySpendingChart = () => {
  if (categoryChart) {
    categoryChart.destroy()
  }

  const ctx = categorySpendingChart.value?.getContext('2d')
  if (!ctx || !dashboardData.value.categorySpending) return

  const categoryData = dashboardData.value.categorySpending.slice(0, 6) // Top 6 categories
  const labels = categoryData.map(item => item.category_name)
  const data = categoryData.map(item => parseFloat(item.spent))
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ]

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    }
  })
}

const getUtilizationColor = (percent) => {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 75) return 'bg-orange-500'
  if (percent >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

const getStatusColor = (percent) => {
  if (percent >= 90) return 'bg-red-100 text-red-800'
  if (percent >= 75) return 'bg-orange-100 text-orange-800'
  if (percent >= 50) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

const getStatusText = (percent) => {
  if (percent >= 90) return 'Critical'
  if (percent >= 75) return 'High Usage'
  if (percent >= 50) return 'Moderate'
  return 'On Track'
}

const viewAllProjects = () => {
  // Navigate to projects page with budget filter
}

const viewVendorReport = () => {
  // Navigate to vendor spending report
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/* Custom styles for charts */
.chart-container {
  position: relative;
  height: 300px;
}

/* Table hover effects */
tbody tr:hover {
  background-color: #f9fafb;
}

/* Progress bar animations */
.progress-bar {
  transition: width 0.3s ease-in-out;
}
</style>

