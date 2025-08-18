<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span class="text-gray-600">Loading project details...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error Loading Project Details</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          <button 
            @click="loadProjectData" 
            class="mt-2 text-sm text-red-600 hover:text-red-500 underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-green-800">{{ successMessage }}</p>
        </div>
        <div class="ml-auto">
          <button @click="successMessage = ''" class="text-green-400 hover:text-green-600">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Project Information Form -->
    <Card v-if="!loading && !error">
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Project Information</span>
          <div v-if="hasUnsavedChanges" class="flex items-center text-amber-600 text-sm">
            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Unsaved changes
          </div>
        </CardTitle>
        <CardDescription v-if="!canEdit">
          View detailed project information and specifications.
        </CardDescription>
        <CardDescription v-else>
          Edit project details and specifications. Changes will be saved to {{ viewMode === 'draft' ? 'draft version' : 'current version' }}.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="project-name">Project Name *</Label>
            <Input
              id="project-name"
              v-model="formData.name"
              :disabled="!canEdit"
              placeholder="Enter project name"
              class="mt-1"
            />
          </div>
          
          <div>
            <Label for="project-code">Project Code</Label>
            <Input
              id="project-code"
              v-model="formData.project_code"
              :disabled="!canEdit"
              placeholder="Auto-generated or custom code"
              class="mt-1"
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <Label for="description">Project Description</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            :disabled="!canEdit"
            placeholder="Detailed project description..."
            :rows="4"
            class="mt-1"
          />
        </div>

        <!-- Project Classification -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label for="category">Category</Label>
            <Select v-model="formData.category" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="justice">Justice</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="ministry">Ministry</Label>
            <Select v-model="formData.ministry" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select ministry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="justice">Justice and Solicitor General</SelectItem>
                <SelectItem value="transportation">Transportation and Economic Corridors</SelectItem>
                <SelectItem value="environment">Environment and Protected Areas</SelectItem>
                <SelectItem value="municipal">Municipal Affairs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="region">Region</Label>
            <Select v-model="formData.region" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calgary">Calgary</SelectItem>
                <SelectItem value="edmonton">Edmonton</SelectItem>
                <SelectItem value="central">Central</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Project Type and Status -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label for="project-type">Project Type</Label>
            <Select v-model="formData.project_type" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_construction">New Construction</SelectItem>
                <SelectItem value="renovation">Renovation</SelectItem>
                <SelectItem value="expansion">Expansion</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="demolition">Demolition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="status">Project Status</Label>
            <Select v-model="formData.status" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="procurement">Procurement</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="commissioning">Commissioning</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="priority">Priority</Label>
            <Select v-model="formData.priority" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Delivery Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="delivery-type">Delivery Type</Label>
            <Select v-model="formData.delivery_type" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select delivery type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="design_bid_build">Design-Bid-Build</SelectItem>
                <SelectItem value="design_build">Design-Build</SelectItem>
                <SelectItem value="construction_management">Construction Management</SelectItem>
                <SelectItem value="public_private_partnership">Public-Private Partnership</SelectItem>
                <SelectItem value="integrated_project_delivery">Integrated Project Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="program">Program</Label>
            <Select v-model="formData.program" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="capital_plan">Capital Plan</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="strategic">Strategic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <Switch
            id="funded-to-complete"
            :model-value="formData.funded_to_complete ?? false"
            @update:model-value="formData.funded_to_complete = $event"
            :disabled="!canEdit"
          />
          <Label for="funded-to-complete">Funded to Complete</Label>
        </div>
      </CardContent>
    </Card>

    <!-- Financial Information -->
    <Card>
      <CardHeader>
        <CardTitle>Financial Information</CardTitle>
        <CardDescription>
          Budget and financial details for the project.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label for="total-budget">Total Budget</Label>
            <Input
              id="total-budget"
              v-model.number="formData.total_budget"
              :disabled="!canEdit"
              type="number"
              step="0.01"
              placeholder="0.00"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="approved-budget">Approved Budget</Label>
            <Input
              id="approved-budget"
              v-model.number="formData.approved_budget"
              :disabled="!canEdit"
              type="number"
              step="0.01"
              placeholder="0.00"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="spent-to-date">Spent to Date</Label>
            <Input
              id="spent-to-date"
              v-model.number="formData.spent_to_date"
              :disabled="!canEdit"
              type="number"
              step="0.01"
              placeholder="0.00"
              class="mt-1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="funding-source">Funding Source</Label>
            <Select v-model="formData.funding_source" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select funding source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="provincial">Provincial</SelectItem>
                <SelectItem value="federal">Federal</SelectItem>
                <SelectItem value="municipal">Municipal</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="client-ministry">Client Ministry</Label>
            <Select v-model="formData.client_ministry_id" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select client ministry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loading" disabled>Loading ministries...</SelectItem>
                <!-- Client ministries will be loaded dynamically -->
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Education-Specific Information -->
    <Card v-if="formData.category === 'education'">
      <CardHeader>
        <CardTitle>Education Project Details</CardTitle>
        <CardDescription>
          Specific information for education-related projects.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="school-jurisdiction">School Jurisdiction</Label>
            <Select v-model="formData.school_jurisdiction_id" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select school jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loading" disabled>Loading jurisdictions...</SelectItem>
                <!-- School jurisdictions will be loaded dynamically -->
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="student-capacity">Student Capacity</Label>
            <Input
              id="student-capacity"
              v-model.number="formData.student_capacity"
              :disabled="!canEdit"
              type="number"
              placeholder="Number of students"
              class="mt-1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="square-meters">Square Meters</Label>
            <Input
              id="square-meters"
              v-model.number="formData.square_meters"
              :disabled="!canEdit"
              type="number"
              placeholder="Total area in m²"
              class="mt-1"
            />
          </div>

          <div class="flex items-center space-x-2">
            <Switch
              id="is-charter-school"
              :model-value="formData.is_charter_school ?? false"
              @update:model-value="formData.is_charter_school = $event"
              :disabled="!canEdit"
            />
            <Label for="is-charter-school">Charter School</Label>
          </div>
        </div>

        <!-- Charter School Grades (conditional) -->
        <div v-if="formData.is_charter_school" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="grades-from">Grades From</Label>
            <Input
              id="grades-from"
              v-model.number="formData.grades_from"
              :disabled="!canEdit"
              type="number"
              min="1"
              max="12"
              placeholder="Starting grade"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="grades-to">Grades To</Label>
            <Input
              id="grades-to"
              v-model.number="formData.grades_to"
              :disabled="!canEdit"
              type="number"
              min="1"
              max="12"
              placeholder="Ending grade"
              class="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Healthcare-Specific Information -->
    <Card v-if="formData.category === 'healthcare'">
      <CardHeader>
        <CardTitle>Healthcare Project Details</CardTitle>
        <CardDescription>
          Specific information for healthcare-related projects.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label for="number-of-beds">Number of Beds</Label>
            <Input
              id="number-of-beds"
              v-model.number="formData.number_of_beds"
              :disabled="!canEdit"
              type="number"
              placeholder="Total beds"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="opening-capacity">Total Opening Capacity</Label>
            <Input
              id="opening-capacity"
              v-model.number="formData.total_opening_capacity"
              :disabled="!canEdit"
              type="number"
              placeholder="Opening capacity"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="full-capacity">Capacity at Full Build-out</Label>
            <Input
              id="full-capacity"
              v-model.number="formData.capacity_at_full_build_out"
              :disabled="!canEdit"
              type="number"
              placeholder="Full capacity"
              class="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Timeline Information -->
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>
          Important dates and milestones for the project.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="start-date">Start Date</Label>
            <Input
              id="start-date"
              v-model="formData.start_date"
              :disabled="!canEdit"
              type="date"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="completion-date">Expected Completion</Label>
            <Input
              id="completion-date"
              v-model="formData.expected_completion"
              :disabled="!canEdit"
              type="date"
              class="mt-1"
            />
          </div>

          <div v-if="formData.status === 'archived'">
            <Label for="archived-date">Archived Date</Label>
            <Input
              id="archived-date"
              v-model="formData.archived_date"
              :disabled="!canEdit"
              type="date"
              class="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Additional Information -->
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
        <CardDescription>
          Other relevant project details and specifications.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="number-of-jobs">Number of Jobs Created</Label>
            <Input
              id="number-of-jobs"
              v-model.number="formData.number_of_jobs"
              :disabled="!canEdit"
              type="number"
              placeholder="Estimated jobs"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="report-status">Report Status</Label>
            <Select v-model="formData.report_status" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select report status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <Label for="notes">Project Notes</Label>
          <Textarea
            id="notes"
            v-model="formData.notes"
            :disabled="!canEdit"
            placeholder="Additional notes and comments..."
            :rows="3"
            class="mt-1"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Action Buttons -->
    <div v-if="canEdit" class="flex justify-end space-x-3">
      <Button variant="outline" @click="resetForm" :disabled="!hasChanges">
        Reset Changes
      </Button>
      <Button @click="saveChanges" :disabled="!hasChanges">
        Save Changes
      </Button>
    </div>

    <!-- Read-only Information Display -->
    <div v-if="!canEdit" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-sm text-blue-800">
          You are viewing this project in read-only mode. 
          {{ viewMode === 'approved' ? 'Switch to draft mode to make changes.' : 'Contact your administrator for edit permissions.' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Save } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Textarea } from "@/components/ui"
