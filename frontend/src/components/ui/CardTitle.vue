<template>
  <div
    :class="cn('leading-none font-semibold', $attrs.class)"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'
</script>

