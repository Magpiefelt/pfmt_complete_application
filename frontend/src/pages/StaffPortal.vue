<template>
  <HomePage v-if="currentUser.role !== 'Vendor'" />
  <div v-else>
    <!-- Vendor users will be redirected automatically -->
    <p>Redirecting to vendor portal...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import HomePage from './HomePage.vue'

const router = useRouter()
const { currentUser } = useAuth()

// Redirect vendor users when component mounts or user changes
const checkAndRedirectVendor = () => {
  if (currentUser.value?.role === 'Vendor') {
    router.replace('/vendor')
  }
}

onMounted(() => {
  checkAndRedirectVendor()
})

// Watch for user changes
watch(currentUser, () => {
  checkAndRedirectVendor()
}, { immediate: true })
</script>

