<template>
  <div class="report-list">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Reports</h2>
      <button @click="showCreateModal = true" class="btn-primary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        Create Report
      </button>
    </div>
    
    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select v-model="filters.status" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select v-model="filters.type" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Types</option>
          <option value="Status Report">Status Report</option>
          <option value="Financial Report">Financial Report</option>
          <option value="Progress Report">Progress Report</option>
          <option value="Risk Report">Risk Report</option>
          <option value="Quality Report">Quality Report</option>
        </select>
        <select v-model="filters.project" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Projects</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.project_name }}
          </option>
        </select>
        <button @click="loadReports" class="btn-secondary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
          Filter
        </button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <!-- Reports Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="reports.length === 0" class="col-span-full text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No reports</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new report.</p>
        <div class="mt-6">
          <button @click="showCreateModal = true" class="btn-primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Create Report
          </button>
        </div>
      </div>
      
      <!-- Report Cards -->
      <div v-for="report in reports" :key="report.id" class="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-gray-900">{{ report.title }}</h3>
                <p class="text-sm text-gray-500">{{ report.type }}</p>
              </div>
            </div>
            <span :class="getStatusClass(report.status)" class="px-2 py-1 text-xs font-semibold rounded-full">
              {{ report.status }}
            </span>
          </div>
          
          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Project:</span>
              <span class="text-gray-900">{{ report.project?.project_name || 'N/A' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Created:</span>
              <span class="text-gray-900">{{ formatDate(report.created_at) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Due Date:</span>
              <span class="text-gray-900">{{ formatDate(report.due_date) }}</span>
            </div>
            <div v-if="report.submitted_at" class="flex justify-between text-sm">
              <span class="text-gray-500">Submitted:</span>
              <span class="text-gray-900">{{ formatDate(report.submitted_at) }}</span>
            </div>
          </div>
          
          <div v-if="report.description" class="mb-4">
            <p class="text-sm text-gray-600 line-clamp-2">{{ report.description }}</p>
          </div>
          
          <div class="flex justify-between items-center">
            <div class="flex space-x-2">
              <button @click="viewReport(report)" class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                View
              </button>
              <button @click="editReport(report)" class="text-green-600 hover:text-green-900 text-sm font-medium">
                Edit
              </button>
              <button v-if="report.status === 'Draft'" @click="submitReport(report)" class="text-blue-600 hover:text-blue-900 text-sm font-medium">
                Submit
              </button>
            </div>
            <button @click="deleteReport(report)" class="text-red-600 hover:text-red-900 text-sm font-medium">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="mt-8 flex justify-center">
      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
        <button 
          @click="previousPage" 
          :disabled="pagination.page === 1"
          class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button 
          v-for="page in visiblePages" 
          :key="page"
          @click="goToPage(page)"
          :class="page === pagination.page ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'"
          class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
        >
          {{ page }}
        </button>
        <button 
          @click="nextPage" 
          :disabled="pagination.page === pagination.totalPages"
          class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </nav>
    </div>
    
    <!-- Create/Edit Modal -->
    <ReportModal 
      v-if="showCreateModal || showEditModal"
      :report="selectedReport"
      :projects="projects"
      @close="closeModal"
      @saved="handleReportSaved"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import ReportModal from './ReportModal.vue';
import { reportService } from '@/services/reportService';
import { projectService } from '@/services/projectService';

export default {
  name: 'ReportList',
  components: {
    ReportModal
  },
  props: {
    projectId: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const toast = useToast();
    
    // Reactive data
    const reports = ref([]);
    const projects = ref([]);
    const loading = ref(false);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const selectedReport = ref(null);
    
    const filters = reactive({
      status: '',
      type: '',
      project: props.projectId || ''
    });
    
    const pagination = reactive({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    });
    
    // Computed properties
    const visiblePages = computed(() => {
      const pages = [];
      const start = Math.max(1, pagination.page - 2);
      const end = Math.min(pagination.totalPages, pagination.page + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    });
    
    // Methods
    const loadReports = async () => {
      try {
        loading.value = true;
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        };
        
        const response = await reportService.getReports(params);
        reports.value = response.reports;
        pagination.total = response.pagination.total;
        pagination.totalPages = response.pagination.totalPages;
      } catch (error) {
        console.error('Error loading reports:', error);
        toast.error('Failed to load reports');
      } finally {
        loading.value = false;
      }
    };
    
    const loadProjects = async () => {
      try {
        const response = await projectService.getProjects({ limit: 1000 });
        projects.value = response.projects;
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-CA');
    };
    
    const getStatusClass = (status) => {
      const classes = {
        'Draft': 'bg-gray-100 text-gray-800',
        'Submitted': 'bg-blue-100 text-blue-800',
        'Approved': 'bg-green-100 text-green-800',
        'Rejected': 'bg-red-100 text-red-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    };
    
    const viewReport = (report) => {
      // Navigate to report detail view
      console.log('View report:', report);
    };
    
    const editReport = (report) => {
      selectedReport.value = { ...report };
      showEditModal.value = true;
    };
    
    const submitReport = async (report) => {
      if (!confirm(`Are you sure you want to submit "${report.title}"?`)) {
        return;
      }
      
      try {
        await reportService.submitReport(report.id);
        toast.success('Report submitted successfully');
        loadReports();
      } catch (error) {
        console.error('Error submitting report:', error);
        toast.error('Failed to submit report');
      }
    };
    
    const deleteReport = async (report) => {
      if (!confirm(`Are you sure you want to delete "${report.title}"?`)) {
        return;
      }
      
      try {
        await reportService.deleteReport(report.id);
        toast.success('Report deleted successfully');
        loadReports();
      } catch (error) {
        console.error('Error deleting report:', error);
        toast.error('Failed to delete report');
      }
    };
    
    const closeModal = () => {
      showCreateModal.value = false;
      showEditModal.value = false;
      selectedReport.value = null;
    };
    
    const handleReportSaved = () => {
      closeModal();
      loadReports();
      toast.success('Report saved successfully');
    };
    
    const previousPage = () => {
      if (pagination.page > 1) {
        pagination.page--;
        loadReports();
      }
    };
    
    const nextPage = () => {
      if (pagination.page < pagination.totalPages) {
        pagination.page++;
        loadReports();
      }
    };
    
    const goToPage = (page) => {
      pagination.page = page;
      loadReports();
    };
    
    // Lifecycle
    onMounted(() => {
      loadReports();
      loadProjects();
    });
    
    return {
      reports,
      projects,
      loading,
      showCreateModal,
      showEditModal,
      selectedReport,
      filters,
      pagination,
      visiblePages,
      loadReports,
      formatDate,
      getStatusClass,
      viewReport,
      editReport,
      submitReport,
      deleteReport,
      closeModal,
      handleReportSaved,
      previousPage,
      nextPage,
      goToPage
    };
  }
};
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}

.btn-secondary {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

