<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeModal">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" @click.stop>
      <div class="mt-3">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Edit Gate Meeting' : 'Schedule Gate Meeting' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- Form -->
        <form @submit.prevent="saveGateMeeting" class="space-y-6">
          <!-- Basic Information -->
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
                placeholder="Enter meeting title"
              />
            </div>
            
            <div>
              <label for="gate_type" class="block text-sm font-medium text-gray-700 mb-2">
                Gate Type <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.gate_type"
                id="gate_type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Gate Type</option>
                <option value="Gate 0">Gate 0 - Concept</option>
                <option value="Gate 1">Gate 1 - Feasibility</option>
                <option value="Gate 2">Gate 2 - Definition</option>
                <option value="Gate 3">Gate 3 - Implementation</option>
                <option value="Gate 4">Gate 4 - Handover</option>
                <option value="Gate 5">Gate 5 - Benefits</option>
                <option value="Gate 6">Gate 6 - Closure</option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="project_id" class="block text-sm font-medium text-gray-700 mb-2">
                Project <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.project_id"
                id="project_id"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Project</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">
                  {{ project.project_name }}
                </option>
              </select>
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
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Postponed">Postponed</option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="scheduled_date" class="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date & Time <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.scheduled_date"
                type="datetime-local"
                id="scheduled_date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                v-model="formData.location"
                type="text"
                id="location"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Meeting location or virtual link"
              />
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
              placeholder="Meeting description and objectives"
            ></textarea>
          </div>
          
          <!-- Agenda -->
          <div>
            <label for="agenda" class="block text-sm font-medium text-gray-700 mb-2">
              Agenda
            </label>
            <textarea
              v-model="formData.agenda"
              id="agenda"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Meeting agenda items..."
            ></textarea>
          </div>
          
          <!-- Attendees -->
          <div>
            <div class="flex justify-between items-center mb-3">
              <label class="block text-sm font-medium text-gray-700">
                Attendees
              </label>
              <button type="button" @click="addAttendee" class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                + Add Attendee
              </button>
            </div>
            
            <div v-if="formData.attendees.length === 0" class="text-sm text-gray-500 italic">
              No attendees added yet
            </div>
            
            <div v-for="(attendee, index) in formData.attendees" :key="index" class="bg-gray-50 p-3 rounded-md mb-2">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  v-model="attendee.name"
                  type="text"
                  placeholder="Name"
                  class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  v-model="attendee.email"
                  type="email"
                  placeholder="Email"
                  class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div class="flex">
                  <input
                    v-model="attendee.role"
                    type="text"
                    placeholder="Role"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    @click="removeAttendee(index)"
                    class="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Action Items -->
          <div>
            <div class="flex justify-between items-center mb-3">
              <label class="block text-sm font-medium text-gray-700">
                Action Items
              </label>
              <button type="button" @click="addActionItem" class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                + Add Action Item
              </button>
            </div>
            
            <div v-if="formData.action_items.length === 0" class="text-sm text-gray-500 italic">
              No action items added yet
            </div>
            
            <div v-for="(item, index) in formData.action_items" :key="index" class="bg-gray-50 p-3 rounded-md mb-2">
              <div class="grid grid-cols-1 gap-3">
                <div class="flex">
                  <input
                    v-model="item.description"
                    type="text"
                    placeholder="Action item description"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    @click="removeActionItem(index)"
                    class="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    v-model="item.assigned_to"
                    type="text"
                    placeholder="Assigned to"
                    class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    v-model="item.due_date"
                    type="date"
                    placeholder="Due date"
                    class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Loading State -->
          <div v-if="saving" class="flex justify-center py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
          
          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : (isEditing ? 'Update Meeting' : 'Schedule Meeting') }}
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
import { gateMeetingService } from '@/services/gateMeetingService';

export default {
  name: 'GateMeetingModal',
  props: {
    gateMeeting: {
      type: Object,
      default: null
    },
    projects: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const toast = useToast();
    
    // Reactive data
    const saving = ref(false);
    
    const formData = reactive({
      title: '',
      gate_type: '',
      project_id: '',
      scheduled_date: '',
      location: '',
      description: '',
      agenda: '',
      status: 'Scheduled',
      attendees: [],
      action_items: []
    });
    
    // Computed properties
    const isEditing = computed(() => !!props.gateMeeting);
    
    // Methods
    const addAttendee = () => {
      formData.attendees.push({
        name: '',
        email: '',
        role: '',
        organization: ''
      });
    };
    
    const removeAttendee = (index) => {
      formData.attendees.splice(index, 1);
    };
    
    const addActionItem = () => {
      formData.action_items.push({
        description: '',
        assigned_to: '',
        due_date: '',
        priority: 'Medium'
      });
    };
    
    const removeActionItem = (index) => {
      formData.action_items.splice(index, 1);
    };
    
    const formatDateTimeForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    };
    
    const saveGateMeeting = async () => {
      try {
        saving.value = true;
        
        const meetingData = {
          ...formData,
          scheduled_date: new Date(formData.scheduled_date).toISOString()
        };
        
        if (isEditing.value) {
          await gateMeetingService.updateGateMeeting(props.gateMeeting.id, meetingData);
        } else {
          await gateMeetingService.createGateMeeting(meetingData);
        }
        
        emit('saved');
      } catch (error) {
        console.error('Error saving gate meeting:', error);
        toast.error('Failed to save gate meeting');
      } finally {
        saving.value = false;
      }
    };
    
    const closeModal = () => {
      emit('close');
    };
    
    // Initialize form data when editing
    watch(() => props.gateMeeting, (newGateMeeting) => {
      if (newGateMeeting) {
        Object.assign(formData, {
          title: newGateMeeting.title || '',
          gate_type: newGateMeeting.gate_type || '',
          project_id: newGateMeeting.project_id || '',
          scheduled_date: formatDateTimeForInput(newGateMeeting.scheduled_date),
          location: newGateMeeting.location || '',
          description: newGateMeeting.description || '',
          agenda: newGateMeeting.agenda || '',
          status: newGateMeeting.status || 'Scheduled',
          attendees: Array.isArray(newGateMeeting.attendees) ? [...newGateMeeting.attendees] : [],
          action_items: Array.isArray(newGateMeeting.action_items) ? [...newGateMeeting.action_items] : []
        });
      } else {
        // Reset form for new gate meeting
        Object.assign(formData, {
          title: '',
          gate_type: '',
          project_id: '',
          scheduled_date: '',
          location: '',
          description: '',
          agenda: '',
          status: 'Scheduled',
          attendees: [],
          action_items: []
        });
      }
    }, { immediate: true });
    
    return {
      saving,
      formData,
      isEditing,
      addAttendee,
      removeAttendee,
      addActionItem,
      removeActionItem,
      saveGateMeeting,
      closeModal
    };
  }
};
</script>

<style scoped>
/* Custom styles for the modal */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>

