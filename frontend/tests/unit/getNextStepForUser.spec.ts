import { describe, it, expect } from 'vitest'
import { ProjectWorkflowAPI } from '@/services/projectWorkflowApi'

describe('getNextStepForUser', () => {
  const mockProject = {
    id: 'test-project-id',
    workflow_status: 'initiated',
    project_name: 'Test Project',
    created_by: 'user-1'
  }

  describe('PMI user role', () => {
    it('should return wizard-initiate for PMI users', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(mockProject, 'pmi')
      
      expect(result).toEqual({
        name: 'wizard-initiate',
        message: 'Initiate new project'
      })
    })
  })

  describe('Director user role', () => {
    it('should return wizard-assign for initiated projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        { ...mockProject, workflow_status: 'initiated' }, 
        'director'
      )
      
      expect(result).toEqual({
        name: 'wizard-assign',
        params: { projectId: 'test-project-id' },
        message: 'Assign project team'
      })
    })

    it('should return project-details for finalized projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        { ...mockProject, workflow_status: 'finalized' }, 
        'director'
      )
      
      expect(result).toEqual({
        name: 'project-details',
        params: { id: 'test-project-id' },
        message: 'Project is ready for management'
      })
    })
  })

  describe('PM/SPM user roles', () => {
    it('should return wizard-config for assigned projects (PM)', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        { ...mockProject, workflow_status: 'assigned' }, 
        'pm'
      )
      
      expect(result).toEqual({
        name: 'wizard-config',
        params: { projectId: 'test-project-id', substep: 'overview' },
        message: 'Configure project details'
      })
    })

    it('should return wizard-config for assigned projects (SPM)', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        { ...mockProject, workflow_status: 'assigned' }, 
        'spm'
      )
      
      expect(result).toEqual({
        name: 'wizard-config',
        params: { projectId: 'test-project-id', substep: 'overview' },
        message: 'Configure project details'
      })
    })

    it('should return project-details for finalized projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        { ...mockProject, workflow_status: 'finalized' }, 
        'pm'
      )
      
      expect(result).toEqual({
        name: 'project-details',
        params: { id: 'test-project-id' },
        message: 'Project is ready for management'
      })
    })
  })

  describe('Workflow status transitions', () => {
    it('should handle active status projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        { ...mockProject, workflow_status: 'active' }, 
        'pm'
      )
      
      expect(result).toEqual({
        name: 'project-details',
        params: { id: 'test-project-id' },
        message: 'Project is ready for management'
      })
    })

    it('should handle completed status projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        { ...mockProject, workflow_status: 'completed' }, 
        'director'
      )
      
      expect(result).toEqual({
        name: 'project-details',
        params: { id: 'test-project-id' },
        message: 'Project is ready for management'
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle unknown workflow status', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        { ...mockProject, workflow_status: 'unknown' as any }, 
        'pm'
      )
      
      expect(result).toEqual({
        name: 'project-details',
        params: { id: 'test-project-id' },
        message: 'Project is ready for management'
      })
    })

    it('should handle unknown user role', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        mockProject, 
        'unknown' as any
      )
      
      expect(result).toEqual({
        name: 'project-details',
        params: { id: 'test-project-id' },
        message: 'Project is ready for management'
      })
    })

    it('should handle project without id', () => {
      const projectWithoutId = { ...mockProject }
      delete projectWithoutId.id
      
      const result = ProjectWorkflowAPI.getNextStepForUser(
        projectWithoutId, 
        'pm'
      )
      
      expect(result.name).toBe('project-details')
      expect(result.message).toBe('Project is ready for management')
    })
  })

  describe('Admin user role', () => {
    it('should handle admin users with initiated projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        { ...mockProject, workflow_status: 'initiated' }, 
        'admin'
      )
      
      expect(result).toEqual({
        name: 'wizard-assign',
        params: { projectId: 'test-project-id' },
        message: 'Assign project team'
      })
    })

    it('should handle admin users with assigned projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        { ...mockProject, workflow_status: 'assigned' }, 
        'admin'
      )
      
      expect(result).toEqual({
        name: 'wizard-config',
        params: { projectId: 'test-project-id', substep: 'overview' },
        message: 'Configure project details'
      })
    })
  })
})

