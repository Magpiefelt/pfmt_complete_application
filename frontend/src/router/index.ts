import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLES, ROLE_GROUPS, normalizeRole } from '@/constants/roles'
import wizardRoutes from './wizardRoutes'
import { setupWizardGuards } from './wizardGuards'

// Lazy-loaded components
const HomePage = () => import('@/pages/HomePage.vue')
const VendorPortal = () => import('@/pages/VendorPortal.vue')
const StaffPortal = () => import('@/pages/StaffPortal.vue')
const ProjectsPage = () => import('@/pages/ProjectsPage.vue')
const ProjectDetailPage = () => import('@/pages/ProjectDetailPage.vue')
const NewProjectPage = () => import('@/pages/NewProjectPage.vue')
const ProjectWizardPage = () => import('@/pages/ProjectWizardPage.vue')
const ReportsPage = () => import('@/pages/ReportsPage.vue')
const SettingsPage = () => import('@/pages/SettingsPage.vue')
const MeetingsPage = () => import('@/pages/MeetingsPage.vue')
const VendorManagementPage = () => import('@/pages/VendorManagementPage.vue')
const WorkflowPage = () => import('@/pages/WorkflowPage.vue')
const FinancialDashboardPage = () => import('@/pages/FinancialDashboardPage.vue')
const TestPage = () => import('@/components/TestPage.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/test',
      name: 'test',
      component: TestPage
    },
    {
      path: '/',
      name: 'home',
      component: HomePage,
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        const currentUser = authStore.currentUser
        
        if (currentUser?.role === ROLES.VENDOR) {
          next('/vendor')
        } else {
          next('/staff')
        }
      }
    },
    {
      path: '/vendor',
      name: 'vendor',
      component: VendorPortal,
      meta: { requiresAuth: true, roles: [ROLES.VENDOR] }
    },
    {
      path: '/staff',
      name: 'staff',
      component: StaffPortal,
      meta: { requiresAuth: true, roles: ROLE_GROUPS.ALL_INTERNAL }
    },
    {
      path: '/projects',
      name: 'projects',
      component: ProjectsPage,
      meta: { requiresAuth: true, view: 'my' }
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: ProjectDetailPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/projects/new',
      name: 'new-project',
      component: NewProjectPage,
      meta: { requiresAuth: true, roles: [ROLES.PMI, ROLES.ADMIN] }
    },
    
    // PMI canonical create:
    { 
      path: '/wizard/initiate', 
      name: 'wizard-initiate',
      component: () => import('@/components/wizard/WizardContainer.vue'),
      meta: { requiresAuth: true, roles: ['pmi','admin'] } 
    },

    // Director assignment:
    { 
      path: '/wizard/project/:projectId/assign', 
      name: 'wizard-project-assign',
      component: () => import('@/components/wizard/WizardContainer.vue'),
      meta: { requiresAuth: true, roles: ['director','admin'] } 
    },

    // PM/SPM configure (substeps handled inside container)
    { 
      path: '/wizard/project/:projectId/config/:substep(overview|vendors|budget|milestone)',
      name: 'wizard-project-configure',
      component: () => import('@/components/wizard/WizardContainer.vue'),
      meta: { requiresAuth: true, roles: ['pm','spm','admin'] } 
    },

    // Legacy fast wizard for power users:
    { 
      path: '/legacy-wizard/new', 
      name: 'legacy-wizard-new',
      component: () => import('@/pages/LegacyWizardPage.vue'),
      meta: { requiresAuth: true, roles: ['director','spm','admin'] } 
    },
    
    // Legacy wizard route - redirect to new wizard system
    {
      path: '/projects/wizard',
      name: 'project-wizard',
      redirect: { name: 'wizard-dashboard' },
      meta: { requiresAuth: true, roles: ROLE_GROUPS.ALL_INTERNAL }
    },
    // Include existing wizard routes
    ...wizardRoutes,
    {
      path: '/projects/all',
      name: 'projects-all',
      component: ProjectsPage,
      meta: { requiresAuth: true, view: 'all', roles: ROLE_GROUPS.ALL_INTERNAL }
    },
    {
      path: '/meetings',
      name: 'meetings',
      component: MeetingsPage,
      meta: { requiresAuth: true, roles: ROLE_GROUPS.ALL_INTERNAL }
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsPage,
      meta: { requiresAuth: true, roles: ROLE_GROUPS.ALL_INTERNAL }
    },
    {
      path: '/financial',
      name: 'financial',
      component: FinancialDashboardPage,
      meta: { 
        requiresAuth: true, 
        roles: [ROLES.PM, ROLES.SPM, ROLES.DIRECTOR, ROLES.EXECUTIVE, ROLES.ADMIN] 
      }
    },
    {
      path: '/vendors',
      name: 'vendors',
      component: VendorManagementPage,
      meta: { 
        requiresAuth: true, 
        roles: [ROLES.PM, ROLES.SPM, ROLES.DIRECTOR, ROLES.ADMIN] 
      }
    },
    {
      path: '/workflow',
      name: 'workflow',
      component: WorkflowPage,
      meta: { 
        requiresAuth: true, 
        roles: [ROLES.PMI, ROLES.PM, ROLES.SPM, ROLES.DIRECTOR, ROLES.ADMIN] 
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage,
      meta: { requiresAuth: true }
    },
    {
      // Catch-all route for 404s
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/'
    }
  ],
})

// Setup wizard-specific navigation guards
setupWizardGuards(router)

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const currentUser = authStore.currentUser
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login or home
    next('/')
    return
  }
  
  // Check role-based access
  if (to.meta.roles && currentUser) {
    // Normalize user role to ensure compatibility
    const userRole = normalizeRole(currentUser.role as string)
    const requiredRoles = to.meta.roles as string[]
    
    const hasRequiredRole = requiredRoles.includes(userRole)
    if (!hasRequiredRole) {
      // Prevent infinite redirect by checking if we're already going to the target
      const targetRoute = userRole === ROLES.VENDOR ? '/vendor' : '/staff'
      if (to.path !== targetRoute) {
        console.warn(`Access denied: User role '${userRole}' not in required roles:`, requiredRoles)
        next(targetRoute)
        return
      }
    }
  }
  
  next()
})

export default router

