<template>
  <div class="space-y-6">
    <!-- Project Information Form -->
    <Card>
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
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
            v-model="formData.funded_to_complete"
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
              v-model="formData.is_charter_school"
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
import { ref, computed, watch, onMounted } from 'vue'
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

// FIXED: Initialize form data with proper boolean defaults
const initializeFormData = (project: Project): Project => {
  return {
    ...project,
    // Ensure boolean fields have proper defaults to prevent Switch component warnings
    funded_to_complete: Boolean(project.funded_to_complete || false),
    is_charter_school: Boolean(project.is_charter_school || false),
    // Normalize field names for consistency
    name: project.name || project.project_name || '',
    description: project.description || project.project_description || '',
    category: project.category || project.project_category || '',
    status: project.status || project.project_status || '',
    region: project.region || project.geographic_region || '',
  }
}

// Form data with proper initialization
const formData = ref<Project>(initializeFormData(props.project))
const originalData = ref<Project>(initializeFormData(props.project))

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

// Methods
const resetForm = () => {
  formData.value = { ...originalData.value }
}

const saveChanges = () => {
  const changes: Partial<Project> = {}
  
  // Only include changed fields
  Object.keys(formData.value).forEach(key => {
    if (formData.value[key] !== originalData.value[key]) {
      changes[key] = formData.value[key]
    }
  })

  emit('save-changes', changes)
  originalData.value = { ...formData.value }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString()
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

// Watch for external project changes
watch(() => props.project, (newProject) => {
  const initializedData = initializeFormData(newProject)
  formData.value = initializedData
  originalData.value = initializedData
}, { deep: true })

// Watch for form changes and emit updates
watch(formData, (newData) => {
  emit('update:project', { ...newData })
}, { deep: true })

onMounted(() => {
  const initializedData = initializeFormData(props.project)
  formData.value = initializedData
  originalData.value = initializedData
})
</script>

