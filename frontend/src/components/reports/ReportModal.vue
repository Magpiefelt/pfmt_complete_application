<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
        <form @submit.prevent="saveReport">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="w-full">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {{ isEditing ? 'Edit Report' : 'Create New Report' }}
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
                      Report Title *
                    </label>
                    <input
                      v-model="formData.title"
                      type="text"
                      required
                      class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter report title"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Report Type *
                    </label>
                    <select
                      v-model="formData.type"
                      required
                      class="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Type</option>
                      <option value="Status Report">Status Report</option>
                      <option value="Financial Report">Financial Report</option>
                      <option value="Progress Report">Progress Report</option>
                      <option value="Risk Report">Risk Report</option>
                      <option value="Quality Report">Quality Report</option>
                      <option value="Milestone Report">Milestone Report</option>
                      <option value="Final Report">Final Report</option>
                    </select>
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
                      Status
                    </label>
                    <select
                      v-model="formData.status"
                      class="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <!-- Dates -->
                  <div class="col-span-2 mt-6">
                    <h4 class="text-md font-medium text-gray-900 mb-4">Report Dates</h4>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Reporting Period Start
                    </label>
                    <input
                      v-model="formData.periodStart"
                      type="date"
                      class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Reporting Period End
                    </label>
                    <input
                      v-model="formData.periodEnd"
                      type="date"
                      class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      v-model="formData.dueDate"
                      type="date"
                      class="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <!-- Content -->
                  <div class="col-span-2 mt-6">
                    <h4 class="text-md font-medium text-gray-900 mb-4">Report Content</h4>
                  </div>
                  
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      v-model="formData.description"
                      rows="3"
                      class="form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter report description..."
                    ></textarea>
                  </div>
                  
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Executive Summary
                    </label>
                    <textarea
                      v-model="formData.executiveSummary"
                      rows="4"
                      class="form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter executive summary..."
                    ></textarea>
                  </div>
                  
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Key Findings
                    </label>
                    <textarea
                      v-model="formData.keyFindings"
                      rows="4"
                      class="form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter key findings..."
                    ></textarea>
                  </div>
                  
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Recommendations
                    </label>
                    <textarea
                      v-model="formData.recommendations"
                      rows="4"
                      class="form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter recommendations..."
                    ></textarea>
                  </div>
                  
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Next Steps
                    </label>
                    <textarea
                      v-model="formData.nextSteps"
                      rows="3"
                      class="form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter next steps..."
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
              {{ saving ? 'Saving...' : (isEditing ? 'Update Report' : 'Create Report') }}
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
import { reportService } from '@/services/reportService';

export default {
  name: 'ReportModal',
  props: {
    report: {
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
    const saving = ref(false);
    
    // Form data
    const formData = reactive({
      title: '',
      type: '',
      projectId: '',
      status: 'Draft',
      periodStart: '',
      periodEnd: '',
      dueDate: '',
      description: '',
      executiveSummary: '',
      keyFindings: '',
      recommendations: '',
      nextSteps: ''
    });
    
    // Computed properties
    const isEditing = computed(() => !!props.report);
    
    // Initialize form data when report prop changes
    watch(() => props.report, (newReport) => {
      if (newReport) {
        Object.assign(formData, {
          title: newReport.title || '',
          type: newReport.type || '',
          projectId: newReport.project_id || '',
          status: newReport.status || 'Draft',
          periodStart: newReport.period_start ? newReport.period_start.split('T')[0] : '',
          periodEnd: newReport.period_end ? newReport.period_end.split('T')[0] : '',
          dueDate: newReport.due_date ? newReport.due_date.split('T')[0] : '',
          description: newReport.description || '',
          executiveSummary: newReport.executive_summary || '',
          keyFindings: newReport.key_findings || '',
          recommendations: newReport.recommendations || '',
          nextSteps: newReport.next_steps || ''
        });
      } else {
        // Reset form for new report
        Object.assign(formData, {
          title: '',
          type: '',
          projectId: '',
          status: 'Draft',
          periodStart: '',
          periodEnd: '',
          dueDate: '',
          description: '',
          executiveSummary: '',
          keyFindings: '',
          recommendations: '',
          nextSteps: ''
        });
      }
    }, { immediate: true });
    
    // Methods
    const saveReport = async () => {
      try {
        saving.value = true;
        
        // Prepare data for API
        const reportData = {
          title: formData.title,
          type: formData.type,
          project_id: formData.projectId,
          status: formData.status,
          period_start: formData.periodStart || null,
          period_end: formData.periodEnd || null,
          due_date: formData.dueDate || null,
          description: formData.description,
          executive_summary: formData.executiveSummary,
          key_findings: formData.keyFindings,
          recommendations: formData.recommendations,
          next_steps: formData.nextSteps
        };
        
        if (isEditing.value) {
          await reportService.updateReport(props.report.id, reportData);
          toast.success('Report updated successfully');
        } else {
          await reportService.createReport(reportData);
          toast.success('Report created successfully');
        }
        
        emit('saved');
      } catch (error) {
        console.error('Error saving report:', error);
        toast.error(error.response?.data?.message || 'Failed to save report');
      } finally {
        saving.value = false;
      }
    };
    
    return {
      formData,
      saving,
      isEditing,
      saveReport
    };
  }
};
</script>

<style scoped>
.form-input, .form-select, .form-textarea {
  @apply block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500;
}
</style>

