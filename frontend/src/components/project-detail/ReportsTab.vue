<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Project Reports & Documents</h3>
        <p class="text-sm text-gray-600">Generate reports and manage project documentation</p>
      </div>
      <div class="flex items-center space-x-2">
        <Button 
          v-if="canEdit" 
          @click="showUploadDialog = true"
          variant="outline"
        >
          <Upload class="h-4 w-4 mr-2" />
          Upload Document
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <FileText class="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="generateReport('project-summary')">
              <FileText class="h-4 w-4 mr-2" />
              Project Summary
            </DropdownMenuItem>
            <DropdownMenuItem @click="generateReport('budget-report')">
              <DollarSign class="h-4 w-4 mr-2" />
              Budget Report
            </DropdownMenuItem>
            <DropdownMenuItem @click="generateReport('milestone-report')">
              <Calendar class="h-4 w-4 mr-2" />
              Milestone Report
            </DropdownMenuItem>
            <DropdownMenuItem @click="generateReport('vendor-report')">
              <Users class="h-4 w-4 mr-2" />
              Vendor Report
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="generateReport('full-report')">
              <FileSpreadsheet class="h-4 w-4 mr-2" />
              Complete Project Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Report Generation Status -->
    <Card v-if="generatingReport">
      <CardContent class="p-4">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div>
            <p class="text-sm font-medium">Generating {{ currentReportType }} report...</p>
            <p class="text-xs text-gray-500">This may take a few moments</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Quick Reports -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="generateReport('project-summary')">
        <CardContent class="p-4 text-center">
          <FileText class="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h4 class="text-sm font-medium">Project Summary</h4>
          <p class="text-xs text-gray-500 mt-1">Overview and key metrics</p>
        </CardContent>
      </Card>

      <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="generateReport('budget-report')">
        <CardContent class="p-4 text-center">
          <DollarSign class="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h4 class="text-sm font-medium">Budget Report</h4>
          <p class="text-xs text-gray-500 mt-1">Financial breakdown and spending</p>
        </CardContent>
      </Card>

      <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="generateReport('milestone-report')">
        <CardContent class="p-4 text-center">
          <Calendar class="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h4 class="text-sm font-medium">Milestone Report</h4>
          <p class="text-xs text-gray-500 mt-1">Progress and timeline status</p>
        </CardContent>
      </Card>

      <Card class="cursor-pointer hover:shadow-md transition-shadow" @click="generateReport('vendor-report')">
        <CardContent class="p-4 text-center">
          <Users class="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <h4 class="text-sm font-medium">Vendor Report</h4>
          <p class="text-xs text-gray-500 mt-1">Contractor and vendor details</p>
        </CardContent>
      </Card>
    </div>

    <!-- Document Categories -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Project Documents -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>Project Documents</span>
            <Badge variant="secondary">{{ projectDocuments.length }}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="projectDocuments.length === 0" class="text-center py-6">
            <FileText class="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-500">No project documents uploaded</p>
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="doc in projectDocuments.slice(0, 5)" 
              :key="doc.id"
              class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
            >
              <component :is="getFileIcon(doc.type)" class="h-5 w-5 text-gray-500" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ doc.filename }}</p>
                <p class="text-xs text-gray-500">{{ formatFileSize(doc.size) }} • {{ formatDate(doc.uploaded_at) }}</p>
              </div>
              <Button variant="ghost" size="sm" @click="downloadDocument(doc)">
                <Download class="h-4 w-4" />
              </Button>
            </div>
            <Button v-if="projectDocuments.length > 5" variant="outline" size="sm" class="w-full">
              View All Documents ({{ projectDocuments.length }})
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Generated Reports -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>Generated Reports</span>
            <Badge variant="secondary">{{ generatedReports.length }}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="generatedReports.length === 0" class="text-center py-6">
            <FileSpreadsheet class="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-500">No reports generated yet</p>
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="report in generatedReports.slice(0, 5)" 
              :key="report.id"
              class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
            >
              <FileSpreadsheet class="h-5 w-5 text-blue-500" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">{{ report.title }}</p>
                <p class="text-xs text-gray-500">Generated {{ formatDate(report.created_at) }}</p>
              </div>
              <div class="flex items-center space-x-1">
                <Button variant="ghost" size="sm" @click="viewReport(report)">
                  <Eye class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="downloadReport(report)">
                  <Download class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button v-if="generatedReports.length > 5" variant="outline" size="sm" class="w-full">
              View All Reports ({{ generatedReports.length }})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Document Management -->
    <Card>
      <CardHeader>
        <CardTitle>All Documents</CardTitle>
        <CardDescription>
          Manage all project documents and reports in one place
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Document Filters -->
        <div class="flex items-center space-x-4 mb-4">
          <Select v-model="documentFilter">
            <SelectTrigger class="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="project">Project Documents</SelectItem>
              <SelectItem value="reports">Generated Reports</SelectItem>
              <SelectItem value="contracts">Contracts</SelectItem>
              <SelectItem value="drawings">Drawings</SelectItem>
              <SelectItem value="specifications">Specifications</SelectItem>
            </SelectContent>
          </Select>
          
          <div class="flex-1">
            <Input 
              v-model="searchQuery" 
              placeholder="Search documents..." 
              class="max-w-sm"
            />
          </div>
        </div>

        <!-- Documents Table -->
        <div class="border rounded-lg">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="doc in filteredDocuments" :key="doc.id" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="flex items-center space-x-2">
                    <component :is="getFileIcon(doc.type)" class="h-4 w-4 text-gray-500" />
                    <span class="text-sm font-medium">{{ doc.filename }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <Badge variant="outline">{{ doc.category || 'Document' }}</Badge>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ formatFileSize(doc.size) }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(doc.uploaded_at) }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" @click="viewDocument(doc)">
                      <Eye class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" @click="downloadDocument(doc)">
                      <Download class="h-4 w-4" />
                    </Button>
                    <Button 
                      v-if="canEdit" 
                      variant="ghost" 
                      size="sm" 
                      @click="deleteDocument(doc)"
                      class="text-red-600 hover:text-red-700"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Upload Document Dialog -->
    <Dialog v-model:open="showUploadDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document to this project.
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="uploadDocument" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Document Category</label>
            <Select v-model="uploadForm.category" required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project Document</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="drawing">Drawing</SelectItem>
                <SelectItem value="specification">Specification</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">File</label>
            <Input 
              type="file" 
              @change="handleFileSelect"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
              required
            />
            <p class="text-xs text-gray-500 mt-1">
              Supported formats: PDF, Word, Excel, PowerPoint, Text, Images
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <Textarea 
              v-model="uploadForm.description" 
              rows="2"
              placeholder="Brief description of the document..."
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" @click="showUploadDialog = false">
            Cancel
          </Button>
          <Button @click="uploadDocument" :disabled="!uploadForm.file">
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Upload, 
  FileText, 
  DollarSign, 
  Calendar, 
  Users,
  FileSpreadsheet,
  Download,
  Eye,
  Trash2
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFormat } from '@/composables/useFormat'

