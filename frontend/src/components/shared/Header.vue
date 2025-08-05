<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-3">
          <img 
            src="/src/assets/alberta-logo.png" 
            alt="Alberta Government" 
            class="h-8 w-auto"
          />
          <h1 class="text-xl font-semibold text-gray-900">PFMT Enhanced</h1>
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="text-sm text-gray-600">
            {{ currentUser.name }} ({{ currentUser.role }})
          </div>
          
          <select 
            :value="currentUser.role"
            @change="handleRoleChange"
            class="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="Project Manager">Project Manager</option>
            <option value="Senior Project Manager">Senior Project Manager</option>
            <option value="Director">Director</option>
            <option value="Vendor">Vendor</option>
          </select>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits<{
  roleChange: [role: string]
}>()

const { currentUser } = useAuth()

const handleRoleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const roleMap: Record<string, string> = {
    'Project Manager': 'pm',
    'Senior Project Manager': 'spm',
    'Director': 'director',
    'Vendor': 'vendor'
  }
  
  const roleKey = roleMap[target.value] || 'pm'
  emit('roleChange', roleKey)
}
</script>

