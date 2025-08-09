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
                <SelectItem value="provincial">Provincial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Project Status and Phase -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="status">Project Status</Label>
            <Select v-model="formData.status" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="phase">Project Phase</Label>
            <Select v-model="formData.project_phase" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initiation">Initiation</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="procurement">Procurement</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="commissioning">Commissioning</SelectItem>
                <SelectItem value="closeout">Closeout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <Label for="end-date">End Date</Label>
            <Input
              id="end-date"
              v-model="formData.end_date"
              :disabled="!canEdit"
              type="date"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="completion-date">Actual Completion Date</Label>
            <Input
              id="completion-date"
              v-model="formData.completion_date"
              :disabled="!canEdit"
              type="date"
              class="mt-1"
            />
          </div>
        </div>

        <!-- Priority and Risk Level -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="priority">Priority Level</Label>
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

          <div>
            <Label for="risk-level">Risk Level</Label>
            <Select v-model="formData.risk_level" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select risk level" />
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
      </CardContent>
    </Card>

    <!-- Approval & Identification -->
    <Card>
      <CardHeader>
        <CardTitle>Approval & Identification</CardTitle>
        <CardDescription>
          Project approval details and identification numbers.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="approval-year">Approval Year</Label>
            <Input
              id="approval-year"
              v-model="formData.approval_year"
              :disabled="!canEdit"
              type="number"
              min="2000"
              max="2050"
              placeholder="e.g., 2024"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="cpd-number">CPD Number</Label>
            <Input
              id="cpd-number"
              v-model="formData.cpd_number"
              :disabled="!canEdit"
              placeholder="Enter CPD number"
              class="mt-1"
            />
          </div>
        </div>

        <div>
          <Label for="capital-plan-line">Capital Plan Line</Label>
          <Select v-model="formData.capital_plan_line_id" :disabled="!canEdit">
            <SelectTrigger class="mt-1">
              <SelectValue placeholder="Select capital plan line" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="loading" disabled>Loading capital plan lines...</SelectItem>
              <!-- Capital plan lines will be loaded dynamically -->
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <!-- Enhanced Project Classification -->
    <Card>
      <CardHeader>
        <CardTitle>Project Classification</CardTitle>
        <CardDescription>
          Detailed project classification and delivery information.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="project-type">Project Type</Label>
            <Select v-model="formData.project_type" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_construction">New Construction</SelectItem>
                <SelectItem value="renovation">Renovation</SelectItem>
                <SelectItem value="expansion">Expansion</SelectItem>
                <SelectItem value="replacement">Replacement</SelectItem>
                <SelectItem value="maintenance">Major Maintenance</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="delivery-type">Delivery Type</Label>
            <Select v-model="formData.delivery_type" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select delivery type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="traditional">Traditional</SelectItem>
                <SelectItem value="design_build">Design-Build</SelectItem>
                <SelectItem value="p3">P3 (Public-Private Partnership)</SelectItem>
                <SelectItem value="cm_at_risk">CM at Risk</SelectItem>
                <SelectItem value="integrated">Integrated Project Delivery</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="specific-delivery-type">Specific Delivery Type</Label>
            <Select v-model="formData.specific_delivery_type" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select specific delivery type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lump_sum">Lump Sum</SelectItem>
                <SelectItem value="unit_price">Unit Price</SelectItem>
                <SelectItem value="cost_plus">Cost Plus</SelectItem>
                <SelectItem value="guaranteed_maximum">Guaranteed Maximum Price</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="delivery-method">Delivery Method</Label>
            <Select v-model="formData.delivery_method" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select delivery method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="competitive_bid">Competitive Bid</SelectItem>
                <SelectItem value="negotiated">Negotiated</SelectItem>
                <SelectItem value="sole_source">Sole Source</SelectItem>
                <SelectItem value="request_for_proposal">Request for Proposal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="program">Program</Label>
            <Input
              id="program"
              v-model="formData.program"
              :disabled="!canEdit"
              placeholder="Enter program name"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="geographic-region">Geographic Region</Label>
            <Select v-model="formData.geographic_region" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select geographic region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calgary_region">Calgary Region</SelectItem>
                <SelectItem value="edmonton_region">Edmonton Region</SelectItem>
                <SelectItem value="central_alberta">Central Alberta</SelectItem>
                <SelectItem value="northern_alberta">Northern Alberta</SelectItem>
                <SelectItem value="southern_alberta">Southern Alberta</SelectItem>
                <SelectItem value="provincial">Provincial</SelectItem>
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

    <!-- Government/School Associations -->
    <Card>
      <CardHeader>
        <CardTitle>Government & School Associations</CardTitle>
        <CardDescription>
          Ministry and school jurisdiction associations for this project.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="client-ministry">Client Ministry</Label>
            <Select v-model="formData.client_ministry_id" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select client ministry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loading" disabled>Loading ministries...</SelectItem>
                <!-- Ministries will be loaded dynamically -->
              </SelectContent>
            </Select>
          </div>

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
        </div>
      </CardContent>
    </Card>

    <!-- Facility Metrics -->
    <Card>
      <CardHeader>
        <CardTitle>Facility Metrics</CardTitle>
        <CardDescription>
          Facility-specific measurements and capacity information.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="number-of-beds">Number of Beds</Label>
            <Input
              id="number-of-beds"
              v-model="formData.number_of_beds"
              :disabled="!canEdit"
              type="number"
              min="0"
              placeholder="Enter number of beds"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="total-opening-capacity">Total Opening Capacity</Label>
            <Input
              id="total-opening-capacity"
              v-model="formData.total_opening_capacity"
              :disabled="!canEdit"
              type="number"
              min="0"
              placeholder="Enter opening capacity"
              class="mt-1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="capacity-full-build">Capacity at Full Build-out</Label>
            <Input
              id="capacity-full-build"
              v-model="formData.capacity_at_full_build_out"
              :disabled="!canEdit"
              type="number"
              min="0"
              placeholder="Enter full build-out capacity"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="square-meters">Square Meters</Label>
            <Input
              id="square-meters"
              v-model="formData.square_meters"
              :disabled="!canEdit"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter square meters"
              class="mt-1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="number-of-jobs">Number of Jobs</Label>
            <Input
              id="number-of-jobs"
              v-model="formData.number_of_jobs"
              :disabled="!canEdit"
              type="number"
              min="0"
              placeholder="Enter number of jobs created"
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
              v-model="formData.grades_from"
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
              v-model="formData.grades_to"
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

    <!-- Reporting & Status Metadata -->
    <Card>
      <CardHeader>
        <CardTitle>Reporting & Status Metadata</CardTitle>
        <CardDescription>
          Project reporting status and modification tracking.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="report-status">Report Status</Label>
            <div class="mt-1">
              <Badge 
                :variant="getReportStatusVariant(formData.report_status)"
                class="text-sm"
              >
                {{ formatReportStatus(formData.report_status) }}
              </Badge>
            </div>
          </div>

          <div>
            <Label>Last Modified</Label>
            <div class="mt-1 text-sm text-gray-600">
              <span v-if="formData.modified_by">
                by {{ formData.modified_by }} on {{ formatDate(formData.modified_date) }}
              </span>
              <span v-else>No modification data available</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Date-related Fields -->
    <Card>
      <CardHeader>
        <CardTitle>Important Dates</CardTitle>
        <CardDescription>
          Key project dates and reporting milestones.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="reporting-as-of-date">Reporting As Of Date</Label>
            <Input
              id="reporting-as-of-date"
              v-model="formData.reporting_as_of_date"
              :disabled="!canEdit"
              type="date"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="director-review-date">Director Review Date</Label>
            <Input
              id="director-review-date"
              v-model="formData.director_review_date"
              :disabled="!canEdit"
              type="date"
              class="mt-1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="pfmt-data-date">PFMT Data Date</Label>
            <Input
              id="pfmt-data-date"
              v-model="formData.pfmt_data_date"
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

    <!-- Additional Details -->
    <Card>
      <CardHeader>
        <CardTitle>Additional Details</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Objectives -->
        <div>
          <Label for="objectives">Project Objectives</Label>
          <Textarea
            id="objectives"
            v-model="formData.objectives"
            :disabled="!canEdit"
            placeholder="Key project objectives and goals..."
            :rows="3"
            class="mt-1"
          />
        </div>

        <!-- Scope -->
        <div>
          <Label for="scope">Project Scope</Label>
          <Textarea
            id="scope"
            v-model="formData.scope"
            :disabled="!canEdit"
            placeholder="Detailed project scope and deliverables..."
            :rows="3"
            class="mt-1"
          />
        </div>

        <!-- Constraints -->
        <div>
          <Label for="constraints">Constraints & Assumptions</Label>
          <Textarea
            id="constraints"
            v-model="formData.constraints"
            :disabled="!canEdit"
            placeholder="Project constraints, assumptions, and limitations..."
            :rows="3"
            class="mt-1"
          />
        </div>

        <!-- Success Criteria -->
        <div>
          <Label for="success-criteria">Success Criteria</Label>
          <Textarea
            id="success-criteria"
            v-model="formData.success_criteria"
            :disabled="!canEdit"
            placeholder="How will project success be measured..."
            :rows="3"
            class="mt-1"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Action Buttons -->
    <div v-if="canEdit" class="flex items-center justify-end space-x-2">
      <Button variant="outline" @click="resetForm">
        Reset Changes
      </Button>
      <Button @click="saveChanges" :disabled="!hasChanges">
        <Save class="h-4 w-4 mr-2" />
        Save Changes
      </Button>
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
} from '@/components/ui'

