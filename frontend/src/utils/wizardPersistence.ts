/**
 * Wizard State Persistence Utilities
 * Handles saving and restoring wizard state to/from localStorage and sessionStorage
 * Provides dirty tracking, auto-save, and recovery functionality
 */

import type { WizardProject, WizardInitiation, WizardAssignment, WizardOverview, WizardVendors, WizardBudget, WizardMilestone } from '@/stores/projectWizard'

// Storage keys
const STORAGE_KEYS = {
  WIZARD_STATE: 'pfmt_wizard_state',
  WIZARD_METADATA: 'pfmt_wizard_metadata',
  WIZARD_DRAFTS: 'pfmt_wizard_drafts',
  AUTO_SAVE_ENABLED: 'pfmt_wizard_autosave',
  LAST_ACTIVE_PROJECT: 'pfmt_wizard_last_project'
} as const

// Type definitions for persistence
export interface WizardStateSnapshot {
  projectId?: string
  timestamp: string
  userId: string
  userRole: string
  initiation: WizardInitiation
  assignment: WizardAssignment
  overview: WizardOverview
  vendors: WizardVendors
  budget: WizardBudget
  milestone1: WizardMilestone
  dirtySections: string[]
  workflowStatus?: string
}

export interface WizardMetadata {
  lastSavedAt: string
  lastAccessedAt: string
  version: string
  autoSaveEnabled: boolean
  sessionId: string
}

export interface WizardDraft {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  userId: string
  snapshot: WizardStateSnapshot
}

export interface PersistenceOptions {
  useSessionStorage?: boolean
  autoSave?: boolean
  maxDrafts?: number
  compressionEnabled?: boolean
}

export class WizardPersistence {
  private static readonly VERSION = '1.0.0'
  private static readonly MAX_DRAFTS = 10
  private static readonly STATE_TTL = 2 * 60 * 60 * 1000 // 2 hours in ms
  private static sessionId = this.generateSessionId()

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get storage instance based on options
   */
  private static getStorage(useSessionStorage = false): Storage {
    return useSessionStorage ? sessionStorage : localStorage
  }

