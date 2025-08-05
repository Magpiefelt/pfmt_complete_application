<template>
  <div class="fiscal-calendar bg-white rounded-lg shadow-lg p-6">
    <!-- Calendar Header -->
    <div class="calendar-header flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
      <div class="header-controls flex items-center gap-4">
        <button @click="previousMonth" class="nav-btn p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h2 class="current-month text-xl font-semibold text-gray-900">{{ currentMonthYear }}</h2>
        <button @click="nextMonth" class="nav-btn p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
      
      <div class="view-controls flex rounded-md shadow-sm">
        <button 
          @click="viewMode = 'month'" 
          :class="[
            'view-btn px-4 py-2 text-sm font-medium border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500',
            viewMode === 'month' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'
          ]"
        >
          Month View
        </button>
        <button 
          @click="viewMode = 'year'" 
          :class="[
            'view-btn px-4 py-2 text-sm font-medium border border-gray-300 rounded-r-md border-l-0 focus:outline-none focus:ring-2 focus:ring-blue-500',
            viewMode === 'year' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'
          ]"
        >
          Year View
        </button>
      </div>

      <div class="action-controls flex gap-2">
        <button @click="showEventModal = true" class="add-event-btn px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add Event
        </button>
        <button @click="exportCalendar" class="export-btn px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Export
        </button>
      </div>
    </div>

    <!-- Event Type Legend -->
    <div class="event-legend mb-6 p-4 bg-gray-50 rounded-lg">
      <div class="legend-title text-sm font-medium text-gray-700 mb-3">Event Types:</div>
      <div class="legend-items flex flex-wrap gap-3">
        <div 
          v-for="eventType in eventTypes" 
          :key="eventType.id"
          class="legend-item flex items-center gap-2 cursor-pointer px-3 py-1 rounded-full border transition-all"
          @click="toggleEventTypeFilter(eventType.id)"
          :class="{ 
            'opacity-50': !isEventTypeVisible(eventType.id),
            'bg-white border-gray-300': isEventTypeVisible(eventType.id),
            'bg-gray-200 border-gray-200': !isEventTypeVisible(eventType.id)
          }"
        >
          <div 
            class="legend-color w-3 h-3 rounded-full" 
            :style="{ backgroundColor: eventType.color }"
          ></div>
          <span class="legend-label text-sm">{{ eventType.name }}</span>
        </div>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div v-if="viewMode === 'month'" class="calendar-grid">
      <!-- Days of Week Header -->
      <div class="calendar-header-row grid grid-cols-7 gap-px mb-2">
        <div v-for="day in daysOfWeek" :key="day" class="day-header p-2 text-center text-sm font-medium text-gray-700 bg-gray-100 rounded">
          {{ day }}
        </div>
      </div>

      <!-- Calendar Days -->
      <div class="calendar-body grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        <div 
          v-for="day in flattenedDays" 
          :key="day.date"
          class="calendar-day min-h-[120px] bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors"
          :class="{
            'opacity-50': !day.isCurrentMonth,
            'bg-blue-50 border-2 border-blue-200': day.isToday,
            'bg-yellow-50': day.isWeekend && day.isCurrentMonth,
            'border-l-4 border-l-green-500': day.events.length > 0
          }"
          @click="selectDay(day)"
          @drop="onDrop($event, day)"
          @dragover.prevent
          @dragenter.prevent
        >
          <div class="day-number text-sm font-medium mb-1" :class="{
            'text-gray-400': !day.isCurrentMonth,
            'text-blue-600 font-bold': day.isToday,
            'text-gray-900': day.isCurrentMonth && !day.isToday
          }">
            {{ day.dayNumber }}
          </div>
          
          <div class="day-events space-y-1">
            <div 
              v-for="event in day.events.slice(0, 3)" 
              :key="event.id"
              class="event-item text-xs p-1 rounded cursor-pointer truncate"
              :style="{ backgroundColor: event.color + '20', borderLeft: `3px solid ${event.color}` }"
              :title="event.title"
              @click.stop="selectEvent(event)"
              draggable="true"
              @dragstart="onDragStart($event, event)"
            >
              {{ event.title }}
            </div>
            <div v-if="day.events.length > 3" class="text-xs text-gray-500 pl-1">
              +{{ day.events.length - 3 }} more
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Year View -->
    <div v-else-if="viewMode === 'year'" class="year-view">
      <div class="year-header mb-6">
        <h3 class="text-lg font-semibold text-gray-900">{{ currentYear }} Fiscal Year Overview</h3>
      </div>
      
      <div class="year-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div 
          v-for="month in yearMonths" 
          :key="month.key"
          class="month-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          @click="goToMonth(month.date)"
        >
          <div class="month-header mb-3">
            <h4 class="font-medium text-gray-900">{{ month.name }}</h4>
            <p class="text-sm text-gray-500">{{ month.eventCount }} events</p>
          </div>
          
          <div class="month-mini-calendar">
            <div class="mini-days grid grid-cols-7 gap-1">
              <div 
                v-for="day in month.days" 
                :key="day.date"
                class="mini-day w-6 h-6 text-xs flex items-center justify-center rounded"
                :class="{
                  'bg-gray-100 text-gray-400': !day.isCurrentMonth,
                  'bg-blue-100 text-blue-800': day.hasEvents,
                  'bg-blue-600 text-white': day.isToday,
                  'text-gray-700': day.isCurrentMonth && !day.hasEvents && !day.isToday
                }"
              >
                {{ day.dayNumber }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Modal -->
    <div v-if="showEventModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeEventModal">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" @click.stop>
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editingEvent ? 'Edit Event' : 'Add New Event' }}
            </h3>
            <button @click="closeEventModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="saveEvent" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
              <input 
                v-model="eventForm.title" 
                type="text" 
                required 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event title"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                v-model="eventForm.description" 
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event description"
              ></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input 
                  v-model="eventForm.start_date" 
                  type="date" 
                  required 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input 
                  v-model="eventForm.end_date" 
                  type="date" 
                  required 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select 
                v-model="eventForm.event_type_id" 
                required 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select event type</option>
                <option v-for="type in eventTypes" :key="type.id" :value="type.id">
                  {{ type.name }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select 
                v-model="eventForm.priority" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div class="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                @click="closeEventModal"
                class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {{ editingEvent ? 'Update Event' : 'Create Event' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Event Details Modal -->
    <div v-if="selectedEvent" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeEventDetails">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" @click.stop>
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ selectedEvent.title }}</h3>
              <p class="text-sm text-gray-500">{{ selectedEvent.event_type_name }}</p>
            </div>
            <button @click="closeEventDetails" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="space-y-3">
            <div v-if="selectedEvent.description">
              <p class="text-sm font-medium text-gray-700">Description:</p>
              <p class="text-sm text-gray-600">{{ selectedEvent.description }}</p>
            </div>
            
            <div>
              <p class="text-sm font-medium text-gray-700">Date Range:</p>
              <p class="text-sm text-gray-600">
                {{ formatDate(selectedEvent.start_date) }} - {{ formatDate(selectedEvent.end_date) }}
              </p>
            </div>
            
            <div>
              <p class="text-sm font-medium text-gray-700">Priority:</p>
              <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full" :class="{
                'bg-red-100 text-red-800': selectedEvent.priority === 'high',
                'bg-yellow-100 text-yellow-800': selectedEvent.priority === 'medium',
                'bg-green-100 text-green-800': selectedEvent.priority === 'low'
              }">
                {{ selectedEvent.priority }}
              </span>
            </div>
            
            <div v-if="selectedEvent.assigned_to_name">
              <p class="text-sm font-medium text-gray-700">Assigned To:</p>
              <p class="text-sm text-gray-600">{{ selectedEvent.assigned_to_name }}</p>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 pt-6">
            <button 
              @click="editEvent(selectedEvent)"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Event
            </button>
            <button 
              @click="deleteEvent(selectedEvent)"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Event
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

// Props
interface Props {
  projectId?: string
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined
})

