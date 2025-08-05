# Composables

This directory contains Vue 3 composable functions that encapsulate business logic and provide reusable functionality across components.

## Composables

### useGateMeetings.ts
Manages gate meeting operations including:
- Fetching gate meetings with role-based filtering
- Formatting planned dates ("Today", "Tomorrow", etc.)
- Calculating status categories (Overdue, Soon, Upcoming)
- CRUD operations for meetings
- Real-time status updates

### useProjectVersions.ts
Handles project version management:
- Draft creation, submission, approval, rejection
- Toggle between draft and approved views
- Access to current version and pending drafts
- Version comparison functionality

### useFormat.ts
Provides common formatting utilities:
- Date formatting (formatMeetingDate, formatRelativeDate)
- Currency formatting (formatCurrency)
- Number formatting (formatNumber)
- Status text formatting

### useStatusBadge.ts
Manages status display logic:
- Returns CSS classes for meeting status
- Returns CSS classes for version status
- Provides icons and colors for different states

## Usage

Composables follow the Vue 3 Composition API pattern:

```typescript
import { useGateMeetings } from '@/composables/useGateMeetings'

export default {
  setup() {
    const { 
      meetings, 
      upcomingMeetings, 
      fetchMeetings, 
      createMeeting 
    } = useGateMeetings()
    
    return {
      meetings,
      upcomingMeetings,
      fetchMeetings,
      createMeeting
    }
  }
}
```

## Design Principles

- Composables are pure functions that return reactive data and methods
- They handle business logic, not UI concerns
- They use services for API calls
- They provide reactive state that components can use
- They follow single responsibility principle
- They are testable and reusable

