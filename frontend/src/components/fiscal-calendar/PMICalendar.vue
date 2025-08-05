<template>
  <div class="pmi-calendar bg-white rounded-lg shadow-lg p-6">
    <div class="calendar-header flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
      <div class="header-info">
        <h3 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          PMI Calendar
        </h3>
        <p class="text-sm text-gray-600 mt-1">Project Management Institute Events & Milestones</p>
      </div>
      
      <div class="header-controls flex items-center gap-4">
        <div class="date-navigation flex items-center gap-2">
          <button @click="previousPeriod" class="nav-btn p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <span class="current-period text-sm font-medium text-gray-900 min-w-[120px] text-center">
            {{ currentPeriodLabel }}
          </span>
          <button @click="nextPeriod" class="nav-btn p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
        
        <div class="view-selector">
          <select 
            v-model="viewMode" 
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="month">Month View</option>
            <option value="quarter">Quarter View</option>
            <option value="year">Year View</option>
          </select>
        </div>
        
        <button 
          @click="showEventModal = true" 
          class="add-event-btn px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add Event
        </button>
      </div>
    </div>

    <!-- PMI Event Categories Filter -->
    <div class="event-categories mb-6 p-4 bg-gray-50 rounded-lg">
      <div class="categories-header flex justify-between items-center mb-3">
        <h4 class="text-sm font-medium text-gray-700">PMI Event Categories</h4>
        <div class="filter-actions flex gap-2">
          <button 
            @click="selectAllCategories" 
            class="text-xs text-blue-600 hover:text-blue-800"
          >
            Select All
          </button>
          <button 
            @click="clearAllCategories" 
            class="text-xs text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div class="categories-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <label 
          v-for="category in pmiCategories" 
          :key="category.id"
          class="category-filter flex items-center gap-2 cursor-pointer p-2 rounded border transition-all"
          :class="{
            'bg-white border-blue-300 shadow-sm': selectedCategories.has(category.id),
            'bg-gray-100 border-gray-200': !selectedCategories.has(category.id)
          }"
        >
          <input 
            type="checkbox" 
            :checked="selectedCategories.has(category.id)"
            @change="toggleCategory(category.id)"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          >
          <div class="flex items-center gap-2 flex-1">
            <div 
              class="w-3 h-3 rounded-full" 
              :style="{ backgroundColor: category.color }"
            ></div>
            <span class="text-sm">{{ category.name }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Calendar Views -->
    <div class="calendar-content">
      <!-- Month View -->
      <div v-if="viewMode === 'month'" class="month-view">
        <div class="month-header grid grid-cols-7 gap-px mb-2">
          <div 
            v-for="day in daysOfWeek" 
            :key="day" 
            class="day-header p-3 text-center text-sm font-medium text-gray-700 bg-gray-100 rounded"
          >
            {{ day }}
          </div>
        </div>
        
        <div class="month-grid grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          <div 
            v-for="day in monthDays" 
            :key="day.date"
            class="calendar-day min-h-[100px] bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors"
            :class="{
              'opacity-50': !day.isCurrentMonth,
              'bg-blue-50 border-2 border-blue-200': day.isToday,
              'bg-yellow-50': day.isWeekend && day.isCurrentMonth
            }"
            @click="selectDay(day)"
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
                v-for="event in day.events.slice(0, 2)" 
                :key="event.id"
                class="event-item text-xs p-1 rounded cursor-pointer truncate"
                :style="{ 
                  backgroundColor: event.category_color + '20', 
                  borderLeft: `3px solid ${event.category_color}` 
                }"
                :title="`${event.title} - ${event.category_name}`"
                @click.stop="selectEvent(event)"
              >
                {{ event.title }}
              </div>
              <div v-if="day.events.length > 2" class="text-xs text-gray-500 pl-1">
                +{{ day.events.length - 2 }} more
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quarter View -->
      <div v-else-if="viewMode === 'quarter'" class="quarter-view">
        <div class="quarter-header mb-4">
          <h4 class="text-lg font-semibold text-gray-900">
            {{ currentQuarterLabel }} Overview
          </h4>
        </div>
        
        <div class="quarter-months grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            v-for="month in quarterMonths" 
            :key="month.key"
            class="month-summary bg-white border border-gray-200 rounded-lg p-4"
          >
            <div class="month-header mb-3">
              <h5 class="font-medium text-gray-900">{{ month.name }}</h5>
              <p class="text-sm text-gray-500">{{ month.events.length }} events</p>
            </div>
            
            <div class="month-events space-y-2">
              <div 
                v-for="event in month.events.slice(0, 5)" 
                :key="event.id"
                class="event-summary flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                @click="selectEvent(event)"
              >
                <div 
                  class="w-2 h-2 rounded-full flex-shrink-0" 
                  :style="{ backgroundColor: event.category_color }"
                ></div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900 truncate">{{ event.title }}</div>
                  <div class="text-xs text-gray-500">{{ formatDate(event.date) }}</div>
                </div>
              </div>
              <div v-if="month.events.length > 5" class="text-xs text-gray-500 pl-4">
                +{{ month.events.length - 5 }} more events
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Year View -->
      <div v-else-if="viewMode === 'year'" class="year-view">
        <div class="year-header mb-6">
          <h4 class="text-lg font-semibold text-gray-900">{{ currentYear }} PMI Calendar Overview</h4>
          <div class="year-stats flex gap-6 mt-2 text-sm text-gray-600">
            <span>Total Events: {{ yearEvents.length }}</span>
            <span>Upcoming: {{ upcomingEvents.length }}</span>
            <span>Completed: {{ completedEvents.length }}</span>
          </div>
        </div>
        
        <div class="year-timeline">
          <div class="timeline-months grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div 
              v-for="month in yearMonths" 
              :key="month.key"
              class="month-timeline bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              @click="goToMonth(month.date)"
            >
              <div class="month-header mb-3">
                <h5 class="font-medium text-gray-900">{{ month.name }}</h5>
                <div class="flex justify-between text-xs text-gray-500">
                  <span>{{ month.events.length }} events</span>
                  <span>{{ month.completedCount }}/{{ month.events.length }} done</span>
                </div>
              </div>
              
              <div class="month-progress mb-3">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-green-600 h-2 rounded-full transition-all"
                    :style="{ width: `${month.progressPercentage}%` }"
                  ></div>
                </div>
              </div>
              
              <div class="month-categories flex flex-wrap gap-1">
                <div 
                  v-for="category in month.categories" 
                  :key="category.id"
                  class="category-dot w-2 h-2 rounded-full"
                  :style="{ backgroundColor: category.color }"
                  :title="category.name"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Modal -->
    <div v-if="showEventModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeEventModal">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" @click.stop>
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ editingEvent ? 'Edit PMI Event' : 'Add PMI Event' }}
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
              <label class="block text-sm font-medium text-gray-700 mb-1">PMI Category</label>
              <select 
                v-model="eventForm.category_id" 
                required 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select PMI category</option>
                <option v-for="category in pmiCategories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select 
                  v-model="eventForm.priority" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  v-model="eventForm.status" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input 
                v-model="eventForm.location" 
                type="text" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Event location or 'Virtual'"
              >
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
              <p class="text-sm text-gray-500">{{ selectedEvent.category_name }}</p>
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
            
            <div class="flex gap-4">
              <div>
                <p class="text-sm font-medium text-gray-700">Priority:</p>
                <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full" :class="{
                  'bg-red-100 text-red-800': selectedEvent.priority === 'critical',
                  'bg-orange-100 text-orange-800': selectedEvent.priority === 'high',
                  'bg-yellow-100 text-yellow-800': selectedEvent.priority === 'medium',
                  'bg-green-100 text-green-800': selectedEvent.priority === 'low'
                }">
                  {{ selectedEvent.priority }}
                </span>
              </div>
              
              <div>
                <p class="text-sm font-medium text-gray-700">Status:</p>
                <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full" :class="{
                  'bg-blue-100 text-blue-800': selectedEvent.status === 'planned',
                  'bg-yellow-100 text-yellow-800': selectedEvent.status === 'in_progress',
                  'bg-green-100 text-green-800': selectedEvent.status === 'completed',
                  'bg-gray-100 text-gray-800': selectedEvent.status === 'cancelled'
                }">
                  {{ selectedEvent.status.replace('_', ' ') }}
                </span>
              </div>
            </div>
            
            <div v-if="selectedEvent.location">
              <p class="text-sm font-medium text-gray-700">Location:</p>
              <p class="text-sm text-gray-600">{{ selectedEvent.location }}</p>
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