// Store
const authStore = useAuthStore()

// Reactive data
const currentDate = ref(new Date())
const viewMode = ref<'month' | 'year'>('month')
const events = ref<any[]>([])
const eventTypes = ref<any[]>([])
const visibleEventTypes = ref<Set<string>>(new Set())
const showEventModal = ref(false)
const selectedEvent = ref<any>(null)
const editingEvent = ref<any>(null)
const selectedDay = ref<any>(null)
const loading = ref(false)

// Event form
const eventForm = ref({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  event_type_id: '',
  priority: 'medium',
  assigned_to: '',
  reporting_deadline: '',
  metadata: {}
})

// Days of week
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Computed properties
const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
})

const currentYear = computed(() => {
  return currentDate.value.getFullYear()
})

const calendarWeeks = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  const weeks = []
  let currentWeekStart = new Date(startDate)
  
  while (currentWeekStart <= lastDay || weeks.length === 0 || weeks[weeks.length - 1].days.some(d => d.isCurrentMonth)) {
    const week = {
      weekNumber: weeks.length + 1,
      days: []
    }
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(date.getDate() + i)
      
      const dayEvents = events.value.filter(event => {
        const eventStart = new Date(event.start_date)
        const eventEnd = new Date(event.end_date)
        return date >= eventStart && date <= eventEnd && isEventTypeVisible(event.event_type_id)
      })
      
      week.days.push({
        date: date.toISOString().split('T')[0],
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === new Date().toDateString(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        events: dayEvents
      })
    }
    
    weeks.push(week)
    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    
    if (weeks.length > 6) break // Safety check
  }
  
  return weeks
})

