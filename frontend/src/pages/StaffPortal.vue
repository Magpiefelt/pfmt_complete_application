<template>
  <HomePage v-if="currentUser.role !== 'Vendor'" />
  <div v-else>
    <!-- Redirect to vendor portal if user is vendor -->
    {{ redirectToVendor() }}
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import HomePage from './HomePage.vue'

const router = useRouter()
const { currentUser } = useAuth()

const redirectToVendor = () => {
  router.replace('/vendor')
}
</script>

