# PFMT Application Architecture Documentation

## Overview

The PFMT (Project Financial Management Tool) application has been completely refactored from a monolithic Vue.js application into a modern, maintainable architecture following Vue.js 3 best practices with TypeScript, composables, and a clean separation of concerns.

## Architecture Principles

### 1. **Modular Component Design**
- Large monolithic components broken down into focused, single-responsibility components
- Each component handles one specific aspect of functionality
- Components are reusable and testable in isolation

### 2. **Composable-Driven Business Logic**
- Business logic extracted from components into reusable composables
- Centralized state management and data fetching
- Consistent behavior across components

### 3. **Service Layer Architecture**
- API calls abstracted into service classes
- Consistent error handling and request/response patterns
- Easy to mock and test

### 4. **Type Safety**
- Full TypeScript implementation throughout the application
- Proper interfaces and type definitions
- Compile-time error detection

## Project Structure

```
frontend/src/
├── components/
│   ├── project-detail/          # Modular project detail components
│   │   ├── ProjectHeader.vue
│   │   ├── OverviewTab.vue
│   │   ├── DetailsTab.vue
│   │   ├── LocationTab.vue
│   │   ├── BudgetTab.vue
│   │   ├── VendorsTab.vue
│   │   ├── MilestonesTab.vue
│   │   ├── VersionsTab.vue
│   │   └── ReportsTab.vue
│   ├── widgets/                 # Reusable UI widgets
│   ├── ui/                      # Base UI components
│   └── shared/                  # Shared components
├── composables/                 # Business logic composables
│   ├── useGateMeetings.ts
│   ├── useProjectVersions.ts
│   ├── useFormat.ts
│   └── useStatusBadge.ts
├── services/                    # API service layer
│   ├── BaseService.ts
│   ├── ApiError.ts
│   ├── ProjectService.ts
│   ├── GateMeetingService.ts
│   └── index.ts
├── pages/                       # Route components
├── stores/                      # Pinia state management
└── types/                       # TypeScript type definitions
```

## Key Components

### Modular Project Detail Architecture

The original monolithic `ProjectDetailPage.vue` (1001 lines) has been broken down into:

#### **ProjectHeader.vue** (~200 lines)
- **Purpose**: Project title, contractor info, version controls
- **Features**: Draft/approved toggle, action buttons, dropdown menu
- **Props**: Project data, view mode, permissions, version status
- **Events**: All header actions (create-draft, submit-for-approval, etc.)

#### **Tab Components** (~300-500 lines each)
1. **OverviewTab.vue** - Project summary and key metrics
2. **DetailsTab.vue** - Comprehensive project information form
3. **LocationTab.vue** - Address, coordinates, site information
4. **BudgetTab.vue** - Financial management and tracking
5. **VendorsTab.vue** - Vendor and contractor management
6. **MilestonesTab.vue** - Gate meetings timeline
7. **VersionsTab.vue** - Version control and approval workflow
8. **ReportsTab.vue** - Document management and reporting

### Composables Architecture

#### **useGateMeetings.ts**
```typescript
export function useGateMeetings() {
  const meetings = ref<GateMeeting[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const fetchProjectMeetings = async (projectId: string) => { ... }
  const createMeeting = async (meetingData: CreateMeetingData) => { ... }
  const completeMeeting = async (meetingId: string) => { ... }
  
  return {
    meetings,
    loading,
    error,
    fetchProjectMeetings,
    createMeeting,
    completeMeeting,
    formatMeetingDate,
    getMeetingStatus,
    getMeetingStatusClass
  }
}
```

#### **useProjectVersions.ts**
- Handles project version management
- Draft creation and approval workflow
- Version comparison and history

#### **useFormat.ts**
- Centralized formatting utilities
- Currency, date, and text formatting
- Consistent formatting across components

#### **useStatusBadge.ts**
- Status display logic
- CSS class generation for status indicators
- Consistent status visualization

### Service Layer Architecture

#### **BaseService.ts**
```typescript
export class BaseService {
  protected baseURL: string
  
  protected async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    // Centralized request handling
    // Authentication headers
    // Error handling
    // Response transformation
  }
}
```

#### **ProjectService.ts**
```typescript
export class ProjectService extends BaseService {
  static async getAll(filters?: ProjectFilters): Promise<Project[]>
  static async getById(id: string): Promise<Project>
  static async create(data: CreateProjectData): Promise<Project>
  static async update(id: string, data: UpdateProjectData): Promise<Project>
  static async delete(id: string): Promise<void>
}
```