interface Document {
  id: string
  filename: string
  type: string
  category: string
  size: number
  uploaded_at: string
  uploaded_by: string
  url: string
}

interface Report {
  id: string
  title: string
  type: string
  created_at: string
  url: string
}

interface Props {
  projectId: string
  canEdit: boolean
  userRole: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'document-uploaded': [document: Document]
  'document-deleted': [documentId: string]
  'report-generated': [report: Report]
}>()

const { formatDate, formatFileSize } = useFormat()

// Local state
const showUploadDialog = ref(false)
const generatingReport = ref(false)
const currentReportType = ref('')
const documentFilter = ref('all')
const searchQuery = ref('')

const uploadForm = ref({
  category: '',
  file: null as File | null,
  description: ''
})

// Mock data - replace with actual API calls
const projectDocuments = ref<Document[]>([
  {
    id: '1',
    filename: 'Project Charter.pdf',
    type: 'pdf',
    category: 'project',
    size: 2048576,
    uploaded_at: '2024-01-15T10:00:00Z',
    uploaded_by: 'John Smith',
    url: '/documents/project-charter.pdf'
  },
  {
    id: '2',
    filename: 'Architectural Drawings.dwg',
    type: 'dwg',
    category: 'drawing',
    size: 15728640,
    uploaded_at: '2024-01-20T14:30:00Z',
    uploaded_by: 'Sarah Johnson',
    url: '/documents/architectural-drawings.dwg'
  }
])

