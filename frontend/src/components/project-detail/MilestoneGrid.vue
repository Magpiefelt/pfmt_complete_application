<template>
  <div class="space-y-4">
    <!-- Grid Header -->
    <div class="flex items-center justify-between">
      <div>
        <h4 class="text-md font-semibold">{{ phase }} Milestones</h4>
        <p class="text-sm text-gray-600">Track {{ phase.toLowerCase() }} phase milestones and dates</p>
      </div>
      <Button 
        v-if="canEdit && hasChanges" 
        @click="saveMilestones"
        :disabled="saving"
        class="flex items-center space-x-2"
      >
        <Save class="h-4 w-4" />
        <span>{{ saving ? 'Saving...' : 'Save Milestones' }}</span>
      </Button>
    </div>

    <!-- Milestone Grid -->
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  N/A
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Milestone
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Status
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  Planned Date
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  Actual Date
                </th>
                <th 
                  v-if="hasBaselineMilestones" 
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36"
                >
                  <span class="text-blue-600">Baseline Date</span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Notes
                </th>
                <th v-if="hasGateMeetingLinks" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Meeting
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="milestone in milestones" 
                :key="milestone.id"
                class="hover:bg-gray-50 transition-colors"
                :class="{ 'opacity-50': milestone.data.is_na }"
              >
                <!-- N/A Checkbox -->
                <td class="px-4 py-4">
                  <input
                    type="checkbox"
                    v-model="milestone.data.is_na"
                    @change="handleNAChange(milestone)"
                    :disabled="!canEdit"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </td>

                <!-- Milestone Name -->
                <td class="px-4 py-4">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ milestone.name }}
                    </div>
                    <div v-if="milestone.description" class="text-xs text-gray-500 mt-1">
                      {{ milestone.description }}
                    </div>
                  </div>
                </td>

                <!-- Status Badge -->
                <td class="px-4 py-4">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getMilestoneStatusClass(getMilestoneStatus(milestone.data))"
                  >
                    {{ getStatusLabel(getMilestoneStatus(milestone.data)) }}
                  </span>
                </td>

                <!-- Planned Date -->
                <td class="px-4 py-4">
                  <input
                    type="date"
                    v-model="milestone.data.planned_date"
                    @change="markAsChanged"
                    :disabled="!canEdit || milestone.data.is_na"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </td>

                <!-- Actual Date -->
                <td class="px-4 py-4">
                  <input
                    type="date"
                    v-model="milestone.data.actual_date"
                    @change="markAsChanged"
                    :disabled="!canEdit || milestone.data.is_na"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </td>

                <!-- Baseline Date (if applicable) -->
                <td v-if="hasBaselineMilestones" class="px-4 py-4">
                  <input
                    v-if="milestone.hasBaseline"
                    type="date"
                    v-model="milestone.data.baseline_date"
                    @change="markAsChanged"
                    :disabled="!canEdit || milestone.data.is_na"
                    class="w-full px-2 py-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-blue-50"
                  />
                  <span v-else class="text-gray-400 text-sm">—</span>
                </td>

                <!-- Notes -->
                <td class="px-4 py-4">
                  <textarea
                    v-model="milestone.data.notes"
                    @input="markAsChanged"
                    :disabled="!canEdit || milestone.data.is_na"
                    :maxlength="500"
                    rows="2"
                    placeholder="Add notes..."
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                  ></textarea>
                  <div v-if="milestone.data.notes" class="text-xs text-gray-400 mt-1">
                    {{ milestone.data.notes.length }}/500
                  </div>
                </td>

                <!-- Gate Meeting Link -->
                <td v-if="hasGateMeetingLinks" class="px-4 py-4">
                  <Button
                    v-if="milestone.gateMeetingType"
                    variant="outline"
                    size="sm"
                    @click="viewGateMeeting(milestone)"
                    class="text-xs"
                  >
                    <Calendar class="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <span v-else class="text-gray-400 text-sm">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Validation Errors -->
    <div v-if="validationErrors.length > 0" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <AlertTriangle class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            Please fix the following issues:
          </h3>
          <div class="mt-2 text-sm text-red-700">
            <ul class="list-disc pl-5 space-y-1">
              <li v-for="error in validationErrors" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccessMessage" class="bg-green-50 border border-green-200 rounded-md p-4">
      <div class="flex">
        <CheckCircle class="h-5 w-5 text-green-400" />
        <div class="ml-3">
          <p class="text-sm font-medium text-green-800">
            Milestones saved successfully!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Save, 
  Calendar, 
  AlertTriangle, 
  CheckCircle 
} from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import type { 
  MilestoneDefinition, 
  MilestoneData, 
  MilestoneRecord,
  ProjectMilestones
} from '@/types/milestones'
import { 
  getMilestoneStatus, 
  getMilestoneStatusClass, 
  validateMilestoneData,
  createEmptyMilestoneData
} from '@/types/milestones'

