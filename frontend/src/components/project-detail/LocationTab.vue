<template>
  <div class="space-y-6">
    <!-- Location Information -->
    <Card>
      <CardHeader>
        <CardTitle>Project Location</CardTitle>
        <CardDescription>
          Specify the physical location and address details for this project.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Address Information -->
        <div class="space-y-4">
          <div>
            <Label for="address">Street Address</Label>
            <Input
              id="address"
              v-model="formData.address"
              :disabled="!canEdit"
              placeholder="Enter street address"
              class="mt-1"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="municipality">Municipality/City</Label>
              <Input
                id="municipality"
                v-model="formData.municipality"
                :disabled="!canEdit"
                placeholder="Enter municipality or city"
                class="mt-1"
              />
            </div>

            <div>
              <Label for="constituency">Constituency</Label>
              <Select v-model="formData.constituency" :disabled="!canEdit">
                <SelectTrigger class="mt-1">
                  <SelectValue placeholder="Select constituency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calgary-centre">Calgary Centre</SelectItem>
                  <SelectItem value="calgary-north">Calgary North</SelectItem>
                  <SelectItem value="calgary-south">Calgary South</SelectItem>
                  <SelectItem value="edmonton-centre">Edmonton Centre</SelectItem>
                  <SelectItem value="edmonton-north">Edmonton North</SelectItem>
                  <SelectItem value="edmonton-south">Edmonton South</SelectItem>
                  <SelectItem value="red-deer">Red Deer</SelectItem>
                  <SelectItem value="lethbridge">Lethbridge</SelectItem>
                  <SelectItem value="medicine-hat">Medicine Hat</SelectItem>
                  <SelectItem value="grande-prairie">Grande Prairie</SelectItem>
                  <SelectItem value="fort-mcmurray">Fort McMurray</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="province">Province</Label>
              <Input
                id="province"
                v-model="formData.province"
                :disabled="!canEdit"
                value="Alberta"
                readonly
                class="mt-1 bg-gray-50"
              />
            </div>

            <div>
              <Label for="postal-code">Postal Code</Label>
              <Input
                id="postal-code"
                v-model="formData.postal_code"
                :disabled="!canEdit"
                placeholder="T0A 0A0"
                class="mt-1"
                @input="formatPostalCode"
              />
            </div>
          </div>
        </div>

        <!-- Building Information -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-900">Building Information</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="building-name">Building Name</Label>
              <Input
                id="building-name"
                v-model="formData.building_name"
                :disabled="!canEdit"
                placeholder="Enter building name"
                class="mt-1"
              />
            </div>

            <div>
              <Label for="building-type">Building Type</Label>
              <Select v-model="formData.building_type" :disabled="!canEdit">
                <SelectTrigger class="mt-1">
                  <SelectValue placeholder="Select building type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office Building</SelectItem>
                  <SelectItem value="hospital">Hospital/Healthcare</SelectItem>
                  <SelectItem value="school">School/Educational</SelectItem>
                  <SelectItem value="courthouse">Courthouse/Justice</SelectItem>
                  <SelectItem value="warehouse">Warehouse/Storage</SelectItem>
                  <SelectItem value="laboratory">Laboratory/Research</SelectItem>
                  <SelectItem value="mixed-use">Mixed Use</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label for="floors">Number of Floors</Label>
              <Input
                id="floors"
                v-model="formData.floors"
                :disabled="!canEdit"
                type="number"
                min="1"
                placeholder="1"
                class="mt-1"
              />
            </div>

            <div>
              <Label for="square-footage">Square Footage</Label>
              <Input
                id="square-footage"
                v-model="formData.square_footage"
                :disabled="!canEdit"
                type="number"
                placeholder="10000"
                class="mt-1"
              />
            </div>

            <div>
              <Label for="parking-spaces">Parking Spaces</Label>
              <Input
                id="parking-spaces"
                v-model="formData.parking_spaces"
                :disabled="!canEdit"
                type="number"
                min="0"
                placeholder="50"
                class="mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Coordinates -->
    <Card>
      <CardHeader>
        <CardTitle>Geographic Coordinates</CardTitle>
        <CardDescription>
          Precise location coordinates for mapping and GIS purposes.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label for="latitude">Latitude</Label>
            <Input
              id="latitude"
              v-model="formData.latitude"
              :disabled="!canEdit"
              type="number"
              step="any"
              placeholder="53.5461"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="longitude">Longitude</Label>
            <Input
              id="longitude"
              v-model="formData.longitude"
              :disabled="!canEdit"
              type="number"
              step="any"
              placeholder="-113.4938"
              class="mt-1"
            />
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <Button 
            v-if="canEdit" 
            variant="outline" 
            size="sm" 
            @click="getCurrentLocation"
            :disabled="gettingLocation"
          >
            <MapPin class="h-4 w-4 mr-2" />
            {{ gettingLocation ? 'Getting Location...' : 'Use Current Location' }}
          </Button>
          
          <Button 
            v-if="hasCoordinates" 
            variant="outline" 
            size="sm" 
            @click="openInMaps"
          >
            <ExternalLink class="h-4 w-4 mr-2" />
            View on Maps
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Map Preview -->
    <Card v-if="hasCoordinates">
      <CardHeader>
        <CardTitle>Location Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <MapPin class="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-500">Map preview would appear here</p>
            <p class="text-xs text-gray-400">
              {{ formData.latitude }}, {{ formData.longitude }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Site Details -->
    <Card>
      <CardHeader>
        <CardTitle>Site Information</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <Label for="site-description">Site Description</Label>
          <Textarea
            id="site-description"
            v-model="formData.site_description"
            :disabled="!canEdit"
            placeholder="Describe the site conditions, surroundings, and any relevant details..."
            rows="3"
            class="mt-1"
          />
        </div>

        <div>
          <Label for="access-notes">Access & Transportation</Label>
          <Textarea
            id="access-notes"
            v-model="formData.access_notes"
            :disabled="!canEdit"
            placeholder="Describe site access, transportation links, and logistics..."
            rows="3"
            class="mt-1"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label for="zoning">Zoning Classification</Label>
            <Input
              id="zoning"
              v-model="formData.zoning"
              :disabled="!canEdit"
              placeholder="e.g., C-1, R-2, I-1"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="land-use">Land Use Designation</Label>
            <Select v-model="formData.land_use" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select land use" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="institutional">Institutional</SelectItem>
                <SelectItem value="mixed">Mixed Use</SelectItem>
                <SelectItem value="agricultural">Agricultural</SelectItem>
                <SelectItem value="recreational">Recreational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Action Buttons -->
    <div v-if="canEdit" class="flex items-center justify-end space-x-2">
      <Button variant="outline" @click="resetForm">
        Reset Changes
      </Button>
      <Button @click="saveChanges" :disabled="!hasChanges">
        <Save class="h-4 w-4 mr-2" />
        Save Location
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Save, MapPin, ExternalLink } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFormat } from '@/composables/useFormat'

