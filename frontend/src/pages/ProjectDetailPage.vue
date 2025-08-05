<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <ErrorMessage 
      v-else-if="error" 
      :message="`Failed to load project: ${error}`"
      @retry="loadProject"
    />

    <!-- Project Detail Content -->
    <div v-else-if="project" class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Button variant="outline" size="sm" @click="$router.back()">
            <ArrowLeft class="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <AlbertaText tag="h1" size="heading-xl" mb="xs">{{ project.name }}</AlbertaText>
            <AlbertaText color="secondary" mb="xs">{{ project.contractor }} • {{ project.phase }}</AlbertaText>
            <!-- Version Status Indicator -->
            <div class="flex items-center space-x-2 mt-1">
              <AlbertaText size="body-s" color="secondary">Version:</AlbertaText>
              <AlbertaText size="body-s">v1.0</AlbertaText>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Current
              </span>
              <!-- Draft/Approved View Toggle -->
              <div v-if="hasDraftVersion && canViewDraft" class="flex items-center space-x-2 ml-4">
                <span class="text-xs text-gray-500">View:</span>
                <div class="flex bg-gray-100 rounded-lg p-1">
                  <button
                    @click="viewMode = 'approved'"
                    :class="viewMode === 'approved' ? 'bg-white shadow-sm' : 'text-gray-600'"
                    class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                  >
                    Approved
                  </button>
                  <button
                    @click="viewMode = 'draft'"
                    :class="viewMode === 'draft' ? 'bg-white shadow-sm' : 'text-gray-600'"
                    class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                  >
                    Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload class="h-4 w-4 mr-2" />
            Upload PFMT Data
          </Button>
          <!-- Enhanced Edit Button with Versioning -->
          <Button 
            @click="handleCreateDraft"
            variant="outline" 
            size="sm"
          >
            <Edit class="h-4 w-4 mr-2" />
            Create Draft
          </Button>
        </div>
      </div>

      <!-- Project Tabs -->
      <Tabs default-value="overview" class="w-full">
        <TabsList class="grid w-full grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="budget">
            <div class="flex items-center space-x-1">
              <span>Budget</span>
              <span class="inline-flex items-center justify-center w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="workflow">
            <div class="flex items-center space-x-1">
              <span>Workflow</span>
              <span class="inline-flex items-center justify-center w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="versions">
            <div class="flex items-center space-x-1">
              <span>Versions</span>
              <span class="inline-flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>
          </TabsTrigger>
        </TabsList>

        <!-- Overview Tab -->
        <TabsContent value="overview" class="space-y-6">
          <!-- Project Information -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Building class="h-5 w-5" />
                <AlbertaText tag="h3" variant="heading-m" color="primary">Project Information</AlbertaText>
              </CardTitle>
              <CardDescription>
                <AlbertaText variant="body-s" color="secondary">Basic project information and specifications</AlbertaText>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700">Project Name *</label>
                  <input 
                    type="text" 
                    :value="project.name" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Client Ministry</label>
                  <input 
                    type="text" 
                    :value="project.clientMinistry || 'Education'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="text-sm font-medium text-gray-700">Description</label>
                  <textarea 
                    :value="project.description" 
                    disabled
                    rows="3"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Project Category</label>
                  <input 
                    type="text" 
                    :value="project.category || 'Education'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Delivery Type</label>
                  <input 
                    type="text" 
                    :value="project.deliveryType || 'In-service project'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Financial Information -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <DollarSign class="h-5 w-5" />
                <AlbertaText tag="h3" variant="heading-m" color="primary">Financial Information</AlbertaText>
              </CardTitle>
              <CardDescription>
                <AlbertaText variant="body-s" color="secondary">Budget, funding, and financial targets</AlbertaText>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700">Total Budget</label>
                  <div class="relative mt-1">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      :value="formatNumber(project.totalBudget || 2450000)" 
                      disabled
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500 pl-8"
                    />
                  </div>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Amount Spent</label>
                  <div class="relative mt-1">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      :value="formatNumber(project.amountSpent || 1680000)" 
                      disabled
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500 pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Details Tab -->
        <TabsContent value="details" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <AlbertaText tag="h3" variant="heading-m" color="primary">Project Information</AlbertaText>
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium">Project Name</Label>
                  <p class="text-sm text-muted-foreground">{{ project.name }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Description</Label>
                  <p class="text-sm text-muted-foreground">{{ project.description }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Contractor</Label>
                  <p class="text-sm text-muted-foreground">{{ project.contractor }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Phase</Label>
                  <p class="text-sm text-muted-foreground">{{ project.phase }}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Location Tab -->
        <TabsContent value="location" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <AlbertaText tag="h3" variant="heading-m" color="primary">Location Information</AlbertaText>
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium">Region</Label>
                  <p class="text-sm text-muted-foreground">{{ project.region }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Province</Label>
                  <p class="text-sm text-muted-foreground">Alberta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Vendors Tab -->
        <TabsContent value="vendors" class="space-y-6">
          <VendorPerformanceTracker :project-id="project.id" />
        </TabsContent>

        <!-- Milestones Tab -->
        <TabsContent value="milestones" class="space-y-6">
          <ProjectMilestones @submitVersionForApproval="handleVersionSubmission" />
        </TabsContent>

        <!-- NEW: Versions Tab -->
        <TabsContent value="versions" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center justify-between">
                <span>Project Versions</span>
                <Button 
                  @click="handleCreateDraft" 
                  size="sm"
                  :disabled="!canCreateDraft || loading"
                >
                  <Plus class="h-4 w-4 mr-2" />
                  Create Draft
                </Button>
              </CardTitle>
              <CardDescription>
                Manage project versions, create drafts, and track approval workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <!-- Loading State -->
              <div v-if="loading" class="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>

              <!-- Version History -->
              <div v-else-if="versions.length > 0" class="space-y-4">
                <div 
                  v-for="version in versions" 
                  :key="version.projectVersionId"
                  :class="[
                    'border rounded-lg p-4',
                    version.status === 'Approved' ? 'bg-green-50 border-green-200' :
                    version.status === 'Draft' ? 'bg-amber-50 border-amber-200' :
                    version.status === 'PendingApproval' ? 'bg-blue-50 border-blue-200' :
                    'bg-red-50 border-red-200'
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 :class="[
                        'font-medium',
                        version.status === 'Approved' ? 'text-green-900' :
                        version.status === 'Draft' ? 'text-amber-900' :
                        version.status === 'PendingApproval' ? 'text-blue-900' :
                        'text-red-900'
                      ]">
                        Version {{ version.versionNumber }} 
                        <span v-if="version.status === 'Approved'">(Current)</span>
                        <span v-else-if="version.status === 'Draft'">(Draft)</span>
                        <span v-else-if="version.status === 'PendingApproval'">(Pending Approval)</span>
                        <span v-else>({{ version.status }})</span>
                      </h4>
                      <p :class="[
                        'text-sm',
                        version.status === 'Approved' ? 'text-green-700' :
                        version.status === 'Draft' ? 'text-amber-700' :
                        version.status === 'PendingApproval' ? 'text-blue-700' :
                        'text-red-700'
                      ]">
                        <span v-if="version.status === 'Approved' && version.approvedAt">
                          Approved on {{ formatDate(version.approvedAt) }}
                        </span>
                        <span v-else-if="version.status === 'PendingApproval' && version.submittedAt">
                          Submitted on {{ formatDate(version.submittedAt) }}
                        </span>
                        <span v-else>
                          Created on {{ formatDate(version.createdAt) }}
                        </span>
                      </p>
                      <p :class="[
                        'text-sm',
                        version.status === 'Approved' ? 'text-green-600' :
                        version.status === 'Draft' ? 'text-amber-600' :
                        version.status === 'PendingApproval' ? 'text-blue-600' :
                        'text-red-600'
                      ]">
                        Created by User {{ version.createdBy }}
                      </p>
                      <p v-if="version.rejectionReason" class="text-sm text-red-600 mt-1">
                        Rejection reason: {{ version.rejectionReason }}
                      </p>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span :class="[
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        version.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        version.status === 'Draft' ? 'bg-amber-100 text-amber-800' :
                        version.status === 'PendingApproval' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      ]">
                        {{ version.status }}
                      </span>
                      
                      <!-- Action Buttons -->
                      <Button 
                        variant="outline" 
                        size="sm" 
                        @click="handleViewVersion"
                        v-if="version.status === 'Approved'"
                      >
                        View
                      </Button>
                      
                      <template v-if="version.status === 'Draft'">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          @click="handleEditDraft"
                          :disabled="loading"
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          @click="handleSubmitDraft"
                          :disabled="loading"
                        >
                          Submit for Approval
                        </Button>
                      </template>
                      
                      <template v-if="version.status === 'PendingApproval' && canApprove">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          @click="handleApproveVersion(version.projectVersionId)"
                          :disabled="loading"
                          class="text-green-600 hover:text-green-700"
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          @click="handleRejectVersion(version.projectVersionId, 'Needs revision')"
                          :disabled="loading"
                          class="text-red-600 hover:text-red-700"
                        >
                          Reject
                        </Button>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State for New Projects -->
              <div v-else class="text-center py-8">
                <div class="text-gray-400 mb-4">
                  <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No versions yet</h3>
                <p class="text-gray-600 mb-4">Create your first draft to start managing project versions.</p>
                <Button 
                  @click="handleCreateDraft"
                  :disabled="!canCreateDraft || loading"
                >
                  <Plus class="h-4 w-4 mr-2" />
                  Create First Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Budget Tab -->
        <TabsContent value="budget" class="space-y-6">
          <BudgetManager :project-id="project.id" />
        </TabsContent>

        <!-- Reports Tab -->
        <TabsContent value="reports" class="space-y-6">
          <!-- Phase 3: Enhanced Financial Summary -->
          <ProjectFinancialSummary :project-id="project.id" />
          
          <!-- Phase 1: Original Reporting Dashboard -->
          <Phase1ReportingDashboard :project-id="project.id" />
        </TabsContent>

        <!-- Workflow Tab -->
        <TabsContent value="workflow" class="space-y-6">
          <!-- Guidance Notifications -->
          <GuidanceNotifications :project-id="project.id" />
          
          <!-- Project Versions Manager -->
          <ProjectVersionsManager :project-id="project.id" @view-version-details="viewVersionDetails" />
          
          <!-- Enhanced Gate Meetings -->
          <EnhancedGateMeetings :project-id="project.id" />
        </TabsContent>

        <!-- Calendar Tab -->
        <TabsContent value="calendar" class="space-y-6">
          <FiscalYearCalendar :project-id="project.id" />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Version Edit Modal -->
    <div v-if="showVersionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            {{ editingVersion ? `Edit Version ${editingVersion.versionNumber}` : 'View Version' }}
          </h3>
          <button @click="closeVersionModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <!-- Version Status -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">Version 1.1</h4>
                <p class="text-sm text-gray-600">Status: Draft</p>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="handleSubmitVersion"
                  class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Submit for Approval
                </button>
                <button
                  @click="closeVersionModal"
                  class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          
          <!-- Editable Fields -->
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Project Name</label>
                <input 
                  v-model="draftData.name"
                  type="text" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Category</label>
                <input 
                  v-model="draftData.category"
                  type="text" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  v-model="draftData.description"
                  rows="3"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Total Budget</label>
                <input 
                  v-model.number="draftData.totalBudget"
                  type="number" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Current Budget</label>
                <input 
                  v-model.number="draftData.currentBudget"
                  type="number" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button
                @click="closeVersionModal"
                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                @click="handleSaveVersion"
                class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Upload, Edit, Building, DollarSign, Plus } from 'lucide-vue-next'
