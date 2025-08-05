<template>
  <div class="contract-financial-rollup">
    <!-- Contract Header Summary -->
    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">
            Contract Financial Summary
          </h2>
          <div class="flex space-x-2">
            <button @click="exportContractData" 
                    class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Download class="h-4 w-4 mr-2" />
              Export
            </button>
            <button @click="printSummary" 
                    class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Printer class="h-4 w-4 mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>

      <div v-if="contract.id" class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Original Amount -->
          <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <FileText class="h-5 w-5 text-blue-600" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-blue-600">Original Amount</p>
                <p class="text-lg font-bold text-blue-900">
                  ${{ formatCurrency(contract.original_amount) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Change Orders -->
          <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div class="flex items-center">
              <div class="p-2 bg-orange-100 rounded-lg">
                <Edit class="h-5 w-5 text-orange-600" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-orange-600">Change Orders</p>
                <p class="text-lg font-bold text-orange-900">
                  ${{ formatCurrency(contract.total_change_orders) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Revised Amount -->
          <div class="bg-green-50 rounded-lg p-4 border border-green-200">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <Calculator class="h-5 w-5 text-green-600" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-green-600">Revised Amount</p>
                <p class="text-lg font-bold text-green-900">
                  ${{ formatCurrency(contract.revised_amount) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Balance Remaining -->
          <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <Wallet class="h-5 w-5 text-purple-600" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-purple-600">Balance Remaining</p>
                <p class="text-lg font-bold text-purple-900">
                  ${{ formatCurrency(contract.balance_remaining) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Payment Progress</span>
            <span class="text-sm text-gray-500">
              {{ paymentPercentage }}% Complete
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="bg-blue-600 h-3 rounded-full transition-all duration-300"
                 :style="{ width: paymentPercentage + '%' }"></div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>$0</span>
            <span>${{ formatCurrency(contract.revised_amount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Orders Section -->
    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Change Orders</h3>
      </div>
      
      <div v-if="changeOrders.length === 0" class="p-6 text-center text-gray-500">
        <FileX class="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No change orders found for this contract.</p>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CO Number
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Approved By
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="co in changeOrders" :key="co.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-blue-600">{{ co.change_order_number }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate" :title="co.description">
                  {{ co.description }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  ${{ formatCurrency(co.amount) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      :class="getStatusClass(co.status)">
                  {{ co.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatDate(co.requested_date) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ co.approved_by_name || '-' }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Payment History Section -->
    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Payment History</h3>
      </div>
      
      <div v-if="payments.length === 0" class="p-6 text-center text-gray-500">
        <CreditCard class="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No payments recorded for this contract.</p>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="payment in payments" :key="payment.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatDate(payment.payment_date) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  ${{ formatCurrency(payment.amount) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      :class="getPaymentStatusClass(payment.status)">
                  {{ payment.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ payment.source_ref || '-' }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate" :title="payment.description">
                  {{ payment.description || '-' }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Financial Summary Chart -->
    <div class="bg-white rounded-lg shadow-md">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Financial Breakdown</h3>
      </div>
      
      <div class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Chart -->
          <div class="h-64">
            <canvas ref="financialChart"></canvas>
          </div>
          
          <!-- Summary Stats -->
          <div class="space-y-4">
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span class="text-sm font-medium text-gray-600">Total Contract Value</span>
              <span class="text-sm font-bold text-gray-900">
                ${{ formatCurrency(contract.revised_amount) }}
              </span>
            </div>
            <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span class="text-sm font-medium text-green-600">Total Paid</span>
              <span class="text-sm font-bold text-green-900">
                ${{ formatCurrency(contract.total_paid) }}
              </span>
            </div>
            <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span class="text-sm font-medium text-orange-600">Holdback</span>
              <span class="text-sm font-bold text-orange-900">
                ${{ formatCurrency(contract.holdback_amount) }}
              </span>
            </div>
            <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span class="text-sm font-medium text-blue-600">Remaining Balance</span>
              <span class="text-sm font-bold text-blue-900">
                ${{ formatCurrency(contract.balance_remaining) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { 
  Download, 
  Printer, 
  FileText, 
  Edit, 
  Calculator, 
  Wallet, 
  FileX, 
  CreditCard 
} from 'lucide-vue-next'
import Chart from 'chart.js/auto'

export default {
  name: 'ContractFinancialRollup',
  components: {
    Download,
    Printer,
    FileText,
    Edit,
    Calculator,
    Wallet,
    FileX,
    CreditCard
  },
  props: {
    contractId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const contract = ref({})
    const changeOrders = ref([])
    const payments = ref([])
    const loading = ref(false)
    const financialChart = ref(null)
    let chartInstance = null

    const paymentPercentage = computed(() => {
      if (!contract.value.revised_amount || contract.value.revised_amount === 0) return 0
      return Math.round((contract.value.total_paid / contract.value.revised_amount) * 100)
    })

    const fetchContractRollup = async () => {
      loading.value = true
      try {
        const response = await fetch(`/api/phase3-4/contracts/${props.contractId}/financial-rollup`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          contract.value = data.data.contract
          changeOrders.value = data.data.changeOrders
          payments.value = data.data.payments
          
          await nextTick()
          createFinancialChart()
        }
      } catch (error) {
        console.error('Error fetching contract rollup:', error)
      } finally {
        loading.value = false
      }
    }

    const createFinancialChart = () => {
      if (!financialChart.value || !contract.value.id) return

      const ctx = financialChart.value.getContext('2d')
      
      if (chartInstance) {
        chartInstance.destroy()
      }

      const data = {
        labels: ['Paid', 'Holdback', 'Remaining'],
        datasets: [{
          data: [
            contract.value.total_paid || 0,
            contract.value.holdback_amount || 0,
            contract.value.balance_remaining || 0
          ],
          backgroundColor: ['#10B981', '#F59E0B', '#3B82F6'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      }

      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: data,
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
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
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
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const getStatusClass = (status) => {
      const statusClasses = {
        'Approved': 'bg-green-100 text-green-800',
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Rejected': 'bg-red-100 text-red-800',
        'Draft': 'bg-gray-100 text-gray-800'
      }
      return statusClasses[status] || 'bg-gray-100 text-gray-800'
    }

    const getPaymentStatusClass = (status) => {
      const statusClasses = {
        'Completed': 'bg-green-100 text-green-800',
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Failed': 'bg-red-100 text-red-800',
        'Processing': 'bg-blue-100 text-blue-800'
      }
      return statusClasses[status] || 'bg-gray-100 text-gray-800'
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
            entityType: 'payments',
            filters: { contractId: props.contractId }
          })
        })

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `contract_${props.contractId}_financial_data.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } catch (error) {
        console.error('Error exporting contract data:', error)
      }
    }

    const printSummary = () => {
      window.print()
    }

    onMounted(() => {
      fetchContractRollup()
    })

    return {
      contract,
      changeOrders,
      payments,
      loading,
      financialChart,
      paymentPercentage,
      formatCurrency,
      formatDate,
      getStatusClass,
      getPaymentStatusClass,
      exportContractData,
      printSummary
    }
  }
}
</script>

<style scoped>
@media print {
  .contract-financial-rollup {
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