// Store
const authStore = useAuthStore()

// Reactive data
const currentDate = ref(new Date())
const viewMode = ref<'month' | 'quarter' | 'year'>('month')
const events = ref<any[]>([])
const pmiCategories = ref<any[]>([])
const selectedCategories = ref<Set<string>>(new Set())
const showEventModal = ref(false)
const selectedEvent = ref<any>(null)
const editingEvent = ref<any>(null)
const loading = ref(false)

// Event form
const eventForm = ref({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  category_id: '',
  priority: 'medium',
  status: 'planned',
  location: ''
})

// Constants
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Computed properties
const currentPeriodLabel = computed(() => {
  if (viewMode.value === 'month') {
    return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } else if (viewMode.value === 'quarter') {
    const quarter = Math.floor(currentDate.value.getMonth() / 3) + 1
    return `Q${quarter} ${currentDate.value.getFullYear()}`
  } else {
    return currentDate.value.getFullYear().toString()
  }
})

const currentQuarterLabel = computed(() => {
  const quarter = Math.floor(currentDate.value.getMonth() / 3) + 1
  return `Q${quarter} ${currentDate.value.getFullYear()}`
})

const currentYear = computed(() => {
  return currentDate.value.getFullYear()
})

const filteredEvents = computed(() => {
  return events.value.filter(event => 
    selectedCategories.value.size === 0 || selectedCategories.value.has(event.category_id)
  )
})

const monthDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  const days = []
  let currentDay = new Date(startDate)
  
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    const dayEvents = filteredEvents.value.filter(event => {
      const eventStart = new Date(event.start_date)
      const eventEnd = new Date(event.end_date)
      return currentDay >= eventStart && currentDay <= eventEnd
    })
    
    days.push({
      date: currentDay.toISOString().split('T')[0],
      dayNumber: currentDay.getDate(),
      isCurrentMonth: currentDay.getMonth() === month,
      isToday: currentDay.toDateString() === new Date().toDateString(),
      isWeekend: currentDay.getDay() === 0 || currentDay.getDay() === 6,
      events: dayEvents
    })
    
    currentDay = new Date(currentDay)
    currentDay.setDate(currentDay.getDate() + 1)
  }
  
  return days
})

const quarterMonths = computed(() => {
  const year = currentDate.value.getFullYear()
  const quarter = Math.floor(currentDate.value.getMonth() / 3)
  const months = []
  
  for (let i = 0; i < 3; i++) {
    const monthIndex = quarter * 3 + i
    const monthDate = new Date(year, monthIndex, 1)
    const monthEvents = filteredEvents.value.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.getFullYear() === year && eventDate.getMonth() === monthIndex
    })
    
    months.push({
      key: `${year}-${monthIndex}`,
      name: monthDate.toLocaleDateString('en-US', { month: 'long' }),
      date: monthDate,
      events: monthEvents
    })
  }
  
  return months
})

const yearMonths = computed(() => {
  const year = currentDate.value.getFullYear()
  const months = []
  
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(year, month, 1)
    const monthEvents = filteredEvents.value.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.getFullYear() === year && eventDate.getMonth() === month
    })
    
    const completedCount = monthEvents.filter(event => event.status === 'completed').length
    const progressPercentage = monthEvents.length > 0 ? (completedCount / monthEvents.length) * 100 : 0
    
    const categories = [...new Set(monthEvents.map(event => event.category_id))]
      .map(categoryId => pmiCategories.value.find(cat => cat.id === categoryId))
      .filter(Boolean)
    
    months.push({
      key: `${year}-${month}`,
      name: monthDate.toLocaleDateString('en-US', { month: 'long' }),
      date: monthDate,
      events: monthEvents,
      completedCount,
      progressPercentage,
      categories
    })
  }
  
  return months
})

const yearEvents = computed(() => {
  const year = currentDate.value.getFullYear()
  return filteredEvents.value.filter(event => {
    const eventDate = new Date(event.start_date)
    return eventDate.getFullYear() === year
  })
})

const upcomingEvents = computed(() => {
  const now = new Date()
  return yearEvents.value.filter(event => {
    const eventDate = new Date(event.start_date)
    return eventDate > now && event.status !== 'cancelled'
  })
})

