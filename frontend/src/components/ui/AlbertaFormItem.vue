<template>
  <div 
    class="alberta-form-item"
    :class="marginClasses"
  >
    <!-- Label -->
    <label 
      v-if="label"
      :for="inputId"
      class="alberta-form-item__label"
      :class="[
        `alberta-form-item__label--${labelSize}`,
        { 'alberta-form-item__label--required': requirement === 'required' }
      ]"
    >
      {{ label }}
      <span 
        v-if="requirement === 'required'" 
        class="alberta-form-item__required"
        aria-label="required"
      >
        *
      </span>
      <span 
        v-if="requirement === 'optional'" 
        class="alberta-form-item__optional"
      >
        (optional)
      </span>
    </label>

    <!-- Help Text -->
    <p 
      v-if="helpText" 
      class="alberta-form-item__help"
      :id="helpTextId"
    >
      {{ helpText }}
    </p>

    <!-- Input Slot -->
    <div class="alberta-form-item__input">
      <slot />
    </div>

    <!-- Error Message -->
    <p 
      v-if="errorMessage" 
      class="alberta-form-item__error"
      :id="errorId"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type RequirementType = 'none' | 'optional' | 'required'
type LabelSizeType = 'regular' | 'large'
type MarginType = 'none' | '3xs' | '2xs' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl' | '3xl' | '4xl'

interface Props {
  label?: string
  helpText?: string
  errorMessage?: string
  requirement?: RequirementType
  labelSize?: LabelSizeType
  inputId?: string
  mt?: MarginType
  mr?: MarginType
  mb?: MarginType
  ml?: MarginType
}

const props = withDefaults(defineProps<Props>(), {
  requirement: 'none',
  labelSize: 'regular',
  inputId: undefined,
  mt: undefined,
  mr: undefined,
  mb: undefined,
  ml: undefined
})

const helpTextId = computed(() => 
  props.helpText ? `help-${Math.random().toString(36).substr(2, 9)}` : undefined
)

const errorId = computed(() => 
  props.errorMessage ? `error-${Math.random().toString(36).substr(2, 9)}` : undefined
)

const marginClasses = computed(() => {
  const classes: string[] = []
  if (props.mt && props.mt !== 'none') classes.push(`mt-${props.mt}`)
  if (props.mr && props.mr !== 'none') classes.push(`mr-${props.mr}`)
  if (props.mb && props.mb !== 'none') classes.push(`mb-${props.mb}`)
  if (props.ml && props.ml !== 'none') classes.push(`ml-${props.ml}`)
  return classes.join(' ')
})
</script>

<style scoped>
.alberta-form-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alberta-form-item__label {
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.alberta-form-item__label--regular {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.alberta-form-item__label--large {
  font-size: 1rem;
  line-height: 1.5rem;
}

.alberta-form-item__required {
  color: #dc2626;
  font-weight: 600;
}

.alberta-form-item__optional {
  color: #6b7280;
  font-weight: 400;
  font-size: 0.875rem;
}

.alberta-form-item__help {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.alberta-form-item__input {
  display: flex;
  flex-direction: column;
}

.alberta-form-item__error {
  margin: 0;
  font-size: 0.875rem;
  color: #dc2626;
  line-height: 1.4;
  font-weight: 500;
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