## Data Flow Architecture

### 1. **Component → Composable → Service → API**
```
Component calls composable method
↓
Composable calls service method
↓
Service makes HTTP request
↓
API returns data
↓
Service processes response
↓
Composable updates reactive state
↓
Component automatically re-renders
```

### 2. **Event Flow**
```
User interaction in component
↓
Component emits event
↓
Parent component handles event
↓
Parent calls composable method
↓
Composable updates state
↓
All subscribed components react
```

## State Management

### Reactive State in Composables
- Each composable manages its own reactive state
- State is shared across components that use the same composable
- Automatic reactivity ensures UI stays in sync

### Pinia Stores
- Used for global application state
- Authentication state
- User preferences
- Cross-cutting concerns

## Error Handling

### Centralized Error Management
```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public type: ErrorType
  ) {
    super(message)
  }
}
```

### Error Boundaries
- Service layer catches and transforms API errors
- Composables handle business logic errors
- Components display user-friendly error messages

## Performance Optimizations

### 1. **Lazy Loading**
- All route components are lazy-loaded
- Reduces initial bundle size
- Faster application startup

### 2. **Component Splitting**
- Large components broken into smaller pieces
- Better tree-shaking and code splitting
- Improved development experience

### 3. **Efficient Reactivity**
- Computed properties for derived state
- Proper use of `ref` vs `reactive`
- Minimal re-renders through focused reactivity

## Testing Strategy

### 1. **Unit Testing**
- Composables can be tested in isolation
- Service classes are easily mockable
- Components have clear input/output contracts

### 2. **Integration Testing**
- Test composable + service integration
- Mock API responses for predictable testing
- Test component + composable integration

### 3. **E2E Testing**
- Test complete user workflows
- Verify cross-component communication
- Ensure proper state management

## Development Workflow

### 1. **Component Development**
```typescript
// 1. Define props and events interface
interface Props {
  project: Project
  canEdit: boolean
}

// 2. Use relevant composables
const { meetings, fetchMeetings } = useGateMeetings()

// 3. Handle user interactions
const handleSave = async () => {
  // Business logic handled by composable
}
```

### 2. **Adding New Features**
1. Create/update TypeScript interfaces
2. Add service methods if needed
3. Update or create composables
4. Create/update components
5. Add to routing if needed

## Security Considerations

### 1. **Authentication**
- JWT token-based authentication
- Automatic token refresh
- Role-based access control

### 2. **Authorization**
- Route-level permission checks
- Component-level permission props
- API-level authorization validation

### 3. **Data Validation**
- TypeScript compile-time validation
- Runtime validation in services
- Form validation in components

## Deployment Architecture

### Development
- Frontend: Vite dev server (port 5173)
- Backend: Node.js/Express (port 3002)
- Database: PostgreSQL

### Production
- Frontend: Static files served by CDN
- Backend: Node.js server with PM2
- Database: PostgreSQL with connection pooling

## Migration Benefits

### Before Refactoring
- ❌ Monolithic components (1000+ lines)
- ❌ Duplicate business logic across components
- ❌ Direct API calls in components
- ❌ Inconsistent error handling
- ❌ Difficult to test and maintain

### After Refactoring
- ✅ Modular components (200-500 lines each)
- ✅ Centralized business logic in composables
- ✅ Clean service layer abstraction
- ✅ Consistent error handling
- ✅ Easy to test and maintain
- ✅ Better developer experience
- ✅ Improved code reusability

## Future Enhancements

### 1. **Performance**
- Implement virtual scrolling for large lists
- Add service worker for offline functionality
- Optimize bundle splitting further

### 2. **Developer Experience**
- Add Storybook for component documentation
- Implement automated testing pipeline
- Add code generation tools

### 3. **Features**
- Real-time updates with WebSockets
- Advanced filtering and search
- Export/import functionality
- Mobile-responsive improvements

## Conclusion

The refactored PFMT application now follows modern Vue.js best practices with a clean, maintainable architecture. The separation of concerns, type safety, and modular design make it easy for teams to collaborate and extend the application with new features.

The architecture supports:
- **Scalability**: Easy to add new features and components
- **Maintainability**: Clear separation of concerns and single responsibility
- **Testability**: Isolated components and composables
- **Developer Experience**: Modern tooling and clear patterns
- **Performance**: Optimized loading and rendering strategies

