<template>
  <div class="fiscal-year-calendar">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Fiscal Year Calendar</h2>
        <p class="text-gray-600 mt-1">Project milestones, gate meetings, and deadlines</p>
      </div>
      <div class="flex items-center gap-4">
        <!-- View Toggle -->
        <div class="flex bg-gray-100 rounded-lg p-1">
          <button
            @click="currentView = 'month'"
            :class="currentView === 'month' ? 'bg-white shadow-sm' : ''"
            class="px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Month
          </button>
          <button
            @click="currentView = 'quarter'"
            :class="currentView === 'quarter' ? 'bg-white shadow-sm' : ''"
            class="px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Quarter
          </button>
          <button
            @click="currentView = 'year'"
            :class="currentView === 'year' ? 'bg-white shadow-sm' : ''"
            class="px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Year
          </button>
        </div>
        
        <!-- PMI Toggle -->
        <label class="flex items-center gap-2">
          <input
            v-model="showPMIView"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm font-medium text-gray-700">PMI View</span>
        </label>
        
        <!-- Add Event Button -->
        <button
          @click="showAddEventModal = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Event
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Project:</label>
          <select
            v-model="selectedProject"
            @change="loadEvents"
            class="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Projects</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.project_name }}
            </option>
          </select>
        </div>
        
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Type:</label>
          <select
            v-model="selectedType"
            @change="loadEvents"
            class="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="milestone">Milestones</option>
            <option value="gate_meeting">Gate Meetings</option>
            <option value="deadline">Deadlines</option>
            <option value="review">Reviews</option>
          </select>
        </div>
        
        <div v-if="showPMIView" class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Phase:</label>
          <select
            v-model="selectedCategory"
            @change="loadEvents"
            class="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Phases</option>
            <option value="planning">Planning</option>
            <option value="design">Design</option>
            <option value="construction">Construction</option>
            <option value="closure">Closure</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Calendar Navigation -->
    <div class="flex justify-between items-center mb-6">
      <button
        @click="navigatePrevious"
        class="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Previous
      </button>
      
      <h3 class="text-xl font-semibold text-gray-900">{{ currentPeriodTitle }}</h3>
      
      <button
        @click="navigateNext"
        class="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        Next
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </div>

    <!-- Calendar Grid -->
    <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
      <!-- Month View -->
      <div v-if="currentView === 'month'" class="calendar-month">
        <!-- Days Header -->
        <div class="grid grid-cols-7 border-b border-gray-200">
          <div
            v-for="day in daysOfWeek"
            :key="day"
            class="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50"
          >
            {{ day }}
          </div>
        </div>
        
        <!-- Calendar Days -->
        <div class="grid grid-cols-7">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            :class="getDayClass(day)"
            class="min-h-[120px] p-2 border-r border-b border-gray-100 last:border-r-0"
          >
            <div class="text-sm font-medium mb-2" :class="day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'">
              {{ day.day }}
            </div>
            <div class="space-y-1">
              <div
                v-for="event in day.events"
                :key="event.id"
                @click="showEventDetails(event)"
                :class="getEventClass(event.type)"
                class="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
              >
                {{ event.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quarter View -->
      <div v-else-if="currentView === 'quarter'" class="calendar-quarter p-6">
        <div class="grid grid-cols-3 gap-6">
          <div
            v-for="month in quarterMonths"
            :key="month.name"
            class="border border-gray-200 rounded-lg p-4"
          >
            <h4 class="font-semibold text-gray-900 mb-3">{{ month.name }}</h4>
            <div class="space-y-2">
              <div
                v-for="event in month.events"
                :key="event.id"
                @click="showEventDetails(event)"
                :class="getEventClass(event.type)"
                class="text-sm p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div class="font-medium">{{ event.title }}</div>
                <div class="text-xs opacity-75">{{ formatEventDate(event.event_date) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Year View -->
      <div v-else class="calendar-year p-6">
        <div class="grid grid-cols-4 gap-4">
          <div
            v-for="month in yearMonths"
            :key="month.name"
            class="border border-gray-200 rounded-lg p-3"
          >
            <h5 class="font-medium text-gray-900 mb-2 text-sm">{{ month.name }}</h5>
            <div class="space-y-1">
              <div
                v-for="event in month.events.slice(0, 3)"
                :key="event.id"
                @click="showEventDetails(event)"
                :class="getEventClass(event.type)"
                class="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
              >
                {{ event.title }}
              </div>
              <div v-if="month.events.length > 3" class="text-xs text-gray-500 p-1">
                +{{ month.events.length - 3 }} more
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Legend -->
    <div class="mt-6 bg-white rounded-lg shadow-sm border p-4">
      <h4 class="font-semibold text-gray-900 mb-3">Event Types</h4>
      <div class="flex flex-wrap gap-4">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-blue-500 rounded"></div>
          <span class="text-sm text-gray-700">Milestones</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-500 rounded"></div>
          <span class="text-sm text-gray-700">Gate Meetings</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-red-500 rounded"></div>
          <span class="text-sm text-gray-700">Deadlines</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-purple-500 rounded"></div>
          <span class="text-sm text-gray-700">Reviews</span>
        </div>
      </div>
    </div>

    <!-- Event Details Modal -->
    <Modal v-if="selectedEvent" @close="selectedEvent = null">
      <div class="max-w-md mx-auto">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-bold text-gray-900">Event Details</h3>
          <button
            @click="selectedEvent = null"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-gray-900">{{ selectedEvent.title }}</h4>
            <p v-if="selectedEvent.description" class="text-gray-600 mt-1">{{ selectedEvent.description }}</p>
          </div>
          
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Date:</span>
              <div class="font-medium">{{ formatEventDate(selectedEvent.event_date) }}</div>
            </div>
            <div>
              <span class="text-gray-500">Type:</span>
              <div class="font-medium capitalize">{{ selectedEvent.type.replace('_', ' ') }}</div>
            </div>
            <div v-if="selectedEvent.location">
              <span class="text-gray-500">Location:</span>
              <div class="font-medium">{{ selectedEvent.location }}</div>
            </div>
            <div v-if="selectedEvent.category">
              <span class="text-gray-500">Phase:</span>
              <div class="font-medium capitalize">{{ selectedEvent.category }}</div>
            </div>
          </div>
          
          <div v-if="selectedEvent.project_name" class="pt-4 border-t border-gray-200">
            <span class="text-gray-500 text-sm">Project:</span>
            <div class="font-medium">{{ selectedEvent.project_name }}</div>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Add Event Modal -->
    <Modal v-if="showAddEventModal" @close="showAddEventModal = false">
      <div class="max-w-md mx-auto">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Add Calendar Event</h3>
        
        <form @submit.prevent="addEvent" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              v-model="newEvent.title"
              type="text"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              v-model="newEvent.description"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                v-model="newEvent.eventDate"
                type="date"
                required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                v-model="newEvent.type"
                required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="milestone">Milestone</option>
                <option value="gate_meeting">Gate Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="review">Review</option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Project</label>
              <select
                v-model="newEvent.projectId"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Project</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">
                  {{ project.project_name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Phase</label>
              <select
                v-model="newEvent.category"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="planning">Planning</option>
                <option value="design">Design</option>
                <option value="construction">Construction</option>
                <option value="closure">Closure</option>
              </select>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="showAddEventModal = false"
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
</template>

<script>
import Modal from '../shared/Modal.vue';

export default {
  name: 'FiscalYearCalendar',
  components: {
    Modal
  },
  props: {
    projectId: {
      type: String,
      default: 'all'
    }
  },
  data() {
    return {
      currentView: 'month',
      showPMIView: false,
      currentDate: new Date(),
      events: [],
      projects: [],
      selectedProject: 'all',
      selectedType: '',
      selectedCategory: '',
      selectedEvent: null,
      showAddEventModal: false,
      newEvent: {
        title: '',
        description: '',
        eventDate: '',
        type: 'milestone',
        projectId: '',
        category: 'planning'
      },
      daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    };
  },
  computed: {
    currentPeriodTitle() {
      if (this.currentView === 'month') {
        return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else if (this.currentView === 'quarter') {
        const quarter = Math.floor(this.currentDate.getMonth() / 3) + 1;
        return `Q${quarter} ${this.currentDate.getFullYear()}`;
      } else {
        return this.currentDate.getFullYear().toString();
      }
    },
    
    calendarDays() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      const days = [];
      const currentDate = new Date(startDate);
      
      for (let i = 0; i < 42; i++) {
        const dayEvents = this.events.filter(event => {
          const eventDate = new Date(event.event_date);
          return eventDate.toDateString() === currentDate.toDateString();
        });
        
        days.push({
          date: new Date(currentDate),
          day: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === month,
          isToday: currentDate.toDateString() === new Date().toDateString(),
          events: dayEvents
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return days;
    },
    
    quarterMonths() {
      const quarter = Math.floor(this.currentDate.getMonth() / 3);
      const year = this.currentDate.getFullYear();
      const months = [];
      
      for (let i = 0; i < 3; i++) {
        const monthIndex = quarter * 3 + i;
        const monthDate = new Date(year, monthIndex, 1);
        const monthEvents = this.events.filter(event => {
          const eventDate = new Date(event.event_date);
          return eventDate.getMonth() === monthIndex && eventDate.getFullYear() === year;
        });
        
        months.push({
          name: monthDate.toLocaleDateString('en-US', { month: 'long' }),
          events: monthEvents
        });
      }
      
      return months;
    },
    
    yearMonths() {
      const year = this.currentDate.getFullYear();
      const months = [];
      
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(year, i, 1);
        const monthEvents = this.events.filter(event => {
          const eventDate = new Date(event.event_date);
          return eventDate.getMonth() === i && eventDate.getFullYear() === year;
        });
        
        months.push({
          name: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          events: monthEvents
        });
      }
      
      return months;
    }
  },
  async mounted() {
    await this.loadProjects();
    await this.loadEvents();
    this.selectedProject = this.projectId;
  },
  watch: {
    projectId(newVal) {
      this.selectedProject = newVal;
      this.loadEvents();
    },
    showPMIView() {
      this.loadEvents();
    }
  },
  methods: {
    async loadProjects() {
      try {
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.projects = data.data;
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    },

    async loadEvents() {
      try {
        const params = new URLSearchParams();
        if (this.selectedProject !== 'all') {
          params.append('projectId', this.selectedProject);
        }
        if (this.selectedType) {
          params.append('type', this.selectedType);
        }
        if (this.selectedCategory) {
          params.append('category', this.selectedCategory);
        }
        
        const url = this.selectedProject === 'all' 
          ? `/api/phase2/calendar-events?${params}`
          : `/api/phase2/projects/${this.selectedProject}/calendar-events?${params}`;
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.events = data.data;
        }
      } catch (error) {
        console.error('Error loading events:', error);
      }
    },

    async addEvent() {
      try {
        const projectId = this.newEvent.projectId || this.selectedProject;
        if (!projectId || projectId === 'all') {
          this.$toast.error('Please select a project');
          return;
        }
        
        const response = await fetch(`/api/phase2/projects/${projectId}/calendar-events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$store.getters.token}`
          },
          body: JSON.stringify({
            type: this.newEvent.type,
            title: this.newEvent.title,
            description: this.newEvent.description,
            eventDate: this.newEvent.eventDate,
            category: this.newEvent.category,
            allDay: true
          })
        });
        
        if (response.ok) {
          this.$toast.success('Event added successfully');
          this.showAddEventModal = false;
          this.resetNewEvent();
          await this.loadEvents();
        } else {
          throw new Error('Failed to add event');
        }
      } catch (error) {
        console.error('Error adding event:', error);
        this.$toast.error('Failed to add event');
      }
    },

    navigatePrevious() {
      if (this.currentView === 'month') {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      } else if (this.currentView === 'quarter') {
        this.currentDate.setMonth(this.currentDate.getMonth() - 3);
      } else {
        this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
      }
      this.currentDate = new Date(this.currentDate);
    },

    navigateNext() {
      if (this.currentView === 'month') {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      } else if (this.currentView === 'quarter') {
        this.currentDate.setMonth(this.currentDate.getMonth() + 3);
      } else {
        this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
      }
      this.currentDate = new Date(this.currentDate);
    },

    showEventDetails(event) {
      this.selectedEvent = event;
    },

    getDayClass(day) {
      let classes = [];
      if (!day.isCurrentMonth) classes.push('text-gray-400');
      if (day.isToday) classes.push('bg-blue-50');
      return classes.join(' ');
    },

    getEventClass(type) {
      const classes = {
        'milestone': 'bg-blue-100 text-blue-800',
        'gate_meeting': 'bg-green-100 text-green-800',
        'deadline': 'bg-red-100 text-red-800',
        'review': 'bg-purple-100 text-purple-800'
      };
      return classes[type] || 'bg-gray-100 text-gray-800';
    },

    formatEventDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    },

    resetNewEvent() {
      this.newEvent = {
        title: '',
        description: '',
        eventDate: '',
        type: 'milestone',
        projectId: '',
        category: 'planning'
      };
    }
  }
};
</script>

<style scoped>
.fiscal-year-calendar {
  @apply space-y-6;
}

.calendar-month .grid {
  min-height: 600px;
}
</style>