import { Button, AlbertaText } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { Label } from '@/components/ui'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import ErrorMessage from '@/components/shared/ErrorMessage.vue'
import FiscalYearCalendar from '@/components/workflow/FiscalYearCalendar.vue'
import PMICalendar from '@/components/fiscal-calendar/PMICalendar.vue'
import AgendaGenerator from '@/components/workflow/AgendaGenerator.vue'
import BudgetManager from '@/components/financial/BudgetManager.vue'
import Phase1ReportingDashboard from '@/components/financial/Phase1ReportingDashboard.vue'
import ProjectFinancialSummary from '@/components/financial/ProjectFinancialSummary.vue'
import ContractFinancialRollup from '@/components/financial/ContractFinancialRollup.vue'
import EnhancedGateMeetings from '@/components/workflow/EnhancedGateMeetings.vue'
import ProjectMilestones from '@/components/workflow/ProjectMilestones.vue'
import VendorPerformanceTracker from '@/components/vendors/VendorPerformanceTracker.vue'
import ProjectVersionsManager from '@/components/workflow/ProjectVersionsManager.vue'
import GuidanceNotifications from '@/components/workflow/GuidanceNotifications.vue'
import { formatCurrency, formatDate, formatNumber } from '@/utils'
import { useProjectVersions } from '@/composables/useProjectVersions'

