<template>
  <div class="space-y-6">
    <!-- Step Header -->
    <div class="text-center">
      <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
        Choose a Project Template
      </AlbertaText>
      <AlbertaText variant="body-m" color="secondary" class="max-w-2xl mx-auto">
        Select a template that best matches your project type. Templates provide pre-configured settings,
        budget estimates, and required team roles to help you get started quickly.
      </AlbertaText>
    </div>

    <!-- Template Categories -->
    <div class="flex flex-wrap gap-2 justify-center">
      <button
        v-for="category in categories"
        :key="category"
        @click="selectedCategory = category"
        class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
        :class="selectedCategory === category 
          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'"
      >
        {{ category }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <LoadingSpinner class="mx-auto mb-4" />
      <AlbertaText variant="body-m" color="secondary">
        Loading project templates...
      </AlbertaText>
    </div>

    <!-- Templates Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card
        v-for="template in filteredTemplates"
        :key="template.id"
        class="cursor-pointer transition-all hover:shadow-lg"
        :class="selectedTemplate?.id === template.id 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'hover:shadow-md'"
        @click="selectTemplate(template)"
      >
        <CardContent class="p-6">
          <!-- Template Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <AlbertaText tag="h4" variant="heading-s" color="primary" class="mb-2">
                {{ template.name }}
              </AlbertaText>
              <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {{ template.category }}
              </div>
            </div>
            <div v-if="selectedTemplate?.id === template.id" class="ml-3">
              <CheckCircle class="w-6 h-6 text-blue-500" />
            </div>
          </div>

          <!-- Template Description -->
          <AlbertaText variant="body-s" color="secondary" class="mb-4 line-clamp-3">
            {{ template.description }}
          </AlbertaText>

          <!-- Template Details -->
          <div class="space-y-3">
            <!-- Budget -->
            <div class="flex items-center justify-between">
              <div class="flex items-center text-sm text-gray-600">
                <DollarSign class="w-4 h-4 mr-1" />
                <span>Default Budget</span>
              </div>
              <AlbertaText variant="body-s" color="primary" class="font-medium">
                ${{ formatCurrency(template.default_budget) }}
              </AlbertaText>
            </div>

            <!-- Duration -->
            <div class="flex items-center justify-between">
              <div class="flex items-center text-sm text-gray-600">
                <Calendar class="w-4 h-4 mr-1" />
                <span>Est. Duration</span>
              </div>
              <AlbertaText variant="body-s" color="primary" class="font-medium">
                {{ template.estimated_duration }} days
              </AlbertaText>
            </div>

            <!-- Required Roles -->
            <div>
              <div class="flex items-center text-sm text-gray-600 mb-2">
                <Users class="w-4 h-4 mr-1" />
                <span>Required Roles</span>
              </div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="role in template.required_roles?.slice(0, 3)"
                  :key="role"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {{ role }}
                </span>
                <span
                  v-if="template.required_roles?.length > 3"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                >
                  +{{ template.required_roles.length - 3 }} more
                </span>
              </div>
            </div>
          </div>

          <!-- Template Features -->
          <div v-if="template.template_data?.phases" class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex items-center text-sm text-gray-600 mb-2">
              <CheckSquare class="w-4 h-4 mr-1" />
              <span>Project Phases</span>
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="phase in getTemplatePhases(template).slice(0, 2)"
                :key="phase"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
              >
                {{ phase }}
              </span>
              <span
                v-if="getTemplatePhases(template).length > 2"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
              >
                +{{ getTemplatePhases(template).length - 2 }} more
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- No Templates Message -->
    <div v-if="!loading && filteredTemplates.length === 0" class="text-center py-8">
      <AlbertaText variant="body-m" color="secondary">
        No templates found for the selected category.
      </AlbertaText>
    </div>

    <!-- Custom Template Option -->
    <div class="mt-8 pt-6 border-t border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- PFMT Upload Option -->
        <Card 
          class="cursor-pointer transition-all hover:shadow-md"
          :class="selectedTemplate?.id === 'pfmt' 
            ? 'ring-2 ring-blue-500 bg-blue-50' 
            : ''"
          @click="selectPFMTTemplate"
        >
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Upload class="w-6 h-6 text-green-600" />
              </div>
              <div class="flex-1">
                <AlbertaText tag="h4" variant="heading-s" color="primary" class="mb-1">
                  Upload PFMT Excel
                </AlbertaText>
                <AlbertaText variant="body-s" color="secondary">
                  Import project data from an existing PFMT Excel file to automatically populate project details.
                </AlbertaText>
              </div>
              <div v-if="selectedTemplate?.id === 'pfmt'" class="ml-3">
                <CheckCircle class="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Custom Template Option -->
        <Card 
          class="cursor-pointer transition-all hover:shadow-md"
          :class="selectedTemplate?.id === 'custom' 
            ? 'ring-2 ring-blue-500 bg-blue-50' 
            : ''"
          @click="selectCustomTemplate"
        >
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                <Plus class="w-6 h-6 text-gray-600" />
              </div>
              <div class="flex-1">
                <AlbertaText tag="h4" variant="heading-s" color="primary" class="mb-1">
                  Start from Scratch
                </AlbertaText>
                <AlbertaText variant="body-s" color="secondary">
                  Create a custom project without using a template. You'll configure all settings manually.
                </AlbertaText>
              </div>
              <div v-if="selectedTemplate?.id === 'custom'" class="ml-3">
                <CheckCircle class="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Selected Template Summary -->
    <div v-if="selectedTemplate && !['custom', 'pfmt'].includes(selectedTemplate.id)" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-start">
        <CheckCircle class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <AlbertaText tag="h5" variant="heading-xs" color="primary" class="mb-1">
            Selected: {{ selectedTemplate.name }}
          </AlbertaText>
          <AlbertaText variant="body-s" color="secondary">
            This template will pre-configure your project with default settings for {{ selectedTemplate.category.toLowerCase() }} projects.
            You can customize all settings in the following steps.
          </AlbertaText>
        </div>
      </div>
    </div>

    <!-- PFMT Template Summary -->
    <div v-if="selectedTemplate?.id === 'pfmt'" class="bg-green-50 border border-green-200 rounded-lg p-4">
      <div class="flex items-start">
        <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <AlbertaText tag="h5" variant="heading-xs" color="primary" class="mb-1">
            Selected: PFMT Excel Import
          </AlbertaText>
          <AlbertaText variant="body-s" color="secondary">
            You'll be able to upload your PFMT Excel file in the next step to automatically populate project details.
            Any missing information can be filled in manually.
          </AlbertaText>
        </div>
      </div>
    </div>

    <!-- Custom Template Summary -->
    <div v-if="selectedTemplate?.id === 'custom'" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div class="flex items-start">
        <CheckCircle class="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <AlbertaText tag="h5" variant="heading-xs" color="primary" class="mb-1">
            Selected: Custom Project
          </AlbertaText>
          <AlbertaText variant="body-s" color="secondary">
            You'll configure all project settings manually in the following steps.
            This gives you complete control over your project setup.
          </AlbertaText>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CheckCircle, DollarSign, Calendar, Users, CheckSquare, Plus, Upload } from 'lucide-vue-next'
