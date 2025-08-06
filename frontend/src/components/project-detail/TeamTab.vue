<template>
  <div class="space-y-6">
    <!-- Current Team -->
    <Card>
      <CardHeader>
        <CardTitle>Project Team</CardTitle>
        <CardDescription v-if="!canEdit">
          View current project team assignments and roles.
        </CardDescription>
        <CardDescription v-else>
          Manage project team assignments. Changes will be saved to {{ viewMode === 'draft' ? 'draft version' : 'current version' }}.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Core Team Roles -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Executive Director -->
          <div>
            <Label for="executive-director">Executive Director</Label>
            <UserSelect
              id="executive-director"
              v-model="formData.executive_director_id"
              :disabled="!canEdit"
              placeholder="Select Executive Director"
              :current-user="getTeamMember('executive_director')"
              class="mt-1"
            />
          </div>

          <!-- Director -->
          <div>
            <Label for="director">Director</Label>
            <UserSelect
              id="director"
              v-model="formData.director_id"
              :disabled="!canEdit"
              placeholder="Select Director"
              :current-user="getTeamMember('director')"
              class="mt-1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Senior Project Manager -->
          <div>
            <Label for="sr-project-manager">Senior Project Manager</Label>
            <UserSelect
              id="sr-project-manager"
              v-model="formData.sr_project_manager_id"
              :disabled="!canEdit"
              placeholder="Select Senior Project Manager"
              :current-user="getTeamMember('sr_project_manager')"
              class="mt-1"
            />
          </div>

          <!-- Project Manager -->
          <div>
            <Label for="project-manager">Project Manager</Label>
            <UserSelect
              id="project-manager"
              v-model="formData.project_manager_id"
              :disabled="!canEdit"
              placeholder="Select Project Manager"
              :current-user="getTeamMember('project_manager')"
              class="mt-1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Project Coordinator -->
          <div>
            <Label for="project-coordinator">Project Coordinator</Label>
            <UserSelect
              id="project-coordinator"
              v-model="formData.project_coordinator_id"
              :disabled="!canEdit"
              placeholder="Select Project Coordinator"
              :current-user="getTeamMember('project_coordinator')"
              class="mt-1"
            />
          </div>

          <!-- Contract Services Analyst -->
          <div>
            <Label for="contract-services-analyst">Contract Services Analyst</Label>
            <UserSelect
              id="contract-services-analyst"
              v-model="formData.contract_services_analyst_id"
              :disabled="!canEdit"
              placeholder="Select Contract Services Analyst"
              :current-user="getTeamMember('contract_services_analyst')"
              class="mt-1"
            />
          </div>
        </div>

        <div>
          <!-- Program Integration Analyst -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label for="program-integration-analyst">Program Integration Analyst</Label>
              <UserSelect
                id="program-integration-analyst"
                v-model="formData.program_integration_analyst_id"
                :disabled="!canEdit"
                placeholder="Select Program Integration Analyst"
                :current-user="getTeamMember('program_integration_analyst')"
                class="mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Additional Team Members -->
    <Card>
      <CardHeader>
        <CardTitle>Additional Team Members</CardTitle>
        <CardDescription>
          Add other team members who contribute to this project.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Current Additional Members -->
        <div v-if="additionalMembers.length > 0" class="space-y-3">
          <Label>Current Additional Members</Label>
          <div class="space-y-2">
            <div 
              v-for="(member, index) in additionalMembers" 
              :key="index"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <Avatar class="h-8 w-8">
                  <AvatarImage :src="member.avatar" />
                  <AvatarFallback>{{ getInitials(member.name) }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="text-sm font-medium">{{ member.name }}</p>
                  <p class="text-xs text-gray-500">{{ member.role || 'Team Member' }}</p>
                </div>
              </div>
              <Button
                v-if="canEdit"
                variant="ghost"
                size="sm"
                @click="removeAdditionalMember(index)"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Add Additional Member -->
        <div v-if="canEdit" class="space-y-4">
          <div class="flex items-center space-x-2">
            <Button
              variant="outline"
              @click="showAddMemberDialog = true"
              :disabled="!canEdit"
            >
              <Plus class="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Historical Team Members -->
    <Card v-if="historicalMembers.length > 0">
      <CardHeader>
        <CardTitle>Past Team Members</CardTitle>
        <CardDescription>
          Team members who previously worked on this project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div 
            v-for="(member, index) in historicalMembers" 
            :key="index"
            class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <Avatar class="h-8 w-8">
              <AvatarImage :src="member.avatar" />
              <AvatarFallback>{{ getInitials(member.name) }}</AvatarFallback>
            </Avatar>
            <div>
              <p class="text-sm font-medium">{{ member.name }}</p>
              <p class="text-xs text-gray-500">
                {{ member.role || 'Team Member' }} 
                <span v-if="member.period">({{ member.period }})</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Add Member Dialog -->
    <Dialog v-model:open="showAddMemberDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Search and select a user to add to the project team.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label for="member-search">Search Users</Label>
            <UserSelect
              id="member-search"
              v-model="newMember.user_id"
              placeholder="Search for a user..."
              class="mt-1"
            />
          </div>
          <div>
            <Label for="member-role">Role (Optional)</Label>
            <Input
              id="member-role"
              v-model="newMember.role"
              placeholder="e.g., Technical Advisor, Consultant"
              class="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="cancelAddMember">
            Cancel
          </Button>
          <Button @click="addAdditionalMember" :disabled="!newMember.user_id">
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
import { Save, Plus, X } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import UserSelect from '@/components/ui/UserSelect.vue'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
}