import { Badge } from '@/components/ui'
import { Switch } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import { normalizeProject, databaseToFrontend } from '@/utils/fieldNormalization'

// Types
interface Project {
  id?: string
  name?: string
  project_name?: string
  project_code?: string
  description?: string
  project_description?: string
  category?: string
  project_category?: string
  ministry?: string
  region?: string
  geographic_region?: string
  project_type?: string
  status?: string
  project_status?: string
  priority?: string
  delivery_type?: string
  specific_delivery_type?: string
  delivery_method?: string
  program?: string
  funded_to_complete?: boolean
  client_ministry_id?: string
  school_jurisdiction_id?: string
  number_of_beds?: number
  total_opening_capacity?: number
  capacity_at_full_build_out?: number
  is_charter_school?: boolean
  grades_from?: number
  grades_to?: number
  square_meters?: number
  number_of_jobs?: number
  report_status?: string
  total_budget?: number
  approved_budget?: number
  spent_to_date?: number
  funding_source?: string
  student_capacity?: number
  start_date?: string
  expected_completion?: string
  archived_date?: string
  notes?: string
  [key: string]: any
}

// Props
const props = defineProps<{
  project: Project
  viewMode?: 'approved' | 'draft'
  canEdit?: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:project': [project: Project]
  'save-changes': [changes: Partial<Project>]
}>()

