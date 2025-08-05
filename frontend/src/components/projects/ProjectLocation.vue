<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <MapPin class="h-5 w-5" />
        Project Location
      </CardTitle>
      <CardContent class="text-sm text-gray-600">
        Geographic and address information
      </CardContent>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="field in locationFields" :key="field.key" 
             :class="field.fullWidth ? 'md:col-span-2' : ''">
          <label :for="field.key" class="text-sm font-medium text-gray-700">
            {{ field.label }}
          </label>
          <input
            :id="field.key"
            :type="field.type"
            :step="field.step"
            v-model="formData[field.key]"
            :disabled="!isEditing"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            :placeholder="isEditing ? `Enter ${field.label.toLowerCase()}` : 'No data available'"
          />
        </div>
      </div>

      <!-- Map Preview (if coordinates available) -->
      <div v-if="formData.latitude && formData.longitude" class="mt-6">
        <label class="text-sm font-medium text-gray-700">Location Preview</label>
        <div class="mt-2 bg-gray-100 rounded-lg p-4 text-center">
          <MapPin class="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p class="text-sm text-gray-600">
            Coordinates: {{ formData.latitude }}, {{ formData.longitude }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Map integration would display here in production
          </p>
        </div>
      </div>

      <!-- Address Summary -->
      <div v-if="hasAddressInfo" class="mt-6">
        <label class="text-sm font-medium text-gray-700">Address Summary</label>
        <div class="mt-2 bg-blue-50 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <Building class="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p class="font-medium text-blue-900">{{ formData.buildingName || 'Building Name Not Set' }}</p>
              <p class="text-sm text-blue-700">{{ formData.projectAddress || 'Address Not Set' }}</p>
              <p class="text-sm text-blue-700">{{ formData.municipality || 'Municipality Not Set' }}, Alberta</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span v-if="formData.constituency" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Constituency: {{ formData.constituency }}
                </span>
                <span v-if="formData.buildingType" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Type: {{ formData.buildingType }}
                </span>
                <span v-if="formData.primaryOwner" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Owner: {{ formData.primaryOwner }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legal Description -->
      <div v-if="hasLegalInfo" class="mt-6">
        <label class="text-sm font-medium text-gray-700">Legal Description</label>
        <div class="mt-2 bg-gray-50 rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div v-if="formData.plan">
              <span class="font-medium text-gray-700">Plan:</span>
              <span class="ml-2 text-gray-900">{{ formData.plan }}</span>
            </div>
            <div v-if="formData.block">
              <span class="font-medium text-gray-700">Block:</span>
              <span class="ml-2 text-gray-900">{{ formData.block }}</span>
            </div>
            <div v-if="formData.lot">
              <span class="font-medium text-gray-700">Lot:</span>
              <span class="ml-2 text-gray-900">{{ formData.lot }}</span>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MapPin, Building } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

interface Props {
  project: any
  isEditing: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [data: any]
}>()

const formData = ref<any>({})

const locationFields = [
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'municipality', label: 'Municipality', type: 'text' },
  { key: 'projectAddress', label: 'Project Address', type: 'text', fullWidth: true },
  { key: 'constituency', label: 'Constituency', type: 'text' },
  { key: 'buildingName', label: 'Building Name', type: 'text' },
  { key: 'buildingType', label: 'Building Type', type: 'text' },
  { key: 'buildingId', label: 'Building ID', type: 'text' },
  { key: 'primaryOwner', label: 'Primary Owner', type: 'text' },
  { key: 'plan', label: 'Plan', type: 'text' },
  { key: 'block', label: 'Block', type: 'text' },
  { key: 'lot', label: 'Lot', type: 'text' },
  { key: 'latitude', label: 'Latitude', type: 'number', step: 'any' },
  { key: 'longitude', label: 'Longitude', type: 'number', step: 'any' }
]

const hasAddressInfo = computed(() => {
  return formData.value.buildingName || formData.value.projectAddress || formData.value.municipality
})

const hasLegalInfo = computed(() => {
  return formData.value.plan || formData.value.block || formData.value.lot
})

// Initialize form data when project changes
watch(() => props.project, (newProject) => {
  if (newProject) {
    formData.value = {
      location: newProject.location || '',
      municipality: newProject.municipality || '',
      projectAddress: newProject.projectAddress || '',
      constituency: newProject.constituency || '',
      buildingName: newProject.buildingName || '',
      buildingType: newProject.buildingType || '',
      buildingId: newProject.buildingId || '',
      primaryOwner: newProject.primaryOwner || '',
      plan: newProject.plan || '',
      block: newProject.block || '',
      lot: newProject.lot || '',
      latitude: newProject.latitude || '',
      longitude: newProject.longitude || ''
    }
  }
}, { immediate: true })

// Watch form data changes and emit updates
watch(formData, (newData) => {
  emit('update', newData)
}, { deep: true })
</script>

