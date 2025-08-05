<template>
  <div class="flex items-center space-x-1">
    <button
      v-for="star in 5"
      :key="star"
      @click="setRating(star)"
      @mouseover="hoverRating = star"
      @mouseleave="hoverRating = 0"
      class="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
      :disabled="disabled"
    >
      <Star
        class="w-5 h-5 transition-colors duration-150"
        :class="getStarClass(star)"
      />
    </button>
    <span v-if="showValue" class="ml-2 text-sm text-gray-600">
      {{ modelValue }}/5
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Star } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showValue: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const hoverRating = ref(0)

const getStarClass = (star) => {
  const currentRating = hoverRating.value || props.modelValue
  
  if (props.disabled) {
    return star <= currentRating 
      ? 'text-yellow-400 fill-current' 
      : 'text-gray-300'
  }
  
  return star <= currentRating 
    ? 'text-yellow-400 fill-current hover:text-yellow-500' 
    : 'text-gray-300 hover:text-yellow-300'
}

const setRating = (rating) => {
  if (!props.disabled) {
    emit('update:modelValue', rating)
  }
}
</script>

