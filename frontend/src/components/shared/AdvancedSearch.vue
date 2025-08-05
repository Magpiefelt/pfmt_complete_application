<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Search class="h-5 w-5" />
        Advanced Search
      </CardTitle>
      <div class="text-sm text-gray-600">
        Search and filter projects with advanced criteria
      </div>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <!-- Search Term -->
      <div class="space-y-2">
        <Label for="search">Search Term</Label>
        <Input
          id="search"
          v-model="searchTerm"
          placeholder="Search projects, contractors, locations..."
          @input="handleSearch"
        />
      </div>
      
      <!-- Quick Filters -->
      <div class="space-y-2">
        <Label>Quick Filters</Label>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="filter in quickFilters"
            :key="filter.key"
            @click="toggleQuickFilter(filter.key)"
            :variant="activeFilters.includes(filter.key) ? 'default' : 'outline'"
            size="sm"
          >
            {{ filter.label }}
          </Button>
        </div>
      </div>
      
      <!-- Advanced Filters -->
      <div v-if="showAdvanced" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-2">
          <Label for="status">Status</Label>
          <Select v-model="filters.status" placeholder="Select status">
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>
        
        <div class="space-y-2">
          <Label for="phase">Phase</Label>
          <Select v-model="filters.phase" placeholder="Select phase">
            <option value="Planning">Planning</option>
            <option value="Design">Design</option>
            <option value="Construction">Construction</option>
            <option value="Completion">Completion</option>
          </Select>
        </div>
        
        <div class="space-y-2">
          <Label for="region">Region</Label>
          <Select v-model="filters.region" placeholder="Select region">
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="Central">Central</option>
          </Select>
        </div>
      </div>
      
      <!-- Active Filters Display -->
      <div v-if="activeFilterTags.length > 0" class="space-y-2">
        <Label>Active Filters</Label>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="tag in activeFilterTags"
            :key="tag.key"
            variant="secondary"
            class="cursor-pointer"
            @click="removeFilter(tag.key)"
          >
            {{ tag.label }}
            <X class="h-3 w-3 ml-1" />
          </Badge>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center justify-between pt-4 border-t">
        <Button
          @click="showAdvanced = !showAdvanced"
          variant="outline"
          size="sm"
        >
          <Filter class="h-4 w-4 mr-2" />
          {{ showAdvanced ? 'Hide' : 'Show' }} Advanced
        </Button>
        
        <div class="flex gap-2">
          <Button @click="clearAllFilters" variant="outline" size="sm">
            <RotateCcw class="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button @click="saveSearch" variant="outline" size="sm">
            <Save class="h-4 w-4 mr-2" />
            Save Search
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, Filter, X, Save, RotateCcw } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Select from '@/components/ui/Select.vue'

interface Props {
  data?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  data: () => []
})

const emit = defineEmits<{
  filteredResults: [results: any[]]
  searchChange: [term: string]
  filtersChange: [filters: Record<string, any>]
}>()

// State
const searchTerm = ref('')
const showAdvanced = ref(false)
const filters = ref<Record<string, any>>({
  status: '',
  phase: '',
  region: ''
})
const activeFilters = ref<string[]>([])

// Quick filters configuration
const quickFilters = [
  { key: 'active', label: 'Active Projects' },
  { key: 'completed', label: 'Completed' },
  { key: 'at-risk', label: 'At Risk' },
  { key: 'my-projects', label: 'My Projects' }
]

// Computed
const activeFilterTags = computed(() => {
  const tags = []
  
  // Add search term as tag
  if (searchTerm.value) {
    tags.push({ key: 'search', label: `Search: ${searchTerm.value}` })
  }
  
  // Add filter tags
  Object.entries(filters.value).forEach(([key, value]) => {
    if (value) {
      tags.push({ key, label: `${key}: ${value}` })
    }
  })
  
  // Add quick filter tags
  activeFilters.value.forEach(filterKey => {
    const filter = quickFilters.find(f => f.key === filterKey)
    if (filter) {
      tags.push({ key: filterKey, label: filter.label })
    }
  })
  
  return tags
})

// Methods
const handleSearch = () => {
  emit('searchChange', searchTerm.value)
  performSearch()
}

const toggleQuickFilter = (filterKey: string) => {
  const index = activeFilters.value.indexOf(filterKey)
  if (index > -1) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(filterKey)
  }
  performSearch()
}

const removeFilter = (key: string) => {
  if (key === 'search') {
    searchTerm.value = ''
  } else if (quickFilters.some(f => f.key === key)) {
    toggleQuickFilter(key)
  } else {
    filters.value[key] = ''
  }
  performSearch()
}

const clearAllFilters = () => {
  searchTerm.value = ''
  activeFilters.value = []
  filters.value = {
    status: '',
    phase: '',
    region: ''
  }
  performSearch()
}

const saveSearch = () => {
}

const performSearch = () => {
  let results = [...props.data]
  
  // Apply search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    results = results.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(term)
      )
    )
  }
  
  // Apply filters
  Object.entries(filters.value).forEach(([key, value]) => {
    if (value) {
      results = results.filter(item => item[key] === value)
    }
  })
  
  // Apply quick filters
  activeFilters.value.forEach(filterKey => {
    switch (filterKey) {
      case 'active':
        results = results.filter(item => item.status === 'Active')
        break
      case 'completed':
        results = results.filter(item => item.status === 'Completed')
        break
      case 'at-risk':
        results = results.filter(item => item.scheduleStatus === 'At Risk' || item.budgetStatus === 'At Risk')
        break
      case 'my-projects':
        break
    }
  })
  
  emit('filteredResults', results)
  emit('filtersChange', { ...filters.value, activeFilters: activeFilters.value })
}

// Watch for filter changes
watch(filters, performSearch, { deep: true })
</script>

