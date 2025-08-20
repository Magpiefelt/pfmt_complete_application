import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectService } from '../ProjectService'

// Mock fetch globally
global.fetch = vi.fn()

describe('ProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all projects successfully', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1', status: 'active' },
        { id: 2, name: 'Project 2', status: 'complete' }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { projects: mockProjects }
        })
      })

      const result = await ProjectService.getAll()

      expect(result.projects).toEqual(mockProjects)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should apply filters correctly', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1', status: 'active' }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { projects: mockProjects }
        })
      })

      const filters = {
        status: 'active',
        search: 'Project 1',
        page: 1,
        limit: 10
      }

      await ProjectService.getAll(filters)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active&search=Project+1&page=1&limit=10'),
        expect.any(Object)
      )
    })

    it('should handle API errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { message: 'Internal server error' }
        })
      })

      await expect(ProjectService.getAll()).rejects.toThrow('Internal server error')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(ProjectService.getAll()).rejects.toThrow('Network error')
    })
  })

  describe('getById', () => {
    it('should fetch project by ID successfully', async () => {
      const mockProject = {
        id: 1,
        name: 'Test Project',
        description: 'Test Description',
        status: 'active'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockProject
        })
      })

      const result = await ProjectService.getById('1')

      expect(result).toEqual(mockProject)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1'),
        expect.objectContaining({
          method: 'GET'
        })
      )
    })

    it('should handle project not found', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { message: 'Project not found' }
        })
      })

      await expect(ProjectService.getById('999')).rejects.toThrow('Project not found')
    })
  })

  describe('create', () => {
    it('should create project successfully', async () => {
      const projectData = {
        name: 'New Project',
        description: 'New Description',
        status: 'active'
      }

      const mockCreatedProject = {
        id: 1,
        ...projectData,
        createdAt: '2024-01-01T00:00:00Z'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockCreatedProject
        })
      })

      const result = await ProjectService.create(projectData)

      expect(result).toEqual(mockCreatedProject)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(projectData)
        })
      )
    })

    it('should handle validation errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            message: 'Validation failed',
            details: [
              { field: 'name', message: 'Name is required' }
            ]
          }
        })
      })

      await expect(ProjectService.create({})).rejects.toThrow('Validation failed')
    })

    it('should handle duplicate project errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: { message: 'Project already exists' }
        })
      })

      const projectData = {
        name: 'Duplicate Project',
        cpdNumber: 'CPD-001'
      }

      await expect(ProjectService.create(projectData)).rejects.toThrow('Project already exists')
    })
  })

  describe('update', () => {
    it('should update project successfully', async () => {
      const updateData = {
        name: 'Updated Project',
        description: 'Updated Description'
      }

      const mockUpdatedProject = {
        id: 1,
        ...updateData,
        updatedAt: '2024-01-02T00:00:00Z'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdatedProject
        })
      })

      const result = await ProjectService.update('1', updateData)

      expect(result).toEqual(mockUpdatedProject)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(updateData)
        })
      )
    })

    it('should handle update of non-existent project', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { message: 'Project not found' }
        })
      })

      await expect(ProjectService.update('999', {})).rejects.toThrow('Project not found')
    })
  })

  describe('delete', () => {
    it('should delete project successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Project deleted successfully'
        })
      })

      await expect(ProjectService.delete('1')).resolves.toBeUndefined()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })

    it('should handle deletion of non-existent project', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { message: 'Project not found' }
        })
      })

      await expect(ProjectService.delete('999')).rejects.toThrow('Project not found')
    })
  })

  describe('getStatistics', () => {
    it('should fetch project statistics successfully', async () => {
      const mockStats = {
        total: 100,
        active: 75,
        completed: 20,
        on_hold: 5,
        by_phase: { planning: 30, construction: 45 },
        by_ministry: { education: 60, health: 40 },
        total_budget: 10000000,
        total_spent: 6000000
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockStats
        })
      })

      const result = await ProjectService.getStatistics()

      expect(result).toEqual(mockStats)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/statistics'),
        expect.objectContaining({
          method: 'GET'
        })
      )
    })
  })

  describe('search', () => {
    it('should search projects successfully', async () => {
      const mockProjects = [
        { id: 1, name: 'Search Result 1', status: 'active' }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { projects: mockProjects }
        })
      })

      const result = await ProjectService.search('test query')

      expect(result.projects).toEqual(mockProjects)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test+query'),
        expect.any(Object)
      )
    })
  })

  describe('getMyProjects', () => {
    it('should fetch user projects successfully', async () => {
      const mockProjects = [
        { id: 1, name: 'My Project 1', status: 'active' }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockProjects
        })
      })

      const result = await ProjectService.getMyProjects()

      expect(result).toEqual(mockProjects)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/my'),
        expect.any(Object)
      )
    })
  })

  describe('error handling', () => {
    it('should handle malformed JSON responses', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      await expect(ProjectService.getAll()).rejects.toThrow()
    })

    it('should handle API error responses', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          success: false,
          error: { message: 'Internal server error' }
        })
      })

      await expect(ProjectService.getAll()).rejects.toThrow('Internal server error')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(ProjectService.getAll()).rejects.toThrow('Network error')
    })
  })
})

