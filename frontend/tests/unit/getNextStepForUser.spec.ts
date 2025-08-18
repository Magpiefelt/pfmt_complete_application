import { describe, it, expect } from 'vitest'
import { ProjectWorkflowAPI } from '@/services/projectWorkflowApi'

describe('getNextStepForUser', () => {
  const projectId = 'test-project-id'
  const userId = 'test-user-id'

  it('returns wizard-initiate for PMI users', () => {
    const result = ProjectWorkflowAPI.getNextStepForUser(
      'pmi',
      'initiated',
      undefined,
      undefined,
      undefined,
      projectId
    )
    expect(result).toEqual({
      route: 'wizard-initiate',
      message: 'Initiate new project'
    })
  })

  it('returns wizard-assign for directors on initiated projects', () => {
    const result = ProjectWorkflowAPI.getNextStepForUser(
      'director',
      'initiated',
      undefined,
      undefined,
      undefined,
      projectId
    )
    expect(result).toEqual({
      route: 'wizard-assign',
      params: { projectId },
      message: 'Assign project team'
    })
  })

  it('returns wizard-config for assigned PM', () => {
    const result = ProjectWorkflowAPI.getNextStepForUser(
      'pm',
      'assigned',
      userId,
      undefined,
      userId,
      projectId
    )
    expect(result).toEqual({
      route: 'wizard-config',
      params: { projectId, substep: 'overview' },
      message: 'Configure project details'
    })
  })

  it('returns project-details when project is complete', () => {
    const result = ProjectWorkflowAPI.getNextStepForUser(
      'director',
      'complete',
      undefined,
      undefined,
      undefined,
      projectId
    )
    expect(result).toEqual({
      route: 'project-details',
      params: { id: projectId },
      message: 'Project is ready for management'
    })
  })
})
