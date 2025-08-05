<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
          Vendor Performance Tracker
        </AlbertaText>
        <AlbertaText variant="body-s" color="secondary">
          Monitor and evaluate vendor performance across projects
        </AlbertaText>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="exportPerformanceData">
          <Download class="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button @click="showAddReviewDialog = true">
          <Plus class="w-4 h-4 mr-2" />
          Add Review
        </Button>
      </div>
    </div>

    <!-- Performance Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Total Vendors
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold">
              {{ performanceOverview.totalVendors }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Average Rating
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold">
              {{ performanceOverview.averageRating.toFixed(1) }}/5.0
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Top Performers
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold text-green-600">
              {{ performanceOverview.topPerformers }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-center">
            <AlbertaText variant="body-s" color="secondary" class="mb-1">
              Reviews This Month
            </AlbertaText>
            <AlbertaText variant="heading-s" color="primary" class="font-bold">
              {{ performanceOverview.reviewsThisMonth }}
            </AlbertaText>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select
              v-model="filters.vendorId"
              @change="loadVendorPerformance"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Vendors</option>
              <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
                {{ vendor.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
            <select
              v-model="filters.minRating"
              @change="loadVendorPerformance"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="3.0">3.0+ Stars</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              v-model="filters.projectId"
              @change="loadVendorPerformance"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Projects</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>
          <div class="flex items-end">
            <Button @click="refreshPerformanceData" class="w-full">
              <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Vendor Performance Cards -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
    <div v-else-if="vendorPerformanceData.length === 0" class="text-center py-8">
      <Star class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <AlbertaText variant="body-m" color="secondary">
        No vendor performance data found for the selected criteria.
      </AlbertaText>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card 
        v-for="vendor in vendorPerformanceData" 
        :key="vendor.id" 
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="viewVendorDetails(vendor)"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <CardTitle class="text-lg mb-1">{{ vendor.name }}</CardTitle>
              <div class="flex items-center space-x-2">
                <div class="flex items-center">
                  <Star class="w-4 h-4 text-yellow-400 fill-current" />
                  <span class="ml-1 font-semibold">{{ vendor.averageOverallRating.toFixed(1) }}</span>
                  <span class="text-gray-500 text-sm ml-1">({{ vendor.totalReviews }} reviews)</span>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getPerformanceClass(vendor.averageOverallRating)">
                  {{ getPerformanceLabel(vendor.averageOverallRating) }}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" @click.stop="viewVendorDetails(vendor)">
              <ExternalLink class="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- Performance Metrics -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Quality</span>
                  <span class="font-medium">{{ vendor.averageQualityRating.toFixed(1) }}/5</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    class="bg-blue-500 h-1.5 rounded-full"
                    :style="{ width: `${(vendor.averageQualityRating / 5) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Schedule</span>
                  <span class="font-medium">{{ vendor.averageScheduleRating.toFixed(1) }}/5</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    class="bg-green-500 h-1.5 rounded-full"
                    :style="{ width: `${(vendor.averageScheduleRating / 5) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Communication</span>
                  <span class="font-medium">{{ vendor.averageCommunicationRating.toFixed(1) }}/5</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    class="bg-purple-500 h-1.5 rounded-full"
                    :style="{ width: `${(vendor.averageCommunicationRating / 5) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Cost</span>
                  <span class="font-medium">{{ vendor.averageCostRating.toFixed(1) }}/5</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    class="bg-orange-500 h-1.5 rounded-full"
                    :style="{ width: `${(vendor.averageCostRating / 5) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Recent Projects -->
            <div v-if="vendor.projectHistory && vendor.projectHistory.length">
              <label class="block text-sm font-medium text-gray-700 mb-2">Recent Projects</label>
              <div class="space-y-1">
                <div v-for="project in vendor.projectHistory.slice(0, 2)" :key="project.id" 
                     class="text-sm text-gray-600">
                  <span class="font-medium">{{ project.project_name }}</span>
                  <span class="text-gray-400"> • {{ project.contract_name }}</span>
                </div>
              </div>
            </div>

            <!-- Latest Review -->
            <div v-if="vendor.recentReviews && vendor.recentReviews.length">
              <label class="block text-sm font-medium text-gray-700 mb-2">Latest Review</label>
              <div class="p-2 bg-gray-50 rounded text-xs">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium">{{ vendor.recentReviews[0].project_name }}</span>
                  <span class="text-gray-500">{{ formatDate(vendor.recentReviews[0].review_date) }}</span>
                </div>
                <p class="text-gray-600 line-clamp-2">
                  {{ vendor.recentReviews[0].review_notes || 'No notes provided' }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Add Review Dialog -->
    <Dialog v-model:open="showAddReviewDialog">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Vendor Performance Review</DialogTitle>
          <DialogDescription>
            Evaluate vendor performance for a specific project
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
            <select
              v-model="newReview.vendorId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Vendor</option>
              <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
                {{ vendor.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Project *</label>
            <select
              v-model="newReview.projectId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Project</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contract</label>
            <select
              v-model="newReview.contractId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Contract</option>
              <!-- Contract options would be loaded based on selected vendor/project -->
            </select>
          </div>

          <!-- Rating Fields -->
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Overall Rating *</label>
              <StarRating v-model="newReview.overallRating" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Quality Rating</label>
              <StarRating v-model="newReview.qualityRating" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Schedule Rating</label>
              <StarRating v-model="newReview.scheduleRating" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Communication Rating</label>
              <StarRating v-model="newReview.communicationRating" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cost Rating</label>
              <StarRating v-model="newReview.costRating" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
            <textarea
              v-model="newReview.reviewNotes"
              rows="4"
              placeholder="Detailed feedback about vendor performance..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddReviewDialog = false">
            Cancel
          </Button>
          <Button @click="addReview" :disabled="!isValidReview">
            Add Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Vendor Details Dialog -->
    <Dialog v-model:open="showVendorDetailsDialog">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{{ selectedVendor?.name }} - Performance Details</DialogTitle>
          <DialogDescription>
            Comprehensive vendor performance analysis
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedVendor" class="space-y-6">
          <!-- Performance Summary -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ selectedVendor.averageOverallRating.toFixed(1) }}</div>
              <div class="text-sm text-gray-600">Overall</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ selectedVendor.averageQualityRating.toFixed(1) }}</div>
              <div class="text-sm text-gray-600">Quality</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ selectedVendor.averageScheduleRating.toFixed(1) }}</div>
              <div class="text-sm text-gray-600">Schedule</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600">{{ selectedVendor.averageCommunicationRating.toFixed(1) }}</div>
              <div class="text-sm text-gray-600">Communication</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-red-600">{{ selectedVendor.averageCostRating.toFixed(1) }}</div>
              <div class="text-sm text-gray-600">Cost</div>
            </div>
          </div>

          <!-- Project History -->
          <div v-if="selectedVendor.projectHistory && selectedVendor.projectHistory.length">
            <h4 class="font-medium text-gray-900 mb-3">Project History</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="project in selectedVendor.projectHistory" :key="project.id">
                    <td class="px-4 py-2 text-sm text-gray-900">{{ project.project_name }}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">{{ project.contract_name }}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">${{ formatCurrency(project.current_value) }}</td>
                    <td class="px-4 py-2 text-sm">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="getContractStatusClass(project.status)">
                        {{ project.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recent Reviews -->
          <div v-if="selectedVendor.recentReviews && selectedVendor.recentReviews.length">
            <h4 class="font-medium text-gray-900 mb-3">Recent Reviews</h4>
            <div class="space-y-3">
              <div v-for="review in selectedVendor.recentReviews" :key="review.id" 
                   class="p-3 border border-gray-200 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center space-x-2">
                    <span class="font-medium">{{ review.project_name }}</span>
                    <div class="flex items-center">
                      <Star class="w-4 h-4 text-yellow-400 fill-current" />
                      <span class="ml-1 text-sm">{{ review.overall_rating }}</span>
                    </div>
                  </div>
                  <span class="text-sm text-gray-500">{{ formatDate(review.review_date) }}</span>
                </div>
                <p class="text-sm text-gray-600">{{ review.review_notes }}</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showVendorDetailsDialog = false">
            Close
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
  Download, 
  Plus, 
  RefreshCw,
  Star,
  ExternalLink
} from 'lucide-vue-next'
import StarRating from './StarRating.vue'

const props = defineProps({
  projectId: {
    type: String,
    required: false
  }
})

// Reactive data
const loading = ref(false)
const vendorPerformanceData = ref([])
const vendors = ref([])
const projects = ref([])

const showAddReviewDialog = ref(false)
const showVendorDetailsDialog = ref(false)
const selectedVendor = ref(null)

const performanceOverview = ref({
  totalVendors: 0,
  averageRating: 0,
  topPerformers: 0,
  reviewsThisMonth: 0
})

const filters = ref({
  vendorId: '',
  minRating: '',
  projectId: props.projectId || ''
})

const newReview = ref({
  vendorId: '',
  projectId: '',
  contractId: '',
  overallRating: 0,
  qualityRating: 0,
  scheduleRating: 0,
  communicationRating: 0,
  costRating: 0,
  reviewNotes: ''
})

// Computed properties
const isValidReview = computed(() => {
  return newReview.value.vendorId && 
         newReview.value.projectId && 
         newReview.value.overallRating > 0
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

const getPerformanceClass = (rating) => {
  if (rating >= 4.5) return 'bg-green-100 text-green-800'
  if (rating >= 4.0) return 'bg-blue-100 text-blue-800'
  if (rating >= 3.5) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const getPerformanceLabel = (rating) => {
  if (rating >= 4.5) return 'Excellent'
  if (rating >= 4.0) return 'Good'
  if (rating >= 3.5) return 'Average'
  return 'Needs Improvement'
}

const getContractStatusClass = (status) => {
  const classes = {
    'active': 'bg-green-100 text-green-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const loadVendorPerformance = async () => {
  try {
    loading.value = true
    
    // Mock data for demonstration
    const mockData = [
      {
        id: '1',
        name: 'BuildCorp Solutions',
        averageOverallRating: 4.2,
        averageQualityRating: 4.5,
        averageScheduleRating: 4.0,
        averageCommunicationRating: 4.0,
        averageCostRating: 4.2,
        totalReviews: 3,
        projectHistory: [
          {
            id: '1',
            project_name: 'Red Deer Justice Centre',
            contract_name: 'Main Construction',
            current_value: 15500000,
            status: 'active'
          }
        ],
        recentReviews: [
          {
            id: '1',
            project_name: 'Red Deer Justice Centre',
            overall_rating: 4.2,
            review_date: '2024-08-15',
            review_notes: 'BuildCorp has performed well on the Red Deer Justice Centre project. Quality of work is excellent, though there have been some minor schedule delays due to weather.'
          }
        ]
      },
      {
        id: '2',
        name: 'TechServ Inc.',
        averageOverallRating: 4.6,
        averageQualityRating: 4.8,
        averageScheduleRating: 4.5,
        averageCommunicationRating: 4.5,
        averageCostRating: 4.5,
        totalReviews: 2,
        projectHistory: [
          {
            id: '2',
            project_name: 'Red Deer Justice Centre',
            contract_name: 'IT Systems',
            current_value: 2200000,
            status: 'active'
          }
        ],
        recentReviews: [
          {
            id: '2',
            project_name: 'Red Deer Justice Centre',
            overall_rating: 4.6,
            review_date: '2024-08-20',
            review_notes: 'TechServ has exceeded expectations on the IT systems implementation. High quality work delivered on schedule with excellent communication throughout the project.'
          }
        ]
      }
    ]
    
    vendorPerformanceData.value = mockData
    
    // Update overview
    performanceOverview.value = {
      totalVendors: mockData.length,
      averageRating: mockData.reduce((sum, v) => sum + v.averageOverallRating, 0) / mockData.length,
      topPerformers: mockData.filter(v => v.averageOverallRating >= 4.5).length,
      reviewsThisMonth: 5
    }
  } catch (error) {
    console.error('Error loading vendor performance:', error)
  } finally {
    loading.value = false
  }
}

const loadVendors = async () => {
  try {
    // Mock vendors data
    vendors.value = [
      { id: '1', name: 'BuildCorp Solutions' },
      { id: '2', name: 'TechServ Inc.' },
      { id: '3', name: 'ConsultPro Ltd.' }
    ]
  } catch (error) {
    console.error('Error loading vendors:', error)
  }
}

const loadProjects = async () => {
  try {
    // Mock projects data
    projects.value = [
      { id: '1', name: 'Red Deer Justice Centre' },
      { id: '2', name: 'Calgary Courthouse Renovation' }
    ]
  } catch (error) {
    console.error('Error loading projects:', error)
  }
}

const addReview = async () => {
  try {
    
    showAddReviewDialog.value = false
    newReview.value = {
      vendorId: '',
      projectId: '',
      contractId: '',
      overallRating: 0,
      qualityRating: 0,
      scheduleRating: 0,
      communicationRating: 0,
      costRating: 0,
      reviewNotes: ''
    }
    
    await loadVendorPerformance()
  } catch (error) {
    console.error('Error adding review:', error)
  }
}

const viewVendorDetails = (vendor) => {
  selectedVendor.value = vendor
  showVendorDetailsDialog.value = true
}

const refreshPerformanceData = () => {
  loadVendorPerformance()
}

const exportPerformanceData = () => {
}

// Lifecycle
onMounted(() => {
  loadVendors()
  loadProjects()
  loadVendorPerformance()
})

// Watch for filter changes
watch(filters, () => {
  loadVendorPerformance()
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

