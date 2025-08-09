<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <Button variant="outline" size="sm" @click="$router.back()">
        <ArrowLeft class="h-4 w-4 mr-2" />
        Back to Projects
      </Button>
      <div>
        <AlbertaText tag="h1" size="heading-xl" mb="xs">{{ normalizedProject.name }}</AlbertaText>
        <AlbertaText color="secondary" mb="xs">{{ contractorPhaseDisplay }}</AlbertaText>
        
        <!-- Version Status Indicator -->
        <div class="flex items-center space-x-2 mt-1">
          <AlbertaText size="body-s" color="secondary">Version:</AlbertaText>
          <AlbertaText size="body-s">{{ currentVersion }}</AlbertaText>
          <span 
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            :class="versionStatusClass"
          >
            {{ versionStatusText }}
          </span>
          
          <!-- Draft/Approved View Toggle -->
          <div v-if="hasDraftVersion && canViewDraft" class="flex items-center space-x-2 ml-4">
            <span class="text-xs text-gray-500">View:</span>
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button
                @click="setViewMode('approved')"
                :class="viewMode === 'approved' ? 'bg-white shadow-sm' : 'text-gray-600'"
                class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
              >
                Approved
              </button>
              <button
                @click="setViewMode('draft')"
                :class="viewMode === 'draft' ? 'bg-white shadow-sm' : 'text-gray-600'"
                class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
              >
                Draft
                <span v-if="hasPendingChanges" class="ml-1 w-2 h-2 bg-orange-400 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center space-x-2">
      <!-- Draft Actions -->
      <div v-if="canEdit" class="flex items-center space-x-2">
        <Button 
          v-if="!hasDraftVersion && canCreateDraft" 
          variant="outline" 
          size="sm"
          @click="$emit('create-draft')"
        >
          <Edit class="h-4 w-4 mr-2" />
          Create Draft
        </Button>
        
        <Button 
          v-if="hasDraftVersion && canSubmitForApproval" 
          variant="default" 
          size="sm"
          @click="$emit('submit-for-approval')"
        >
          <Send class="h-4 w-4 mr-2" />
          Submit for Approval
        </Button>
      </div>

      <!-- Director Actions -->
      <div v-if="canApprove && hasSubmittedVersion" class="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          @click="$emit('reject-version')"
        >
          <XCircle class="h-4 w-4 mr-2" />
          Reject
        </Button>
        
        <Button 
          variant="default" 
          size="sm"
          @click="$emit('approve-version')"
        >
          <CheckCircle class="h-4 w-4 mr-2" />
          Approve
        </Button>
      </div>

      <!-- More Actions Menu -->
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="$emit('export-project')">
            <Download class="h-4 w-4 mr-2" />
            Export Project
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('print-project')">
            <Printer class="h-4 w-4 mr-2" />
            Print Project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="$emit('view-history')">
            <History class="h-4 w-4 mr-2" />
            View History
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('duplicate-project')">
            <Copy class="h-4 w-4 mr-2" />
            Duplicate Project
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="canDelete" />
          <DropdownMenuItem 
            v-if="canDelete" 
            @click="$emit('delete-project')"
            class="text-red-600"
          >
            <Trash2 class="h-4 w-4 mr-2" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  Edit, 
  Send, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Download,
  Printer,
  History,
  Copy,
  Trash2
} from 'lucide-vue-next'
import { AlbertaText } from '@/components/ui'
import { Button } from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui"
import { useStatusBadge } from '@/composables/useStatusBadge'
import { normalizeProject } from '@/utils/fieldNormalization'

interface Project {
  id: string
  name: string
  contractor?: string
  phase?: string
  status: string
  [key: string]: any
}

interface Props {
  project: Project
  viewMode: 'draft' | 'approved'
  currentVersion: string
  versionStatus: string
  hasDraftVersion: boolean
  hasSubmittedVersion: boolean
  hasPendingChanges: boolean
  canEdit: boolean
  canViewDraft: boolean
  canCreateDraft: boolean
  canSubmitForApproval: boolean
  canApprove: boolean
  canDelete: boolean
  userRole: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:viewMode': [mode: 'draft' | 'approved']
  'create-draft': []
  'submit-for-approval': []
  'approve-version': []
  'reject-version': []
  'export-project': []
  'print-project': []
  'view-history': []
  'duplicate-project': []
  'delete-project': []
}>()

const router = useRouter()
const { getVersionStatusClass } = useStatusBadge()

// Normalize project data for consistent field access
const normalizedProject = computed(() => normalizeProject(props.project))

// Computed property for contractor and phase display with conditional separator
const contractorPhaseDisplay = computed(() => {
  const contractorValue = normalizedProject.value.contractor
  const phaseValue = normalizedProject.value.phase
  
  if (contractorValue && phaseValue) {
    return `${contractorValue} • ${phaseValue}`
  } else if (contractorValue) {
    return contractorValue
  } else if (phaseValue) {
    return phaseValue
  } else {
    return ''
  }
})

const setViewMode = (mode: 'draft' | 'approved') => {
  emit('update:viewMode', mode)
}

const versionStatusClass = computed(() => {
  return getVersionStatusClass(props.versionStatus)
})

const versionStatusText = computed(() => {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'submitted': 'Pending Approval',
    'approved': 'Current',
    'rejected': 'Rejected'
  }
  return statusMap[props.versionStatus] || 'Current'
})
</script>

