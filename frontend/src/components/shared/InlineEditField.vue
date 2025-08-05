<template>
  <div class="inline-edit-field">
    <!-- Display Mode -->
    <div v-if="!isEditing" 
         class="inline-edit-display group cursor-pointer"
         @click="startEditing"
         :class="displayClass">
      <div class="flex items-center justify-between">
        <span class="inline-edit-value" :class="valueClass">
          {{ displayValue }}
        </span>
        <Edit2 class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-else class="inline-edit-form">
      <!-- Text Input -->
      <input v-if="fieldType === 'text'" 
             ref="editInput"
             v-model="editValue"
             @blur="handleBlur"
             @keydown.enter="saveEdit"
             @keydown.escape="cancelEdit"
             @input="handleInput"
             :class="inputClass"
             :placeholder="placeholder" />

      <!-- Number Input -->
      <input v-else-if="fieldType === 'number'" 
             ref="editInput"
             v-model.number="editValue"
             type="number"
             @blur="handleBlur"
             @keydown.enter="saveEdit"
             @keydown.escape="cancelEdit"
             @input="handleInput"
             :class="inputClass"
             :placeholder="placeholder"
             :min="min"
             :max="max"
             :step="step" />

      <!-- Date Input -->
      <input v-else-if="fieldType === 'date'" 
             ref="editInput"
             v-model="editValue"
             type="date"
             @blur="handleBlur"
             @keydown.enter="saveEdit"
             @keydown.escape="cancelEdit"
             @input="handleInput"
             :class="inputClass" />

      <!-- Select Input -->
      <select v-else-if="fieldType === 'select'" 
              ref="editInput"
              v-model="editValue"
              @blur="handleBlur"
              @keydown.enter="saveEdit"
              @keydown.escape="cancelEdit"
              @change="handleInput"
              :class="inputClass">
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <!-- Textarea -->
      <textarea v-else-if="fieldType === 'textarea'" 
                ref="editInput"
                v-model="editValue"
                @blur="handleBlur"
                @keydown.enter.ctrl="saveEdit"
                @keydown.escape="cancelEdit"
                @input="handleInput"
                :class="textareaClass"
                :placeholder="placeholder"
                :rows="rows"></textarea>

      <!-- Action Buttons -->
      <div class="inline-edit-actions mt-2 flex items-center space-x-2">
        <button @click="saveEdit"
                :disabled="saving || !hasChanges"
                class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
          <Check v-if="!saving" class="h-3 w-3 mr-1" />
          <Loader v-else class="h-3 w-3 mr-1 animate-spin" />
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        
        <button @click="cancelEdit"
                :disabled="saving"
                class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
          <X class="h-3 w-3 mr-1" />
          Cancel
        </button>
      </div>

      <!-- Auto-save Indicator -->
      <div v-if="autoSave && autoSaveStatus" 
           class="inline-edit-autosave mt-1 text-xs text-gray-500 flex items-center">
        <Clock class="h-3 w-3 mr-1" />
        {{ autoSaveStatus }}
      </div>
    </div>

    <!-- Validation Error -->
    <div v-if="validationError" 
         class="inline-edit-error mt-1 text-xs text-red-600 flex items-center">
      <AlertCircle class="h-3 w-3 mr-1" />
      {{ validationError }}
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, watch } from 'vue'
import { Edit2, Check, X, Loader, Clock, AlertCircle } from 'lucide-vue-next'

