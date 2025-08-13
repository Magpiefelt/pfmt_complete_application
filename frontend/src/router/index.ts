import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy-loaded components
const HomePage = () => import('@/pages/HomePage.vue')
const VendorPortal = () => import('@/pages/VendorPortal.vue')
const StaffPortal = () => import('@/pages/StaffPortal.vue')
const ProjectsPage = () => import('@/pages/ProjectsPage.vue')
const ProjectDetailPage = () => import('@/pages/ProjectDetailPage.vue')
const NewProjectPage = () => import('@/pages/NewProjectPage.vue')
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
        
        if (currentUser?.role === 'Vendor') {
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
      meta: { requiresAuth: true, roles: ['Vendor'] }
    },
    {
      path: '/staff',
      name: 'staff',
      component: StaffPortal,
      meta: { requiresAuth: true, roles: ['Project Manager', 'Senior Project Manager', 'Director'] }
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
      meta: { requiresAuth: true, roles: ['Project Manager', 'Senior Project Manager', 'Director'] }
    },
    {
      path: '/projects/all',
      name: 'projects-all',
      component: ProjectsPage,
      meta: { requiresAuth: true, view: 'all' }
    },
    {
      path: '/meetings',
      name: 'meetings',
      component: MeetingsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/financial',
      name: 'financial',
      component: FinancialDashboardPage,
      meta: { requiresAuth: true, roles: ['Project Manager', 'Senior Project Manager', 'Director', 'CFO', 'Executive'] }
    },
    {
      path: '/vendors',
      name: 'vendors',
      component: VendorManagementPage,
      meta: { requiresAuth: true, roles: ['Project Manager', 'Senior Project Manager', 'Director'] }
    },
    {
      path: '/workflow',
      name: 'workflow',
      component: WorkflowPage,
      meta: { requiresAuth: true, roles: ['Project Manager', 'Senior Project Manager', 'Director'] }
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
    const hasRequiredRole = (to.meta.roles as string[]).includes(currentUser.role)
    if (!hasRequiredRole) {
      // Prevent infinite redirect by checking if we're already going to the target
      const targetRoute = currentUser.role === 'Vendor' ? '/vendor' : '/staff'
      if (to.path !== targetRoute) {
        next(targetRoute)
        return
      }
    }
  }
  
  next()
})

export default router

