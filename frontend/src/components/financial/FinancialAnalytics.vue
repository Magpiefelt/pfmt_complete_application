<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
          Financial Analytics
        </AlbertaText>
        <AlbertaText variant="body-s" color="secondary">
          Advanced financial analysis and insights for project performance
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="exportAnalytics">
          <Download class="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button @click="refreshAnalytics">
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Key Performance Indicators -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Budget Performance -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Budget Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Budget Utilization</span>
              <span class="font-semibold">{{ financialSummary.budgetUtilization }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                :class="getBudgetUtilizationColor(financialSummary.budgetUtilization)"
                :style="{ width: `${Math.min(financialSummary.budgetUtilization, 100)}%` }"
              ></div>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Spent</span>
                <div class="font-semibold">${{ formatCurrency(financialSummary.totalSpent) }}</div>
              </div>
              <div>
                <span class="text-gray-600">Remaining</span>
                <div class="font-semibold">${{ formatCurrency(financialSummary.remainingBudget) }}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Variance Analysis -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="text-center">
              <div class="text-2xl font-bold" :class="getVarianceColor(financialSummary.variancePercent)">
                {{ financialSummary.variancePercent }}%
              </div>
              <div class="text-sm text-gray-600">Budget Variance</div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Variance Amount</span>
                <span class="font-semibold" :class="getVarianceColor(financialSummary.variancePercent)">
                  ${{ formatCurrency(Math.abs(financialSummary.variance)) }}
                </span>
              </div>
              <div class="text-xs text-gray-500">
                {{ getVarianceDescription(financialSummary.variancePercent) }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Payment Status -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-lg font-bold text-green-600">
                  ${{ formatCurrency(financialSummary.paymentSummary.total_paid_confirmed) }}
                </div>
                <div class="text-xs text-gray-600">Paid</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-orange-600">
                  ${{ formatCurrency(financialSummary.paymentSummary.total_pending) }}
                </div>
                <div class="text-xs text-gray-600">Pending</div>
              </div>
            </div>
            <div class="text-center">
              <div class="text-sm text-gray-600">Total Payments</div>
              <div class="font-semibold">{{ financialSummary.paymentSummary.total_payments || 0 }}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Spending Trend Chart -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <TrendingUp class="h-5 w-5" />
            Spending Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-64 w-full">
            <canvas ref="spendingTrendChart"></canvas>
          </div>
        </CardContent>
      </Card>

      <!-- Budget Distribution Chart -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <PieChart class="h-5 w-5" />
            Budget Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-64 w-full">
            <canvas ref="budgetDistributionChart"></canvas>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Financial Metrics Table -->
    <Card>
      <CardHeader>
        <CardTitle>Financial Metrics Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Budget
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${{ formatCurrency(financialSummary.totalBudget) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Allocated
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <TrendingUp class="w-4 h-4 text-blue-500" />
                </td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Spent
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${{ formatCurrency(financialSummary.totalSpent) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getSpendingStatusClass(financialSummary.budgetUtilization)">
                    {{ getSpendingStatus(financialSummary.budgetUtilization) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <TrendingUp class="w-4 h-4 text-green-500" />
                </td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Budget Utilization
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ financialSummary.budgetUtilization }}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getUtilizationStatusClass(financialSummary.budgetUtilization)">
                    {{ getUtilizationStatus(financialSummary.budgetUtilization) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <component :is="getUtilizationTrendIcon(financialSummary.budgetUtilization)" 
                             class="w-4 h-4" 
                             :class="getUtilizationTrendColor(financialSummary.budgetUtilization)" />
                </td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Contract Change Orders
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${{ formatCurrency(financialSummary.contractSummary.total_change_orders) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Active
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <TrendingUp class="w-4 h-4 text-yellow-500" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Risk Indicators -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5" />
          Financial Risk Indicators
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 border rounded-lg" :class="getBudgetRiskClass()">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Budget Overrun Risk</div>
                <div class="text-sm text-gray-600">{{ getBudgetRiskLevel() }}</div>
              </div>
              <AlertTriangle class="w-6 h-6" :class="getBudgetRiskIconColor()" />
            </div>
          </div>
          
          <div class="p-4 border rounded-lg" :class="getCashFlowRiskClass()">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Cash Flow Risk</div>
                <div class="text-sm text-gray-600">{{ getCashFlowRiskLevel() }}</div>
              </div>
              <DollarSign class="w-6 h-6" :class="getCashFlowRiskIconColor()" />
            </div>
          </div>
          
          <div class="p-4 border rounded-lg" :class="getScheduleRiskClass()">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Schedule Risk</div>
                <div class="text-sm text-gray-600">{{ getScheduleRiskLevel() }}</div>
              </div>
              <Clock class="w-6 h-6" :class="getScheduleRiskIconColor()" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlbertaText } from '@/components/ui/alberta-text'
import { 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Minus,
  PieChart,
  AlertTriangle,
  DollarSign,
  Clock
} from 'lucide-vue-next'
import Chart from 'chart.js/auto'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  financialSummary: {
    type: Object,
    required: true
  }
})

// Reactive data
const loading = ref(false)
const spendingTrendChart = ref(null)
const budgetDistributionChart = ref(null)
const spendingTrendChartInstance = ref(null)
const budgetDistributionChartInstance = ref(null)

// Methods
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
}

const getBudgetUtilizationColor = (utilization) => {
  if (utilization <= 75) return 'bg-green-500'
  if (utilization <= 90) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getVarianceColor = (variance) => {
  if (variance > 5) return 'text-green-600'
  if (variance < -5) return 'text-red-600'
  return 'text-yellow-600'
}

const getVarianceDescription = (variance) => {
  if (variance > 10) return 'Significantly under budget'
  if (variance > 5) return 'Under budget'
  if (variance > -5) return 'On budget'
  if (variance > -10) return 'Over budget'
  return 'Significantly over budget'
}

const getSpendingStatus = (utilization) => {
  if (utilization <= 75) return 'On Track'
  if (utilization <= 90) return 'Monitor'
  return 'At Risk'
}

const getSpendingStatusClass = (utilization) => {
  if (utilization <= 75) return 'bg-green-100 text-green-800'
  if (utilization <= 90) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const getUtilizationStatus = (utilization) => {
  if (utilization <= 50) return 'Low'
  if (utilization <= 75) return 'Moderate'
  if (utilization <= 90) return 'High'
  return 'Critical'
}

const getUtilizationStatusClass = (utilization) => {
  if (utilization <= 50) return 'bg-blue-100 text-blue-800'
  if (utilization <= 75) return 'bg-green-100 text-green-800'
  if (utilization <= 90) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const getUtilizationTrendIcon = (utilization) => {
  if (utilization <= 75) return TrendingUp
  if (utilization <= 90) return Minus
  return TrendingDown
}

const getUtilizationTrendColor = (utilization) => {
  if (utilization <= 75) return 'text-green-500'
  if (utilization <= 90) return 'text-yellow-500'
  return 'text-red-500'
}

// Risk Assessment Methods
const getBudgetRiskLevel = () => {
  const utilization = props.financialSummary.budgetUtilization
  if (utilization <= 75) return 'Low Risk'
  if (utilization <= 90) return 'Medium Risk'
  return 'High Risk'
}

const getBudgetRiskClass = () => {
  const utilization = props.financialSummary.budgetUtilization
  if (utilization <= 75) return 'border-green-200 bg-green-50'
  if (utilization <= 90) return 'border-yellow-200 bg-yellow-50'
  return 'border-red-200 bg-red-50'
}

const getBudgetRiskIconColor = () => {
  const utilization = props.financialSummary.budgetUtilization
  if (utilization <= 75) return 'text-green-500'
  if (utilization <= 90) return 'text-yellow-500'
  return 'text-red-500'
}

const getCashFlowRiskLevel = () => {
  const pending = props.financialSummary.paymentSummary.total_pending || 0
  const total = props.financialSummary.totalBudget || 1
  const pendingRatio = (pending / total) * 100
  
  if (pendingRatio <= 10) return 'Low Risk'
  if (pendingRatio <= 25) return 'Medium Risk'
  return 'High Risk'
}

const getCashFlowRiskClass = () => {
  const pending = props.financialSummary.paymentSummary.total_pending || 0
  const total = props.financialSummary.totalBudget || 1
  const pendingRatio = (pending / total) * 100
  
  if (pendingRatio <= 10) return 'border-green-200 bg-green-50'
  if (pendingRatio <= 25) return 'border-yellow-200 bg-yellow-50'
  return 'border-red-200 bg-red-50'
}

const getCashFlowRiskIconColor = () => {
  const pending = props.financialSummary.paymentSummary.total_pending || 0
  const total = props.financialSummary.totalBudget || 1
  const pendingRatio = (pending / total) * 100
  
  if (pendingRatio <= 10) return 'text-green-500'
  if (pendingRatio <= 25) return 'text-yellow-500'
  return 'text-red-500'
}

const getScheduleRiskLevel = () => {
  // This would typically be based on project timeline data
  // For now, we'll use budget utilization as a proxy
  const utilization = props.financialSummary.budgetUtilization
  if (utilization <= 60) return 'Low Risk'
  if (utilization <= 85) return 'Medium Risk'
  return 'High Risk'
}

const getScheduleRiskClass = () => {
  const utilization = props.financialSummary.budgetUtilization
  if (utilization <= 60) return 'border-green-200 bg-green-50'
  if (utilization <= 85) return 'border-yellow-200 bg-yellow-50'
  return 'border-red-200 bg-red-50'
}

const getScheduleRiskIconColor = () => {
  const utilization = props.financialSummary.budgetUtilization
  if (utilization <= 60) return 'text-green-500'
  if (utilization <= 85) return 'text-yellow-500'
  return 'text-red-500'
}

const renderCharts = async () => {
  await nextTick()
  
  // Render spending trend chart
  if (spendingTrendChart.value) {
    if (spendingTrendChartInstance.value) {
      spendingTrendChartInstance.value.destroy()
    }
    
    const ctx = spendingTrendChart.value.getContext('2d')
    spendingTrendChartInstance.value = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Monthly Spending',
          data: [500000, 750000, 1200000, 900000, 1100000, 800000],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
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
                return '$' + new Intl.NumberFormat('en-CA').format(value)
              }
            }
          }
        }
      }
    })
  }
  
  // Render budget distribution chart
  if (budgetDistributionChart.value) {
    if (budgetDistributionChartInstance.value) {
      budgetDistributionChartInstance.value.destroy()
    }
    
    const ctx = budgetDistributionChart.value.getContext('2d')
    budgetDistributionChartInstance.value = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Construction', 'Design', 'Technology', 'Other'],
        datasets: [{
          data: [60, 20, 15, 5],
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    })
  }
}

const refreshAnalytics = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    renderCharts()
  }, 1000)
}

const exportAnalytics = () => {
  console.log('Exporting financial analytics...')
}

// Lifecycle
onMounted(() => {
  renderCharts()
})
</script>

