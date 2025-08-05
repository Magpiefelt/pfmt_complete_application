<template>
  <div class="enhanced-agenda-manager">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Meeting Agendas</h2>
        <p class="text-gray-600 mt-1">Manage gate meeting agendas and documentation</p>
      </div>
      <button
        @click="showCreateAgendaModal = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Create Agenda
      </button>
    </div>

    <!-- Gate Meeting Info -->
    <div v-if="gateMeeting" class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">{{ gateMeeting.gate_type }}</h3>
          <p class="text-gray-600 mt-1">{{ gateMeeting.description }}</p>
          <div class="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              {{ formatDate(gateMeeting.scheduled_date) }}
            </span>
            <span v-if="gateMeeting.location" class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              {{ gateMeeting.location }}
            </span>
          </div>
        </div>
        <span
          :class="getStatusBadgeClass(gateMeeting.status)"
          class="px-3 py-1 rounded-full text-sm font-medium"
        >
          {{ gateMeeting.status }}
        </span>
      </div>
    </div>

    <!-- Agendas List -->
    <div class="space-y-4">
      <div
        v-for="agenda in agendas"
        :key="agenda.id"
        class="bg-white rounded-lg shadow-sm border"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h4 class="text-lg font-semibold text-gray-900">{{ agenda.title }}</h4>
              <p v-if="agenda.description" class="text-gray-600 mt-1">{{ agenda.description }}</p>
              <div class="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>Created {{ formatDate(agenda.created_at) }} by {{ agenda.created_by_name }}</span>
                <span v-if="agenda.finalized_at" class="text-green-600">
                  Finalized {{ formatDate(agenda.finalized_at) }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                :class="getAgendaStatusClass(agenda.status)"
                class="px-3 py-1 rounded-full text-sm font-medium"
              >
                {{ agenda.status }}
              </span>
              <div class="relative">
                <button
                  @click="toggleAgendaMenu(agenda.id)"
                  class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                  </svg>
                </button>
                <div
                  v-if="activeAgendaMenu === agenda.id"
                  class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10"
                >
                  <div class="py-1">
                    <button
                      @click="editAgenda(agenda)"
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Edit Agenda
                    </button>
                    <button
                      v-if="agenda.status === 'draft'"
                      @click="finalizeAgenda(agenda.id)"
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Finalize Agenda
                    </button>
                    <button
                      @click="duplicateAgenda(agenda)"
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      @click="exportAgenda(agenda)"
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Agenda Items -->
          <div v-if="agenda.items && agenda.items.length > 0" class="space-y-3">
            <h5 class="font-medium text-gray-900">Agenda Items</h5>
            <div class="space-y-2">
              <div
                v-for="item in agenda.items"
                :key="item.id"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  {{ item.item_order }}
                </div>
                <div class="flex-1">
                  <h6 class="font-medium text-gray-900">{{ item.title }}</h6>
                  <div class="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span v-if="item.presenter">Presenter: {{ item.presenter }}</span>
                    <span>{{ item.duration_minutes }} min</span>
                    <span class="capitalize">{{ item.item_type }}</span>
                  </div>
                </div>
                <div v-if="item.notes || item.decision" class="flex gap-2">
                  <span v-if="item.notes" class="w-2 h-2 bg-yellow-400 rounded-full" title="Has notes"></span>
                  <span v-if="item.decision" class="w-2 h-2 bg-green-400 rounded-full" title="Has decision"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Attachments -->
          <div v-if="agenda.attachments && agenda.attachments.length > 0" class="mt-4">
            <h5 class="font-medium text-gray-900 mb-2">Attachments</h5>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="attachment in agenda.attachments"
                :key="attachment.id"
                class="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm"
              >
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
                <span>{{ attachment.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="agendas.length === 0" class="text-center py-12">
      <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No agendas created</h3>
      <p class="text-gray-500 mb-4">Create your first meeting agenda to get started.</p>
      <button
        @click="showCreateAgendaModal = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Create Agenda
      </button>
    </div>

    <!-- Create/Edit Agenda Modal -->
    <Modal v-if="showCreateAgendaModal || editingAgenda" @close="closeAgendaModal">
      <div class="max-w-2xl mx-auto">
        <h3 class="text-xl font-bold text-gray-900 mb-6">
          {{ editingAgenda ? 'Edit Agenda' : 'Create New Agenda' }}
        </h3>
        
        <form @submit.prevent="saveAgenda" class="space-y-6">
          <!-- Basic Info -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                v-model="agendaForm.title"
                type="text"
                required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Gate 2 Design Review Meeting"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                v-model="agendaForm.description"
                rows="3"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the meeting purpose..."
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Template</label>
              <select
                v-model="agendaForm.templateUsed"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Custom Agenda</option>
                <option value="gate_review">Gate Review Template</option>
                <option value="project_kickoff">Project Kickoff Template</option>
                <option value="status_update">Status Update Template</option>
                <option value="closure_review">Closure Review Template</option>
              </select>
            </div>
          </div>

          <!-- Agenda Items -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-lg font-semibold text-gray-900">Agenda Items</h4>
              <button
                type="button"
                @click="addAgendaItem"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Item
              </button>
            </div>
            
            <div class="space-y-3">
              <div
                v-for="(item, index) in agendaForm.agendaItems"
                :key="index"
                class="border border-gray-200 rounded-lg p-4"
              >
                <div class="flex justify-between items-start mb-3">
                  <h5 class="font-medium text-gray-900">Item {{ index + 1 }}</h5>
                  <button
                    type="button"
                    @click="removeAgendaItem(index)"
                    class="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      v-model="item.title"
                      type="text"
                      required
                      class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Agenda item title"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Presenter</label>
                    <input
                      v-model="item.presenter"
                      type="text"
                      class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Presenter name"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <input
                      v-model.number="item.duration_minutes"
                      type="number"
                      min="5"
                      max="120"
                      class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      v-model="item.item_type"
                      class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="presentation">Presentation</option>
                      <option value="discussion">Discussion</option>
                      <option value="decision">Decision</option>
                      <option value="information">Information</option>
                    </select>
                  </div>
                  
                  <div class="col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      v-model="item.description"
                      rows="2"
                      class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="closeAgendaModal"
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {{ editingAgenda ? 'Update Agenda' : 'Create Agenda' }}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
</template>

<script>
import Modal from '../shared/Modal.vue';

export default {
  name: 'EnhancedAgendaManager',
  components: {
    Modal
  },
  props: {
    gateMeetingId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      agendas: [],
      gateMeeting: null,
      loading: false,
      showCreateAgendaModal: false,
      editingAgenda: null,
      activeAgendaMenu: null,
      agendaForm: {
        title: '',
        description: '',
        templateUsed: '',
        agendaItems: []
      }
    };
  },
  async mounted() {
    await this.loadGateMeeting();
    await this.loadAgendas();
    // Close menu when clicking outside
    document.addEventListener('click', this.closeMenus);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeMenus);
  },
  methods: {
    async loadGateMeeting() {
      try {
        const response = await fetch(`/api/gate-meetings/${this.gateMeetingId}`, {
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.gateMeeting = data.data;
        }
      } catch (error) {
        console.error('Error loading gate meeting:', error);
      }
    },

    async loadAgendas() {
      try {
        this.loading = true;
        const response = await fetch(`/api/phase2/gate-meetings/${this.gateMeetingId}/agendas`, {
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.agendas = data.data;
        }
      } catch (error) {
        console.error('Error loading agendas:', error);
      } finally {
        this.loading = false;
      }
    },

    async saveAgenda() {
      try {
        const url = this.editingAgenda 
          ? `/api/phase2/gate-meetings/${this.gateMeetingId}/agendas/${this.editingAgenda.id}`
          : `/api/phase2/gate-meetings/${this.gateMeetingId}/agendas`;
          
        const method = this.editingAgenda ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$store.getters.token}`
          },
          body: JSON.stringify(this.agendaForm)
        });
        
        if (response.ok) {
          this.$toast.success(this.editingAgenda ? 'Agenda updated successfully' : 'Agenda created successfully');
          this.closeAgendaModal();
          await this.loadAgendas();
        } else {
          throw new Error('Failed to save agenda');
        }
      } catch (error) {
        console.error('Error saving agenda:', error);
        this.$toast.error('Failed to save agenda');
      }
    },

    async finalizeAgenda(agendaId) {
      try {
        const response = await fetch(`/api/phase2/agendas/${agendaId}/finalize`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          this.$toast.success('Agenda finalized successfully');
          await this.loadAgendas();
        } else {
          throw new Error('Failed to finalize agenda');
        }
      } catch (error) {
        console.error('Error finalizing agenda:', error);
        this.$toast.error('Failed to finalize agenda');
      }
    },

    editAgenda(agenda) {
      this.editingAgenda = agenda;
      this.agendaForm = {
        title: agenda.title,
        description: agenda.description || '',
        templateUsed: agenda.template_used || '',
        agendaItems: agenda.items || []
      };
      this.activeAgendaMenu = null;
    },

    duplicateAgenda(agenda) {
      this.agendaForm = {
        title: `${agenda.title} (Copy)`,
        description: agenda.description || '',
        templateUsed: agenda.template_used || '',
        agendaItems: [...(agenda.items || [])]
      };
      this.showCreateAgendaModal = true;
      this.activeAgendaMenu = null;
    },

    exportAgenda(agenda) {
      // Implementation for PDF export
      this.$toast.info('PDF export functionality coming soon');
      this.activeAgendaMenu = null;
    },

    addAgendaItem() {
      this.agendaForm.agendaItems.push({
        title: '',
        description: '',
        presenter: '',
        duration_minutes: 15,
        item_type: 'discussion'
      });
    },

    removeAgendaItem(index) {
      this.agendaForm.agendaItems.splice(index, 1);
    },

    closeAgendaModal() {
      this.showCreateAgendaModal = false;
      this.editingAgenda = null;
      this.agendaForm = {
        title: '',
        description: '',
        templateUsed: '',
        agendaItems: []
      };
    },

    toggleAgendaMenu(agendaId) {
      this.activeAgendaMenu = this.activeAgendaMenu === agendaId ? null : agendaId;
    },

    closeMenus() {
      this.activeAgendaMenu = null;
    },

    getStatusBadgeClass(status) {
      const classes = {
        'Scheduled': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Completed': 'bg-green-100 text-green-800',
        'Cancelled': 'bg-red-100 text-red-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    },

    getAgendaStatusClass(status) {
      const classes = {
        'draft': 'bg-gray-100 text-gray-800',
        'finalized': 'bg-green-100 text-green-800',
        'distributed': 'bg-blue-100 text-blue-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.enhanced-agenda-manager {
  @apply space-y-6;
}
</style>

