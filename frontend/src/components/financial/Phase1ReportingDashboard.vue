<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h2" variant="heading-l" color="primary" class="mb-2">
          Financial Reports & Analytics
        </AlbertaText>
        <AlbertaText variant="body-m" color="secondary">
          Comprehensive financial reporting with contract payments, budget transfers, and approval tracking
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="exportAllReports">
          <Download class="w-4 h-4 mr-2" />
          Export All
        </Button>
        <Button @click="refreshDashboard">
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Financial Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <AlbertaText variant="body-s" color="secondary" class="mb-1">
                Total Budget
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(financialSummary.totalBudget) }}
              </AlbertaText>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign class="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <AlbertaText variant="body-s" color="secondary" class="mb-1">
                Total Spent
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(financialSummary.totalSpent) }}
              </AlbertaText>
              <div class="flex items-center mt-1">
                <span class="text-xs text-gray-500">{{ financialSummary.budgetUtilization }}% utilized</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp class="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <AlbertaText variant="body-s" color="secondary" class="mb-1">
                Remaining Budget
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(financialSummary.remainingBudget) }}
              </AlbertaText>
              <div class="flex items-center mt-1">
                <span :class="varianceClass" class="text-xs">
                  {{ financialSummary.variancePercent }}% variance
                </span>
              </div>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wallet class="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <AlbertaText variant="body-s" color="secondary" class="mb-1">
                Pending Payments
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(financialSummary.paymentSummary.total_pending) }}
              </AlbertaText>
              <div class="flex items-center mt-1">
                <span class="text-xs text-orange-600">{{ pendingPaymentsCount }} payments</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock class="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Phase 1 Enhanced Tabs -->
    <Tabs default-value="overview" class="w-full">
      <TabsList class="grid w-full grid-cols-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="payments">Contract Payments</TabsTrigger>
        <TabsTrigger value="transfers">Budget Transfers</TabsTrigger>
        <TabsTrigger value="approvals">Approval History</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Saved Reports</TabsTrigger>
      </TabsList>

      <!-- Overview Tab -->
      <TabsContent value="overview" class="space-y-6">
        <!-- Spending Trend Chart -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <BarChart3 class="h-5 w-5" />
              Spending Trend (Last 12 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-64 w-full">
              <canvas ref="spendingChart"></canvas>
            </div>
          </CardContent>
        </Card>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="generateVarianceReport">
            <CardContent class="p-6">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp class="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <AlbertaText variant="heading-s" color="primary" class="font-bold">
                    Variance Analysis
                  </AlbertaText>
                  <AlbertaText variant="body-s" color="secondary">
                    Compare budgeted vs actual spending
                  </AlbertaText>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="generateCashFlowReport">
            <CardContent class="p-6">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <BarChart3 class="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <AlbertaText variant="heading-s" color="primary" class="font-bold">
                    Cash Flow Report
                  </AlbertaText>
                  <AlbertaText variant="body-s" color="secondary">
                    Track cash inflows and outflows
                  </AlbertaText>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="generateVendorReport">
            <CardContent class="p-6">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Building class="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <AlbertaText variant="heading-s" color="primary" class="font-bold">
                    Vendor Performance
                  </AlbertaText>
                  <AlbertaText variant="body-s" color="secondary">
                    Analyze vendor spending & ratings
                  </AlbertaText>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Contract Payments Tab -->
      <TabsContent value="payments" class="space-y-6">
        <ContractPaymentsManager :project-id="projectId" />
      </TabsContent>

      <!-- Budget Transfers Tab -->
      <TabsContent value="transfers" class="space-y-6">
        <BudgetTransferLedger :project-id="projectId" />
      </TabsContent>

      <!-- Approval History Tab -->
      <TabsContent value="approvals" class="space-y-6">
        <ApprovalHistoryTracker :project-id="projectId" />
      </TabsContent>

      <!-- Analytics Tab -->
      <TabsContent value="analytics" class="space-y-6">
        <FinancialAnalytics :project-id="projectId" :financial-summary="financialSummary" />
      </TabsContent>

      <!-- Saved Reports Tab -->
      <TabsContent value="reports" class="space-y-6">
        <SavedReportsManager :project-id="projectId" />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlbertaText } from '@/components/ui/alberta-text'
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Building, 
  RefreshCw, 
  Download,
  Wallet,
  Clock,
  Plus
} from 'lucide-vue-next'
import ContractPaymentsManager from './ContractPaymentsManager.vue'
import BudgetTransferLedger from './BudgetTransferLedger.vue'
import ApprovalHistoryTracker from './ApprovalHistoryTracker.vue'
import FinancialAnalytics from './FinancialAnalytics.vue'
import SavedReportsManager from './SavedReportsManager.vue'
import Chart from 'chart.js/auto'

const route = useRoute()
const projectId = computed(() => route.params.id)

// Reactive data
const loading = ref(false)
const financialSummary = ref({
  totalBudget: 0,
  totalSpent: 0,
  remainingBudget: 0,
  budgetUtilization: 0,
  variance: 0,
  variancePercent: 0,
  contractSummary: {},
  paymentSummary: {},
  transferSummary: {}
})
const spendingTrend = ref([])
const spendingChart = ref(null)
const chartInstance = ref(null)

// Computed properties
const varianceClass = computed(() => {
  const variance = parseFloat(financialSummary.value.variancePercent)
  if (variance > 10) return 'text-green-600'
  if (variance < -10) return 'text-red-600'
  return 'text-yellow-600'
})

const pendingPaymentsCount = computed(() => {
  return financialSummary.value.paymentSummary.total_payments || 0
})

// Methods
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
}

const loadFinancialSummary = async () => {
  try {
    loading.value = true
    const response = await fetch(`/api/phase1/projects/${projectId.value}/financial-summary`)
    const data = await response.json()
    
    if (data.success) {
      financialSummary.value = data.data.financialSummary
      spendingTrend.value = data.data.spendingTrend
      await nextTick()
      renderSpendingChart()
    }
  } catch (error) {
    console.error('Error loading financial summary:', error)
  } finally {
    loading.value = false
  }
}

const renderSpendingChart = () => {
  if (!spendingChart.value || !spendingTrend.value.length) return

  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  const ctx = spendingChart.value.getContext('2d')
  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: spendingTrend.value.map(item => {
        const date = new Date(item.month)
        return date.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' })
      }),
      datasets: [{
        label: 'Monthly Spending',
        data: spendingTrend.value.map(item => item.monthly_spending),
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

const refreshDashboard = async () => {
  await loadFinancialSummary()
}

const exportAllReports = () => {
  // Implementation for exporting all reports
  console.log('Exporting all reports...')
}

const generateVarianceReport = () => {
  // Implementation for variance report generation
  console.log('Generating variance report...')
}

const generateCashFlowReport = () => {
  // Implementation for cash flow report generation
  console.log('Generating cash flow report...')
}

const generateVendorReport = () => {
  // Implementation for vendor report generation
  console.log('Generating vendor report...')
}

// Lifecycle
onMounted(() => {
  loadFinancialSummary()
})
</script>

<style scoped>
.transition-shadow {
  transition: box-shadow 0.2s ease-in-out;
}
</style>