interface TeamMember {
  user_id: string
  name: string
  email: string
  avatar?: string
  role?: string
  period?: string
}

interface ProjectTeam {
  id?: string
  project_id?: string
  executive_director_id?: string
  director_id?: string
  sr_project_manager_id?: string
  project_manager_id?: string
  project_coordinator_id?: string
  contract_services_analyst_id?: string
  program_integration_analyst_id?: string
  additional_members?: TeamMember[]
  historical_members?: TeamMember[]
  
  // User objects for display
  executive_director?: User
  director?: User
  sr_project_manager?: User
  project_manager?: User
  project_coordinator?: User
  contract_services_analyst?: User
  program_integration_analyst?: User
  
  [key: string]: any
}

interface Props {
  team: ProjectTeam
  viewMode: 'draft' | 'approved'
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:team': [team: ProjectTeam]
  'save-changes': [changes: Partial<ProjectTeam>]
}>()

// Form data
const formData = ref<ProjectTeam>({ ...props.team })
const originalData = ref<ProjectTeam>({ ...props.team })
const showAddMemberDialog = ref(false)
const newMember = ref<{ user_id: string; role: string }>({ user_id: '', role: '' })

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

const additionalMembers = computed(() => {
  return formData.value.additional_members || []
})

const historicalMembers = computed(() => {
  return formData.value.historical_members || []
})

// Methods
const resetForm = () => {
  formData.value = { ...originalData.value }
}

const saveChanges = () => {
  const changes: Partial<ProjectTeam> = {}
  
  // Only include changed fields
  Object.keys(formData.value).forEach(key => {
    if (formData.value[key] !== originalData.value[key]) {
      changes[key] = formData.value[key]
    }
  })

  emit('save-changes', changes)
  originalData.value = { ...formData.value }
}

const getTeamMember = (role: string) => {
  const roleMap: { [key: string]: string } = {
    'executive_director': 'executive_director',
    'director': 'director',
    'sr_project_manager': 'sr_project_manager',
    'project_manager': 'project_manager',
    'project_coordinator': 'project_coordinator',
    'contract_services_analyst': 'contract_services_analyst',
    'program_integration_analyst': 'program_integration_analyst'
  }
  
  return formData.value[roleMap[role]]
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const addAdditionalMember = async () => {
  if (!newMember.value.user_id) return
  
  try {
    // In a real implementation, you would fetch user details here
    const userDetails = await fetchUserDetails(newMember.value.user_id)
    
    const member: TeamMember = {
      user_id: newMember.value.user_id,
      name: userDetails.name,
      email: userDetails.email,
      avatar: userDetails.avatar,
      role: newMember.value.role || 'Team Member'
    }
    
    if (!formData.value.additional_members) {
      formData.value.additional_members = []
    }
    
    formData.value.additional_members.push(member)
    cancelAddMember()
  } catch (error) {
    console.error('Error adding team member:', error)
  }
}

const removeAdditionalMember = (index: number) => {
  if (formData.value.additional_members) {
    formData.value.additional_members.splice(index, 1)
  }
}

const cancelAddMember = () => {
  showAddMemberDialog.value = false
  newMember.value = { user_id: '', role: '' }
}

// Mock function - replace with actual API call
const fetchUserDetails = async (userId: string): Promise<User> => {
  // This would be replaced with actual API call
  return {
    id: userId,
    name: 'User Name',
    email: 'user@example.com',
    avatar: ''
  }
}

// Watch for external team changes
watch(() => props.team, (newTeam) => {
  formData.value = { ...newTeam }
  originalData.value = { ...newTeam }
}, { deep: true })

// Watch for form changes and emit updates
watch(formData, (newData) => {
  emit('update:team', { ...newData })
}, { deep: true })

onMounted(() => {
  formData.value = { ...props.team }
  originalData.value = { ...props.team }
})
</script>

