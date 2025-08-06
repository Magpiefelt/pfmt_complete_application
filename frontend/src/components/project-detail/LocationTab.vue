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

    <!-- Geographical Classification -->
    <Card>
      <CardHeader>
        <CardTitle>Geographical Classification</CardTitle>
        <CardDescription>
          Geographic and administrative classification details.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="urban-rural">Urban/Rural Classification</Label>
            <Select v-model="formData.urban_rural" :disabled="!canEdit">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urban">Urban</SelectItem>
                <SelectItem value="rural">Rural</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="mla">Member of Legislative Assembly (MLA)</Label>
            <Input
              id="mla"
              v-model="formData.mla"
              :disabled="!canEdit"
              placeholder="Enter MLA name or constituency"
              class="mt-1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="location">Location Description</Label>
            <Input
              id="location"
              v-model="formData.location"
              :disabled="!canEdit"
              placeholder="General location description"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="project-address">Project Address</Label>
            <Textarea
              id="project-address"
              v-model="formData.project_address"
              :disabled="!canEdit"
              placeholder="Detailed project address (if different from street address)"
              rows="2"
              class="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Legal Land Description -->
    <Card>
      <CardHeader>
        <CardTitle>Legal Land Description</CardTitle>
        <CardDescription>
          Legal land description and ownership information.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label for="plan">Plan</Label>
            <Input
              id="plan"
              v-model="formData.plan"
              :disabled="!canEdit"
              placeholder="Enter plan number"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="block">Block</Label>
            <Input
              id="block"
              v-model="formData.block"
              :disabled="!canEdit"
              placeholder="Enter block number"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="lot">Lot</Label>
            <Input
              id="lot"
              v-model="formData.lot"
              :disabled="!canEdit"
              placeholder="Enter lot number"
              class="mt-1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="building-id">Building ID</Label>
            <Input
              id="building-id"
              v-model="formData.building_id"
              :disabled="!canEdit"
              placeholder="Enter building identifier"
              class="mt-1"
            />
          </div>

          <div>
            <Label for="building-owner">Building Owner</Label>
            <Input
              id="building-owner"
              v-model="formData.building_owner"
              :disabled="!canEdit"
              placeholder="Enter building owner name"
              class="mt-1"
            />
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

        <!-- Map Preview -->
        <div v-if="hasValidCoordinates" class="mt-4">
          <Label>Location Preview</Label>
          <div class="mt-2 h-64 bg-gray-100 rounded-lg flex items-center justify-center border">
            <div class="text-center text-gray-500">
              <MapPin class="h-8 w-8 mx-auto mb-2" />
              <p class="text-sm">Map preview would appear here</p>
              <p class="text-xs">Lat: {{ formData.latitude }}, Lng: {{ formData.longitude }}</p>
            </div>
          </div>
        </div>

        <!-- Coordinate Actions -->
        <div class="flex items-center space-x-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            @click="getCurrentLocation"
            :disabled="!canEdit || gettingLocation"
          >
            <MapPin class="h-4 w-4 mr-2" />
            {{ gettingLocation ? 'Getting Location...' : 'Use Current Location' }}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            @click="clearCoordinates"
            :disabled="!canEdit || !hasValidCoordinates"
          >
            <X class="h-4 w-4 mr-2" />
            Clear Coordinates
          </Button>
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
        Save Changes
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Save, MapPin, X } from 'lucide-vue-next'
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

interface ProjectLocation {
  id?: string
  project_id?: string
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
  
  // New fields
  location?: string
  urban_rural?: string
  project_address?: string
  mla?: string
  plan?: string
  block?: string
  lot?: string
  building_id?: string
  building_owner?: string
  
  [key: string]: any
}

interface Props {
  location: ProjectLocation
  viewMode: 'draft' | 'approved'
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:location': [location: ProjectLocation]
  'save-changes': [changes: Partial<ProjectLocation>]
}>()

// Form data
const formData = ref<ProjectLocation>({ ...props.location })
const originalData = ref<ProjectLocation>({ ...props.location })
const gettingLocation = ref(false)

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

const hasValidCoordinates = computed(() => {
  return formData.value.latitude && formData.value.longitude &&
         !isNaN(Number(formData.value.latitude)) && !isNaN(Number(formData.value.longitude))
})

// Methods
const resetForm = () => {
  formData.value = { ...originalData.value }
}

const saveChanges = () => {
  const changes: Partial<ProjectLocation> = {}
  
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
  let value = target.value.replace(/\s/g, '').toUpperCase()
  
  if (value.length > 3) {
    value = value.slice(0, 3) + ' ' + value.slice(3, 6)
  }
  
  formData.value.postal_code = value
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser.')
    return
  }

  gettingLocation.value = true
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      formData.value.latitude = Number(position.coords.latitude.toFixed(8))
      formData.value.longitude = Number(position.coords.longitude.toFixed(8))
      gettingLocation.value = false
    },
    (error) => {
      console.error('Error getting location:', error)
      alert('Unable to get current location. Please check your browser permissions.')
      gettingLocation.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

const clearCoordinates = () => {
  formData.value.latitude = undefined
  formData.value.longitude = undefined
}

// Watch for external location changes
watch(() => props.location, (newLocation) => {
  formData.value = { ...newLocation }
  originalData.value = { ...newLocation }
}, { deep: true })

// Watch for form changes and emit updates
watch(formData, (newData) => {
  emit('update:location', { ...newData })
}, { deep: true })

onMounted(() => {
  formData.value = { ...props.location }
  originalData.value = { ...props.location }
})
</script>

