/**
 * Gate Meetings Controller
 * Handles gate meeting management operations for Team A integration
 */

const GateMeeting = require('../models/GateMeeting');
const { validationResult } = require('express-validator');
const { logger } = require('../middleware/logging');

class GateMeetingsController {
    /**
     * Get all gate meetings with filtering and pagination
     */
    static async getAllGateMeetings(req, res) {
        try {
            const {
                projectId,
                status,
                dateFrom,
                dateTo,
                createdBy,
                page = 1,
                limit = 20,
                orderBy = 'meeting_date DESC'
            } = req.query;

            const options = {
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                orderBy
            };

            // Add filters
            if (projectId) options.projectId = projectId;
            if (status) options.status = status;
            if (dateFrom) options.dateFrom = dateFrom;
            if (dateTo) options.dateTo = dateTo;
            if (createdBy) options.createdBy = createdBy;

            const gateMeetings = await GateMeeting.findAll(options);
            const statistics = await GateMeeting.getStatistics(options);

            res.json({
                success: true,
                data: gateMeetings,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(statistics.total_meetings)
                },
                statistics
            });
        } catch (error) {
            logger.error('Error fetching gate meetings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch gate meetings',
                error: error.message
            });
        }
    }

    /**
     * Get gate meeting by ID
     */
    static async getGateMeetingById(req, res) {
        try {
            const { id } = req.params;
            const gateMeeting = await GateMeeting.findById(id);

            if (!gateMeeting) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            res.json({
                success: true,
                data: gateMeeting
            });
        } catch (error) {
            logger.error('Error fetching gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch gate meeting',
                error: error.message
            });
        }
    }

    /**
     * Get gate meetings by project ID
     */
    static async getGateMeetingsByProject(req, res) {
        try {
            const { projectId } = req.params;
            const gateMeetings = await GateMeeting.findByProject(projectId);

            res.json({
                success: true,
                data: gateMeetings,
                count: gateMeetings.length
            });
        } catch (error) {
            logger.error('Error fetching project gate meetings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project gate meetings',
                error: error.message
            });
        }
    }

    /**
     * Get upcoming gate meetings
     */
    static async getUpcomingGateMeetings(req, res) {
        try {
            const { days = 30 } = req.query;
            const gateMeetings = await GateMeeting.findUpcoming(parseInt(days));

            res.json({
                success: true,
                data: gateMeetings,
                count: gateMeetings.length
            });
        } catch (error) {
            logger.error('Error fetching upcoming gate meetings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch upcoming gate meetings',
                error: error.message
            });
        }
    }

    /**
     * Create new gate meeting
     */
    static async createGateMeeting(req, res) {
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

            const gateMeetingData = req.body;
            const gateMeeting = new GateMeeting(gateMeetingData);

            // Validate gate meeting data
            const validationErrors = gateMeeting.validate();
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Gate meeting validation failed',
                    errors: validationErrors
                });
            }

            const savedGateMeeting = await gateMeeting.save(req.user.id);

            res.status(201).json({
                success: true,
                message: 'Gate meeting created successfully',
                data: savedGateMeeting
            });
        } catch (error) {
            logger.error('Error creating gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create gate meeting',
                error: error.message
            });
        }
    }

    /**
     * Update gate meeting
     */
    static async updateGateMeeting(req, res) {
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
            const gateMeeting = await GateMeeting.findById(id);

            if (!gateMeeting) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            // Check if meeting can be updated
            if (gateMeeting.status === 'Completed' && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot update completed meetings'
                });
            }

            const updatedGateMeeting = await gateMeeting.update(req.body, req.user.id);

            res.json({
                success: true,
                message: 'Gate meeting updated successfully',
                data: updatedGateMeeting
            });
        } catch (error) {
            logger.error('Error updating gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update gate meeting',
                error: error.message
            });
        }
    }

    /**
     * Delete gate meeting
     */
    static async deleteGateMeeting(req, res) {
        try {
            const { id } = req.params;
            const gateMeeting = await GateMeeting.findById(id);

            if (!gateMeeting) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            // Check if meeting can be deleted
            if (gateMeeting.status === 'Completed' && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot delete completed meetings'
                });
            }

            await gateMeeting.delete(req.user.id);

            res.json({
                success: true,
                message: 'Gate meeting deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete gate meeting',
                error: error.message
            });
        }
    }

    /**
     * Start gate meeting
     */
    static async startGateMeeting(req, res) {
        try {
            const { id } = req.params;
            const gateMeeting = await GateMeeting.findById(id);

            if (!gateMeeting) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            if (gateMeeting.status !== 'Scheduled') {
                return res.status(400).json({
                    success: false,
                    message: 'Only scheduled meetings can be started'
                });
            }

            const startedGateMeeting = await gateMeeting.start(req.user.id);

            res.json({
                success: true,
                message: 'Gate meeting started successfully',
                data: startedGateMeeting
            });
        } catch (error) {
            logger.error('Error starting gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start gate meeting',
                error: error.message
            });
        }
    }

    /**
     * Complete gate meeting
     */
    static async completeGateMeeting(req, res) {
        try {
            const { id } = req.params;
            const gateMeeting = await GateMeeting.findById(id);

            if (!gateMeeting) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            if (gateMeeting.status !== 'In Progress') {
                return res.status(400).json({
                    success: false,
                    message: 'Only in-progress meetings can be completed'
                });
            }

            const completedGateMeeting = await gateMeeting.complete(req.user.id);

            res.json({
                success: true,
                message: 'Gate meeting completed successfully',
                data: completedGateMeeting
            });
        } catch (error) {
            logger.error('Error completing gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to complete gate meeting',
                error: error.message
            });
        }
    }

    /**
     * Cancel gate meeting
     */
    static async cancelGateMeeting(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const gateMeeting = await GateMeeting.findById(id);

            if (!gateMeeting) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            if (gateMeeting.status === 'Completed' || gateMeeting.status === 'Cancelled') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel completed or already cancelled meetings'
                });
            }

            const cancelledGateMeeting = await gateMeeting.cancel(req.user.id, reason);

            res.json({
                success: true,
                message: 'Gate meeting cancelled successfully',
                data: cancelledGateMeeting
            });
        } catch (error) {
            logger.error('Error cancelling gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel gate meeting',
                error: error.message
            });
        }
    }

    /**
     * Add attendee to gate meeting
     */
    static async addAttendee(req, res) {
        try {
            const { id } = req.params;
            const attendeeData = req.body;
            const gateMeeting = await GateMeeting.findById(id);

            if (!gateMeeting) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            const updatedGateMeeting = await gateMeeting.addAttendee(attendeeData, req.user.id);

            res.json({
                success: true,
                message: 'Attendee added successfully',
                data: updatedGateMeeting
            });
        } catch (error) {
            logger.error('Error adding attendee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add attendee',
                error: error.message
            });
        }
    }

    /**
     * Remove attendee from gate meeting
     */
    static async removeAttendee(req, res) {
        try {
            const { id, attendeeId } = req.params;
            const gateMeeting = await GateMeeting.findById(id);

            if (!gateMeeting) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            const updatedGateMeeting = await gateMeeting.removeAttendee(attendeeId, req.user.id);

            res.json({
                success: true,
                message: 'Attendee removed successfully',
                data: updatedGateMeeting
            });
        } catch (error) {
            logger.error('Error removing attendee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove attendee',
                error: error.message
            });
        }
    }

    /**
     * Add action item to gate meeting
     */
    static async addActionItem(req, res) {
        try {
            const { id } = req.params;
            const actionItemData = req.body;
            const gateMeeting = await GateMeeting.findById(id);

            if (!gateMeeting) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            const updatedGateMeeting = await gateMeeting.addActionItem(actionItemData, req.user.id);

            res.json({
                success: true,
                message: 'Action item added successfully',
                data: updatedGateMeeting
            });
        } catch (error) {
            logger.error('Error adding action item:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add action item',
                error: error.message
            });
        }
    }

    /**
     * Update action item in gate meeting
     */
    static async updateActionItem(req, res) {
        try {
            const { id, actionItemId } = req.params;
            const updates = req.body;
            const gateMeeting = await GateMeeting.findById(id);

            if (!gateMeeting) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            const updatedGateMeeting = await gateMeeting.updateActionItem(actionItemId, updates, req.user.id);

            res.json({
                success: true,
                message: 'Action item updated successfully',
                data: updatedGateMeeting
            });
        } catch (error) {
            logger.error('Error updating action item:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update action item',
                error: error.message
            });
        }
    }

    /**
     * Get gate meeting statistics
     */
    static async getGateMeetingStatistics(req, res) {
        try {
            const { projectId } = req.query;
            const options = {};
            
            if (projectId) options.projectId = projectId;

            const statistics = await GateMeeting.getStatistics(options);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            logger.error('Error fetching gate meeting statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch gate meeting statistics',
                error: error.message
            });
        }
    }
}

module.exports = GateMeetingsController;

