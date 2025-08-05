<template>
  <div class="alberta-input-wrapper">
    <div 
      class="alberta-input"
      :class="[
        { 'alberta-input--error': error },
        { 'alberta-input--disabled': disabled },
        { 'alberta-input--readonly': readOnly },
        { 'alberta-input--focused': isFocused || focused }
      ]"
      :style="{ width: width }"
    >
      <!-- Leading Icon -->
      <div v-if="leadingIcon" class="alberta-input__icon alberta-input__icon--leading">
        <component :is="leadingIcon" />
      </div>
      
      <!-- Input Element -->
      <input
        ref="inputRef"
        :type="type"
        :name="name"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readOnly"
        :min="min"
        :max="max"
        :step="step"
        :maxlength="maxLength"
        :autocapitalize="autoCapitalize"
        :aria-label="ariaLabel"
        :aria-labelledby="ariaLabelledBy"
        :data-testid="testId"
        class="alberta-input__field"
        :class="{ [`alberta-input__field--${textAlign}`]: textAlign !== 'left' }"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @change="handleChange"
      />
      
      <!-- Trailing Icon -->
      <div 
        v-if="trailingIcon" 
        class="alberta-input__icon alberta-input__icon--trailing"
        :class="{ 'alberta-input__icon--clickable': handleTrailingIconClick }"
        @click="handleTrailingIconClick ? onTrailingIconClick?.() : undefined"
      >
        <component :is="trailingIcon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

type InputType = 'text' | 'number' | 'password' | 'email' | 'search' | 'tel' | 'date' | 'datetime-local' | 'time' | 'url' | 'week'
type TextAlign = 'left' | 'right'
type AutoCapitalize = 'on' | 'off' | 'none' | 'sentences' | 'words' | 'characters'

interface Props {
  modelValue?: string | number
  type?: InputType
  name?: string
  placeholder?: string
  leadingIcon?: any
  trailingIcon?: any
  disabled?: boolean
  handleTrailingIconClick?: boolean
  focused?: boolean
  readOnly?: boolean
  error?: boolean
  width?: string
  min?: string | Date
  max?: string | Date
  step?: number
  ariaLabel?: string
  ariaLabelledBy?: string
  maxLength?: number
  autoCapitalize?: AutoCapitalize
  textAlign?: TextAlign
  testId?: string
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  handleTrailingIconClick: false,
  focused: false,
  readOnly: false,
  error: false,
  width: '30ch',
  autoCapitalize: 'off',
  textAlign: 'left'
})

const emit = defineEmits<Emits>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// Handle input events
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('change', value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

// Handle programmatic focus
watch(() => props.focused, (newValue) => {
  if (newValue && inputRef.value) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

// Trailing icon click handler
const onTrailingIconClick = props.handleTrailingIconClick ? () => {
  // Emit custom event or handle click
} : undefined
</script>

<style scoped>
.alberta-input-wrapper {
  display: inline-block;
}

.alberta-input {
  position: relative;
  display: flex;
  align-items: center;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  background-color: white;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.alberta-input:hover:not(.alberta-input--disabled) {
  border-color: #9ca3af;
}

.alberta-input--focused {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.alberta-input--error {
  border-color: #dc2626;
}

.alberta-input--error.alberta-input--focused {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.alberta-input--disabled {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
  cursor: not-allowed;
}

.alberta-input--readonly {
  background-color: #f9fafb;
}

.alberta-input__field {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  background: transparent;
  color: #111827;
}

.alberta-input__field::placeholder {
  color: #9ca3af;
}

.alberta-input__field:disabled {
  cursor: not-allowed;
  color: #9ca3af;
}

.alberta-input__field--right {
  text-align: right;
}

.alberta-input__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.75rem;
  color: #6b7280;
}

.alberta-input__icon--leading {
  padding-left: 1rem;
  padding-right: 0.5rem;
}

.alberta-input__icon--trailing {
  padding-left: 0.5rem;
  padding-right: 1rem;
}

.alberta-input__icon--clickable {
  cursor: pointer;
  transition: color 0.2s ease;
}

.alberta-input__icon--clickable:hover {
  color: #374151;
}

/* Adjust padding when icons are present */
.alberta-input:has(.alberta-input__icon--leading) .alberta-input__field {
  padding-left: 0.5rem;
}

.alberta-input:has(.alberta-input__icon--trailing) .alberta-input__field {
  padding-right: 0.5rem;
}
</style>

