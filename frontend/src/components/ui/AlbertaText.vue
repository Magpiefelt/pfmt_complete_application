<template>
  <component
    :is="tag"
    class="alberta-text"
    :class="[
      `alberta-text--${computedSize}`,
      `alberta-text--${color}`,
      marginClasses
    ]"
    :style="{ maxWidth: maxWidth }"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TagType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'span' | 'div' | 'p'
type SizeType = 'heading-xl' | 'heading-l' | 'heading-m' | 'heading-s' | 'heading-xs' | 'body-l' | 'body-m' | 'body-s' | 'body-xs'
type ColorType = 'primary' | 'secondary'
type MarginType = 'none' | '3xs' | '2xs' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl' | '3xl' | '4xl'

interface Props {
  tag?: TagType
  size?: SizeType
  maxWidth?: string
  color?: ColorType
  mt?: MarginType
  mr?: MarginType
  mb?: MarginType
  ml?: MarginType
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  size: undefined,
  maxWidth: '65ch',
  color: 'primary',
  mt: undefined,
  mr: undefined,
  mb: undefined,
  ml: undefined
})

// Map tags to default sizes
const tagSizeMap: Record<TagType, SizeType> = {
  h1: 'heading-xl',
  h2: 'heading-l',
  h3: 'heading-m',
  h4: 'heading-s',
  h5: 'heading-xs',
  p: 'body-m',
  span: 'body-m',
  div: 'body-m'
}

const computedSize = computed(() => {
  return props.size || tagSizeMap[props.tag]
})

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
.alberta-text {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Heading sizes */
.alberta-text--heading-xl {
  font-size: 2.25rem;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.alberta-text--heading-l {
  font-size: 1.875rem;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.alberta-text--heading-m {
  font-size: 1.5rem;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.alberta-text--heading-s {
  font-size: 1.25rem;
  line-height: 1.4;
  font-weight: 600;
}

.alberta-text--heading-xs {
  font-size: 1.125rem;
  line-height: 1.4;
  font-weight: 600;
}

/* Body sizes */
.alberta-text--body-l {
  font-size: 1.125rem;
  line-height: 1.6;
  font-weight: 400;
}

.alberta-text--body-m {
  font-size: 1rem;
  line-height: 1.6;
  font-weight: 400;
}

.alberta-text--body-s {
  font-size: 0.875rem;
  line-height: 1.5;
  font-weight: 400;
}

.alberta-text--body-xs {
  font-size: 0.75rem;
  line-height: 1.5;
  font-weight: 400;
}

/* Colors */
.alberta-text--primary {
  color: #111827;
}

.alberta-text--secondary {
  color: #6b7280;
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