interface Project {
  id: string
  name: string
  project_code?: string
  description?: string
  category?: string
  ministry?: string
  region?: string
  status: string
  project_phase: string
  start_date?: string
  end_date?: string
  completion_date?: string
  priority?: string
  risk_level?: string
  objectives?: string
  scope?: string
  constraints?: string
  success_criteria?: string
  
  // New fields
  approval_year?: number
  cpd_number?: string
  capital_plan_line_id?: string
  project_type?: string
  delivery_type?: string
  specific_delivery_type?: string
  delivery_method?: string
  program?: string
  geographic_region?: string
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
  modified_by?: string
  modified_date?: string
  reporting_as_of_date?: string
  director_review_date?: string
  pfmt_data_date?: string
  archived_date?: string
  
  [key: string]: any
}

interface Props {
  project: Project
  viewMode: 'draft' | 'approved'
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:project': [project: Project]
  'save-changes': [changes: Partial<Project>]
}>()

// Form data
const formData = ref<Project>({ ...props.project })
const originalData = ref<Project>({ ...props.project })

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
  return new Date(dateString).toLocaleDateString()
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
  formData.value = { ...newProject }
  originalData.value = { ...newProject }
}, { deep: true })

// Watch for form changes and emit updates
watch(formData, (newData) => {
  emit('update:project', { ...newData })
}, { deep: true })

onMounted(() => {
  formData.value = { ...props.project }
  originalData.value = { ...props.project }
})
</script>

