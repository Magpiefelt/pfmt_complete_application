/**
 * Wizard Persistence Composable
 * Integrates wizard persistence utilities with the Pinia store
 * Provides reactive persistence features and auto-save functionality
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useProjectWizardStore } from '@/stores/projectWizard'
import { useAuthStore } from '@/stores/auth'
import { WizardPersistence, type WizardStateSnapshot, type WizardDraft, type PersistenceOptions } from '@/utils/wizardPersistence'

export interface PersistenceState {
  isAutoSaveEnabled: boolean
  lastSavedAt: string | null
  hasUnsavedChanges: boolean
  hasRecoverableState: boolean
  storageInfo: {
    hasState: boolean
    hasDrafts: boolean
    draftCount: number
    lastSavedAt: string | null
    storageSize: number
  }
}

export interface AutoSaveConfig {
  enabled: boolean
  interval: number // milliseconds
  onlyWhenDirty: boolean
  maxRetries: number
}

export function useWizardPersistence(options: PersistenceOptions = {}) {
  const wizardStore = useProjectWizardStore()
  const authStore = useAuthStore()

  // Reactive state
  const isAutoSaveEnabled = ref(WizardPersistence.getAutoSaveEnabled(options))
  const lastSavedAt = ref<string | null>(null)
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)
  const autoSaveTimer = ref<NodeJS.Timeout | null>(null)
  const drafts = ref<WizardDraft[]>([])

  // Auto-save configuration
  const autoSaveConfig = ref<AutoSaveConfig>({
    enabled: true,
    interval: 30000, // 30 seconds
    onlyWhenDirty: true,
    maxRetries: 3
  })

  // Computed properties
  const persistenceState = computed((): PersistenceState => ({
    isAutoSaveEnabled: isAutoSaveEnabled.value,
    lastSavedAt: lastSavedAt.value,
    hasUnsavedChanges: wizardStore.hasUnsavedChanges,
    hasRecoverableState: WizardPersistence.hasRecoverableState(options),
    storageInfo: WizardPersistence.getStorageInfo(options)
  }))

  const canSave = computed(() => 
    !isSaving.value && 
    authStore.currentUser && 
    (wizardStore.project?.id || wizardStore.initiation.name)
  )

  const shouldAutoSave = computed(() => 
    isAutoSaveEnabled.value &&
    autoSaveConfig.value.enabled &&
    canSave.value &&
    (!autoSaveConfig.value.onlyWhenDirty || wizardStore.hasUnsavedChanges)
  )

  // Create state snapshot from current wizard state
  const createStateSnapshot = (): Omit<WizardStateSnapshot, 'timestamp' | 'userId' | 'userRole'> => {
    return {
      projectId: wizardStore.project?.id,
      initiation: { ...wizardStore.initiation },
      assignment: { ...wizardStore.assignment },
      overview: { ...wizardStore.overview },
      vendors: { ...wizardStore.vendors },
      budget: { ...wizardStore.budget },
      milestone1: { ...wizardStore.milestone1 },
      dirtySections: Array.from(wizardStore.dirty),
      workflowStatus: wizardStore.project?.workflow_status
    }
  }

  // Apply state snapshot to wizard store
  const applyStateSnapshot = (snapshot: WizardStateSnapshot) => {
    // Apply state to wizard store
    Object.assign(wizardStore.initiation, snapshot.initiation)
    Object.assign(wizardStore.assignment, snapshot.assignment)
    Object.assign(wizardStore.overview, snapshot.overview)
    Object.assign(wizardStore.vendors, snapshot.vendors)
    Object.assign(wizardStore.budget, snapshot.budget)
    Object.assign(wizardStore.milestone1, snapshot.milestone1)

    // Restore dirty state
    wizardStore.clearAllDirty()
    snapshot.dirtySections.forEach(section => {
      wizardStore.markDirty(section)
    })

    // If we have a project ID, load the full project
    if (snapshot.projectId) {
      wizardStore.loadProject(snapshot.projectId)
    }
  }

  // Save current state
  const saveState = async (): Promise<boolean> => {
    if (!authStore.currentUser || isSaving.value) {
      return false
    }

    isSaving.value = true
    saveError.value = null

    try {
      const snapshot = createStateSnapshot()
      const success = WizardPersistence.saveState(
        snapshot,
        authStore.currentUser.id.toString(),
        authStore.currentUser.role,
        options
      )

      if (success) {
        lastSavedAt.value = new Date().toISOString()
        console.log('💾 Wizard state saved successfully')
      } else {
        throw new Error('Failed to save wizard state')
      }

      return success

    } catch (error: any) {
      console.error('❌ Failed to save wizard state:', error)
      saveError.value = error.message || 'Failed to save wizard state'
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Load saved state
  const loadState = async (): Promise<boolean> => {
    if (!authStore.currentUser) {
      return false
    }

    try {
      const snapshot = WizardPersistence.loadState(options)
      
      if (!snapshot) {
        console.log('📭 No saved wizard state found')
        return false
      }

      // Verify the state belongs to current user
      if (snapshot.userId !== authStore.currentUser.id.toString()) {
        console.warn('⚠️ Saved state belongs to different user, ignoring')
        return false
      }

      applyStateSnapshot(snapshot)
      lastSavedAt.value = snapshot.timestamp

      console.log('📂 Wizard state loaded successfully')
      return true

    } catch (error: any) {
      console.error('❌ Failed to load wizard state:', error)
      return false
    }
  }

  // Clear saved state
  const clearState = async (): Promise<boolean> => {
    try {
      const success = WizardPersistence.clearState(options)
      if (success) {
        lastSavedAt.value = null
        console.log('🗑️ Wizard state cleared successfully')
      }
      return success
    } catch (error: any) {
      console.error('❌ Failed to clear wizard state:', error)
      return false
    }
  }

  // Save as draft
  const saveDraft = async (name: string, description: string = ''): Promise<boolean> => {
    if (!authStore.currentUser) {
      return false
    }

    try {
      const snapshot = createStateSnapshot()
      const success = WizardPersistence.saveDraft(
        name,
        description,
        snapshot,
        authStore.currentUser.id.toString(),
        authStore.currentUser.role,
        options
      )

      if (success) {
        await loadDrafts() // Refresh drafts list
        console.log('💾 Draft saved successfully:', name)
      }

      return success

    } catch (error: any) {
      console.error('❌ Failed to save draft:', error)
      return false
    }
  }

  // Load draft by ID
  const loadDraft = async (draftId: string): Promise<boolean> => {
    try {
      const draft = WizardPersistence.loadDraft(draftId, options)
      
      if (!draft) {
        console.error('Draft not found:', draftId)
        return false
      }

      applyStateSnapshot(draft.snapshot)
      console.log('📂 Draft loaded successfully:', draft.name)
      return true

    } catch (error: any) {
      console.error('❌ Failed to load draft:', error)
      return false
    }
  }

  // Load all drafts for current user
  const loadDrafts = async (): Promise<WizardDraft[]> => {
    if (!authStore.currentUser) {
      return []
    }

    try {
      const userDrafts = WizardPersistence.loadDrafts(
        authStore.currentUser.id.toString(),
        options
      )
      
      drafts.value = userDrafts
      return userDrafts

    } catch (error: any) {
      console.error('❌ Failed to load drafts:', error)
      return []
    }
  }

  // Delete draft
  const deleteDraft = async (draftId: string): Promise<boolean> => {
    try {
      const success = WizardPersistence.deleteDraft(draftId, options)
      
      if (success) {
        await loadDrafts() // Refresh drafts list
        console.log('🗑️ Draft deleted successfully')
      }

      return success

    } catch (error: any) {
      console.error('❌ Failed to delete draft:', error)
      return false
    }
  }

  // Toggle auto-save
  const toggleAutoSave = (enabled?: boolean): boolean => {
    const newState = enabled !== undefined ? enabled : !isAutoSaveEnabled.value
    isAutoSaveEnabled.value = newState
    WizardPersistence.setAutoSaveEnabled(newState, options)
    
    if (newState) {
      startAutoSave()
    } else {
      stopAutoSave()
    }

    console.log(`🔄 Auto-save ${newState ? 'enabled' : 'disabled'}`)
    return newState
  }

  // Start auto-save timer
  const startAutoSave = () => {
    if (autoSaveTimer.value) {
      clearInterval(autoSaveTimer.value)
    }

    if (!isAutoSaveEnabled.value || !autoSaveConfig.value.enabled) {
      return
    }

    autoSaveTimer.value = setInterval(async () => {
      if (shouldAutoSave.value) {
        console.log('🔄 Auto-saving wizard state...')
        await saveState()
      }
    }, autoSaveConfig.value.interval)

    console.log('⏰ Auto-save timer started')
  }

  // Stop auto-save timer
  const stopAutoSave = () => {
    if (autoSaveTimer.value) {
      clearInterval(autoSaveTimer.value)
      autoSaveTimer.value = null
      console.log('⏹️ Auto-save timer stopped')
    }
  }

  // Export wizard data
  const exportData = (): string | null => {
    if (!authStore.currentUser) {
      return null
    }

    return WizardPersistence.exportData(
      authStore.currentUser.id.toString(),
      options
    )
  }

  // Import wizard data
  const importData = (importJson: string): boolean => {
    if (!authStore.currentUser) {
      return false
    }

    const success = WizardPersistence.importData(
      importJson,
      authStore.currentUser.id.toString(),
      options
    )

    if (success) {
      // Reload state and drafts
      loadState()
      loadDrafts()
    }

    return success
  }

  // Cleanup old data
  const cleanup = (maxAge?: number): boolean => {
    return WizardPersistence.cleanup(maxAge, options)
  }

  // Setup watchers and lifecycle
  const setupPersistence = () => {
    // Watch for user changes
    watch(
      () => authStore.currentUser,
      async (newUser, oldUser) => {
        if (newUser && newUser.id !== oldUser?.id) {
          // User changed, load their state and drafts
          await loadState()
          await loadDrafts()
        }
      },
      { immediate: true }
    )

    // Watch for auto-save config changes
    watch(
      () => autoSaveConfig.value.enabled,
      (enabled) => {
        if (enabled && isAutoSaveEnabled.value) {
          startAutoSave()
        } else {
          stopAutoSave()
        }
      }
    )

    // Start auto-save if enabled
    if (isAutoSaveEnabled.value && autoSaveConfig.value.enabled) {
      startAutoSave()
    }

    console.log('🔧 Wizard persistence setup completed')
  }

  // Cleanup on unmount
  const cleanupPersistence = () => {
    stopAutoSave()
    console.log('🧹 Wizard persistence cleanup completed')
  }

  // Initialize on mount
  onMounted(() => {
    setupPersistence()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    cleanupPersistence()
  })

  return {
    // State
    persistenceState,
    isSaving,
    saveError,
    drafts,
    autoSaveConfig,
    
    // Computed
    canSave,
    shouldAutoSave,
    
    // Actions
    saveState,
    loadState,
    clearState,
    saveDraft,
    loadDraft,
    loadDrafts,
    deleteDraft,
    toggleAutoSave,
    startAutoSave,
    stopAutoSave,
    exportData,
    importData,
    cleanup,
    
    // Lifecycle
    setupPersistence,
    cleanupPersistence
  }
}