import { AlbertaText } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import { formatCurrency } from '@/utils'
import { useProjectWizard } from '@/composables/useProjectWizard'

// Props
const props = defineProps<{
  selectedTemplate?: any
}>()

// Emits
const emit = defineEmits<{
  templateSelected: [template: any]
  stepCompleted: [data: any]
}>()

// Composable
const { getProjectTemplates } = useProjectWizard()

// State
const templates = ref([])
const loading = ref(false)
const selectedTemplate = ref(props.selectedTemplate)
const selectedCategory = ref('All')

// Computed
const categories = computed(() => {
  const cats = ['All']
  templates.value.forEach((template: any) => {
    if (!cats.includes(template.category)) {
      cats.push(template.category)
    }
  })
  return cats
})

const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'All') {
    return templates.value
  }
  return templates.value.filter((template: any) => template.category === selectedCategory.value)
})

// Methods
const loadTemplates = async () => {
  try {
    loading.value = true
    templates.value = await getProjectTemplates()
  } catch (error) {
    console.error('Error loading templates:', error)
  } finally {
    loading.value = false
  }
}

const selectTemplate = (template: any) => {
  selectedTemplate.value = template
  emit('templateSelected', template)
  emit('stepCompleted', { selectedTemplate: template })
}

const selectCustomTemplate = () => {
  const customTemplate = {
    id: 'custom',
    name: 'Custom Project',
    description: 'Start from scratch with no pre-configured settings',
    category: 'Custom',
    default_budget: 0,
    estimated_duration: 365,
    required_roles: [],
    template_data: null
  }
  
  selectedTemplate.value = customTemplate
  emit('templateSelected', customTemplate)
  emit('stepCompleted', { selectedTemplate: customTemplate })
}

const selectPFMTTemplate = () => {
  const pfmtTemplate = {
    id: 'pfmt',
    name: 'PFMT Import',
    description: 'Import project data from PFMT Excel file',
    category: 'Import',
    default_budget: 0,
    estimated_duration: 365,
    required_roles: [],
    template_data: { type: 'pfmt_import' }
  }
  
  selectedTemplate.value = pfmtTemplate
  emit('templateSelected', pfmtTemplate)
  emit('stepCompleted', { selectedTemplate: pfmtTemplate })
}

const getTemplatePhases = (template: any) => {
  if (!template.template_data) return []
  
  const data = typeof template.template_data === 'string' 
    ? JSON.parse(template.template_data) 
    : template.template_data
    
  return data.phases || []
}

// Lifecycle
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

