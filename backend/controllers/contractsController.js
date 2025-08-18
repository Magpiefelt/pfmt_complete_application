/**
 * Contracts Controller
 * Handles contract management operations for Team A integration
 */

const Contract = require('../models/Contract');
const { validationResult } = require('express-validator');
const { logger } = require('../middleware/logging');

class ContractsController {
    /**
     * Get all contracts with filtering and pagination
     */
    static async getAllContracts(req, res) {
        try {
            const {
                projectId,
                vendorId,
                status,
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
            if (vendorId) options.vendorId = vendorId;
            if (status) options.status = status;
            if (search) options.search = search;

            const contracts = await Contract.findAll(options);
            const statistics = await Contract.getStatistics(options);

            res.json({
                success: true,
                data: contracts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(statistics.total_contracts)
                },
                statistics
            });
        } catch (error) {
            logger.error('Error fetching contracts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contracts',
                error: error.message
            });
        }
    }

    /**
     * Get contract by ID
     */
    static async getContractById(req, res) {
        try {
            const { id } = req.params;
            const contract = await Contract.findById(id);

            if (!contract) {
                return res.status(404).json({
                    success: false,
                    message: 'Contract not found'
                });
            }

            res.json({
                success: true,
                data: contract
            });
        } catch (error) {
            logger.error('Error fetching contract:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contract',
                error: error.message
            });
        }
    }

    /**
     * Get contracts by project ID
     */
    static async getContractsByProject(req, res) {
        try {
            const { projectId } = req.params;
            const contracts = await Contract.findByProject(projectId);

            res.json({
                success: true,
                data: contracts,
                count: contracts.length
            });
        } catch (error) {
            logger.error('Error fetching project contracts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project contracts',
                error: error.message
            });
        }
    }

    /**
     * Get contracts by vendor ID
     */
    static async getContractsByVendor(req, res) {
        try {
            const { vendorId } = req.params;
            const contracts = await Contract.findByVendor(vendorId);

            res.json({
                success: true,
                data: contracts,
                count: contracts.length
            });
        } catch (error) {
            logger.error('Error fetching vendor contracts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch vendor contracts',
                error: error.message
            });
        }
    }

    /**
     * Create new contract
     */
    static async createContract(req, res) {
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

            const contractData = req.body;
            const contract = new Contract(contractData);

            // Validate contract data
            const validationErrors = contract.validate();
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Contract validation failed',
                    errors: validationErrors
                });
            }

            const savedContract = await contract.save(req.user.id);

            res.status(201).json({
                success: true,
                message: 'Contract created successfully',
                data: savedContract
            });
        } catch (error) {
            logger.error('Error creating contract:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create contract',
                error: error.message
            });
        }
    }

    /**
     * Update contract
     */
    static async updateContract(req, res) {
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
            const contract = await Contract.findById(id);

            if (!contract) {
                return res.status(404).json({
                    success: false,
                    message: 'Contract not found'
                });
            }

            const updatedContract = await contract.update(req.body, req.user.id);

            res.json({
                success: true,
                message: 'Contract updated successfully',
                data: updatedContract
            });
        } catch (error) {
            logger.error('Error updating contract:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update contract',
                error: error.message
            });
        }
    }

    /**
     * Delete contract
     */
    static async deleteContract(req, res) {
        try {
            const { id } = req.params;
            const contract = await Contract.findById(id);

            if (!contract) {
                return res.status(404).json({
                    success: false,
                    message: 'Contract not found'
                });
            }

            await contract.delete(req.user.id);

            res.json({
                success: true,
                message: 'Contract deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting contract:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete contract',
                error: error.message
            });
        }
    }

    /**
     * Approve contract
     */
    static async approveContract(req, res) {
        try {
            const { id } = req.params;
            const contract = await Contract.findById(id);

            if (!contract) {
                return res.status(404).json({
                    success: false,
                    message: 'Contract not found'
                });
            }

            if (contract.status !== 'Draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Only draft contracts can be approved'
                });
            }

            const approvedContract = await contract.approve(req.user.id);

            res.json({
                success: true,
                message: 'Contract approved successfully',
                data: approvedContract
            });
        } catch (error) {
            logger.error('Error approving contract:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve contract',
                error: error.message
            });
        }
    }

    /**
     * Get contract statistics
     */
    static async getContractStatistics(req, res) {
        try {
            const { projectId, vendorId } = req.query;
            const options = {};
            
            if (projectId) options.projectId = projectId;
            if (vendorId) options.vendorId = vendorId;

            const statistics = await Contract.getStatistics(options);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            logger.error('Error fetching contract statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contract statistics',
                error: error.message
            });
        }
    }
}

module.exports = ContractsController;