const generatedReports = ref<Report[]>([
  {
    id: '1',
    title: 'Monthly Progress Report - January 2024',
    type: 'progress',
    created_at: '2024-01-31T16:00:00Z',
    url: '/reports/progress-jan-2024.pdf'
  }
])

// Computed
const allDocuments = computed(() => [
  ...projectDocuments.value,
  ...generatedReports.value.map(report => ({
    id: report.id,
    filename: report.title + '.pdf',
    type: 'pdf',
    category: 'reports',
    size: 1024000,
    uploaded_at: report.created_at,
    uploaded_by: 'System',
    url: report.url
  }))
])

const filteredDocuments = computed(() => {
  let docs = allDocuments.value

  if (documentFilter.value !== 'all') {
    docs = docs.filter(doc => doc.category === documentFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    docs = docs.filter(doc => 
      doc.filename.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query)
    )
  }

  return docs
})

// Methods
const generateReport = async (reportType: string) => {
  generatingReport.value = true
  currentReportType.value = reportType

  try {
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const report: Report = {
      id: Date.now().toString(),
      title: `${reportType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${new Date().toLocaleDateString()}`,
      type: reportType,
      created_at: new Date().toISOString(),
      url: `/reports/${reportType}-${Date.now()}.pdf`
    }

    generatedReports.value.unshift(report)
    emit('report-generated', report)
  } catch (error) {
    console.error('Error generating report:', error)
  } finally {
    generatingReport.value = false
    currentReportType.value = ''
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    uploadForm.value.file = target.files[0]
  }
}

const uploadDocument = async () => {
  if (!uploadForm.value.file || !uploadForm.value.category) return

  const document: Document = {
    id: Date.now().toString(),
    filename: uploadForm.value.file.name,
    type: uploadForm.value.file.name.split('.').pop() || 'unknown',
    category: uploadForm.value.category,
    size: uploadForm.value.file.size,
    uploaded_at: new Date().toISOString(),
    uploaded_by: 'Current User',
    url: `/documents/${uploadForm.value.file.name}`
  }

  projectDocuments.value.unshift(document)
  
  showUploadDialog.value = false
  uploadForm.value = {
    category: '',
    file: null,
    description: ''
  }

  emit('document-uploaded', document)
}

const viewDocument = (doc: Document) => {
  window.open(doc.url, '_blank')
}

const downloadDocument = (doc: Document) => {
  const link = document.createElement('a')
  link.href = doc.url
  link.download = doc.filename
  link.click()
}

const deleteDocument = async (doc: Document) => {
  if (confirm(`Are you sure you want to delete ${doc.filename}?`)) {
    projectDocuments.value = projectDocuments.value.filter(d => d.id !== doc.id)
    emit('document-deleted', doc.id)
  }
}

const viewReport = (report: Report) => {
  window.open(report.url, '_blank')
}

const downloadReport = (report: Report) => {
  const link = document.createElement('a')
  link.href = report.url
  link.download = report.title + '.pdf'
  link.click()
}

const getFileIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    'pdf': FileText,
    'doc': FileText,
    'docx': FileText,
    'xls': FileSpreadsheet,
    'xlsx': FileSpreadsheet,
    'ppt': FileText,
    'pptx': FileText,
    'txt': FileText,
    'dwg': FileText,
    'jpg': FileText,
    'jpeg': FileText,
    'png': FileText
  }
  return iconMap[type] || FileText
}

onMounted(() => {
  // Load documents and reports
})
</script>