export default {
  name: 'InlineEditField',
  components: {
    Edit2,
    Check,
    X,
    Loader,
    Clock,
    AlertCircle
  },
  props: {
    value: {
      type: [String, Number, Boolean],
      default: ''
    },
    fieldType: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'number', 'date', 'select', 'textarea'].includes(value)
    },
    entityType: {
      type: String,
      required: true
    },
    entityId: {
      type: [String, Number],
      required: true
    },
    fieldName: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      default: 'Click to edit...'
    },
    options: {
      type: Array,
      default: () => []
    },
    min: {
      type: Number,
      default: null
    },
    max: {
      type: Number,
      default: null
    },
    step: {
      type: Number,
      default: 1
    },
    rows: {
      type: Number,
      default: 3
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    autoSaveDelay: {
      type: Number,
      default: 2000
    },
    validation: {
      type: Function,
      default: null
    },
    displayClass: {
      type: String,
      default: 'px-2 py-1 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200'
    },
    valueClass: {
      type: String,
      default: 'text-gray-900'
    }
  },
  emits: ['update:value', 'save', 'cancel'],
  setup(props, { emit }) {
    const isEditing = ref(false)
    const editValue = ref(props.value)
    const saving = ref(false)
    const validationError = ref('')
    const autoSaveStatus = ref('')
    const editInput = ref(null)
    const sessionId = ref(null)
    let autoSaveTimeout = null

    const displayValue = computed(() => {
      if (props.fieldType === 'select' && props.options.length > 0) {
        const option = props.options.find(opt => opt.value === props.value)
        return option ? option.label : props.value
      }
      
      if (props.fieldType === 'date' && props.value) {
        return new Date(props.value).toLocaleDateString()
      }
      
      return props.value || props.placeholder
    })

    const hasChanges = computed(() => {
      return editValue.value !== props.value
    })

    const inputClass = computed(() => {
      return `block w-full px-2 py-1 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
        validationError.value ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
      }`
    })

    const textareaClass = computed(() => {
      return `block w-full px-2 py-1 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none ${
        validationError.value ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
      }`
    })

    const startEditing = () => {
      if (isEditing.value) return
      
      isEditing.value = true
      editValue.value = props.value
      validationError.value = ''
      sessionId.value = generateSessionId()
      
      nextTick(() => {
        if (editInput.value) {
          editInput.value.focus()
          if (props.fieldType === 'text' || props.fieldType === 'textarea') {
            editInput.value.select()
          }
        }
      })
    }

    const cancelEdit = () => {
      if (saving.value) return
      
      isEditing.value = false
      editValue.value = props.value
      validationError.value = ''
      autoSaveStatus.value = ''
      
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
        autoSaveTimeout = null
      }
      
      emit('cancel')
    }

    const validateValue = () => {
      validationError.value = ''
      
      if (props.validation) {
        const error = props.validation(editValue.value)
        if (error) {
          validationError.value = error
          return false
        }
      }
      
      // Basic validation based on field type
      if (props.fieldType === 'number') {
        if (isNaN(editValue.value)) {
          validationError.value = 'Please enter a valid number'
          return false
        }
        if (props.min !== null && editValue.value < props.min) {
          validationError.value = `Value must be at least ${props.min}`
          return false
        }
        if (props.max !== null && editValue.value > props.max) {
          validationError.value = `Value must be no more than ${props.max}`
          return false
        }
      }
      
      return true
    }

    const saveEdit = async () => {
      if (!hasChanges.value || saving.value) return
      
      if (!validateValue()) return
      
      saving.value = true
      
      try {
        const response = await fetch('/api/phase3-4/inline-edit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            entityType: props.entityType,
            entityId: props.entityId,
            fieldName: props.fieldName,
            newValue: editValue.value,
            sessionId: sessionId.value
          })
        })

        if (response.ok) {
          const result = await response.json()
          emit('update:value', editValue.value)
          emit('save', {
            oldValue: props.value,
            newValue: editValue.value,
            result: result.data
          })
          
          isEditing.value = false
          autoSaveStatus.value = ''
        } else {
          const error = await response.json()
          validationError.value = error.message || 'Failed to save changes'
        }
      } catch (error) {
        console.error('Error saving inline edit:', error)
        validationError.value = 'Failed to save changes'
      } finally {
        saving.value = false
      }
    }

    const handleBlur = () => {
      // Small delay to allow clicking save button
      setTimeout(() => {
        if (isEditing.value && !saving.value) {
          if (hasChanges.value) {
            saveEdit()
          } else {
            cancelEdit()
          }
        }
      }, 150)
    }

    const handleInput = () => {
      validationError.value = ''
      
      if (props.autoSave && hasChanges.value) {
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout)
        }
        
        autoSaveStatus.value = 'Auto-saving...'
        
        autoSaveTimeout = setTimeout(async () => {
          try {
            await fetch('/api/phase3-4/inline-edit/auto-save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                entityType: props.entityType,
                entityId: props.entityId,
                fieldName: props.fieldName,
                newValue: editValue.value,
                sessionId: sessionId.value
              })
            })
            
            autoSaveStatus.value = 'Auto-saved'
            
            setTimeout(() => {
              autoSaveStatus.value = ''
            }, 2000)
          } catch (error) {
            console.error('Auto-save failed:', error)
            autoSaveStatus.value = 'Auto-save failed'
          }
        }, props.autoSaveDelay)
      }
    }

    const generateSessionId = () => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }

    // Watch for external value changes
    watch(() => props.value, (newValue) => {
      if (!isEditing.value) {
        editValue.value = newValue
      }
    })

    return {
      isEditing,
      editValue,
      saving,
      validationError,
      autoSaveStatus,
      editInput,
      displayValue,
      hasChanges,
      inputClass,
      textareaClass,
      startEditing,
      cancelEdit,
      saveEdit,
      handleBlur,
      handleInput
    }
  }
}
</script>

<style scoped>
.inline-edit-field {
  position: relative;
}

.inline-edit-display {
  transition: all 0.2s ease;
}

.inline-edit-form {
  min-width: 200px;
}

.inline-edit-actions {
  position: relative;
  z-index: 10;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>