const route = useRoute()
const projectId = computed(() => parseInt(route.params.id as string))

// View mode for draft/approved toggle
const viewMode = ref('approved')

// Use the project versions composable
const {
  loading,
  error,
  currentProject,
  versions,
  canCreateDraft,
  canApprove,
  hasDraftVersion,
  latestDraft,
  getProject,
  getVersionHistory,
  createDraftVersion,
  updateDraftVersion,
  submitForApproval,
  approveVersion,
  rejectVersion
} = useProjectVersions()

// Project data computed from currentProject
const project = computed(() => {
  if (!currentProject.value) return null
  
  // Get data based on view mode
  let dataSource = currentProject.value.currentVersion
  
  if (viewMode.value === 'draft' && latestDraft.value) {
    // Use draft data if in draft view mode and draft exists
    dataSource = latestDraft.value.version_data
  }
  
  if (!dataSource) return null
  
  return {
    id: currentProject.value.project.id,
    name: dataSource.name || dataSource.project_name,
    description: dataSource.description,
    contractor: "ABC Construction Ltd.", // Default for demo
    phase: dataSource.projectPhase || "Construction",
    region: dataSource.region || "Calgary",
    projectManager: "Sarah Johnson", // Default for demo
    startDate: "2024-01-15", // Default for demo
    expectedCompletion: "2024-12-15", // Default for demo
    totalBudget: dataSource.totalApprovedFunding || dataSource.total_budget,
    amountSpent: dataSource.amountSpent,
    category: dataSource.category || dataSource.project_category,
    projectType: "Renovation", // Default for demo
    deliveryMethod: "Design-Build", // Default for demo
    clientMinistry: dataSource.ministry || "Education",
    deliveryType: "In-service project" // Default for demo
  }
})

