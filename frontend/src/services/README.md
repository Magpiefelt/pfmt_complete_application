# Services

This directory contains service classes that handle API communication and external data operations.

## Services

### GateMeetingService.ts
Handles all gate meeting API operations:
- Fetch upcoming meetings with filtering
- Create, update, delete meetings
- Get meeting details
- Handle meeting status updates
- Proper error handling and type safety

### ProjectService.ts
Manages project-related API calls:
- Project CRUD operations
- Project search and filtering
- Project metadata operations
- File upload handling

### VersionService.ts
Handles project version operations:
- Version creation and management
- Draft submission workflow
- Approval/rejection processes
- Version comparison
- Version history

## Usage

Services provide a clean API abstraction layer:

```typescript
import { GateMeetingService } from '@/services/GateMeetingService'

// In a composable or component
const meetings = await GateMeetingService.getUpcoming({
  userRole: 'Project Manager',
  projectId: '123'
})
```

## Design Principles

- Services are stateless classes with static methods
- They handle all HTTP communication
- They provide proper TypeScript typing
- They include comprehensive error handling
- They abstract away API implementation details
- They return typed responses
- They handle authentication headers
- They provide consistent error formats

## Error Handling

All services follow consistent error handling:

```typescript
try {
  const result = await SomeService.someMethod()
  return result
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API errors
  } else {
    // Handle network/other errors
  }
}
```

