<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <Button 
              variant="ghost" 
              @click="router.back()"
              class="mr-4"
            >
              <ArrowLeft class="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 class="text-xl font-semibold text-gray-900">Create New Project</h1>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading templates...</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Project Creation Options -->
      <div v-if="!showWizard" class="space-y-8">
        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Guided Wizard -->
          <Card class="p-6 hover:shadow-lg transition-shadow cursor-pointer" @click="startWizard">
            <div class="text-center">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap class="h-6 w-6 text-blue-600" />
              </div>
              <h3 class="text-lg font-semibold mb-2">Guided Project Wizard</h3>
              <p class="text-gray-600 mb-4">Step-by-step guidance to create a complete project with all required information.</p>
              <Button class="w-full">
                Start Wizard
                <ArrowRight class="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>

          <!-- Quick Form -->
          <Card class="p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50" @click="showQuickFormNotice">
            <div class="text-center">
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText class="h-6 w-6 text-gray-600" />
              </div>
              <h3 class="text-lg font-semibold mb-2">Quick Form</h3>
              <p class="text-gray-600 mb-4">Create a basic project quickly with minimal information. Details can be added later.</p>
              <Button variant="outline" class="w-full" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>
        </div>

        <!-- Recent Templates -->
        <div v-if="recentTemplates.length > 0">
          <h2 class="text-lg font-semibold mb-4">Recent Templates</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              v-for="template in recentTemplates" 
              :key="template.id"
              class="p-4 hover:shadow-md transition-shadow cursor-pointer"
              @click="startWizardWithTemplate(template)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium mb-1">{{ template.name }}</h3>
                  <p class="text-sm text-gray-600 mb-2">{{ template.description }}</p>
                  <Badge variant="outline" class="text-xs">
                    {{ template.category }}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowRight class="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <!-- Project Wizard -->
      <div v-else>
        <ProjectWizard
          :selected-template="selectedTemplate"
          @completed="handleWizardCompleted"
          @cancelled="handleWizardCancelled"
        />
      </div>
    </div>

    <!-- Success Modal -->
    <Dialog v-model:open="showSuccessModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle class="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle>Project Created Successfully!</DialogTitle>
              <DialogDescription>
                Your project "{{ createdProjectName }}" has been created.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Project ID:</span>
              <span class="font-mono">{{ createdProjectId }}</span>
            </div>
          </div>
          
          <div class="text-sm text-gray-600">
            <p>You can now:</p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>View and edit project details</li>
              <li>Add team members and contractors</li>
              <li>Set up milestones and schedules</li>
              <li>Manage project budget and finances</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter class="flex space-x-2">
          <Button variant="outline" @click="goToProjectsList">
            View All Projects
          </Button>
          <Button @click="goToProjectDetail">
            Open Project
            <ArrowRight class="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Error Modal -->
    <Dialog v-model:open="showErrorModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle class="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle>Navigation Issue</DialogTitle>
              <DialogDescription>
                Project created successfully, but there was an issue opening the project page.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div class="space-y-4">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-800">
              <strong>Good news:</strong> Your project "{{ createdProjectName }}" was created successfully!
            </p>
            <p class="text-sm text-yellow-700 mt-2">
              You can find it in your projects list or try opening it directly using the button below.
            </p>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Project ID:</span>
              <span class="font-mono">{{ createdProjectId }}</span>
            </div>
          </div>
        </div>
        
        <DialogFooter class="flex space-x-2">
          <Button variant="outline" @click="goToProjectsList">
            View All Projects
          </Button>
          <Button @click="retryProjectNavigation">
            Try Again
            <RefreshCw class="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  ArrowRight, 
  Zap, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-vue-next'
import { Button, Card, Badge } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import ProjectWizard from '@/components/project-wizard/ProjectWizard.vue'
import { ProjectWizardService } from '@/services/projectWizardService'

const router = useRouter()

// State
const loading = ref(false)
const showWizard = ref(false)
const selectedTemplate = ref(null)
const recentTemplates = ref([])

// Success/Error handling
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const createdProjectName = ref('')
const createdProjectId = ref('')
const navigationError = ref('')

// Start wizard
const startWizard = () => {
  showWizard.value = true
  selectedTemplate.value = null
}

// Start wizard with specific template
const startWizardWithTemplate = (template: any) => {
  selectedTemplate.value = template
  showWizard.value = true
}

// ENHANCED: Handle wizard completion with better error handling and user feedback
const handleWizardCompleted = async (project: any) => {
  console.log('Project created successfully:', project)
  
  // Store project info for modals
  createdProjectName.value = project.projectName || project.project_name || project.name || 'New Project'
  createdProjectId.value = project.id || ''
  
  // Hide wizard
  showWizard.value = false
  
  // ProjectWizard component now handles navigation directly
  // Just show success feedback here
  console.log(`SUCCESS: Project "${createdProjectName.value}" created successfully!`)
}

// Handle wizard cancellation
const handleWizardCancelled = () => {
  showWizard.value = false
  selectedTemplate.value = null
}

// Navigation helpers
const goToProjectDetail = async () => {
  showSuccessModal.value = false
  showErrorModal.value = false
  
  if (createdProjectId.value) {
    try {
      await router.push({ 
        name: 'project-detail', 
        params: { id: String(createdProjectId.value) }
      })
    } catch (error) {
      console.error('Failed to navigate to project detail:', error)
      // Fallback to projects list
      goToProjectsList()
    }
  } else {
    goToProjectsList()
  }
}

const goToProjectsList = async () => {
  showSuccessModal.value = false
  showErrorModal.value = false
  
  try {
    await router.push('/projects?filter=my')
  } catch (error) {
    console.error('Failed to navigate to projects list:', error)
    // Force page reload as last resort
    window.location.href = '/projects'
  }
}

const retryProjectNavigation = async () => {
  if (createdProjectId.value) {
    try {
      await router.push({ 
        name: 'project-detail', 
        params: { id: String(createdProjectId.value) }
      })
      showErrorModal.value = false
    } catch (error) {
      console.error('Retry navigation failed:', error)
      // Keep error modal open, suggest projects list
      navigationError.value = 'Unable to open project page. Please try from the projects list.'
    }
  } else {
    goToProjectsList()
  }
}

// Show quick form notice
const showQuickFormNotice = () => {
  alert('Quick form creation is coming in a future update. Please use the guided wizard for now.')
}

// Load recent templates
const loadRecentTemplates = async () => {
  try {
    loading.value = true
    const templates = await ProjectWizardService.getProjectTemplates()
    
    // Show first 3 templates as "recent"
    recentTemplates.value = templates.slice(0, 3)
  } catch (error) {
    console.error('Error loading templates:', error)
    // Don't show error to user for template loading failure
    // The wizard can still work without templates
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadRecentTemplates()
})
</script>