interface Props {
  phase: string
  milestoneDefinitions: MilestoneDefinition[]
  milestoneData: ProjectMilestones
  canEdit: boolean
  viewMode?: 'draft' | 'approved'
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'approved'
})

const emit = defineEmits<{
  'update:milestoneData': [data: ProjectMilestones]
  'save-milestones': [phase: string, data: ProjectMilestones]
  'view-gate-meeting': [milestone: MilestoneDefinition]
}>()

// Local state
const hasChanges = ref(false)
const saving = ref(false)
const showSuccessMessage = ref(false)
const validationErrors = ref<string[]>([])

// Computed properties
const milestones = computed<MilestoneRecord[]>(() => {
  return props.milestoneDefinitions.map(definition => ({
    ...definition,
    data: props.milestoneData[definition.id] || createEmptyMilestoneData()
  }))
})

const hasBaselineMilestones = computed(() => {
  return props.milestoneDefinitions.some(m => m.hasBaseline)
})

const hasGateMeetingLinks = computed(() => {
  return props.milestoneDefinitions.some(m => m.gateMeetingType)
})

// Methods
const markAsChanged = () => {
  hasChanges.value = true
  validateMilestones()
}

const handleNAChange = (milestone: MilestoneRecord) => {
  if (milestone.data.is_na) {
    // Clear dates and notes when marked as N/A
    milestone.data.planned_date = null
    milestone.data.actual_date = null
    milestone.data.baseline_date = null
    milestone.data.notes = ''
  }
  markAsChanged()
}

const validateMilestones = () => {
  const errors: string[] = []
  
  milestones.value.forEach(milestone => {
    const milestoneErrors = validateMilestoneData(milestone.data)
    milestoneErrors.forEach(error => {
      errors.push(`${milestone.name}: ${error}`)
    })
  })
  
  validationErrors.value = errors
}

const saveMilestones = async () => {
  if (validationErrors.value.length > 0) {
    return
  }
  
  saving.value = true
  
  try {
    // Create updated milestone data
    const updatedData: ProjectMilestones = { ...props.milestoneData }
    
    milestones.value.forEach(milestone => {
      updatedData[milestone.id] = { ...milestone.data }
    })
    
    // Emit save event
    emit('save-milestones', props.phase, updatedData)
    
    // Update parent data
    emit('update:milestoneData', updatedData)
    
    // Show success message
    hasChanges.value = false
    showSuccessMessage.value = true
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 3000)
    
  } catch (error) {
    console.error('Failed to save milestones:', error)
  } finally {
    saving.value = false
  }
}

const viewGateMeeting = (milestone: MilestoneDefinition) => {
  emit('view-gate-meeting', milestone)
}

const getStatusLabel = (status: string): string => {
  const labels = {
    'not-applicable': 'N/A',
    'not-started': 'Not Started',
    'planned': 'Planned',
    'completed': 'Completed',
    'overdue': 'Overdue'
  }
  
  return labels[status as keyof typeof labels] || 'Unknown'
}

// Watch for changes in milestone data
watch(
  () => props.milestoneData,
  () => {
    validateMilestones()
  },
  { deep: true, immediate: true }
)

// Watch for changes in edit mode
watch(
  () => props.canEdit,
  (newCanEdit) => {
    if (!newCanEdit) {
      hasChanges.value = false
    }
  }
)
</script>

<style scoped>
/* Custom styles for baseline date inputs */
.bg-blue-50 {
  background-color: #eff6ff;
}

/* Ensure table is responsive */
table {
  min-width: 800px;
}

/* Custom scrollbar for table container */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

