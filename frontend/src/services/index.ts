// Export all services for easy importing
export { BaseService } from './BaseService'
export { ApiError } from './ApiError'
export { GateMeetingService } from './GateMeetingService'
export { ProjectService } from './ProjectService'
export { BudgetService } from './BudgetService'
export { WorkflowService } from './WorkflowService'

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

