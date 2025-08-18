<template>
  <div @click="$emit('click')">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'click': []
}>()
</script>

