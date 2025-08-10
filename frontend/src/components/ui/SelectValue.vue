<template>
  <span class="pointer-events-none">
    <slot v-if="$slots.default" />
    <span v-else-if="value">{{ value }}</span>
    <span v-else class="text-gray-500">{{ placeholder }}</span>
  </span>
</template>

<script setup lang="ts">
interface Props {
  value?: string
  placeholder?: string
}

defineProps<Props>()
</script>

