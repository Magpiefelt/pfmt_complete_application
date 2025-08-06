<template>
  <div>
    <!-- Dialog Overlay -->
    <div 
      v-if="open"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      @click="$emit('update:open', false)"
    ></div>
    
    <!-- Dialog Content -->
    <div 
      v-if="open"
      class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 rounded-lg"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  open: boolean
}

defineProps<Props>()

defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

