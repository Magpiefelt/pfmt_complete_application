<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeModal">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" @click.stop>
      <div class="mt-3">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Edit Change Order' : 'Create Change Order' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="saveChangeOrder" class="space-y-6">
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
              placeholder="Enter change order title"
            />
          </div>
          
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="formData.description"
              id="description"
              rows="3"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Change order description"
            ></textarea>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="change_type" class="block text-sm font-medium text-gray-700 mb-2">
                Change Type <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.change_type"
                id="change_type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Change Type</option>
                <option value="Scope Change">Scope Change</option>
                <option value="Schedule Change">Schedule Change</option>
                <option value="Budget Change">Budget Change</option>
                <option value="Resource Change">Resource Change</option>
                <option value="Quality Change">Quality Change</option>
                <option value="Risk Change">Risk Change</option>
              </select>
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
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="cost_impact" class="block text-sm font-medium text-gray-700 mb-2">
                Cost Impact (CAD)
              </label>
              <input
                v-model="formData.cost_impact"
                type="number"
                step="0.01"
                id="cost_impact"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label for="schedule_impact_days" class="block text-sm font-medium text-gray-700 mb-2">
                Schedule Impact (Days)
              </label>
              <input
                v-model="formData.schedule_impact_days"
                type="number"
                id="schedule_impact_days"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
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
              {{ saving ? 'Saving...' : (isEditing ? 'Update Change Order' : 'Create Change Order') }}
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
import { changeOrderService } from '@/services/changeOrderService';

export default {
  name: 'ChangeOrderModal',
  props: {
    changeOrder: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const toast = useToast();
    const saving = ref(false);
    
    const formData = reactive({
      title: '',
      description: '',
      change_type: '',
      priority: 'Medium',
      cost_impact: null,
      schedule_impact_days: null,
      contract_id: '',
      project_id: ''
    });
    
    const isEditing = computed(() => !!props.changeOrder);
    
    const saveChangeOrder = async () => {
      try {
        saving.value = true;
        
        if (isEditing.value) {
          await changeOrderService.updateChangeOrder(props.changeOrder.id, formData);
        } else {
          await changeOrderService.createChangeOrder(formData);
        }
        
        emit('saved');
      } catch (error) {
        console.error('Error saving change order:', error);
        toast.error('Failed to save change order');
      } finally {
        saving.value = false;
      }
    };
    
    const closeModal = () => {
      emit('close');
    };
    
    watch(() => props.changeOrder, (newChangeOrder) => {
      if (newChangeOrder) {
        Object.assign(formData, {
          title: newChangeOrder.title || '',
          description: newChangeOrder.description || '',
          change_type: newChangeOrder.change_type || '',
          priority: newChangeOrder.priority || 'Medium',
          cost_impact: newChangeOrder.cost_impact || null,
          schedule_impact_days: newChangeOrder.schedule_impact_days || null,
          contract_id: newChangeOrder.contract_id || '',
          project_id: newChangeOrder.project_id || ''
        });
      } else {
        Object.assign(formData, {
          title: '',
          description: '',
          change_type: '',
          priority: 'Medium',
          cost_impact: null,
          schedule_impact_days: null,
          contract_id: '',
          project_id: ''
        });
      }
    }, { immediate: true });
    
    return {
      saving,
      formData,
      isEditing,
      saveChangeOrder,
      closeModal
    };
  }
};
</script>
