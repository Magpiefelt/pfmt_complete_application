/**
 * Wizard Routes Configuration
 * Defines all wizard-related routes with resume-by-ID functionality
 * Integrates with role-based access control and navigation guards
 */

import type { RouteRecordRaw } from 'vue-router'
import { ROLES, ROLE_GROUPS } from '@/constants/roles'

// Lazy-loaded wizard components
const WizardLayout = () => import('@/components/wizard/WizardLayout.vue')
const WizardStepWrapper = () => import('@/components/wizard/WizardStepWrapper.vue')
const WizardDashboard = () => import('@/components/wizard/WizardDashboard.vue')

// Wizard step definitions for route metadata
export const WIZARD_STEPS = {
  INITIATE: {
    id: 'initiate',
    title: 'Project Initiation',
    description: 'Create new project with basic information',
    component: 'InitiationStep',
    requiredRoles: [ROLES.PMI, ROLES.ADMIN],
    requiredStatus: [],
    order: 1
  },
  ASSIGN: {
    id: 'assign',
    title: 'Team Assignment',
    description: 'Assign project manager and senior project manager',
    component: 'AssignmentStep',
    requiredRoles: [ROLES.DIRECTOR, ROLES.ADMIN],
    requiredStatus: ['initiated'],
    order: 2
  },
  CONFIGURE: {
    id: 'configure',
    title: 'Project Configuration',
    description: 'Configure project details, vendors, budget, and milestones',
    component: 'ConfigurationStep',
    requiredRoles: [ROLES.PM, ROLES.SPM, ROLES.ADMIN],
    requiredStatus: ['assigned'],
    order: 3
  }
} as const

export type WizardStepId = keyof typeof WIZARD_STEPS

// Wizard route definitions
export const wizardRoutes: RouteRecordRaw[] = [
  {
    path: '/wizard',
    name: 'wizard',
    component: WizardLayout,
    meta: { 
      requiresAuth: true, 
      roles: ROLE_GROUPS.ALL_INTERNAL,
      title: 'Project Wizard'
    },
    children: [
      // Wizard dashboard - shows available actions for user
      {
        path: '',
        name: 'wizard-dashboard',
        component: WizardDashboard,
        meta: {
          title: 'Wizard Dashboard',
          description: 'Choose your next action'
        }
      },
      
      // New project initiation (no project ID)
      {
        path: 'initiate',
        name: 'wizard-initiate',
        component: WizardStepWrapper,
        meta: {
          title: WIZARD_STEPS.INITIATE.title,
          description: WIZARD_STEPS.INITIATE.description,
          roles: WIZARD_STEPS.INITIATE.requiredRoles,
          step: WIZARD_STEPS.INITIATE,
          requiresProject: false
        }
      },
      
      // Resume existing project by ID - dynamic step routing
      {
        path: ':projectId',
        name: 'wizard-project',
        component: WizardLayout,
        meta: {
          title: 'Project Wizard',
          requiresProject: true
        },
        children: [
          // Project-specific initiation (for editing)
          {
            path: 'initiate',
            name: 'wizard-project-initiate',
            component: WizardStepWrapper,
            meta: {
              title: WIZARD_STEPS.INITIATE.title,
              description: WIZARD_STEPS.INITIATE.description,
              roles: WIZARD_STEPS.INITIATE.requiredRoles,
              step: WIZARD_STEPS.INITIATE,
              requiresProject: true
            }
          },
          
          // Team assignment step
          {
            path: 'assign',
            name: 'wizard-project-assign',
            component: WizardStepWrapper,
            meta: {
              title: WIZARD_STEPS.ASSIGN.title,
              description: WIZARD_STEPS.ASSIGN.description,
              roles: WIZARD_STEPS.ASSIGN.requiredRoles,
              step: WIZARD_STEPS.ASSIGN,
              requiresProject: true,
              requiredStatus: WIZARD_STEPS.ASSIGN.requiredStatus
            }
          },
          
          // Project configuration step
          {
            path: 'configure',
            name: 'wizard-project-configure',
            component: WizardStepWrapper,
            meta: {
              title: WIZARD_STEPS.CONFIGURE.title,
              description: WIZARD_STEPS.CONFIGURE.description,
              roles: WIZARD_STEPS.CONFIGURE.requiredRoles,
              step: WIZARD_STEPS.CONFIGURE,
              requiresProject: true,
              requiredStatus: WIZARD_STEPS.CONFIGURE.requiredStatus
            }
          },
          
          // Default redirect to appropriate step for project
          {
            path: '',
            name: 'wizard-project-default',
            redirect: (to) => {
              // This will be handled by navigation guard to determine correct step
              return { name: 'wizard-project-initiate', params: to.params }
            }
          }
        ]
      },
      
      // Legacy wizard route compatibility
      {
        path: 'project/:projectId?',
        redirect: (to) => {
          if (to.params.projectId) {
            return { name: 'wizard-project', params: { projectId: to.params.projectId } }
          } else {
            return { name: 'wizard-initiate' }
          }
        }
      }
    ]
  },

  // Legacy wizard for Directors/SPMs/Admins only
  {
    path: '/legacy-wizard',
    name: 'legacy-wizard-root',
    meta: { 
      requiresAuth: true, 
      roles: [ROLES.DIRECTOR, ROLES.SPM, ROLES.ADMIN],
      title: 'Legacy Project Wizard'
    },
    children: [
      {
        path: 'project/:projectId',
        name: 'legacy-wizard',
        component: () => import('@/components/project-wizard/ProjectWizard.vue'),
        meta: {
          requiresAuth: true,
          roles: [ROLES.DIRECTOR, ROLES.SPM, ROLES.ADMIN],
          title: 'Legacy Project Configuration',
          requiresProject: true
        }
      }
    ]
  },
  
  // Direct step access routes (for bookmarking and deep linking)
  {
    path: '/wizard/:projectId/:step',
    name: 'wizard-step-direct',
    component: WizardLayout,
    meta: {
      requiresAuth: true,
      roles: ROLE_GROUPS.ALL_INTERNAL,
      requiresProject: true,
      isDirect: true
    },
    beforeEnter: (to, from, next) => {
      // Redirect to proper nested route structure
      const { projectId, step } = to.params
      const routeName = `wizard-project-${step}`
      
      // Validate step exists
      const stepId = step as string
      const stepConfig = Object.values(WIZARD_STEPS).find(s => s.id === stepId)
      
      if (!stepConfig) {
        // Invalid step, redirect to project default
        next({ name: 'wizard-project', params: { projectId } })
        return
      }
      
      // Redirect to proper nested route
      next({ name: routeName, params: { projectId } })
    }
  }
]

