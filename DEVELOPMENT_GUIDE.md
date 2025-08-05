# PFMT Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Git

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/Magpiefelt/pfmt_complete_application.git
cd pfmt_complete_application

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Set up database
sudo -u postgres psql << 'EOF'
CREATE DATABASE pfmt_db;
CREATE USER pfmt_user WITH ENCRYPTED PASSWORD 'pfmt_password';
GRANT ALL PRIVILEGES ON DATABASE pfmt_db TO pfmt_user;
EOF

# Apply database schema
PGPASSWORD=pfmt_password psql -h localhost -U pfmt_user -d pfmt_db -f ../database/schema.sql
PGPASSWORD=pfmt_password psql -h localhost -U pfmt_user -d pfmt_db -f ../database/sample_data.sql
```

### Running the Application
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3002

## Architecture Overview

The application follows a modern Vue.js 3 architecture with:
- **Composables** for business logic
- **Services** for API communication
- **Modular components** for UI
- **TypeScript** for type safety

## Development Patterns

### 1. Creating New Components

#### Component Structure
```vue
<template>
  <div class="component-name">
    <!-- Template content -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useComposableName } from '@/composables/useComposableName'

interface Props {
  // Define props with types
  data: SomeType
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'event-name': [payload: SomeType]
}>()

// Use composables for business logic
const { state, methods } = useComposableName()

// Local reactive state
const localState = ref('')

// Computed properties
const computedValue = computed(() => {
  return props.data.someProperty
})

// Methods
const handleAction = () => {
  emit('event-name', somePayload)
}

// Lifecycle
onMounted(() => {
  // Initialization logic
})
</script>
```

#### Component Guidelines
- Keep components focused on a single responsibility
- Use props for data input, events for communication
- Prefer composables over inline business logic
- Use TypeScript interfaces for all props and events

### 2. Creating Composables

#### Composable Structure
```typescript
// composables/useFeatureName.ts
import { ref, computed } from 'vue'
import { FeatureService } from '@/services/FeatureService'

