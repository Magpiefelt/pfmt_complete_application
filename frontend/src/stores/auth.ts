import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { UserAPI } from '@/services/apiService'
import { useProjectStore } from './project'

export interface User {
  id: number
  name: string
  role: string
  email?: string
}

export const useAuthStore = defineStore('auth', () => {
  // Initialize user from localStorage if available
  const initializeUser = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser')
      if (storedUser) {
        try {
          return JSON.parse(storedUser)
        } catch (e) {
          console.warn('Failed to parse stored user data')
        }
      }
    }
    
    // Default user
    return {
      id: 1,
      name: "Sarah Johnson",
      role: "Project Manager"
    }
  }

  // State
  const currentUser = ref<User>(initializeUser())
  const isAuthenticated = ref(true)
  const users = ref<User[]>([])
  const loadingUsers = ref(false)

  // Getters
  const isVendor = computed(() => currentUser.value.role === 'Vendor')
  const isStaff = computed(() => !isVendor.value)

  // Actions
  const setCurrentUser = (user: User) => {
    currentUser.value = user
    
    // Persist user to localStorage for API service
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user))
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
    
    const roleMap: Record<string, { role: string; defaultId: number }> = {
      vendor: { role: "Vendor", defaultId: 5 },
      pm: { role: "Project Manager", defaultId: 1 },
      spm: { role: "Senior Project Manager", defaultId: 2 },
      director: { role: "Director", defaultId: 3 },
      admin: { role: "Director", defaultId: 4 }
    }
    
    const targetRole = roleMap[role]?.role
    const defaultId = roleMap[role]?.defaultId
    
    
    // Find user with matching role or use default
    let user = users.value.find(u => u.role === targetRole)
    if (!user && defaultId) {
      user = users.value.find(u => u.id === defaultId)
    }
    
    // Fallback to creating a user if not found
    if (!user) {
      user = {
        id: defaultId || Date.now(),
        name: `${targetRole} User`,
        role: targetRole || 'Project Manager'
      }
    }
    
    setCurrentUser(user)
  }

  const fetchUsers = async () => {
    loadingUsers.value = true
    try {
      const response = await UserAPI.getUsers()
      const fetchedUsers = response.data || []
      
      // Ensure we have default users if API returns empty
      if (fetchedUsers.length === 0) {
        const fallbackUsers: User[] = [
          { id: 1, name: "Sarah Johnson", role: "Project Manager" },
          { id: 2, name: "Mike Chen", role: "Senior Project Manager" },
          { id: 3, name: "Lisa Rodriguez", role: "Director" },
          { id: 4, name: "Admin User", role: "Director" },
          { id: 5, name: "Vendor User", role: "Vendor" }
        ]
        users.value = fallbackUsers
      } else {
        users.value = fetchedUsers
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch users:', error)
      
      // Use fallback users on API error
      const fallbackUsers: User[] = [
        { id: 1, name: "Sarah Johnson", role: "Project Manager" },
        { id: 2, name: "Mike Chen", role: "Senior Project Manager" },
        { id: 3, name: "Lisa Rodriguez", role: "Director" },
        { id: 4, name: "Admin User", role: "Director" },
        { id: 5, name: "Vendor User", role: "Vendor" }
      ]
      users.value = fallbackUsers
    } finally {
      loadingUsers.value = false
    }
  }

  const login = (user: User) => {
    currentUser.value = user
    isAuthenticated.value = true
  }

  const logout = () => {
    currentUser.value = { id: 0, name: '', role: '' }
    isAuthenticated.value = false
  }

  const getAccessibleProjects = (allProjects: any[]) => {
    if (!currentUser.value) return []

    // Since backend now handles role-based filtering properly with UUIDs,
    // we should trust the backend results and not filter again on the client.
    // This prevents hiding projects that the API legitimately returns.
    
    // However, we can still provide this method for any edge cases
    // where additional client-side validation might be needed.
    
    console.log(`getAccessibleProjects: User ${currentUser.value.name} (${currentUser.value.role}) accessing ${allProjects.length} projects`)
    
    return allProjects
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
    
    // Actions
    setCurrentUser,
    setRole,
    fetchUsers,
    login,
    logout,
    getAccessibleProjects
  }
})

