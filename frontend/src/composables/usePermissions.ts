// Centralized role management and permissions system
// Replaces hard-coded role checks throughout the application

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Define role hierarchies and permissions
export const ROLES = {
  ADMIN: 'Admin',
  DIRECTOR: 'Director',
  SENIOR_PROJECT_MANAGER: 'Senior Project Manager',
  PROJECT_MANAGER: 'Project Manager',
  PROJECT_COORDINATOR: 'Project Coordinator',
  ANALYST: 'Analyst',
  VIEWER: 'Viewer'
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

// Define permission groups
export const PERMISSION_GROUPS = {
  // Project management permissions
  PROJECT_EDIT: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER],
  PROJECT_VIEW: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER, ROLES.PROJECT_COORDINATOR, ROLES.ANALYST, ROLES.VIEWER],
  PROJECT_DELETE: [ROLES.ADMIN, ROLES.DIRECTOR],
  
  // Milestone permissions
  MILESTONE_EDIT: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER],
  MILESTONE_VIEW: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER, ROLES.PROJECT_COORDINATOR, ROLES.ANALYST, ROLES.VIEWER],
  MILESTONE_APPROVE: [ROLES.ADMIN, ROLES.DIRECTOR],
  
  // Gate meeting permissions
  MEETING_CREATE: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER],
  MEETING_EDIT: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER],
  MEETING_DELETE: [ROLES.ADMIN, ROLES.DIRECTOR],
  MEETING_COMPLETE: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER],
  MEETING_VIEW: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER, ROLES.PROJECT_COORDINATOR, ROLES.ANALYST, ROLES.VIEWER],
  
  // Version management permissions
  VERSION_CREATE: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER],
  VERSION_APPROVE: [ROLES.ADMIN, ROLES.DIRECTOR],
  VERSION_REJECT: [ROLES.ADMIN, ROLES.DIRECTOR],
  VERSION_VIEW: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER, ROLES.PROJECT_COORDINATOR, ROLES.ANALYST, ROLES.VIEWER],
  
  // Vendor management permissions
  VENDOR_CREATE: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER],
  VENDOR_EDIT: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER],
  VENDOR_DELETE: [ROLES.ADMIN, ROLES.DIRECTOR],
  VENDOR_VIEW: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER, ROLES.PROJECT_COORDINATOR, ROLES.ANALYST, ROLES.VIEWER],
  
  // Team management permissions
  TEAM_ASSIGN: [ROLES.ADMIN, ROLES.DIRECTOR],
  TEAM_EDIT: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER],
  TEAM_VIEW: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER, ROLES.PROJECT_COORDINATOR, ROLES.ANALYST, ROLES.VIEWER],
  
  // Budget permissions
  BUDGET_EDIT: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER],
  BUDGET_VIEW: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER, ROLES.PROJECT_COORDINATOR, ROLES.ANALYST, ROLES.VIEWER],
  
  // Report permissions
  REPORT_GENERATE: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER],
  REPORT_VIEW: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SENIOR_PROJECT_MANAGER, ROLES.PROJECT_MANAGER, ROLES.PROJECT_COORDINATOR, ROLES.ANALYST, ROLES.VIEWER],
  
  // Administrative permissions
  ADMIN_SETTINGS: [ROLES.ADMIN],
  ADMIN_USERS: [ROLES.ADMIN, ROLES.DIRECTOR],
  ADMIN_SYSTEM: [ROLES.ADMIN]
} as const

export type PermissionGroup = keyof typeof PERMISSION_GROUPS

/**
 * Composable for centralized permission management
 */
