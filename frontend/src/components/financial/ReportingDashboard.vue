<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h2" variant="heading-l" color="primary" class="mb-2">
          Financial Reports
        </AlbertaText>
        <AlbertaText variant="body-m" color="secondary">
          Generate and manage financial reports and analytics
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="openReportBuilder">
          <Plus class="w-4 h-4 mr-2" />
          Custom Report
        </Button>
        <Button @click="refreshReports">
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Quick Report Actions -->
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
                Vendor Spending
              </AlbertaText>
              <AlbertaText variant="body-s" color="secondary">
                Analyze vendor payment patterns
              </AlbertaText>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Saved Reports -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <AlbertaText tag="h3" variant="heading-s" color="primary">
            Saved Reports
          </AlbertaText>
          <div class="flex items-center space-x-2">
            <select
              v-model="reportTypeFilter"
              @change="loadSavedReports"
              class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="Variance Analysis">Variance Analysis</option>
              <option value="Cash Flow">Cash Flow</option>
              <option value="Vendor Spending">Vendor Spending</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex items-center justify-center py-8">
          <LoadingSpinner class="w-6 h-6" />
          <AlbertaText variant="body-m" color="secondary" class="ml-3">
            Loading saved reports...
          </AlbertaText>
        </div>

        <div v-else-if="savedReports.length === 0" class="text-center py-8">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText class="w-8 h-8 text-gray-400" />
          </div>
          <AlbertaText tag="h4" variant="heading-s" color="primary" class="mb-2">
            No Saved Reports
          </AlbertaText>
          <AlbertaText variant="body-m" color="secondary" class="mb-4">
            Create custom reports to save them for future use
          </AlbertaText>
          <Button @click="openReportBuilder">
            <Plus class="w-4 h-4 mr-2" />
            Create First Report
          </Button>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="report in savedReports" 
            :key="report.id"
            class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <AlbertaText variant="body-s" color="primary" class="font-medium">
                    {{ report.report_name }}
                  </AlbertaText>
                  <div class="flex items-center space-x-2 mt-1">
                    <span 
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="getReportTypeColor(report.report_type)"
                    >
                      {{ report.report_type }}
                    </span>
                    <AlbertaText variant="body-xs" color="secondary">
                      Created {{ formatDate(report.created_at) }}
                    </AlbertaText>
                    <AlbertaText variant="body-xs" color="secondary" v-if="report.is_scheduled">
                      • Scheduled {{ report.schedule_frequency }}
                    </AlbertaText>
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <Button variant="ghost" size="sm" @click="executeReport(report)">
                  <Play class="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="editReport(report)">
                  <Edit class="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="deleteReport(report)">
                  <Trash2 class="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Report Results -->
    <Card v-if="currentReport">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <AlbertaText tag="h3" variant="heading-s" color="primary">
              {{ currentReport.title }}
            </AlbertaText>
            <AlbertaText variant="body-s" color="secondary">
              Generated {{ formatDate(currentReport.generatedAt) }}
            </AlbertaText>
          </div>
          <div class="flex items-center space-x-2">
            <Button variant="outline" size="sm" @click="exportReport('csv')">
              <Download class="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" @click="exportReport('pdf')">
              <Download class="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="ghost" size="sm" @click="currentReport = null">
              <X class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Variance Analysis Report -->
        <div v-if="currentReport.type === 'variance'" class="space-y-6">
          <!-- Summary -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Total Allocated
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(currentReport.summary.totalAllocated) }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Total Spent
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(currentReport.summary.totalSpent) }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Total Variance
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(currentReport.summary.totalVariance) }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Variance %
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                {{ currentReport.summary.overallVariancePercent.toFixed(1) }}%
              </AlbertaText>
            </div>
          </div>

          <!-- Variance Details Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project / Category
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocated
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance %
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in currentReport.details" :key="`${item.project_id}-${item.category_id}`">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <AlbertaText variant="body-s" color="primary" class="font-medium">
                        {{ item.project_name }}
                      </AlbertaText>
                      <AlbertaText variant="body-xs" color="secondary">
                        {{ item.category_name }}
                      </AlbertaText>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <AlbertaText variant="body-s" color="secondary">
                      ${{ formatCurrency(item.allocated_amount) }}
                    </AlbertaText>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <AlbertaText variant="body-s" color="secondary">
                      ${{ formatCurrency(item.actual_spent) }}
                    </AlbertaText>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <AlbertaText 
                      variant="body-s" 
                      :color="parseFloat(item.variance) < 0 ? 'error' : 'success'"
                      class="font-medium"
                    >
                      ${{ formatCurrency(item.variance) }}
                    </AlbertaText>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getVarianceColor(parseFloat(item.variance_percent))"
                    >
                      {{ item.variance_percent.toFixed(1) }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Cash Flow Report -->
        <div v-else-if="currentReport.type === 'cashflow'" class="space-y-6">
          <!-- Summary -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Total Inflow
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold text-green-600">
                ${{ formatCurrency(currentReport.summary.totalInflow) }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Total Outflow
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold text-red-600">
                ${{ formatCurrency(currentReport.summary.totalOutflow) }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Net Cash Flow
              </AlbertaText>
              <AlbertaText 
                variant="heading-m" 
                color="primary" 
                class="font-bold"
                :class="currentReport.summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                ${{ formatCurrency(currentReport.summary.netCashFlow) }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Current Balance
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(currentReport.summary.currentBalance) }}
              </AlbertaText>
            </div>
          </div>

          <!-- Cash Flow Chart -->
          <div class="h-64">
            <canvas ref="cashFlowChart"></canvas>
          </div>
        </div>

        <!-- Vendor Spending Report -->
        <div v-else-if="currentReport.type === 'vendor'" class="space-y-6">
          <!-- Summary -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Total Vendors
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                {{ currentReport.summary.totalVendors }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Total Spending
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(currentReport.summary.totalSpending) }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Total Transactions
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                {{ currentReport.summary.totalTransactions }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide mb-1">
                Avg Transaction
              </AlbertaText>
              <AlbertaText variant="heading-m" color="primary" class="font-bold">
                ${{ formatCurrency(currentReport.summary.averageTransactionValue) }}
              </AlbertaText>
            </div>
          </div>

          <!-- Vendor Details -->
          <div class="space-y-4">
            <div 
              v-for="vendor in currentReport.vendorSpending" 
              :key="vendor.vendor_id"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Building class="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <AlbertaText variant="body-s" color="primary" class="font-medium">
                      {{ vendor.vendor_name }}
                    </AlbertaText>
                    <AlbertaText variant="body-xs" color="secondary">
                      {{ vendor.project_name }} • {{ vendor.category_name }}
                    </AlbertaText>
                  </div>
                </div>
                <div class="text-right">
                  <AlbertaText variant="body-s" color="primary" class="font-medium">
                    ${{ formatCurrency(vendor.total_amount) }}
                  </AlbertaText>
                  <AlbertaText variant="body-xs" color="secondary">
                    {{ vendor.transaction_count }} transactions
                  </AlbertaText>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Report Builder Modal -->
    <Modal v-model:open="showReportBuilder" title="Custom Report Builder" size="lg">
      <form @submit.prevent="saveCustomReport" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Report Name *
            </label>
            <input
              v-model="reportForm.reportName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter report name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Report Type *
            </label>
            <select
              v-model="reportForm.reportType"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select report type</option>
              <option value="Variance Analysis">Variance Analysis</option>
              <option value="Cash Flow">Cash Flow</option>
              <option value="Vendor Spending">Vendor Spending</option>
            </select>
          </div>
        </div>

        <!-- Report Parameters -->
        <div class="space-y-4">
          <AlbertaText variant="heading-s" color="primary">
            Report Parameters
          </AlbertaText>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                v-model="reportForm.startDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                v-model="reportForm.endDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Fiscal Year
              </label>
              <select
                v-model="reportForm.fiscalYear"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Years</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Scheduling -->
        <div class="space-y-4">
          <div class="flex items-center">
            <input
              v-model="reportForm.isScheduled"
              type="checkbox"
              id="schedule-report"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="schedule-report" class="ml-2 block text-sm text-gray-900">
              Schedule this report to run automatically
            </label>
          </div>

          <div v-if="reportForm.isScheduled" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                v-model="reportForm.scheduleFrequency"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Next Run Date
              </label>
              <input
                v-model="reportForm.nextRunDate"
                type="datetime-local"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" @click="showReportBuilder = false">
            Cancel
          </Button>
          <Button type="submit" :disabled="savingReport">
            {{ savingReport ? 'Saving...' : 'Save Report' }}
          </Button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { 
  Plus, RefreshCw, TrendingUp, BarChart3, Building, FileText,
  Play, Edit, Trash2, Download, X
} from 'lucide-vue-next'
import { AlbertaText, Button } from '@/components/ui'
import { Card, CardHeader, CardContent } from '@/components/ui'
import Modal from '@/components/shared/Modal.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import { formatCurrency, formatDate } from '@/utils'
import Chart from 'chart.js/auto'

// State
const loading = ref(false)
const savedReports = ref([])
const currentReport = ref(null)
const reportTypeFilter = ref('')
const showReportBuilder = ref(false)
const savingReport = ref(false)

// Chart refs
const cashFlowChart = ref(null)

// Forms
const reportForm = reactive({
  reportName: '',
  reportType: '',
  startDate: '',
  endDate: '',
  fiscalYear: '',
  isScheduled: false,
  scheduleFrequency: 'Monthly',
  nextRunDate: ''
})

// Methods
const loadSavedReports = async () => {
  try {
    loading.value = true

    const params = new URLSearchParams()
    if (reportTypeFilter.value) {
      params.append('reportType', reportTypeFilter.value)
    }

    const response = await fetch(`/api/reporting/saved?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      savedReports.value = data.reports
    }

  } catch (error) {
    console.error('Error loading saved reports:', error)
  } finally {
    loading.value = false
  }
}

const refreshReports = () => {
  loadSavedReports()
}

const generateVarianceReport = async () => {
  try {
    loading.value = true

    const response = await fetch('/api/reporting/variance', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      currentReport.value = {
        ...data.report,
        type: 'variance'
      }
    }

  } catch (error) {
    console.error('Error generating variance report:', error)
  } finally {
    loading.value = false
  }
}

const generateCashFlowReport = async () => {
  try {
    loading.value = true

    const response = await fetch('/api/reporting/cash-flow', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      currentReport.value = {
        ...data.report,
        type: 'cashflow'
      }

      await nextTick()
      updateCashFlowChart()
    }

  } catch (error) {
    console.error('Error generating cash flow report:', error)
  } finally {
    loading.value = false
  }
}

const generateVendorReport = async () => {
  try {
    loading.value = true

    const response = await fetch('/api/reporting/vendor-spending', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      currentReport.value = {
        ...data.report,
        type: 'vendor'
      }
    }

  } catch (error) {
    console.error('Error generating vendor report:', error)
  } finally {
    loading.value = false
  }
}

const executeReport = async (report) => {
  try {
    loading.value = true

    const response = await fetch(`/api/reporting/saved/${report.id}/execute`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      currentReport.value = {
        ...data.report,
        type: report.report_type.toLowerCase().replace(' ', '')
      }
    }

  } catch (error) {
    console.error('Error executing report:', error)
  } finally {
    loading.value = false
  }
}

const updateCashFlowChart = () => {
  const ctx = cashFlowChart.value?.getContext('2d')
  if (!ctx || !currentReport.value?.historicalCashFlow) return

  const cashFlowData = currentReport.value.historicalCashFlow
  const labels = cashFlowData.map(item => {
    const date = new Date(item.period)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  })

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Inflow',
          data: cashFlowData.map(item => parseFloat(item.inflow)),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: false
        },
        {
          label: 'Outflow',
          data: cashFlowData.map(item => parseFloat(item.outflow)),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false
        },
        {
          label: 'Net Flow',
          data: cashFlowData.map(item => parseFloat(item.netFlow)),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
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

const openReportBuilder = () => {
  resetReportForm()
  showReportBuilder.value = true
}

const resetReportForm = () => {
  reportForm.reportName = ''
  reportForm.reportType = ''
  reportForm.startDate = ''
  reportForm.endDate = ''
  reportForm.fiscalYear = ''
  reportForm.isScheduled = false
  reportForm.scheduleFrequency = 'Monthly'
  reportForm.nextRunDate = ''
}

const saveCustomReport = async () => {
  try {
    savingReport.value = true

    const reportParameters = {
      startDate: reportForm.startDate,
      endDate: reportForm.endDate,
      fiscalYear: reportForm.fiscalYear
    }

    const response = await fetch('/api/reporting/saved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        reportName: reportForm.reportName,
        reportType: reportForm.reportType,
        reportParameters,
        isScheduled: reportForm.isScheduled,
        scheduleFrequency: reportForm.scheduleFrequency,
        nextRunDate: reportForm.nextRunDate
      })
    })

    if (response.ok) {
      showReportBuilder.value = false
      await loadSavedReports()
    }

  } catch (error) {
    console.error('Error saving custom report:', error)
  } finally {
    savingReport.value = false
  }
}

const editReport = (report) => {
  // Edit report functionality
}

const deleteReport = async (report) => {
  if (!confirm(`Are you sure you want to delete the report "${report.report_name}"?`)) {
    return
  }

  try {
    const response = await fetch(`/api/reporting/saved/${report.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      await loadSavedReports()
    }

  } catch (error) {
    console.error('Error deleting report:', error)
  }
}

const exportReport = (format) => {
  // Export report functionality
}

const getReportTypeColor = (type) => {
  const colors = {
    'Variance Analysis': 'bg-blue-100 text-blue-800',
    'Cash Flow': 'bg-green-100 text-green-800',
    'Vendor Spending': 'bg-purple-100 text-purple-800',
    'Custom': 'bg-gray-100 text-gray-800'
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

const getVarianceColor = (percent) => {
  if (percent < -10) return 'bg-red-100 text-red-800'
  if (percent < 0) return 'bg-orange-100 text-orange-800'
  if (percent < 10) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

// Lifecycle
onMounted(() => {
  loadSavedReports()
})
</script>

<style scoped>
/* Custom styles for reporting dashboard */
.report-card {
  transition: all 0.2s ease-in-out;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.1);
}

/* Chart container */
.chart-container {
  position: relative;
  height: 300px;
}

/* Table styles */
.report-table {
  font-size: 0.875rem;
}

.report-table th {
  font-weight: 600;
  color: #374151;
}

.report-table td {
  color: #6B7280;
}
</style>

