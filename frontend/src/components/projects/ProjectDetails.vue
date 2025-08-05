<template>
  <div class="space-y-6">
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
          <div v-for="field in projectDetailsFields" :key="field.key" 
               :class="field.type === 'textarea' ? 'md:col-span-2' : ''">
            <label :for="field.key" class="text-sm font-medium text-gray-700">
              {{ field.label }}
              <span v-if="field.required" class="text-red-500 ml-1">*</span>
            </label>
            <textarea
              v-if="field.type === 'textarea'"
              :id="field.key"
              v-model="formData[field.key]"
              :disabled="!isEditing"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              rows="3"
              :placeholder="isEditing ? `Enter ${field.label.toLowerCase()}` : 'No data available'"
            />
            <input
              v-else
              :id="field.key"
              :type="field.type"
              v-model="formData[field.key]"
              :disabled="!isEditing"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              :placeholder="isEditing ? `Enter ${field.label.toLowerCase()}` : 'No data available'"
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
          <div v-for="field in financialFields" :key="field.key">
            <label :for="field.key" class="text-sm font-medium text-gray-700">
              {{ field.label }}
            </label>
            <div class="relative mt-1">
              <span v-if="field.prefix" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {{ field.prefix }}
              </span>
              <input
                :id="field.key"
                :type="field.type"
                v-model="formData[field.key]"
                :disabled="!isEditing"
                :class="`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${field.prefix ? 'pl-8' : ''}`"
                :placeholder="isEditing ? `Enter ${field.label.toLowerCase()}` : 'No data available'"
              />
            </div>
            <!-- Display formatted value when not editing -->
            <p v-if="!isEditing && formData[field.key] && field.prefix === '$'" 
               class="text-sm text-gray-600 mt-1">
              Formatted: ${{ Number(formData[field.key]).toLocaleString() }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Project Milestones -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Calendar class="h-5 w-5" />
          Project Milestones
        </CardTitle>
        <CardContent class="text-sm text-gray-600">
          Key project milestones and timeline
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
                  :value="getMilestoneData(milestone.key).plannedDate"
                  @input="updateMilestone(milestone.key, 'plannedDate', $event.target.value)"
                  :disabled="!isEditing"
                  class="text-xs h-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                />
                </div>
                
                <div class="col-span-2">
                <input
                  type="date"
                  :value="getMilestoneData(milestone.key).actualDate"
                  @input="updateMilestone(milestone.key, 'actualDate', $event.target.value)"
                  :disabled="!isEditing"
                  class="text-xs h-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                />
                </div>
                
                <div class="col-span-2">
                <input
                  type="date"
                  :value="getMilestoneData(milestone.key).baselineDate"
                  @input="updateMilestone(milestone.key, 'baselineDate', $event.target.value)"
                  :disabled="!isEditing"
                  class="text-xs h-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                />
                </div>
                
                <div class="col-span-2">
                <input
                  type="text"
                  :value="getMilestoneData(milestone.key).notes"
                  @input="updateMilestone(milestone.key, 'notes', $event.target.value)"
                  :disabled="!isEditing"
                  class="text-xs h-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Notes..."
                />
                </div>
                
                <div class="col-span-1 flex items-center justify-center">
                <input
                  type="checkbox"
                  :checked="getMilestoneData(milestone.key).notApplicable"
                  @change="updateMilestone(milestone.key, 'notApplicable', $event.target.checked)"
                  :disabled="!isEditing"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Building, DollarSign, Calendar, Target, Edit, CheckCircle, Clock } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

interface Props {
  project: any
  isEditing: boolean
}

interface Emits {
  (e: 'update', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form data
const formData = ref<any>({})
const activePhase = ref('planning')

// Field definitions
const projectDetailsFields = [
  { key: 'name', label: 'Project Name', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'category', label: 'Project Category', type: 'text' },
  { key: 'clientMinistry', label: 'Client Ministry', type: 'text' },
  { key: 'projectType', label: 'Project Type', type: 'text' },
  { key: 'deliveryType', label: 'Delivery Type', type: 'text' },
  { key: 'deliveryMethod', label: 'Delivery Method', type: 'text' },
  { key: 'branch', label: 'Branch', type: 'text' },
  { key: 'geographicRegion', label: 'Geographic Region', type: 'text' },
  { key: 'squareMeters', label: 'Square Meters', type: 'number' },
  { key: 'numberOfStructures', label: 'Number of Structures', type: 'number' },
  { key: 'numberOfJobs', label: 'Number of Jobs', type: 'number' }
]

const financialFields = [
  { key: 'taf', label: 'Total Approved Funding (TAF)', type: 'number', prefix: '$' },
  { key: 'eac', label: 'Estimate at Completion (EAC)', type: 'number', prefix: '$' },
  { key: 'totalBudget', label: 'Total Budget', type: 'number', prefix: '$' },
  { key: 'amountSpent', label: 'Amount Spent', type: 'number', prefix: '$' },
  { key: 'currentYearCashflow', label: 'Current Year Cashflow', type: 'number', prefix: '$' },
  { key: 'currentYearTarget', label: 'Current Year Target', type: 'number', prefix: '$' }
]

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

// Initialize form data when project changes
watch(() => props.project, (newProject) => {
  if (newProject) {
    formData.value = { ...newProject }
  }
}, { immediate: true })

// Watch form data changes and emit updates
watch(formData, (newData) => {
  emit('update', newData)
}, { deep: true })

const getMilestoneData = (milestoneKey: string) => {
  return props.project?.milestones?.[milestoneKey] || {}
}

const updateMilestone = (milestoneKey: string, field: string, value: any) => {
  if (!props.isEditing) return
  
  const currentMilestones = props.project?.milestones || {}
  const updatedMilestones = {
    ...currentMilestones,
    [milestoneKey]: {
      ...currentMilestones[milestoneKey],
      [field]: value
    }
  }
  
  emit('update', { milestones: updatedMilestones })
}
</script>

