import { ref, computed, watch, reactive } from 'vue'
import type { Ref } from 'vue'

export interface ValidationRule {
  validator: (value: any) => boolean | Promise<boolean>
  message: string
  trigger?: 'blur' | 'change' | 'submit'
}

export interface FieldConfig {
  rules?: ValidationRule[]
  required?: boolean
  requiredMessage?: string
  debounce?: number
}

export interface FieldState {
  value: any
  error: string | null
  touched: boolean
  validating: boolean
  valid: boolean
}

export interface FormState {
  [key: string]: FieldState
}

/**
 * Composable for form validation with Vue 3 reactivity
 * Provides field-level and form-level validation with async support
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  config: Record<keyof T, FieldConfig> = {}
) {
  // Form state
  const formData = reactive<T>({ ...initialValues })
  const fields = reactive<FormState>({})
  const isSubmitting = ref(false)
  const submitAttempted = ref(false)

  // Initialize field states
  for (const key in initialValues) {
    fields[key] = {
      value: initialValues[key],
      error: null,
      touched: false,
      validating: false,
      valid: true
    }
  }

  // Built-in validation rules
  const rules = {
    required: (message = 'This field is required'): ValidationRule => ({
      validator: (value: any) => {
        if (Array.isArray(value)) return value.length > 0
        if (typeof value === 'string') return value.trim().length > 0
        return value !== null && value !== undefined && value !== ''
      },
      message,
      trigger: 'blur'
    }),

    email: (message = 'Please enter a valid email address'): ValidationRule => ({
      validator: (value: string) => {
        if (!value) return true // Let required rule handle empty values
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value)
      },
      message,
      trigger: 'blur'
    }),

    minLength: (min: number, message?: string): ValidationRule => ({
      validator: (value: string) => {
        if (!value) return true
        return value.length >= min
      },
      message: message || `Must be at least ${min} characters`,
      trigger: 'blur'
    }),

    maxLength: (max: number, message?: string): ValidationRule => ({
      validator: (value: string) => {
        if (!value) return true
        return value.length <= max
      },
      message: message || `Must be no more than ${max} characters`,
      trigger: 'change'
    }),

    pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
      validator: (value: string) => {
        if (!value) return true
        return regex.test(value)
      },
      message,
      trigger: 'blur'
    }),

    number: (message = 'Must be a valid number'): ValidationRule => ({
      validator: (value: any) => {
        if (!value && value !== 0) return true
        return !isNaN(Number(value))
      },
      message,
      trigger: 'blur'
    }),

    min: (minimum: number, message?: string): ValidationRule => ({
      validator: (value: any) => {
        if (!value && value !== 0) return true
        const num = Number(value)
        return !isNaN(num) && num >= minimum
      },
      message: message || `Must be at least ${minimum}`,
      trigger: 'blur'
    }),

    max: (maximum: number, message?: string): ValidationRule => ({
      validator: (value: any) => {
        if (!value && value !== 0) return true
        const num = Number(value)
        return !isNaN(num) && num <= maximum
      },
      message: message || `Must be no more than ${maximum}`,
      trigger: 'blur'
    }),

    custom: (validator: (value: any) => boolean | Promise<boolean>, message: string): ValidationRule => ({
      validator,
      message,
      trigger: 'blur'
    })
  }

  // Validate a single field
  const validateField = async (fieldName: keyof T, trigger: 'blur' | 'change' | 'submit' = 'submit'): Promise<boolean> => {
    const fieldConfig = config[fieldName]
    const fieldState = fields[fieldName]
    const value = formData[fieldName]

    if (!fieldConfig) return true

    fieldState.validating = true
    fieldState.error = null

    try {
      // Check required validation
      if (fieldConfig.required) {
        const requiredRule = rules.required(fieldConfig.requiredMessage)
        if (!requiredRule.validator(value)) {
          fieldState.error = requiredRule.message
          fieldState.valid = false
          return false
        }
      }

      // Check custom rules
      if (fieldConfig.rules) {
        for (const rule of fieldConfig.rules) {
          // Skip rule if trigger doesn't match
          if (rule.trigger && rule.trigger !== trigger && trigger !== 'submit') {
            continue
          }

          const isValid = await rule.validator(value)
          if (!isValid) {
            fieldState.error = rule.message
            fieldState.valid = false
            return false
          }
        }
      }

      fieldState.valid = true
      return true
    } catch (error) {
      fieldState.error = 'Validation error occurred'
      fieldState.valid = false
      return false
    } finally {
      fieldState.validating = false
    }
  }

  // Validate all fields
  const validateForm = async (): Promise<boolean> => {
    const validationPromises = Object.keys(formData).map(key => 
      validateField(key as keyof T, 'submit')
    )

    const results = await Promise.all(validationPromises)
    return results.every(result => result)
  }

  // Set field value and validate
  const setFieldValue = async (fieldName: keyof T, value: any, shouldValidate = true) => {
    formData[fieldName] = value
    fields[fieldName].value = value
    fields[fieldName].touched = true

    if (shouldValidate && (fields[fieldName].touched || submitAttempted.value)) {
      await validateField(fieldName, 'change')
    }
  }

  // Set field error manually
  const setFieldError = (fieldName: keyof T, error: string | null) => {
    fields[fieldName].error = error
    fields[fieldName].valid = !error
  }

  // Touch field
  const touchField = async (fieldName: keyof T) => {
    fields[fieldName].touched = true
    await validateField(fieldName, 'blur')
  }

  // Reset field
  const resetField = (fieldName: keyof T) => {
    formData[fieldName] = initialValues[fieldName]
    fields[fieldName] = {
      value: initialValues[fieldName],
      error: null,
      touched: false,
      validating: false,
      valid: true
    }
  }

  // Reset entire form
  const resetForm = () => {
    Object.keys(formData).forEach(key => {
      resetField(key as keyof T)
    })
    isSubmitting.value = false
    submitAttempted.value = false
  }

  // Submit form
  const submitForm = async (onSubmit: (data: T) => Promise<void> | void): Promise<boolean> => {
    submitAttempted.value = true
    isSubmitting.value = true

    try {
      const isValid = await validateForm()
      
      if (isValid) {
        await onSubmit(formData)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Form submission error:', error)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // Computed properties
  const isValid = computed(() => {
    return Object.values(fields).every(field => field.valid)
  })

  const hasErrors = computed(() => {
    return Object.values(fields).some(field => field.error)
  })

  const isDirty = computed(() => {
    return Object.keys(formData).some(key => {
      return JSON.stringify(formData[key]) !== JSON.stringify(initialValues[key])
    })
  })

  const touchedFields = computed(() => {
    return Object.keys(fields).filter(key => fields[key].touched)
  })

  const errors = computed(() => {
    const errorObj: Record<string, string> = {}
    Object.keys(fields).forEach(key => {
      if (fields[key].error) {
        errorObj[key] = fields[key].error!
      }
    })
    return errorObj
  })

  // Watch for form data changes and validate
  Object.keys(formData).forEach(key => {
    const fieldConfig = config[key as keyof T]
    const debounceTime = fieldConfig?.debounce || 300

    let timeoutId: NodeJS.Timeout

    watch(
      () => formData[key as keyof T],
      (newValue) => {
        fields[key].value = newValue
        
        if (fields[key].touched || submitAttempted.value) {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => {
            validateField(key as keyof T, 'change')
          }, debounceTime)
        }
      }
    )
  })

  return {
    // Form data
    formData,
    fields,

    // State
    isSubmitting,
    submitAttempted,
    isValid,
    hasErrors,
    isDirty,
    touchedFields,
    errors,

    // Methods
    validateField,
    validateForm,
    setFieldValue,
    setFieldError,
    touchField,
    resetField,
    resetForm,
    submitForm,

    // Built-in rules
    rules
  }
}

/**
 * Helper function to create field props for form inputs
 */
export function createFieldProps<T extends Record<string, any>>(
  form: ReturnType<typeof useFormValidation<T>>,
  fieldName: keyof T
) {
  return {
    modelValue: form.formData[fieldName],
    'onUpdate:modelValue': (value: any) => form.setFieldValue(fieldName, value),
    onBlur: () => form.touchField(fieldName),
    error: form.fields[fieldName as string]?.error,
    loading: form.fields[fieldName as string]?.validating
  }
}

