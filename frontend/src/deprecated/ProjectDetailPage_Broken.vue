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
            <h1 class="text-3xl font-bold text-foreground">{{ project.name }}</h1>
            <p class="text-muted-foreground">{{ project.contractor }} • {{ project.phase }}</p>
            <!-- Version Status Indicator -->
            <div v-if="currentProject" class="flex items-center space-x-2 mt-1">
              <span class="text-sm text-gray-600">Version:</span>
              <span class="text-sm font-medium">v{{ currentProject.currentVersion?.versionNumber || 1 }}</span>
              <span v-if="currentProject.project.hasPendingChanges" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                Pending Changes
              </span>
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
            v-if="canCreateDraft && !hasDraftVersion" 
            @click="handleCreateDraft"
            :disabled="versionLoading"
            variant="outline" 
            size="sm"
          >
            <Edit class="h-4 w-4 mr-2" />
            Create Draft
          </Button>
          <Button 
            v-else-if="latestDraft" 
            @click="handleEditDraft"
            variant="outline" 
            size="sm"
          >
            <Edit class="h-4 w-4 mr-2" />
            Edit Draft
          </Button>
          <Button 
            v-else
            @click="handleCreateDraft"
            :disabled="versionLoading"
            variant="outline" 
            size="sm"
          >
            <Edit class="h-4 w-4 mr-2" />
            Edit Project
          </Button>
        </div>
      </div>

      <!-- Project Tabs -->
      <Tabs default-value="overview" class="w-full">
        <TabsList class="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="versions">
            <div class="flex items-center space-x-1">
              <span>Versions</span>
              <span v-if="hasPendingVersion" class="inline-flex items-center justify-center w-2 h-2 bg-amber-500 rounded-full"></span>
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
                Project Information
              </CardTitle>
              <CardContent class="text-sm text-gray-600">
                Basic project information and specifications
              </CardContent>
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
                <div>
                  <label class="text-sm font-medium text-gray-700">Project Type</label>
                  <input 
                    type="text" 
                    :value="project.projectType || 'Renovation'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Branch</label>
                  <input 
                    type="text" 
                    :value="project.branch || 'Infrastructure'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Delivery Method</label>
                  <input 
                    type="text" 
                    :value="project.deliveryMethod || 'Design-Build'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Square Meters</label>
                  <input 
                    type="text" 
                    :value="project.squareMeters || '2500'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Geographic Region</label>
                  <input 
                    type="text" 
                    :value="project.geographicRegion || 'Calgary'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Number of Structures</label>
                  <input 
                    type="text" 
                    :value="project.numberOfStructures || '1'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Number of Jobs</label>
                  <input 
                    type="text" 
                    :value="project.numberOfJobs || '15'" 
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
                Financial Information
              </CardTitle>
              <CardContent class="text-sm text-gray-600">
                Budget, funding, and financial targets
              </CardContent>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700">Total Approved Funding (TAF)</label>
                  <div class="relative mt-1">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      :value="formatNumber(project.taf || 2450000)" 
                      disabled
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500 pl-8"
                    />
                  </div>
                  <p class="text-sm text-gray-600 mt-1">Formatted: $2,450,000</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Estimate at Completion (EAC)</label>
                  <div class="relative mt-1">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      :value="formatNumber(project.eac || 2520000)" 
                      disabled
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500 pl-8"
                    />
                  </div>
                  <p class="text-sm text-gray-600 mt-1">Formatted: $2,520,000</p>
                </div>
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
                  <p class="text-sm text-gray-600 mt-1">Formatted: $2,450,000</p>
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
                  <p class="text-sm text-gray-600 mt-1">Formatted: $1,680,000</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Current Year Cashflow</label>
                  <div class="relative mt-1">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      :value="formatNumber(project.currentYearCashflow || 1200000)" 
                      disabled
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500 pl-8"
                    />
                  </div>
                  <p class="text-sm text-gray-600 mt-1">Formatted: $1,200,000</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Current Year Target</label>
                  <div class="relative mt-1">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      value="No data available" 
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
          <!-- Basic Project Information -->
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
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
                <div>
                  <Label class="text-sm font-medium">Region</Label>
                  <p class="text-sm text-muted-foreground">{{ project.region }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Project Manager</Label>
                  <p class="text-sm text-muted-foreground">{{ project.projectManager }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Project Type</Label>
                  <p class="text-sm text-muted-foreground">{{ project.projectType || 'Construction' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Delivery Method</Label>
                  <p class="text-sm text-muted-foreground">{{ project.deliveryMethod || 'Design-Bid-Build' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Start Date</Label>
                  <p class="text-sm text-muted-foreground">{{ formatDate(project.startDate) }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Expected Completion</Label>
                  <p class="text-sm text-muted-foreground">{{ formatDate(project.expectedCompletion) || 'TBD' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Building Type</Label>
                  <p class="text-sm text-muted-foreground">{{ project.buildingType || 'Educational Facility' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Project Category</Label>
                  <p class="text-sm text-muted-foreground">{{ project.category || 'Infrastructure' }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Financial Information -->
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium">Total Budget</Label>
                  <p class="text-lg font-semibold text-green-600">{{ formatCurrency(project.totalBudget) }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Amount Spent</Label>
                  <p class="text-lg font-semibold text-blue-600">{{ formatCurrency(project.amountSpent) }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Remaining Budget</Label>
                  <p class="text-lg font-semibold text-orange-600">{{ formatCurrency(project.totalBudget - project.amountSpent) }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Budget Utilization</Label>
                  <p class="text-lg font-semibold">{{ ((project.amountSpent / project.totalBudget) * 100).toFixed(1) }}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Location Tab -->
        <TabsContent value="location" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium">Address</Label>
                  <p class="text-sm text-muted-foreground">{{ project.address || 'Not specified' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">City</Label>
                  <p class="text-sm text-muted-foreground">{{ project.city || 'Not specified' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Province</Label>
                  <p class="text-sm text-muted-foreground">{{ project.province || 'Alberta' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Postal Code</Label>
                  <p class="text-sm text-muted-foreground">{{ project.postalCode || 'Not specified' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Region</Label>
                  <p class="text-sm text-muted-foreground">{{ project.region }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Coordinates</Label>
                  <p class="text-sm text-muted-foreground">{{ project.latitude && project.longitude ? `${project.latitude}, ${project.longitude}` : 'Not specified' }}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Vendors Tab -->
        <TabsContent value="vendors" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">Vendor management functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Milestones Tab -->
        <TabsContent value="milestones" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">Milestone tracking functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- NEW: Versions Tab -->
        <TabsContent value="versions" class="space-y-6">
          <ProjectVersionManager 
            v-if="projectId"
            :project-id="parseInt(projectId)"
            @edit-version="handleEditVersion"
            @view-version="handleViewVersion"
            @compare-version="handleCompareVersion"
          />
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
        
        <div v-if="editingVersion" class="space-y-4">
          <!-- Version Status -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">Version {{ editingVersion.versionNumber }}</h4>
                <p class="text-sm text-gray-600">Status: {{ editingVersion.status }}</p>
              </div>
              <div class="flex space-x-2">
                <button
                  v-if="editingVersion.status === 'Draft'"
                  @click="handleSubmitVersion"
                  :disabled="versionLoading"
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
          
          <!-- Editable Fields (only for Draft versions) -->
          <div v-if="editingVersion.status === 'Draft'" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Project Name</label>
                <input 
                  v-model="editingVersion.name"
                  type="text" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Category</label>
                <input 
                  v-model="editingVersion.category"
                  type="text" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  v-model="editingVersion.description"
                  rows="3"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Total Budget</label>
                <input 
                  v-model.number="editingVersion.totalApprovedFunding"
                  type="number" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Current Budget</label>
                <input 
                  v-model.number="editingVersion.currentBudget"
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
                :disabled="versionLoading"
                class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
          
          <!-- Read-only view for non-draft versions -->
          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Project Name</label>
                <p class="mt-1 text-sm text-gray-900">{{ editingVersion.name }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Category</label>
                <p class="mt-1 text-sm text-gray-900">{{ editingVersion.category }}</p>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <p class="mt-1 text-sm text-gray-900">{{ editingVersion.description }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Total Budget</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatCurrency(editingVersion.totalApprovedFunding) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Current Budget</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatCurrency(editingVersion.currentBudget) }}</p>
              </div>
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
import { ArrowLeft, Upload, Edit, Building, DollarSign } from 'lucide-vue-next'
import { Button } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { Label } from '@/components/ui'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import ErrorMessage from '@/components/shared/ErrorMessage.vue'
import ProjectVersionManager from '@/components/projects/ProjectVersionManager.vue'
import { useProjectVersions, type ProjectVersion } from '@/composables/useProjectVersions'
import { formatCurrency, formatDate, formatNumber } from '@/utils'

const route = useRoute()
const projectId = computed(() => route.params.id as string)

// Original project data (from existing API)
const project = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Versioning functionality
const {
  loading: versionLoading,
  error: versionError,
  currentProject,
  versions,
  canCreateDraft,
  hasDraftVersion,
  hasPendingVersion,
  latestDraft,
  getProject,
  getVersionHistory,
  createDraftVersion,
  updateDraftVersion,
  submitForApproval
} = useProjectVersions()

// Modal state
const showVersionModal = ref(false)
const editingVersion = ref<ProjectVersion | null>(null)

// Load project data
const loadProject = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Load original project data (mock for now)
    // In a real implementation, this would call your existing project API
    project.value = {
      id: parseInt(projectId.value),
      name: "Modernization of Existing School",
      description: "Comprehensive renovation and modernization of the existing educational facility",
      contractor: "ABC Construction Ltd.",
      phase: "Construction",
      region: "Calgary",
      projectManager: "Sarah Johnson",
      startDate: "2024-01-15",
      expectedCompletion: "2024-12-15",
      totalBudget: 2450000,
      amountSpent: 1680000,
      taf: 2450000,
      eac: 2520000,
      currentYearCashflow: 1200000,
      category: "Education",
      projectType: "Renovation",
      deliveryMethod: "Design-Build",
      buildingType: "Educational Facility",
      squareMeters: 2500,
      numberOfStructures: 1,
      numberOfJobs: 15,
      geographicRegion: "Calgary",
      clientMinistry: "Education",
      deliveryType: "In-service project",
      branch: "Infrastructure"
    }
    
    // Load versioning data
    if (projectId.value) {
      await getProject(parseInt(projectId.value))
      await getVersionHistory(parseInt(projectId.value))
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Versioning handlers
const handleCreateDraft = async () => {
  try {
    await createDraftVersion(parseInt(projectId.value))
    // Optionally open the draft for editing
    if (latestDraft.value) {
      handleEditVersion(latestDraft.value)
    }
  } catch (err) {
    console.error('Failed to create draft:', err)
  }
}

const handleEditDraft = () => {
  if (latestDraft.value) {
    handleEditVersion(latestDraft.value)
  }
}

const handleEditVersion = (version: ProjectVersion) => {
  editingVersion.value = { ...version }
  showVersionModal.value = true
}

const handleViewVersion = (version: ProjectVersion) => {
  editingVersion.value = version
  showVersionModal.value = true
}

const handleCompareVersion = (version: ProjectVersion) => {
}

const handleSaveVersion = async () => {
  if (!editingVersion.value) return
  
  try {
    await updateDraftVersion(
      parseInt(projectId.value),
      editingVersion.value.projectVersionId,
      editingVersion.value
    )
    closeVersionModal()
  } catch (err) {
    console.error('Failed to save version:', err)
  }
}

const handleSubmitVersion = async () => {
  if (!editingVersion.value) return
  
  try {
    await submitForApproval(
      parseInt(projectId.value),
      editingVersion.value.projectVersionId
    )
    closeVersionModal()
  } catch (err) {
    console.error('Failed to submit version:', err)
  }
}

const closeVersionModal = () => {
  showVersionModal.value = false
  editingVersion.value = null
}

// Lifecycle
onMounted(() => {
  loadProject()
})

// Watch for route changes
watch(() => route.params.id, () => {
  if (route.params.id) {
    loadProject()
  }
})
</script>

        <!-- Overview Tab -->
        <TabsContent value="overview" class="space-y-6">
          <!-- Project Information -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Building class="h-5 w-5" />
                Project Information
              </CardTitle>
              <CardContent class="text-sm text-gray-600">
                Basic project information and specifications
              </CardContent>
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
                <div>
                  <label class="text-sm font-medium text-gray-700">Project Type</label>
                  <input 
                    type="text" 
                    :value="project.projectType || 'Renovation'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Branch</label>
                  <input 
                    type="text" 
                    :value="project.branch || 'Infrastructure'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Delivery Method</label>
                  <input 
                    type="text" 
                    :value="project.deliveryMethod || 'Design-Build'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Square Meters</label>
                  <input 
                    type="text" 
                    :value="project.squareMeters || '2500'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Geographic Region</label>
                  <input 
                    type="text" 
                    :value="project.geographicRegion || 'Calgary'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Number of Structures</label>
                  <input 
                    type="text" 
                    :value="project.numberOfStructures || '1'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Number of Jobs</label>
                  <input 
                    type="text" 
                    :value="project.numberOfJobs || '15'" 
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
                Financial Information
              </CardTitle>
              <CardContent class="text-sm text-gray-600">
                Budget, funding, and financial targets
              </CardContent>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700">Total Approved Funding (TAF)</label>
                  <div class="relative mt-1">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      :value="formatNumber(project.taf || 2450000)" 
                      disabled
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500 pl-8"
                    />
                  </div>
                  <p class="text-sm text-gray-600 mt-1">Formatted: $2,450,000</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Estimate at Completion (EAC)</label>
                  <div class="relative mt-1">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      :value="formatNumber(project.eac || 2520000)" 
                      disabled
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500 pl-8"
                    />
                  </div>
                  <p class="text-sm text-gray-600 mt-1">Formatted: $2,520,000</p>
                </div>
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
                  <p class="text-sm text-gray-600 mt-1">Formatted: $2,450,000</p>
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
                  <p class="text-sm text-gray-600 mt-1">Formatted: $1,680,000</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Current Year Cashflow</label>
                  <div class="relative mt-1">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      :value="formatNumber(project.currentYearCashflow || 1200000)" 
                      disabled
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500 pl-8"
                    />
                  </div>
                  <p class="text-sm text-gray-600 mt-1">Formatted: $1,200,000</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Current Year Target</label>
                  <div class="relative mt-1">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      value="No data available" 
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
          <!-- Basic Project Information -->
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
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
                <div>
                  <Label class="text-sm font-medium">Region</Label>
                  <p class="text-sm text-muted-foreground">{{ project.region }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Project Manager</Label>
                  <p class="text-sm text-muted-foreground">{{ project.projectManager }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Project Type</Label>
                  <p class="text-sm text-muted-foreground">{{ project.projectType || 'Construction' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Delivery Method</Label>
                  <p class="text-sm text-muted-foreground">{{ project.deliveryMethod || 'Design-Bid-Build' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Start Date</Label>
                  <p class="text-sm text-muted-foreground">{{ formatDate(project.startDate) }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Expected Completion</Label>
                  <p class="text-sm text-muted-foreground">{{ formatDate(project.expectedCompletion) || 'TBD' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Building Type</Label>
                  <p class="text-sm text-muted-foreground">{{ project.buildingType || 'Educational Facility' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Project Category</Label>
                  <p class="text-sm text-muted-foreground">{{ project.category || 'Infrastructure' }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Financial Information -->
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium">Total Budget</Label>
                  <p class="text-lg font-semibold text-green-600">{{ formatCurrency(project.totalBudget) }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Amount Spent</Label>
                  <p class="text-lg font-semibold text-blue-600">{{ formatCurrency(project.amountSpent) }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Remaining Budget</Label>
                  <p class="text-lg font-semibold text-orange-600">{{ formatCurrency(project.totalBudget - project.amountSpent) }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Budget Utilization</Label>
                  <p class="text-lg font-semibold">{{ Math.round((project.amountSpent / project.totalBudget) * 100) }}%</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">TAF (Total Approved Funding)</Label>
                  <p class="text-sm text-muted-foreground">{{ formatCurrency(project.taf || project.totalBudget) }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">EAC (Estimate at Completion)</Label>
                  <p class="text-sm text-muted-foreground">{{ formatCurrency(project.eac || project.totalBudget) }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Project Status & Milestones -->
          <Card>
            <CardHeader>
              <CardTitle>Status & Milestones</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium">Current Status</Label>
                  <Badge :variant="getStatusVariant(project.status)">{{ project.status }}</Badge>
                </div>
                <div>
                  <Label class="text-sm font-medium">Schedule Status</Label>
                  <Badge :variant="getScheduleStatusVariant(project.scheduleStatus)">{{ project.scheduleStatus }}</Badge>
                </div>
                <div>
                  <Label class="text-sm font-medium">Budget Status</Label>
                  <Badge :variant="getBudgetStatusVariant(project.budgetStatus)">{{ project.budgetStatus }}</Badge>
                </div>
                <div>
                  <Label class="text-sm font-medium">Report Status</Label>
                  <Badge :variant="getReportStatusVariant(project.reportStatus)">{{ project.reportStatus }}</Badge>
                </div>
                <div>
                  <Label class="text-sm font-medium">Design Completion</Label>
                  <p class="text-sm text-muted-foreground">{{ project.designCompletion || '85%' }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium">Construction Progress</Label>
                  <p class="text-sm text-muted-foreground">{{ project.constructionProgress || '45%' }}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Location Tab -->
        <TabsContent value="location" class="space-y-6">
          <!-- Project Location -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <MapPin class="h-5 w-5" />
                Project Location
              </CardTitle>
              <CardContent class="text-sm text-gray-600">
                Geographic and address information
              </CardContent>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700">Location</label>
                  <input 
                    type="text" 
                    :value="project.location || 'Calgary'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Municipality</label>
                  <input 
                    type="text" 
                    :value="project.municipality || 'Calgary'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Project Address</label>
                  <input 
                    type="text" 
                    :value="project.address || '125 School Street, Calgary, AB T2P 1A1'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Constituency</label>
                  <input 
                    type="text" 
                    :value="project.constituency || 'Calgary Centre'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Building Name</label>
                  <input 
                    type="text" 
                    :value="project.buildingName || 'Calgary Elementary School'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Building Type</label>
                  <input 
                    type="text" 
                    :value="project.buildingType || 'Educational Facility'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Building ID</label>
                  <input 
                    type="text" 
                    :value="project.buildingId || 'EDU-001'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Primary Owner</label>
                  <input 
                    type="text" 
                    :value="project.primaryOwner || 'Alberta Education'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Plan</label>
                  <input 
                    type="text" 
                    :value="project.plan || 'No data available'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Block</label>
                  <input 
                    type="text" 
                    :value="project.block || 'No data available'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Lot</label>
                  <input 
                    type="text" 
                    :value="project.lot || 'No data available'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Latitude</label>
                  <input 
                    type="text" 
                    :value="project.latitude || 'No data available'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Longitude</label>
                  <input 
                    type="text" 
                    :value="project.longitude || 'No data available'" 
                    disabled
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Vendors Tab -->
        <TabsContent value="vendors" class="space-y-6">
          <!-- Sub-navigation -->
          <div class="flex space-x-4 border-b border-gray-200">
            <button 
              @click="vendorActiveTab = 'vendors'"
              :class="`px-4 py-2 text-sm font-medium border-b-2 ${vendorActiveTab === 'vendors' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`"
            >
              Vendors
            </button>
            <button 
              @click="vendorActiveTab = 'extract'"
              :class="`px-4 py-2 text-sm font-medium border-b-2 ${vendorActiveTab === 'extract' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`"
            >
              Extract Data
            </button>
            <button 
              @click="vendorActiveTab = 'dashboard'"
              :class="`px-4 py-2 text-sm font-medium border-b-2 ${vendorActiveTab === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`"
            >
              Dashboard
            </button>
          </div>

          <div v-if="vendorActiveTab === 'vendors'">
            <!-- Financial Summary -->
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <DollarSign class="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div class="bg-blue-50 p-4 rounded-lg text-center">
                    <div class="flex items-center justify-center mb-2">
                      <DollarSign class="h-5 w-5 text-blue-600" />
                    </div>
                    <div class="text-sm text-gray-600">Total Commitment</div>
                    <div class="text-2xl font-bold text-blue-600">$0</div>
                  </div>
                  <div class="bg-green-50 p-4 rounded-lg text-center">
                    <div class="flex items-center justify-center mb-2">
                      <TrendingUp class="h-5 w-5 text-green-600" />
                    </div>
                    <div class="text-sm text-gray-600">Total Billed</div>
                    <div class="text-2xl font-bold text-green-600">$0</div>
                  </div>
                  <div class="bg-orange-50 p-4 rounded-lg text-center">
                    <div class="flex items-center justify-center mb-2">
                      <Clock class="h-5 w-5 text-orange-600" />
                    </div>
                    <div class="text-sm text-gray-600">Total Holdback</div>
                    <div class="text-2xl font-bold text-orange-600">$0</div>
                  </div>
                  <div class="bg-purple-50 p-4 rounded-lg text-center">
                    <div class="flex items-center justify-center mb-2">
                      <FileText class="h-5 w-5 text-purple-600" />
                    </div>
                    <div class="text-sm text-gray-600">Change Orders</div>
                    <div class="text-2xl font-bold text-purple-600">$0</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Vendor Contracts -->
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <Building class="h-5 w-5" />
                  Vendor Contracts (0)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-center py-8">
                  <FileText class="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p class="text-gray-500 mb-4">No vendor contracts available</p>
                  <p class="text-sm text-gray-400">Add vendor contracts manually or extract them from a spreadsheet</p>
                  <div class="flex justify-center space-x-2 mt-4">
                    <Button variant="default" size="sm">
                      <Plus class="h-4 w-4 mr-2" />
                      Add Vendor
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload class="h-4 w-4 mr-2" />
                      Extract from Spreadsheet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Change Orders -->
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <FileText class="h-5 w-5" />
                  Change Orders (1)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div class="border rounded-lg p-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div class="text-sm font-medium">ABC Construction Ltd.</div>
                        <div class="text-xs text-gray-500">Contract ID: CON-001</div>
                      </div>
                      <div>
                        <div class="text-sm font-medium">Change Value</div>
                        <div class="text-lg font-bold">$0</div>
                      </div>
                      <div>
                        <div class="text-sm font-medium">Approved Date</div>
                        <div class="text-sm">2024-05-15</div>
                      </div>
                      <div>
                        <div class="text-sm font-medium">Status</div>
                        <Badge variant="default">Approved</Badge>
                      </div>
                    </div>
                    <div class="mt-2">
                      <div class="text-sm font-medium">Description</div>
                      <div class="text-sm text-gray-600">Additional electrical work</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Funding Lines -->
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <DollarSign class="h-5 w-5" />
                  Funding Lines (1)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div class="border rounded-lg p-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div class="text-sm font-medium">P-002360 | B02140-0010</div>
                        <div class="text-sm text-gray-600">General Facilities Infrastructure</div>
                        <div class="text-xs text-gray-500">Calgary Elementary School Renovation</div>
                      </div>
                      <div>
                        <div class="text-sm font-medium">Approved Value</div>
                        <div class="text-lg font-bold text-green-600">$2,450,000</div>
                      </div>
                      <div>
                        <div class="text-sm font-medium">Current Year Budget</div>
                        <div class="text-lg font-bold">$1,150,000</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div v-else-if="vendorActiveTab === 'extract'">
            <Card>
              <CardHeader>
                <CardTitle>Extract Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-gray-600">Extract vendor data functionality would go here.</p>
              </CardContent>
            </Card>
          </div>

          <div v-else-if="vendorActiveTab === 'dashboard'">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-gray-600">Vendor dashboard functionality would go here.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <!-- Milestones Tab -->
        <TabsContent value="milestones" class="space-y-6">
          <!-- Project Milestones -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Calendar class="h-5 w-5" />
                Project Milestones
              </CardTitle>
              <CardContent class="text-sm text-gray-600">
                Track project milestones by phase with planned, actual, and baseline dates
              </CardContent>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <!-- Phase Selection -->
                <div class="flex space-x-2 border-b border-gray-200">
                  <button 
                    v-for="phase in phases" 
                    :key="phase.id"
                    @click="activePhase = phase.id"
                    :class="`px-4 py-2 text-sm font-medium border-b-2 ${activePhase === phase.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`"
                  >
                    <component :is="phase.icon" class="h-4 w-4 mr-2 inline" />
                    {{ phase.label }}
                  </button>
                </div>

                <!-- Milestones for Active Phase -->
                <div class="space-y-2">
                  <!-- Header -->
                  <div class="grid grid-cols-12 gap-2 py-2 px-3 bg-gray-50 rounded font-medium text-sm">
                    <div class="col-span-3">Milestone</div>
                    <div class="col-span-2">Planned Date</div>
                    <div class="col-span-2">Actual Date</div>
                    <div class="col-span-2">Baseline Date</div>
                    <div class="col-span-2">Notes</div>
                    <div class="col-span-1">N/A</div>
                  </div>
                  
                  <!-- Milestone Rows -->
                  <div v-for="milestone in milestonesByPhase[activePhase]" :key="milestone.key"
                       :class="`grid grid-cols-12 gap-2 py-2 px-3 rounded ${milestone.special ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`">
                    <div class="col-span-3 flex items-center">
                      <span :class="`text-sm ${milestone.required ? 'font-medium' : ''}`">
                        {{ milestone.label }}
                        <span v-if="milestone.required" class="text-red-500 ml-1">*</span>
                        <span v-if="milestone.special" class="text-blue-500 ml-1">★</span>
                      </span>
                    </div>
                    
                    <div class="col-span-2">
                      <input
                        type="date"
                        placeholder="yyyy-mm-dd"
                        disabled
                        class="text-xs h-8 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                      />
                    </div>
                      
                    <div class="col-span-2">
                      <input
                        type="date"
                        placeholder="yyyy-mm-dd"
                        disabled
                        class="text-xs h-8 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                      />
                    </div>
                    
                    <div class="col-span-2">
                      <input
                        type="date"
                        placeholder="yyyy-mm-dd"
                        disabled
                        class="text-xs h-8 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                      />
                    </div>
                    
                    <div class="col-span-2">
                      <input
                        placeholder="Notes"
                        disabled
                        class="text-xs h-8 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50"
                      />
                    </div>
                      
                    <div class="col-span-1 flex items-center justify-center">
                      <input
                        type="checkbox"
                        disabled
                        class="h-4 w-4"
                      />
                    </div>
                  </div>
                </div>

                <!-- Special Milestones Note -->
                <div v-if="activePhase === 'construction'" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p class="text-sm text-blue-800">
                    <strong>Special Milestones (★):</strong> Site Mobilization and Construction 100% are key milestones that require special attention and reporting.
                  </p>
                </div>

                <div v-if="activePhase === 'closeout'" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p class="text-sm text-blue-800">
                    <strong>Financial Closeout (★):</strong> This milestone marks the completion of all financial reconciliation and final project cost reporting.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Building, DollarSign, Calendar, MapPin, Users, Edit, Upload, Plus, FileText, TrendingUp, Clock, Target, CheckCircle } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Label } from '@/components/ui'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import ErrorMessage from '@/components/shared/ErrorMessage.vue'

const route = useRoute()
const loading = ref(true)
const error = ref<string | null>(null)
const project = ref<any>(null)
const activePhase = ref('planning')
const vendorActiveTab = ref('vendors')

const phases = [
  { id: 'planning', label: 'Planning', icon: Target },
  { id: 'design', label: 'Design', icon: Edit },
  { id: 'construction', label: 'Construction', icon: Building },
  { id: 'closeout', label: 'Closeout', icon: CheckCircle }
]

const milestonesByPhase = {
  planning: [
    { key: 'projectInitiation', label: 'Project Initiation', required: true },
    { key: 'businessCaseApproval', label: 'Business Case Approval', required: true },
    { key: 'fundingApproval', label: 'Funding Approval', required: true },
    { key: 'projectCharterSigned', label: 'Project Charter Signed', required: false },
    { key: 'stakeholderEngagement', label: 'Stakeholder Engagement Complete', required: false }
  ],
  design: [
    { key: 'designKickoff', label: 'Design Kickoff', required: true },
    { key: 'schematicDesign', label: 'Schematic Design Complete', required: true },
    { key: 'designDevelopment', label: 'Design Development Complete', required: true },
    { key: 'constructionDocuments', label: 'Construction Documents Complete', required: true },
    { key: 'permitSubmission', label: 'Permit Submission', required: false },
    { key: 'permitApproval', label: 'Permit Approval', required: false }
  ],
  construction: [
    { key: 'siteMobilization', label: 'Site Mobilization', required: true, special: true },
    { key: 'constructionStart', label: 'Construction Start', required: true },
    { key: 'construction25', label: 'Construction 25% Complete', required: false },
    { key: 'construction50', label: 'Construction 50% Complete', required: false },
    { key: 'construction75', label: 'Construction 75% Complete', required: false },
    { key: 'construction100', label: 'Construction 100% Complete', required: true, special: true },
    { key: 'substantialCompletion', label: 'Substantial Completion', required: true }
  ],
  closeout: [
    { key: 'finalInspection', label: 'Final Inspection', required: true },
    { key: 'occupancyPermit', label: 'Occupancy Permit Issued', required: false },
    { key: 'projectHandover', label: 'Project Handover', required: true },
    { key: 'warrantyPeriodStart', label: 'Warranty Period Start', required: false },
    { key: 'financialCloseout', label: 'Financial Closeout', required: true, special: true },
    { key: 'projectClosure', label: 'Project Closure', required: true }
  ]
}

const loadProject = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Mock project data based on the screenshots
    project.value = {
      id: route.params.id,
      name: 'Calgary Elementary School Renovation',
      description: 'Complete renovation of elementary school facilities including classroom upgrades and safety improvements',
      contractor: 'ABC Construction Ltd.',
      phase: 'Construction',
      region: 'Calgary',
      projectManager: 'Sarah Johnson',
      status: 'In Progress',
      scheduleStatus: 'On Track',
      budgetStatus: 'Within Budget',
      reportStatus: 'Current',
      totalBudget: 2450000,
      amountSpent: 1680000,
      taf: 2450000,
      eac: 2520000,
      currentYearCashflow: 1200000,
      startDate: '2024-01-15',
      expectedCompletion: '2024-12-15',
      buildingType: 'Educational Facility',
      category: 'Education',
      projectType: 'Renovation',
      deliveryMethod: 'Design-Build',
      deliveryType: 'In-service project',
      clientMinistry: 'Education',
      branch: 'Infrastructure',
      geographicRegion: 'Calgary',
      squareMeters: '2500',
      numberOfStructures: '1',
      numberOfJobs: '15',
      // Location fields
      location: 'Calgary',
      municipality: 'Calgary',
      address: '125 School Street, Calgary, AB T2P 1A1',
      constituency: 'Calgary Centre',
      buildingName: 'Calgary Elementary School',
      buildingId: 'EDU-001',
      primaryOwner: 'Alberta Education',
      plan: 'No data available',
      block: 'No data available',
      lot: 'No data available',
      latitude: 'No data available',
      longitude: 'No data available'
    }
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount)
}

const formatNumber = (amount: number): string => {
  return amount.toLocaleString()
}

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-CA')
}

const getStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'default'
    case 'in progress': return 'secondary'
    case 'on hold': return 'destructive'
    default: return 'outline'
  }
}

const getScheduleStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'on track': return 'default'
    case 'delayed': return 'destructive'
    case 'ahead': return 'secondary'
    default: return 'outline'
  }
}

const getBudgetStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'within budget': return 'default'
    case 'over budget': return 'destructive'
    case 'under budget': return 'secondary'
    default: return 'outline'
  }
}

const getReportStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'current': return 'default'
    case 'overdue': return 'destructive'
    case 'pending': return 'secondary'
    default: return 'outline'
  }
}

onMounted(() => {
  loadProject()
})
</script>

