/**
 * Change Orders Controller
 * Handles change order management operations for Team A integration
 */

const ChangeOrder = require('../models/ChangeOrder');
const { validationResult } = require('express-validator');
const { logger } = require('../middleware/logging');

class ChangeOrdersController {
    /**
     * Get all change orders with filtering and pagination
     */
    static async getAllChangeOrders(req, res) {
        try {
            const {
                projectId,
                contractId,
                status,
                requestedBy,
                costImpactMin,
                costImpactMax,
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
            if (contractId) options.contractId = contractId;
            if (status) options.status = status;
            if (requestedBy) options.requestedBy = requestedBy;
            if (costImpactMin) options.costImpactMin = parseFloat(costImpactMin);
            if (costImpactMax) options.costImpactMax = parseFloat(costImpactMax);
            if (search) options.search = search;

            const changeOrders = await ChangeOrder.findAll(options);
            const statistics = await ChangeOrder.getStatistics(options);

            res.json({
                success: true,
                data: changeOrders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(statistics.total_change_orders)
                },
                statistics
            });
        } catch (error) {
            logger.error('Error fetching change orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch change orders',
                error: error.message
            });
        }
    }

    /**
     * Get change order by ID
     */
    static async getChangeOrderById(req, res) {
        try {
            const { id } = req.params;
            const changeOrder = await ChangeOrder.findById(id);

            if (!changeOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Change order not found'
                });
            }

            res.json({
                success: true,
                data: changeOrder
            });
        } catch (error) {
            logger.error('Error fetching change order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch change order',
                error: error.message
            });
        }
    }

    /**
     * Get change orders by project ID
     */
    static async getChangeOrdersByProject(req, res) {
        try {
            const { projectId } = req.params;
            const changeOrders = await ChangeOrder.findByProject(projectId);

            res.json({
                success: true,
                data: changeOrders,
                count: changeOrders.length
            });
        } catch (error) {
            logger.error('Error fetching project change orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project change orders',
                error: error.message
            });
        }
    }

    /**
     * Get change orders by contract ID
     */
    static async getChangeOrdersByContract(req, res) {
        try {
            const { contractId } = req.params;
            const changeOrders = await ChangeOrder.findByContract(contractId);

            res.json({
                success: true,
                data: changeOrders,
                count: changeOrders.length
            });
        } catch (error) {
            logger.error('Error fetching contract change orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contract change orders',
                error: error.message
            });
        }
    }

    /**
     * Create new change order
     */
    static async createChangeOrder(req, res) {
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

            const changeOrderData = req.body;
            const changeOrder = new ChangeOrder(changeOrderData);

            // Validate change order data
            const validationErrors = changeOrder.validate();
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Change order validation failed',
                    errors: validationErrors
                });
            }

            const savedChangeOrder = await changeOrder.save(req.user.id);

            res.status(201).json({
                success: true,
                message: 'Change order created successfully',
                data: savedChangeOrder
            });
        } catch (error) {
            logger.error('Error creating change order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create change order',
                error: error.message
            });
        }
    }

    /**
     * Update change order
     */
    static async updateChangeOrder(req, res) {
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
            const changeOrder = await ChangeOrder.findById(id);

            if (!changeOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Change order not found'
                });
            }

            // Check if change order can be updated
            if (changeOrder.status === 'Approved' || changeOrder.status === 'Implemented') {
                if (req.user.role !== 'Admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Cannot update approved or implemented change orders'
                    });
                }
            }

            const updatedChangeOrder = await changeOrder.update(req.body, req.user.id);

            res.json({
                success: true,
                message: 'Change order updated successfully',
                data: updatedChangeOrder
            });
        } catch (error) {
            logger.error('Error updating change order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update change order',
                error: error.message
            });
        }
    }

    /**
     * Delete change order
     */
    static async deleteChangeOrder(req, res) {
        try {
            const { id } = req.params;
            const changeOrder = await ChangeOrder.findById(id);

            if (!changeOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Change order not found'
                });
            }

            // Check if change order can be deleted
            if (changeOrder.status === 'Approved' || changeOrder.status === 'Implemented') {
                if (req.user.role !== 'Admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Cannot delete approved or implemented change orders'
                    });
                }
            }

            await changeOrder.delete(req.user.id);

            res.json({
                success: true,
                message: 'Change order deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting change order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete change order',
                error: error.message
            });
        }
    }

    /**
     * Submit change order for approval
     */
    static async submitChangeOrder(req, res) {
        try {
            const { id } = req.params;
            const changeOrder = await ChangeOrder.findById(id);

            if (!changeOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Change order not found'
                });
            }

            if (changeOrder.status !== 'Draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Only draft change orders can be submitted'
                });
            }

            const submittedChangeOrder = await changeOrder.submit(req.user.id);

            res.json({
                success: true,
                message: 'Change order submitted successfully',
                data: submittedChangeOrder
            });
        } catch (error) {
            logger.error('Error submitting change order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit change order',
                error: error.message
            });
        }
    }

    /**
     * Approve change order
     */
    static async approveChangeOrder(req, res) {
        try {
            const { id } = req.params;
            const changeOrder = await ChangeOrder.findById(id);

            if (!changeOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Change order not found'
                });
            }

            if (changeOrder.status !== 'Submitted') {
                return res.status(400).json({
                    success: false,
                    message: 'Only submitted change orders can be approved'
                });
            }

            const approvedChangeOrder = await changeOrder.approve(req.user.id);

            res.json({
                success: true,
                message: 'Change order approved successfully',
                data: approvedChangeOrder
            });
        } catch (error) {
            logger.error('Error approving change order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve change order',
                error: error.message
            });
        }
    }

    /**
     * Reject change order
     */
    static async rejectChangeOrder(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const changeOrder = await ChangeOrder.findById(id);

            if (!changeOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Change order not found'
                });
            }

            if (changeOrder.status !== 'Submitted') {
                return res.status(400).json({
                    success: false,
                    message: 'Only submitted change orders can be rejected'
                });
            }

            const rejectedChangeOrder = await changeOrder.reject(req.user.id, reason);

            res.json({
                success: true,
                message: 'Change order rejected successfully',
                data: rejectedChangeOrder
            });
        } catch (error) {
            logger.error('Error rejecting change order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject change order',
                error: error.message
            });
        }
    }

    /**
     * Implement change order
     */
    static async implementChangeOrder(req, res) {
        try {
            const { id } = req.params;
            const changeOrder = await ChangeOrder.findById(id);

            if (!changeOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Change order not found'
                });
            }

            if (changeOrder.status !== 'Approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Only approved change orders can be implemented'
                });
            }

            const implementedChangeOrder = await changeOrder.implement(req.user.id);

            res.json({
                success: true,
                message: 'Change order implemented successfully',
                data: implementedChangeOrder
            });
        } catch (error) {
            logger.error('Error implementing change order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to implement change order',
                error: error.message
            });
        }
    }

    /**
     * Get change order statistics
     */
    static async getChangeOrderStatistics(req, res) {
        try {
            const { projectId, contractId } = req.query;
            const options = {};
            
            if (projectId) options.projectId = projectId;
            if (contractId) options.contractId = contractId;

            const statistics = await ChangeOrder.getStatistics(options);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            logger.error('Error fetching change order statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch change order statistics',
                error: error.message
            });
        }
    }

    /**
     * Get change order impact summary
     */
    static async getChangeOrderImpactSummary(req, res) {
        try {
            const { projectId, contractId } = req.query;
            const options = {};
            
            if (projectId) options.projectId = projectId;
            if (contractId) options.contractId = contractId;

            const impactSummary = await ChangeOrder.getImpactSummary(options);

            res.json({
                success: true,
                data: impactSummary
            });
        } catch (error) {
            logger.error('Error fetching change order impact summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch change order impact summary',
                error: error.message
            });
        }
    }
}

module.exports = ChangeOrdersController;