const flattenedDays = computed(() => {
  return calendarWeeks.value.flatMap(week => week.days)
})

const yearMonths = computed(() => {
  const months = []
  const year = currentDate.value.getFullYear()
  
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(year, month, 1)
    const monthEvents = events.value.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.getFullYear() === year && eventDate.getMonth() === month
    })
    
    // Generate mini calendar days
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      const hasEvents = events.value.some(event => {
        const eventStart = new Date(event.start_date)
        const eventEnd = new Date(event.end_date)
        return date >= eventStart && date <= eventEnd
      })
      
      days.push({
        date: date.toISOString().split('T')[0],
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === new Date().toDateString(),
        hasEvents
      })
    }
    
    months.push({
      key: `${year}-${month}`,
      name: monthDate.toLocaleDateString('en-US', { month: 'long' }),
      date: monthDate,
      eventCount: monthEvents.length,
      days: days.slice(0, 35) // Show 5 weeks
    })
  }
  
  return months
})

// Methods
const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const goToMonth = (date: Date) => {
  currentDate.value = new Date(date)
  viewMode.value = 'month'
}

const selectDay = (day: any) => {
  selectedDay.value = day
  if (day.events.length === 1) {
    selectEvent(day.events[0])
  } else if (day.events.length > 1) {
    // Show day events list
  } else {
    // Open new event modal with pre-filled date
    eventForm.value.start_date = day.date
    eventForm.value.end_date = day.date
    showEventModal.value = true
  }
}

const selectEvent = (event: any) => {
  selectedEvent.value = event
}

const closeEventDetails = () => {
  selectedEvent.value = null
}

const toggleEventTypeFilter = (eventTypeId: string) => {
  if (visibleEventTypes.value.has(eventTypeId)) {
    visibleEventTypes.value.delete(eventTypeId)
  } else {
    visibleEventTypes.value.add(eventTypeId)
  }
}

const isEventTypeVisible = (eventTypeId: string) => {
  return visibleEventTypes.value.has(eventTypeId)
}

const closeEventModal = () => {
  showEventModal.value = false
  editingEvent.value = null
  resetEventForm()
}

const resetEventForm = () => {
  eventForm.value = {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type_id: '',
    priority: 'medium',
    assigned_to: '',
    reporting_deadline: '',
    metadata: {}
  }
}

