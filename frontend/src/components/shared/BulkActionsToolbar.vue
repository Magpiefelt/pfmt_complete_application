<template>
  <div class="bulk-actions-toolbar">
    <!-- Selection Summary -->
    <div v-if="selectedItems.length > 0" 
         class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="flex items-center">
            <CheckSquare class="h-5 w-5 text-blue-600 mr-2" />
            <span class="text-sm font-medium text-blue-900">
              {{ selectedItems.length }} {{ entityType }}{{ selectedItems.length > 1 ? 's' : '' }} selected
            </span>
          </div>
          <button @click="clearSelection" 
                  class="text-sm text-blue-600 hover:text-blue-800 underline">
            Clear selection
          </button>
        </div>
        
        <div class="flex items-center space-x-2">
          <!-- Bulk Status Update -->
          <div class="relative" v-if="allowStatusUpdate">
            <select v-model="selectedStatus" 
                    @change="handleStatusUpdate"
                    class="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md">
              <option value="">Change Status...</option>
              <option v-for="status in availableStatuses" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </div>

          <!-- Bulk Archive -->
          <button v-if="allowArchive" 
                  @click="handleBulkArchive(true)"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Archive class="h-4 w-4 mr-2" />
            Archive
          </button>

          <!-- Bulk Unarchive -->
          <button v-if="allowUnarchive" 
                  @click="handleBulkArchive(false)"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <ArchiveRestore class="h-4 w-4 mr-2" />
            Unarchive
          </button>

          <!-- Bulk Export -->
          <button v-if="allowExport" 
                  @click="handleBulkExport"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Download class="h-4 w-4 mr-2" />
            Export Selected
          </button>

          <!-- Custom Actions Slot -->
          <slot name="custom-actions" :selectedItems="selectedItems"></slot>
        </div>
      </div>

      <!-- Progress Bar for Bulk Operations -->
      <div v-if="bulkOperationInProgress" class="mt-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-blue-600">{{ bulkOperationStatus }}</span>
          <span class="text-xs text-blue-600">{{ bulkProgress }}%</span>
        </div>
        <div class="w-full bg-blue-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300"
               :style="{ width: bulkProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <Modal v-if="showConfirmModal" @close="showConfirmModal = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900">
          {{ confirmModalTitle }}
        </h3>
      </template>
      
      <template #body>
        <div class="mt-2">
          <p class="text-sm text-gray-500">
            {{ confirmModalMessage }}
          </p>
          
          <div v-if="pendingOperation === 'status_update'" class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              New Status:
            </label>
            <div class="text-sm font-semibold text-blue-600">
              {{ selectedStatus }}
            </div>
          </div>
          
          <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div class="flex">
              <AlertTriangle class="h-5 w-5 text-yellow-400 mr-2" />
              <div class="text-sm text-yellow-700">
                This action cannot be undone. Please confirm you want to proceed.
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <template #footer>
        <div class="flex justify-end space-x-3">
          <button @click="showConfirmModal = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Cancel
          </button>
          <button @click="confirmBulkOperation"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Confirm
          </button>
        </div>
      </template>
    </Modal>

    <!-- Results Modal -->
    <Modal v-if="showResultsModal" @close="showResultsModal = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900">
          Bulk Operation Results
        </h3>
      </template>
      
      <template #body>
        <div class="mt-2">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="flex items-center">
                <CheckCircle class="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p class="text-sm font-medium text-green-900">Successful</p>
                  <p class="text-lg font-bold text-green-900">{{ bulkResults.successCount }}</p>
                </div>
              </div>
            </div>
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-3">
              <div class="flex items-center">
                <XCircle class="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <p class="text-sm font-medium text-red-900">Failed</p>
                  <p class="text-lg font-bold text-red-900">{{ bulkResults.failureCount }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="bulkResults.errors && bulkResults.errors.length > 0" class="mt-4">
            <h4 class="text-sm font-medium text-gray-900 mb-2">Errors:</h4>
            <div class="max-h-32 overflow-y-auto">
              <div v-for="error in bulkResults.errors" :key="error.entityId" 
                   class="text-sm text-red-600 mb-1">
                ID {{ error.entityId }}: {{ error.error }}
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <template #footer>
        <div class="flex justify-end">
          <button @click="showResultsModal = false"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Close
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { 
  CheckSquare, 
  Archive, 
  ArchiveRestore, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  XCircle 
} from 'lucide-vue-next'
import Modal from './Modal.vue'

export default {
  name: 'BulkActionsToolbar',
  components: {
    CheckSquare,
    Archive,
    ArchiveRestore,
    Download,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Modal
  },
  props: {
    selectedItems: {
      type: Array,
      required: true
    },
    entityType: {
      type: String,
      required: true
    },
    allowStatusUpdate: {
      type: Boolean,
      default: true
    },
    allowArchive: {
      type: Boolean,
      default: true
    },
    allowUnarchive: {
      type: Boolean,
      default: false
    },
    allowExport: {
      type: Boolean,
      default: true
    },
    availableStatuses: {
      type: Array,
      default: () => ['Active', 'Inactive', 'On Hold', 'Completed']
    }
  },
  emits: ['clear-selection', 'bulk-operation-complete'],
  setup(props, { emit }) {
    const selectedStatus = ref('')
    const showConfirmModal = ref(false)
    const showResultsModal = ref(false)
    const pendingOperation = ref('')
    const pendingData = ref({})
    const bulkOperationInProgress = ref(false)
    const bulkOperationStatus = ref('')
    const bulkProgress = ref(0)
    const bulkResults = ref({})

    const confirmModalTitle = computed(() => {
      switch (pendingOperation.value) {
        case 'archive':
          return 'Archive Items'
        case 'unarchive':
          return 'Unarchive Items'
        case 'status_update':
          return 'Update Status'
        case 'export':
          return 'Export Items'
        default:
          return 'Confirm Action'
      }
    })

    const confirmModalMessage = computed(() => {
      const count = props.selectedItems.length
      const entityName = props.entityType
      
      switch (pendingOperation.value) {
        case 'archive':
          return `Are you sure you want to archive ${count} ${entityName}${count > 1 ? 's' : ''}? Archived items will be hidden from the main view.`
        case 'unarchive':
          return `Are you sure you want to unarchive ${count} ${entityName}${count > 1 ? 's' : ''}? Items will be restored to the main view.`
        case 'status_update':
          return `Are you sure you want to update the status of ${count} ${entityName}${count > 1 ? 's' : ''} to "${selectedStatus.value}"?`
        case 'export':
          return `Are you sure you want to export ${count} ${entityName}${count > 1 ? 's' : ''} to CSV format?`
        default:
          return `Are you sure you want to perform this action on ${count} ${entityName}${count > 1 ? 's' : ''}?`
      }
    })

    const clearSelection = () => {
      emit('clear-selection')
    }

    const handleStatusUpdate = () => {
      if (!selectedStatus.value) return
      
      pendingOperation.value = 'status_update'
      pendingData.value = { newStatus: selectedStatus.value }
      showConfirmModal.value = true
    }

    const handleBulkArchive = (archive) => {
      pendingOperation.value = archive ? 'archive' : 'unarchive'
      pendingData.value = { archive }
      showConfirmModal.value = true
    }

    const handleBulkExport = () => {
      pendingOperation.value = 'export'
      pendingData.value = {}
      showConfirmModal.value = true
    }

    const confirmBulkOperation = async () => {
      showConfirmModal.value = false
      bulkOperationInProgress.value = true
      bulkProgress.value = 0
      
      try {
        let result
        
        switch (pendingOperation.value) {
          case 'archive':
          case 'unarchive':
            result = await performBulkArchive(pendingData.value.archive)
            break
          case 'status_update':
            result = await performBulkStatusUpdate(pendingData.value.newStatus)
            break
          case 'export':
            result = await performBulkExport()
            break
        }
        
        if (result) {
          bulkResults.value = result
          showResultsModal.value = true
          emit('bulk-operation-complete', {
            operation: pendingOperation.value,
            results: result
          })
        }
        
      } catch (error) {
        console.error('Bulk operation failed:', error)
        bulkResults.value = {
          successCount: 0,
          failureCount: props.selectedItems.length,
          errors: [{ entityId: 'all', error: error.message }]
        }
        showResultsModal.value = true
      } finally {
        bulkOperationInProgress.value = false
        bulkProgress.value = 0
        selectedStatus.value = ''
        pendingOperation.value = ''
        pendingData.value = {}
      }
    }

    const performBulkArchive = async (archive) => {
      bulkOperationStatus.value = archive ? 'Archiving items...' : 'Unarchiving items...'
      
      const response = await fetch('/api/phase3-4/bulk/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entityType: props.entityType,
          entityIds: props.selectedItems,
          archive
        })
      })

      if (!response.ok) {
        throw new Error('Failed to perform bulk archive operation')
      }

      const result = await response.json()
      bulkProgress.value = 100
      
      return result.data
    }

    const performBulkStatusUpdate = async (newStatus) => {
      bulkOperationStatus.value = 'Updating status...'
      
      const response = await fetch('/api/phase3-4/bulk/status-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entityType: props.entityType,
          entityIds: props.selectedItems,
          newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to perform bulk status update')
      }

      const result = await response.json()
      bulkProgress.value = 100
      
      return result.data
    }

    const performBulkExport = async () => {
      bulkOperationStatus.value = 'Exporting data...'
      
      const response = await fetch('/api/phase3-4/export/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entityType: props.entityType,
          filters: { entityIds: props.selectedItems }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${props.entityType}_bulk_export.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      bulkProgress.value = 100
      
      return {
        successCount: props.selectedItems.length,
        failureCount: 0,
        errors: []
      }
    }

    return {
      selectedStatus,
      showConfirmModal,
      showResultsModal,
      pendingOperation,
      bulkOperationInProgress,
      bulkOperationStatus,
      bulkProgress,
      bulkResults,
      confirmModalTitle,
      confirmModalMessage,
      clearSelection,
      handleStatusUpdate,
      handleBulkArchive,
      handleBulkExport,
      confirmBulkOperation
    }
  }
}
</script>

<style scoped>
.bulk-actions-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>

