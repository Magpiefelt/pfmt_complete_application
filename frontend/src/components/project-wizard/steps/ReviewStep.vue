<template>
  <div class="space-y-6">
    <!-- Step Header -->
    <div class="text-center">
      <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
        Review & Create Project
      </AlbertaText>
      <AlbertaText variant="body-m" color="secondary" class="max-w-2xl mx-auto">
        Please review all the information below before creating your project.
        You can go back to any previous step to make changes if needed.
      </AlbertaText>
    </div>

    <!-- Review Sections -->
    <div class="max-w-3xl mx-auto space-y-6">
      
      <!-- Template Information -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <AlbertaText tag="h4" variant="heading-s" color="primary">
              Project Template
            </AlbertaText>
            <Button variant="outline" size="sm" @click="$emit('edit-step', 1)">
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="selectedTemplate && selectedTemplate.id !== 'custom'" class="space-y-3">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <FileText class="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <AlbertaText variant="body-m" color="primary" class="font-medium">
                  {{ selectedTemplate.name }}
                </AlbertaText>
                <AlbertaText variant="body-s" color="secondary">
                  {{ selectedTemplate.category }} • ${{ formatCurrency(selectedTemplate.default_budget) }}
                </AlbertaText>
              </div>
            </div>
            <AlbertaText variant="body-s" color="secondary">
              {{ selectedTemplate.description }}
            </AlbertaText>
          </div>
          <div v-else class="flex items-center">
            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
              <Plus class="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <AlbertaText variant="body-m" color="primary" class="font-medium">
                Custom Project
              </AlbertaText>
              <AlbertaText variant="body-s" color="secondary">
                Starting from scratch with custom settings
              </AlbertaText>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Basic Information -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <AlbertaText tag="h4" variant="heading-s" color="primary">
              Basic Information
            </AlbertaText>
            <Button variant="outline" size="sm" @click="$emit('edit-step', 2)">
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label class="text-sm font-medium text-gray-500">Project Name</Label>
              <AlbertaText variant="body-m" color="primary" class="font-medium">
                {{ wizardData.basicInfo.projectName || 'Not specified' }}
              </AlbertaText>
            </div>
            <div>
              <Label class="text-sm font-medium text-gray-500">Category</Label>
              <AlbertaText variant="body-m" color="primary">
                {{ wizardData.basicInfo.category || 'Not specified' }}
              </AlbertaText>
            </div>
            <div>
              <Label class="text-sm font-medium text-gray-500">Project Type</Label>
              <AlbertaText variant="body-m" color="primary">
                {{ wizardData.basicInfo.projectType || 'Standard' }}
              </AlbertaText>
            </div>
            <div>
              <Label class="text-sm font-medium text-gray-500">Region</Label>
              <AlbertaText variant="body-m" color="primary">
                {{ wizardData.basicInfo.region || 'Alberta' }}
              </AlbertaText>
            </div>
            <div>
              <Label class="text-sm font-medium text-gray-500">Ministry</Label>
              <AlbertaText variant="body-m" color="primary">
                {{ wizardData.basicInfo.ministry || 'Infrastructure' }}
              </AlbertaText>
            </div>
            <div>
              <Label class="text-sm font-medium text-gray-500">Priority</Label>
              <div class="flex items-center">
                <div 
                  class="w-3 h-3 rounded-full mr-2"
                  :class="getPriorityColor(wizardData.basicInfo.priority)"
                ></div>
                <AlbertaText variant="body-m" color="primary">
                  {{ wizardData.basicInfo.priority || 'Medium' }}
                </AlbertaText>
              </div>
            </div>
          </div>
          
          <div class="mt-4">
            <Label class="text-sm font-medium text-gray-500">Description</Label>
            <AlbertaText variant="body-s" color="secondary" class="mt-1">
              {{ wizardData.basicInfo.description || 'No description provided' }}
            </AlbertaText>
          </div>

          <div v-if="wizardData.basicInfo.startDate || wizardData.basicInfo.expectedCompletion" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-if="wizardData.basicInfo.startDate">
              <Label class="text-sm font-medium text-gray-500">Start Date</Label>
              <AlbertaText variant="body-m" color="primary">
                {{ formatDate(wizardData.basicInfo.startDate) }}
              </AlbertaText>
            </div>
            <div v-if="wizardData.basicInfo.expectedCompletion">
              <Label class="text-sm font-medium text-gray-500">Expected Completion</Label>
              <AlbertaText variant="body-m" color="primary">
                {{ formatDate(wizardData.basicInfo.expectedCompletion) }}
              </AlbertaText>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Budget Information -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <AlbertaText tag="h4" variant="heading-s" color="primary">
              Budget Configuration
            </AlbertaText>
            <Button variant="outline" size="sm" @click="$emit('edit-step', 3)">
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide">
                Total Budget
              </AlbertaText>
              <AlbertaText variant="heading-s" color="primary" class="font-bold">
                ${{ formatCurrency(wizardData.budgetInfo.totalBudget) }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide">
                Initial


              </AlbertaText>
              <AlbertaText variant="heading-s" color="primary" class="font-bold">
                ${{ formatCurrency(wizardData.budgetInfo.initialBudget) }}
              </AlbertaText>
            </div>
            <div class="text-center p-4 bg-orange-50 rounded-lg">
              <AlbertaText variant="body-xs" color="secondary" class="uppercase tracking-wide">
                Duration
              </AlbertaText>
              <AlbertaText variant="heading-s" color="primary" class="font-bold">
                {{ wizardData.budgetInfo.estimatedDuration }} days
              </AlbertaText>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label class="text-sm font-medium text-gray-500">Funding Source</Label>
              <AlbertaText variant="body-m" color="primary">
                {{ wizardData.budgetInfo.fundingSource || 'Provincial Budget' }}
              </AlbertaText>
            </div>
            <div>
              <Label class="text-sm font-medium text-gray-500">Approval Required</Label>
              <AlbertaText variant="body-m" color="primary">
                {{ wizardData.budgetInfo.requiresApproval ? 'Yes' : 'No' }}
              </AlbertaText>
            </div>
          </div>

          <!-- Budget Breakdown -->
          <div v-if="wizardData.budgetInfo.budgetBreakdown && wizardData.budgetInfo.budgetBreakdown.length > 0" class="mt-4">
            <Label class="text-sm font-medium text-gray-500 mb-2 block">Budget Breakdown</Label>
            <div class="space-y-2">
              <div
                v-for="category in wizardData.budgetInfo.budgetBreakdown"
                :key="category.name"
                class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
              >
                <span class="text-sm text-gray-700">{{ category.name }}</span>
                <span class="text-sm font-medium">${{ formatCurrency(category.amount) }}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Team Assignment -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <AlbertaText tag="h4" variant="heading-s" color="primary">
              Team Assignment
            </AlbertaText>
            <Button variant="outline" size="sm" @click="$emit('edit-step', 4)">
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <!-- Project Manager -->
          <div class="mb-4">
            <Label class="text-sm font-medium text-gray-500 mb-2 block">Project Manager</Label>
            <div v-if="selectedProjectManager" class="flex items-center p-3 bg-blue-50 rounded-lg">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <AlbertaText variant="body-m" color="primary" class="font-medium">
                  {{ selectedProjectManager.name }}
                </AlbertaText>
                <AlbertaText variant="body-s" color="secondary">
                  {{ selectedProjectManager.role }} • {{ selectedProjectManager.department }}
                </AlbertaText>
              </div>
            </div>
            <div v-else class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlbertaText variant="body-s" color="primary" class="text-red-700">
                No Project Manager assigned
              </AlbertaText>
            </div>
          </div>

          <!-- Team Members -->
          <div>
            <Label class="text-sm font-medium text-gray-500 mb-2 block">
              Team Members ({{ wizardData.teamInfo.teamMembers?.length || 0 }})
            </Label>
            <div v-if="wizardData.teamInfo.teamMembers && wizardData.teamInfo.teamMembers.length > 0" class="space-y-2">
              <div
                v-for="member in wizardData.teamInfo.teamMembers"
                :key="member.userId"
                class="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <User class="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <AlbertaText variant="body-s" color="primary" class="font-medium">
                    {{ getMemberName(member.userId) }}
                  </AlbertaText>
                  <AlbertaText variant="body-xs" color="secondary">
                    {{ member.role }}
                  </AlbertaText>
                </div>
              </div>
            </div>
            <div v-else class="p-3 bg-gray-50 rounded-lg text-center">
              <AlbertaText variant="body-s" color="secondary">
                No additional team members assigned
              </AlbertaText>
            </div>
          </div>

          <!-- Team Summary -->
          <div class="mt-4 p-3 bg-blue-50 rounded-lg">
            <div class="flex justify-between items-center">
              <AlbertaText variant="body-s" color="secondary">Total Team Size:</AlbertaText>
              <AlbertaText variant="body-s" color="primary" class="font-medium">
                {{ totalTeamSize }} members
              </AlbertaText>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Final Confirmation -->
      <Card>
        <CardContent>
          <div class="text-center space-y-4">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle class="w-8 h-8 text-green-600" />
            </div>
            <div>
              <AlbertaText tag="h4" variant="heading-s" color="primary" class="mb-2">
                Ready to Create Project
              </AlbertaText>
              <AlbertaText variant="body-m" color="secondary" class="max-w-md mx-auto">
                All required information has been provided. Click the button below to create your project
                and begin the project lifecycle.
              </AlbertaText>
            </div>

            <!-- Create Project Button -->
            <Button 
              size="lg" 
              @click="createProject"
              :disabled="isCreating || !canCreate"
              class="w-full max-w-xs mx-auto"
            >
              <LoadingSpinner v-if="isCreating" class="w-5 h-5 mr-2" />
              <span v-if="isCreating">Creating Project...</span>
              <span v-else>Create Project</span>
            </Button>

            <!-- Terms and Conditions -->
            <div class="text-center">
              <label class="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <input
                  v-model="termsAccepted"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span>
                  I confirm that all information is accurate and I have authority to create this project
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { FileText, Plus, User, CheckCircle } from 'lucide-vue-next'
import { AlbertaText, Label, Button } from '@/components/ui'
import { Card, CardHeader, CardContent } from '@/components/ui'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import { formatCurrency, formatDate } from '@/utils'
import { useProjectWizard } from '@/composables/useProjectWizard'

// Props
const props = defineProps<{
  wizardData: any
  selectedTemplate?: any
}>()

// Emits
const emit = defineEmits<{
  projectCreated: [project: any]
  editStep: [stepNumber: number]
}>()

// Composable
const { completeWizard, getAvailableTeamMembers } = useProjectWizard()

// State
const isCreating = ref(false)
const termsAccepted = ref(false)
const availableTeamMembers = ref([])

// Computed
const selectedProjectManager = computed(() => {
  if (!props.wizardData.teamInfo.projectManager) return null
  return availableTeamMembers.value.find(member => 
    member.id === props.wizardData.teamInfo.projectManager
  )
})

const totalTeamSize = computed(() => {
  const pmCount = props.wizardData.teamInfo.projectManager ? 1 : 0
  const teamCount = props.wizardData.teamInfo.teamMembers?.length || 0
  return pmCount + teamCount
})

const canCreate = computed(() => {
  return termsAccepted.value && 
         props.wizardData.basicInfo.projectName &&
         props.wizardData.basicInfo.category &&
         props.wizardData.budgetInfo.totalBudget > 0 &&
         props.wizardData.teamInfo.projectManager
})

// Methods
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Low': return 'bg-green-500'
    case 'Medium': return 'bg-blue-500'
    case 'High': return 'bg-orange-500'
    case 'Critical': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getMemberName = (userId: string) => {
  const member = availableTeamMembers.value.find(m => m.id === userId)
  return member ? member.name : 'Unknown Member'
}

const createProject = async () => {
  if (!canCreate.value) return

  try {
    isCreating.value = true
    const project = await completeWizard()
    emit('projectCreated', project)
  } catch (error) {
    console.error('Error creating project:', error)
    alert('Failed to create project. Please try again.')
  } finally {
    isCreating.value = false
  }
}

// Load team members for display
const loadTeamMembers = async () => {
  try {
    availableTeamMembers.value = await getAvailableTeamMembers()
  } catch (error) {
    console.error('Error loading team members:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadTeamMembers()
})
</script>

<style scoped>
/* Review step specific styles */
.review-section {
  transition: all 0.2s ease-in-out;
}

.review-section:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Budget visualization */
.budget-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

/* Team member cards */
.team-member {
  transition: all 0.2s ease-in-out;
}

.team-member:hover {
  background-color: #f8fafc;
}
</style>