// View mode computed properties
const canViewDraft = computed(() => {
  // Only PMs, SPMs, and assigned team members can view drafts
  return canCreateDraft.value || canApprove.value
})

const isViewingDraft = computed(() => {
  return viewMode.value === 'draft' && hasDraftVersion.value
})

const currentViewLabel = computed(() => {
  return isViewingDraft.value ? 'Draft View' : 'Approved View'
})

// Modal state
const showVersionModal = ref(false)
const editingVersion = ref<any>(null)
const modalMode = ref<'create' | 'edit' | 'view'>('view')

// Workflow and Calendar state
const showAgendaGenerator = ref(false)
const activeCalendarView = ref<'fiscal' | 'pmi'>('fiscal')
const currentWorkflowState = ref<string>('')
const workflowHistory = ref<any[]>([])
const recentAgendas = ref<any[]>([])
const currentGateMeetingId = ref<string | null>(null)

// Draft data for editing
const draftData = ref({
  name: '',
  category: '',
  description: '',
  totalBudget: 0,
  currentBudget: 0
})

// Load project data
const loadProject = async () => {
  if (!projectId.value) return
  
  try {
    console.log('Loading project with ID:', projectId.value)
    
    // Get project from versioning API
    await getProject(projectId.value)
    await getVersionHistory(projectId.value)
    
    console.log('Project loaded:', currentProject.value)
    
  } catch (err: any) {
    console.error('Error loading project:', err)
    error.value = err.message
  }
}

