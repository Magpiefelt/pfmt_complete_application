<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card>
      <CardContent class="p-4">
        <div class="flex items-center space-x-2">
          <Calendar class="h-5 w-5 text-blue-600" />
          <div>
            <p class="text-sm font-medium">Total Meetings</p>
            <p class="text-2xl font-bold">{{ totalMeetings }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-4">
        <div class="flex items-center space-x-2">
          <CheckCircle class="h-5 w-5 text-green-600" />
          <div>
            <p class="text-sm font-medium">Completed</p>
            <p class="text-2xl font-bold">{{ completedMeetings }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-4">
        <div class="flex items-center space-x-2">
          <Clock class="h-5 w-5 text-orange-600" />
          <div>
            <p class="text-sm font-medium">Upcoming</p>
            <p class="text-2xl font-bold">{{ upcomingMeetings }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-4">
        <div class="flex items-center space-x-2">
          <Target class="h-5 w-5 text-purple-600" />
          <div>
            <p class="text-sm font-medium">Milestones</p>
            <p class="text-2xl font-bold">{{ completedMilestones }}/{{ totalMilestones }}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Calendar, CheckCircle, Clock, Target } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui'

interface Props {
  totalMeetings: number
  completedMeetings: number
  upcomingMeetings: number
  totalMilestones: number
  completedMilestones: number
}

defineProps<Props>()
</script>