  /**
   * Safely parse JSON with error handling
   */
  private static safeJsonParse<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json)
    } catch (error) {
      console.warn('Failed to parse JSON from storage:', error)
      return fallback
    }
  }

  /**
   * Safely stringify JSON with error handling
   */
  private static safeJsonStringify(data: any): string | null {
    try {
      return JSON.stringify(data)
    } catch (error) {
      console.error('Failed to stringify data for storage:', error)
      return null
    }
  }

  /**
   * Save wizard state snapshot
   */
  static saveState(
    snapshot: Omit<WizardStateSnapshot, 'timestamp' | 'userId' | 'userRole'>,
    userId: string,
    userRole: string,
    options: PersistenceOptions = {}
  ): boolean {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      
      const fullSnapshot: WizardStateSnapshot = {
        ...snapshot,
        timestamp: new Date().toISOString(),
        userId,
        userRole
      }

      const serialized = this.safeJsonStringify(fullSnapshot)
      if (!serialized) return false

      storage.setItem(STORAGE_KEYS.WIZARD_STATE, serialized)

      // Update metadata
      const metadata: WizardMetadata = {
        lastSavedAt: fullSnapshot.timestamp,
        lastAccessedAt: fullSnapshot.timestamp,
        version: this.VERSION,
        autoSaveEnabled: options.autoSave ?? true,
        sessionId: this.sessionId
      }

      const metadataSerialized = this.safeJsonStringify(metadata)
      if (metadataSerialized) {
        storage.setItem(STORAGE_KEYS.WIZARD_METADATA, metadataSerialized)
      }

      // Update last active project
      if (snapshot.projectId) {
        storage.setItem(STORAGE_KEYS.LAST_ACTIVE_PROJECT, snapshot.projectId)
      }

      console.log('💾 Wizard state saved successfully')
      return true

    } catch (error) {
      console.error('❌ Failed to save wizard state:', error)
      return false
    }
  }

  /**
   * Load wizard state snapshot
   */
  static loadState(options: PersistenceOptions = {}): WizardStateSnapshot | null {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      const serialized = storage.getItem(STORAGE_KEYS.WIZARD_STATE)

      if (!serialized) {
        console.log('📭 No saved wizard state found')
        return null
      }

      const metadata = this.loadMetadata(options)
      if (metadata) {
        const age = Date.now() - new Date(metadata.lastSavedAt).getTime()
        if (age > this.STATE_TTL) {
          console.log('📭 Saved wizard state expired')
          this.clearState(options)
          return null
        }
      }

      const snapshot = this.safeJsonParse<WizardStateSnapshot | null>(serialized, null)
      if (!snapshot) return null

      // Update last accessed time
      if (metadata) {
        metadata.lastAccessedAt = new Date().toISOString()
        const metadataSerialized = this.safeJsonStringify(metadata)
        if (metadataSerialized) {
          storage.setItem(STORAGE_KEYS.WIZARD_METADATA, metadataSerialized)
        }
      }

      console.log('📂 Wizard state loaded successfully')
      return snapshot

    } catch (error) {
      console.error('❌ Failed to load wizard state:', error)
      return null
    }
  }

  /**
   * Load wizard metadata
   */
  static loadMetadata(options: PersistenceOptions = {}): WizardMetadata | null {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      const serialized = storage.getItem(STORAGE_KEYS.WIZARD_METADATA)
      
      if (!serialized) return null

      return this.safeJsonParse<WizardMetadata | null>(serialized, null)

    } catch (error) {
      console.error('❌ Failed to load wizard metadata:', error)
      return null
    }
  }

  /**
   * Clear wizard state
   */
  static clearState(options: PersistenceOptions = {}): boolean {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      
      storage.removeItem(STORAGE_KEYS.WIZARD_STATE)
      storage.removeItem(STORAGE_KEYS.WIZARD_METADATA)
      storage.removeItem(STORAGE_KEYS.LAST_ACTIVE_PROJECT)

      console.log('🗑️ Wizard state cleared successfully')
      return true

    } catch (error) {
      console.error('❌ Failed to clear wizard state:', error)
      return false
    }
  }

  /**
   * Save draft with name
   */
  static saveDraft(
    name: string,
    description: string,
    snapshot: Omit<WizardStateSnapshot, 'timestamp' | 'userId' | 'userRole'>,
    userId: string,
    userRole: string,
    options: PersistenceOptions = {}
  ): boolean {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      const draftsJson = storage.getItem(STORAGE_KEYS.WIZARD_DRAFTS)
      const existingDrafts = this.safeJsonParse<WizardDraft[]>(draftsJson || '[]', [])

      const draft: WizardDraft = {
        id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId,
        snapshot: {
          ...snapshot,
          timestamp: new Date().toISOString(),
          userId,
          userRole
        }
      }

      // Add new draft and limit to max drafts
      const updatedDrafts = [draft, ...existingDrafts]
        .slice(0, options.maxDrafts ?? this.MAX_DRAFTS)

      const serialized = this.safeJsonStringify(updatedDrafts)
      if (!serialized) return false

      storage.setItem(STORAGE_KEYS.WIZARD_DRAFTS, serialized)

      console.log('💾 Wizard draft saved:', name)
      return true

    } catch (error) {
      console.error('❌ Failed to save wizard draft:', error)
      return false
    }
  }

  /**
   * Load all drafts for user
   */
  static loadDrafts(userId: string, options: PersistenceOptions = {}): WizardDraft[] {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      const draftsJson = storage.getItem(STORAGE_KEYS.WIZARD_DRAFTS)
      const allDrafts = this.safeJsonParse<WizardDraft[]>(draftsJson || '[]', [])

      // Filter drafts for current user
      return allDrafts.filter(draft => draft.userId === userId)

    } catch (error) {
      console.error('❌ Failed to load wizard drafts:', error)
      return []
    }
  }

  /**
   * Load specific draft by ID
   */
  static loadDraft(draftId: string, options: PersistenceOptions = {}): WizardDraft | null {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      const draftsJson = storage.getItem(STORAGE_KEYS.WIZARD_DRAFTS)
      const allDrafts = this.safeJsonParse<WizardDraft[]>(draftsJson || '[]', [])

      return allDrafts.find(draft => draft.id === draftId) || null

    } catch (error) {
      console.error('❌ Failed to load wizard draft:', error)
      return null
    }
  }

  /**
   * Delete draft by ID
   */
  static deleteDraft(draftId: string, options: PersistenceOptions = {}): boolean {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      const draftsJson = storage.getItem(STORAGE_KEYS.WIZARD_DRAFTS)
      const allDrafts = this.safeJsonParse<WizardDraft[]>(draftsJson || '[]', [])

      const updatedDrafts = allDrafts.filter(draft => draft.id !== draftId)

      const serialized = this.safeJsonStringify(updatedDrafts)
      if (!serialized) return false

      storage.setItem(STORAGE_KEYS.WIZARD_DRAFTS, serialized)

      console.log('🗑️ Wizard draft deleted:', draftId)
      return true

    } catch (error) {
      console.error('❌ Failed to delete wizard draft:', error)
      return false
    }
  }

  /**
   * Get auto-save preference
   */
  static getAutoSaveEnabled(options: PersistenceOptions = {}): boolean {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      const enabled = storage.getItem(STORAGE_KEYS.AUTO_SAVE_ENABLED)
      return enabled !== null ? enabled === 'true' : true // Default to enabled
    } catch (error) {
      console.error('❌ Failed to get auto-save preference:', error)
      return true
    }
  }

  /**
   * Set auto-save preference
   */
  static setAutoSaveEnabled(enabled: boolean, options: PersistenceOptions = {}): boolean {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      storage.setItem(STORAGE_KEYS.AUTO_SAVE_ENABLED, enabled.toString())
      return true
    } catch (error) {
      console.error('❌ Failed to set auto-save preference:', error)
      return false
    }
  }

  /**
   * Get last active project ID
   */
  static getLastActiveProject(options: PersistenceOptions = {}): string | null {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      return storage.getItem(STORAGE_KEYS.LAST_ACTIVE_PROJECT)
    } catch (error) {
      console.error('❌ Failed to get last active project:', error)
      return null
    }
  }

  /**
   * Check if state exists for recovery
   */
  static hasRecoverableState(options: PersistenceOptions = {}): boolean {
    const state = this.loadState(options)
    return state !== null
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(options: PersistenceOptions = {}): {
    hasState: boolean
    hasDrafts: boolean
    draftCount: number
    lastSavedAt: string | null
    storageSize: number
  } {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      const metadata = this.loadMetadata(options)
      const draftsJson = storage.getItem(STORAGE_KEYS.WIZARD_DRAFTS)
      const drafts = this.safeJsonParse<WizardDraft[]>(draftsJson || '[]', [])

      // Calculate approximate storage size
      let storageSize = 0
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = storage.getItem(key)
        if (item) {
          storageSize += item.length
        }
      })

      return {
        hasState: this.hasRecoverableState(options),
        hasDrafts: drafts.length > 0,
        draftCount: drafts.length,
        lastSavedAt: metadata?.lastSavedAt || null,
        storageSize
      }

    } catch (error) {
      console.error('❌ Failed to get storage info:', error)
      return {
        hasState: false,
        hasDrafts: false,
        draftCount: 0,
        lastSavedAt: null,
        storageSize: 0
      }
    }
  }

  /**
   * Clean up old drafts and expired state
   * @param maxAge Maximum age in ms before data is purged (defaults to STATE_TTL)
   */
  static cleanup(maxAge: number = this.STATE_TTL, options: PersistenceOptions = {}): boolean {
    try {
      const storage = this.getStorage(options.useSessionStorage)
      const cutoffDate = new Date(Date.now() - maxAge)

      // Clean up old drafts
      const draftsJson = storage.getItem(STORAGE_KEYS.WIZARD_DRAFTS)
      const allDrafts = this.safeJsonParse<WizardDraft[]>(draftsJson || '[]', [])
      
      const validDrafts = allDrafts.filter(draft => 
        new Date(draft.updatedAt) > cutoffDate
      )

      if (validDrafts.length !== allDrafts.length) {
        const serialized = this.safeJsonStringify(validDrafts)
        if (serialized) {
          storage.setItem(STORAGE_KEYS.WIZARD_DRAFTS, serialized)
        }
      }

      // Clean up old state if expired
      const metadata = this.loadMetadata(options)
      if (metadata && new Date(metadata.lastAccessedAt) < cutoffDate) {
        this.clearState(options)
      }

      console.log('🧹 Wizard storage cleanup completed')
      return true

    } catch (error) {
      console.error('❌ Failed to cleanup wizard storage:', error)
      return false
    }
  }

  /**
   * Export wizard data for backup
   */
  static exportData(userId: string, options: PersistenceOptions = {}): string | null {
    try {
      const state = this.loadState(options)
      const metadata = this.loadMetadata(options)
      const drafts = this.loadDrafts(userId, options)

      const exportData = {
        version: this.VERSION,
        exportedAt: new Date().toISOString(),
        userId,
        state,
        metadata,
        drafts
      }

      return this.safeJsonStringify(exportData)

    } catch (error) {
      console.error('❌ Failed to export wizard data:', error)
      return null
    }
  }

  /**
   * Import wizard data from backup
   */
  static importData(importJson: string, userId: string, options: PersistenceOptions = {}): boolean {
    try {
      const importData = this.safeJsonParse<any>(importJson, null)
      if (!importData || importData.userId !== userId) {
        console.error('Invalid import data or user mismatch')
        return false
      }

      const storage = this.getStorage(options.useSessionStorage)

      // Import state
      if (importData.state) {
        const serialized = this.safeJsonStringify(importData.state)
        if (serialized) {
          storage.setItem(STORAGE_KEYS.WIZARD_STATE, serialized)
        }
      }

      // Import metadata
      if (importData.metadata) {
        const serialized = this.safeJsonStringify(importData.metadata)
        if (serialized) {
          storage.setItem(STORAGE_KEYS.WIZARD_METADATA, serialized)
        }
      }

      // Import drafts
      if (importData.drafts && Array.isArray(importData.drafts)) {
        const serialized = this.safeJsonStringify(importData.drafts)
        if (serialized) {
          storage.setItem(STORAGE_KEYS.WIZARD_DRAFTS, serialized)
        }
      }

      console.log('📥 Wizard data imported successfully')
      return true

    } catch (error) {
      console.error('❌ Failed to import wizard data:', error)
      return false
    }
  }
}

// Export utility functions for easier use
export const wizardPersistence = WizardPersistence

export default WizardPersistence

