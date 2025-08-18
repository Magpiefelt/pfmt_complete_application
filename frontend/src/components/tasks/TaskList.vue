<template>
  <div class="task-list">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Tasks</h2>
      <button @click="showCreateModal = true" class="btn-primary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        Create Task
      </button>
    </div>
    
    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
        <select v-model="filters.status" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="On Hold">On Hold</option>
        </select>
        <select v-model="filters.priority" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <select v-model="filters.entity_type" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Types</option>
          <option value="project">Project</option>
          <option value="contract">Contract</option>
          <option value="report">Report</option>
          <option value="gate_meeting">Gate Meeting</option>
          <option value="change_order">Change Order</option>
        </select>
        <select v-model="filters.assigned_to" class="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Assignees</option>
          <option value="me">My Tasks</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
        <input 
          v-model="filters.due_date_from" 
          type="date" 
          placeholder="Due From"
          class="form-input rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        <button @click="loadTasks" class="btn-secondary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
          Filter
        </button>
      </div>
    </div>
    
    <!-- Task Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Total</p>
            <p class="text-lg font-semibold text-gray-900">{{ statistics.total || 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Completed</p>
            <p class="text-lg font-semibold text-gray-900">{{ statistics.completed || 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">In Progress</p>
            <p class="text-lg font-semibold text-gray-900">{{ statistics.in_progress || 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Overdue</p>
            <p class="text-lg font-semibold text-gray-900">{{ statistics.overdue || 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">My Tasks</p>
            <p class="text-lg font-semibold text-gray-900">{{ statistics.my_tasks || 0 }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <!-- Tasks List -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="tasks.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
        <div class="mt-6">
          <button @click="showCreateModal = true" class="btn-primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Create Task
          </button>
        </div>
      </div>
      
      <!-- Task Items -->
      <div v-else class="divide-y divide-gray-200">
        <div v-for="task in tasks" :key="task.id" class="p-6 hover:bg-gray-50 transition-colors duration-150">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1">
              <!-- Priority Indicator -->
              <div :class="getPriorityClass(task.priority)" class="w-3 h-3 rounded-full"></div>
              
              <!-- Task Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <h3 class="text-lg font-medium text-gray-900 truncate">{{ task.title }}</h3>
                  <span :class="getStatusClass(task.status)" class="px-2 py-1 text-xs font-semibold rounded-full">
                    {{ task.status }}
                  </span>
                  <span :class="getEntityTypeClass(task.entity_type)" class="px-2 py-1 text-xs font-medium rounded-full">
                    {{ formatEntityType(task.entity_type) }}
                  </span>
                </div>
                
                <p v-if="task.description" class="text-sm text-gray-600 mb-2 line-clamp-2">{{ task.description }}</p>
                
                <div class="flex items-center space-x-4 text-sm text-gray-500">
                  <div v-if="task.assigned_to" class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    {{ task.assigned_user?.name || 'Assigned User' }}
                  </div>
                  <div v-if="task.due_date" class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4h6m-6 0a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-6a2 2 0 00-2-2"/>
                    </svg>
                    <span :class="isOverdue(task.due_date) ? 'text-red-600 font-medium' : ''">
                      {{ formatDate(task.due_date) }}
                    </span>
                  </div>
                  <div v-if="task.estimated_hours" class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ task.estimated_hours }}h
                  </div>
                </div>
                
                <!-- Tags -->
                <div v-if="task.tags && task.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
                  <span v-for="tag in task.tags" :key="tag" class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center space-x-2">
              <button v-if="task.status === 'Open'" @click="startTask(task)" class="text-blue-600 hover:text-blue-900 text-sm font-medium">
                Start
              </button>
              <button v-if="task.status === 'In Progress'" @click="completeTask(task)" class="text-green-600 hover:text-green-900 text-sm font-medium">
                Complete
              </button>
              <button @click="editTask(task)" class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                Edit
              </button>
              <div class="relative">
                <button @click="toggleTaskMenu(task.id)" class="text-gray-400 hover:text-gray-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                  </svg>
                </button>
                <div v-if="activeTaskMenu === task.id" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div class="py-1">
                    <button @click="assignTask(task)" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                      Assign
                    </button>
                    <button v-if="task.status !== 'On Hold'" @click="holdTask(task)" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                      Put on Hold
                    </button>
                    <button v-if="task.status === 'On Hold'" @click="resumeTask(task)" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                      Resume
                    </button>
                    <button @click="cancelTask(task)" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                      Cancel
                    </button>
                    <button @click="deleteTask(task)" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
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
    <TaskModal 
      v-if="showCreateModal || showEditModal"
      :task="selectedTask"
      :users="users"
      @close="closeModal"
      @saved="handleTaskSaved"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import TaskModal from './TaskModal.vue';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';

export default {
  name: 'TaskList',
  components: {
    TaskModal
  },
  props: {
    entityType: {
      type: String,
      default: null
    },
    entityId: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const toast = useToast();
    
    // Reactive data
    const tasks = ref([]);
    const users = ref([]);
    const statistics = ref({});
    const loading = ref(false);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const selectedTask = ref(null);
    const activeTaskMenu = ref(null);
    
    const filters = reactive({
      status: '',
      priority: '',
      entity_type: props.entityType || '',
      entity_id: props.entityId || '',
      assigned_to: '',
      due_date_from: ''
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
    const loadTasks = async () => {
      try {
        loading.value = true;
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        };
        
        const response = await taskService.getTasks(params);
        tasks.value = response.tasks;
        pagination.total = response.pagination.total;
        pagination.totalPages = response.pagination.totalPages;
      } catch (error) {
        console.error('Error loading tasks:', error);
        toast.error('Failed to load tasks');
      } finally {
        loading.value = false;
      }
    };
    
    const loadStatistics = async () => {
      try {
        const response = await taskService.getTaskStatistics();
        statistics.value = response.statistics;
      } catch (error) {
        console.error('Error loading task statistics:', error);
      }
    };
    
    const loadUsers = async () => {
      try {
        const response = await userService.getUsers({ limit: 1000 });
        users.value = response.users;
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-CA');
    };
    
    const formatEntityType = (entityType) => {
      const types = {
        'project': 'Project',
        'contract': 'Contract',
        'report': 'Report',
        'gate_meeting': 'Gate Meeting',
        'change_order': 'Change Order'
      };
      return types[entityType] || entityType;
    };
    
    const isOverdue = (dueDate) => {
      if (!dueDate) return false;
      return new Date(dueDate) < new Date();
    };
    
    const getPriorityClass = (priority) => {
      const classes = {
        'Low': 'bg-green-400',
        'Medium': 'bg-yellow-400',
        'High': 'bg-orange-400',
        'Critical': 'bg-red-400'
      };
      return classes[priority] || 'bg-gray-400';
    };
    
    const getStatusClass = (status) => {
      const classes = {
        'Open': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Completed': 'bg-green-100 text-green-800',
        'Cancelled': 'bg-red-100 text-red-800',
        'On Hold': 'bg-gray-100 text-gray-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    };
    
    const getEntityTypeClass = (entityType) => {
      const classes = {
        'project': 'bg-purple-100 text-purple-800',
        'contract': 'bg-blue-100 text-blue-800',
        'report': 'bg-green-100 text-green-800',
        'gate_meeting': 'bg-orange-100 text-orange-800',
        'change_order': 'bg-red-100 text-red-800'
      };
      return classes[entityType] || 'bg-gray-100 text-gray-800';
    };
    
    const toggleTaskMenu = (taskId) => {
      activeTaskMenu.value = activeTaskMenu.value === taskId ? null : taskId;
    };
    
    const editTask = (task) => {
      selectedTask.value = { ...task };
      showEditModal.value = true;
      activeTaskMenu.value = null;
    };
    
    const startTask = async (task) => {
      try {
        await taskService.startTask(task.id);
        toast.success('Task started successfully');
        loadTasks();
        loadStatistics();
      } catch (error) {
        console.error('Error starting task:', error);
        toast.error('Failed to start task');
      }
    };
    
    const completeTask = async (task) => {
      try {
        await taskService.completeTask(task.id, {
          completion_notes: 'Task completed via list action'
        });
        toast.success('Task completed successfully');
        loadTasks();
        loadStatistics();
      } catch (error) {
        console.error('Error completing task:', error);
        toast.error('Failed to complete task');
      }
    };
    
    const assignTask = async (task) => {
      const userId = prompt('Enter user ID to assign task to:');
      if (!userId) return;
      
      try {
        await taskService.assignTask(task.id, {
          assigned_to: userId,
          assignment_notes: 'Task assigned via list action'
        });
        toast.success('Task assigned successfully');
        loadTasks();
        activeTaskMenu.value = null;
      } catch (error) {
        console.error('Error assigning task:', error);
        toast.error('Failed to assign task');
      }
    };
    
    const holdTask = async (task) => {
      const reason = prompt('Reason for putting task on hold:');
      if (!reason) return;
      
      try {
        await taskService.holdTask(task.id, {
          hold_reason: reason
        });
        toast.success('Task put on hold successfully');
        loadTasks();
        loadStatistics();
        activeTaskMenu.value = null;
      } catch (error) {
        console.error('Error putting task on hold:', error);
        toast.error('Failed to put task on hold');
      }
    };
    
    const resumeTask = async (task) => {
      try {
        await taskService.resumeTask(task.id);
        toast.success('Task resumed successfully');
        loadTasks();
        loadStatistics();
        activeTaskMenu.value = null;
      } catch (error) {
        console.error('Error resuming task:', error);
        toast.error('Failed to resume task');
      }
    };
    
    const cancelTask = async (task) => {
      const reason = prompt('Reason for cancelling task:');
      if (!reason) return;
      
      try {
        await taskService.cancelTask(task.id, {
          cancellation_reason: reason
        });
        toast.success('Task cancelled successfully');
        loadTasks();
        loadStatistics();
        activeTaskMenu.value = null;
      } catch (error) {
        console.error('Error cancelling task:', error);
        toast.error('Failed to cancel task');
      }
    };
    
    const deleteTask = async (task) => {
      if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
        return;
      }
      
      try {
        await taskService.deleteTask(task.id);
        toast.success('Task deleted successfully');
        loadTasks();
        loadStatistics();
        activeTaskMenu.value = null;
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
      }
    };
    
    const closeModal = () => {
      showCreateModal.value = false;
      showEditModal.value = false;
      selectedTask.value = null;
    };
    
    const handleTaskSaved = () => {
      closeModal();
      loadTasks();
      loadStatistics();
      toast.success('Task saved successfully');
    };
    
    const previousPage = () => {
      if (pagination.page > 1) {
        pagination.page--;
        loadTasks();
      }
    };
    
    const nextPage = () => {
      if (pagination.page < pagination.totalPages) {
        pagination.page++;
        loadTasks();
      }
    };
    
    const goToPage = (page) => {
      pagination.page = page;
      loadTasks();
    };
    
    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        activeTaskMenu.value = null;
      }
    };
    
    // Lifecycle
    onMounted(() => {
      loadTasks();
      loadStatistics();
      loadUsers();
      document.addEventListener('click', handleClickOutside);
    });
    
    return {
      tasks,
      users,
      statistics,
      loading,
      showCreateModal,
      showEditModal,
      selectedTask,
      activeTaskMenu,
      filters,
      pagination,
      visiblePages,
      loadTasks,
      formatDate,
      formatEntityType,
      isOverdue,
      getPriorityClass,
      getStatusClass,
      getEntityTypeClass,
      toggleTaskMenu,
      editTask,
      startTask,
      completeTask,
      assignTask,
      holdTask,
      resumeTask,
      cancelTask,
      deleteTask,
      closeModal,
      handleTaskSaved,
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

