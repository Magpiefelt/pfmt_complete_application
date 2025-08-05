<template>
  <div class="project-financial-summary">
    <!-- Financial Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Budget</p>
            <p class="text-2xl font-bold text-gray-900">
              ${{ formatCurrency(summary.total_budget) }}
            </p>
          </div>
          <div class="p-3 bg-blue-100 rounded-full">
            <DollarSign class="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Spent</p>
            <p class="text-2xl font-bold text-gray-900">
              ${{ formatCurrency(summary.total_spent) }}
            </p>
            <p class="text-sm text-gray-500">
              {{ summary.spent_percentage }}% of budget
            </p>
          </div>
          <div class="p-3 bg-green-100 rounded-full">
            <TrendingUp class="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Committed</p>
            <p class="text-2xl font-bold text-gray-900">
              ${{ formatCurrency(summary.total_committed) }}
            </p>
            <p class="text-sm text-gray-500">
              {{ summary.utilized_percentage }}% utilized
            </p>
          </div>
          <div class="p-3 bg-orange-100 rounded-full">
            <FileText class="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6 border-l-4" 
           :class="summary.available_budget >= 0 ? 'border-green-500' : 'border-red-500'">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Available</p>
            <p class="text-2xl font-bold" 
               :class="summary.available_budget >= 0 ? 'text-green-600' : 'text-red-600'">
              ${{ formatCurrency(summary.available_budget) }}
            </p>
            <p class="text-sm text-gray-500">
              {{ summary.total_variance >= 0 ? 'Under' : 'Over' }} budget
            </p>
          </div>
          <div class="p-3 rounded-full"
               :class="summary.available_budget >= 0 ? 'bg-green-100' : 'bg-red-100'">
            <AlertCircle :class="summary.available_budget >= 0 ? 'h-6 w-6 text-green-600' : 'h-6 w-6 text-red-600'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Contract Rollup Section -->
    <div class="bg-white rounded-lg shadow-md mb-8">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Contract Summary</h3>
        <div class="flex space-x-2">
          <button @click="exportContractData" 
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Download class="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button @click="printContractSummary" 
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Printer class="h-4 w-4 mr-2" />
            Print
          </button>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contract
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Original Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change Orders
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revised Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid to Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="contract in contractRollup" :key="contract.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800"
                     @click="viewContractDetails(contract.id)">
                  {{ contract.contract_number }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ contract.vendor_name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${{ formatCurrency(contract.original_amount) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${{ formatCurrency(contract.total_change_orders) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${{ formatCurrency(contract.revised_amount) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${{ formatCurrency(contract.total_paid) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${{ formatCurrency(contract.balance_remaining) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      :class="getStatusClass(contract.status)">
                  {{ contract.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Budget Breakdown Section -->
    <div class="bg-white rounded-lg shadow-md mb-8">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Budget Breakdown by Category</h3>
      </div>
      
      <div class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Budget Chart -->
          <div class="h-64">
            <canvas ref="budgetChart"></canvas>
          </div>
          
          <!-- Budget Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocated
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="category in budgetBreakdown" :key="category.category_name" class="hover:bg-gray-50">
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ category.category_name }}</div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${{ formatCurrency(category.allocated_amount) }}</div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${{ formatCurrency(category.spent_amount) }}</div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-sm" 
                         :class="category.remaining_amount >= 0 ? 'text-green-600' : 'text-red-600'">
                      ${{ formatCurrency(category.remaining_amount) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Financial Activity -->
    <div class="bg-white rounded-lg shadow-md">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Recent Financial Activity</h3>
      </div>
      
      <div class="divide-y divide-gray-200">
        <div v-for="activity in recentActivity" :key="activity.id" 
             class="px-6 py-4 hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                     :class="activity.activity_type === 'payment' ? 'bg-green-100' : 'bg-blue-100'">
                  <CreditCard v-if="activity.activity_type === 'payment'" 
                             class="h-4 w-4 text-green-600" />
                  <Receipt v-else class="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ activity.activity_type === 'payment' ? 'Payment' : 'Expense' }} - {{ activity.reference }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ activity.vendor_name || 'Internal' }} • {{ formatDate(activity.activity_date) }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">
                ${{ formatCurrency(activity.amount) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  AlertCircle, 
  Download, 
  Printer, 
  CreditCard, 
  Receipt 
} from 'lucide-vue-next'
import Chart from 'chart.js/auto'

export default {
  name: 'ProjectFinancialSummary',
  components: {
    DollarSign,
    TrendingUp,
    FileText,
    AlertCircle,
    Download,
    Printer,
    CreditCard,
    Receipt
  },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const summary = ref({})
    const contractRollup = ref([])
    const budgetBreakdown = ref([])
    const recentActivity = ref([])
    const loading = ref(false)
    const budgetChart = ref(null)
    let chartInstance = null

    const fetchFinancialSummary = async () => {
      loading.value = true
      try {
        const response = await fetch(`/api/phase3-4/projects/${props.projectId}/financial-summary`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          summary.value = data.data.summary
          contractRollup.value = data.data.contractRollup
          budgetBreakdown.value = data.data.budgetBreakdown
          recentActivity.value = data.data.recentActivity
          
          await nextTick()
          createBudgetChart()
        }
      } catch (error) {
        console.error('Error fetching financial summary:', error)
      } finally {
        loading.value = false
      }
    }

    const createBudgetChart = () => {
      if (!budgetChart.value || budgetBreakdown.value.length === 0) return

      const ctx = budgetChart.value.getContext('2d')
      
      if (chartInstance) {
        chartInstance.destroy()
      }

      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: budgetBreakdown.value.map(item => item.category_name),
          datasets: [{
            data: budgetBreakdown.value.map(item => item.spent_amount),
            backgroundColor: [
              '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
              '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
            ],
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
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return `${context.label}: $${formatCurrency(value)} (${percentage}%)`
                }
              }
            }
          }
        }
      })
    }

    const formatCurrency = (amount) => {
      if (!amount) return '0.00'
      return parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const getStatusClass = (status) => {
      const statusClasses = {
        'Active': 'bg-green-100 text-green-800',
        'Completed': 'bg-blue-100 text-blue-800',
        'On Hold': 'bg-yellow-100 text-yellow-800',
        'Cancelled': 'bg-red-100 text-red-800',
        'Draft': 'bg-gray-100 text-gray-800'
      }
      return statusClasses[status] || 'bg-gray-100 text-gray-800'
    }

    const viewContractDetails = (contractId) => {
      // Emit event to parent or navigate to contract details
      window.open(`/contracts/${contractId}`, '_blank')
    }

    const exportContractData = async () => {
      try {
        const response = await fetch('/api/phase3-4/export/csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            entityType: 'contracts',
            filters: { projectId: props.projectId }
          })
        })

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `project_${props.projectId}_contracts.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } catch (error) {
        console.error('Error exporting contract data:', error)
      }
    }

    const printContractSummary = () => {
      window.print()
    }

    onMounted(() => {
      fetchFinancialSummary()
    })

    return {
      summary,
      contractRollup,
      budgetBreakdown,
      recentActivity,
      loading,
      budgetChart,
      formatCurrency,
      formatDate,
      getStatusClass,
      viewContractDetails,
      exportContractData,
      printContractSummary
    }
  }
}
</script>

<style scoped>
@media print {
  .project-financial-summary {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
  
  button {
    display: none;
  }
  
  .shadow-md {
    box-shadow: none;
    border: 1px solid #e5e7eb;
  }
}
</style>

