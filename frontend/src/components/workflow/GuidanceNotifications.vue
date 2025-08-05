<template>
  <div class="guidance-notifications">
    <!-- Notifications Banner -->
    <div v-if="activeNotifications.length > 0" class="space-y-3 mb-6">
      <div
        v-for="notification in activeNotifications"
        :key="notification.id"
        :class="getNotificationClass(notification.priority)"
        class="rounded-lg p-4 border-l-4"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3 flex-1">
            <!-- Icon -->
            <div class="flex-shrink-0 mt-0.5">
              <component :is="getNotificationIcon(notification.type)" class="w-5 h-5" />
            </div>
            
            <!-- Content -->
            <div class="flex-1">
              <h4 class="font-semibold text-sm mb-1">{{ notification.title }}</h4>
              <p class="text-sm opacity-90 mb-3">{{ notification.message }}</p>
              
              <!-- Action Button -->
              <div v-if="notification.action_url && notification.action_label" class="flex items-center gap-3">
                <button
                  @click="handleNotificationAction(notification)"
                  class="inline-flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-colors"
                >
                  {{ notification.action_label }}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                <button
                  @click="markAsRead(notification.id)"
                  class="text-sm opacity-75 hover:opacity-100 underline transition-opacity"
                >
                  Mark as read
                </button>
              </div>
            </div>
          </div>
          
          <!-- Dismiss Button -->
          <button
            @click="dismissNotification(notification.id)"
            class="flex-shrink-0 ml-4 opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Notifications History (Collapsible) -->
    <div v-if="readNotifications.length > 0" class="bg-white rounded-lg shadow-sm border">
      <button
        @click="showHistory = !showHistory"
        class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="font-medium text-gray-900">Notification History</span>
          <span class="text-sm text-gray-500">({{ readNotifications.length }})</span>
        </div>
        <svg
          :class="{ 'rotate-180': showHistory }"
          class="w-5 h-5 text-gray-400 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      <div v-if="showHistory" class="border-t border-gray-200">
        <div class="divide-y divide-gray-100">
          <div
            v-for="notification in readNotifications"
            :key="notification.id"
            class="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 mt-0.5 opacity-60">
                <component :is="getNotificationIcon(notification.type)" class="w-4 h-4" />
              </div>
              <div class="flex-1">
                <h5 class="font-medium text-gray-900 text-sm">{{ notification.title }}</h5>
                <p class="text-gray-600 text-sm mt-1">{{ notification.message }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>{{ formatDate(notification.created_at) }}</span>
                  <span v-if="notification.project_name" class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    {{ notification.project_name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="activeNotifications.length === 0 && readNotifications.length === 0" class="text-center py-12">
      <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2z"></path>
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
      <p class="text-gray-500">You're all caught up! No pending actions or guidance needed.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GuidanceNotifications',
  props: {
    projectId: {
      type: String,
      default: 'all'
    }
  },
  data() {
    return {
      notifications: [],
      loading: false,
      showHistory: false
    };
  },
  computed: {
    activeNotifications() {
      return this.notifications.filter(n => !n.is_read && !n.is_dismissed);
    },
    readNotifications() {
      return this.notifications.filter(n => n.is_read || n.is_dismissed);
    }
  },
  async mounted() {
    await this.loadNotifications();
    // Set up polling for new notifications
    this.pollInterval = setInterval(this.loadNotifications, 30000); // Poll every 30 seconds
  },
  beforeUnmount() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  },
  methods: {
    async loadNotifications() {
      try {
        this.loading = true;
        const url = this.projectId === 'all' 
          ? '/api/phase2/guidance-notifications?includeRead=true'
          : `/api/phase2/projects/${this.projectId}/guidance-notifications?includeRead=true`;
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.notifications = data.data;
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        this.loading = false;
      }
    },

    async markAsRead(notificationId) {
      try {
        const response = await fetch(`/api/phase2/guidance-notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          // Update local state
          const notification = this.notifications.find(n => n.id === notificationId);
          if (notification) {
            notification.is_read = true;
          }
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
        this.$toast.error('Failed to mark notification as read');
      }
    },

    async dismissNotification(notificationId) {
      try {
        const response = await fetch(`/api/phase2/guidance-notifications/${notificationId}/dismiss`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.$store.getters.token}`
          }
        });
        
        if (response.ok) {
          // Update local state
          const notification = this.notifications.find(n => n.id === notificationId);
          if (notification) {
            notification.is_dismissed = true;
          }
        }
      } catch (error) {
        console.error('Error dismissing notification:', error);
        this.$toast.error('Failed to dismiss notification');
      }
    },

    handleNotificationAction(notification) {
      // Mark as read when action is taken
      this.markAsRead(notification.id);
      
      // Navigate to the action URL
      if (notification.action_url) {
        if (notification.action_url.startsWith('http')) {
          window.open(notification.action_url, '_blank');
        } else {
          this.$router.push(notification.action_url);
        }
      }
    },

    getNotificationClass(priority) {
      const classes = {
        'low': 'bg-blue-50 border-blue-400 text-blue-800',
        'medium': 'bg-yellow-50 border-yellow-400 text-yellow-800',
        'high': 'bg-orange-50 border-orange-400 text-orange-800',
        'urgent': 'bg-red-50 border-red-400 text-red-800'
      };
      return classes[priority] || classes.medium;
    },

    getNotificationIcon(type) {
      const icons = {
        'next_step': 'ArrowRightIcon',
        'approval_needed': 'ClockIcon',
        'deadline_approaching': 'ExclamationTriangleIcon',
        'action_required': 'BellIcon'
      };
      return icons[type] || 'InformationCircleIcon';
    },

    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`;
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  },
  components: {
    // Icon components (these would typically be imported from a library like Heroicons)
    ArrowRightIcon: {
      template: `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
        </svg>
      `
    },
    ClockIcon: {
      template: `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      `
    },
    ExclamationTriangleIcon: {
      template: `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      `
    },
    BellIcon: {
      template: `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2z"></path>
        </svg>
      `
    },
    InformationCircleIcon: {
      template: `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      `
    }
  }
};
</script>

<style scoped>
.guidance-notifications {
  @apply space-y-4;
}
</style>

