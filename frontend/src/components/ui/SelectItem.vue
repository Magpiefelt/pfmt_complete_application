<template>
  <div
    class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    :class="$attrs.class"
    @click="handleClick"
  >
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <svg
        v-if="selected"
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
    </span>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  value: string
  selected?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [value: string]
}>()

const handleClick = () => {
  emit('select', props.value)
}
</script>

