import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable for vendor management permissions
 */
export function useVendorPermissions() {
  const authStore = useAuthStore()

  // Permission checks based on user role
  const canViewVendors = computed(() => {
    // All authenticated users can view vendors
    return authStore.isAuthenticated
  })

  const canCreateVendors = computed(() => {
    // Only PM, SPM, Director, and Admin can create vendors
    const allowedRoles = ['Project Manager', 'Senior Project Manager', 'Director', 'Admin']
    return authStore.isAuthenticated && allowedRoles.includes(authStore.currentUser.role)
  })

  const canEditVendors = computed(() => {
    // Only PM, SPM, Director, and Admin can edit vendors
    const allowedRoles = ['Project Manager', 'Senior Project Manager', 'Director', 'Admin']
    return authStore.isAuthenticated && allowedRoles.includes(authStore.currentUser.role)
  })

  const canDeleteVendors = computed(() => {
    // Only Director and Admin can delete vendors
    const allowedRoles = ['Director', 'Admin']
    return authStore.isAuthenticated && allowedRoles.includes(authStore.currentUser.role)
  })

  const canAssignVendors = computed(() => {
    // Only PM, SPM, Director, and Admin can assign vendors to projects
    const allowedRoles = ['Project Manager', 'Senior Project Manager', 'Director', 'Admin']
    return authStore.isAuthenticated && allowedRoles.includes(authStore.currentUser.role)
  })

  const canRemoveVendors = computed(() => {
    // Only PM, SPM, Director, and Admin can remove vendors from projects
    const allowedRoles = ['Project Manager', 'Senior Project Manager', 'Director', 'Admin']
    return authStore.isAuthenticated && allowedRoles.includes(authStore.currentUser.role)
  })

  const canEditAssignments = computed(() => {
    // Only PM, SPM, Director, and Admin can edit vendor assignments
    const allowedRoles = ['Project Manager', 'Senior Project Manager', 'Director', 'Admin']
    return authStore.isAuthenticated && allowedRoles.includes(authStore.currentUser.role)
  })

  const canViewVendorDetails = computed(() => {
    // All authenticated users can view vendor details
    return authStore.isAuthenticated
  })

  const canContactVendors = computed(() => {
    // All authenticated users can contact vendors
    return authStore.isAuthenticated
  })

  const canViewVendorProjects = computed(() => {
    // All authenticated users can view vendor project assignments
    return authStore.isAuthenticated
  })

  const canManageVendorPerformance = computed(() => {
    // Only PM, SPM, Director, and Admin can manage vendor performance ratings
    const allowedRoles = ['Project Manager', 'Senior Project Manager', 'Director', 'Admin']
    return authStore.isAuthenticated && allowedRoles.includes(authStore.currentUser.role)
  })

  // Helper function to check if user has specific permission for a vendor
  const hasVendorPermission = (permission: string, vendorId?: string) => {
    switch (permission) {
      case 'view':
        return canViewVendors.value
      case 'create':
        return canCreateVendors.value
      case 'edit':
        return canEditVendors.value
      case 'delete':
        return canDeleteVendors.value
      case 'assign':
        return canAssignVendors.value
      case 'remove':
        return canRemoveVendors.value
      case 'editAssignment':
        return canEditAssignments.value
      case 'viewDetails':
        return canViewVendorDetails.value
      case 'contact':
        return canContactVendors.value
      case 'viewProjects':
        return canViewVendorProjects.value
      case 'managePerformance':
        return canManageVendorPerformance.value
      default:
        return false
    }
  }

  // Helper function to get permission error message
  const getPermissionErrorMessage = (permission: string) => {
    const roleRequirements: Record<string, string> = {
      create: 'Project Manager, Senior Project Manager, Director, or Admin',
      edit: 'Project Manager, Senior Project Manager, Director, or Admin',
      delete: 'Director or Admin',
      assign: 'Project Manager, Senior Project Manager, Director, or Admin',
      remove: 'Project Manager, Senior Project Manager, Director, or Admin',
      editAssignment: 'Project Manager, Senior Project Manager, Director, or Admin',
      managePerformance: 'Project Manager, Senior Project Manager, Director, or Admin'
    }

    const requiredRole = roleRequirements[permission]
    if (requiredRole) {
      return `This action requires ${requiredRole} privileges.`
    }
    return 'You do not have permission to perform this action.'
  }

  // Helper function to check if user can perform action and show error if not
  const checkPermissionOrError = (permission: string, vendorId?: string): boolean => {
    const hasPermission = hasVendorPermission(permission, vendorId)
    if (!hasPermission) {
      const errorMessage = getPermissionErrorMessage(permission)
      console.warn(`Permission denied: ${errorMessage}`)
      // You could also show a toast notification here
    }
    return hasPermission
  }

  // Role-based UI helpers
  const showVendorActions = computed(() => {
    return canEditVendors.value || canAssignVendors.value
  })

  const showAssignmentActions = computed(() => {
    return canEditAssignments.value || canRemoveVendors.value
  })

  const showManagementFeatures = computed(() => {
    return canCreateVendors.value || canEditVendors.value
  })

  return {
    // Permission checks
    canViewVendors,
    canCreateVendors,
    canEditVendors,
    canDeleteVendors,
    canAssignVendors,
    canRemoveVendors,
    canEditAssignments,
    canViewVendorDetails,
    canContactVendors,
    canViewVendorProjects,
    canManageVendorPerformance,

    // Helper functions
    hasVendorPermission,
    getPermissionErrorMessage,
    checkPermissionOrError,

    // UI helpers
    showVendorActions,
    showAssignmentActions,
    showManagementFeatures,

    // Current user info
    currentUserRole: computed(() => authStore.currentUser.role),
    isAuthenticated: computed(() => authStore.isAuthenticated)
  }
}

export default useVendorPermissions

