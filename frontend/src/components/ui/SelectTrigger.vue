<template>
  <button
    type="button"
    class="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    :class="$attrs.class"
    @click="$emit('click')"
  >
    <slot />
    <svg
      class="h-4 w-4 opacity-50"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6"></path>
    </svg>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  click: []
}>()
</script>

