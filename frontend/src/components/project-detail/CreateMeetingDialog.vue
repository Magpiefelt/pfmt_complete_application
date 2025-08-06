<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Schedule Gate Meeting</DialogTitle>
        <DialogDescription>
          Schedule a new gate meeting for this project.
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Gate Type</label>
          <select 
            v-model="formData.gate_type" 
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Gate Type</option>
            <option value="Gate 1 - Project Initiation">Gate 1 - Project Initiation</option>
            <option value="Gate 2 - Design Approval">Gate 2 - Design Approval</option>
            <option value="Gate 3 - Construction Progress Review">Gate 3 - Construction Progress Review</option>
            <option value="Gate 4 - Project Completion">Gate 4 - Project Completion</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Planned Date</label>
          <input 
            v-model="formData.planned_date" 
            type="date" 
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Agenda (Optional)</label>
          <textarea 
            v-model="formData.agenda" 
            rows="3"
            placeholder="Meeting agenda and topics to discuss..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
      </form>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          Cancel
        </Button>
        <Button @click="handleSubmit" :disabled="!isValid">
          Schedule Meeting
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'

interface MeetingFormData {
  gate_type: string
  planned_date: string
  agenda: string
}

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [data: MeetingFormData]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const formData = ref<MeetingFormData>({
  gate_type: '',
  planned_date: '',
  agenda: ''
})

const isValid = computed(() => {
  return formData.value.gate_type && formData.value.planned_date
})

const handleSubmit = () => {
  if (!isValid.value) return
  
  emit('submit', { ...formData.value })
  resetForm()
}

const handleCancel = () => {
  isOpen.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    gate_type: '',
    planned_date: '',
    agenda: ''
  }
}

// Reset form when dialog closes
watch(isOpen, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

