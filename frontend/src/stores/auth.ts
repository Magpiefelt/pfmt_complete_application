import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { UserAPI } from '@/services/apiService'
import { useProjectStore } from './project'
import {
  ROLES,
  normalizeRole,
  isValidRole,
  ROLE_DISPLAY_NAMES,
  ROLE_GROUPS,
  isInRoleGroup,
  hasRoleOrHigher,
  getRolesForFeature
} from '@/constants/roles'
import type { Role } from '@/constants/roles'

export interface User {
  id: string | number
  name: string
  role: Role
  email?: string
  first_name?: string
  last_name?: string
  username?: string
  is_active?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  // Initialize user from localStorage if available
  const initializeUser = (): User => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser')
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          // Normalize role to canonical format
          if (parsed.role) {
            parsed.role = normalizeRole(parsed.role)
          }
          return parsed
        } catch (e) {
          console.warn('Failed to parse stored user data')
        }
      }
    }
    
    // Default user with canonical role
    return {
      id: 1,
      name: "Sarah Johnson",
      role: ROLES.PM,
      email: "sarah.johnson@gov.ab.ca"
    }
  }

  // State
  const currentUser = ref<User>(initializeUser())
  const isAuthenticated = ref(false)
  const users = ref<User[]>([])
  const loadingUsers = ref(false)

  // Getters
  const isVendor = computed(() => currentUser.value.role === ROLES.VENDOR)
  const isStaff = computed(() => !isVendor.value)
  const isAdmin = computed(() => currentUser.value.role === ROLES.ADMIN)
  const isDirector = computed(() => currentUser.value.role === ROLES.DIRECTOR)
  const isPMI = computed(() => currentUser.value.role === ROLES.PMI)
  const isProjectManager = computed(() => isInRoleGroup(currentUser.value.role, 'PROJECT_MANAGERS'))
  const isLeadership = computed(() => isInRoleGroup(currentUser.value.role, 'LEADERSHIP'))
  
  // Role display name
  const userRoleDisplay = computed(() => ROLE_DISPLAY_NAMES[currentUser.value.role] || currentUser.value.role)

  // Permission helpers
  const canInitiateProjects = computed(() => 
    getRolesForFeature('project_initiation').includes(currentUser.value.role)
  )
  
  const canAssignTeams = computed(() => 
    getRolesForFeature('team_assignment').includes(currentUser.value.role)
  )
  
  const canFinalizeProjects = computed(() => 
    getRolesForFeature('project_finalization').includes(currentUser.value.role)
  )
  
  const canManageUsers = computed(() => 
    getRolesForFeature('user_management').includes(currentUser.value.role)
  )

  // Actions
  const setCurrentUser = (user: User) => {
    // Normalize role before setting
    const normalizedUser = {
      ...user,
      role: normalizeRole(user.role as string)
    }
    
    currentUser.value = normalizedUser
    
    // Persist user to localStorage for API service
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(normalizedUser))
    }
    
    // Trigger project refresh when user changes
    const projectStore = useProjectStore()
    if (projectStore.fetchProjects) {
      projectStore.fetchProjects()
    }
  }

  const setRole = async (role: string) => {
    // Fetch users if not already loaded
    if (users.value.length === 0) {
      await fetchUsers()
    }
    
    // Normalize the requested role
    const canonicalRole = normalizeRole(role)
    
    // Role mapping for backward compatibility
    const roleMap: Record<string, { role: Role; defaultId: number }> = {
      vendor: { role: ROLES.VENDOR, defaultId: 5 },
      pm: { role: ROLES.PM, defaultId: 1 },
      spm: { role: ROLES.SPM, defaultId: 2 },
      director: { role: ROLES.DIRECTOR, defaultId: 3 },
      admin: { role: ROLES.ADMIN, defaultId: 4 },
      pmi: { role: ROLES.PMI, defaultId: 6 },
      analyst: { role: ROLES.ANALYST, defaultId: 7 },
      executive: { role: ROLES.EXECUTIVE, defaultId: 8 }
    }
    
    const targetMapping = roleMap[role.toLowerCase()]
    const targetRole = targetMapping?.role || canonicalRole
    const defaultId = targetMapping?.defaultId
    
    // Find user with matching role or use default
    let user = users.value.find(u => u.role === targetRole)
    if (!user && defaultId) {
      user = users.value.find(u => u.id === defaultId)
    }
    
    // Fallback to creating a user if not found
    if (!user) {
      user = {
        id: defaultId || Date.now(),
        name: `${ROLE_DISPLAY_NAMES[targetRole]} User`,
        role: targetRole,
        email: `${targetRole}@gov.ab.ca`
      }
    }
    
    setCurrentUser(user)
  }

  const fetchUsers = async () => {
    loadingUsers.value = true
    try {
      const response = await UserAPI.getUsers()
      const fetchedUsers = response.data || []
      
      // Normalize roles for all fetched users
      const normalizedUsers = fetchedUsers.map((user: any) => ({
        ...user,
        role: normalizeRole(user.role)
      }))
      
      // Ensure we have default users if API returns empty
      if (normalizedUsers.length === 0) {
        const fallbackUsers: User[] = [
          { id: 1, name: "Sarah Johnson", role: ROLES.PM, email: "sarah.johnson@gov.ab.ca" },
          { id: 2, name: "Mike Chen", role: ROLES.SPM, email: "mike.chen@gov.ab.ca" },
          { id: 3, name: "Lisa Rodriguez", role: ROLES.DIRECTOR, email: "lisa.rodriguez@gov.ab.ca" },
          { id: 4, name: "Admin User", role: ROLES.ADMIN, email: "admin@gov.ab.ca" },
          { id: 5, name: "Vendor User", role: ROLES.VENDOR, email: "vendor@example.com" },
          { id: 6, name: "PMI User", role: ROLES.PMI, email: "pmi@gov.ab.ca" },
          { id: 7, name: "Contract Analyst", role: ROLES.ANALYST, email: "analyst@gov.ab.ca" },
          { id: 8, name: "Executive User", role: ROLES.EXECUTIVE, email: "executive@gov.ab.ca" }
        ]
        users.value = fallbackUsers
      } else {
        users.value = normalizedUsers
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch users:', error)
      
      // Use fallback users on API error
      const fallbackUsers: User[] = [
        { id: 1, name: "Sarah Johnson", role: ROLES.PM, email: "sarah.johnson@gov.ab.ca" },
        { id: 2, name: "Mike Chen", role: ROLES.SPM, email: "mike.chen@gov.ab.ca" },
        { id: 3, name: "Lisa Rodriguez", role: ROLES.DIRECTOR, email: "lisa.rodriguez@gov.ab.ca" },
        { id: 4, name: "Admin User", role: ROLES.ADMIN, email: "admin@gov.ab.ca" },
        { id: 5, name: "Vendor User", role: ROLES.VENDOR, email: "vendor@example.com" },
        { id: 6, name: "PMI User", role: ROLES.PMI, email: "pmi@gov.ab.ca" },
        { id: 7, name: "Contract Analyst", role: ROLES.ANALYST, email: "analyst@gov.ab.ca" },
        { id: 8, name: "Executive User", role: ROLES.EXECUTIVE, email: "executive@gov.ab.ca" }
      ]
      users.value = fallbackUsers
    } finally {
      loadingUsers.value = false
    }
  }

  const login = (user: User) => {
    const normalizedUser = {
      ...user,
      role: normalizeRole(user.role as string)
    }
    currentUser.value = normalizedUser
    isAuthenticated.value = true
  }

  const logout = () => {
    currentUser.value = { id: 0, name: '', role: ROLES.PM }
    isAuthenticated.value = false
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser')
    }
  }

  const getAccessibleProjects = (allProjects: any[]) => {
    if (!currentUser.value) return []

    // Since backend now handles role-based filtering properly with UUIDs,
    // we should trust the backend results and not filter again on the client.
    // This prevents hiding projects that the API legitimately returns.
    
    console.log(`getAccessibleProjects: User ${currentUser.value.name} (${currentUser.value.role}) accessing ${allProjects.length} projects`)
    
    return allProjects
  }

  // Permission checking methods
  const hasPermission = (feature: string): boolean => {
    return getRolesForFeature(feature).includes(currentUser.value.role)
  }

  const hasRole = (role: Role): boolean => {
    return currentUser.value.role === role
  }

  const hasAnyRole = (roles: Role[]): boolean => {
    return roles.includes(currentUser.value.role)
  }

  const hasRoleLevel = (requiredRole: Role): boolean => {
    return hasRoleOrHigher(currentUser.value.role, requiredRole)
  }

  return {
    // State
    currentUser,
    isAuthenticated,
    users,
    loadingUsers,
    
    // Getters
    isVendor,
    isStaff,
    isAdmin,
    isDirector,
    isPMI,
    isProjectManager,
    isLeadership,
    userRoleDisplay,
    canInitiateProjects,
    canAssignTeams,
    canFinalizeProjects,
    canManageUsers,
    
    // Actions
    setCurrentUser,
    setRole,
    fetchUsers,
    login,
    logout,
    getAccessibleProjects,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasRoleLevel,
    
    // Constants for template use
    ROLES,
    ROLE_DISPLAY_NAMES,
    ROLE_GROUPS
  }
})

