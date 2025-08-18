// Export all services for easy importing
export { BaseService } from './BaseService'
export { ApiError } from './ApiError'
export { GateMeetingService } from './GateMeetingService'
export { ProjectService } from './ProjectService'
export { BudgetService } from './BudgetService'
export { WorkflowService } from './WorkflowService'
export { VendorService } from './VendorService'
export { ProjectWizardService } from './projectWizardService'
export { default as TeamService } from './TeamService'
export { default as LocationService } from './LocationService'

// Export types
export type { CreateGateMeetingRequest, UpdateGateMeetingRequest, GateMeetingResponse } from './GateMeetingService'
export type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectFilters, 
  ProjectResponse 
} from './ProjectService'
export type { Budget, BudgetTransfer, BudgetFilters, BudgetReport } from './BudgetService'
export type { Task, Approval, Notification, WorkflowFilters, WorkflowMetrics } from './WorkflowService'
export type { 
  Vendor, 
  VendorProject, 
  CreateVendorData, 
  UpdateVendorData, 
  VendorFilters, 
  AssignToProjectData, 
  VendorListResponse 
} from './VendorService'
export type { 
  WizardSession,
  ProjectTemplate,
  TeamMember as WizardTeamMember,
  ValidationResult
} from './projectWizardService'
export type { 
  User, 
  TeamMember, 
  ProjectTeam, 
  UserSearchParams 
} from './TeamService'
export type { 
  Ministry, 
  Jurisdiction, 
  MLA, 
  ProjectLocation, 
  GeocodeResult 
} from './LocationService'

