<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeModal">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" @click.stop>
      <div class="mt-3">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Edit Task' : 'Create Task' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="saveTask" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                Title <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.title"
                type="text"
                id="title"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter task title"
              />
            </div>
            
            <div>
              <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                v-model="formData.priority"
                id="priority"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              v-model="formData.description"
              id="description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Task description"
            ></textarea>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="entity_type" class="block text-sm font-medium text-gray-700 mb-2">
                Entity Type <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.entity_type"
                id="entity_type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Entity Type</option>
                <option value="project">Project</option>
                <option value="contract">Contract</option>
                <option value="report">Report</option>
                <option value="gate_meeting">Gate Meeting</option>
                <option value="change_order">Change Order</option>
              </select>
            </div>
            
            <div>
              <label for="entity_id" class="block text-sm font-medium text-gray-700 mb-2">
                Entity ID <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.entity_id"
                type="text"
                id="entity_id"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter entity ID"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="assigned_to" class="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <select
                v-model="formData.assigned_to"
                id="assigned_to"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select User</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.name }}
                </option>
              </select>
            </div>
            
            <div>
              <label for="due_date" class="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                v-model="formData.due_date"
                type="date"
                id="due_date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="estimated_hours" class="block text-sm font-medium text-gray-700 mb-2">
                Estimated Hours
              </label>
              <input
                v-model="formData.estimated_hours"
                type="number"
                step="0.5"
                min="0"
                id="estimated_hours"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.0"
              />
            </div>
            
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                v-model="formData.status"
                id="status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { taskService } from '@/services/taskService';

export default {
  name: 'TaskModal',
  props: {
    task: {
      type: Object,
      default: null
    },
    users: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const toast = useToast();
    const saving = ref(false);
    
    const formData = reactive({
      title: '',
      description: '',
      entity_type: '',
      entity_id: '',
      assigned_to: '',
      priority: 'Medium',
      status: 'Open',
      due_date: '',
      estimated_hours: null
    });
    
    const isEditing = computed(() => !!props.task);
    
    const saveTask = async () => {
      try {
        saving.value = true;
        
        if (isEditing.value) {
          await taskService.updateTask(props.task.id, formData);
        } else {
          await taskService.createTask(formData);
        }
        
        emit('saved');
      } catch (error) {
        console.error('Error saving task:', error);
        toast.error('Failed to save task');
      } finally {
        saving.value = false;
      }
    };
    
    const closeModal = () => {
      emit('close');
    };
    
    watch(() => props.task, (newTask) => {
      if (newTask) {
        Object.assign(formData, {
          title: newTask.title || '',
          description: newTask.description || '',
          entity_type: newTask.entity_type || '',
          entity_id: newTask.entity_id || '',
          assigned_to: newTask.assigned_to || '',
          priority: newTask.priority || 'Medium',
          status: newTask.status || 'Open',
          due_date: newTask.due_date ? newTask.due_date.split('T')[0] : '',
          estimated_hours: newTask.estimated_hours || null
        });
      } else {
        Object.assign(formData, {
          title: '',
          description: '',
          entity_type: '',
          entity_id: '',
          assigned_to: '',
          priority: 'Medium',
          status: 'Open',
          due_date: '',
          estimated_hours: null
        });
      }
    }, { immediate: true });
    
    return {
      saving,
      formData,
      isEditing,
      saveTask,
      closeModal
    };
  }
};
</script>
