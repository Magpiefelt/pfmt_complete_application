<template>
  <div class="project-versions-manager">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Project Versions</h2>
        <p class="text-gray-600 mt-1">Manage project drafts, reviews, and approvals</p>
      </div>
      <button
        @click="createNewVersion"
        :disabled="!canCreateDraft && !hasDraftVersion"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        {{ hasDraftVersion ? 'Update Draft' : 'Create New Version' }}
      </button>
    </div>

    <!-- Current Version Banner -->
    <div v-if="currentVersion" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-green-900">Current Version: {{ currentVersion.version_number }}</h3>
          <p class="text-green-700 text-sm">
            Approved {{ formatDate(currentVersion.approved_at) }} by {{ currentVersion.approved_by_name }}
          </p>
        </div>
      </div>
    </div>

    <!-- Draft Version Banner -->
    <div v-if="draftVersion" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-blue-900">Draft Version: {{ draftVersion.version_number }}</h3>
            <p class="text-blue-700 text-sm">
              Created {{ formatDate(draftVersion.created_at) }} by {{ draftVersion.created_by_name }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button
            v-if="canSubmitForApproval"
            @click="submitForApproval(draftVersion.id)"
            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Submit for Approval
          </button>
        </div>
      </div>
    </div>

    <!-- Pending Approval Banner -->
    <div v-if="pendingApprovalVersion" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-yellow-900">Pending Approval: {{ pendingApprovalVersion.version_number }}</h3>
            <p class="text-yellow-700 text-sm">
              Submitted {{ formatDate(pendingApprovalVersion.submitted_at) }} by {{ pendingApprovalVersion.submitted_by_name }}
            </p>
          </div>
        </div>
        <div v-if="canApprove" class="flex items-center space-x-2">
          <button
            @click="approveVersion(pendingApprovalVersion.id)"
            class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Approve
          </button>
          <button
            @click="showRejectModal(pendingApprovalVersion.id)"
            class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    </div>

    <!-- Versions List -->
    <div class="bg-white rounded-lg shadow-sm border">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Version History</h3>
      </div>
      
      <div class="divide-y divide-gray-200">
        <div
          v-for="version in versions"
          :key="version.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <!-- Status Badge -->
              <span
                :class="getStatusBadgeClass(version.status)"
                class="px-3 py-1 rounded-full text-sm font-medium"
              >
                {{ version.status }}
              </span>
              
              <!-- Version Info -->
              <div>
                <h4 class="font-semibold text-gray-900">
                  Version {{ version.version_number }}
                  <span v-if="version.is_current" class="text-green-600 text-sm ml-2">(Current)</span>
                </h4>
                <p class="text-gray-600 text-sm">
                  Created {{ formatDate(version.created_at) }} by {{ version.created_by_name }}
                </p>
                <p v-if="version.change_summary" class="text-gray-700 text-sm mt-1">
                  {{ version.change_summary }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <!-- Compare Button -->
              <button
                v-if="!version.is_current && currentVersion"
                @click="compareVersions(currentVersion.id, version.id)"
                class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-200 hover:border-blue-300 text-sm transition-colors"
              >
                Compare
              </button>
              
              <!-- Submit for Approval -->
              <button
                v-if="version.status === 'Draft' && canSubmitForApproval"
                @click="submitForApproval(version.id)"
                class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Submit for Approval
              </button>
              
              <!-- Approve/Reject -->
              <div v-if="version.status === 'PendingApproval' && canApprove" class="flex gap-2">
                <button
                  @click="approveVersion(version.id)"
                  class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Approve
                </button>
                <button
                  @click="showRejectModal(version.id)"
                  class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Reject
                </button>
              </div>
              
              <!-- View Details -->
              <button
                @click="viewVersionDetails(version)"
                class="text-gray-600 hover:text-gray-800 px-3 py-1 rounded border border-gray-200 hover:border-gray-300 text-sm transition-colors"
              >
                View Details
              </button>
            </div>
          </div>

          <!-- Rejection Reason -->
          <div v-if="version.status === 'Rejected' && version.rejection_reason" class="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <p class="text-red-800 text-sm">
              <strong>Rejection Reason:</strong> {{ version.rejection_reason }}
            </p>
            <p class="text-red-600 text-xs mt-1">
              Rejected {{ formatDate(version.rejected_at) }} by {{ version.rejected_by_name }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Version Comparison Modal -->
    <Modal v-if="showComparisonModal" @close="showComparisonModal = false">
      <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-900">Version Comparison</h3>
          <button
            @click="showComparisonModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div v-if="versionComparison" class="space-y-4">
          <!-- Comparison Header -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-900">Current Version</h4>
              <p class="text-blue-700">{{ versionComparison.currentVersion.version_number }}</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-semibold text-gray-900">Comparing Version</h4>
              <p class="text-gray-700">{{ versionComparison.compareVersion.version_number }}</p>
            </div>
          </div>

          <!-- Differences -->
          <div class="space-y-3">
            <h4 class="font-semibold text-gray-900">Changes</h4>
            <div v-if="versionComparison.differences.length === 0" class="text-gray-500 text-center py-8">
              No differences found between these versions.
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="diff in versionComparison.differences"
                :key="diff.field"
                class="border rounded-lg p-4"
                :class="getDiffClass(diff.changeType)"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h5 class="font-medium text-gray-900">{{ diff.fieldLabel }}</h5>
                    <div class="mt-2 space-y-1">
                      <div v-if="diff.changeType !== 'added'" class="text-sm">
                        <span class="text-gray-500">Previous:</span>
                        <span class="ml-2 text-red-600">{{ diff.oldValue || '(empty)' }}</span>
                      </div>
                      <div v-if="diff.changeType !== 'removed'" class="text-sm">
                        <span class="text-gray-500">Current:</span>
                        <span class="ml-2 text-green-600">{{ diff.newValue || '(empty)' }}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    :class="getChangeTypeBadgeClass(diff.changeType)"
                    class="px-2 py-1 rounded text-xs font-medium"
                  >
                    {{ diff.changeType }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Rejection Modal -->
    <Modal v-if="showRejectVersionModal" @close="showRejectVersionModal = false">
      <div class="max-w-md mx-auto">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Reject Version</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason
            </label>
            <textarea
              v-model="rejectionReason"
              rows="4"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please provide a reason for rejecting this version..."
            ></textarea>
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="showRejectVersionModal = false"
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="rejectVersion"
              :disabled="!rejectionReason.trim()"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reject Version
            </button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import Modal from '../shared/Modal.vue';

export default {
  name: 'ProjectVersionsManager',
  components: {
    Modal
  },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      versions: [],
      currentVersion: null,
      loading: false,
      showComparisonModal: false,
      showRejectVersionModal: false,
      versionComparison: null,
      rejectionReason: '',
      versionToReject: null
    };
  },
  computed: {
    canSubmitForApproval() {
      // Check user permissions
      return this.$store.getters.userRole !== 'Vendor';
    },
    canApprove() {
      // Check if user can approve versions
      const role = this.$store.getters.userRole;
      return ['SPM', 'Director', 'Admin'].includes(role);
    },
    // Dual version system computed properties
    approvedVersion() {
      return this.versions.find(v => v.is_current && v.status === 'Approved');
    },
    draftVersion() {
      return this.versions.find(v => v.status === 'Draft');
    },
    hasDraftVersion() {
      return !!this.draftVersion;
    },
    canCreateDraft() {
      // Can only create draft if no draft exists
      return !this.hasDraftVersion && this.canSubmitForApproval;
    },
    pendingApprovalVersion() {
      return this.versions.find(v => v.status === 'PendingApproval');
    },
    hasPendingApproval() {
      return !!this.pendingApprovalVersion;
    }
  },
  async mounted() {
    await this.loadVersions();
  },
  methods: {
    async loadVersions() {
      try {
        this.loading = true;
        const response = await fetch(`/api/phase2/projects/${this.projectId}/versions`, {
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.versions = data.data;
          this.currentVersion = this.versions.find(v => v.is_current);
        }
      } catch (error) {
        console.error('Error loading versions:', error);
        this.$toast.error('Failed to load project versions');
      } finally {
        this.loading = false;
      }
    },

    async createNewVersion() {
      try {
        // Check if draft already exists
        if (this.hasDraftVersion) {
          const confirmMerge = confirm('A draft version already exists. Do you want to update it with current project data?');
          if (confirmMerge) {
            await this.updateExistingDraft();
          }
          return;
        }

        // Get current project data
        const projectResponse = await fetch(`/api/projects/${this.projectId}`, {
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project data');
        }
        
        const projectData = await projectResponse.json();
        const project = projectData.data;
        
        // Create new version with current project data
        const versionData = {
          versionNumber: this.getNextVersionNumber(),
          dataSnapshot: {
            project_name: project.project_name,
            description: project.description,
            project_category: project.project_category,
            total_budget: project.total_budget,
            current_budget: project.current_budget,
            project_status: project.project_status
          },
          changeSummary: 'New draft version created'
        };
        
        const response = await fetch(`/api/phase2/projects/${this.projectId}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$store.getters.token}`
          },
          body: JSON.stringify(versionData)
        });
        
        if (response.ok) {
          this.$toast.success('New draft version created successfully');
          await this.loadVersions();
        } else {
          throw new Error('Failed to create version');
        }
      } catch (error) {
        console.error('Error creating version:', error);
        this.$toast.error('Failed to create new version');
      }
    },

    async updateExistingDraft() {
      try {
        // Get current project data
        const projectResponse = await fetch(`/api/projects/${this.projectId}`, {
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project data');
        }
        
        const projectData = await projectResponse.json();
        const project = projectData.data;
        
        // Update existing draft with current project data
        const updateData = {
          dataSnapshot: {
            project_name: project.project_name,
            description: project.description,
            project_category: project.project_category,
            total_budget: project.total_budget,
            current_budget: project.current_budget,
            project_status: project.project_status
          },
          changeSummary: 'Draft updated with current project data'
        };
        
        const response = await fetch(`/api/phase2/versions/${this.draftVersion.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$store.getters.token}`
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          this.$toast.success('Draft version updated successfully');
          await this.loadVersions();
        } else {
          throw new Error('Failed to update draft');
        }
      } catch (error) {
        console.error('Error updating draft:', error);
        this.$toast.error('Failed to update draft version');
      }
    },

    async submitForApproval(versionId) {
      try {
        const response = await fetch(`/api/phase2/versions/${versionId}/submit`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          this.$toast.success('Version submitted for approval');
          await this.loadVersions();
        } else {
          throw new Error('Failed to submit version');
        }
      } catch (error) {
        console.error('Error submitting version:', error);
        this.$toast.error('Failed to submit version for approval');
      }
    },

    async approveVersion(versionId) {
      try {
        const response = await fetch(`/api/phase2/versions/${versionId}/approve`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          this.$toast.success('Version approved successfully');
          await this.loadVersions();
        } else {
          throw new Error('Failed to approve version');
        }
      } catch (error) {
        console.error('Error approving version:', error);
        this.$toast.error('Failed to approve version');
      }
    },

    showRejectModal(versionId) {
      this.versionToReject = versionId;
      this.rejectionReason = '';
      this.showRejectVersionModal = true;
    },

    async rejectVersion() {
      try {
        const response = await fetch(`/api/phase2/versions/${this.versionToReject}/reject`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$store.getters.token}`
          },
          body: JSON.stringify({
            rejectionReason: this.rejectionReason
          })
        });
        
        if (response.ok) {
          this.$toast.success('Version rejected');
          this.showRejectVersionModal = false;
          await this.loadVersions();
        } else {
          throw new Error('Failed to reject version');
        }
      } catch (error) {
        console.error('Error rejecting version:', error);
        this.$toast.error('Failed to reject version');
      }
    },

    async compareVersions(currentVersionId, compareVersionId) {
      try {
        const response = await fetch(
          `/api/phase2/projects/${this.projectId}/versions/compare?currentVersionId=${currentVersionId}&compareVersionId=${compareVersionId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.$store.getters.token}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          this.versionComparison = data.data;
          this.showComparisonModal = true;
        } else {
          throw new Error('Failed to compare versions');
        }
      } catch (error) {
        console.error('Error comparing versions:', error);
        this.$toast.error('Failed to compare versions');
      }
    },

    viewVersionDetails(version) {
      // Emit event to parent component to show version details
      this.$emit('view-version-details', version);
    },

    getNextVersionNumber() {
      if (this.versions.length === 0) return '1.0';
      
      const versionNumbers = this.versions.map(v => parseFloat(v.version_number));
      const maxVersion = Math.max(...versionNumbers);
      return (maxVersion + 0.1).toFixed(1);
    },

    getStatusBadgeClass(status) {
      const classes = {
        'Draft': 'bg-gray-100 text-gray-800',
        'PendingApproval': 'bg-yellow-100 text-yellow-800',
        'Approved': 'bg-green-100 text-green-800',
        'Rejected': 'bg-red-100 text-red-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    },

    getDiffClass(changeType) {
      const classes = {
        'added': 'border-green-200 bg-green-50',
        'modified': 'border-blue-200 bg-blue-50',
        'removed': 'border-red-200 bg-red-50'
      };
      return classes[changeType] || 'border-gray-200 bg-gray-50';
    },

    getChangeTypeBadgeClass(changeType) {
      const classes = {
        'added': 'bg-green-100 text-green-800',
        'modified': 'bg-blue-100 text-blue-800',
        'removed': 'bg-red-100 text-red-800'
      };
      return classes[changeType] || 'bg-gray-100 text-gray-800';
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
.project-versions-manager {
  @apply space-y-6;
}
</style>

