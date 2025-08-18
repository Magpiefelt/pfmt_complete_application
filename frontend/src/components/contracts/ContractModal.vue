<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <form @submit.prevent="saveContract">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="w-full">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {{ isEditing ? 'Edit Contract' : 'Create New Contract' }}
                  </h3>
                  <button type="button" @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Basic Information -->
                  <div class="col-span-2">
                    <h4 class="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Contract Number *
                    </label>
                    <input
                      v-model="formData.contractNumber"
                      type="text"
                      required
                      class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter contract number"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      v-model="formData.title"
                      type="text"
                      required
                      class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter contract title"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Project *
                    </label>
                    <select
                      v-model="formData.projectId"
                      required
                      class="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Project</option>
                      <option v-for="project in projects" :key="project.id" :value="project.id">
                        {{ project.project_name }}
                      </option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Vendor *
                    </label>
                    <select
                      v-model="formData.vendorId"
                      required
                      class="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Vendor</option>
                      <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
                        {{ vendor.company_name }}
                      </option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Contract Type
                    </label>
                    <select
                      v-model="formData.contractType"
                      class="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Type</option>
                      <option value="Fixed Price">Fixed Price</option>
                      <option value="Time and Materials">Time and Materials</option>
                      <option value="Cost Plus">Cost Plus</option>
                      <option value="Unit Price">Unit Price</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      v-model="formData.status"
                      class="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                  
                  <!-- Financial Information -->
                  <div class="col-span-2 mt-6">
                    <h4 class="text-md font-medium text-gray-900 mb-4">Financial Information</h4>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Contract Value *
                    </label>
                    <input
                      v-model.number="formData.value"
                      type="number"
                      step="0.01"
                      required
                      class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      v-model="formData.currency"
                      class="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="CAD">CAD</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  
                  <!-- Dates -->
                  <div class="col-span-2 mt-6">
                    <h4 class="text-md font-medium text-gray-900 mb-4">Contract Dates</h4>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      v-model="formData.startDate"
                      type="date"
                      class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      v-model="formData.endDate"
                      type="date"
                      class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Signed Date
                    </label>
                    <input
                      v-model="formData.signedDate"
                      type="date"
                      class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <!-- Description -->
                  <div class="col-span-2 mt-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      v-model="formData.description"
                      rows="4"
                      class="form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter contract description..."
                    ></textarea>
                  </div>
                  
                  <!-- Terms and Conditions -->
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Terms and Conditions
                    </label>
                    <textarea
                      v-model="formData.termsConditions"
                      rows="4"
                      class="form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter terms and conditions..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="saving"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              <svg v-if="saving" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ saving ? 'Saving...' : (isEditing ? 'Update Contract' : 'Create Contract') }}
            </button>
            <button
              type="button"
              @click="$emit('close')"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
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
import { contractService } from '@/services/contractService';

export default {
  name: 'ContractModal',
  props: {
    contract: {
      type: Object,
      default: null
    },
    projects: {
      type: Array,
      default: () => []
    },
    vendors: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const toast = useToast();
    const saving = ref(false);
    
    // Form data
    const formData = reactive({
      contractNumber: '',
      title: '',
      projectId: '',
      vendorId: '',
      contractType: '',
      status: 'Draft',
      value: 0,
      currency: 'CAD',
      startDate: '',
      endDate: '',
      signedDate: '',
      description: '',
      termsConditions: ''
    });
    
    // Computed properties
    const isEditing = computed(() => !!props.contract);
    
    // Initialize form data when contract prop changes
    watch(() => props.contract, (newContract) => {
      if (newContract) {
        Object.assign(formData, {
          contractNumber: newContract.contract_number || '',
          title: newContract.title || '',
          projectId: newContract.project_id || '',
          vendorId: newContract.vendor_id || '',
          contractType: newContract.contract_type || '',
          status: newContract.status || 'Draft',
          value: newContract.value || 0,
          currency: newContract.currency || 'CAD',
          startDate: newContract.start_date ? newContract.start_date.split('T')[0] : '',
          endDate: newContract.end_date ? newContract.end_date.split('T')[0] : '',
          signedDate: newContract.signed_date ? newContract.signed_date.split('T')[0] : '',
          description: newContract.description || '',
          termsConditions: newContract.terms_conditions || ''
        });
      } else {
        // Reset form for new contract
        Object.assign(formData, {
          contractNumber: '',
          title: '',
          projectId: '',
          vendorId: '',
          contractType: '',
          status: 'Draft',
          value: 0,
          currency: 'CAD',
          startDate: '',
          endDate: '',
          signedDate: '',
          description: '',
          termsConditions: ''
        });
      }
    }, { immediate: true });
    
    // Methods
    const saveContract = async () => {
      try {
        saving.value = true;
        
        // Prepare data for API
        const contractData = {
          contract_number: formData.contractNumber,
          title: formData.title,
          project_id: formData.projectId,
          vendor_id: formData.vendorId,
          contract_type: formData.contractType,
          status: formData.status,
          value: formData.value,
          currency: formData.currency,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          signed_date: formData.signedDate || null,
          description: formData.description,
          terms_conditions: formData.termsConditions
        };
        
        if (isEditing.value) {
          await contractService.updateContract(props.contract.id, contractData);
          toast.success('Contract updated successfully');
        } else {
          await contractService.createContract(contractData);
          toast.success('Contract created successfully');
        }
        
        emit('saved');
      } catch (error) {
        console.error('Error saving contract:', error);
        toast.error(error.response?.data?.message || 'Failed to save contract');
      } finally {
        saving.value = false;
      }
    };
    
    return {
      formData,
      saving,
      isEditing,
      saveContract
    };
  }
};
</script>

<style scoped>
.form-input, .form-select, .form-textarea {
  @apply block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500;
}
</style>

