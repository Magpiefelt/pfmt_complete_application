<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p class="text-gray-600">Project performance and insights</p>
      </div>
      <div class="flex items-center gap-2">
        <Select v-model="timeRange" placeholder="Select time range">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </Select>
        <Button @click="refreshData" variant="outline" size="sm">
          <RefreshCw class="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Projects"
        :value="metrics.totalProjects"
        :change="metrics.projectsChange"
        icon="Building"
        color="blue"
      />
      <MetricCard
        title="Active Projects"
        :value="metrics.activeProjects"
        :change="metrics.activeChange"
        icon="CheckCircle"
        color="green"
      />
      <MetricCard
        title="Total Budget"
        :value="formatCurrency(metrics.totalBudget)"
        :change="metrics.budgetChange"
        icon="DollarSign"
        color="purple"
      />
      <MetricCard
        title="At Risk Projects"
        :value="metrics.atRiskProjects"
        :change="metrics.riskChange"
        icon="AlertTriangle"
        color="red"
      />
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Project Status Chart -->
      <Card>
        <CardHeader>
          <CardTitle>Project Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-64 flex items-center justify-center">
            <div class="text-gray-500">Chart placeholder - Project Status</div>
          </div>
        </CardContent>
      </Card>

      <!-- Budget Utilization Chart -->
      <Card>
        <CardHeader>
          <CardTitle>Budget Utilization Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-64 flex items-center justify-center">
            <div class="text-gray-500">Chart placeholder - Budget Trend</div>
          </div>
        </CardContent>
      </Card>

      <!-- Regional Distribution -->
      <Card>
        <CardHeader>
          <CardTitle>Projects by Region</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div v-for="region in regionalData" :key="region.name" class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <MapPin class="h-4 w-4 text-gray-500" />
                <span class="text-sm">{{ region.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full" 
                    :style="{ width: `${(region.count / maxRegionalCount) * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm font-medium">{{ region.count }}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Activity -->
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div v-for="activity in recentActivity" :key="activity.id" class="flex items-start gap-3">
              <div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div class="flex-1">
                <p class="text-sm">{{ activity.description }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(activity.timestamp) }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Performance Indicators -->
    <Card>
      <CardHeader>
        <CardTitle>Performance Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center p-4 border rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ performanceMetrics.onTime }}%</div>
            <div class="text-sm text-gray-600">On-Time Completion</div>
          </div>
          <div class="text-center p-4 border rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ performanceMetrics.onBudget }}%</div>
            <div class="text-sm text-gray-600">On-Budget Projects</div>
          </div>
          <div class="text-center p-4 border rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{{ performanceMetrics.satisfaction }}%</div>
            <div class="text-sm text-gray-600">Client Satisfaction</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RefreshCw, MapPin } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import Select from '@/components/ui/Select.vue'
import MetricCard from './MetricCard.vue'
import { formatCurrency, formatDate } from '@/utils'

// State
const timeRange = ref('30d')
const loading = ref(false)

// Mock data - replace with real data from API
const metrics = ref({
  totalProjects: 156,
  projectsChange: 12,
  activeProjects: 89,
  activeChange: 5,
  totalBudget: 45600000,
  budgetChange: 8,
  atRiskProjects: 12,
  riskChange: -3
})

const regionalData = ref([
  { name: 'North', count: 45 },
  { name: 'South', count: 38 },
  { name: 'East', count: 32 },
  { name: 'West', count: 28 },
  { name: 'Central', count: 13 }
])

const recentActivity = ref([
  { id: 1, description: 'Project Alpha completed milestone 3', timestamp: '2024-01-15T10:30:00Z' },
  { id: 2, description: 'Budget approved for Project Beta', timestamp: '2024-01-15T09:15:00Z' },
  { id: 3, description: 'New contractor assigned to Project Gamma', timestamp: '2024-01-14T16:45:00Z' },
  { id: 4, description: 'Risk assessment updated for Project Delta', timestamp: '2024-01-14T14:20:00Z' }
])

const performanceMetrics = ref({
  onTime: 87,
  onBudget: 92,
  satisfaction: 94
})

// Computed
const maxRegionalCount = computed(() => 
  Math.max(...regionalData.value.map(r => r.count))
)

// Methods
const refreshData = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
  } catch (error) {
    console.error('Failed to refresh analytics data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshData()
})
</script>

