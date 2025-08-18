<template>
  <Card>
    <CardHeader>
      <CardTitle>Gate Meetings Timeline</CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Empty State -->
      <div v-if="meetings.length === 0" class="text-center py-8">
        <Calendar class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500">No gate meetings scheduled yet.</p>
        <Button 
          v-if="canCreateMeetings" 
          variant="outline" 
          @click="$emit('create-meeting')"
          class="mt-4"
        >
          Schedule First Meeting
        </Button>
      </div>

      <!-- Meetings List -->
      <div v-else class="space-y-4">
        <MeetingCard
          v-for="meeting in sortedMeetings"
          :key="meeting.id"
          :meeting="meeting"
          :can-edit="canEditMeeting(meeting)"
          :can-complete="canCompleteMeeting(meeting)"
          :can-delete="canDeleteMeeting(meeting)"
          @view="$emit('view-meeting', meeting)"
          @edit="$emit('edit-meeting', meeting)"
          @complete="$emit('complete-meeting', meeting)"
          @delete="$emit('delete-meeting', meeting)"
        />
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import MeetingCard from './MeetingCard.vue'
import type { GateMeeting } from '@/composables/useGateMeetings'

interface Props {
  meetings: GateMeeting[]
  canCreateMeetings: boolean
  canEditMeeting: (meeting: GateMeeting) => boolean
  canCompleteMeeting: (meeting: GateMeeting) => boolean
  canDeleteMeeting: (meeting: GateMeeting) => boolean
}

const props = defineProps<Props>()

defineEmits<{
  'create-meeting': []
  'view-meeting': [meeting: GateMeeting]
  'edit-meeting': [meeting: GateMeeting]
  'complete-meeting': [meeting: GateMeeting]
  'delete-meeting': [meeting: GateMeeting]
}>()

const sortedMeetings = computed(() => 
  [...props.meetings].sort((a, b) => new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime())
)
</script>

