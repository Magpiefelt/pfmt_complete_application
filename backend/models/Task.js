/**
 * Enhanced Task Model
 * More flexible task management than Team B's workflow_tasks for Team A integration
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');

class Task {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.title = data.title;
        this.description = data.description;
        this.type = data.type;
        this.assignedTo = data.assignedTo;
        this.assignedBy = data.assignedBy;
        this.relatedEntityType = data.relatedEntityType;
        this.relatedEntityId = data.relatedEntityId;
        this.status = data.status || 'Pending';
        this.priority = data.priority || 'Medium';
        this.dueDate = data.dueDate;
        this.completedAt = data.completedAt;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Create Task instance from database row
     */
    static fromDb(row = {}) {
        if (!row) return null;
        return new Task({
            id: row.id,
            title: row.title,
            description: row.description,
            type: row.type,
            assignedTo: row.assigned_to,
            assignedBy: row.assigned_by,
            relatedEntityType: row.related_entity_type,
            relatedEntityId: row.related_entity_id,
            status: row.status,
            priority: row.priority,
            dueDate: row.due_date,
            completedAt: row.completed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    /**
     * Convert Task instance to database format
     */
    toDb() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            type: this.type,
            assigned_to: this.assignedTo,
            assigned_by: this.assignedBy,
            related_entity_type: this.relatedEntityType,
            related_entity_id: this.relatedEntityId,
            status: this.status,
            priority: this.priority,
            due_date: this.dueDate,
            completed_at: this.completedAt
        };
    }

    /**
     * Find all tasks with optional filtering
     */
    static async findAll(options = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            // Add filters
            if (options.assignedTo) {
                whereClause += ` AND t.assigned_to = $${++paramCount}`;
                params.push(options.assignedTo);
            }

            if (options.assignedBy) {
                whereClause += ` AND t.assigned_by = $${++paramCount}`;
                params.push(options.assignedBy);
            }

            if (options.status) {
                whereClause += ` AND t.status = $${++paramCount}`;
                params.push(options.status);
            }

            if (options.priority) {
                whereClause += ` AND t.priority = $${++paramCount}`;
                params.push(options.priority);
            }

            if (options.type) {
                whereClause += ` AND t.type = $${++paramCount}`;
                params.push(options.type);
            }

            if (options.relatedEntityType) {
                whereClause += ` AND t.related_entity_type = $${++paramCount}`;
                params.push(options.relatedEntityType);
            }

            if (options.relatedEntityId) {
                whereClause += ` AND t.related_entity_id = $${++paramCount}`;
                params.push(options.relatedEntityId);
            }

            if (options.dueDateFrom) {
                whereClause += ` AND t.due_date >= $${++paramCount}`;
                params.push(options.dueDateFrom);
            }

            if (options.dueDateTo) {
                whereClause += ` AND t.due_date <= $${++paramCount}`;
                params.push(options.dueDateTo);
            }

            if (options.overdue) {
                whereClause += ` AND t.due_date < CURRENT_TIMESTAMP AND t.status != 'Completed'`;
            }

            if (options.search) {
                whereClause += ` AND (t.title ILIKE $${++paramCount} OR t.description ILIKE $${++paramCount})`;
                params.push(`%${options.search}%`);
                params.push(`%${options.search}%`);
                paramCount++; // Account for the second parameter
            }

            // Add sorting
            const orderBy = options.orderBy || 't.created_at DESC';
            
            // Add pagination
            let limitClause = '';
            if (options.limit) {
                limitClause += ` LIMIT $${++paramCount}`;
                params.push(options.limit);
                
                if (options.offset) {
                    limitClause += ` OFFSET $${++paramCount}`;
                    params.push(options.offset);
                }
            }

            const queryText = `
                SELECT 
                    t.*,
                    u1.first_name || ' ' || u1.last_name as assigned_to_name,
                    u1.email as assigned_to_email,
                    u2.first_name || ' ' || u2.last_name as assigned_by_name,
                    u2.email as assigned_by_email,
                    CASE 
                        WHEN t.related_entity_type = 'project' THEN p.project_name
                        WHEN t.related_entity_type = 'contract' THEN c.title
                        WHEN t.related_entity_type = 'report' THEN r.title
                        ELSE NULL
                    END as related_entity_name
                FROM tasks t
                LEFT JOIN users u1 ON t.assigned_to = u1.id
                LEFT JOIN users u2 ON t.assigned_by = u2.id
                LEFT JOIN projects p ON t.related_entity_type = 'project' AND t.related_entity_id = p.id
                LEFT JOIN contracts c ON t.related_entity_type = 'contract' AND t.related_entity_id = c.id
                LEFT JOIN reports r ON t.related_entity_type = 'report' AND t.related_entity_id = r.id
                ${whereClause}
                ORDER BY ${orderBy}
                ${limitClause}
            `;

            const result = await query(queryText, params);
            return result.rows.map(row => ({
                ...Task.fromDb(row),
                assignedToName: row.assigned_to_name,
                assignedToEmail: row.assigned_to_email,
                assignedByName: row.assigned_by_name,
                assignedByEmail: row.assigned_by_email,
                relatedEntityName: row.related_entity_name
            }));
        } catch (error) {
            console.error('Error finding tasks:', error);
            throw error;
        }
    }

    /**
     * Find task by ID
     */
    static async findById(id) {
        try {
            const tasks = await Task.findAll({ limit: 1 });
            const queryText = `
                SELECT 
                    t.*,
                    u1.first_name || ' ' || u1.last_name as assigned_to_name,
                    u1.email as assigned_to_email,
                    u2.first_name || ' ' || u2.last_name as assigned_by_name,
                    u2.email as assigned_by_email,
                    CASE 
                        WHEN t.related_entity_type = 'project' THEN p.project_name
                        WHEN t.related_entity_type = 'contract' THEN c.title
                        WHEN t.related_entity_type = 'report' THEN r.title
                        ELSE NULL
                    END as related_entity_name
                FROM tasks t
                LEFT JOIN users u1 ON t.assigned_to = u1.id
                LEFT JOIN users u2 ON t.assigned_by = u2.id
                LEFT JOIN projects p ON t.related_entity_type = 'project' AND t.related_entity_id = p.id
                LEFT JOIN contracts c ON t.related_entity_type = 'contract' AND t.related_entity_id = c.id
                LEFT JOIN reports r ON t.related_entity_type = 'report' AND t.related_entity_id = r.id
                WHERE t.id = $1
            `;

            const result = await query(queryText, [id]);
            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                ...Task.fromDb(row),
                assignedToName: row.assigned_to_name,
                assignedToEmail: row.assigned_to_email,
                assignedByName: row.assigned_by_name,
                assignedByEmail: row.assigned_by_email,
                relatedEntityName: row.related_entity_name
            };
        } catch (error) {
            console.error('Error finding task by ID:', error);
            throw error;
        }
    }

    /**
     * Find tasks by user (assigned to)
     */
    static async findByUser(userId, options = {}) {
        return await Task.findAll({ ...options, assignedTo: userId });
    }

    /**
     * Find tasks by related entity
     */
    static async findByRelatedEntity(entityType, entityId, options = {}) {
        return await Task.findAll({ 
            ...options, 
            relatedEntityType: entityType, 
            relatedEntityId: entityId 
        });
    }

    /**
     * Find overdue tasks
     */
    static async findOverdue(options = {}) {
        return await Task.findAll({ ...options, overdue: true });
    }

    /**
     * Save task (create or update)
     */
    async save(userId = null) {
        try {
            const dbData = this.toDb();
            
            if (this.createdAt) {
                // Update existing task
                const queryText = `
                    UPDATE tasks 
                    SET 
                        title = $2,
                        description = $3,
                        type = $4,
                        assigned_to = $5,
                        assigned_by = $6,
                        related_entity_type = $7,
                        related_entity_id = $8,
                        status = $9,
                        priority = $10,
                        due_date = $11,
                        completed_at = $12,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.title,
                    dbData.description,
                    dbData.type,
                    dbData.assigned_to,
                    dbData.assigned_by,
                    dbData.related_entity_type,
                    dbData.related_entity_id,
                    dbData.status,
                    dbData.priority,
                    dbData.due_date,
                    dbData.completed_at
                ];

                const result = await query(queryText, params);
                const updatedTask = Task.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('UPDATE', 'task', this.id, userId, {
                        title: this.title,
                        status: this.status,
                        priority: this.priority
                    });
                }

                return updatedTask;
            } else {
                // Create new task
                const queryText = `
                    INSERT INTO tasks (
                        id, title, description, type, assigned_to, assigned_by,
                        related_entity_type, related_entity_id, status, priority, due_date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.title,
                    dbData.description,
                    dbData.type,
                    dbData.assigned_to,
                    userId || dbData.assigned_by,
                    dbData.related_entity_type,
                    dbData.related_entity_id,
                    dbData.status,
                    dbData.priority,
                    dbData.due_date
                ];

                const result = await query(queryText, params);
                const newTask = Task.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('CREATE', 'task', this.id, userId, {
                        title: this.title,
                        assignedTo: this.assignedTo,
                        type: this.type
                    });
                }

                return newTask;
            }
        } catch (error) {
            console.error('Error saving task:', error);
            throw error;
        }
    }

    /**
     * Update task data
     */
    async update(data, userId = null) {
        try {
            // Update instance properties
            Object.keys(data).forEach(key => {
                if (this.hasOwnProperty(key) && key !== 'id') {
                    this[key] = data[key];
                }
            });

            return await this.save(userId);
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    /**
     * Delete task
     */
    async delete(userId = null) {
        try {
            const queryText = 'DELETE FROM tasks WHERE id = $1 RETURNING *';
            const result = await query(queryText, [this.id]);
            
            if (result.rows.length === 0) {
                throw new Error('Task not found');
            }

            // Audit log
            if (userId) {
                auditLogger('DELETE', 'task', this.id, userId, {
                    title: this.title,
                    assignedTo: this.assignedTo
                });
            }

            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }

    /**
     * Complete task
     */
    async complete(userId) {
        try {
            this.status = 'Completed';
            this.completedAt = new Date().toISOString();
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('COMPLETE', 'task', this.id, userId, {
                title: this.title,
                previousStatus: 'In Progress',
                newStatus: 'Completed',
                completedAt: this.completedAt
            });

            return result;
        } catch (error) {
            console.error('Error completing task:', error);
            throw error;
        }
    }

    /**
     * Start task (set to In Progress)
     */
    async start(userId) {
        try {
            this.status = 'In Progress';
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('START', 'task', this.id, userId, {
                title: this.title,
                previousStatus: 'Pending',
                newStatus: 'In Progress'
            });

            return result;
        } catch (error) {
            console.error('Error starting task:', error);
            throw error;
        }
    }

    /**
     * Cancel task
     */
    async cancel(userId, reason = null) {
        try {
            this.status = 'Cancelled';
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('CANCEL', 'task', this.id, userId, {
                title: this.title,
                previousStatus: this.status,
                newStatus: 'Cancelled',
                reason: reason
            });

            return result;
        } catch (error) {
            console.error('Error cancelling task:', error);
            throw error;
        }
    }

    /**
     * Reassign task to another user
     */
    async reassign(newAssigneeId, userId) {
        try {
            const oldAssignee = this.assignedTo;
            this.assignedTo = newAssigneeId;
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('REASSIGN', 'task', this.id, userId, {
                title: this.title,
                oldAssignee: oldAssignee,
                newAssignee: newAssigneeId
            });

            return result;
        } catch (error) {
            console.error('Error reassigning task:', error);
            throw error;
        }
    }

    /**
     * Get task statistics
     */
    static async getStatistics(options = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            if (options.assignedTo) {
                whereClause += ` AND assigned_to = $${++paramCount}`;
                params.push(options.assignedTo);
            }

            if (options.relatedEntityType) {
                whereClause += ` AND related_entity_type = $${++paramCount}`;
                params.push(options.relatedEntityType);
            }

            if (options.relatedEntityId) {
                whereClause += ` AND related_entity_id = $${++paramCount}`;
                params.push(options.relatedEntityId);
            }

            const queryText = `
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_tasks,
                    COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_tasks,
                    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_tasks,
                    COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_priority_tasks,
                    COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical_priority_tasks,
                    COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND status != 'Completed' THEN 1 END) as overdue_tasks,
                    COUNT(CASE WHEN due_date BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days' AND status != 'Completed' THEN 1 END) as due_this_week
                FROM tasks
                ${whereClause}
            `;

            const result = await query(queryText, params);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting task statistics:', error);
            throw error;
        }
    }

    /**
     * Get task types
     */
    static async getTaskTypes() {
        try {
            const queryText = `
                SELECT DISTINCT type, COUNT(*) as count
                FROM tasks
                WHERE type IS NOT NULL
                GROUP BY type
                ORDER BY count DESC, type ASC
            `;

            const result = await query(queryText);
            return result.rows;
        } catch (error) {
            console.error('Error getting task types:', error);
            throw error;
        }
    }

    /**
     * Validate task data
     */
    validate() {
        const errors = [];

        if (!this.title) errors.push('Title is required');
        if (!this.type) errors.push('Task type is required');
        if (!this.assignedTo) errors.push('Assigned to user is required');
        
        const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push('Invalid status');
        }

        const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
        if (this.priority && !validPriorities.includes(this.priority)) {
            errors.push('Invalid priority');
        }

        if (this.title && this.title.length > 255) {
            errors.push('Title cannot exceed 255 characters');
        }

        if (this.type && this.type.length > 100) {
            errors.push('Task type cannot exceed 100 characters');
        }

        if (this.dueDate && new Date(this.dueDate) < new Date()) {
            if (this.status === 'Pending') {
                // Allow past due dates for existing tasks, but warn
                console.warn(`Task ${this.id} has a past due date: ${this.dueDate}`);
            }
        }

        return errors;
    }

    /**
     * Find upcoming tasks (due within specified days)
     */
    static async findUpcoming(options = {}) {
        try {
            const days = options.days || 7;
            let whereClause = `WHERE due_date BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '${days} days' AND status != 'Completed' AND status != 'Cancelled'`;
            const params = [];
            let paramCount = 0;

            if (options.assignedTo) {
                whereClause += ` AND assigned_to = $${++paramCount}`;
                params.push(options.assignedTo);
            }

            if (options.priority) {
                whereClause += ` AND priority = $${++paramCount}`;
                params.push(options.priority);
            }

            const queryText = `
                SELECT t.*, 
                    u1.first_name || ' ' || u1.last_name as assigned_to_name,
                    u1.email as assigned_to_email,
                    u2.first_name || ' ' || u2.last_name as assigned_by_name,
                    u2.email as assigned_by_email
                FROM workflow_tasks t
                LEFT JOIN users u1 ON t.assigned_to = u1.id
                LEFT JOIN users u2 ON t.created_by = u2.id
                ${whereClause}
                ORDER BY due_date ASC
            `;

            const result = await query(queryText, params);
            return result.rows.map(row => ({
                ...Task.fromDb(row),
                assignedToName: row.assigned_to_name,
                assignedToEmail: row.assigned_to_email,
                assignedByName: row.assigned_by_name,
                assignedByEmail: row.assigned_by_email
            }));
        } catch (error) {
            console.error('Error finding upcoming tasks:', error);
            throw error;
        }
    }

    /**
     * Assign task to user
     */
    async assignTo(assignedTo, assignedBy, assignmentNotes = null) {
        try {
            const queryText = `
                UPDATE workflow_tasks 
                SET 
                    assigned_to = $2,
                    assignment_notes = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

            const result = await query(queryText, [this.id, assignedTo, assignmentNotes]);
            
            // Log the assignment in task history
            await this.logHistory('ASSIGN', assignedBy, null, {
                assigned_to: assignedTo,
                assignment_notes: assignmentNotes
            });

            return Task.fromDb(result.rows[0]);
        } catch (error) {
            console.error('Error assigning task:', error);
            throw error;
        }
    }

    /**
     * Unassign task from user
     */
    async unassign(unassignedBy, unassignmentReason = null) {
        try {
            const queryText = `
                UPDATE workflow_tasks 
                SET 
                    assigned_to = NULL,
                    unassignment_reason = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

            const result = await query(queryText, [this.id, unassignmentReason]);
            
            // Log the unassignment in task history
            await this.logHistory('UNASSIGN', unassignedBy, null, {
                unassignment_reason: unassignmentReason
            });

            return Task.fromDb(result.rows[0]);
        } catch (error) {
            console.error('Error unassigning task:', error);
            throw error;
        }
    }

    /**
     * Reopen completed task
     */
    async reopen(reopenedBy, reopenReason, reopenNotes = null) {
        try {
            const queryText = `
                UPDATE workflow_tasks 
                SET 
                    status = 'pending',
                    completed_at = NULL,
                    reopen_reason = $2,
                    reopen_notes = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

            const result = await query(queryText, [this.id, reopenReason, reopenNotes]);
            
            // Log the reopening in task history
            await this.logHistory('REOPEN', reopenedBy, reopenReason, {
                reopen_notes: reopenNotes
            });

            return Task.fromDb(result.rows[0]);
        } catch (error) {
            console.error('Error reopening task:', error);
            throw error;
        }
    }

    /**
     * Put task on hold
     */
    async hold(heldBy, holdReason, holdNotes = null) {
        try {
            const queryText = `
                UPDATE workflow_tasks 
                SET 
                    status = 'on_hold',
                    hold_reason = $2,
                    hold_notes = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

            const result = await query(queryText, [this.id, holdReason, holdNotes]);
            
            // Log the hold action in task history
            await this.logHistory('HOLD', heldBy, holdReason, {
                hold_notes: holdNotes
            });

            return Task.fromDb(result.rows[0]);
        } catch (error) {
            console.error('Error holding task:', error);
            throw error;
        }
    }

    /**
     * Resume task from hold
     */
    async resume(resumedBy, resumeNotes = null) {
        try {
            const queryText = `
                UPDATE workflow_tasks 
                SET 
                    status = 'pending',
                    resume_notes = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

            const result = await query(queryText, [this.id, resumeNotes]);
            
            // Log the resume action in task history
            await this.logHistory('RESUME', resumedBy, null, {
                resume_notes: resumeNotes
            });

            return Task.fromDb(result.rows[0]);
        } catch (error) {
            console.error('Error resuming task:', error);
            throw error;
        }
    }

    /**
     * Get task dependencies
     */
    static async getDependencies(taskId) {
        try {
            const queryText = `
                SELECT 
                    td.*,
                    t.title as depends_on_task_title,
                    t.status as depends_on_task_status,
                    t.priority as depends_on_task_priority,
                    u.first_name || ' ' || u.last_name as created_by_name
                FROM task_dependencies td
                JOIN workflow_tasks t ON td.depends_on_task_id = t.id
                LEFT JOIN users u ON td.created_by = u.id
                WHERE td.task_id = $1
                ORDER BY td.created_at ASC
            `;

            const result = await query(queryText, [taskId]);
            return result.rows;
        } catch (error) {
            console.error('Error getting task dependencies:', error);
            throw error;
        }
    }

    /**
     * Add task dependency
     */
    static async addDependency(taskId, dependsOnTaskId, dependencyType, createdBy) {
        try {
            const queryText = `
                INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;

            const result = await query(queryText, [taskId, dependsOnTaskId, dependencyType, createdBy]);
            return result.rows[0];
        } catch (error) {
            console.error('Error adding task dependency:', error);
            throw error;
        }
    }

    /**
     * Remove task dependency
     */
    static async removeDependency(taskId, dependencyId, removedBy) {
        try {
            const queryText = `
                DELETE FROM task_dependencies 
                WHERE task_id = $1 AND id = $2
                RETURNING *
            `;

            const result = await query(queryText, [taskId, dependencyId]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error removing task dependency:', error);
            throw error;
        }
    }

    /**
     * Get task comments
     */
    static async getComments(taskId) {
        try {
            const queryText = `
                SELECT 
                    tc.*,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    u.email as created_by_email
                FROM task_comments tc
                JOIN users u ON tc.created_by = u.id
                WHERE tc.task_id = $1
                ORDER BY tc.created_at ASC
            `;

            const result = await query(queryText, [taskId]);
            return result.rows;
        } catch (error) {
            console.error('Error getting task comments:', error);
            throw error;
        }
    }

    /**
     * Add task comment
     */
    static async addComment(taskId, comment, createdBy) {
        try {
            const queryText = `
                INSERT INTO task_comments (task_id, comment, created_by)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const result = await query(queryText, [taskId, comment, createdBy]);
            return result.rows[0];
        } catch (error) {
            console.error('Error adding task comment:', error);
            throw error;
        }
    }

    /**
     * Update task comment
     */
    static async updateComment(commentId, comment, updatedBy) {
        try {
            const queryText = `
                UPDATE task_comments 
                SET comment = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND created_by = $3
                RETURNING *
            `;

            const result = await query(queryText, [commentId, comment, updatedBy]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Error updating task comment:', error);
            throw error;
        }
    }

    /**
     * Delete task comment
     */
    static async deleteComment(commentId, deletedBy) {
        try {
            const queryText = `
                DELETE FROM task_comments 
                WHERE id = $1 AND created_by = $2
                RETURNING *
            `;

            const result = await query(queryText, [commentId, deletedBy]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error deleting task comment:', error);
            throw error;
        }
    }

    /**
     * Get task time logs
     */
    static async getTimeLogs(taskId) {
        try {
            const queryText = `
                SELECT 
                    ttl.*,
                    u.first_name || ' ' || u.last_name as user_name,
                    u.email as user_email
                FROM task_time_logs ttl
                JOIN users u ON ttl.user_id = u.id
                WHERE ttl.task_id = $1
                ORDER BY ttl.log_date DESC, ttl.created_at DESC
            `;

            const result = await query(queryText, [taskId]);
            return result.rows;
        } catch (error) {
            console.error('Error getting task time logs:', error);
            throw error;
        }
    }

    /**
     * Add task time log
     */
    static async addTimeLog(taskId, hours, description, userId, logDate = null) {
        try {
            const queryText = `
                INSERT INTO task_time_logs (task_id, user_id, hours, description, log_date)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const result = await query(queryText, [
                taskId, 
                userId, 
                hours, 
                description, 
                logDate || new Date().toISOString().split('T')[0]
            ]);
            return result.rows[0];
        } catch (error) {
            console.error('Error adding task time log:', error);
            throw error;
        }
    }

    /**
     * Export tasks to CSV
     */
    static async exportToCSV(tasks) {
        try {
            const headers = [
                'ID', 'Title', 'Description', 'Type', 'Status', 'Priority',
                'Assigned To', 'Created By', 'Due Date', 'Created At', 'Updated At'
            ];

            let csv = headers.join(',') + '\n';

            tasks.forEach(task => {
                const row = [
                    task.id,
                    `"${(task.title || '').replace(/"/g, '""')}"`,
                    `"${(task.description || '').replace(/"/g, '""')}"`,
                    task.type || '',
                    task.status || '',
                    task.priority || '',
                    task.assignedToName || '',
                    task.assignedByName || '',
                    task.dueDate || '',
                    task.createdAt || '',
                    task.updatedAt || ''
                ];
                csv += row.join(',') + '\n';
            });

            return csv;
        } catch (error) {
            console.error('Error exporting tasks to CSV:', error);
            throw error;
        }
    }

    /**
     * Log task history for audit trail
     */
    async logHistory(action, changedBy, changeReason = null, newValues = {}) {
        try {
            const queryText = `
                INSERT INTO task_history (task_id, action, new_values, changed_by, change_reason)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const result = await query(queryText, [
                this.id,
                action,
                JSON.stringify(newValues),
                changedBy,
                changeReason
            ]);

            return result.rows[0];
        } catch (error) {
            console.error('Error logging task history:', error);
            // Don't throw error for history logging failures
            return null;
        }
    }
}

module.exports = Task;

