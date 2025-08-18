import { computed } from 'vue'
import type { Ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/constants/roles'
import type { Role } from '@/constants/roles'

export interface ProjectPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canInitiate: boolean
  canAssignTeam: boolean
  canFinalize: boolean
  canApprove: boolean
  canViewDraft: boolean
  canCreateDraft: boolean
  canSubmitForApproval: boolean
  canViewBudget: boolean
  canEditBudget: boolean
  canViewReports: boolean
  canManageVendors: boolean
  canViewWorkflow: boolean
  canEditWorkflow: boolean
}

export function useProjectPermissions(project?: Ref<any>) {
  const authStore = useAuthStore()

  const permissions = computed((): ProjectPermissions => {
    const user = authStore.currentUser
    if (!user) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canInitiate: false,
        canAssignTeam: false,
        canFinalize: false,
        canApprove: false,
        canViewDraft: false,
        canCreateDraft: false,
        canSubmitForApproval: false,
        canViewBudget: false,
        canEditBudget: false,
        canViewReports: false,
        canManageVendors: false,
        canViewWorkflow: false,
        canEditWorkflow: false
      }
    }

    const userRole = user.role as Role
    const projectData = project?.value

    // Base permissions by role
    const isAdmin = userRole === ROLES.ADMIN
    const isDirector = userRole === ROLES.DIRECTOR
    const isPMI = userRole === ROLES.PMI
    const isPM = userRole === ROLES.PM
    const isSPM = userRole === ROLES.SPM
    const isAnalyst = userRole === ROLES.ANALYST
    const isExecutive = userRole === ROLES.EXECUTIVE
    const isVendor = userRole === ROLES.VENDOR

    // Project-specific checks
    const isAssignedPM = projectData?.assigned_pm === user.id
    const isAssignedSPM = projectData?.assigned_spm === user.id
    const isAssignedTeamMember = isAssignedPM || isAssignedSPM

    // Workflow status checks
    const workflowStatus = projectData?.workflow_status
    const isInitiated = workflowStatus === 'initiated'
    const isAssigned = workflowStatus === 'assigned'
    const isFinalized = workflowStatus === 'finalized'

    return {
      // View permissions
      canView: !isVendor || (isVendor && projectData?.vendor_access === true),
      
      // Edit permissions based on workflow status
      canEdit: (() => {
        if (isAdmin) return true
        
        switch (workflowStatus) {
          case 'initiated':
            return isPMI || isDirector
          case 'assigned':
            return isPM || isSPM || isDirector || isAssignedTeamMember
          case 'finalized':
            return isAssignedTeamMember || isDirector
          default:
            return isPM || isSPM || isDirector
        }
      })(),
      
      // Delete permissions
      canDelete: isAdmin || (isDirector && !isFinalized),
      
      // Workflow permissions
      canInitiate: isPMI || isAdmin,
      canAssignTeam: isDirector || isAdmin,
      canFinalize: (isPM || isSPM || isAssignedTeamMember) && isAssigned,
      canApprove: isDirector || isAdmin,
      
      // Version permissions
      canViewDraft: isPM || isSPM || isDirector || isAdmin || isAssignedTeamMember,
      canCreateDraft: isPM || isSPM || isDirector || isAdmin || isAssignedTeamMember,
      canSubmitForApproval: isPM || isSPM || isAssignedTeamMember,
      
      // Budget permissions
      canViewBudget: !isVendor,
      canEditBudget: (isPM || isSPM || isDirector || isAdmin || isAssignedTeamMember) && 
                     (isAssigned || isFinalized),
      
      // Reports permissions
      canViewReports: isAnalyst || isExecutive || isDirector || isAdmin || 
                      isPM || isSPM || isAssignedTeamMember,
      
      // Vendor permissions
      canManageVendors: isPM || isSPM || isDirector || isAdmin || isAssignedTeamMember,
      
      // Workflow permissions
      canViewWorkflow: !isVendor,
      canEditWorkflow: isPMI || isPM || isSPM || isDirector || isAdmin || isAssignedTeamMember
    }
  })

  // Individual permission getters for convenience
  const canView = computed(() => permissions.value.canView)
  const canEdit = computed(() => permissions.value.canEdit)
  const canDelete = computed(() => permissions.value.canDelete)
  const canInitiate = computed(() => permissions.value.canInitiate)
  const canAssignTeam = computed(() => permissions.value.canAssignTeam)
  const canFinalize = computed(() => permissions.value.canFinalize)
  const canApprove = computed(() => permissions.value.canApprove)
  const canViewDraft = computed(() => permissions.value.canViewDraft)
  const canCreateDraft = computed(() => permissions.value.canCreateDraft)
  const canSubmitForApproval = computed(() => permissions.value.canSubmitForApproval)
  const canViewBudget = computed(() => permissions.value.canViewBudget)
  const canEditBudget = computed(() => permissions.value.canEditBudget)
  const canViewReports = computed(() => permissions.value.canViewReports)
  const canManageVendors = computed(() => permissions.value.canManageVendors)
  const canViewWorkflow = computed(() => permissions.value.canViewWorkflow)
  const canEditWorkflow = computed(() => permissions.value.canEditWorkflow)

  // Helper methods
  const checkPermission = (permission: keyof ProjectPermissions): boolean => {
    return permissions.value[permission]
  }

  const getRestrictedMessage = (permission: keyof ProjectPermissions): string => {
    const user = authStore.currentUser
    const userRole = user?.role || 'Unknown'
    
    const messages: Record<keyof ProjectPermissions, string> = {
      canView: 'You do not have permission to view this project.',
      canEdit: 'You do not have permission to edit this project.',
      canDelete: 'You do not have permission to delete this project.',
      canInitiate: 'Only PM&I users can initiate new projects.',
      canAssignTeam: 'Only Directors can assign teams to projects.',
      canFinalize: 'Only assigned team members can finalize projects.',
      canApprove: 'Only Directors and Admins can approve projects.',
      canViewDraft: 'You do not have permission to view draft versions.',
      canCreateDraft: 'You do not have permission to create draft versions.',
      canSubmitForApproval: 'You do not have permission to submit for approval.',
      canViewBudget: 'You do not have permission to view budget information.',
      canEditBudget: 'You do not have permission to edit budget information.',
      canViewReports: 'You do not have permission to view reports.',
      canManageVendors: 'You do not have permission to manage vendors.',
      canViewWorkflow: 'You do not have permission to view workflow information.',
      canEditWorkflow: 'You do not have permission to edit workflow information.'
    }
    
    return messages[permission] || `You do not have permission to perform this action. Current role: ${userRole}`
  }

  return {
    permissions,
    canView,
    canEdit,
    canDelete,
    canInitiate,
    canAssignTeam,
    canFinalize,
    canApprove,
    canViewDraft,
    canCreateDraft,
    canSubmitForApproval,
    canViewBudget,
    canEditBudget,
    canViewReports,
    canManageVendors,
    canViewWorkflow,
    canEditWorkflow,
    checkPermission,
    getRestrictedMessage
  }
}