// Reactive state
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
const originalFormData = ref<Project>({})
const hasUnsavedChanges = ref(false)

// Auto-save timer
let autoSaveTimer: NodeJS.Timeout | null = null

// ENHANCED: Initialize form data with proper field normalization
const initializeFormData = (project: Project): Project => {
  // Use field normalization utility to handle different naming conventions
  const normalized = normalizeProject(project)
  
  return {
    ...normalized,
    // Ensure boolean fields have proper defaults to prevent Switch component warnings
    funded_to_complete: Boolean(normalized.funded_to_complete || false),
    is_charter_school: Boolean(normalized.is_charter_school || false),
    // Normalize field names for consistency
    name: normalized.name || normalized.projectName || '',
    description: normalized.description || '',
    category: normalized.category || '',
    status: project.workflow_status || project.status || project.project_status || '',
    region: project.region || project.geographic_region || '',
  }
}

// Form data with proper initialization
const formData = ref<Project>(initializeFormData(props.project))

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalFormData.value)
})

// Enhanced Methods
const loadProjectData = async () => {
  if (!props.project?.id) return
  
  loading.value = true
  error.value = ''
  
  try {
    // Simulate API call - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const initializedData = initializeFormData(props.project)
    formData.value = initializedData
    originalFormData.value = { ...initializedData }
    hasUnsavedChanges.value = false
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load project data'
    console.error('Error loading project data:', err)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = { ...originalFormData.value }
  hasUnsavedChanges.value = false
  successMessage.value = ''
  error.value = ''
}

const saveChanges = async () => {
  if (!hasUnsavedChanges.value) return
  
  saving.value = true
  error.value = ''
  
  try {
    const changes: Partial<Project> = {}
    
    // Only include changed fields
    Object.keys(formData.value).forEach(key => {
      if (formData.value[key] !== originalFormData.value[key]) {
        changes[key] = formData.value[key]
      }
    })

    // Emit save event
    emit('save-changes', changes)
    
    // Update original data
    originalFormData.value = { ...formData.value }
    hasUnsavedChanges.value = false
    
    // Show success message
    successMessage.value = 'Project details saved successfully!'
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save changes'
    console.error('Error saving changes:', err)
  } finally {
    saving.value = false
  }
}

const scheduleAutoSave = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  if (props.canEdit && hasUnsavedChanges.value) {
    autoSaveTimer = setTimeout(() => {
      saveChanges()
    }, 30000) // Auto-save after 30 seconds of inactivity
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'Invalid Date'
  }
}

const formatReportStatus = (status?: string) => {
  if (!status) return 'Not Set'
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getReportStatusVariant = (status?: string) => {
  switch (status) {
    case 'approved':
      return 'default'
    case 'pending_review':
      return 'secondary'
    case 'update_required':
      return 'destructive'
    default:
      return 'outline'
  }
}

// Enhanced Watchers
watch(() => props.project, (newProject) => {
  if (newProject) {
    const initializedData = initializeFormData(newProject)
    formData.value = initializedData
    originalFormData.value = { ...initializedData }
    hasUnsavedChanges.value = false
  }
}, { deep: true, immediate: true })

// Watch for form changes
watch(formData, (newData) => {
  hasUnsavedChanges.value = JSON.stringify(newData) !== JSON.stringify(originalFormData.value)
  emit('update:project', { ...newData })
  
  // Schedule auto-save
  scheduleAutoSave()
}, { deep: true })

// Lifecycle
onMounted(async () => {
  await loadProjectData()
})

// Cleanup
onUnmounted(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})

// Keyboard shortcuts
onMounted(() => {
  const handleKeydown = (event: KeyboardEvent) => {
    // Ctrl+S or Cmd+S to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      if (props.canEdit && hasUnsavedChanges.value) {
        saveChanges()
      }
    }
    
    // Escape to reset form
    if (event.key === 'Escape' && hasUnsavedChanges.value) {
      resetForm()
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  // Cleanup
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})
</script>

