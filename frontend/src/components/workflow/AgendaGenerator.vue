<template>
  <div class="agenda-generator bg-white rounded-lg shadow-lg p-6">
    <div class="agenda-header flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
      <h3 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        Gate Meeting Agenda Generator
      </h3>
      <div class="agenda-actions flex flex-wrap gap-2">
        <button 
          @click="generateAgenda" 
          :disabled="!canGenerate || loading"
          class="btn btn-primary px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg v-if="!loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
          <div v-else class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Generate Agenda
        </button>
        <button 
          @click="exportAgenda" 
          :disabled="!agendaGenerated || loading"
          class="btn btn-secondary px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Export Template
        </button>
        <button 
          @click="sendToAttendees" 
          :disabled="!agendaGenerated || attendees.length === 0 || loading"
          class="btn btn-success px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
          Send to Attendees
        </button>
      </div>
    </div>

    <div class="agenda-form space-y-6">
      <!-- Meeting Information -->
      <div class="form-section">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Meeting Information
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label for="meetingTitle" class="block text-sm font-medium text-gray-700 mb-1">
              Meeting Title <span class="text-red-500">*</span>
            </label>
            <input 
              id="meetingTitle"
              v-model="agendaData.meetingTitle" 
              type="text" 
              required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter meeting title"
            >
          </div>
          
          <div class="form-group">
            <label for="projectName" class="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span class="text-red-500">*</span>
            </label>
            <input 
              id="projectName"
              v-model="agendaData.projectName" 
              type="text" 
              required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project name"
            >
          </div>
          
          <div class="form-group">
            <label for="meetingDate" class="block text-sm font-medium text-gray-700 mb-1">
              Meeting Date <span class="text-red-500">*</span>
            </label>
            <input 
              id="meetingDate"
              v-model="agendaData.meetingDate" 
              type="datetime-local" 
              required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>
          
          <div class="form-group">
            <label for="meetingLocation" class="block text-sm font-medium text-gray-700 mb-1">
              Meeting Location
            </label>
            <input 
              id="meetingLocation"
              v-model="agendaData.meetingLocation" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter meeting location or 'Virtual'"
            >
          </div>
          
          <div class="form-group">
            <label for="meetingDuration" class="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input 
              id="meetingDuration"
              v-model="agendaData.meetingDuration" 
              type="number" 
              min="15" 
              max="480"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="90"
            >
          </div>
          
          <div class="form-group">
            <label for="gateType" class="block text-sm font-medium text-gray-700 mb-1">
              Gate Type
            </label>
            <select 
              id="gateType"
              v-model="agendaData.gateType" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select gate type</option>
              <option value="Gate 0">Gate 0 - Project Initiation</option>
              <option value="Gate 1">Gate 1 - Concept</option>
              <option value="Gate 2">Gate 2 - Definition</option>
              <option value="Gate 3">Gate 3 - Implementation</option>
              <option value="Gate 4">Gate 4 - Handover</option>
              <option value="Gate 5">Gate 5 - Benefits Review</option>
            </select>
          </div>
        </div>
        
        <div class="form-group mt-4">
          <label for="meetingObjective" class="block text-sm font-medium text-gray-700 mb-1">
            Meeting Objective
          </label>
          <textarea 
            id="meetingObjective"
            v-model="agendaData.meetingObjective" 
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe the main objective of this gate meeting..."
          ></textarea>
        </div>
      </div>

      <!-- Attendees -->
      <div class="form-section">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          Attendees
        </h4>
        
        <div class="attendee-input flex gap-2 mb-4">
          <input 
            v-model="newAttendee.name"
            type="text" 
            placeholder="Attendee name"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @keyup.enter="addAttendee"
          >
          <input 
            v-model="newAttendee.email"
            type="email" 
            placeholder="Email address"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @keyup.enter="addAttendee"
          >
          <select 
            v-model="newAttendee.role"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Role</option>
            <option value="Chair">Chair</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Senior Project Manager">Senior Project Manager</option>
            <option value="Director">Director</option>
            <option value="Stakeholder">Stakeholder</option>
            <option value="Subject Matter Expert">Subject Matter Expert</option>
            <option value="Observer">Observer</option>
          </select>
          <button 
            @click="addAttendee"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
        
        <div v-if="attendees.length > 0" class="attendees-list space-y-2">
          <div 
            v-for="(attendee, index) in attendees" 
            :key="index"
            class="attendee-item flex items-center justify-between p-3 bg-gray-50 rounded-md"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ attendee.name }}</div>
              <div class="text-sm text-gray-600">{{ attendee.email }}</div>
              <div v-if="attendee.role" class="text-xs text-blue-600 font-medium">{{ attendee.role }}</div>
            </div>
            <button 
              @click="removeAttendee(index)"
              class="text-red-600 hover:text-red-800 p-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Agenda Items -->
      <div class="form-section">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
          Agenda Items
        </h4>
        
        <div class="agenda-item-input grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
          <input 
            v-model="newAgendaItem.title"
            type="text" 
            placeholder="Agenda item title"
            class="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @keyup.enter="addAgendaItem"
          >
          <input 
            v-model="newAgendaItem.duration"
            type="number" 
            placeholder="Duration (min)"
            min="1"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @keyup.enter="addAgendaItem"
          >
          <button 
            @click="addAgendaItem"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Item
          </button>
        </div>
        
        <div v-if="agendaItems.length > 0" class="agenda-items-list space-y-2">
          <div 
            v-for="(item, index) in agendaItems" 
            :key="index"
            class="agenda-item flex items-center justify-between p-3 bg-gray-50 rounded-md"
            draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragover.prevent
            @drop="onDrop($event, index)"
          >
            <div class="flex items-center gap-3 flex-1">
              <div class="drag-handle cursor-move text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
                </svg>
              </div>
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ item.title }}</div>
                <div class="text-sm text-gray-600">{{ item.duration }} minutes</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button 
                @click="moveAgendaItem(index, -1)"
                :disabled="index === 0"
                class="text-gray-400 hover:text-gray-600 disabled:opacity-50 p-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                </svg>
              </button>
              <button 
                @click="moveAgendaItem(index, 1)"
                :disabled="index === agendaItems.length - 1"
                class="text-gray-400 hover:text-gray-600 disabled:opacity-50 p-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <button 
                @click="removeAgendaItem(index)"
                class="text-red-600 hover:text-red-800 p-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="quick-templates mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Quick Templates:</label>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="template in agendaTemplates" 
              :key="template.name"
              @click="applyTemplate(template)"
              class="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
            >
              {{ template.name }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Generated Agenda Preview -->
    <div v-if="agendaGenerated" class="agenda-preview mt-8 p-6 bg-gray-50 rounded-lg">
      <h4 class="text-lg font-medium text-gray-900 mb-4">Generated Agenda Preview</h4>
      <div class="agenda-content bg-white p-6 rounded border" v-html="generatedAgendaHTML"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

// Props
interface Props {
  projectId?: string
  gateMeetingId?: string
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined,
  gateMeetingId: undefined
})

