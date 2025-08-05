<template>
  <div 
    class="alberta-accordion"
    :class="{ 'alberta-accordion--open': isOpen }"
    :style="{ maxWidth: maxWidth }"
  >
    <button
      type="button"
      class="alberta-accordion__header"
      :class="[
        `alberta-accordion__header--${headingSize}`,
        { 'alberta-accordion__header--open': isOpen }
      ]"
      @click="toggleAccordion"
      :aria-expanded="isOpen"
      :aria-controls="contentId"
      :data-testid="testId"
    >
      <div class="alberta-accordion__header-content">
        <div class="alberta-accordion__text">
          <h3 
            class="alberta-accordion__heading"
            :class="`alberta-accordion__heading--${headingSize}`"
          >
            {{ heading }}
            <component 
              v-if="headingContent" 
              :is="headingContent" 
              class="alberta-accordion__heading-component"
            />
          </h3>
          <p 
            v-if="secondaryText" 
            class="alberta-accordion__secondary"
          >
            {{ secondaryText }}
          </p>
        </div>
        <div class="alberta-accordion__icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            :class="{ 'alberta-accordion__icon--rotated': isOpen }"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </button>
    
    <div
      :id="contentId"
      class="alberta-accordion__content"
      :class="{ 'alberta-accordion__content--open': isOpen }"
      :aria-hidden="!isOpen"
    >
      <div class="alberta-accordion__content-inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  heading: string
  secondaryText?: string
  open?: boolean
  headingSize?: 'small' | 'medium'
  headingContent?: any
  maxWidth?: string
  testId?: string
  mt?: string
  mr?: string
  mb?: string
  ml?: string
}

interface Emits {
  (e: 'change', open: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  headingSize: 'small',
  maxWidth: undefined,
  testId: undefined,
  mt: undefined,
  mr: undefined,
  mb: undefined,
  ml: undefined
})

const emit = defineEmits<Emits>()

const isOpen = ref(props.open)
const contentId = computed(() => `accordion-content-${Math.random().toString(36).substr(2, 9)}`)

// Watch for external changes to open prop
watch(() => props.open, (newValue) => {
  isOpen.value = newValue
})

const toggleAccordion = () => {
  isOpen.value = !isOpen.value
  emit('change', isOpen.value)
}

// Compute margin classes
const marginClasses = computed(() => {
  const classes: string[] = []
  if (props.mt) classes.push(`mt-${props.mt}`)
  if (props.mr) classes.push(`mr-${props.mr}`)
  if (props.mb) classes.push(`mb-${props.mb}`)
  if (props.ml) classes.push(`ml-${props.ml}`)
  return classes.join(' ')
})
</script>

<style scoped>
.alberta-accordion {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.alberta-accordion__header {
  width: 100%;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
}

.alberta-accordion__header:hover {
  background-color: #f9fafb;
}

.alberta-accordion__header:focus {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.alberta-accordion__header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.alberta-accordion__text {
  flex: 1;
}

.alberta-accordion__heading {
  margin: 0;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alberta-accordion__heading--small {
  font-size: 1rem;
  line-height: 1.5;
}

.alberta-accordion__heading--medium {
  font-size: 1.125rem;
  line-height: 1.5;
}

.alberta-accordion__secondary {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.alberta-accordion__icon {
  margin-left: 1rem;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.alberta-accordion__icon--rotated {
  transform: rotate(180deg);
}

.alberta-accordion__content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.alberta-accordion__content--open {
  max-height: 1000px; /* Large enough value for content */
}

.alberta-accordion__content-inner {
  padding: 0 1.5rem 1.5rem 1.5rem;
  color: #374151;
  line-height: 1.6;
}

/* Margin utilities */
.mt-3xs { margin-top: 0.125rem; }
.mt-2xs { margin-top: 0.25rem; }
.mt-xs { margin-top: 0.5rem; }
.mt-s { margin-top: 0.75rem; }
.mt-m { margin-top: 1rem; }
.mt-l { margin-top: 1.5rem; }
.mt-xl { margin-top: 2rem; }
.mt-2xl { margin-top: 2.5rem; }
.mt-3xl { margin-top: 3rem; }
.mt-4xl { margin-top: 4rem; }

.mr-3xs { margin-right: 0.125rem; }
.mr-2xs { margin-right: 0.25rem; }
.mr-xs { margin-right: 0.5rem; }
.mr-s { margin-right: 0.75rem; }
.mr-m { margin-right: 1rem; }
.mr-l { margin-right: 1.5rem; }
.mr-xl { margin-right: 2rem; }
.mr-2xl { margin-right: 2.5rem; }
.mr-3xl { margin-right: 3rem; }
.mr-4xl { margin-right: 4rem; }

.mb-3xs { margin-bottom: 0.125rem; }
.mb-2xs { margin-bottom: 0.25rem; }
.mb-xs { margin-bottom: 0.5rem; }
.mb-s { margin-bottom: 0.75rem; }
.mb-m { margin-bottom: 1rem; }
.mb-l { margin-bottom: 1.5rem; }
.mb-xl { margin-bottom: 2rem; }
.mb-2xl { margin-bottom: 2.5rem; }
.mb-3xl { margin-bottom: 3rem; }
.mb-4xl { margin-bottom: 4rem; }

.ml-3xs { margin-left: 0.125rem; }
.ml-2xs { margin-left: 0.25rem; }
.ml-xs { margin-left: 0.5rem; }
.ml-s { margin-left: 0.75rem; }
.ml-m { margin-left: 1rem; }
.ml-l { margin-left: 1.5rem; }
.ml-xl { margin-left: 2rem; }
.ml-2xl { margin-left: 2.5rem; }
.ml-3xl { margin-left: 3rem; }
.ml-4xl { margin-left: 4rem; }
</style>

