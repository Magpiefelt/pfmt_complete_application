/**
 * Reports Controller
 * Handles project reporting operations for Team A integration
 */

const Report = require('../models/Report');
const { validationResult } = require('express-validator');
const { logger } = require('../middleware/logging');

class ReportsController {
    /**
     * Get all reports with filtering and pagination
     */
    static async getAllReports(req, res) {
        try {
            const {
                projectId,
                type,
                status,
                createdBy,
                page = 1,
                limit = 20,
                orderBy = 'created_at DESC',
                search
            } = req.query;

            const options = {
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                orderBy
            };

            // Add filters
            if (projectId) options.projectId = projectId;
            if (type) options.type = type;
            if (status) options.status = status;
            if (createdBy) options.createdBy = createdBy;
            if (search) options.search = search;

            const reports = await Report.findAll(options);
            const statistics = await Report.getStatistics(options);

            res.json({
                success: true,
                data: reports,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(statistics.total_reports)
                },
                statistics
            });
        } catch (error) {
            logger.error('Error fetching reports:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch reports',
                error: error.message
            });
        }
    }

    /**
     * Get report by ID
     */
    static async getReportById(req, res) {
        try {
            const { id } = req.params;
            const report = await Report.findById(id);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
            }

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Error fetching report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch report',
                error: error.message
            });
        }
    }

    /**
     * Get reports by project ID
     */
    static async getReportsByProject(req, res) {
        try {
            const { projectId } = req.params;
            const reports = await Report.findByProject(projectId);

            res.json({
                success: true,
                data: reports,
                count: reports.length
            });
        } catch (error) {
            logger.error('Error fetching project reports:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project reports',
                error: error.message
            });
        }
    }

    /**
     * Get reports by type
     */
    static async getReportsByType(req, res) {
        try {
            const { type } = req.params;
            const reports = await Report.findByType(type);

            res.json({
                success: true,
                data: reports,
                count: reports.length
            });
        } catch (error) {
            logger.error('Error fetching reports by type:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch reports by type',
                error: error.message
            });
        }
    }

    /**
     * Create new report
     */
    static async createReport(req, res) {
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

            const reportData = req.body;
            const report = new Report(reportData);

            // Validate report data
            const validationErrors = report.validate();
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Report validation failed',
                    errors: validationErrors
                });
            }

            const savedReport = await report.save(req.user.id);

            res.status(201).json({
                success: true,
                message: 'Report created successfully',
                data: savedReport
            });
        } catch (error) {
            logger.error('Error creating report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create report',
                error: error.message
            });
        }
    }

    /**
     * Update report
     */
    static async updateReport(req, res) {
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
            const report = await Report.findById(id);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
            }

            // Check if user can edit this report
            if (report.status === 'Approved' && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot edit approved reports'
                });
            }

            const updatedReport = await report.update(req.body, req.user.id);

            res.json({
                success: true,
                message: 'Report updated successfully',
                data: updatedReport
            });
        } catch (error) {
            logger.error('Error updating report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update report',
                error: error.message
            });
        }
    }

    /**
     * Delete report
     */
    static async deleteReport(req, res) {
        try {
            const { id } = req.params;
            const report = await Report.findById(id);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
            }

            // Check if user can delete this report
            if (report.status === 'Approved' && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot delete approved reports'
                });
            }

            await report.delete(req.user.id);

            res.json({
                success: true,
                message: 'Report deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete report',
                error: error.message
            });
        }
    }

    /**
     * Submit report for approval
     */
    static async submitReport(req, res) {
        try {
            const { id } = req.params;
            const report = await Report.findById(id);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
            }

            if (report.status !== 'Draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Only draft reports can be submitted'
                });
            }

            const submittedReport = await report.submit(req.user.id);

            res.json({
                success: true,
                message: 'Report submitted successfully',
                data: submittedReport
            });
        } catch (error) {
            logger.error('Error submitting report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit report',
                error: error.message
            });
        }
    }

    /**
     * Approve report
     */
    static async approveReport(req, res) {
        try {
            const { id } = req.params;
            const report = await Report.findById(id);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
            }

            if (report.status !== 'Submitted') {
                return res.status(400).json({
                    success: false,
                    message: 'Only submitted reports can be approved'
                });
            }

            const approvedReport = await report.approve(req.user.id);

            res.json({
                success: true,
                message: 'Report approved successfully',
                data: approvedReport
            });
        } catch (error) {
            logger.error('Error approving report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve report',
                error: error.message
            });
        }
    }

    /**
     * Reject report
     */
    static async rejectReport(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const report = await Report.findById(id);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Report not found'
                });
            }

            if (report.status !== 'Submitted') {
                return res.status(400).json({
                    success: false,
                    message: 'Only submitted reports can be rejected'
                });
            }

            const rejectedReport = await report.reject(req.user.id, reason);

            res.json({
                success: true,
                message: 'Report rejected successfully',
                data: rejectedReport
            });
        } catch (error) {
            logger.error('Error rejecting report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject report',
                error: error.message
            });
        }
    }

    /**
     * Get report statistics
     */
    static async getReportStatistics(req, res) {
        try {
            const { projectId, type } = req.query;
            const options = {};
            
            if (projectId) options.projectId = projectId;
            if (type) options.type = type;

            const statistics = await Report.getStatistics(options);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            logger.error('Error fetching report statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch report statistics',
                error: error.message
            });
        }
    }

    /**
     * Get report types
     */
    static async getReportTypes(req, res) {
        try {
            const reportTypes = await Report.getReportTypes();

            res.json({
                success: true,
                data: reportTypes
            });
        } catch (error) {
            logger.error('Error fetching report types:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch report types',
                error: error.message
            });
        }
    }
}

module.exports = ReportsController;

