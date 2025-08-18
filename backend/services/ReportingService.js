/**
 * Reporting Service
 * Business logic for reporting and analytics functionality
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');

class ReportingService {
    /**
     * Get project status dashboard data
     */
    static async getProjectStatusDashboard(userId = null, filters = {}) {
        try {
            // Base query for project counts by status
            let statusQuery = `
                SELECT status, COUNT(*) as count
                FROM projects
                WHERE 1=1
            `;
            const statusParams = [];
            let paramCount = 0;
            
            // Apply user filter if provided
            if (userId && filters.userProjects) {
                paramCount++;
                statusQuery += ` AND (project_manager_id = $${paramCount} OR created_by = $${paramCount})`;
                statusParams.push(userId);
            }
            
            statusQuery += ` GROUP BY status ORDER BY status`;
            
            const statusResult = await query(statusQuery, statusParams);
            
            // Get project counts by priority
            let priorityQuery = `
                SELECT priority, COUNT(*) as count
                FROM projects
                WHERE priority IS NOT NULL
            `;
            const priorityParams = [];
            let priorityParamCount = 0;
            
            if (userId && filters.userProjects) {
                priorityParamCount++;
                priorityQuery += ` AND (project_manager_id = $${priorityParamCount} OR created_by = $${priorityParamCount})`;
                priorityParams.push(userId);
            }
            
            priorityQuery += ` GROUP BY priority ORDER BY priority`;
            
            const priorityResult = await query(priorityQuery, priorityParams);
            
            // Get recent projects
            let recentQuery = `
                SELECT p.project_name, p.project_code, p.status, p.priority, p.created_at,
                       u.first_name || ' ' || u.last_name as manager_name
                FROM projects p
                LEFT JOIN users u ON p.project_manager_id = u.id
                WHERE 1=1
            `;
            const recentParams = [];
            let recentParamCount = 0;
            
            if (userId && filters.userProjects) {
                recentParamCount++;
                recentQuery += ` AND (p.project_manager_id = $${recentParamCount} OR p.created_by = $${recentParamCount})`;
                recentParams.push(userId);
            }
            
            recentQuery += ` ORDER BY p.created_at DESC LIMIT 10`;
            
            const recentProjectsResult = await query(recentQuery, recentParams);
            
            // Get upcoming gate meetings
            const upcomingMeetingsResult = await query(`
                SELECT gm.gate_name, gm.scheduled_date, gm.status,
                       p.project_name, p.project_code
                FROM gate_meetings gm
                JOIN projects p ON gm.project_id = p.id
                WHERE gm.scheduled_date >= CURRENT_DATE AND gm.status = 'Scheduled'
                ORDER BY gm.scheduled_date
                LIMIT 10
            `);
            
            return {
                projectsByStatus: statusResult.rows,
                projectsByPriority: priorityResult.rows,
                recentProjects: recentProjectsResult.rows,
                upcomingMeetings: upcomingMeetingsResult.rows
            };
        } catch (error) {
            console.error('Error getting project status dashboard:', error);
            throw error;
        }
    }

    /**
     * Get monthly project summary
     */
    static async getMonthlyProjectSummary(year, month, userId = null) {
        try {
            const params = [year, month];
            let userFilter = '';
            
            if (userId) {
                userFilter = ' AND (project_manager_id = $3 OR created_by = $3)';
                params.push(userId);
            }
            
            // Projects created this month
            const newProjectsResult = await query(`
                SELECT COUNT(*) as count
                FROM projects
                WHERE EXTRACT(YEAR FROM created_at) = $1 
                AND EXTRACT(MONTH FROM created_at) = $2
                ${userFilter}
            `, params);
            
            // Projects completed this month
            const completedProjectsResult = await query(`
                SELECT COUNT(*) as count
                FROM projects
                WHERE status = 'Completed'
                AND EXTRACT(YEAR FROM updated_at) = $1 
                AND EXTRACT(MONTH FROM updated_at) = $2
                ${userFilter}
            `, params);
            
            // Gate meetings held this month
            const gateMeetingsResult = await query(`
                SELECT COUNT(*) as count
                FROM gate_meetings gm
                ${userId ? 'JOIN projects p ON gm.project_id = p.id' : ''}
                WHERE gm.actual_date IS NOT NULL
                AND EXTRACT(YEAR FROM gm.actual_date) = $1 
                AND EXTRACT(MONTH FROM gm.actual_date) = $2
                ${userFilter.replace('project_manager_id', 'p.project_manager_id').replace('created_by', 'p.created_by')}
            `, params);
            
            // Budget summary
            const budgetResult = await query(`
                SELECT 
                    SUM(estimated_budget) as total_budget,
                    SUM(actual_cost) as total_actual_cost,
                    COUNT(*) as active_projects
                FROM projects
                WHERE status IN ('Planning', 'Active')
                ${userFilter}
            `, userId ? [userId] : []);
            
            return {
                period: { year: parseInt(year), month: parseInt(month) },
                newProjects: parseInt(newProjectsResult.rows[0].count),
                completedProjects: parseInt(completedProjectsResult.rows[0].count),
                gateMeetingsHeld: parseInt(gateMeetingsResult.rows[0].count),
                budget: budgetResult.rows[0]
            };
        } catch (error) {
            console.error('Error getting monthly project summary:', error);
            throw error;
        }
    }

    /**
     * Get resource utilization report
     */
    static async getResourceUtilizationReport(filters = {}) {
        try {
            let queryText = `
                SELECT 
                    u.id,
                    u.first_name || ' ' || u.last_name as name,
                    u.role,
                    u.department,
                    COUNT(ptm.project_id) as active_projects,
                    STRING_AGG(p.project_name, ', ') as project_names,
                    AVG(CASE WHEN p.status IN ('Planning', 'Active') THEN p.estimated_budget END) as avg_project_budget
                FROM users u
                LEFT JOIN project_team_members ptm ON u.id = ptm.user_id AND ptm.is_active = true
                LEFT JOIN projects p ON ptm.project_id = p.id AND p.status IN ('Planning', 'Active')
                WHERE u.is_active = true
            `;
            const params = [];
            let paramCount = 0;
            
            // Apply filters
            if (filters.department) {
                paramCount++;
                queryText += ` AND u.department = $${paramCount}`;
                params.push(filters.department);
            }
            
            if (filters.role) {
                paramCount++;
                queryText += ` AND u.role = $${paramCount}`;
                params.push(filters.role);
            }
            
            queryText += ` GROUP BY u.id, u.first_name, u.last_name, u.role, u.department`;
            queryText += ` ORDER BY active_projects DESC, u.first_name, u.last_name`;
            
            const result = await query(queryText, params);
            
            // Calculate utilization metrics
            const resourceData = result.rows.map(resource => ({
                ...resource,
                utilization_level: this.calculateUtilizationLevel(resource.active_projects),
                workload_status: this.getWorkloadStatus(resource.active_projects)
            }));
            
            return {
                resourceUtilization: resourceData,
                summary: this.calculateResourceSummary(resourceData)
            };
        } catch (error) {
            console.error('Error getting resource utilization report:', error);
            throw error;
        }
    }

    /**
     * Get gate meeting tracking report
     */
    static async getGateMeetingTrackingReport(filters = {}) {
        try {
            let queryText = `
                SELECT 
                    gm.*,
                    p.project_name,
                    p.project_code,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    COUNT(gma.user_id) as attendee_count
                FROM gate_meetings gm
                JOIN projects p ON gm.project_id = p.id
                LEFT JOIN users u ON gm.created_by = u.id
                LEFT JOIN gate_meeting_attendees gma ON gm.id = gma.gate_meeting_id
                WHERE 1=1
            `;
            
            const params = [];
            let paramCount = 0;
            
            // Apply filters
            if (filters.projectId) {
                paramCount++;
                queryText += ` AND gm.project_id = $${paramCount}`;
                params.push(filters.projectId);
            }
            
            if (filters.status) {
                paramCount++;
                queryText += ` AND gm.status = $${paramCount}`;
                params.push(filters.status);
            }
            
            if (filters.startDate) {
                paramCount++;
                queryText += ` AND gm.scheduled_date >= $${paramCount}`;
                params.push(filters.startDate);
            }
            
            if (filters.endDate) {
                paramCount++;
                queryText += ` AND gm.scheduled_date <= $${paramCount}`;
                params.push(filters.endDate);
            }
            
            queryText += ` GROUP BY gm.id, p.project_name, p.project_code, u.first_name, u.last_name`;
            queryText += ` ORDER BY gm.scheduled_date DESC`;
            
            const result = await query(queryText, params);
            
            return {
                gateMeetings: result.rows,
                summary: this.calculateGateMeetingSummary(result.rows)
            };
        } catch (error) {
            console.error('Error getting gate meeting tracking report:', error);
            throw error;
        }
    }

    /**
     * Get budget variance report
     */
    static async getBudgetVarianceReport(filters = {}) {
        try {
            let queryText = `
                SELECT 
                    p.id,
                    p.project_name,
                    p.project_code,
                    p.estimated_budget,
                    p.actual_cost,
                    p.budget_variance,
                    p.budget_status,
                    (p.actual_cost / NULLIF(p.estimated_budget, 0) * 100) as budget_utilization_percent,
                    u.first_name || ' ' || u.last_name as project_manager_name
                FROM projects p
                LEFT JOIN users u ON p.project_manager_id = u.id
                WHERE p.estimated_budget > 0
            `;
            
            const params = [];
            let paramCount = 0;
            
            // Apply filters
            if (filters.status) {
                paramCount++;
                queryText += ` AND p.status = $${paramCount}`;
                params.push(filters.status);
            }
            
            if (filters.budgetStatus) {
                paramCount++;
                queryText += ` AND p.budget_status = $${paramCount}`;
                params.push(filters.budgetStatus);
            }
            
            if (filters.minVariance) {
                paramCount++;
                queryText += ` AND p.budget_variance >= $${paramCount}`;
                params.push(filters.minVariance);
            }
            
            if (filters.maxVariance) {
                paramCount++;
                queryText += ` AND p.budget_variance <= $${paramCount}`;
                params.push(filters.maxVariance);
            }
            
            queryText += ` ORDER BY ABS(p.budget_variance) DESC`;
            
            const result = await query(queryText, params);
            
            return {
                projects: result.rows,
                summary: this.calculateBudgetVarianceSummary(result.rows)
            };
        } catch (error) {
            console.error('Error getting budget variance report:', error);
            throw error;
        }
    }

    /**
     * Get project timeline report
     */
    static async getProjectTimelineReport(filters = {}) {
        try {
            let queryText = `
                SELECT 
                    p.id,
                    p.project_name,
                    p.project_code,
                    p.start_date,
                    p.end_date,
                    p.status,
                    p.priority,
                    CASE 
                        WHEN p.end_date < CURRENT_DATE AND p.status != 'Completed' THEN 'overdue'
                        WHEN p.end_date <= CURRENT_DATE + INTERVAL '30 days' AND p.status != 'Completed' THEN 'due_soon'
                        ELSE 'on_track'
                    END as timeline_status,
                    EXTRACT(DAYS FROM (p.end_date - p.start_date)) as planned_duration_days,
                    EXTRACT(DAYS FROM (CURRENT_DATE - p.start_date)) as elapsed_days,
                    u.first_name || ' ' || u.last_name as project_manager_name
                FROM projects p
                LEFT JOIN users u ON p.project_manager_id = u.id
                WHERE p.start_date IS NOT NULL AND p.end_date IS NOT NULL
            `;
            
            const params = [];
            let paramCount = 0;
            
            // Apply filters
            if (filters.status) {
                paramCount++;
                queryText += ` AND p.status = $${paramCount}`;
                params.push(filters.status);
            }
            
            if (filters.timelineStatus) {
                // This will be applied after the query since it's calculated
            }
            
            if (filters.startDate) {
                paramCount++;
                queryText += ` AND p.start_date >= $${paramCount}`;
                params.push(filters.startDate);
            }
            
            if (filters.endDate) {
                paramCount++;
                queryText += ` AND p.end_date <= $${paramCount}`;
                params.push(filters.endDate);
            }
            
            queryText += ` ORDER BY p.end_date ASC`;
            
            const result = await query(queryText, params);
            
            // Apply timeline status filter if provided
            let projects = result.rows;
            if (filters.timelineStatus) {
                projects = projects.filter(p => p.timeline_status === filters.timelineStatus);
            }
            
            return {
                projects,
                summary: this.calculateTimelineSummary(projects)
            };
        } catch (error) {
            console.error('Error getting project timeline report:', error);
            throw error;
        }
    }

    /**
     * Generate custom report
     */
    static async generateCustomReport(reportConfig, userId) {
        try {
            const reportId = uuidv4();
            
            // Save report configuration
            const saveReportQuery = `
                INSERT INTO custom_reports (
                    id, report_name, report_type, configuration, 
                    created_by, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                RETURNING *
            `;
            
            const reportResult = await query(saveReportQuery, [
                reportId,
                reportConfig.name,
                reportConfig.type,
                JSON.stringify(reportConfig),
                userId
            ]);
            
            // Generate report data based on type
            let reportData;
            switch (reportConfig.type) {
                case 'project_status':
                    reportData = await this.getProjectStatusDashboard(userId, reportConfig.filters);
                    break;
                case 'budget_variance':
                    reportData = await this.getBudgetVarianceReport(reportConfig.filters);
                    break;
                case 'resource_utilization':
                    reportData = await this.getResourceUtilizationReport(reportConfig.filters);
                    break;
                case 'timeline':
                    reportData = await this.getProjectTimelineReport(reportConfig.filters);
                    break;
                default:
                    throw new Error('Unsupported report type');
            }
            
            // Audit log
            auditLogger('REPORT_GENERATE', 'custom_report', reportId, userId, {
                reportType: reportConfig.type,
                reportName: reportConfig.name
            });
            
            return {
                report: reportResult.rows[0],
                data: reportData
            };
        } catch (error) {
            console.error('Error generating custom report:', error);
            throw error;
        }
    }

    /**
     * Helper method to calculate utilization level
     */
    static calculateUtilizationLevel(activeProjects) {
        if (activeProjects === 0) return 'underutilized';
        if (activeProjects <= 2) return 'optimal';
        if (activeProjects <= 4) return 'high';
        return 'overutilized';
    }

    /**
     * Helper method to get workload status
     */
    static getWorkloadStatus(activeProjects) {
        if (activeProjects === 0) return 'Available';
        if (activeProjects <= 2) return 'Normal';
        if (activeProjects <= 4) return 'Busy';
        return 'Overloaded';
    }

    /**
     * Helper method to calculate resource summary
     */
    static calculateResourceSummary(resourceData) {
        const total = resourceData.length;
        const underutilized = resourceData.filter(r => r.utilization_level === 'underutilized').length;
        const optimal = resourceData.filter(r => r.utilization_level === 'optimal').length;
        const high = resourceData.filter(r => r.utilization_level === 'high').length;
        const overutilized = resourceData.filter(r => r.utilization_level === 'overutilized').length;
        
        return {
            total_resources: total,
            underutilized,
            optimal,
            high,
            overutilized,
            avg_projects_per_resource: total > 0 ? 
                resourceData.reduce((sum, r) => sum + r.active_projects, 0) / total : 0
        };
    }

    /**
     * Helper method to calculate gate meeting summary
     */
    static calculateGateMeetingSummary(meetings) {
        const total = meetings.length;
        const scheduled = meetings.filter(m => m.status === 'Scheduled').length;
        const completed = meetings.filter(m => m.status === 'Completed').length;
        const cancelled = meetings.filter(m => m.status === 'Cancelled').length;
        
        return {
            total_meetings: total,
            scheduled,
            completed,
            cancelled,
            completion_rate: total > 0 ? (completed / total * 100).toFixed(2) : 0
        };
    }

    /**
     * Helper method to calculate budget variance summary
     */
    static calculateBudgetVarianceSummary(projects) {
        const total = projects.length;
        const overBudget = projects.filter(p => p.budget_variance < 0).length;
        const onTrack = projects.filter(p => p.budget_variance >= 0 && p.budget_utilization_percent <= 90).length;
        const atRisk = projects.filter(p => p.budget_variance >= 0 && p.budget_utilization_percent > 90).length;
        
        const totalBudget = projects.reduce((sum, p) => sum + parseFloat(p.estimated_budget || 0), 0);
        const totalActual = projects.reduce((sum, p) => sum + parseFloat(p.actual_cost || 0), 0);
        const totalVariance = projects.reduce((sum, p) => sum + parseFloat(p.budget_variance || 0), 0);
        
        return {
            total_projects: total,
            over_budget: overBudget,
            on_track: onTrack,
            at_risk: atRisk,
            total_budget: totalBudget,
            total_actual: totalActual,
            total_variance: totalVariance,
            overall_utilization: totalBudget > 0 ? (totalActual / totalBudget * 100).toFixed(2) : 0
        };
    }

    /**
     * Helper method to calculate timeline summary
     */
    static calculateTimelineSummary(projects) {
        const total = projects.length;
        const overdue = projects.filter(p => p.timeline_status === 'overdue').length;
        const dueSoon = projects.filter(p => p.timeline_status === 'due_soon').length;
        const onTrack = projects.filter(p => p.timeline_status === 'on_track').length;
        
        return {
            total_projects: total,
            overdue,
            due_soon: dueSoon,
            on_track: onTrack,
            overdue_rate: total > 0 ? (overdue / total * 100).toFixed(2) : 0
        };
    }
}

module.exports = ReportingService;