// Initialize draft data when project loads
watch(project, (newProject) => {
  if (newProject) {
    draftData.value = {
      name: newProject.name,
      category: newProject.category,
      description: newProject.description,
      totalBudget: newProject.totalBudget,
      currentBudget: newProject.totalBudget
    }
  }
}, { immediate: true })

// Versioning handlers
const handleCreateDraft = async () => {
  console.log('Creating new draft version...')
  modalMode.value = 'create'
  
  try {
    if (!hasDraftVersion.value) {
      // Create a new draft version via API
      const newDraft = await createDraftVersion(projectId.value)
      editingVersion.value = newDraft
    } else {
      // Use existing draft
      editingVersion.value = latestDraft.value
    }
    
    // Initialize draft data
    if (project.value) {
      draftData.value = {
        name: project.value.name,
        category: project.value.category,
        description: project.value.description,
        totalBudget: project.value.totalBudget,
        currentBudget: project.value.totalBudget
      }
    }
    
    showVersionModal.value = true
  } catch (err: any) {
    console.error('Error creating draft:', err)
    alert(`Error creating draft: ${err.message}`)
  }
}

const handleEditDraft = () => {
  console.log('Editing existing draft...')
  modalMode.value = 'edit'
  editingVersion.value = latestDraft.value
  
  if (editingVersion.value) {
    draftData.value = {
      name: editingVersion.value.name,
      category: editingVersion.value.category,
      description: editingVersion.value.description,
      totalBudget: editingVersion.value.totalApprovedFunding,
      currentBudget: editingVersion.value.currentBudget
    }
  }
  
  showVersionModal.value = true
}

const handleViewVersion = () => {
  console.log('Viewing version...')
  modalMode.value = 'view'
  editingVersion.value = versions.value.find(v => v.status === 'Approved')
  
  if (editingVersion.value) {
    draftData.value = {
      name: editingVersion.value.name,
      category: editingVersion.value.category,
      description: editingVersion.value.description,
      totalBudget: editingVersion.value.totalApprovedFunding,
      currentBudget: editingVersion.value.currentBudget
    }
  }
  
  showVersionModal.value = true
}

const handleSubmitDraft = async () => {
  console.log('Submitting draft for approval...')
  
  if (!latestDraft.value) {
    alert('No draft version found to submit')
    return
  }
  
  try {
    await submitForApproval(projectId.value, latestDraft.value.projectVersionId)
    alert('Draft submitted for approval successfully!')
  } catch (err: any) {
    console.error('Error submitting draft:', err)
    alert(`Error submitting draft: ${err.message}`)
  }
}

const handleSaveVersion = async () => {
  console.log('Saving version changes...', draftData.value)
  
  if (!editingVersion.value) {
    alert('No version selected for editing')
    return
  }
  
  try {
    const updateData = {
      name: draftData.value.name,
      category: draftData.value.category,
      description: draftData.value.description,
      totalApprovedFunding: draftData.value.totalBudget,
      currentBudget: draftData.value.currentBudget
    }
    
    await updateDraftVersion(projectId.value, editingVersion.value.projectVersionId, updateData)
    alert('Version saved successfully!')
    closeVersionModal()
  } catch (err: any) {
    console.error('Error saving version:', err)
    alert(`Error saving version: ${err.message}`)
  }
}

