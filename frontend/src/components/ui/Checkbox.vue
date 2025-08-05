<template>
  <input
    type="checkbox"
    :checked="modelValue"
    @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    :class="cn(
      'h-4 w-4 rounded border-gray-300 text-blue-600 shadow-sm',
      'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      $attrs.class
    )"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  modelValue?: boolean
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

