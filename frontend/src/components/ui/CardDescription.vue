<template>
  <p class="text-sm text-muted-foreground" :class="$attrs.class">
    <slot />
  </p>
</template>

<script setup lang="ts">
// Simple card description component
defineOptions({
  inheritAttrs: false
})
</script>

