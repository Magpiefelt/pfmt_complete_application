/**
 * Workflow Service
 * Business logic for workflow management functionality
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');

class WorkflowService {
    /**
     * Get workflow tasks for a project
     */
    static async getWorkflowTasks(projectId, filters = {}) {
        try {
            let queryText = `
                SELECT 
                    wt.*,
                    u.first_name || ' ' || u.last_name as assigned_to_name,
                    cu.first_name || ' ' || cu.last_name as created_by_name,
                    uu.first_name || ' ' || uu.last_name as updated_by_name
                FROM workflow_tasks wt
                LEFT JOIN users u ON wt.assigned_to = u.id
                LEFT JOIN users cu ON wt.created_by = cu.id
                LEFT JOIN users uu ON wt.updated_by = uu.id
                WHERE wt.project_id = $1 AND wt.is_active = true
            `;
            
            const params = [projectId];
            let paramCount = 1;
            
            // Apply filters
            if (filters.status) {
                paramCount++;
                queryText += ` AND wt.status = $${paramCount}`;
                params.push(filters.status);
            }
            
            if (filters.assignedTo) {
                paramCount++;
                queryText += ` AND wt.assigned_to = $${paramCount}`;
                params.push(filters.assignedTo);
            }
            
            if (filters.priority) {
                paramCount++;
                queryText += ` AND wt.priority = $${paramCount}`;
                params.push(filters.priority);
            }
            
            if (filters.dueDate) {
                paramCount++;
                queryText += ` AND wt.due_date <= $${paramCount}`;
                params.push(filters.dueDate);
            }
            
            if (filters.overdue) {
                queryText += ` AND wt.due_date < CURRENT_DATE AND wt.status != 'Completed'`;
            }
            
            // Pagination
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const offset = (page - 1) * limit;
            
            queryText += ` ORDER BY 
                CASE wt.priority 
                    WHEN 'Critical' THEN 1 
                    WHEN 'High' THEN 2 
                    WHEN 'Medium' THEN 3 
                    WHEN 'Low' THEN 4 
                END,
                wt.due_date ASC,
                wt.created_at DESC
            `;
            queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            params.push(limit, offset);
            
            const result = await query(queryText, params);
            
            // Get total count for pagination
            let countQuery = `
                SELECT COUNT(*) as total
                FROM workflow_tasks wt
                WHERE wt.project_id = $1 AND wt.is_active = true
            `;
            const countParams = [projectId];
            let countParamCount = 1;
            
            if (filters.status) {
                countParamCount++;
                countQuery += ` AND wt.status = $${countParamCount}`;
                countParams.push(filters.status);
            }
            
            if (filters.assignedTo) {
                countParamCount++;
                countQuery += ` AND wt.assigned_to = $${countParamCount}`;
                countParams.push(filters.assignedTo);
            }
            
            const countResult = await query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);
            
            return {
                tasks: result.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting workflow tasks:', error);
            throw error;
        }
    }

    /**
     * Create workflow task
     */
    static async createWorkflowTask(projectId, taskData, userId) {
        try {
            // Validate project exists
            const projectCheck = await query(
                'SELECT id FROM projects WHERE id = $1',
                [projectId]
            );
            
            if (projectCheck.rows.length === 0) {
                throw new Error('Project not found');
            }
            
            const taskId = uuidv4();
            
            const queryText = `
                INSERT INTO workflow_tasks (
                    id, project_id, task_name, description, assigned_to,
                    priority, due_date, status, dependencies, metadata,
                    created_by, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                RETURNING *
            `;
            
            const params = [
                taskId,
                projectId,
                taskData.taskName,
                taskData.description || null,
                taskData.assignedTo,
                taskData.priority || 'Medium',
                taskData.dueDate || null,
                'Pending',
                JSON.stringify(taskData.dependencies || []),
                JSON.stringify(taskData.metadata || {}),
                userId
            ];
            
            const result = await query(queryText, params);
            
            // Create task dependencies if provided
            if (taskData.dependencies && taskData.dependencies.length > 0) {
                await this.createTaskDependencies(taskId, taskData.dependencies, userId);
            }
            
            // Audit log
            auditLogger('WORKFLOW_TASK_CREATE', 'workflow_task', taskId, userId, {
                projectId,
                taskName: taskData.taskName,
                assignedTo: taskData.assignedTo
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating workflow task:', error);
            throw error;
        }
    }

    /**
     * Update workflow task
     */
    static async updateWorkflowTask(taskId, updateData, userId) {
        try {
            // Check if task exists
            const currentTask = await query(
                'SELECT * FROM workflow_tasks WHERE id = $1 AND is_active = true',
                [taskId]
            );
            
            if (currentTask.rows.length === 0) {
                throw new Error('Workflow task not found');
            }
            
            const task = currentTask.rows[0];
            
            // Build update query dynamically
            const updateFields = [];
            const params = [];
            let paramCount = 0;
            
            const allowedFields = [
                'task_name', 'description', 'assigned_to', 'priority', 
                'due_date', 'status', 'progress_percentage', 'notes'
            ];
            
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    paramCount++;
                    updateFields.push(`${field} = $${paramCount}`);
                    params.push(updateData[field]);
                }
            });
            
            if (updateData.dependencies !== undefined) {
                paramCount++;
                updateFields.push(`dependencies = $${paramCount}`);
                params.push(JSON.stringify(updateData.dependencies));
            }
            
            if (updateData.metadata !== undefined) {
                paramCount++;
                updateFields.push(`metadata = $${paramCount}`);
                params.push(JSON.stringify(updateData.metadata));
            }
            
            if (updateFields.length === 0) {
                return task;
            }
            
            // Add updated_at and updated_by
            paramCount++;
            updateFields.push(`updated_at = NOW()`);
            updateFields.push(`updated_by = $${paramCount}`);
            params.push(userId);
            
            // Add WHERE clause
            paramCount++;
            params.push(taskId);
            
            const queryText = `
                UPDATE workflow_tasks 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;
            
            const result = await query(queryText, params);
            
            // Update dependencies if provided
            if (updateData.dependencies !== undefined) {
                await this.updateTaskDependencies(taskId, updateData.dependencies, userId);
            }
            
            // Audit log
            auditLogger('WORKFLOW_TASK_UPDATE', 'workflow_task', taskId, userId, {
                projectId: task.project_id,
                changes: Object.keys(updateData)
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating workflow task:', error);
            throw error;
        }
    }

    /**
     * Complete workflow task
     */
    static async completeWorkflowTask(taskId, userId, completionNotes = null) {
        try {
            const task = await query(
                'SELECT * FROM workflow_tasks WHERE id = $1 AND is_active = true',
                [taskId]
            );
            
            if (task.rows.length === 0) {
                throw new Error('Workflow task not found');
            }
            
            const taskData = task.rows[0];
            
            if (taskData.status === 'Completed') {
                throw new Error('Task is already completed');
            }
            
            const queryText = `
                UPDATE workflow_tasks 
                SET 
                    status = 'Completed',
                    progress_percentage = 100,
                    completed_at = NOW(),
                    completed_by = $1,
                    completion_notes = $2,
                    updated_at = NOW(),
                    updated_by = $1
                WHERE id = $3
                RETURNING *
            `;
            
            const result = await query(queryText, [userId, completionNotes, taskId]);
            
            // Check if this completion enables other tasks
            await this.checkAndEnableDependentTasks(taskId, userId);
            
            // Audit log
            auditLogger('WORKFLOW_TASK_COMPLETE', 'workflow_task', taskId, userId, {
                projectId: taskData.project_id,
                taskName: taskData.task_name
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error completing workflow task:', error);
            throw error;
        }
    }

    /**
     * Start workflow task
     */
    static async startWorkflowTask(taskId, userId) {
        try {
            const task = await query(
                'SELECT * FROM workflow_tasks WHERE id = $1 AND is_active = true',
                [taskId]
            );
            
            if (task.rows.length === 0) {
                throw new Error('Workflow task not found');
            }
            
            const taskData = task.rows[0];
            
            if (taskData.status === 'In Progress') {
                throw new Error('Task is already in progress');
            }
            
            if (taskData.status === 'Completed') {
                throw new Error('Task is already completed');
            }
            
            // Check if dependencies are met
            const dependenciesMet = await this.checkTaskDependencies(taskId);
            if (!dependenciesMet) {
                throw new Error('Task dependencies are not yet completed');
            }
            
            const queryText = `
                UPDATE workflow_tasks 
                SET 
                    status = 'In Progress',
                    started_at = NOW(),
                    started_by = $1,
                    updated_at = NOW(),
                    updated_by = $1
                WHERE id = $2
                RETURNING *
            `;
            
            const result = await query(queryText, [userId, taskId]);
            
            // Audit log
            auditLogger('WORKFLOW_TASK_START', 'workflow_task', taskId, userId, {
                projectId: taskData.project_id,
                taskName: taskData.task_name
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error starting workflow task:', error);
            throw error;
        }
    }

    /**
     * Delete workflow task
     */
    static async deleteWorkflowTask(taskId, userId) {
        try {
            const task = await query(
                'SELECT * FROM workflow_tasks WHERE id = $1 AND is_active = true',
                [taskId]
            );
            
            if (task.rows.length === 0) {
                throw new Error('Workflow task not found');
            }
            
            const taskData = task.rows[0];
            
            // Soft delete
            const queryText = `
                UPDATE workflow_tasks 
                SET 
                    is_active = false,
                    deleted_at = NOW(),
                    deleted_by = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `;
            
            const result = await query(queryText, [userId, taskId]);
            
            // Remove task dependencies
            await this.removeTaskDependencies(taskId, userId);
            
            // Audit log
            auditLogger('WORKFLOW_TASK_DELETE', 'workflow_task', taskId, userId, {
                projectId: taskData.project_id,
                taskName: taskData.task_name
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error deleting workflow task:', error);
            throw error;
        }
    }

    /**
     * Get workflow statistics for a project
     */
    static async getWorkflowStatistics(projectId) {
        try {
            const queryText = `
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_tasks,
                    COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_tasks,
                    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN status = 'Blocked' THEN 1 END) as blocked_tasks,
                    COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'Completed' THEN 1 END) as overdue_tasks,
                    COALESCE(AVG(progress_percentage), 0) as avg_progress,
                    COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical_tasks,
                    COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_priority_tasks
                FROM workflow_tasks
                WHERE project_id = $1 AND is_active = true
            `;
            
            const result = await query(queryText, [projectId]);
            const stats = result.rows[0];
            
            // Calculate completion rate
            stats.completion_rate = stats.total_tasks > 0 ? 
                (stats.completed_tasks / stats.total_tasks * 100).toFixed(2) : 0;
            
            return stats;
        } catch (error) {
            console.error('Error getting workflow statistics:', error);
            throw error;
        }
    }

    /**
     * Get workflow timeline for a project
     */
    static async getWorkflowTimeline(projectId, filters = {}) {
        try {
            let queryText = `
                SELECT 
                    wt.id,
                    wt.task_name,
                    wt.status,
                    wt.priority,
                    wt.due_date,
                    wt.started_at,
                    wt.completed_at,
                    wt.progress_percentage,
                    u.first_name || ' ' || u.last_name as assigned_to_name
                FROM workflow_tasks wt
                LEFT JOIN users u ON wt.assigned_to = u.id
                WHERE wt.project_id = $1 AND wt.is_active = true
            `;
            
            const params = [projectId];
            let paramCount = 1;
            
            // Apply filters
            if (filters.startDate) {
                paramCount++;
                queryText += ` AND wt.due_date >= $${paramCount}`;
                params.push(filters.startDate);
            }
            
            if (filters.endDate) {
                paramCount++;
                queryText += ` AND wt.due_date <= $${paramCount}`;
                params.push(filters.endDate);
            }
            
            queryText += ` ORDER BY wt.due_date ASC, wt.created_at ASC`;
            
            const result = await query(queryText, params);
            
            // Group tasks by month for timeline visualization
            const timeline = {};
            result.rows.forEach(task => {
                if (task.due_date) {
                    const month = new Date(task.due_date).toISOString().substring(0, 7); // YYYY-MM
                    if (!timeline[month]) {
                        timeline[month] = [];
                    }
                    timeline[month].push(task);
                }
            });
            
            return {
                tasks: result.rows,
                timeline
            };
        } catch (error) {
            console.error('Error getting workflow timeline:', error);
            throw error;
        }
    }

    /**
     * Create task dependencies
     */
    static async createTaskDependencies(taskId, dependencies, userId) {
        try {
            for (const dependencyId of dependencies) {
                await query(`
                    INSERT INTO workflow_task_dependencies (task_id, depends_on_task_id, created_by, created_at)
                    VALUES ($1, $2, $3, NOW())
                    ON CONFLICT (task_id, depends_on_task_id) DO NOTHING
                `, [taskId, dependencyId, userId]);
            }
        } catch (error) {
            console.error('Error creating task dependencies:', error);
            throw error;
        }
    }

    /**
     * Update task dependencies
     */
    static async updateTaskDependencies(taskId, dependencies, userId) {
        try {
            // Remove existing dependencies
            await query(
                'DELETE FROM workflow_task_dependencies WHERE task_id = $1',
                [taskId]
            );
            
            // Add new dependencies
            if (dependencies && dependencies.length > 0) {
                await this.createTaskDependencies(taskId, dependencies, userId);
            }
        } catch (error) {
            console.error('Error updating task dependencies:', error);
            throw error;
        }
    }

    /**
     * Remove task dependencies
     */
    static async removeTaskDependencies(taskId, userId) {
        try {
            await query(
                'DELETE FROM workflow_task_dependencies WHERE task_id = $1 OR depends_on_task_id = $1',
                [taskId]
            );
        } catch (error) {
            console.error('Error removing task dependencies:', error);
            throw error;
        }
    }

    /**
     * Check if task dependencies are met
     */
    static async checkTaskDependencies(taskId) {
        try {
            const result = await query(`
                SELECT COUNT(*) as pending_dependencies
                FROM workflow_task_dependencies wtd
                JOIN workflow_tasks wt ON wtd.depends_on_task_id = wt.id
                WHERE wtd.task_id = $1 
                AND wt.status != 'Completed' 
                AND wt.is_active = true
            `, [taskId]);
            
            return parseInt(result.rows[0].pending_dependencies) === 0;
        } catch (error) {
            console.error('Error checking task dependencies:', error);
            throw error;
        }
    }

    /**
     * Check and enable dependent tasks
     */
    static async checkAndEnableDependentTasks(completedTaskId, userId) {
        try {
            // Find tasks that depend on the completed task
            const dependentTasks = await query(`
                SELECT DISTINCT wtd.task_id
                FROM workflow_task_dependencies wtd
                JOIN workflow_tasks wt ON wtd.task_id = wt.id
                WHERE wtd.depends_on_task_id = $1 
                AND wt.status = 'Pending'
                AND wt.is_active = true
            `, [completedTaskId]);
            
            // Check each dependent task to see if all its dependencies are now met
            for (const task of dependentTasks.rows) {
                const dependenciesMet = await this.checkTaskDependencies(task.task_id);
                if (dependenciesMet) {
                    // Update task status to indicate it's ready to start
                    await query(`
                        UPDATE workflow_tasks 
                        SET 
                            status = 'Ready',
                            updated_at = NOW(),
                            updated_by = $1
                        WHERE id = $2
                    `, [userId, task.task_id]);
                    
                    // Audit log
                    auditLogger('WORKFLOW_TASK_READY', 'workflow_task', task.task_id, userId, {
                        reason: 'Dependencies completed'
                    });
                }
            }
        } catch (error) {
            console.error('Error checking and enabling dependent tasks:', error);
            throw error;
        }
    }

    /**
     * Get task dependencies
     */
    static async getTaskDependencies(taskId) {
        try {
            const result = await query(`
                SELECT 
                    wt.id,
                    wt.task_name,
                    wt.status,
                    wt.progress_percentage,
                    u.first_name || ' ' || u.last_name as assigned_to_name
                FROM workflow_task_dependencies wtd
                JOIN workflow_tasks wt ON wtd.depends_on_task_id = wt.id
                LEFT JOIN users u ON wt.assigned_to = u.id
                WHERE wtd.task_id = $1 AND wt.is_active = true
                ORDER BY wt.task_name
            `, [taskId]);
            
            return result.rows;
        } catch (error) {
            console.error('Error getting task dependencies:', error);
            throw error;
        }
    }

    /**
     * Get tasks that depend on this task
     */
    static async getDependentTasks(taskId) {
        try {
            const result = await query(`
                SELECT 
                    wt.id,
                    wt.task_name,
                    wt.status,
                    wt.progress_percentage,
                    u.first_name || ' ' || u.last_name as assigned_to_name
                FROM workflow_task_dependencies wtd
                JOIN workflow_tasks wt ON wtd.task_id = wt.id
                LEFT JOIN users u ON wt.assigned_to = u.id
                WHERE wtd.depends_on_task_id = $1 AND wt.is_active = true
                ORDER BY wt.task_name
            `, [taskId]);
            
            return result.rows;
        } catch (error) {
            console.error('Error getting dependent tasks:', error);
            throw error;
        }
    }
}

module.exports = WorkflowService;