export function useFeatureName() {
  // Reactive state
  const items = ref<Item[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const activeItems = computed(() => 
    items.value.filter(item => item.active)
  )

  // Methods
  const fetchItems = async () => {
    loading.value = true
    error.value = null
    
    try {
      const data = await FeatureService.getAll()
      items.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const createItem = async (itemData: CreateItemData) => {
    try {
      const newItem = await FeatureService.create(itemData)
      items.value.push(newItem)
      return newItem
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create item'
      throw err
    }
  }

  // Return public interface
  return {
    // State
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    activeItems,
    
    // Methods
    fetchItems,
    createItem
  }
}
```

#### Composable Guidelines
- Export a single function that returns an object
- Use `readonly()` for state that shouldn't be mutated externally
- Handle errors within the composable
- Provide both reactive state and methods
- Keep composables focused on a specific domain

### 3. Creating Services

#### Service Structure
```typescript
// services/FeatureService.ts
import { BaseService } from './BaseService'

export interface Feature {
  id: string
  name: string
  description: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreateFeatureData {
  name: string
  description: string
}

export interface UpdateFeatureData {
  name?: string
  description?: string
  active?: boolean
}

export class FeatureService extends BaseService {
  private static readonly endpoint = '/api/features'

  static async getAll(filters?: FeatureFilters): Promise<Feature[]> {
    const params = new URLSearchParams()
    if (filters?.active !== undefined) {
      params.append('active', filters.active.toString())
    }
    
    const response = await this.request<{ data: Feature[] }>(
      `${this.endpoint}?${params}`
    )
    return response.data
  }

  static async getById(id: string): Promise<Feature> {
    const response = await this.request<{ data: Feature }>(
      `${this.endpoint}/${id}`
    )
    return response.data
  }

  static async create(data: CreateFeatureData): Promise<Feature> {
    const response = await this.request<{ data: Feature }>(
      this.endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    )
    return response.data
  }

  static async update(id: string, data: UpdateFeatureData): Promise<Feature> {
    const response = await this.request<{ data: Feature }>(
      `${this.endpoint}/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data)
      }
    )
    return response.data
  }

  static async delete(id: string): Promise<void> {
    await this.request(`${this.endpoint}/${id}`, {
      method: 'DELETE'
    })
  }
}
```

#### Service Guidelines
- Extend `BaseService` for common functionality
- Define TypeScript interfaces for all data types
- Use static methods for stateless operations
- Handle HTTP methods appropriately (GET, POST, PATCH, DELETE)
- Transform API responses to match frontend interfaces

### 4. Adding New Features

#### Step-by-Step Process

1. **Define Types**
```typescript
// types/feature.ts
export interface Feature {
  id: string
  name: string
  // ... other properties
}
```

2. **Create Service**
```typescript
// services/FeatureService.ts
export class FeatureService extends BaseService {
  // ... service methods
}
```

3. **Create Composable**
```typescript
// composables/useFeature.ts
export function useFeature() {
  // ... composable logic
}
```

4. **Create Components**
```vue
<!-- components/feature/FeatureList.vue -->
<template>
  <!-- component template -->
</template>

<script setup lang="ts">
// component logic using composable
</script>
```

5. **Add Routes** (if needed)
```typescript
// router/index.ts
{
  path: '/features',
  name: 'features',
  component: () => import('@/pages/FeaturesPage.vue')
}
```

## Code Style Guidelines

### TypeScript
- Use interfaces for object shapes
- Use types for unions and primitives
- Always type function parameters and return values
- Use generic types where appropriate

### Vue.js
- Use Composition API with `<script setup>`
- Prefer `ref()` for primitives, `reactive()` for objects
- Use `computed()` for derived state
- Use `watch()` sparingly, prefer computed properties

### CSS
- Use Tailwind CSS classes for styling
- Create custom CSS classes only when necessary
- Follow BEM methodology for custom classes
- Use CSS variables for theme values

### Naming Conventions
- **Components**: PascalCase (e.g., `ProjectHeader.vue`)
- **Composables**: camelCase with "use" prefix (e.g., `useGateMeetings`)
- **Services**: PascalCase with "Service" suffix (e.g., `ProjectService`)
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case for non-components

## Testing Guidelines

### Unit Testing Components
```typescript
// tests/components/FeatureList.test.ts
import { mount } from '@vue/test-utils'
import FeatureList from '@/components/feature/FeatureList.vue'

describe('FeatureList', () => {
  it('renders features correctly', () => {
    const wrapper = mount(FeatureList, {
      props: {
        features: mockFeatures
      }
    })
    
    expect(wrapper.find('[data-testid="feature-item"]')).toBeTruthy()
  })
})
```

### Testing Composables
```typescript
// tests/composables/useFeature.test.ts
import { useFeature } from '@/composables/useFeature'

describe('useFeature', () => {
  it('fetches features correctly', async () => {
    const { features, fetchFeatures } = useFeature()
    
    await fetchFeatures()
    
    expect(features.value).toHaveLength(2)
  })
})
```

### Testing Services
```typescript
// tests/services/FeatureService.test.ts
import { FeatureService } from '@/services/FeatureService'

describe('FeatureService', () => {
  it('creates feature correctly', async () => {
    const mockData = { name: 'Test Feature', description: 'Test' }
    
    const result = await FeatureService.create(mockData)
    
    expect(result.name).toBe('Test Feature')
  })
})
```

## Common Patterns

### 1. Form Handling
```vue
<script setup lang="ts">
const formData = ref({
  name: '',
  description: ''
})

const { createItem, loading, error } = useFeature()

const handleSubmit = async () => {
  try {
    await createItem(formData.value)
    // Reset form or navigate
    formData.value = { name: '', description: '' }
  } catch (err) {
    // Error handled by composable
  }
}
</script>
```

### 2. List with Actions
```vue
<template>
  <div v-for="item in items" :key="item.id">
    <span>{{ item.name }}</span>
    <button @click="handleEdit(item)">Edit</button>
    <button @click="handleDelete(item.id)">Delete</button>
  </div>
</template>

<script setup lang="ts">
const { items, deleteItem } = useFeature()

const handleEdit = (item: Feature) => {
  // Navigate to edit page or open modal
}

const handleDelete = async (id: string) => {
  if (confirm('Are you sure?')) {
    await deleteItem(id)
  }
}
</script>
```

### 3. Loading States
```vue
<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <div v-else>
    <!-- Content -->
  </div>
</template>

<script setup lang="ts">
const { items, loading, error, fetchItems } = useFeature()

onMounted(() => {
  fetchItems()
})
</script>
```

## Debugging

### Vue DevTools
- Install Vue DevTools browser extension
- Inspect component state and props
- Monitor composable state changes
- Debug Pinia store state

### Network Debugging
- Use browser DevTools Network tab
- Check API request/response data
- Verify authentication headers
- Monitor WebSocket connections

### Console Debugging
```typescript
// In composables
console.log('Composable state:', { items: items.value, loading: loading.value })

// In components
console.log('Component props:', props)
console.log('Emitted event:', eventData)
```

## Performance Best Practices

### 1. Lazy Loading
```typescript
// Lazy load route components
const FeaturePage = () => import('@/pages/FeaturePage.vue')

// Lazy load heavy components
const HeavyChart = defineAsyncComponent(() => import('@/components/HeavyChart.vue'))
```

### 2. Computed Properties
```typescript
// Use computed for derived state
const filteredItems = computed(() => 
  items.value.filter(item => item.active)
)

// Avoid methods for derived state
const getFilteredItems = () => items.value.filter(item => item.active) // ❌
```

### 3. Event Handling
```vue
<!-- Use event modifiers -->
<form @submit.prevent="handleSubmit">
  <input @keyup.enter="handleEnter">
</form>

<!-- Avoid inline functions in templates -->
<button @click="() => handleClick(item.id)"> <!-- ❌ -->
<button @click="handleClick" :data-id="item.id"> <!-- ✅ -->
```

## Deployment

### Development Build
```bash
cd frontend
npm run build
```

### Production Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy backend
cd backend
pm2 start ecosystem.config.js
```

## Troubleshooting

### Common Issues

#### TypeScript Errors
- Check interface definitions
- Verify import paths
- Ensure proper type annotations

#### Component Not Updating
- Check reactive state usage
- Verify computed dependencies
- Ensure proper event emission

#### API Errors
- Check network requests in DevTools
- Verify authentication tokens
- Check backend logs

#### Build Errors
- Clear node_modules and reinstall
- Check for circular dependencies
- Verify import paths

## Resources

### Documentation
- [Vue.js 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools
- [Vue DevTools](https://devtools.vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Pinia Documentation](https://pinia.vuejs.org/)

## Contributing

1. Create a feature branch from `main`
2. Follow the coding guidelines
3. Write tests for new functionality
4. Update documentation as needed
5. Submit a pull request with clear description

## Support

For questions or issues:
1. Check this documentation
2. Search existing issues
3. Create a new issue with detailed description
4. Contact the development team

