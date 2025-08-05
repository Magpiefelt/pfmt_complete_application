# Widget Components

This directory contains reusable widget components used throughout the application.

## Components

### UpcomingGateMeetingsList.vue
Displays a list of upcoming gate meetings with:
- Meeting type and project information
- Scheduled dates with relative formatting ("Today", "Tomorrow", etc.)
- Color-coded status indicators (Overdue, Today, Soon, Upcoming)
- Role-based filtering and permissions

### QuickStatsCard.vue
A reusable card component for displaying key statistics and metrics.

### StatusBadge.vue
A standardized status badge component that displays status with appropriate colors and icons.

## Usage

These widgets are designed to be reusable across different pages:

```vue
<template>
  <UpcomingGateMeetingsList 
    :meetings="meetings"
    :user-role="userRole"
    @meeting-click="handleMeetingClick"
  />
</template>
```

## Design Principles

- Widgets are self-contained and reusable
- They use composables for business logic
- They emit events for parent communication
- They accept props for configuration
- They follow the Alberta Government design system

