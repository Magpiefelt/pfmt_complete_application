import { describe, it, expect } from 'vitest'
import { ProjectWorkflowAPI } from '@/services/projectWorkflowApi'

describe('getNextStepForUser', () => {
  const projectId = 'test-project-id'
  const assignedPm = 'pm-user'
  const assignedSpm = 'spm-user'

  it('returns initiate route for PMI users', () => {
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

  it('returns assign route for director on initiated project', () => {
    const result = ProjectWorkflowAPI.getNextStepForUser(
      'director',
      'initiated',
      undefined,
      undefined,
      'director-user',
      projectId
    )

    expect(result).toEqual({
      route: 'wizard-assign',
      params: { projectId },
      message: 'Assign project team'
    })
  })

  it('returns config route for assigned PM', () => {
    const result = ProjectWorkflowAPI.getNextStepForUser(
      'pm',
      'assigned',
      assignedPm,
      assignedSpm,
      assignedPm,
      projectId
    )

    expect(result).toEqual({
      route: 'wizard-config',
      params: { projectId, substep: 'overview' },
      message: 'Configure project details'
    })
  })

  it('returns details route for finalized project', () => {
    const result = ProjectWorkflowAPI.getNextStepForUser(
      'pm',
      'finalized',
      assignedPm,
      assignedSpm,
      assignedPm,
      projectId
    )

    expect(result).toEqual({
      route: 'project-details',
      params: { id: projectId },
      message: 'Project is ready for management'
    })
  })
})