const completedEvents = computed(() => {
  return yearEvents.value.filter(event => event.status === 'completed')
})

// Methods
const previousPeriod = () => {
  if (viewMode.value === 'month') {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  } else if (viewMode.value === 'quarter') {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 3, 1)
  } else {
    currentDate.value = new Date(currentDate.value.getFullYear() - 1, 0, 1)
  }
}

const nextPeriod = () => {
  if (viewMode.value === 'month') {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  } else if (viewMode.value === 'quarter') {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 3, 1)
  } else {
    currentDate.value = new Date(currentDate.value.getFullYear() + 1, 0, 1)
  }
}

const goToMonth = (date: Date) => {
  currentDate.value = new Date(date)
  viewMode.value = 'month'
}

const selectDay = (day: any) => {
  if (day.events.length === 1) {
    selectEvent(day.events[0])
  } else if (day.events.length > 1) {
    // Show day events list
    console.log('Multiple events on this day:', day.events)
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

const toggleCategory = (categoryId: string) => {
  if (selectedCategories.value.has(categoryId)) {
    selectedCategories.value.delete(categoryId)
  } else {
    selectedCategories.value.add(categoryId)
  }
}

const selectAllCategories = () => {
  pmiCategories.value.forEach(category => {
    selectedCategories.value.add(category.id)
  })
}

const clearAllCategories = () => {
  selectedCategories.value.clear()
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
    category_id: '',
    priority: 'medium',
    status: 'planned',
    location: ''
  }
}

const editEvent = (event: any) => {
  editingEvent.value = event
  eventForm.value = {
    title: event.title,
    description: event.description || '',
    start_date: event.start_date,
    end_date: event.end_date,
    category_id: event.category_id,
    priority: event.priority || 'medium',
    status: event.status || 'planned',
    location: event.location || ''
  }
  selectedEvent.value = null
  showEventModal.value = true
}

const saveEvent = async () => {
  try {
    loading.value = true
    
    const eventData = {
      ...eventForm.value,
      event_type_id: eventForm.value.category_id // Map to fiscal calendar structure
    }
    
    if (editingEvent.value) {
      await axios.put(`/api/fiscal-calendar/events/${editingEvent.value.id}`, eventData)
    } else {
      await axios.post('/api/fiscal-calendar/events', eventData)
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
    
    // Map events to include category information
    events.value = (response.data.data || []).map((event: any) => {
      const category = pmiCategories.value.find(cat => cat.id === event.event_type_id)
      return {
        ...event,
        category_id: event.event_type_id,
        category_name: category?.name || 'Unknown',
        category_color: category?.color || '#6B7280'
      }
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    events.value = []
  } finally {
    loading.value = false
  }
}

const fetchPMICategories = async () => {
  try {
    // For now, use predefined PMI categories
    // In a real implementation, this would come from the API
    pmiCategories.value = [
      { id: '1', name: 'Training & Certification', color: '#3B82F6' },
      { id: '2', name: 'Chapter Meetings', color: '#10B981' },
      { id: '3', name: 'Professional Development', color: '#F59E0B' },
      { id: '4', name: 'Networking Events', color: '#EF4444' },
      { id: '5', name: 'Workshops & Seminars', color: '#8B5CF6' },
      { id: '6', name: 'Conferences', color: '#06B6D4' },
      { id: '7', name: 'Volunteer Activities', color: '#84CC16' },
      { id: '8', name: 'Mentorship Programs', color: '#F97316' }
    ]
    
    // Initialize all categories as selected
    pmiCategories.value.forEach(category => {
      selectedCategories.value.add(category.id)
    })
  } catch (error) {
    console.error('Error fetching PMI categories:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await fetchPMICategories()
  await fetchEvents()
})

// Watch for date changes
watch(currentDate, () => {
  fetchEvents()
})
</script>

<style scoped>
.pmi-calendar {
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

.category-filter {
  transition: all 0.2s ease;
}

.category-filter:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.month-timeline:hover,
.event-summary:hover {
  transform: translateY(-1px);
}

.category-dot {
  transition: all 0.2s ease;
}

.month-timeline:hover .category-dot {
  transform: scale(1.2);
}
</style>