const editEvent = (event: any) => {
  editingEvent.value = event
  eventForm.value = {
    title: event.title,
    description: event.description || '',
    start_date: event.start_date,
    end_date: event.end_date,
    event_type_id: event.event_type_id,
    priority: event.priority || 'medium',
    assigned_to: event.assigned_to || '',
    reporting_deadline: event.reporting_deadline || '',
    metadata: event.metadata || {}
  }
  selectedEvent.value = null
  showEventModal.value = true
}

const saveEvent = async () => {
  try {
    loading.value = true
    
    if (editingEvent.value) {
      await axios.put(`/api/fiscal-calendar/events/${editingEvent.value.id}`, eventForm.value)
    } else {
      await axios.post('/api/fiscal-calendar/events', eventForm.value)
    }
    
    await fetchEvents()
    closeEventModal()
  } catch (error) {
    console.error('Error saving event:', error)
  } finally {
    loading.value = false
  }
}

const deleteEvent = async (event: any) => {
  if (!confirm('Are you sure you want to delete this event?')) return
  
  try {
    loading.value = true
    await axios.delete(`/api/fiscal-calendar/events/${event.id}`)
    await fetchEvents()
    selectedEvent.value = null
  } catch (error) {
    console.error('Error deleting event:', error)
  } finally {
    loading.value = false
  }
}

const onDragStart = (event: DragEvent, eventData: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify(eventData))
  }
}

const onDrop = async (event: DragEvent, day: any) => {
  if (!event.dataTransfer) return
  
  try {
    const eventData = JSON.parse(event.dataTransfer.getData('text/plain'))
    const daysDiff = new Date(day.date).getTime() - new Date(eventData.start_date).getTime()
    const daysDiffInDays = Math.floor(daysDiff / (1000 * 60 * 60 * 24))
    
    const newStartDate = new Date(eventData.start_date)
    newStartDate.setDate(newStartDate.getDate() + daysDiffInDays)
    
    const newEndDate = new Date(eventData.end_date)
    newEndDate.setDate(newEndDate.getDate() + daysDiffInDays)
    
    await axios.put(`/api/fiscal-calendar/events/${eventData.id}`, {
      ...eventData,
      start_date: newStartDate.toISOString().split('T')[0],
      end_date: newEndDate.toISOString().split('T')[0]
    })
    
    await fetchEvents()
  } catch (error) {
    console.error('Error moving event:', error)
  }
}

const exportCalendar = async () => {
  try {
    const response = await axios.get('/api/fiscal-calendar/export', {
      params: {
        start_date: new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0).toISOString().split('T')[0]
      },
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `fiscal-calendar-${currentMonthYear.value}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error exporting calendar:', error)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchEvents = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/fiscal-calendar/events', {
      params: {
        start_date: new Date(currentDate.value.getFullYear(), 0, 1).toISOString().split('T')[0],
        end_date: new Date(currentDate.value.getFullYear(), 11, 31).toISOString().split('T')[0],
        limit: 1000
      }
    })
    events.value = response.data.data || []
  } catch (error) {
    console.error('Error fetching events:', error)
    events.value = []
  } finally {
    loading.value = false
  }
}

const fetchEventTypes = async () => {
  try {
    const response = await axios.get('/api/fiscal-calendar/event-types')
    eventTypes.value = response.data.data || []
    
    // Initialize all event types as visible
    eventTypes.value.forEach(type => {
      visibleEventTypes.value.add(type.id)
    })
  } catch (error) {
    console.error('Error fetching event types:', error)
    eventTypes.value = []
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchEvents(),
    fetchEventTypes()
  ])
})

// Watch for date changes
watch(currentDate, () => {
  fetchEvents()
})
</script>

<style scoped>
.fiscal-calendar {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.calendar-day {
  transition: all 0.2s ease;
}

.calendar-day:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.event-item {
  transition: all 0.2s ease;
}

.event-item:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mini-day {
  transition: all 0.2s ease;
}

.month-card:hover .mini-day.bg-blue-100 {
  background-color: rgb(59 130 246);
  color: white;
}
</style>

