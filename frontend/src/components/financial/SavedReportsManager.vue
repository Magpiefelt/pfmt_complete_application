<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
          Saved Reports
        </AlbertaText>
        <AlbertaText variant="body-s" color="secondary">
          Manage and access your saved financial reports
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="showCreateReportDialog = true">
          <Plus class="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              v-model="filters.reportType"
              @change="loadReports"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="variance">Variance Analysis</option>
              <option value="cashflow">Cash Flow</option>
              <option value="vendor">Vendor Spending</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Created By</label>
            <select
              v-model="filters.createdBy"
              @change="loadReports"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              v-model="filters.dateRange"
              @change="loadReports"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Reports Grid -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
    <div v-else-if="reports.length === 0" class="text-center py-8">
      <FileText class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <AlbertaText variant="body-m" color="secondary">
        No saved reports found. Create your first report to get started.
      </AlbertaText>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card 
        v-for="report in reports" 
        :key="report.id" 
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="viewReport(report)"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <CardTitle class="text-lg mb-1">{{ report.name }}</CardTitle>
              <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getReportTypeClass(report.type)">
                  {{ formatReportType(report.type) }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatDate(report.created_at) }}
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-1">
              <Button variant="ghost" size="sm" @click.stop="downloadReport(report)">
                <Download class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" @click.stop="shareReport(report)">
                <Share class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" @click.stop="deleteReport(report)">
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <p class="text-sm text-gray-600 line-clamp-2">
              {{ report.description || 'No description available' }}
            </p>
            
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>Created by {{ report.created_by_name }}</span>
              <span>{{ report.file_size ? formatFileSize(report.file_size) : 'N/A' }}</span>
            </div>
            
            <!-- Report Preview/Summary -->
            <div v-if="report.summary" class="mt-3 p-2 bg-gray-50 rounded text-xs">
              <div class="grid grid-cols-2 gap-2">
                <div v-if="report.summary.total_records">
                  <span class="text-gray-600">Records:</span>
                  <span class="font-medium">{{ report.summary.total_records }}</span>
                </div>
                <div v-if="report.summary.total_amount">
                  <span class="text-gray-600">Amount:</span>
                  <span class="font-medium">${{ formatCurrency(report.summary.total_amount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-between">
      <div class="text-sm text-gray-700">
        Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to 
        {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of 
        {{ pagination.total }} reports
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

    <!-- Create Report Dialog -->
    <Dialog v-model:open="showCreateReportDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
          <DialogDescription>
            Generate a new financial report for this project
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Report Name *</label>
            <input
              v-model="newReport.name"
              type="text"
              required
              placeholder="e.g., Monthly Variance Report"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
            <select
              v-model="newReport.type"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Type</option>
              <option value="variance">Variance Analysis</option>
              <option value="cashflow">Cash Flow Report</option>
              <option value="vendor">Vendor Spending</option>
              <option value="custom">Custom Report</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              v-model="newReport.description"
              rows="3"
              placeholder="Brief description of the report..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="newReport.startDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                v-model="newReport.endDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              v-model="newReport.format"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreateReportDialog = false">
            Cancel
          </Button>
          <Button @click="createReport" :disabled="!isValidReport">
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlbertaText } from '@/components/ui/alberta-text'
import { 
  Plus, 
  Download, 
  Share, 
  Trash2, 
  FileText 
} from 'lucide-vue-next'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

// Reactive data
const loading = ref(false)
const reports = ref([])
const users = ref([])
const showCreateReportDialog = ref(false)

const pagination = ref({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0
})

const filters = ref({
  reportType: '',
  createdBy: '',
  dateRange: ''
})

const newReport = ref({
  name: '',
  type: '',
  description: '',
  startDate: '',
  endDate: '',
  format: 'pdf'
})

// Computed properties
const isValidReport = computed(() => {
  return newReport.value.name && newReport.value.type
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

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatReportType = (type) => {
  const types = {
    'variance': 'Variance Analysis',
    'cashflow': 'Cash Flow',
    'vendor': 'Vendor Spending',
    'custom': 'Custom Report'
  }
  return types[type] || type
}

const getReportTypeClass = (type) => {
  const classes = {
    'variance': 'bg-blue-100 text-blue-800',
    'cashflow': 'bg-green-100 text-green-800',
    'vendor': 'bg-purple-100 text-purple-800',
    'custom': 'bg-gray-100 text-gray-800'
  }
  return classes[type] || 'bg-gray-100 text-gray-800'
}

const loadReports = async () => {
  try {
    loading.value = true
    
    // Mock data for demonstration
    const mockReports = [
      {
        id: '1',
        name: 'Q3 Variance Analysis',
        type: 'variance',
        description: 'Quarterly budget variance analysis for construction phase',
        created_at: '2024-08-01T10:00:00Z',
        created_by_name: 'Sarah Johnson',
        file_size: 2048576,
        summary: {
          total_records: 156,
          total_amount: 2500000
        }
      },
      {
        id: '2',
        name: 'Cash Flow Projection',
        type: 'cashflow',
        description: 'Monthly cash flow analysis and projections',
        created_at: '2024-07-28T14:30:00Z',
        created_by_name: 'Michael Chen',
        file_size: 1536000,
        summary: {
          total_records: 89,
          total_amount: 1800000
        }
      },
      {
        id: '3',
        name: 'Vendor Performance Report',
        type: 'vendor',
        description: 'Comprehensive vendor spending and performance analysis',
        created_at: '2024-07-25T09:15:00Z',
        created_by_name: 'Lisa Rodriguez',
        file_size: 3072000,
        summary: {
          total_records: 23,
          total_amount: 4200000
        }
      }
    ]
    
    reports.value = mockReports
    pagination.value = {
      page: 1,
      limit: 12,
      total: mockReports.length,
      totalPages: 1
    }
  } catch (error) {
    console.error('Error loading reports:', error)
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    // Mock users data
    users.value = [
      { id: '1', name: 'Sarah Johnson' },
      { id: '2', name: 'Michael Chen' },
      { id: '3', name: 'Lisa Rodriguez' }
    ]
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

const createReport = async () => {
  try {
    // Implementation for creating report
    console.log('Creating report:', newReport.value)
    
    showCreateReportDialog.value = false
    newReport.value = {
      name: '',
      type: '',
      description: '',
      startDate: '',
      endDate: '',
      format: 'pdf'
    }
    
    await loadReports()
  } catch (error) {
    console.error('Error creating report:', error)
  }
}

const viewReport = (report) => {
  console.log('Viewing report:', report)
  // Implementation for viewing report
}

const downloadReport = (report) => {
  console.log('Downloading report:', report)
  // Implementation for downloading report
}

const shareReport = (report) => {
  console.log('Sharing report:', report)
  // Implementation for sharing report
}

const deleteReport = async (report) => {
  if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
    console.log('Deleting report:', report)
    // Implementation for deleting report
    await loadReports()
  }
}

const changePage = (page) => {
  pagination.value.page = page
  loadReports()
}

// Lifecycle
onMounted(() => {
  loadUsers()
  loadReports()
})

// Watch for filter changes
watch(filters, () => {
  pagination.value.page = 1
  loadReports()
}, { deep: true })
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.transition-shadow {
  transition: box-shadow 0.2s ease-in-out;
}
</style>