export function usePermissions() {
  const authStore = useAuthStore()
  
  const currentUser = computed(() => authStore.currentUser)
  const userRole = computed(() => currentUser.value?.role as UserRole)
  
  /**
   * Check if the current user has a specific permission
   */
  const hasPermission = (permission: PermissionGroup): boolean => {
    if (!userRole.value) return false
    
    const allowedRoles = PERMISSION_GROUPS[permission]
    return allowedRoles.includes(userRole.value)
  }
  
  /**
   * Check if the current user has any of the specified roles
   */
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!userRole.value) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(userRole.value)
  }
  
  /**
   * Check if the current user has at least the specified role level
   * (based on role hierarchy)
   */
  const hasRoleLevel = (minimumRole: UserRole): boolean => {
    if (!userRole.value) return false
    
    const roleHierarchy = [
      ROLES.VIEWER,
      ROLES.ANALYST,
      ROLES.PROJECT_COORDINATOR,
      ROLES.PROJECT_MANAGER,
      ROLES.SENIOR_PROJECT_MANAGER,
      ROLES.DIRECTOR,
      ROLES.ADMIN
    ]
    
    const userLevel = roleHierarchy.indexOf(userRole.value)
    const minimumLevel = roleHierarchy.indexOf(minimumRole)
    
    return userLevel >= minimumLevel
  }
  
  /**
   * Get all permissions for the current user
   */
  const userPermissions = computed(() => {
    if (!userRole.value) return []
    
    return Object.entries(PERMISSION_GROUPS)
      .filter(([_, allowedRoles]) => allowedRoles.includes(userRole.value))
      .map(([permission]) => permission as PermissionGroup)
  })
  
  /**
   * Check if user can edit projects
   */
  const canEditProjects = computed(() => hasPermission('PROJECT_EDIT'))
  
  /**
   * Check if user can view projects
   */
  const canViewProjects = computed(() => hasPermission('PROJECT_VIEW'))
  
  /**
   * Check if user can delete projects
   */
  const canDeleteProjects = computed(() => hasPermission('PROJECT_DELETE'))
  
  /**
   * Check if user can edit milestones
   */
  const canEditMilestones = computed(() => hasPermission('MILESTONE_EDIT'))
  
  /**
   * Check if user can approve milestones
   */
  const canApproveMilestones = computed(() => hasPermission('MILESTONE_APPROVE'))
  
  /**
   * Check if user can create meetings
   */
  const canCreateMeetings = computed(() => hasPermission('MEETING_CREATE'))
  
  /**
   * Check if user can edit meetings
   */
  const canEditMeetings = computed(() => hasPermission('MEETING_EDIT'))
  
  /**
   * Check if user can delete meetings
   */
  const canDeleteMeetings = computed(() => hasPermission('MEETING_DELETE'))
  
  /**
   * Check if user can complete meetings
   */
  const canCompleteMeetings = computed(() => hasPermission('MEETING_COMPLETE'))
  
  /**
   * Check if user can create versions
   */
  const canCreateVersions = computed(() => hasPermission('VERSION_CREATE'))
  
  /**
   * Check if user can approve versions
   */
  const canApproveVersions = computed(() => hasPermission('VERSION_APPROVE'))
  
  /**
   * Check if user can manage vendors
   */
  const canManageVendors = computed(() => hasPermission('VENDOR_EDIT'))
  
  /**
   * Check if user can manage teams
   */
  const canManageTeams = computed(() => hasPermission('TEAM_ASSIGN'))
  
  /**
   * Check if user can edit budgets
   */
  const canEditBudgets = computed(() => hasPermission('BUDGET_EDIT'))
  
  /**
   * Check if user can generate reports
   */
  const canGenerateReports = computed(() => hasPermission('REPORT_GENERATE'))
  
  /**
   * Check if user has admin privileges
   */
  const isAdmin = computed(() => hasRole(ROLES.ADMIN))
  
  /**
   * Check if user is a director or higher
   */
  const isDirectorOrHigher = computed(() => hasRoleLevel(ROLES.DIRECTOR))
  
  /**
   * Check if user is a project manager or higher
   */
  const isProjectManagerOrHigher = computed(() => hasRoleLevel(ROLES.PROJECT_MANAGER))
  
  /**
   * Get user-friendly role display name
   */
  const roleDisplayName = computed(() => {
    const roleNames: Record<UserRole, string> = {
      [ROLES.ADMIN]: 'Administrator',
      [ROLES.DIRECTOR]: 'Director',
      [ROLES.SENIOR_PROJECT_MANAGER]: 'Senior Project Manager',
      [ROLES.PROJECT_MANAGER]: 'Project Manager',
      [ROLES.PROJECT_COORDINATOR]: 'Project Coordinator',
      [ROLES.ANALYST]: 'Analyst',
      [ROLES.VIEWER]: 'Viewer'
    }
    
    return userRole.value ? roleNames[userRole.value] : 'Unknown'
  })
  
  return {
    // User info
    currentUser,
    userRole,
    roleDisplayName,
    userPermissions,
    
    // Permission checks
    hasPermission,
    hasRole,
    hasRoleLevel,
    
    // Specific permission checks
    canEditProjects,
    canViewProjects,
    canDeleteProjects,
    canEditMilestones,
    canApproveMilestones,
    canCreateMeetings,
    canEditMeetings,
    canDeleteMeetings,
    canCompleteMeetings,
    canCreateVersions,
    canApproveVersions,
    canManageVendors,
    canManageTeams,
    canEditBudgets,
    canGenerateReports,
    
    // Role level checks
    isAdmin,
    isDirectorOrHigher,
    isProjectManagerOrHigher
  }
}

/**
 * Utility function to check permissions outside of Vue components
 */
export function checkPermission(userRole: UserRole, permission: PermissionGroup): boolean {
  const allowedRoles = PERMISSION_GROUPS[permission]
  return allowedRoles.includes(userRole)
}

/**
 * Utility function to check role level outside of Vue components
 */
export function checkRoleLevel(userRole: UserRole, minimumRole: UserRole): boolean {
  const roleHierarchy = [
    ROLES.VIEWER,
    ROLES.ANALYST,
    ROLES.PROJECT_COORDINATOR,
    ROLES.PROJECT_MANAGER,
    ROLES.SENIOR_PROJECT_MANAGER,
    ROLES.DIRECTOR,
    ROLES.ADMIN
  ]
  
  const userLevel = roleHierarchy.indexOf(userRole)
  const minimumLevel = roleHierarchy.indexOf(minimumRole)
  
  return userLevel >= minimumLevel
}

