<template>
  <Layout>
    <Header @role-change="handleRoleChange" />
    <main>
      <RouterView />
    </main>
    
    <!-- PFMT Data Extractor Dialog -->
    <PFMTDataExtractor
      v-if="showPFMTExtractor && selectedProjectForPFMT"
      :project="selectedProjectForPFMT"
      @data-extracted="handlePFMTDataExtracted"
      @close="closePFMTExtractor"
    />

    <!-- Toast Notifications -->
    <Toast />
  </Layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { usePFMTExtractor } from '@/composables/usePFMTExtractor'
import Layout from '@/components/shared/Layout.vue'
import Header from '@/components/shared/Header.vue'
import PFMTDataExtractor from '@/components/PFMTDataExtractor.vue'
import Toast from "@/components/ui/toast.vue"

const router = useRouter()
const { currentUser, changeRole } = useAuth()
const { 
  showPFMTExtractor, 
  selectedProjectForPFMT, 
  closePFMTExtractor, 
  handlePFMTDataExtracted 
} = usePFMTExtractor()

const handleRoleChange = async (newRole: string) => {
  await changeRole(newRole)
  
  // Navigate based on role
  if (newRole === 'vendor') {
    router.push('/vendor')
  } else {
    router.push('/staff')
  }
}
</script>

