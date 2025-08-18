/**
 * Wizard Navigation Guards
 * Implements role-based access control and workflow validation for wizard routes
 * Integrates with wizard state management and user permissions
 */

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectWizardStore } from '@/stores/projectWizard'
import { ProjectWorkflowAPI } from '@/services/projectWorkflowApi'
import { WIZARD_STEPS, getStepConfig, isValidWizardStep, type WizardStepId } from './wizardRoutes'
import { normalizeRole } from '@/constants/roles'

// Guard result types
export interface GuardResult {
  allowed: boolean
  redirect?: {
    name: string
    params?: Record<string, any>
    query?: Record<string, any>
  }
  message?: string
  error?: string
}

/**
 * Check if user has required role for wizard step
 */
export const checkStepRoleAccess = (
  userRole: string, 
  stepId: WizardStepId
): GuardResult => {
  const stepConfig = getStepConfig(stepId)
  
  if (!stepConfig) {
    return {
      allowed: false,
      error: `Invalid wizard step: ${stepId}`
    }
  }
  
  const normalizedRole = normalizeRole(userRole)
  const hasRequiredRole = stepConfig.requiredRoles.includes(normalizedRole)
  
  if (!hasRequiredRole) {
    return {
      allowed: false,
      redirect: { name: 'wizard-dashboard' },
      message: `Access denied: ${stepConfig.title} requires ${stepConfig.requiredRoles.join(' or ')} role`
    }
  }
  
  return { allowed: true }
}

/**
 * Check if project workflow status allows access to step
 */
export const checkStepWorkflowAccess = async (
  projectId: string,
  stepId: WizardStepId,
  userRole: string,
  userId: string
): Promise<GuardResult> => {
  try {
    const stepConfig = getStepConfig(stepId)
    if (!stepConfig) {
      return {
        allowed: false,
        error: `Invalid wizard step: ${stepId}`
      }
    }
    
    // Get project workflow status
    const workflowStatus = await ProjectWorkflowAPI.getWorkflowStatus(projectId)
    
    // Check if step requires specific workflow status
    if (stepConfig.requiredStatus && stepConfig.requiredStatus.length > 0) {
      const hasRequiredStatus = stepConfig.requiredStatus.includes(workflowStatus.workflow_status)
      
      if (!hasRequiredStatus) {
        // Determine appropriate redirect based on current status
        const nextStep = ProjectWorkflowAPI.getNextStepForUser(
          userRole,
          workflowStatus.workflow_status,
          workflowStatus.assigned_pm,
          workflowStatus.assigned_spm,
          userId,
          projectId
        )
        
        if (nextStep) {
          return {
            allowed: false,
            redirect: {
              name: nextStep.route,
              params: nextStep.params
            },
            message: `Project is in ${workflowStatus.workflow_status} status. Redirecting to appropriate step.`
          }
        } else {
          return {
            allowed: false,
            redirect: {
              name: 'project-detail',
              params: { id: projectId }
            },
            message: `Project workflow is complete. Redirecting to project details.`
          }
        }
      }
    }
    
    // Additional permission checks for assigned projects
    if (stepId === 'configure') {
      const canAccess = ProjectWorkflowAPI.canUserPerformAction(
        userRole,
        'finalize',
        workflowStatus.workflow_status
      )
      
      if (!canAccess) {
        return {
          allowed: false,
          redirect: { name: 'wizard-dashboard' },
          message: 'You do not have permission to configure this project'
        }
      }
      
      // Check if user is assigned to project
      if (userRole === 'pm' || userRole === 'spm') {
        const isAssigned = workflowStatus.assigned_pm === userId || 
                          workflowStatus.assigned_spm === userId
        
        if (!isAssigned && userRole !== 'admin') {
          return {
            allowed: false,
            redirect: { name: 'wizard-dashboard' },
            message: 'You are not assigned to this project'
          }
        }
      }
    }
    
    return { allowed: true }
    
  } catch (error: any) {
    console.error('Failed to check workflow access:', error)
    return {
      allowed: false,
      redirect: { name: 'wizard-dashboard' },
      error: `Failed to verify project access: ${error.message}`
    }
  }
}

/**
 * Validate project exists and user has access
 */
export const checkProjectAccess = async (
  projectId: string,
  userRole: string,
  userId: string
): Promise<GuardResult> => {
  try {
    // Attempt to get project details
    const projectResponse = await ProjectWorkflowAPI.getProject(projectId)
    
    if (!projectResponse.project) {
      return {
        allowed: false,
        redirect: { name: 'wizard-dashboard' },
        error: 'Project not found'
      }
    }
    
    // Additional access checks could go here
    // For now, if user can fetch the project, they have access
    
    return { allowed: true }
    
  } catch (error: any) {
    console.error('Failed to check project access:', error)
    
    // Handle specific error cases
    if (error.message.includes('404') || error.message.includes('not found')) {
      return {
        allowed: false,
        redirect: { name: 'wizard-dashboard' },
        error: 'Project not found'
      }
    }
    
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return {
        allowed: false,
        redirect: { name: 'wizard-dashboard' },
        error: 'Access denied to this project'
      }
    }
    
    return {
      allowed: false,
      redirect: { name: 'wizard-dashboard' },
      error: `Failed to access project: ${error.message}`
    }
  }
}

