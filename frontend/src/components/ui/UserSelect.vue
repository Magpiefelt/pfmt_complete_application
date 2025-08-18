<template>
  <div class="relative">
    <Popover v-model:open="open">
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          :class="cn('w-full justify-between', className)"
          :disabled="disabled"
        >
          <div v-if="selectedUser" class="flex items-center space-x-2">
            <Avatar class="h-6 w-6">
              <AvatarImage :src="selectedUser.avatar" />
              <AvatarFallback>{{ getInitials(selectedUser.name) }}</AvatarFallback>
            </Avatar>
            <span>{{ selectedUser.name }}</span>
          </div>
          <span v-else class="text-muted-foreground">{{ placeholder }}</span>
          <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-full p-0" align="start">
        <Command>
          <CommandInput 
            :placeholder="searchPlaceholder" 
            v-model="searchQuery"
            @input="handleSearch"
          />
          <CommandEmpty>
            <div v-if="loading" class="flex items-center justify-center py-4">
              <Loader2 class="h-4 w-4 animate-spin" />
              <span class="ml-2">Searching...</span>
            </div>
            <div v-else>No users found.</div>
          </CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="user in filteredUsers"
              :key="user.id"
              :value="user.id"
              @select="selectUser(user)"
              class="flex items-center space-x-2"
            >
              <Avatar class="h-6 w-6">
                <AvatarImage :src="user.avatar" />
                <AvatarFallback>{{ getInitials(user.name) }}</AvatarFallback>
              </Avatar>
              <div class="flex-1">
                <div class="font-medium">{{ user.name }}</div>
                <div class="text-sm text-muted-foreground">{{ user.email }}</div>
                <div v-if="user.department" class="text-xs text-muted-foreground">
                  {{ user.department }}
                </div>
              </div>
              <Check
                :class="cn(
                  'ml-auto h-4 w-4',
                  modelValue === user.id ? 'opacity-100' : 'opacity-0'
                )"
              />
            </CommandItem>
          </CommandGroup>
          
          <!-- Clear Selection Option -->
          <CommandGroup v-if="modelValue && !required">
            <CommandItem
              value=""
              @select="clearSelection"
              class="text-muted-foreground"
            >
              <X class="mr-2 h-4 w-4" />
              Clear selection
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  department?: string
  role?: string
  status?: 'active' | 'inactive'
}

interface Props {
  modelValue?: string
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  currentUser?: User
  filterRole?: string
  filterDepartment?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select user...',
  searchPlaceholder: 'Search users...',
  disabled: false,
  required: false,
  className: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

// State
const open = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const users = ref<User[]>([])

// Computed
const selectedUser = computed(() => {
  if (props.currentUser) return props.currentUser
  return users.value.find(user => user.id === props.modelValue)
})

const filteredUsers = computed(() => {
  let filtered = users.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.department && user.department.toLowerCase().includes(query))
    )
  }

  // Filter by role if specified
  if (props.filterRole) {
    filtered = filtered.filter(user => user.role === props.filterRole)
  }

  // Filter by department if specified
  if (props.filterDepartment) {
    filtered = filtered.filter(user => user.department === props.filterDepartment)
  }

  // Filter out inactive users
  filtered = filtered.filter(user => user.status !== 'inactive')

  return filtered
})

// Methods
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const selectUser = (user: User) => {
  emit('update:modelValue', user.id)
  open.value = false
  searchQuery.value = ''
}

const clearSelection = () => {
  emit('update:modelValue', undefined)
  open.value = false
  searchQuery.value = ''
}

const handleSearch = async () => {
  if (searchQuery.value.length < 2) return
  
  loading.value = true
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // In a real implementation, this would be an API call
    await fetchUsers(searchQuery.value)
  } catch (error) {
    console.error('Error searching users:', error)
  } finally {
    loading.value = false
  }
}

const fetchUsers = async (query?: string) => {
  try {
    // Mock data - replace with actual API call
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@gov.ab.ca',
        department: 'Infrastructure',
        role: 'Project Manager',
        status: 'active',
        avatar: ''
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@gov.ab.ca',
        department: 'Infrastructure',
        role: 'Director',
        status: 'active',
        avatar: ''
      },
      {
        id: '3',
        name: 'Mike Wilson',
        email: 'mike.wilson@gov.ab.ca',
        department: 'Infrastructure',
        role: 'Senior Project Manager',
        status: 'active',
        avatar: ''
      },
      {
        id: '4',
        name: 'Lisa Brown',
        email: 'lisa.brown@gov.ab.ca',
        department: 'Infrastructure',
        role: 'Executive Director',
        status: 'active',
        avatar: ''
      },
      {
        id: '5',
        name: 'David Lee',
        email: 'david.lee@gov.ab.ca',
        department: 'Infrastructure',
        role: 'Project Coordinator',
        status: 'active',
        avatar: ''
      }
    ]

    // Filter by query if provided
    if (query) {
      const filtered = mockUsers.filter(user =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      )
      users.value = [...users.value, ...filtered.filter(u => !users.value.find(existing => existing.id === u.id))]
    } else {
      users.value = mockUsers
    }
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

// Watch for search query changes
watch(searchQuery, (newQuery) => {
  if (newQuery.length >= 2) {
    handleSearch()
  }
})

// Load initial users
onMounted(() => {
  fetchUsers()
})
</script>

