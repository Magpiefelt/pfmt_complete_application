<template>
  <div class="space-y-6">
    <!-- Step Header -->
    <div class="text-center">
      <AlbertaText tag="h3" variant="heading-m" color="primary" class="mb-2">
        Team Assignment
      </AlbertaText>
      <AlbertaText variant="body-m" color="secondary" class="max-w-2xl mx-auto">
        Assign team members to your project. You can add more team members later,
        but a Project Manager is required to proceed.
      </AlbertaText>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <LoadingSpinner class="mx-auto mb-4" />
      <AlbertaText variant="body-m" color="secondary">
        Loading available team members...
      </AlbertaText>
    </div>

    <!-- Form -->
    <div v-else class="max-w-2xl mx-auto space-y-6">
      <!-- Project Manager (Required) -->
      <div>
        <Label for="projectManager" class="text-sm font-medium text-gray-700 mb-2 block">
          Project Manager *
        </Label>
        <select
          id="projectManager"
          v-model="formData.projectManager"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': errors.projectManager }"
          @change="validateField('projectManager')"
        >
          <option value="">Select a Project Manager</option>
          <option
            v-for="member in projectManagers"
            :key="member.id"
            :value="member.id"
          >
            {{ member.name }} - {{ member.department }}{{ member.isCurrentUser ? ' (You)' : '' }}
          </option>
        </select>
        <p v-if="errors.projectManager" class="mt-1 text-sm text-red-600">
          {{ errors.projectManager }}
        </p>
        
        <!-- Info message when current user is auto-added -->
        <div v-if="showCurrentUserMessage" class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div class="flex items-start">
            <div class="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div>
              <AlbertaText variant="body-s" color="primary" class="font-medium mb-1">
                No other Project Managers available
              </AlbertaText>
              <AlbertaText variant="body-xs" color="secondary">
                You have been added as an option and will be assigned as the Project Manager by default.
              </AlbertaText>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Project Manager Info -->
      <div v-if="selectedProjectManager" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <User class="w-5 h-5 text-blue-600" />
          </div>
          <div class="flex-1">
            <AlbertaText tag="h5" variant="heading-xs" color="primary" class="mb-1">
              {{ selectedProjectManager.name }}{{ selectedProjectManager.isCurrentUser ? ' (You)' : '' }}
            </AlbertaText>
            <AlbertaText variant="body-s" color="secondary" class="mb-2">
              {{ selectedProjectManager.role }} • {{ selectedProjectManager.department }}
            </AlbertaText>
            <div v-if="selectedProjectManager.expertise_areas" class="flex flex-wrap gap-1">
              <span
                v-for="area in selectedProjectManager.expertise_areas"
                :key="area"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {{ area }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Team Members -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <Label class="text-sm font-medium text-gray-700">
            Additional Team Members
          </Label>
          <Button
            variant="outline"
            size="sm"
            @click="showAddMemberModal = true"
            :disabled="availableMembers.length === 0"
          >
            <Plus class="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        <!-- Team Members List -->
        <div v-if="formData.teamMembers.length > 0" class="space-y-3">
          <div
            v-for="(assignment, index) in formData.teamMembers"
            :key="index"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center">
              <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <User class="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <AlbertaText variant="body-s" color="primary" class="font-medium">
                  {{ getMemberName(assignment.userId) }}
                </AlbertaText>
                <AlbertaText variant="body-xs" color="secondary">
                  {{ assignment.role }}
                </AlbertaText>
              </div>
            </div>
            <button
              @click="removeTeamMember(index)"
              class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-else class="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
          <Users class="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <AlbertaText variant="body-s" color="secondary">
            No additional team members assigned yet
          </AlbertaText>
          <AlbertaText variant="body-xs" color="secondary">
            Click "Add Member" to assign team members to this project
          </AlbertaText>
        </div>
      </div>

      <!-- Required Roles (from template) -->
      <div v-if="templateRequiredRoles.length > 0">
        <Label class="text-sm font-medium text-gray-700 mb-3 block">
          Required Roles (from template)
        </Label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="role in templateRequiredRoles"
            :key="role"
            class="flex items-center justify-between p-3 border rounded-lg"
            :class="isRoleAssigned(role) 
              ? 'border-green-200 bg-green-50' 
              : 'border-orange-200 bg-orange-50'"
          >
            <div class="flex items-center">
              <div 
                class="w-2 h-2 rounded-full mr-3"
                :class="isRoleAssigned(role) ? 'bg-green-500' : 'bg-orange-500'"
              ></div>
              <AlbertaText variant="body-s" color="primary">
                {{ role }}
              </AlbertaText>
            </div>
            <div v-if="isRoleAssigned(role)">
              <CheckCircle class="w-4 h-4 text-green-500" />
            </div>
          </div>
        </div>
        <p class="mt-2 text-sm text-gray-600">
          <span class="text-green-600">{{ assignedRolesCount }}</span> of {{ templateRequiredRoles.length }} required roles assigned
        </p>
      </div>

      <!-- Team Summary -->
      <div v-if="formData.projectManager || formData.teamMembers.length > 0" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <AlbertaText tag="h5" variant="heading-xs" color="primary" class="mb-3">
          Team Summary
        </AlbertaText>
        
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Project Manager:</span>
            <span class="text-sm font-medium">
              {{ selectedProjectManager ? selectedProjectManager.name : 'Not assigned' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Team Members:</span>
            <span class="text-sm font-medium">{{ formData.teamMembers.length }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Total Team Size:</span>
            <span class="text-sm font-medium">{{ totalTeamSize }}</span>
          </div>
        </div>
      </div>

      <!-- Validation Summary -->
      <div v-if="Object.keys(errors).length > 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start">
          <div class="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <AlbertaText tag="h5" variant="heading-xs" color="primary" class="mb-1">
              Please fix the following errors:
            </AlbertaText>
            <ul class="text-sm text-red-600 space-y-1">
              <li v-for="(error, field) in errors" :key="field">
                • {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Member Modal -->
    <div v-if="showAddMemberModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <AlbertaText tag="h3" variant="heading-s" color="primary">
              Add Team Member
            </AlbertaText>
            <button
              @click="showAddMemberModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div class="px-6 py-4 space-y-4">
          <div>
            <Label for="memberSelect" class="text-sm font-medium text-gray-700 mb-2 block">
              Select Team Member
            </Label>
            <select
              id="memberSelect"
              v-model="newMember.userId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a team member</option>
              <option
                v-for="member in availableMembers"
                :key="member.id"
                :value="member.id"
              >
                {{ member.name }} - {{ member.role }}
              </option>
            </select>
          </div>

          <div>
            <Label for="roleSelect" class="text-sm font-medium text-gray-700 mb-2 block">
              Role in Project
            </Label>
            <select
              id="roleSelect"
              v-model="newMember.role"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select role</option>
              <option value="Team Lead">Team Lead</option>
              <option value="Senior Specialist">Senior Specialist</option>
              <option value="Specialist">Specialist</option>
              <option value="Analyst">Analyst</option>
              <option value="Coordinator">Coordinator</option>
              <option value="Consultant">Consultant</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="outline"
            @click="showAddMemberModal = false"
          >
            Cancel
          </Button>
          <Button
            @click="addTeamMember"
            :disabled="!newMember.userId || !newMember.role"
          >
            Add Member
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { User, Users, Plus, X, CheckCircle } from 'lucide-vue-next'
import { AlbertaText, Label, Button } from '@/components/ui'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import { useProjectWizard } from '@/composables/useProjectWizard'

// Props
const props = defineProps<{
  data: any
}>()

// Emits
const emit = defineEmits<{
  dataUpdated: [data: any]
  stepCompleted: [data: any]
}>()

// Composable
const { getAvailableTeamMembers } = useProjectWizard()

// State
const loading = ref(false)
const availableTeamMembers = ref([])
const showAddMemberModal = ref(false)
const showCurrentUserMessage = ref(false)

// Form data
const formData = reactive({
  projectManager: null,
  teamMembers: [],
  requiredRoles: [],
  ...props.data
})

// New member form
const newMember = reactive({
  userId: '',
  role: ''
})

// Validation errors
const errors = reactive({})

// Helper function to get current user info
const getCurrentUser = () => {
  try {
    // Try to get from localStorage/sessionStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch (e) {
          console.warn('Failed to parse stored user data')
        }
      }
    }
    
    // Return default user context for development
    return {
      id: 1,
      name: "Sarah Johnson",
      role: "Project Manager",
      department: "Infrastructure"
    }
  } catch (error) {
    console.warn('Could not get current user, using default:', error)
    return {
      id: 1,
      name: "Sarah Johnson", 
      role: "Project Manager",
      department: "Infrastructure"
    }
  }
}

// Computed properties
const projectManagers = computed(() => {
  const managers = availableTeamMembers.value.filter(member => 
    member.role === 'Project Manager' || member.role === 'Senior Project Manager'
  )
  
  // If no project managers found, add current user as an option
  if (managers.length === 0) {
    const currentUser = getCurrentUser()
    const currentUserAsManager = {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      department: currentUser.department || 'Infrastructure',
      expertise_areas: ['Project Management'],
      isCurrentUser: true
    }
    
    managers.push(currentUserAsManager)
    showCurrentUserMessage.value = true
    
    // Auto-select the current user if they're the only option
    if (!formData.projectManager) {
      formData.projectManager = currentUser.id
    }
  } else {
    showCurrentUserMessage.value = false
  }
  
  return managers
})

const availableMembers = computed(() => {
  const assignedIds = [
    formData.projectManager,
    ...formData.teamMembers.map(tm => tm.userId)
  ].filter(Boolean)
  
  return availableTeamMembers.value.filter(member => 
    !assignedIds.includes(member.id)
  )
})

const selectedProjectManager = computed(() => {
  if (!formData.projectManager) return null
  return availableTeamMembers.value.find(member => member.id === formData.projectManager)
})

const templateRequiredRoles = computed(() => {
  // This would come from the template in a real implementation
  return formData.requiredRoles || []
})

const totalTeamSize = computed(() => {
  return (formData.projectManager ? 1 : 0) + formData.teamMembers.length
})

const assignedRolesCount = computed(() => {
  const assignedRoles = []
  
  if (selectedProjectManager.value) {
    assignedRoles.push(selectedProjectManager.value.role)
  }
  
  formData.teamMembers.forEach(member => {
    assignedRoles.push(member.role)
  })
  
  return templateRequiredRoles.value.filter(role => 
    assignedRoles.some(assigned => assigned.includes(role) || role.includes(assigned))
  ).length
})

const isValid = computed(() => {
  return Object.keys(errors).length === 0 && formData.projectManager
})

// Methods
const loadTeamMembers = async () => {
  try {
    loading.value = true
    availableTeamMembers.value = await getAvailableTeamMembers()
  } catch (error) {
    console.error('Error loading team members:', error)
    // Provide fallback data if API fails
    availableTeamMembers.value = []
  } finally {
    loading.value = false
  }
}

const validateField = (fieldName: string) => {
  delete errors[fieldName]

  switch (fieldName) {
    case 'projectManager':
      if (!formData.projectManager) {
        errors[fieldName] = 'Project Manager is required'
      }
      break
  }
}

const getMemberName = (userId: string) => {
  const member = availableTeamMembers.value.find(m => m.id === userId)
  return member ? member.name : 'Unknown'
}

const isRoleAssigned = (role: string) => {
  const assignedRoles = []
  
  if (selectedProjectManager.value) {
    assignedRoles.push(selectedProjectManager.value.role)
  }
  
  formData.teamMembers.forEach(member => {
    assignedRoles.push(member.role)
  })
  
  return assignedRoles.some(assigned => 
    assigned.includes(role) || role.includes(assigned)
  )
}

const addTeamMember = () => {
  if (newMember.userId && newMember.role) {
    formData.teamMembers.push({
      userId: newMember.userId,
      role: newMember.role
    })
    
    // Reset form
    newMember.userId = ''
    newMember.role = ''
    showAddMemberModal.value = false
  }
}

const removeTeamMember = (index: number) => {
  formData.teamMembers.splice(index, 1)
}

// Watch for changes and emit updates
watch(formData, (newData) => {
  emit('dataUpdated', { ...newData })
  
  if (isValid.value) {
    emit('stepCompleted', { ...newData })
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadTeamMembers()
})
</script>

<style scoped>
/* Modal backdrop */
.modal-backdrop {
  backdrop-filter: blur(4px);
}

/* Team member cards */
.team-member-card {
  transition: all 0.2s ease-in-out;
}

.team-member-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>

