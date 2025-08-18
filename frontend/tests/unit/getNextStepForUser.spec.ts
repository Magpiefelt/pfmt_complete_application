import { describe, it, expect } from 'vitest'
import { ProjectWorkflowAPI } from '@/services/projectWorkflowApi'

describe('getNextStepForUser', () => {
  const projectId = 'test-project-id'

  describe('PMI user role', () => {
    it('should return wizard-initiate for PMI users', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'pmi',
        'initiated',
        undefined,
        undefined,
        'user-1',
        projectId
      )

      expect(result).toEqual({
        route: 'wizard-initiate',
        message: 'Initiate new project'
      })
    })
  })

  describe('Director user role', () => {
    it('should return wizard-project-assign for initiated projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'director',
        'initiated',
        undefined,
        undefined,
        'director-user',
        projectId
      )

      expect(result).toEqual({
        route: 'wizard-project-assign',
        params: { projectId },
        message: 'Assign project team'
      })
    })

    it('should return project-detail for finalized projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'director',
        'finalized',
        undefined,
        undefined,
        'director-user',
        projectId
      )

      expect(result).toEqual({
        route: 'project-detail',
        params: { id: projectId },
        message: 'Project is ready for management'
      })
    })
  })

  describe('PM/SPM user roles', () => {
    it('should return wizard-project-configure for assigned projects (PM)', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'pm',
        'assigned',
        'pm-user',
        'spm-user',
        'pm-user',
        projectId
      )

      expect(result).toEqual({
        route: 'wizard-project-configure',
        params: { projectId, substep: 'overview' },
        message: 'Configure project details'
      })
    })

    it('should return wizard-project-configure for assigned projects (SPM)', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'spm',
        'assigned',
        'pm-user',
        'spm-user',
        'spm-user',
        projectId
      )

      expect(result).toEqual({
        route: 'wizard-project-configure',
        params: { projectId, substep: 'overview' },
        message: 'Configure project details'
      })
    })

    it('should return project-detail for finalized projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'pm',
        'finalized',
        'pm-user',
        'spm-user',
        'pm-user',
        projectId
      )

      expect(result).toEqual({
        route: 'project-detail',
        params: { id: projectId },
        message: 'Project is ready for management'
      })
    })
  })

  describe('Workflow status transitions', () => {
    it('should handle active status projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'pm',
        'active',
        undefined,
        undefined,
        'pm-user',
        projectId
      )

      expect(result).toEqual({
        route: 'project-detail',
        params: { id: projectId },
        message: 'Project is ready for management'
      })
    })

    it('should handle complete status projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'director',
        'complete',
        undefined,
        undefined,
        'director-user',
        projectId
      )

      expect(result).toEqual({
        route: 'project-detail',
        params: { id: projectId },
        message: 'Project is ready for management'
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle unknown workflow status', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'pm',
        'unknown' as any,
        undefined,
        undefined,
        'pm-user',
        projectId
      )

      expect(result).toEqual({
        route: 'project-detail',
        params: { id: projectId },
        message: 'View project details'
      })
    })

    it('should handle unknown user role', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'unknown' as any,
        'initiated',
        undefined,
        undefined,
        'user-1',
        projectId
      )

      expect(result).toEqual({
        route: 'project-detail',
        params: { id: projectId },
        message: 'View project details'
      })
    })

    it('should handle project without id', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'pm',
        'initiated',
        undefined,
        undefined,
        'pm-user'
      )

      expect(result?.route).toBe('project-detail')
      expect(result?.message).toBe('View project details')
    })
  })

  describe('Admin user role', () => {
    it('should handle admin users with initiated projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'admin',
        'initiated',
        undefined,
        undefined,
        'admin-user',
        projectId
      )

      expect(result).toEqual({
        route: 'wizard-project-assign',
        params: { projectId },
        message: 'Assign project team'
      })
    })

    it('should handle admin users with assigned projects', () => {
      const result = ProjectWorkflowAPI.getNextStepForUser(
        'admin',
        'assigned',
        'pm-user',
        'spm-user',
        'admin-user',
        projectId
      )

      expect(result).toEqual({
        route: 'wizard-project-configure',
        params: { projectId, substep: 'overview' },
        message: 'Configure project details'
      })
    })
  })
})

