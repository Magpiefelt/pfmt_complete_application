# Project Detail Components

This directory contains modular components that make up the project detail page. Each component represents a tab or section of the project detail view.

## Components

### ProjectHeader.vue
The header section of the project detail page containing:
- Project title and basic info
- Contractor and phase information
- Version indicator
- Draft/approved view toggle

### Tab Components

Each tab is implemented as a separate component:

- **OverviewTab.vue** - Project overview and summary information
- **DetailsTab.vue** - Detailed project information and specifications
- **LocationTab.vue** - Project location and geographic data
- **VendorsTab.vue** - Vendor management and assignments
- **MilestonesTab.vue** - Gate meetings timeline and milestone tracking
- **BudgetTab.vue** - Budget information and financial tracking
- **ReportsTab.vue** - Project reports and analytics
- **WorkflowTab.vue** - Workflow management and task tracking
- **CalendarTab.vue** - Calendar view and scheduling
- **VersionsTab.vue** - Version history and management

## Usage

These components are used by the main `ProjectDetailPage.vue` component. Each tab component receives the following props:

```typescript
interface TabProps {
  project: Project
  viewMode: 'draft' | 'approved'
  hasDraftVersion: boolean
  canEdit: boolean
  userRole: string
}
```

## Design Principles

- Each component is self-contained and focused on a single responsibility
- Components use the Composition API with TypeScript
- Business logic is handled by composables, not directly in components
- API calls are made through services, not directly in components
- Components emit events for parent communication
- Props are used for data flow down from parent

## State Management

Components should not directly manage global state. Instead:
- Use composables for business logic
- Use services for API calls
- Emit events to communicate with parent
- Use props for data from parent

