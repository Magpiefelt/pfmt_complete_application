<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <button 
              @click="$router.go(-1)"
              class="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft class="h-5 w-5" />
            </button>
            <AlbertaText tag="h1" variant="heading-l" color="primary">
              Create New Project
            </AlbertaText>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Project Creation Options -->
      <div v-if="!showWizard" class="space-y-8">
        <!-- Welcome Section -->
        <div class="text-center">
          <AlbertaText tag="h2" variant="heading-m" color="primary" class="mb-4">
            How would you like to create your project?
          </AlbertaText>
          <AlbertaText variant="body-m" color="secondary" class="max-w-2xl mx-auto">
            Choose the method that best suits your needs. The guided wizard will walk you through each step,
            while the quick form allows experienced users to create projects faster.
          </AlbertaText>
        </div>

        <!-- Creation Options -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Guided Wizard Option -->
          <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="startWizard">
            <CardContent class="p-8 text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <AlbertaText tag="h3" variant="heading-s" color="primary" class="mb-3">
                Guided Wizard
              </AlbertaText>
              <AlbertaText variant="body-s" color="secondary" class="mb-6">
                Step-by-step guidance through project creation with templates, validation, and helpful tips.
                Perfect for new users or complex projects.
              </AlbertaText>
              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Project templates
                </div>
                <div class="flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Team assignment
                </div>
                <div class="flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Budget planning
                </div>
              </div>
              <Button class="mt-6 w-full">
                Start Guided Wizard
              </Button>
            </CardContent>
          </Card>

          <!-- Quick Form Option -->
          <Card class="hover:shadow-lg transition-shadow cursor-pointer opacity-75" @click="showQuickFormNotice">
            <CardContent class="p-8 text-center">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <AlbertaText tag="h3" variant="heading-s" color="primary" class="mb-3">
                Quick Form
              </AlbertaText>
              <AlbertaText variant="body-s" color="secondary" class="mb-6">
                Fast project creation for experienced users. All essential fields in a single form.
                Coming soon in a future update.
              </AlbertaText>
              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                  </svg>
                  Single page form
                </div>
                <div class="flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                  </svg>
                  Faster creation
                </div>
                <div class="flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                  </svg>
                  Advanced users
                </div>
              </div>
              <Button variant="outline" class="mt-6 w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <!-- Recent Templates -->
        <div v-if="recentTemplates.length > 0" class="max-w-4xl mx-auto">
          <AlbertaText tag="h3" variant="heading-s" color="primary" class="mb-4">
            Recently Used Templates
          </AlbertaText>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              v-for="template in recentTemplates" 
              :key="template.id"
              class="hover:shadow-md transition-shadow cursor-pointer"
              @click="startWizardWithTemplate(template)"
            >
              <CardContent class="p-4">
                <AlbertaText tag="h4" variant="heading-xs" color="primary" class="mb-2">
                  {{ template.name }}
                </AlbertaText>
                <AlbertaText variant="body-xs" color="secondary" class="mb-3">
                  {{ template.description }}
                </AlbertaText>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>{{ template.category }}</span>
                  <span>${{ formatCurrency(template.default_budget) }}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <!-- Project Wizard -->
      <div v-if="showWizard">
        <ProjectWizard 
          :selected-template="selectedTemplate"
          @wizard-completed="handleWizardCompleted"
          @wizard-cancelled="handleWizardCancelled"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { Button, AlbertaText } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'
import ProjectWizard from '@/components/project-wizard/ProjectWizard.vue'
import { formatCurrency } from '@/utils'
import axios from 'axios'

const router = useRouter()

// Reactive state
const showWizard = ref(false)
const selectedTemplate = ref(null)
const recentTemplates = ref([])
const loading = ref(false)

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

// Handle wizard completion
const handleWizardCompleted = (project: any) => {
  // Navigate to the newly created project
  router.push(`/projects/${project.id}`)
}

// Handle wizard cancellation
const handleWizardCancelled = () => {
  showWizard.value = false
  selectedTemplate.value = null
}

// Show quick form notice
const showQuickFormNotice = () => {
  alert('Quick form creation is coming in a future update. Please use the guided wizard for now.')
}

// Load recent templates
const loadRecentTemplates = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/project-wizard/templates', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.data.success) {
      // Show first 3 templates as "recent"
      recentTemplates.value = response.data.templates.slice(0, 3)
    }
  } catch (error) {
    console.error('Error loading templates:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadRecentTemplates()
})
</script>

<style scoped>
/* Additional styling for the new project page */
.card-hover {
  transition: all 0.2s ease-in-out;
}

.card-hover:hover {
  transform: translateY(-2px);
}
</style>

