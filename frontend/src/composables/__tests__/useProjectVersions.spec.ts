import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProjectVersions } from '../useProjectVersions'

// Mock fetch globally
global.fetch = vi.fn()

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    currentUser: {
      id: 1,
      name: 'Test User',
      role: 'Project Manager'
    }
  })
}))

describe('useProjectVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('role-based computed properties', () => {
    it('should determine if user can create draft', () => {
      const { canCreateDraft } = useProjectVersions()
      expect(canCreateDraft.value).toBe(true)
    })

    it('should determine if user can approve (Project Manager cannot)', () => {
      const { canApprove } = useProjectVersions()
      // Project Manager cannot approve, only Directors/SPMs can
      expect(canApprove.value).toBe(false)
    })

    it('should determine if user can edit when draft exists', () => {
      const { versions, canEdit } = useProjectVersions()
      
      versions.value = [
        { status: 'Draft', versionNumber: 2 }
      ] as any

      expect(canEdit.value).toBe(true)
    })

    it('should determine if user can submit for approval when draft exists', () => {
      const { versions, canSubmitForApproval } = useProjectVersions()
      
      versions.value = [
        { status: 'Draft', versionNumber: 2 }
      ] as any

      expect(canSubmitForApproval.value).toBe(true)
    })

    it('should detect draft versions', () => {
      const { versions, hasDraftVersion } = useProjectVersions()
      
      versions.value = [
        { status: 'Draft', versionNumber: 2 },
        { status: 'Approved', versionNumber: 1 }
      ] as any

      expect(hasDraftVersion.value).toBe(true)
    })

    it('should detect pending versions', () => {
      const { versions, hasPendingVersion } = useProjectVersions()
      
      versions.value = [
        { status: 'PendingApproval', versionNumber: 2 },
        { status: 'Approved', versionNumber: 1 }
      ] as any

      expect(hasPendingVersion.value).toBe(true)
    })

    it('should find latest draft', () => {
      const { versions, latestDraft } = useProjectVersions()
      
      const draftVersion = { status: 'Draft', versionNumber: 2 }
      versions.value = [
        draftVersion,
        { status: 'Approved', versionNumber: 1 }
      ] as any

      expect(latestDraft.value).toEqual(draftVersion)
    })

    it('should find latest pending', () => {
      const { versions, latestPending } = useProjectVersions()
      
      const pendingVersion = { status: 'PendingApproval', versionNumber: 2 }
      versions.value = [
        pendingVersion,
        { status: 'Approved', versionNumber: 1 }
      ] as any

      expect(latestPending.value).toEqual(pendingVersion)
    })
  })

  describe('getVersionHistory', () => {
    it('should fetch version history from phase2 API', async () => {
      const mockVersions = [
        {
          id: 1,
          project_id: 1,
          version_number: 1,
          status: 'Approved',
          created_by: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          version_data: {
            name: 'Test Project',
            description: 'Test Description',
            project_status: 'Active'
          }
        }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockVersions
        })
      })

      const { getVersionHistory, versions } = useProjectVersions()
      const result = await getVersionHistory(1)

      expect(result).toHaveLength(1)
      expect(versions.value).toHaveLength(1)
      expect(versions.value[0].status).toBe('Approved')
      expect(versions.value[0].name).toBe('Test Project')
      expect(versions.value[0].projectId).toBe(1)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3002/api/phase2/projects/1/versions', {
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-User-Id': '1',
          'X-User-Role': 'Project Manager',
          'X-User-Name': 'Test User'
        })
      })
    })

    it('should handle API errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Failed to get version history' } })
      })

      const { getVersionHistory, error } = useProjectVersions()
      const result = await getVersionHistory(1)

      expect(result).toHaveLength(0)
      expect(error.value).toBe('Failed to get version history')
    })
  })

  describe('createDraftVersion', () => {
    it('should create draft version with project data snapshot', async () => {
      const mockProject = {
        id: 1,
        projectName: 'Test Project',
        projectDescription: 'Test Description'
      }

      const mockDraft = {
        id: 2,
        project_id: 1,
        version_number: 2,
        status: 'Draft'
      }

      // Mock project fetch
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { project: mockProject }
        })
      })

      // Mock draft creation
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDraft })
      })

      const { createDraftVersion } = useProjectVersions()
      const result = await createDraftVersion(1)

      expect(result).toEqual(mockDraft)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3002/api/phase2/projects/1/versions', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-User-Id': '1',
          'X-User-Role': 'Project Manager',
          'X-User-Name': 'Test User'
        }),
        body: JSON.stringify({
          versionNumber: 1,
          dataSnapshot: mockProject,
          changeSummary: 'Draft version created'
        })
      })
    })
  })

  describe('submitForApproval', () => {
    it('should submit version for approval using new API', async () => {
      const mockSubmission = {
        id: 2,
        status: 'PendingApproval'
      }

      // Mock the actual submit call
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSubmission })
      })

      // Mock the getVersionHistory refresh call
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      })

      // Mock the getProject refresh call
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { project: { id: 1, projectName: 'Test Project' } }
        })
      })

      const { submitForApproval } = useProjectVersions()
      const result = await submitForApproval(1, 2)

      expect(result).toEqual(mockSubmission)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3002/api/phase2/versions/2/submit', {
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-User-Id': '1',
          'X-User-Role': 'Project Manager',
          'X-User-Name': 'Test User'
        })
      })
    })
  })

  describe('approveVersion', () => {
    it('should approve version using new API', async () => {
      const mockApproval = {
        id: 2,
        status: 'Approved'
      }

      // Mock the actual approve call
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockApproval })
      })

      // Mock the getVersionHistory refresh call
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      })

      // Mock the getProject refresh call
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { project: { id: 1, projectName: 'Test Project' } }
        })
      })

      const { approveVersion } = useProjectVersions()
      const result = await approveVersion(1, 2)

      expect(result).toEqual(mockApproval)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3002/api/phase2/versions/2/approve', {
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-User-Id': '1',
          'X-User-Role': 'Project Manager',
          'X-User-Name': 'Test User'
        })
      })
    })
  })

  describe('rejectVersion', () => {
    it('should reject version with reason using new API', async () => {
      const mockRejection = {
        id: 2,
        status: 'Rejected',
        rejection_reason: 'Insufficient documentation'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockRejection })
      })

      const { rejectVersion } = useProjectVersions()
      const result = await rejectVersion(1, 2, 'Insufficient documentation')

      expect(result).toEqual(mockRejection)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3002/api/phase2/versions/2/reject', {
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-User-Id': '1',
          'X-User-Role': 'Project Manager',
          'X-User-Name': 'Test User'
        }),
        body: JSON.stringify({ rejectionReason: 'Insufficient documentation' })
      })
    })
  })

  describe('compareVersions', () => {
    it('should compare versions using new API', async () => {
      const mockComparison = {
        version1: { id: 1, version_number: 1 },
        version2: { id: 2, version_number: 2 },
        differences: [{ field: 'name', oldValue: 'Old Name', newValue: 'New Name' }]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockComparison })
      })

      const { compareVersions } = useProjectVersions()
      const result = await compareVersions(1, 1, 2)

      expect(result).toEqual(mockComparison)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/phase2/projects/1/versions/compare?currentVersionId=1&compareVersionId=2',
        {
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-User-Id': '1',
            'X-User-Role': 'Project Manager',
            'X-User-Name': 'Test User'
          })
        }
      )
    })
  })

  describe('loading and error states', () => {
    it('should set loading state during API calls', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })

      ;(global.fetch as any).mockReturnValueOnce(promise)

      const { getVersionHistory, loading } = useProjectVersions()
      
      const versionPromise = getVersionHistory(1)
      expect(loading.value).toBe(true)

      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await versionPromise
      expect(loading.value).toBe(false)
    })

    it('should clear error state on successful operations', async () => {
      const { getVersionHistory, error } = useProjectVersions()
      
      // First call fails
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Error' } })
      })

      await getVersionHistory(1)
      expect(error.value).toBe('Error')

      // Second call succeeds
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await getVersionHistory(1)
      expect(error.value).toBe(null)
    })
  })
})

