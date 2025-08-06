<template>
  <div
    class="flex flex-col items-center justify-center text-center"
    :class="[
      containerClasses,
      bordered ? 'border-2 border-dashed border-gray-300 rounded-lg' : ''
    ]"
  >
    <!-- Icon -->
    <div class="mb-4">
      <slot name="icon">
        <component
          :is="iconComponent"
          :class="iconClasses"
        />
      </slot>
    </div>

    <!-- Content -->
    <div class="max-w-md">
      <!-- Title -->
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        <slot name="title">
          {{ title }}
        </slot>
      </h3>

      <!-- Description -->
      <p class="text-gray-500 mb-6">
        <slot name="description">
          {{ description }}
        </slot>
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
        <slot name="actions">
          <Button
            v-if="primaryAction"
            :variant="primaryAction.variant || 'default'"
            @click="primaryAction.action"
          >
            <component
              v-if="primaryAction.icon"
              :is="primaryAction.icon"
              class="h-4 w-4 mr-2"
            />
            {{ primaryAction.text }}
          </Button>
          
          <Button
            v-if="secondaryAction"
            variant="outline"
            @click="secondaryAction.action"
          >
            <component
              v-if="secondaryAction.icon"
              :is="secondaryAction.icon"
              class="h-4 w-4 mr-2"
            />
            {{ secondaryAction.text }}
          </Button>
        </slot>
      </div>

      <!-- Additional Content -->
      <div v-if="$slots.additional" class="mt-6">
        <slot name="additional" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  FileX, 
  Search, 
  Plus, 
  Folder, 
  Users, 
  Calendar,
  BarChart3,
  Settings,
  AlertCircle,
  Wifi,
  Database
} from 'lucide-vue-next'
import { Button } from "@/components/ui"

export interface EmptyStateAction {
  text: string
  action: () => void
  icon?: any
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

interface Props {
  title: string
  description: string
  icon?: string | any
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'search' | 'error' | 'offline' | 'maintenance'
  bordered?: boolean
  primaryAction?: EmptyStateAction
  secondaryAction?: EmptyStateAction
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  size: 'md',
  variant: 'default',
  bordered: false,
  primaryAction: undefined,
  secondaryAction: undefined
})

// Computed properties
const containerClasses = computed(() => {
  const sizeMap = {
    sm: 'p-6',
    md: 'p-8',
    lg: 'p-12'
  }
  return sizeMap[props.size]
})

const iconClasses = computed(() => {
  const sizeMap = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  }

  const variantMap = {
    default: 'text-gray-400',
    search: 'text-blue-400',
    error: 'text-red-400',
    offline: 'text-yellow-400',
    maintenance: 'text-orange-400'
  }

  return `${sizeMap[props.size]} ${variantMap[props.variant]}`
})

const iconComponent = computed(() => {
  // If a custom icon is provided, use it
  if (props.icon) {
    return typeof props.icon === 'string' ? getIconByName(props.icon) : props.icon
  }

  // Otherwise, use variant-based default icons
  const variantIcons = {
    default: FileX,
    search: Search,
    error: AlertCircle,
    offline: Wifi,
    maintenance: Settings
  }

  return variantIcons[props.variant] || FileX
})

// Helper function to get icon by name
const getIconByName = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'file-x': FileX,
    'search': Search,
    'plus': Plus,
    'folder': Folder,
    'users': Users,
    'calendar': Calendar,
    'bar-chart': BarChart3,
    'settings': Settings,
    'alert-circle': AlertCircle,
    'wifi': Wifi,
    'database': Database
  }

  return iconMap[iconName] || FileX
}
</script>

