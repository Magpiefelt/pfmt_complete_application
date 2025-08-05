<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
          Approval History
        </AlbertaText>
        <AlbertaText variant="body-s" color="secondary">
          Track all approval activities and decision history for this project
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="exportHistory">
          <Download class="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button @click="refreshHistory">
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              v-model="filters.entityType"
              @change="loadHistory"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="project">Project</option>
              <option value="budget_transfers">Budget Transfers</option>
              <option value="contract_payments">Contract Payments</option>
              <option value="contracts">Contracts</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Change Type</label>
            <select
              v-model="filters.changeType"
              @change="loadHistory"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Changes</option>
              <option value="created">Created</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="update">Updated</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              v-model="filters.startDate"
              @change="loadHistory"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              v-model="filters.endDate"
              @change="loadHistory"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Total Activities
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold">
              {{ historySummary.totalCount }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Approvals
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold text-green-600">
              {{ historySummary.approvalCount }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Rejections
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold text-red-600">
              {{ historySummary.rejectionCount }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Updates
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold text-blue-600">
              {{ historySummary.updateCount }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- History Timeline -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <History class="h-5 w-5" />
          Approval Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        
        <div v-else-if="history.length === 0" class="text-center py-8">
          <AlbertaText variant="body-m" color="secondary">
            No approval history found for the selected criteria
          </AlbertaText>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="entry in history" 
            :key="entry.id" 
            class="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <!-- Timeline Icon -->
            <div class="flex-shrink-0">
              <div class="w-10 h-10 rounded-full flex items-center justify-center"
                   :class="getTimelineIconClass(entry.changeType)">
                <component :is="getTimelineIcon(entry.changeType)" class="w-5 h-5" />
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <AlbertaText variant="body-m" color="primary" class="font-medium">
                    {{ entry.changeDescription }}
                  </AlbertaText>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getEntityTypeClass(entry.entityType)">
                    {{ formatEntityType(entry.entityType) }}
                  </span>
                </div>
                <div class="text-sm text-gray-500">
                  {{ formatDateTime(entry.timestamp) }}
                </div>
              </div>

              <div class="mt-1 flex items-center space-x-4">
                <div v-if="entry.user_name" class="flex items-center space-x-1">
                  <User class="w-4 h-4 text-gray-400" />
                  <span class="text-sm text-gray-600">{{ entry.user_name }}</span>
                </div>
                <div v-if="entry.user_email" class="text-sm text-gray-500">
                  {{ entry.user_email }}
                </div>
              </div>

              <!-- Change Details -->
              <div v-if="entry.old_values || entry.new_values" class="mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  @click="toggleDetails(entry.id)"
                  class="text-xs"
                >
                  <ChevronDown 
                    class="w-3 h-3 mr-1 transition-transform" 
                    :class="{ 'rotate-180': expandedEntries.has(entry.id) }"
                  />
                  {{ expandedEntries.has(entry.id) ? 'Hide' : 'Show' }} Details
                </Button>

                <div v-if="expandedEntries.has(entry.id)" class="mt-3 p-3 bg-gray-50 rounded-md">
                  <div v-if="entry.old_values && entry.new_values" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <AlbertaText variant="body-s" color="secondary" class="font-medium mb-2">
                        Previous Values
                      </AlbertaText>
                      <pre class="text-xs text-gray-600 whitespace-pre-wrap">{{ formatJSON(entry.old_values) }}</pre>
                    </div>
                    <div>
                      <AlbertaText variant="body-s" color="secondary" class="font-medium mb-2">
                        New Values
                      </AlbertaText>
                      <pre class="text-xs text-gray-600 whitespace-pre-wrap">{{ formatJSON(entry.new_values) }}</pre>
                    </div>
                  </div>
                  <div v-else-if="entry.new_values">
                    <AlbertaText variant="body-s" color="secondary" class="font-medium mb-2">
                      Created Values
                    </AlbertaText>
                    <pre class="text-xs text-gray-600 whitespace-pre-wrap">{{ formatJSON(entry.new_values) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlbertaText } from '@/components/ui/alberta-text'
import { 
  Download, 
  RefreshCw, 
  History, 
  User, 
  ChevronDown,
  Plus,
  Check,
  X,
  Edit,
  Trash2
} from 'lucide-vue-next'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

// Reactive data
const loading = ref(false)
const history = ref([])
const expandedEntries = ref(new Set())

const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0
})

const filters = ref({
  entityType: '',
  changeType: '',
  startDate: '',
  endDate: ''
})

// Computed properties
const historySummary = computed(() => {
  return history.value.reduce((summary, entry) => {
    summary.totalCount++
    switch (entry.changeType) {
      case 'approved':
        summary.approvalCount++
        break
      case 'rejected':
        summary.rejectionCount++
        break
      case 'update':
        summary.updateCount++
        break
    }
    return summary
  }, {
    totalCount: 0,
    approvalCount: 0,
    rejectionCount: 0,
    updateCount: 0
  })
})

// Methods
const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatEntityType = (entityType) => {
  const types = {
    'project': 'Project',
    'budget_transfers': 'Budget Transfer',
    'contract_payments': 'Contract Payment',
    'contracts': 'Contract'
  }
  return types[entityType] || entityType
}

const getEntityTypeClass = (entityType) => {
  const classes = {
    'project': 'bg-blue-100 text-blue-800',
    'budget_transfers': 'bg-green-100 text-green-800',
    'contract_payments': 'bg-purple-100 text-purple-800',
    'contracts': 'bg-orange-100 text-orange-800'
  }
  return classes[entityType] || 'bg-gray-100 text-gray-800'
}

const getTimelineIconClass = (changeType) => {
  const classes = {
    'created': 'bg-blue-100 text-blue-600',
    'approved': 'bg-green-100 text-green-600',
    'rejected': 'bg-red-100 text-red-600',
    'update': 'bg-yellow-100 text-yellow-600'
  }
  return classes[changeType] || 'bg-gray-100 text-gray-600'
}

const getTimelineIcon = (changeType) => {
  const icons = {
    'created': Plus,
    'approved': Check,
    'rejected': X,
    'update': Edit
  }
  return icons[changeType] || Edit
}

const formatJSON = (obj) => {
  if (!obj) return ''
  try {
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return String(obj)
  }
}

const toggleDetails = (entryId) => {
  if (expandedEntries.value.has(entryId)) {
    expandedEntries.value.delete(entryId)
  } else {
    expandedEntries.value.add(entryId)
  }
}

const loadHistory = async () => {
  try {
    loading.value = true
    const params = new URLSearchParams({
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters.value
    })
    
    const response = await fetch(`/api/phase1/projects/${props.projectId}/approval-history?${params}`)
    const data = await response.json()
    
    if (data.success) {
      history.value = data.data.history
      pagination.value = data.data.pagination
    }
  } catch (error) {
    console.error('Error loading approval history:', error)
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  pagination.value.page = page
  loadHistory()
}

const refreshHistory = () => {
  loadHistory()
}

const exportHistory = () => {
  // Implementation for exporting history
  console.log('Exporting approval history...')
}

// Lifecycle
onMounted(() => {
  loadHistory()
})

// Watch for filter changes
watch(filters, () => {
  pagination.value.page = 1
  loadHistory()
}, { deep: true })
</script>

<style scoped>
.transition-colors {
  transition: background-color 0.2s ease-in-out;
}
</style>

