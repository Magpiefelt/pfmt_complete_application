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
            rows="4"
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
            rows="3"
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
            rows="3"
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
            rows="3"
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
            rows="3"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