// Helper functions for route management
export const getWizardStepRoute = (stepId: WizardStepId, projectId?: string) => {
  if (projectId) {
    return {
      name: `wizard-project-${stepId}`,
      params: { projectId }
    }
  } else if (stepId === 'initiate') {
    return {
      name: 'wizard-initiate'
    }
  } else {
    throw new Error(`Step ${stepId} requires a project ID`)
  }
}

export const getWizardProjectRoute = (projectId: string) => {
  return {
    name: 'wizard-project',
    params: { projectId }
  }
}

export const getWizardDashboardRoute = () => {
  return {
    name: 'wizard-dashboard'
  }
}

// Route validation helpers
export const isValidWizardStep = (stepId: string): stepId is WizardStepId => {
  return Object.keys(WIZARD_STEPS).includes(stepId.toUpperCase() as WizardStepId)
}

export const getStepConfig = (stepId: string) => {
  const upperStepId = stepId.toUpperCase() as WizardStepId
  return WIZARD_STEPS[upperStepId] || null
}

export const getNextStep = (currentStepId: WizardStepId): WizardStepId | null => {
  const steps = Object.values(WIZARD_STEPS).sort((a, b) => a.order - b.order)
  const currentIndex = steps.findIndex(step => step.id === currentStepId)
  
  if (currentIndex >= 0 && currentIndex < steps.length - 1) {
    return steps[currentIndex + 1].id as WizardStepId
  }
  
  return null
}

export const getPreviousStep = (currentStepId: WizardStepId): WizardStepId | null => {
  const steps = Object.values(WIZARD_STEPS).sort((a, b) => a.order - b.order)
  const currentIndex = steps.findIndex(step => step.id === currentStepId)
  
  if (currentIndex > 0) {
    return steps[currentIndex - 1].id as WizardStepId
  }
  
  return null
}

// URL generation helpers
export const generateWizardUrl = (stepId: WizardStepId, projectId?: string): string => {
  if (projectId) {
    return `/wizard/${projectId}/${stepId}`
  } else if (stepId === 'initiate') {
    return '/wizard/initiate'
  } else {
    throw new Error(`Step ${stepId} requires a project ID`)
  }
}

export const parseWizardUrl = (path: string): { projectId?: string; stepId?: WizardStepId } => {
  const wizardMatch = path.match(/^\/wizard(?:\/([^\/]+))?(?:\/([^\/]+))?/)
  
  if (!wizardMatch) {
    return {}
  }
  
  const [, param1, param2] = wizardMatch
  
  // Pattern: /wizard/initiate (no project ID)
  if (param1 && !param2 && isValidWizardStep(param1)) {
    return { stepId: param1 as WizardStepId }
  }
  
  // Pattern: /wizard/projectId/step
  if (param1 && param2 && isValidWizardStep(param2)) {
    return { 
      projectId: param1, 
      stepId: param2 as WizardStepId 
    }
  }
  
  // Pattern: /wizard/projectId (no step)
  if (param1 && !param2) {
    return { projectId: param1 }
  }
  
  return {}
}

export default wizardRoutes