// Store
const authStore = useAuthStore()

// Reactive data
const loading = ref(false)
const agendaGenerated = ref(false)
const generatedAgendaHTML = ref('')

// Form data
const agendaData = ref({
  meetingTitle: '',
  projectName: '',
  meetingDate: '',
  meetingLocation: '',
  meetingDuration: 90,
  gateType: '',
  meetingObjective: ''
})

const attendees = ref<any[]>([])
const newAttendee = ref({
  name: '',
  email: '',
  role: ''
})

const agendaItems = ref<any[]>([])
const newAgendaItem = ref({
  title: '',
  duration: 15
})

// Templates
const agendaTemplates = ref([
  {
    name: 'Standard Gate Meeting',
    items: [
      { title: 'Welcome and Introductions', duration: 10 },
      { title: 'Review of Previous Actions', duration: 15 },
      { title: 'Project Status Update', duration: 20 },
      { title: 'Key Issues and Risks', duration: 20 },
      { title: 'Financial Review', duration: 15 },
      { title: 'Next Steps and Actions', duration: 15 },
      { title: 'Closing Remarks', duration: 5 }
    ]
  },
  {
    name: 'Project Initiation (Gate 0)',
    items: [
      { title: 'Project Overview', duration: 15 },
      { title: 'Business Case Review', duration: 20 },
      { title: 'Stakeholder Analysis', duration: 15 },
      { title: 'Resource Requirements', duration: 15 },
      { title: 'Risk Assessment', duration: 15 },
      { title: 'Go/No-Go Decision', duration: 10 }
    ]
  },
  {
    name: 'Implementation Review (Gate 3)',
    items: [
      { title: 'Implementation Progress', duration: 20 },
      { title: 'Budget and Schedule Review', duration: 15 },
      { title: 'Quality Assurance Update', duration: 15 },
      { title: 'Risk and Issue Management', duration: 15 },
      { title: 'Change Requests', duration: 10 },
      { title: 'Next Phase Planning', duration: 15 }
    ]
  }
])

// Computed properties
const canGenerate = computed(() => {
  return agendaData.value.meetingTitle && 
         agendaData.value.projectName && 
         agendaData.value.meetingDate &&
         agendaItems.value.length > 0
})

