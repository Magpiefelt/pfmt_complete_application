<template>
  <div class="space-y-6">
    <!-- Reports Overview -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <FileText class="h-5 w-5" />
          Project Reports & Documentation
        </CardTitle>
        <CardContent class="text-sm text-gray-600">
          View and manage project reports, documents, and compliance materials
        </CardContent>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="flex items-center">
              <FileText class="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p class="text-sm font-medium text-blue-900">Total Reports</p>
                <p class="text-2xl font-bold text-blue-900">{{ reports.length }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-green-50 rounded-lg p-4">
            <div class="flex items-center">
              <CheckCircle class="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p class="text-sm font-medium text-green-900">Current Reports</p>
                <p class="text-2xl font-bold text-green-900">{{ currentReports.length }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-red-50 rounded-lg p-4">
            <div class="flex items-center">
              <AlertCircle class="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p class="text-sm font-medium text-red-900">Overdue Reports</p>
                <p class="text-2xl font-bold text-red-900">{{ overdueReports.length }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Reports List -->
        <div class="space-y-4">
          <div v-for="report in reports" :key="report.id"
               class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h3 class="text-lg font-medium text-gray-900">{{ report.title }}</h3>
                  <Badge :class="getReportStatusColor(report.status)">
                    {{ report.status }}
                  </Badge>
                  <Badge variant="outline">
                    {{ report.type }}
                  </Badge>
                </div>
                
                <p class="text-sm text-gray-600 mb-3">{{ report.description }}</p>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span class="font-medium text-gray-700">Due Date:</span>
                    <span class="ml-2 text-gray-900">{{ formatDate(report.dueDate) }}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700">Last Updated:</span>
                    <span class="ml-2 text-gray-900">{{ formatDate(report.lastUpdated) }}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700">Prepared By:</span>
                    <span class="ml-2 text-gray-900">{{ report.preparedBy }}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700">Version:</span>
                    <span class="ml-2 text-gray-900">{{ report.version }}</span>
                  </div>
                </div>
              </div>
              
              <div class="ml-4 flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download class="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Eye class="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="reports.length === 0" class="text-center py-8">
            <FileText class="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Reports Available</h3>
            <p class="text-gray-600">Project reports and documentation will appear here</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Report Categories -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Financial Reports -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <DollarSign class="h-5 w-5" />
            Financial Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div v-for="report in financialReports" :key="report.id"
                 class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">{{ report.title }}</p>
                <p class="text-sm text-gray-600">{{ formatDate(report.lastUpdated) }}</p>
              </div>
              <Badge :class="getReportStatusColor(report.status)">
                {{ report.status }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Progress Reports -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <TrendingUp class="h-5 w-5" />
            Progress Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div v-for="report in progressReports" :key="report.id"
                 class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">{{ report.title }}</p>
                <p class="text-sm text-gray-600">{{ formatDate(report.lastUpdated) }}</p>
              </div>
              <Badge :class="getReportStatusColor(report.status)">
                {{ report.status }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Compliance & Documentation -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Shield class="h-5 w-5" />
          Compliance & Documentation
        </CardTitle>
        <CardContent class="text-sm text-gray-600">
          Regulatory compliance documents and certifications
        </CardContent>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="doc in complianceDocuments" :key="doc.id"
               class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center space-x-3 mb-2">
              <component :is="getDocumentIcon(doc.type)" class="h-5 w-5 text-gray-600" />
              <h4 class="font-medium text-gray-900">{{ doc.title }}</h4>
            </div>
            <p class="text-sm text-gray-600 mb-2">{{ doc.description }}</p>
            <div class="flex items-center justify-between">
              <Badge :class="getDocumentStatusColor(doc.status)">
                {{ doc.status }}
              </Badge>
              <span class="text-xs text-gray-500">{{ formatDate(doc.expiryDate) }}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  Shield,
  Award,
  FileCheck,
  AlertTriangle
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui/Button.vue'
import { Badge } from '@/components/ui/Badge.vue'
import { formatDate } from '@/utils'

interface Props {
  project: any
}

const props = defineProps<Props>()

// Sample reports data
const reports = ref([
  {
    id: 1,
    title: 'Monthly Progress Report - January 2024',
    description: 'Comprehensive progress update including milestones, budget status, and upcoming activities',
    type: 'Progress Report',
    status: 'Current',
    dueDate: '2024-02-05',
    lastUpdated: '2024-02-03',
    preparedBy: 'John Smith',
    version: '1.2'
  },
  {
    id: 2,
    title: 'Financial Status Report Q1 2024',
    description: 'Quarterly financial analysis including budget utilization and forecasting',
    type: 'Financial Report',
    status: 'Current',
    dueDate: '2024-04-15',
    lastUpdated: '2024-04-10',
    preparedBy: 'Sarah Johnson',
    version: '2.0'
  },
  {
    id: 3,
    title: 'Risk Assessment Update',
    description: 'Updated risk register and mitigation strategies for identified project risks',
    type: 'Risk Report',
    status: 'Overdue',
    dueDate: '2024-03-20',
    lastUpdated: '2024-03-15',
    preparedBy: 'Mike Wilson',
    version: '1.1'
  },
  {
    id: 4,
    title: 'Environmental Compliance Report',
    description: 'Environmental impact assessment and compliance verification',
    type: 'Compliance Report',
    status: 'Current',
    dueDate: '2024-05-01',
    lastUpdated: '2024-04-28',
    preparedBy: 'Environmental Consultant',
    version: '1.0'
  }
])

const complianceDocuments = ref([
  {
    id: 1,
    title: 'Building Permit',
    description: 'Municipal building permit for construction activities',
    type: 'permit',
    status: 'Valid',
    expiryDate: '2024-12-31'
  },
  {
    id: 2,
    title: 'Environmental Assessment',
    description: 'Environmental impact assessment approval',
    type: 'assessment',
    status: 'Valid',
    expiryDate: '2025-06-30'
  },
  {
    id: 3,
    title: 'Safety Certification',
    description: 'Workplace safety compliance certification',
    type: 'certification',
    status: 'Expiring Soon',
    expiryDate: '2024-08-15'
  },
  {
    id: 4,
    title: 'Insurance Certificate',
    description: 'Project liability insurance certificate',
    type: 'insurance',
    status: 'Valid',
    expiryDate: '2024-12-31'
  }
])

const currentReports = computed(() => 
  reports.value.filter(r => r.status === 'Current')
)

const overdueReports = computed(() => 
  reports.value.filter(r => r.status === 'Overdue')
)

const financialReports = computed(() => 
  reports.value.filter(r => r.type === 'Financial Report')
)

const progressReports = computed(() => 
  reports.value.filter(r => r.type === 'Progress Report')
)

const getReportStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Current': 'bg-green-100 text-green-800',
    'Overdue': 'bg-red-100 text-red-800',
    'Draft': 'bg-yellow-100 text-yellow-800',
    'Under Review': 'bg-blue-100 text-blue-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getDocumentStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Valid': 'bg-green-100 text-green-800',
    'Expiring Soon': 'bg-yellow-100 text-yellow-800',
    'Expired': 'bg-red-100 text-red-800',
    'Pending': 'bg-blue-100 text-blue-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getDocumentIcon = (type: string) => {
  const icons: Record<string, any> = {
    'permit': FileCheck,
    'assessment': Shield,
    'certification': Award,
    'insurance': AlertTriangle
  }
  return icons[type] || FileText
}
</script>

