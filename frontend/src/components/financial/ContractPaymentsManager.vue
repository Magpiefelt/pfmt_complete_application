<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
          Contract Payments
        </AlbertaText>
        <AlbertaText variant="body-s" color="secondary">
          Track and manage contract payment transactions
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="exportPayments">
          <Download class="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button @click="showAddPaymentDialog = true">
          <Plus class="w-4 h-4 mr-2" />
          Add Payment
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contract</label>
            <select
              v-model="filters.contractId"
              @change="loadPayments"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Contracts</option>
              <option v-for="contract in contracts" :key="contract.id" :value="contract.id">
                {{ contract.contract_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              v-model="filters.status"
              @change="loadPayments"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              v-model="filters.startDate"
              @change="loadPayments"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              v-model="filters.endDate"
              @change="loadPayments"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Payments Summary -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Total Payments
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold">
              {{ paymentsSummary.totalCount }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Total Amount
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold">
              ${{ formatCurrency(paymentsSummary.totalAmount) }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Paid Amount
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold text-green-600">
              ${{ formatCurrency(paymentsSummary.paidAmount) }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Pending Amount
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold text-orange-600">
              ${{ formatCurrency(paymentsSummary.pendingAmount) }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Payments Table -->
    <Card>
      <CardHeader>
        <CardTitle>Payment Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        
        <div v-else-if="payments.length === 0" class="text-center py-8">
          <AlbertaText variant="body-m" color="secondary">
            No payments found for the selected criteria
          </AlbertaText>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source Ref
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="payment in payments" :key="payment.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(payment.payment_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div class="font-medium">{{ payment.contract_name }}</div>
                    <div class="text-gray-500">{{ payment.contract_number }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ payment.vendor_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  ${{ formatCurrency(payment.amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getPaymentTypeClass(payment.payment_type)">
                    {{ payment.payment_type }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getStatusClass(payment.status)">
                    {{ payment.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ payment.source_ref }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-2">
                    <Button variant="outline" size="sm" @click="viewPaymentDetails(payment)">
                      <Eye class="w-4 h-4" />
                    </Button>
                    <Button 
                      v-if="payment.status === 'pending'" 
                      variant="outline" 
                      size="sm" 
                      @click="approvePayment(payment)"
                    >
                      <Check class="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex items-center justify-between mt-6">
          <div class="text-sm text-gray-700">
            Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to 
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of 
            {{ pagination.total }} results
          </div>
          <div class="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              :disabled="pagination.page === 1"
              @click="changePage(pagination.page - 1)"
            >
              Previous
            </Button>
            <span class="px-3 py-1 text-sm">
              Page {{ pagination.page }} of {{ pagination.totalPages }}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              :disabled="pagination.page === pagination.totalPages"
              @click="changePage(pagination.page + 1)"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Add Payment Dialog -->
    <Dialog v-model:open="showAddPaymentDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contract Payment</DialogTitle>
          <DialogDescription>
            Record a new contract payment transaction
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contract *</label>
            <select
              v-model="newPayment.contractId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Contract</option>
              <option v-for="contract in contracts" :key="contract.id" :value="contract.id">
                {{ contract.contract_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              v-model="newPayment.amount"
              type="number"
              step="0.01"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
            <input
              v-model="newPayment.paymentDate"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
            <select
              v-model="newPayment.paymentType"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="progress">Progress Payment</option>
              <option value="final">Final Payment</option>
              <option value="holdback">Holdback Release</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Source Reference</label>
            <input
              v-model="newPayment.sourceRef"
              type="text"
              placeholder="e.g., 1GX-2024-001234"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              v-model="newPayment.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddPaymentDialog = false">
            Cancel
          </Button>
          <Button @click="addPayment" :disabled="!isValidPayment">
            Add Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui"
import { AlbertaText } from "@/components/ui"
import { Download, Plus, Eye, Check } from 'lucide-vue-next'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

// Reactive data
const loading = ref(false)
const payments = ref([])
const contracts = ref([])
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0
})

const filters = ref({
  contractId: '',
  status: '',
  startDate: '',
  endDate: ''
})

const showAddPaymentDialog = ref(false)
const newPayment = ref({
  contractId: '',
  amount: '',
  paymentDate: '',
  paymentType: 'progress',
  sourceRef: '',
  description: ''
})

// Computed properties
const paymentsSummary = computed(() => {
  return payments.value.reduce((summary, payment) => {
    summary.totalCount++
    summary.totalAmount += parseFloat(payment.amount)
    if (payment.status === 'paid') {
      summary.paidAmount += parseFloat(payment.amount)
    } else if (payment.status === 'pending') {
      summary.pendingAmount += parseFloat(payment.amount)
    }
    return summary
  }, {
    totalCount: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  })
})

const isValidPayment = computed(() => {
  return newPayment.value.contractId && 
         newPayment.value.amount && 
         newPayment.value.paymentDate
})

// Methods
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-CA')
}

const getStatusClass = (status) => {
  const classes = {
    'paid': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getPaymentTypeClass = (type) => {
  const classes = {
    'progress': 'bg-blue-100 text-blue-800',
    'final': 'bg-green-100 text-green-800',
    'holdback': 'bg-purple-100 text-purple-800'
  }
  return classes[type] || 'bg-gray-100 text-gray-800'
}

const loadPayments = async () => {
  try {
    loading.value = true
    const params = new URLSearchParams({
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters.value
    })
    
    const response = await fetch(`/api/phase1/projects/${props.projectId}/payments?${params}`)
    const data = await response.json()
    
    if (data.success) {
      payments.value = data.data.payments
      pagination.value = data.data.pagination
    }
  } catch (error) {
    console.error('Error loading payments:', error)
  } finally {
    loading.value = false
  }
}

const loadContracts = async () => {
  try {
    const response = await fetch(`/api/projects/${props.projectId}/contracts`)
    const data = await response.json()
    
    if (data.success) {
      contracts.value = data.data
    }
  } catch (error) {
    console.error('Error loading contracts:', error)
  }
}

const addPayment = async () => {
  try {
    const response = await fetch(`/api/phase1/projects/${props.projectId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPayment.value)
    })
    
    const data = await response.json()
    
    if (data.success) {
      showAddPaymentDialog.value = false
      newPayment.value = {
        contractId: '',
        amount: '',
        paymentDate: '',
        paymentType: 'progress',
        sourceRef: '',
        description: ''
      }
      await loadPayments()
    }
  } catch (error) {
    console.error('Error adding payment:', error)
  }
}

const changePage = (page) => {
  pagination.value.page = page
  loadPayments()
}

const viewPaymentDetails = (payment) => {
  // Implementation for viewing payment details
}

const approvePayment = (payment) => {
  // Implementation for approving payment
}

const exportPayments = () => {
  // Implementation for exporting payments
}

// Lifecycle
onMounted(() => {
  loadContracts()
  loadPayments()
})

// Watch for filter changes
watch(filters, () => {
  pagination.value.page = 1
  loadPayments()
}, { deep: true })
</script>

