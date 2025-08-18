<template>
  <div class="change-order-list">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Change Orders</h2>
      <button @click="showCreateModal = true" class="btn-primary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        Create Change Order
      </button>
    </div>
    
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="changeOrder in changeOrders" :key="changeOrder.id" class="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">{{ changeOrder.title }}</h3>
            <span :class="getStatusClass(changeOrder.status)" class="px-2 py-1 text-xs font-semibold rounded-full">
              {{ changeOrder.status }}
            </span>
          </div>
          
          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Type:</span>
              <span class="text-gray-900">{{ changeOrder.change_type }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Cost Impact:</span>
              <span class="text-gray-900">${{ formatCurrency(changeOrder.cost_impact) }}</span>
            </div>
          </div>
          
          <div class="flex justify-between items-center">
            <button @click="editChangeOrder(changeOrder)" class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
              Edit
            </button>
            <button @click="deleteChangeOrder(changeOrder)" class="text-red-600 hover:text-red-900 text-sm font-medium">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <ChangeOrderModal 
      v-if="showCreateModal || showEditModal"
      :changeOrder="selectedChangeOrder"
      @close="closeModal"
      @saved="handleChangeOrderSaved"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import ChangeOrderModal from './ChangeOrderModal.vue';
import { changeOrderService } from '@/services/changeOrderService';

export default {
  name: 'ChangeOrderList',
  components: {
    ChangeOrderModal
  },
  setup() {
    const toast = useToast();
    const changeOrders = ref([]);
    const loading = ref(false);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const selectedChangeOrder = ref(null);
    
    const loadChangeOrders = async () => {
      try {
        loading.value = true;
        const response = await changeOrderService.getChangeOrders();
        changeOrders.value = response.changeOrders;
      } catch (error) {
        console.error('Error loading change orders:', error);
        toast.error('Failed to load change orders');
      } finally {
        loading.value = false;
      }
    };
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD'
      }).format(amount || 0);
    };
    
    const getStatusClass = (status) => {
      const classes = {
        'Draft': 'bg-gray-100 text-gray-800',
        'Submitted': 'bg-blue-100 text-blue-800',
        'Under Review': 'bg-yellow-100 text-yellow-800',
        'Approved': 'bg-green-100 text-green-800',
        'Rejected': 'bg-red-100 text-red-800',
        'Implemented': 'bg-purple-100 text-purple-800',
        'Cancelled': 'bg-gray-100 text-gray-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    };
    
    const editChangeOrder = (changeOrder) => {
      selectedChangeOrder.value = { ...changeOrder };
      showEditModal.value = true;
    };
    
    const deleteChangeOrder = async (changeOrder) => {
      if (!confirm(`Are you sure you want to delete "${changeOrder.title}"?`)) {
        return;
      }
      
      try {
        await changeOrderService.deleteChangeOrder(changeOrder.id);
        toast.success('Change order deleted successfully');
        loadChangeOrders();
      } catch (error) {
        console.error('Error deleting change order:', error);
        toast.error('Failed to delete change order');
      }
    };
    
    const closeModal = () => {
      showCreateModal.value = false;
      showEditModal.value = false;
      selectedChangeOrder.value = null;
    };
    
    const handleChangeOrderSaved = () => {
      closeModal();
      loadChangeOrders();
      toast.success('Change order saved successfully');
    };
    
    onMounted(() => {
      loadChangeOrders();
    });
    
    return {
      changeOrders,
      loading,
      showCreateModal,
      showEditModal,
      selectedChangeOrder,
      formatCurrency,
      getStatusClass,
      editChangeOrder,
      deleteChangeOrder,
      closeModal,
      handleChangeOrderSaved
    };
  }
};
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}
</style>