interface LocationData {
  address?: string
  municipality?: string
  constituency?: string
  province?: string
  postal_code?: string
  building_name?: string
  building_type?: string
  floors?: number
  square_footage?: number
  parking_spaces?: number
  latitude?: number
  longitude?: number
  site_description?: string
  access_notes?: string
  zoning?: string
  land_use?: string
  [key: string]: any
}

interface Props {
  project: LocationData
  viewMode: 'draft' | 'approved'
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:project': [project: LocationData]
  'save-changes': [changes: Partial<LocationData>]
}>()

const { formatPostalCode: formatPostalCodeUtil } = useFormat()

// Form data
const formData = ref<LocationData>({ ...props.project })
const originalData = ref<LocationData>({ ...props.project })
const gettingLocation = ref(false)

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

const hasCoordinates = computed(() => {
  return formData.value.latitude && formData.value.longitude
})

// Methods
const resetForm = () => {
  formData.value = { ...originalData.value }
}

const saveChanges = () => {
  const changes: Partial<LocationData> = {}
  
  // Only include changed fields
  Object.keys(formData.value).forEach(key => {
    if (formData.value[key] !== originalData.value[key]) {
      changes[key] = formData.value[key]
    }
  })

  emit('save-changes', changes)
  originalData.value = { ...formData.value }
}

const formatPostalCode = (event: Event) => {
  const target = event.target as HTMLInputElement
  const formatted = formatPostalCodeUtil(target.value)
  formData.value.postal_code = formatted
  target.value = formatted
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser.')
    return
  }

  gettingLocation.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      formData.value.latitude = position.coords.latitude
      formData.value.longitude = position.coords.longitude
      gettingLocation.value = false
    },
    (error) => {
      console.error('Error getting location:', error)
      alert('Unable to get current location. Please enter coordinates manually.')
      gettingLocation.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

const openInMaps = () => {
  if (hasCoordinates.value) {
    const url = `https://www.google.com/maps?q=${formData.value.latitude},${formData.value.longitude}`
    window.open(url, '_blank')
  }
}

// Watch for external project changes
watch(() => props.project, (newProject) => {
  formData.value = { ...newProject }
  originalData.value = { ...newProject }
}, { deep: true })

// Watch for form changes and emit updates
watch(formData, (newData) => {
  emit('update:project', { ...newData })
}, { deep: true })

onMounted(() => {
  formData.value = { ...props.project }
  originalData.value = { ...props.project }
})
</script>

