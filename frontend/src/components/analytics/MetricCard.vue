<template>
  <Card>
    <CardContent class="p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">{{ title }}</p>
          <p class="text-2xl font-bold text-gray-900">{{ value }}</p>
          <div v-if="change !== undefined" class="flex items-center mt-1">
            <component 
              :is="changeIcon" 
              :class="changeColorClass"
              class="h-4 w-4 mr-1"
            />
            <span :class="changeColorClass" class="text-sm font-medium">
              {{ Math.abs(change) }}{{ changeType }}
            </span>
            <span class="text-sm text-gray-500 ml-1">vs last period</span>
          </div>
        </div>
        <div :class="iconColorClass" class="p-3 rounded-full">
          <component :is="iconComponent" class="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, DollarSign, Building, CheckCircle, AlertTriangle } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui'

interface Props {
  title: string
  value: string | number
  change?: number
  changeType?: '%' | ''
  icon?: string
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow'
}

const props = withDefaults(defineProps<Props>(), {
  changeType: '%',
  icon: 'Building',
  color: 'blue'
})

// Icon mapping
const iconMap = {
  Building,
  CheckCircle,
  DollarSign,
  AlertTriangle
}

const iconComponent = computed(() => iconMap[props.icon as keyof typeof iconMap] || Building)

const changeIcon = computed(() => {
  if (props.change === undefined) return null
  return props.change >= 0 ? TrendingUp : TrendingDown
})

const changeColorClass = computed(() => {
  if (props.change === undefined) return ''
  return props.change >= 0 ? 'text-green-600' : 'text-red-600'
})

const iconColorClass = computed(() => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  }
  return colorMap[props.color]
})
</script>