const totalDuration = computed(() => {
  return agendaItems.value.reduce((total, item) => total + (item.duration || 0), 0)
})

// Methods
const addAttendee = () => {
  if (newAttendee.value.name && newAttendee.value.email) {
    attendees.value.push({ ...newAttendee.value })
    newAttendee.value = { name: '', email: '', role: '' }
  }
}

const removeAttendee = (index: number) => {
  attendees.value.splice(index, 1)
}

const addAgendaItem = () => {
  if (newAgendaItem.value.title) {
    agendaItems.value.push({ ...newAgendaItem.value })
    newAgendaItem.value = { title: '', duration: 15 }
  }
}

const removeAgendaItem = (index: number) => {
  agendaItems.value.splice(index, 1)
}

const moveAgendaItem = (index: number, direction: number) => {
  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < agendaItems.value.length) {
    const item = agendaItems.value.splice(index, 1)[0]
    agendaItems.value.splice(newIndex, 0, item)
  }
}

const onDragStart = (event: DragEvent, index: number) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', index.toString())
  }
}

const onDrop = (event: DragEvent, dropIndex: number) => {
  if (!event.dataTransfer) return
  
  const dragIndex = parseInt(event.dataTransfer.getData('text/plain'))
  if (dragIndex !== dropIndex) {
    const item = agendaItems.value.splice(dragIndex, 1)[0]
    agendaItems.value.splice(dropIndex, 0, item)
  }
}

const applyTemplate = (template: any) => {
  agendaItems.value = [...template.items]
}

const generateAgenda = async () => {
  try {
    loading.value = true
    
    const agendaPayload = {
      ...agendaData.value,
      attendees: attendees.value,
      agendaItems: agendaItems.value,
      totalDuration: totalDuration.value
    }
    
    const response = await axios.post('/api/gate-meetings/generate-agenda', agendaPayload)
    
    generatedAgendaHTML.value = response.data.html
    agendaGenerated.value = true
    
  } catch (error) {
    console.error('Error generating agenda:', error)
  } finally {
    loading.value = false
  }
}

const exportAgenda = async () => {
  try {
    const response = await axios.post('/api/gate-meetings/export-agenda', {
      ...agendaData.value,
      attendees: attendees.value,
      agendaItems: agendaItems.value,
      html: generatedAgendaHTML.value
    }, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${agendaData.value.meetingTitle.replace(/[^a-z0-9]/gi, '_')}_agenda.docx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
  } catch (error) {
    console.error('Error exporting agenda:', error)
  }
}

const sendToAttendees = async () => {
  try {
    loading.value = true
    
    await axios.post('/api/gate-meetings/send-agenda', {
      ...agendaData.value,
      attendees: attendees.value,
      agendaItems: agendaItems.value,
      html: generatedAgendaHTML.value
    })
    
    alert('Agenda sent to all attendees successfully!')
    
  } catch (error) {
    console.error('Error sending agenda:', error)
    alert('Error sending agenda. Please try again.')
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  // If we have a project ID, pre-fill some data
  if (props.projectId) {
    try {
      const response = await axios.get(`/api/projects/${props.projectId}`)
      const project = response.data.data
      agendaData.value.projectName = project.project_name || project.projectName
    } catch (error) {
      console.error('Error fetching project data:', error)
    }
  }
  
  // If we have a gate meeting ID, load existing data
  if (props.gateMeetingId) {
    try {
      const response = await axios.get(`/api/gate-meetings/${props.gateMeetingId}`)
      const meeting = response.data.data
      
      agendaData.value.meetingTitle = meeting.title
      agendaData.value.meetingDate = meeting.meeting_date
      agendaData.value.meetingLocation = meeting.location
      agendaData.value.meetingObjective = meeting.objective
      
      if (meeting.attendees) {
        attendees.value = meeting.attendees
      }
      
      if (meeting.agenda_items) {
        agendaItems.value = meeting.agenda_items
      }
    } catch (error) {
      console.error('Error fetching gate meeting data:', error)
    }
  }
})
</script>

<style scoped>
.agenda-generator {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.attendee-item,
.agenda-item {
  transition: all 0.2s ease;
}

.attendee-item:hover,
.agenda-item:hover {
  background-color: rgb(243 244 246);
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.agenda-content {
  font-family: 'Times New Roman', serif;
  line-height: 1.6;
}

.agenda-content h1 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
}

.agenda-content h2 {
  font-size: 1.25rem;
  font-weight: bold;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.agenda-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.agenda-content th,
.agenda-content td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: left;
}

.agenda-content th {
  background-color: #f5f5f5;
  font-weight: bold;
}
</style>