/**
 * Main wizard navigation guard
 */
export const wizardGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> => {
  const authStore = useAuthStore()
  const wizardStore = useProjectWizardStore()
  
  // Ensure user is authenticated
  if (!authStore.isAuthenticated || !authStore.currentUser) {
    console.warn('Wizard access denied: User not authenticated')
    next({ name: 'home' })
    return
  }
  
  const userRole = normalizeRole(authStore.currentUser.role)
  const userId = authStore.currentUser.id.toString()
  
  try {
    // Extract route parameters
    const projectId = to.params.projectId as string
    const stepParam = to.params.step as string
    
    // Determine step from route
    let stepId: WizardStepId | undefined
    
    if (stepParam && isValidWizardStep(stepParam)) {
      stepId = stepParam as WizardStepId
    } else if (to.meta.step) {
      stepId = (to.meta.step as any).id as WizardStepId
    }
    
    // Handle wizard dashboard access
    if (to.name === 'wizard-dashboard') {
      // Dashboard is accessible to all internal users
      next()
      return
    }
    
    // Validate step if provided
    if (stepId) {
      // Check role access for step
      const roleCheck = checkStepRoleAccess(userRole, stepId)
      if (!roleCheck.allowed) {
        if (roleCheck.redirect) {
          console.warn('Wizard step access denied:', roleCheck.message)
          next(roleCheck.redirect)
        } else {
          console.error('Wizard step error:', roleCheck.error)
          next({ name: 'wizard-dashboard' })
        }
        return
      }
    }
    
    // Handle project-specific routes
    if (projectId) {
      // Check project access
      const projectCheck = await checkProjectAccess(projectId, userRole, userId)
      if (!projectCheck.allowed) {
        if (projectCheck.redirect) {
          console.warn('Project access denied:', projectCheck.error)
          next(projectCheck.redirect)
        } else {
          console.error('Project access error:', projectCheck.error)
          next({ name: 'wizard-dashboard' })
        }
        return
      }
      
      // Check workflow access if step is specified
      if (stepId) {
        const workflowCheck = await checkStepWorkflowAccess(projectId, stepId, userRole, userId)
        if (!workflowCheck.allowed) {
          if (workflowCheck.redirect) {
            console.warn('Workflow step access denied:', workflowCheck.message)
            next(workflowCheck.redirect)
          } else {
            console.error('Workflow step error:', workflowCheck.error)
            next({ name: 'wizard-dashboard' })
          }
          return
        }
      }
      
      // Load project into wizard store if not already loaded
      if (!wizardStore.project || wizardStore.project.id !== projectId) {
        try {
          await wizardStore.loadProject(projectId)
        } catch (error: any) {
          console.error('Failed to load project for wizard:', error)
          next({ 
            name: 'wizard-dashboard',
            query: { error: 'Failed to load project' }
          })
          return
        }
      }
    }
    
    // Handle default project route (no step specified)
    if (projectId && !stepId && to.name === 'wizard-project-default') {
      // Determine appropriate step based on project status and user role
      const nextStep = ProjectWorkflowAPI.getNextStepForUser(
        userRole,
        wizardStore.project?.workflow_status || '',
        wizardStore.project?.assigned_pm,
        wizardStore.project?.assigned_spm,
        userId,
        projectId
      )
      
      if (nextStep) {
        next({ name: nextStep.route, params: nextStep.params })
      } else {
        // No appropriate step, redirect to project details
        next({ name: 'project-detail', params: { id: projectId } })
      }
      return
    }
    
    // All checks passed, allow navigation
    next()
    
  } catch (error: any) {
    console.error('Wizard guard error:', error)
    next({ 
      name: 'wizard-dashboard',
      query: { error: 'Navigation error occurred' }
    })
  }
}

/**
 * Before leave guard for wizard routes
 * Handles unsaved changes warning
 */
export const wizardLeaveGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void => {
  const wizardStore = useProjectWizardStore()
  
  // Check if leaving wizard entirely
  const leavingWizard = !to.path.startsWith('/wizard')
  
  // Check for unsaved changes
  if (leavingWizard && wizardStore.hasUnsavedChanges) {
    const confirmed = window.confirm(
      'You have unsaved changes in the wizard. Are you sure you want to leave?'
    )
    
    if (!confirmed) {
      next(false) // Cancel navigation
      return
    }
  }
  
  // Clear wizard state if leaving wizard entirely
  if (leavingWizard) {
    // Don't reset if going to project details (successful completion)
    if (!to.path.startsWith('/projects/')) {
      wizardStore.resetWizard()
    }
  }
  
  next()
}

/**
 * Setup wizard guards for router
 */
export const setupWizardGuards = (router: any) => {
  // Add wizard-specific navigation guard
  router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    // Only apply wizard guard to wizard routes
    if (to.path.startsWith('/wizard')) {
      return wizardGuard(to, from, next)
    }
    next()
  })
  
  // Add leave guard for wizard routes
  router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    // Only apply leave guard when leaving wizard routes
    if (from.path.startsWith('/wizard')) {
      return wizardLeaveGuard(to, from, next)
    }
    next()
  })
}

export default {
  wizardGuard,
  wizardLeaveGuard,
  setupWizardGuards,
  checkStepRoleAccess,
  checkStepWorkflowAccess,
  checkProjectAccess
}

