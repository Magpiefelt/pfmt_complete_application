<template>
  <div class="gate-meeting-list">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Gate Meetings</h2>
      <button @click="showCreateModal = true" class="btn-primary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        Schedule Gate Meeting
      </button>
    </div>
    
    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <select v-model="filters.status" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Postponed">Postponed</option>
        </select>
        <select v-model="filters.gate_type" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Gate Types</option>
          <option value="Gate 0">Gate 0 - Concept</option>
          <option value="Gate 1">Gate 1 - Feasibility</option>
          <option value="Gate 2">Gate 2 - Definition</option>
          <option value="Gate 3">Gate 3 - Implementation</option>
          <option value="Gate 4">Gate 4 - Handover</option>
          <option value="Gate 5">Gate 5 - Benefits</option>
          <option value="Gate 6">Gate 6 - Closure</option>
        </select>
        <select v-model="filters.project" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Projects</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.project_name }}
          </option>
        </select>
        <input 
          v-model="filters.date_from" 
          type="date" 
          placeholder="From Date"
          class="form-input rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        <button @click="loadGateMeetings" class="btn-secondary">
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
    
    <!-- Gate Meetings Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="gateMeetings.length === 0" class="col-span-full text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4h6m-6 0a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-6a2 2 0 00-2-2"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No gate meetings</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by scheduling a new gate meeting.</p>
        <div class="mt-6">
          <button @click="showCreateModal = true" class="btn-primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Schedule Gate Meeting
          </button>
        </div>
      </div>
      
      <!-- Gate Meeting Cards -->
      <div v-for="meeting in gateMeetings" :key="meeting.id" class="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4h6m-6 0a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-6a2 2 0 00-2-2"/>
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-gray-900">{{ meeting.title }}</h3>
                <p class="text-sm text-gray-500">{{ meeting.gate_type }}</p>
              </div>
            </div>
            <span :class="getStatusClass(meeting.status)" class="px-2 py-1 text-xs font-semibold rounded-full">
              {{ meeting.status }}
            </span>
          </div>
          
          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Project:</span>
              <span class="text-gray-900">{{ meeting.project?.project_name || 'N/A' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Scheduled:</span>
              <span class="text-gray-900">{{ formatDateTime(meeting.scheduled_date) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Location:</span>
              <span class="text-gray-900">{{ meeting.location || 'TBD' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Attendees:</span>
              <span class="text-gray-900">{{ meeting.attendees?.length || 0 }}</span>
            </div>
          </div>
          
          <div v-if="meeting.description" class="mb-4">
            <p class="text-sm text-gray-600 line-clamp-2">{{ meeting.description }}</p>
          </div>
          
          <!-- Action Items Summary -->
          <div v-if="meeting.action_items && meeting.action_items.length > 0" class="mb-4">
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              {{ meeting.action_items.length }} action item{{ meeting.action_items.length !== 1 ? 's' : '' }}
            </div>
          </div>
          
          <div class="flex justify-between items-center">
            <div class="flex space-x-2">
              <button @click="viewGateMeeting(meeting)" class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                View
              </button>
              <button @click="editGateMeeting(meeting)" class="text-green-600 hover:text-green-900 text-sm font-medium">
                Edit
              </button>
              <button v-if="meeting.status === 'Scheduled'" @click="startGateMeeting(meeting)" class="text-blue-600 hover:text-blue-900 text-sm font-medium">
                Start
              </button>
              <button v-if="meeting.status === 'In Progress'" @click="completeGateMeeting(meeting)" class="text-purple-600 hover:text-purple-900 text-sm font-medium">
                Complete
              </button>
            </div>
            <div class="flex space-x-2">
              <button v-if="meeting.status === 'Scheduled'" @click="postponeGateMeeting(meeting)" class="text-yellow-600 hover:text-yellow-900 text-sm font-medium">
                Postpone
              </button>
              <button @click="deleteGateMeeting(meeting)" class="text-red-600 hover:text-red-900 text-sm font-medium">
                Delete
              </button>
            </div>
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
    <GateMeetingModal 
      v-if="showCreateModal || showEditModal"
      :gateMeeting="selectedGateMeeting"
      :projects="projects"
      @close="closeModal"
      @saved="handleGateMeetingSaved"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import GateMeetingModal from './GateMeetingModal.vue';
import { gateMeetingService } from '@/services/gateMeetingService';
import { projectService } from '@/services/projectService';

export default {
  name: 'GateMeetingList',
  components: {
    GateMeetingModal
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
    const gateMeetings = ref([]);
    const projects = ref([]);
    const loading = ref(false);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const selectedGateMeeting = ref(null);
    
    const filters = reactive({
      status: '',
      gate_type: '',
      project: props.projectId || '',
      date_from: ''
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
    const loadGateMeetings = async () => {
      try {
        loading.value = true;
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        };
        
        const response = await gateMeetingService.getGateMeetings(params);
        gateMeetings.value = response.gateMeetings;
        pagination.total = response.pagination.total;
        pagination.totalPages = response.pagination.totalPages;
      } catch (error) {
        console.error('Error loading gate meetings:', error);
        toast.error('Failed to load gate meetings');
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
    
    const formatDateTime = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString('en-CA');
    };
    
    const getStatusClass = (status) => {
      const classes = {
        'Scheduled': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Completed': 'bg-green-100 text-green-800',
        'Cancelled': 'bg-red-100 text-red-800',
        'Postponed': 'bg-orange-100 text-orange-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    };
    
    const viewGateMeeting = (meeting) => {
      // Navigate to gate meeting detail view
      console.log('View gate meeting:', meeting);
    };
    
    const editGateMeeting = (meeting) => {
      selectedGateMeeting.value = { ...meeting };
      showEditModal.value = true;
    };
    
    const startGateMeeting = async (meeting) => {
      if (!confirm(`Are you sure you want to start "${meeting.title}"?`)) {
        return;
      }
      
      try {
        await gateMeetingService.startGateMeeting(meeting.id);
        toast.success('Gate meeting started successfully');
        loadGateMeetings();
      } catch (error) {
        console.error('Error starting gate meeting:', error);
        toast.error('Failed to start gate meeting');
      }
    };
    
    const completeGateMeeting = async (meeting) => {
      if (!confirm(`Are you sure you want to complete "${meeting.title}"?`)) {
        return;
      }
      
      try {
        await gateMeetingService.completeGateMeeting(meeting.id, {
          meeting_notes: 'Meeting completed via list action',
          outcomes: [],
          next_steps: []
        });
        toast.success('Gate meeting completed successfully');
        loadGateMeetings();
      } catch (error) {
        console.error('Error completing gate meeting:', error);
        toast.error('Failed to complete gate meeting');
      }
    };
    
    const postponeGateMeeting = async (meeting) => {
      const newDate = prompt('Enter new date (YYYY-MM-DD HH:MM):');
      if (!newDate) return;
      
      const reason = prompt('Reason for postponement:');
      if (!reason) return;
      
      try {
        await gateMeetingService.postponeGateMeeting(meeting.id, {
          new_date: newDate,
          postponement_reason: reason
        });
        toast.success('Gate meeting postponed successfully');
        loadGateMeetings();
      } catch (error) {
        console.error('Error postponing gate meeting:', error);
        toast.error('Failed to postpone gate meeting');
      }
    };
    
    const deleteGateMeeting = async (meeting) => {
      if (!confirm(`Are you sure you want to delete "${meeting.title}"?`)) {
        return;
      }
      
      try {
        await gateMeetingService.deleteGateMeeting(meeting.id);
        toast.success('Gate meeting deleted successfully');
        loadGateMeetings();
      } catch (error) {
        console.error('Error deleting gate meeting:', error);
        toast.error('Failed to delete gate meeting');
      }
    };
    
    const closeModal = () => {
      showCreateModal.value = false;
      showEditModal.value = false;
      selectedGateMeeting.value = null;
    };
    
    const handleGateMeetingSaved = () => {
      closeModal();
      loadGateMeetings();
      toast.success('Gate meeting saved successfully');
    };
    
    const previousPage = () => {
      if (pagination.page > 1) {
        pagination.page--;
        loadGateMeetings();
      }
    };
    
    const nextPage = () => {
      if (pagination.page < pagination.totalPages) {
        pagination.page++;
        loadGateMeetings();
      }
    };
    
    const goToPage = (page) => {
      pagination.page = page;
      loadGateMeetings();
    };
    
    // Lifecycle
    onMounted(() => {
      loadGateMeetings();
      loadProjects();
    });
    
    return {
      gateMeetings,
      projects,
      loading,
      showCreateModal,
      showEditModal,
      selectedGateMeeting,
      filters,
      pagination,
      visiblePages,
      loadGateMeetings,
      formatDateTime,
      getStatusClass,
      viewGateMeeting,
      editGateMeeting,
      startGateMeeting,
      completeGateMeeting,
      postponeGateMeeting,
      deleteGateMeeting,
      closeModal,
      handleGateMeetingSaved,
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

