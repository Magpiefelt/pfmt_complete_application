import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export const useAuth = () => {
  const authStore = useAuthStore()

  const currentUser = computed(() => authStore.currentUser)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isVendor = computed(() => authStore.isVendor)
  const isStaff = computed(() => authStore.isStaff)

  const changeRole = async (newRole: string) => {
    try {
      await authStore.setRole(newRole)
    } catch (error) {
      console.error('❌ Role change failed:', error)
      throw error
    }
  }

  const login = (user: any) => {
    authStore.login(user)
  }

  const logout = () => {
    authStore.logout()
  }

  return {
    currentUser,
    isAuthenticated,
    isVendor,
    isStaff,
    changeRole,
    login,
    logout
  }
}

