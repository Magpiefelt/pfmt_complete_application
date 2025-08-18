import { apiService } from './apiService'

export interface User {
  id: string
  name: string
  email: string
  department?: string
  role?: string
  status?: string
  avatar?: string
}

export interface TeamMember {
  user_id: string
  name: string
  email: string
  avatar?: string
  role?: string
  period?: string
}

export interface ProjectTeam {
  id?: string
  project_id: string
  executive_director_id?: string
  director_id?: string
  sr_project_manager_id?: string
  project_manager_id?: string
  project_coordinator_id?: string
  contract_services_analyst_id?: string
  program_integration_analyst_id?: string
  additional_members?: TeamMember[]
  historical_members?: TeamMember[]
  
  // User objects for display
  executive_director?: User
  director?: User
  sr_project_manager?: User
  project_manager?: User
  project_coordinator?: User
  contract_services_analyst?: User
  program_integration_analyst?: User
  
  created_at?: string
  updated_at?: string
}

export interface UserSearchParams {
  q?: string
  role?: string
  department?: string
  limit?: number
}

class TeamService {
  /**
   * Get project team
   */
  async getProjectTeam(projectId: string): Promise<ProjectTeam> {
    try {
      const response = await apiService.get(`/teams/projects/${projectId}/team`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching project team:', error)
      throw new Error('Failed to fetch project team')
    }
  }

  /**
   * Update project team
   */
  async updateProjectTeam(projectId: string, teamData: Partial<ProjectTeam>): Promise<ProjectTeam> {
    try {
      const response = await apiService.put(`/teams/projects/${projectId}/team`, teamData)
      return response.data.data
    } catch (error) {
      console.error('Error updating project team:', error)
      throw new Error('Failed to update project team')
    }
  }

  /**
   * Add additional team member
   */
  async addAdditionalMember(projectId: string, userId: string, role?: string): Promise<TeamMember> {
    try {
      const response = await apiService.post(`/teams/projects/${projectId}/team/additional`, {
        user_id: userId,
        role
      })
      return response.data.data
    } catch (error) {
      console.error('Error adding additional team member:', error)
      throw new Error('Failed to add additional team member')
    }
  }

  /**
   * Remove additional team member
   */
  async removeAdditionalMember(projectId: string, memberId: string): Promise<void> {
    try {
      await apiService.delete(`/teams/projects/${projectId}/team/additional/${memberId}`)
    } catch (error) {
      console.error('Error removing additional team member:', error)
      throw new Error('Failed to remove additional team member')
    }
  }

  /**
   * Search users
   */
  async searchUsers(params: UserSearchParams = {}): Promise<User[]> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.q) queryParams.append('q', params.q)
      if (params.role) queryParams.append('role', params.role)
      if (params.department) queryParams.append('department', params.department)
      if (params.limit) queryParams.append('limit', params.limit.toString())
      
      const response = await apiService.get(`/teams/users/search?${queryParams.toString()}`)
      return response.data.data
    } catch (error) {
      console.error('Error searching users:', error)
      throw new Error('Failed to search users')
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string): Promise<User> {
    try {
      const response = await apiService.get(`/teams/users/${userId}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching user details:', error)
      throw new Error('Failed to fetch user details')
    }
  }

  /**
   * Get team roles
   */
  getTeamRoles(): string[] {
    return [
      'Executive Director',
      'Director',
      'Senior Project Manager',
      'Project Manager',
      'Project Coordinator',
      'Contract Services Analyst',
      'Program Integration Analyst'
    ]
  }

  /**
   * Get user departments
   */
  getUserDepartments(): string[] {
    return [
      'Infrastructure',
      'Education',
      'Health',
      'Justice',
      'Environment',
      'Transportation',
      'Finance',
      'Technology'
    ]
  }

  /**
   * Validate team assignment
   */
  validateTeamAssignment(team: Partial<ProjectTeam>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check for required roles (at least one of PM or SPM should be assigned)
    if (!team.project_manager_id && !team.sr_project_manager_id) {
      errors.push('At least one Project Manager or Senior Project Manager must be assigned')
    }

    // Check for duplicate assignments
    const assignedUsers = new Set()
    const roleFields = [
      'executive_director_id',
      'director_id',
      'sr_project_manager_id',
      'project_manager_id',
      'project_coordinator_id',
      'contract_services_analyst_id',
      'program_integration_analyst_id'
    ]

    roleFields.forEach(field => {
      const userId = team[field as keyof ProjectTeam] as string
      if (userId) {
        if (assignedUsers.has(userId)) {
          errors.push('A user cannot be assigned to multiple core team roles')
        }
        assignedUsers.add(userId)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Format team member display name
   */
  formatTeamMemberName(member: User | TeamMember): string {
    if ('name' in member) {
      return member.name
    }
    return 'Unknown User'
  }

  /**
   * Get team member initials
   */
  getTeamMemberInitials(member: User | TeamMember): string {
    const name = this.formatTeamMemberName(member)
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Check if user can edit team
   */
  canEditTeam(userRole: string): boolean {
    const allowedRoles = ['PM', 'SPM', 'Director', 'Admin']
    return allowedRoles.includes(userRole)
  }

  /**
   * Get team statistics
   */
  getTeamStatistics(team: ProjectTeam): {
    totalMembers: number
    coreMembers: number
    additionalMembers: number
    historicalMembers: number
  } {
    const coreRoles = [
      'executive_director_id',
      'director_id',
      'sr_project_manager_id',
      'project_manager_id',
      'project_coordinator_id',
      'contract_services_analyst_id',
      'program_integration_analyst_id'
    ]

    const coreMembers = coreRoles.filter(role => team[role as keyof ProjectTeam]).length
    const additionalMembers = team.additional_members?.length || 0
    const historicalMembers = team.historical_members?.length || 0

    return {
      totalMembers: coreMembers + additionalMembers,
      coreMembers,
      additionalMembers,
      historicalMembers
    }
  }
}

export const teamService = new TeamService()
export default teamService

