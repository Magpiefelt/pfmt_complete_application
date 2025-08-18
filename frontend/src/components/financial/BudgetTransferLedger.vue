<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
          Budget Transfer Ledger
        </AlbertaText>
        <AlbertaText variant="body-s" color="secondary">
          Track budget transfers between categories and funding sources
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="exportTransfers">
          <Download class="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button @click="showAddTransferDialog = true">
          <Plus class="w-4 h-4 mr-2" />
          New Transfer
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              v-model="filters.status"
              @change="loadTransfers"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              v-model="filters.startDate"
              @change="loadTransfers"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              v-model="filters.endDate"
              @change="loadTransfers"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
            <input
              v-model="filters.minAmount"
              @change="loadTransfers"
              type="number"
              step="1000"
              placeholder="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Transfer Summary -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Total Transfers
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold">
              {{ transfersSummary.totalCount }}
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
              ${{ formatCurrency(transfersSummary.totalAmount) }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Approved Amount
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold text-green-600">
              ${{ formatCurrency(transfersSummary.approvedAmount) }}
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
              ${{ formatCurrency(transfersSummary.pendingAmount) }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Transfers Table -->
    <Card>
      <CardHeader>
        <CardTitle>Budget Transfer History</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        
        <div v-else-if="transfers.length === 0" class="text-center py-8">
          <AlbertaText variant="body-m" color="secondary">
            No budget transfers found for the selected criteria
          </AlbertaText>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From Category
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To Category
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved By
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="transfer in transfers" :key="transfer.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(transfer.transfer_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {{ transfer.from_category }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {{ transfer.to_category }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  ${{ formatCurrency(transfer.amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getStatusClass(transfer.status)">
                    {{ transfer.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div v-if="transfer.approved_by_name">
                    <div class="font-medium">{{ transfer.approved_by_name }}</div>
                    <div class="text-gray-500">{{ formatDate(transfer.approved_at) }}</div>
                  </div>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-2">
                    <Button variant="outline" size="sm" @click="viewTransferDetails(transfer)">
                      <Eye class="w-4 h-4" />
                    </Button>
                    <Button 
                      v-if="transfer.status === 'pending'" 
                      variant="outline" 
                      size="sm" 
                      @click="approveTransfer(transfer)"
                    >
                      <Check class="w-4 h-4" />
                    </Button>
                    <Button 
                      v-if="transfer.status === 'pending'" 
                      variant="outline" 
                      size="sm" 
                      @click="rejectTransfer(transfer)"
                    >
                      <X class="w-4 h-4" />
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

    <!-- Add Transfer Dialog -->
    <Dialog v-model:open="showAddTransferDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Budget Transfer</DialogTitle>
          <DialogDescription>
            Transfer budget between categories
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">From Category *</label>
            <select
              v-model="newTransfer.fromCategory"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              <option v-for="category in budgetCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">To Category *</label>
            <select
              v-model="newTransfer.toCategory"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              <option v-for="category in budgetCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              v-model="newTransfer.amount"
              type="number"
              step="0.01"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Transfer Date *</label>
            <input
              v-model="newTransfer.transferDate"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rationale *</label>
            <textarea
              v-model="newTransfer.rationale"
              rows="3"
              required
              placeholder="Explain the reason for this budget transfer..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddTransferDialog = false">
            Cancel
          </Button>
          <Button @click="addTransfer" :disabled="!isValidTransfer">
            Create Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Transfer Details Dialog -->
    <Dialog v-model:open="showDetailsDialog">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer Details</DialogTitle>
        </DialogHeader>
        <div v-if="selectedTransfer" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Transfer Date</label>
              <p class="text-sm text-gray-900">{{ formatDate(selectedTransfer.transfer_date) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Amount</label>
              <p class="text-sm text-gray-900 font-medium">${{ formatCurrency(selectedTransfer.amount) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">From Category</label>
              <p class="text-sm text-gray-900">{{ selectedTransfer.from_category }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">To Category</label>
              <p class="text-sm text-gray-900">{{ selectedTransfer.to_category }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusClass(selectedTransfer.status)">
                {{ selectedTransfer.status }}
              </span>
            </div>
            <div v-if="selectedTransfer.approved_by_name">
              <label class="block text-sm font-medium text-gray-700">Approved By</label>
              <p class="text-sm text-gray-900">{{ selectedTransfer.approved_by_name }}</p>
              <p class="text-xs text-gray-500">{{ formatDate(selectedTransfer.approved_at) }}</p>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Rationale</label>
            <p class="text-sm text-gray-900 mt-1">{{ selectedTransfer.rationale }}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDetailsDialog = false">
            Close
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
import { Download, Plus, Eye, Check, X } from 'lucide-vue-next'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

// Reactive data
const loading = ref(false)
const transfers = ref([])
const budgetCategories = ref([
  'Construction',
  'Design',
  'Project Management',
  'Technology',
  'Security Systems',
  'Furniture & Equipment',
  'Contingency'
])

const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0
})

const filters = ref({
  status: '',
  startDate: '',
  endDate: '',
  minAmount: ''
})

const showAddTransferDialog = ref(false)
const showDetailsDialog = ref(false)
const selectedTransfer = ref(null)

const newTransfer = ref({
  fromCategory: '',
  toCategory: '',
  amount: '',
  transferDate: new Date().toISOString().split('T')[0],
  rationale: ''
})

// Computed properties
const transfersSummary = computed(() => {
  return transfers.value.reduce((summary, transfer) => {
    summary.totalCount++
    summary.totalAmount += parseFloat(transfer.amount)
    if (transfer.status === 'approved') {
      summary.approvedAmount += parseFloat(transfer.amount)
    } else if (transfer.status === 'pending') {
      summary.pendingAmount += parseFloat(transfer.amount)
    }
    return summary
  }, {
    totalCount: 0,
    totalAmount: 0,
    approvedAmount: 0,
    pendingAmount: 0
  })
})

const isValidTransfer = computed(() => {
  return newTransfer.value.fromCategory && 
         newTransfer.value.toCategory && 
         newTransfer.value.fromCategory !== newTransfer.value.toCategory &&
         newTransfer.value.amount && 
         newTransfer.value.transferDate &&
         newTransfer.value.rationale
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
    'approved': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'rejected': 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const loadTransfers = async () => {
  try {
    loading.value = true
    const params = new URLSearchParams({
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters.value
    })
    
    const response = await fetch(`/api/phase1/projects/${props.projectId}/budget-transfers?${params}`)
    const data = await response.json()
    
    if (data.success) {
      transfers.value = data.data.transfers
      pagination.value = data.data.pagination
    }
  } catch (error) {
    console.error('Error loading transfers:', error)
  } finally {
    loading.value = false
  }
}

const addTransfer = async () => {
  try {
    const response = await fetch(`/api/phase1/projects/${props.projectId}/budget-transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newTransfer.value)
    })
    
    const data = await response.json()
    
    if (data.success) {
      showAddTransferDialog.value = false
      newTransfer.value = {
        fromCategory: '',
        toCategory: '',
        amount: '',
        transferDate: new Date().toISOString().split('T')[0],
        rationale: ''
      }
      await loadTransfers()
    }
  } catch (error) {
    console.error('Error adding transfer:', error)
  }
}

const changePage = (page) => {
  pagination.value.page = page
  loadTransfers()
}

const viewTransferDetails = (transfer) => {
  selectedTransfer.value = transfer
  showDetailsDialog.value = true
}

const approveTransfer = async (transfer) => {
  // Implementation for approving transfer
}

const rejectTransfer = async (transfer) => {
  // Implementation for rejecting transfer
}

const exportTransfers = () => {
  // Implementation for exporting transfers
}

// Lifecycle
onMounted(() => {
  loadTransfers()
})

// Watch for filter changes
watch(filters, () => {
  pagination.value.page = 1
  loadTransfers()
}, { deep: true })
</script>

