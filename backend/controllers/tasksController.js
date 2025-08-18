/**
 * Tasks Controller
 * Handles enhanced task management operations for Team A integration
 */

const Task = require('../models/Task');
const { validationResult } = require('express-validator');
const { logger } = require('../middleware/logging');

class TasksController {
    /**
     * Get all tasks with filtering and pagination
     */
    static async getAllTasks(req, res) {
        try {
            const {
                assignedTo,
                assignedBy,
                status,
                priority,
                type,
                relatedEntityType,
                relatedEntityId,
                dueDateFrom,
                dueDateTo,
                overdue,
                search,
                page = 1,
                limit = 20,
                orderBy = 'created_at DESC'
            } = req.query;

            const options = {
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                orderBy
            };

            // Add filters
            if (assignedTo) options.assignedTo = assignedTo;
            if (assignedBy) options.assignedBy = assignedBy;
            if (status) options.status = status;
            if (priority) options.priority = priority;
            if (type) options.type = type;
            if (relatedEntityType) options.relatedEntityType = relatedEntityType;
            if (relatedEntityId) options.relatedEntityId = relatedEntityId;
            if (dueDateFrom) options.dueDateFrom = dueDateFrom;
            if (dueDateTo) options.dueDateTo = dueDateTo;
            if (overdue === 'true') options.overdue = true;
            if (search) options.search = search;

            const tasks = await Task.findAll(options);
            const statistics = await Task.getStatistics(options);

            res.json({
                success: true,
                data: tasks,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(statistics.total_tasks)
                },
                statistics
            });
        } catch (error) {
            logger.error('Error fetching tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tasks',
                error: error.message
            });
        }
    }

    /**
     * Get task by ID
     */
    static async getTaskById(req, res) {
        try {
            const { id } = req.params;
            const task = await Task.findById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            res.json({
                success: true,
                data: task
            });
        } catch (error) {
            logger.error('Error fetching task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task',
                error: error.message
            });
        }
    }

    /**
     * Get tasks assigned to a user
     */
    static async getTasksByUser(req, res) {
        try {
            const { userId } = req.params;
            const { status, priority, overdue } = req.query;
            
            const options = {};
            if (status) options.status = status;
            if (priority) options.priority = priority;
            if (overdue === 'true') options.overdue = true;

            const tasks = await Task.findByUser(userId, options);

            res.json({
                success: true,
                data: tasks,
                count: tasks.length
            });
        } catch (error) {
            logger.error('Error fetching user tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user tasks',
                error: error.message
            });
        }
    }

    /**
     * Get tasks by related entity
     */
    static async getTasksByRelatedEntity(req, res) {
        try {
            const { entityType, entityId } = req.params;
            const { status, priority } = req.query;
            
            const options = {};
            if (status) options.status = status;
            if (priority) options.priority = priority;

            const tasks = await Task.findByRelatedEntity(entityType, entityId, options);

            res.json({
                success: true,
                data: tasks,
                count: tasks.length
            });
        } catch (error) {
            logger.error('Error fetching entity tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch entity tasks',
                error: error.message
            });
        }
    }

    /**
     * Get overdue tasks
     */
    static async getOverdueTasks(req, res) {
        try {
            const { assignedTo, priority } = req.query;
            
            const options = { overdue: true };
            if (assignedTo) options.assignedTo = assignedTo;
            if (priority) options.priority = priority;

            const tasks = await Task.findOverdue(options);

            res.json({
                success: true,
                data: tasks,
                count: tasks.length
            });
        } catch (error) {
            logger.error('Error fetching overdue tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch overdue tasks',
                error: error.message
            });
        }
    }

    /**
     * Get my tasks (current user's tasks)
     */
    static async getMyTasks(req, res) {
        try {
            const { status, priority, overdue } = req.query;
            
            const options = {};
            if (status) options.status = status;
            if (priority) options.priority = priority;
            if (overdue === 'true') options.overdue = true;

            const tasks = await Task.findByUser(req.user.id, options);

            res.json({
                success: true,
                data: tasks,
                count: tasks.length
            });
        } catch (error) {
            logger.error('Error fetching my tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch my tasks',
                error: error.message
            });
        }
    }

    /**
     * Create new task
     */
    static async createTask(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const taskData = req.body;
            const task = new Task(taskData);

            // Validate task data
            const validationErrors = task.validate();
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Task validation failed',
                    errors: validationErrors
                });
            }

            const savedTask = await task.save(req.user.id);

            res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: savedTask
            });
        } catch (error) {
            logger.error('Error creating task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create task',
                error: error.message
            });
        }
    }

    /**
     * Update task
     */
    static async updateTask(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const task = await Task.findById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can edit this task
            if (task.assignedTo !== req.user.id && task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to edit this task'
                });
            }

            const updatedTask = await task.update(req.body, req.user.id);

            res.json({
                success: true,
                message: 'Task updated successfully',
                data: updatedTask
            });
        } catch (error) {
            logger.error('Error updating task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update task',
                error: error.message
            });
        }
    }

    /**
     * Delete task
     */
    static async deleteTask(req, res) {
        try {
            const { id } = req.params;
            const task = await Task.findById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can delete this task
            if (task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this task'
                });
            }

            await task.delete(req.user.id);

            res.json({
                success: true,
                message: 'Task deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete task',
                error: error.message
            });
        }
    }

    /**
     * Start task (set to In Progress)
     */
    static async startTask(req, res) {
        try {
            const { id } = req.params;
            const task = await Task.findById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can start this task
            if (task.assignedTo !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Only assigned user can start this task'
                });
            }

            if (task.status !== 'Pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Only pending tasks can be started'
                });
            }

            const startedTask = await task.start(req.user.id);

            res.json({
                success: true,
                message: 'Task started successfully',
                data: startedTask
            });
        } catch (error) {
            logger.error('Error starting task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start task',
                error: error.message
            });
        }
    }

    /**
     * Complete task
     */
    static async completeTask(req, res) {
        try {
            const { id } = req.params;
            const task = await Task.findById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can complete this task
            if (task.assignedTo !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Only assigned user can complete this task'
                });
            }

            if (task.status === 'Completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Task is already completed'
                });
            }

            const completedTask = await task.complete(req.user.id);

            res.json({
                success: true,
                message: 'Task completed successfully',
                data: completedTask
            });
        } catch (error) {
            logger.error('Error completing task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to complete task',
                error: error.message
            });
        }
    }

    /**
     * Cancel task
     */
    static async cancelTask(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const task = await Task.findById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can cancel this task
            if (task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to cancel this task'
                });
            }

            if (task.status === 'Completed' || task.status === 'Cancelled') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel completed or already cancelled tasks'
                });
            }

            const cancelledTask = await task.cancel(req.user.id, reason);

            res.json({
                success: true,
                message: 'Task cancelled successfully',
                data: cancelledTask
            });
        } catch (error) {
            logger.error('Error cancelling task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel task',
                error: error.message
            });
        }
    }

    /**
     * Reassign task to another user
     */
    static async reassignTask(req, res) {
        try {
            const { id } = req.params;
            const { newAssigneeId } = req.body;
            const task = await Task.findById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can reassign this task
            if (task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to reassign this task'
                });
            }

            if (!newAssigneeId) {
                return res.status(400).json({
                    success: false,
                    message: 'New assignee ID is required'
                });
            }

            const reassignedTask = await task.reassign(newAssigneeId, req.user.id);

            res.json({
                success: true,
                message: 'Task reassigned successfully',
                data: reassignedTask
            });
        } catch (error) {
            logger.error('Error reassigning task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reassign task',
                error: error.message
            });
        }
    }

    /**
     * Get task statistics
     */
    static async getTaskStatistics(req, res) {
        try {
            const { assignedTo, relatedEntityType, relatedEntityId } = req.query;
            const options = {};
            
            if (assignedTo) options.assignedTo = assignedTo;
            if (relatedEntityType) options.relatedEntityType = relatedEntityType;
            if (relatedEntityId) options.relatedEntityId = relatedEntityId;

            const statistics = await Task.getStatistics(options);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            logger.error('Error fetching task statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task statistics',
                error: error.message
            });
        }
    }

    /**
     * Get task types
     */
    static async getTaskTypes(req, res) {
        try {
            const taskTypes = await Task.getTaskTypes();

            res.json({
                success: true,
                data: taskTypes
            });
        } catch (error) {
            logger.error('Error fetching task types:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task types',
                error: error.message
            });
        }
    }

    /**
     * Get upcoming tasks (due within specified days)
     */
    static async getUpcomingTasks(req, res) {
        try {
            const { days = 7 } = req.query;
            const options = {
                upcoming: true,
                days: parseInt(days)
            };

            const tasks = await Task.findUpcoming(options);

            res.json({
                success: true,
                data: tasks,
                count: tasks.length,
                days: parseInt(days)
            });
        } catch (error) {
            logger.error('Error fetching upcoming tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch upcoming tasks',
                error: error.message
            });
        }
    }

    /**
     * Assign task to user
     */
    static async assignTask(req, res) {
        try {
            const { id } = req.params;
            const { assigned_to, assignment_notes } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can assign this task
            if (task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to assign this task'
                });
            }

            const assignedTask = await task.assignTo(assigned_to, req.user.id, assignment_notes);

            res.json({
                success: true,
                message: 'Task assigned successfully',
                data: assignedTask
            });
        } catch (error) {
            logger.error('Error assigning task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign task',
                error: error.message
            });
        }
    }

    /**
     * Unassign task from user
     */
    static async unassignTask(req, res) {
        try {
            const { id } = req.params;
            const { unassignment_reason } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can unassign this task
            if (task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to unassign this task'
                });
            }

            const unassignedTask = await task.unassign(req.user.id, unassignment_reason);

            res.json({
                success: true,
                message: 'Task unassigned successfully',
                data: unassignedTask
            });
        } catch (error) {
            logger.error('Error unassigning task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unassign task',
                error: error.message
            });
        }
    }

    /**
     * Reopen completed task
     */
    static async reopenTask(req, res) {
        try {
            const { id } = req.params;
            const { reopen_reason, reopen_notes } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can reopen this task
            if (task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to reopen this task'
                });
            }

            if (task.status !== 'Completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Only completed tasks can be reopened'
                });
            }

            const reopenedTask = await task.reopen(req.user.id, reopen_reason, reopen_notes);

            res.json({
                success: true,
                message: 'Task reopened successfully',
                data: reopenedTask
            });
        } catch (error) {
            logger.error('Error reopening task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reopen task',
                error: error.message
            });
        }
    }

    /**
     * Put task on hold
     */
    static async holdTask(req, res) {
        try {
            const { id } = req.params;
            const { hold_reason, hold_notes } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can hold this task
            if (task.assignedTo !== req.user.id && task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to hold this task'
                });
            }

            if (task.status === 'Completed' || task.status === 'Cancelled' || task.status === 'On Hold') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot hold completed, cancelled, or already held tasks'
                });
            }

            const heldTask = await task.hold(req.user.id, hold_reason, hold_notes);

            res.json({
                success: true,
                message: 'Task put on hold successfully',
                data: heldTask
            });
        } catch (error) {
            logger.error('Error holding task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to hold task',
                error: error.message
            });
        }
    }

    /**
     * Resume task from hold
     */
    static async resumeTask(req, res) {
        try {
            const { id } = req.params;
            const { resume_notes } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can resume this task
            if (task.assignedTo !== req.user.id && task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to resume this task'
                });
            }

            if (task.status !== 'On Hold') {
                return res.status(400).json({
                    success: false,
                    message: 'Only tasks on hold can be resumed'
                });
            }

            const resumedTask = await task.resume(req.user.id, resume_notes);

            res.json({
                success: true,
                message: 'Task resumed successfully',
                data: resumedTask
            });
        } catch (error) {
            logger.error('Error resuming task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to resume task',
                error: error.message
            });
        }
    }

    /**
     * Get task dependencies
     */
    static async getTaskDependencies(req, res) {
        try {
            const { id } = req.params;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            const dependencies = await Task.getDependencies(id);

            res.json({
                success: true,
                data: dependencies,
                count: dependencies.length
            });
        } catch (error) {
            logger.error('Error fetching task dependencies:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task dependencies',
                error: error.message
            });
        }
    }

    /**
     * Add task dependency
     */
    static async addTaskDependency(req, res) {
        try {
            const { id } = req.params;
            const { depends_on_task_id, dependency_type = 'finish_to_start' } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            const dependsOnTask = await Task.findById(depends_on_task_id);
            if (!dependsOnTask) {
                return res.status(404).json({
                    success: false,
                    message: 'Dependency task not found'
                });
            }

            // Check if user can modify this task
            if (task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this task'
                });
            }

            // Prevent circular dependencies
            if (id === depends_on_task_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Task cannot depend on itself'
                });
            }

            const dependency = await Task.addDependency(id, depends_on_task_id, dependency_type, req.user.id);

            res.status(201).json({
                success: true,
                message: 'Task dependency added successfully',
                data: dependency
            });
        } catch (error) {
            logger.error('Error adding task dependency:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add task dependency',
                error: error.message
            });
        }
    }

    /**
     * Remove task dependency
     */
    static async removeTaskDependency(req, res) {
        try {
            const { id, dependencyId } = req.params;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can modify this task
            if (task.assignedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this task'
                });
            }

            await Task.removeDependency(id, dependencyId, req.user.id);

            res.json({
                success: true,
                message: 'Task dependency removed successfully'
            });
        } catch (error) {
            logger.error('Error removing task dependency:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove task dependency',
                error: error.message
            });
        }
    }

    /**
     * Get task comments
     */
    static async getTaskComments(req, res) {
        try {
            const { id } = req.params;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            const comments = await Task.getComments(id);

            res.json({
                success: true,
                data: comments,
                count: comments.length
            });
        } catch (error) {
            logger.error('Error fetching task comments:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task comments',
                error: error.message
            });
        }
    }

    /**
     * Add task comment
     */
    static async addTaskComment(req, res) {
        try {
            const { id } = req.params;
            const { comment } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            const newComment = await Task.addComment(id, comment, req.user.id);

            res.status(201).json({
                success: true,
                message: 'Comment added successfully',
                data: newComment
            });
        } catch (error) {
            logger.error('Error adding task comment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add task comment',
                error: error.message
            });
        }
    }

    /**
     * Update task comment
     */
    static async updateTaskComment(req, res) {
        try {
            const { id, commentId } = req.params;
            const { comment } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            const updatedComment = await Task.updateComment(commentId, comment, req.user.id);

            if (!updatedComment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found or not authorized to update'
                });
            }

            res.json({
                success: true,
                message: 'Comment updated successfully',
                data: updatedComment
            });
        } catch (error) {
            logger.error('Error updating task comment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update task comment',
                error: error.message
            });
        }
    }

    /**
     * Delete task comment
     */
    static async deleteTaskComment(req, res) {
        try {
            const { id, commentId } = req.params;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            const deleted = await Task.deleteComment(commentId, req.user.id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found or not authorized to delete'
                });
            }

            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting task comment:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete task comment',
                error: error.message
            });
        }
    }

    /**
     * Get task time logs
     */
    static async getTaskTimeLogs(req, res) {
        try {
            const { id } = req.params;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            const timeLogs = await Task.getTimeLogs(id);

            res.json({
                success: true,
                data: timeLogs,
                count: timeLogs.length,
                totalHours: timeLogs.reduce((sum, log) => sum + parseFloat(log.hours || 0), 0)
            });
        } catch (error) {
            logger.error('Error fetching task time logs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task time logs',
                error: error.message
            });
        }
    }

    /**
     * Add task time log
     */
    static async addTaskTimeLog(req, res) {
        try {
            const { id } = req.params;
            const { hours, description, log_date } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check if user can log time for this task
            if (task.assignedTo !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assigned user can log time for this task'
                });
            }

            const timeLog = await Task.addTimeLog(id, hours, description, req.user.id, log_date);

            res.status(201).json({
                success: true,
                message: 'Time log added successfully',
                data: timeLog
            });
        } catch (error) {
            logger.error('Error adding task time log:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add task time log',
                error: error.message
            });
        }
    }

    /**
     * Export tasks to CSV
     */
    static async exportTasks(req, res) {
        try {
            const {
                assignedTo,
                assignedBy,
                status,
                priority,
                type,
                relatedEntityType,
                relatedEntityId,
                dueDateFrom,
                dueDateTo,
                overdue,
                search
            } = req.query;

            const options = {};

            // Add filters
            if (assignedTo) options.assignedTo = assignedTo;
            if (assignedBy) options.assignedBy = assignedBy;
            if (status) options.status = status;
            if (priority) options.priority = priority;
            if (type) options.type = type;
            if (relatedEntityType) options.relatedEntityType = relatedEntityType;
            if (relatedEntityId) options.relatedEntityId = relatedEntityId;
            if (dueDateFrom) options.dueDateFrom = dueDateFrom;
            if (dueDateTo) options.dueDateTo = dueDateTo;
            if (overdue === 'true') options.overdue = true;
            if (search) options.search = search;

            const tasks = await Task.findAll(options);
            const csvData = await Task.exportToCSV(tasks);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="tasks_export.csv"');
            res.send(csvData);
        } catch (error) {
            logger.error('Error exporting tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export tasks',
                error: error.message
            });
        }
    }
}

module.exports = TasksController;