const handleSubmitVersion = async () => {
  console.log('Submitting version for approval...')
  
  if (!editingVersion.value) {
    alert('No version selected for submission')
    return
  }
  
  try {
    // First save any changes
    await handleSaveVersion()
    
    // Then submit for approval
    await submitForApproval(projectId.value, editingVersion.value.projectVersionId)
    alert('Version submitted for approval successfully!')
    closeVersionModal()
  } catch (err: any) {
    console.error('Error submitting version:', err)
    alert(`Error submitting version: ${err.message}`)
  }
}

const handleApproveVersion = async (versionId: number) => {
  console.log('Approving version:', versionId)
  
  try {
    await approveVersion(projectId.value, versionId)
    alert('Version approved successfully!')
  } catch (err: any) {
    console.error('Error approving version:', err)
    alert(`Error approving version: ${err.message}`)
  }
}

const handleRejectVersion = async (versionId: number, reason: string) => {
  console.log('Rejecting version:', versionId, 'Reason:', reason)
  
  try {
    await rejectVersion(projectId.value, versionId, reason)
    alert('Version rejected successfully!')
  } catch (err: any) {
    console.error('Error rejecting version:', err)
    alert(`Error rejecting version: ${err.message}`)
  }
}

const closeVersionModal = () => {
  showVersionModal.value = false
  editingVersion.value = null
  modalMode.value = 'view'
}

// Workflow methods
const openWorkflowModal = () => {
  console.log('Opening workflow state modal...')
  // This would open a modal to update workflow state
  // For now, just show an alert
  alert('Workflow state update modal would open here')
}

const openAgendaGenerator = () => {
  showAgendaGenerator.value = true
}

const viewAgenda = (agenda: any) => {
  console.log('Viewing agenda:', agenda)
  // This would open the agenda in a modal or navigate to agenda view
  alert(`Viewing agenda: ${agenda.title}`)
}

const viewVersionDetails = (version: any) => {
  console.log('Viewing version details:', version)
  // This would open the version details in a modal or navigate to version view
  alert(`Viewing version: ${version.version_number}`)
}

const loadWorkflowData = async () => {
  if (!projectId.value) return
  
  try {
    // Load current workflow state and history
    // This would call the workflow API endpoints
    console.log('Loading workflow data for project:', projectId.value)
    // For demo purposes, set some mock data
    currentWorkflowState.value = 'Planning Required'
    workflowHistory.value = [
      {
        id: '1',
        current_state: 'Planning Required',
        state_entered_at: '2024-01-15T10:00:00Z',
        entered_by_name: 'John Smith'
      },
      {
        id: '2',
        current_state: 'PAR Approved',
        state_entered_at: '2024-01-10T14:30:00Z',
        entered_by_name: 'Sarah Johnson'
      }
    ]
    
    // Load recent agendas
    recentAgendas.value = [
      {
        id: '1',
        title: 'Gate 2 Meeting Agenda',
        created_at: '2024-01-20T09:00:00Z'
      },
      {
        id: '2',
        title: 'Project Kickoff Agenda',
        created_at: '2024-01-05T11:00:00Z'
      }
    ]
  } catch (error) {
    console.error('Error loading workflow data:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadProject()
  loadWorkflowData()
})

// Handle version submission from gate meeting completion
const handleVersionSubmission = async (meeting: any) => {
  try {
    // Check if there's a draft version to submit
    if (!hasDraftVersion.value) {
      // Create a draft version first if none exists
      await createDraftVersion()
    }
    
    // Submit the latest draft for approval
    if (latestDraft.value) {
      await submitVersionForApproval(latestDraft.value.id)
      
      // Show success message
      alert(`Version submitted for approval following ${meeting.gate_type} completion`)
      
      // Reload version history
      await getVersionHistory()
    }
  } catch (error) {
    console.error('Error submitting version for approval:', error)
    alert('Failed to submit version for approval. Please try again.')
  }
}

// Watch for route changes
watch(() => route.params.id, () => {
  if (route.params.id) {
    loadProject()
  }
})
</script>

