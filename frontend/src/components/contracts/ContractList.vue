<template>
  <div class="contract-list">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Contracts</h2>
      <button @click="showCreateModal = true" class="btn-primary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        Add Contract
      </button>
    </div>
    
    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select v-model="filters.status" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Terminated">Terminated</option>
        </select>
        <select v-model="filters.project" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Projects</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.project_name }}
          </option>
        </select>
        <input 
          v-model="filters.search" 
          placeholder="Search contracts..." 
          class="form-input rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
        <button @click="loadContracts" class="btn-secondary">
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
    
    <!-- Contract Table -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="contracts.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No contracts</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new contract.</p>
        <div class="mt-6">
          <button @click="showCreateModal = true" class="btn-primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Add Contract
          </button>
        </div>
      </div>
      
      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contract #
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vendor
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="contract in contracts" :key="contract.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ contract.contract_number }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ contract.title }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ contract.project?.project_name || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ contract.vendor?.company_name || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              ${{ formatCurrency(contract.value) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(contract.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ contract.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button @click="editContract(contract)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                Edit
              </button>
              <button @click="viewContract(contract)" class="text-green-600 hover:text-green-900 mr-3">
                View
              </button>
              <button @click="deleteContract(contract)" class="text-red-600 hover:text-red-900">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button 
            @click="previousPage" 
            :disabled="pagination.page === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            @click="nextPage" 
            :disabled="pagination.page === pagination.totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }} results
            </p>
          </div>
          <div>
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
        </div>
      </div>
    </div>
    
    <!-- Create/Edit Modal -->
    <ContractModal 
      v-if="showCreateModal || showEditModal"
      :contract="selectedContract"
      :projects="projects"
      :vendors="vendors"
      @close="closeModal"
      @saved="handleContractSaved"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import ContractModal from './ContractModal.vue';
import { contractService } from '@/services/contractService';
import { projectService } from '@/services/projectService';
import { vendorService } from '@/services/vendorService';

export default {
  name: 'ContractList',
  components: {
    ContractModal
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
    const contracts = ref([]);
    const projects = ref([]);
    const vendors = ref([]);
    const loading = ref(false);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const selectedContract = ref(null);
    
    const filters = reactive({
      status: '',
      project: props.projectId || '',
      search: ''
    });
    
    const pagination = reactive({
      page: 1,
      limit: 20,
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
    const loadContracts = async () => {
      try {
        loading.value = true;
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        };
        
        const response = await contractService.getContracts(params);
        contracts.value = response.contracts;
        pagination.total = response.pagination.total;
        pagination.totalPages = response.pagination.totalPages;
      } catch (error) {
        console.error('Error loading contracts:', error);
        toast.error('Failed to load contracts');
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
    
    const loadVendors = async () => {
      try {
        const response = await vendorService.getVendors({ limit: 1000 });
        vendors.value = response.vendors;
      } catch (error) {
        console.error('Error loading vendors:', error);
      }
    };
    
    const formatCurrency = (value) => {
      if (!value) return '0.00';
      return new Intl.NumberFormat('en-CA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    };
    
    const getStatusClass = (status) => {
      const classes = {
        'Draft': 'bg-gray-100 text-gray-800',
        'Active': 'bg-green-100 text-green-800',
        'Completed': 'bg-blue-100 text-blue-800',
        'Terminated': 'bg-red-100 text-red-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    };
    
    const editContract = (contract) => {
      selectedContract.value = { ...contract };
      showEditModal.value = true;
    };
    
    const viewContract = (contract) => {
      // Navigate to contract detail view
      // This would typically use vue-router
      console.log('View contract:', contract);
    };
    
    const deleteContract = async (contract) => {
      if (!confirm(`Are you sure you want to delete contract "${contract.title}"?`)) {
        return;
      }
      
      try {
        await contractService.deleteContract(contract.id);
        toast.success('Contract deleted successfully');
        loadContracts();
      } catch (error) {
        console.error('Error deleting contract:', error);
        toast.error('Failed to delete contract');
      }
    };
    
    const closeModal = () => {
      showCreateModal.value = false;
      showEditModal.value = false;
      selectedContract.value = null;
    };
    
    const handleContractSaved = () => {
      closeModal();
      loadContracts();
      toast.success('Contract saved successfully');
    };
    
    const previousPage = () => {
      if (pagination.page > 1) {
        pagination.page--;
        loadContracts();
      }
    };
    
    const nextPage = () => {
      if (pagination.page < pagination.totalPages) {
        pagination.page++;
        loadContracts();
      }
    };
    
    const goToPage = (page) => {
      pagination.page = page;
      loadContracts();
    };
    
    // Lifecycle
    onMounted(() => {
      loadContracts();
      loadProjects();
      loadVendors();
    });
    
    return {
      contracts,
      projects,
      vendors,
      loading,
      showCreateModal,
      showEditModal,
      selectedContract,
      filters,
      pagination,
      visiblePages,
      loadContracts,
      formatCurrency,
      getStatusClass,
      editContract,
      viewContract,
      deleteContract,
      closeModal,
      handleContractSaved,
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
</style>

