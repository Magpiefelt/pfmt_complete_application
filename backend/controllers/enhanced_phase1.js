const { query } = require('../config/database');
const { validateUUIDOrThrow } = require('../middleware/uuidValidation');
const { createError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

class EnhancedPhase1Controller {
  // Get project financial summary for Phase 1 Reports tab
  async getProjectFinancialSummary(req, res, next) {
    try {
      const { projectId } = req.params;
      
      // Validate UUID format
      validateUUIDOrThrow(projectId, 'projectId');

      // Get project basic info
      const projectQuery = `
        SELECT 
          p.*,
          u.first_name || ' ' || u.last_name as modified_by_name
        FROM projects p
        LEFT JOIN users u ON p.modified_by = u.id
        WHERE p.id = $1
      `;
      const projectResult = await query(projectQuery, [projectId]);
      
      if (projectResult.rows.length === 0) {
        throw createError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const project = projectResult.rows[0];

      // Get contract summary
      const contractSummaryQuery = `
        SELECT 
          COUNT(*) as total_contracts,
          COALESCE(SUM(contract_value), 0) as total_contract_value
        FROM contracts
        WHERE project_id = $1
      `;
      const contractSummaryResult = await query(contractSummaryQuery, [projectId]);
      const contractSummary = contractSummaryResult.rows[0];

      // Get payment summary with payment_amount field and amount alias
      const paymentSummaryQuery = `
        SELECT 
          COUNT(*) as total_payments,
          COALESCE(SUM(cp.payment_amount), 0) as total_paid,
          COALESCE(SUM(CASE WHEN cp.status = 'completed' THEN cp.payment_amount ELSE 0 END), 0) as total_paid_confirmed,
          COALESCE(SUM(CASE WHEN cp.status = 'pending' THEN cp.payment_amount ELSE 0 END), 0) as total_pending
        FROM contract_payments cp
        JOIN contracts c ON cp.contract_id = c.id
        WHERE c.project_id = $1
      `;
      const paymentSummaryResult = await query(paymentSummaryQuery, [projectId]);
      const paymentSummary = paymentSummaryResult.rows[0];

      // Get budget transfer summary
      const transferSummaryQuery = `
        SELECT 
          COUNT(*) as total_transfers,
          COALESCE(SUM(amount), 0) as total_transferred,
          COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as total_approved_transfers
        FROM budget_transfers
        WHERE source_project_id = $1 OR target_project_id = $1
      `;
      const transferSummaryResult = await query(transferSummaryQuery, [projectId]);
      const transferSummary = transferSummaryResult.rows[0];

      // Calculate financial metrics
      const totalBudget = parseFloat(contractSummary.total_contract_value) || 0;
      const totalSpent = parseFloat(paymentSummary.total_paid_confirmed) || 0;
      const remainingBudget = totalBudget - totalSpent;
      const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      // Get spending trend (last 12 months)
      const spendingTrendQuery = `
        SELECT 
          DATE_TRUNC('month', cp.payment_date) as month,
          COALESCE(SUM(cp.payment_amount), 0) as monthly_spending,
          COUNT(*) as payment_count
        FROM contract_payments cp
        JOIN contracts c ON cp.contract_id = c.id
        WHERE c.project_id = $1 
          AND cp.status = 'completed'
          AND cp.payment_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', cp.payment_date)
        ORDER BY month
      `;
      const spendingTrendResult = await query(spendingTrendQuery, [projectId]);

      res.json({
        success: true,
        data: {
          project,
          financialSummary: {
            totalBudget,
            totalSpent,
            remainingBudget,
            budgetUtilization: Math.round(budgetUtilization * 100) / 100,
            contractSummary: {
              totalContracts: parseInt(contractSummary.total_contracts),
              totalValue: totalBudget
            },
            paymentSummary: {
              totalPayments: parseInt(paymentSummary.total_payments),
              totalPaid: parseFloat(paymentSummary.total_paid),
              totalConfirmed: parseFloat(paymentSummary.total_paid_confirmed),
              totalPending: parseFloat(paymentSummary.total_pending)
            },
            transferSummary: {
              totalTransfers: parseInt(transferSummary.total_transfers),
              totalTransferred: parseFloat(transferSummary.total_transferred),
              totalApproved: parseFloat(transferSummary.total_approved_transfers)
            },
            spendingTrend: spendingTrendResult.rows
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Get contract payments for a project with amount alias for backward compatibility
  async getContractPayments(req, res, next) {
    try {
      const { projectId } = req.params;
      const { contractId, status, startDate, endDate, page = 1, limit = 50 } = req.query;

      // Validate UUID format
      validateUUIDOrThrow(projectId, 'projectId');
      if (contractId) {
        validateUUIDOrThrow(contractId, 'contractId');
      }

      let whereConditions = ['c.project_id = $1'];
      let queryParams = [projectId];
      let paramCount = 1;

      if (contractId) {
        paramCount++;
        whereConditions.push(`cp.contract_id = $${paramCount}`);
        queryParams.push(contractId);
      }

      if (status) {
        paramCount++;
        whereConditions.push(`cp.status = $${paramCount}`);
        queryParams.push(status);
      }

      if (startDate) {
        paramCount++;
        whereConditions.push(`cp.payment_date >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`cp.payment_date <= $${paramCount}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      // Query with payment_amount aliased as amount for backward compatibility
      const paymentsQuery = `
        SELECT 
          cp.id,
          cp.contract_id,
          cp.payment_amount AS amount,
          cp.payment_amount,
          cp.payment_date,
          cp.status,
          cp.payment_type,
          cp.description,
          cp.created_at,
          cp.updated_at,
          c.contract_number,
          c.description as contract_description,
          v.name as vendor_name,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM contract_payments cp
        LEFT JOIN contracts c ON cp.contract_id = c.id
        LEFT JOIN vendors v ON c.vendor_id = v.id
        LEFT JOIN users u ON cp.created_by = u.id
        WHERE ${whereClause}
        ORDER BY cp.payment_date DESC, cp.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);
      const paymentsResult = await query(paymentsQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM contract_payments cp
        LEFT JOIN contracts c ON cp.contract_id = c.id
        WHERE ${whereClause}
      `;
      const countResult = await query(countQuery, queryParams.slice(0, paramCount));

      res.json({
        success: true,
        data: {
          payments: paymentsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].total),
            totalPages: Math.ceil(countResult.rows[0].total / limit)
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Add a new contract payment
  async addContractPayment(req, res, next) {
    try {
      const { projectId } = req.params;
      const {
        contractId,
        amount, // Accept amount from client
        paymentDate,
        status = 'pending',
        paymentType,
        description
      } = req.body;

      // Validate UUIDs
      validateUUIDOrThrow(projectId, 'projectId');
      validateUUIDOrThrow(contractId, 'contractId');

      // Validate required fields
      if (!amount || amount <= 0) {
        throw createError('Payment amount must be greater than 0', 400, 'INVALID_AMOUNT');
      }

      if (!paymentDate) {
        throw createError('Payment date is required', 400, 'MISSING_PAYMENT_DATE');
      }

      // Verify contract exists and belongs to project
      const contractCheckQuery = `
        SELECT id FROM contracts 
        WHERE id = $1 AND project_id = $2
      `;
      const contractCheck = await query(contractCheckQuery, [contractId, projectId]);
      
      if (contractCheck.rows.length === 0) {
        throw createError('Contract not found or does not belong to this project', 404, 'CONTRACT_NOT_FOUND');
      }

      const userId = req.headers['x-user-id']; // From auth middleware

      // Insert payment using payment_amount field
      const insertQuery = `
        INSERT INTO contract_payments (
          id, contract_id, payment_amount, payment_date, status,
          payment_type, description, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, contract_id, payment_amount AS amount, payment_amount, 
                  payment_date, status, payment_type, description, created_at, updated_at
      `;

      const paymentId = uuidv4();
      const values = [
        paymentId, contractId, amount, paymentDate, status,
        paymentType, description, userId
      ];

      const result = await query(insertQuery, values);

      res.status(201).json({
        success: true,
        data: {
          payment: result.rows[0]
        },
        message: 'Contract payment added successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  // Get budget transfer ledger for a project
  async getBudgetTransferLedger(req, res, next) {
    try {
      const { projectId } = req.params;
      const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

      // Validate UUID format
      validateUUIDOrThrow(projectId, 'projectId');

      let whereConditions = ['(bt.source_project_id = $1 OR bt.target_project_id = $1)'];
      let queryParams = [projectId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        whereConditions.push(`bt.status = $${paramCount}`);
        queryParams.push(status);
      }

      if (startDate) {
        paramCount++;
        whereConditions.push(`bt.created_at >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`bt.created_at <= $${paramCount}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      const transfersQuery = `
        SELECT 
          bt.*,
          sp.project_name as source_project_name,
          tp.project_name as target_project_name,
          u1.first_name || ' ' || u1.last_name as approved_by_name,
          u2.first_name || ' ' || u2.last_name as requested_by_name
        FROM budget_transfers bt
        LEFT JOIN projects sp ON bt.source_project_id = sp.id
        LEFT JOIN projects tp ON bt.target_project_id = tp.id
        LEFT JOIN users u1 ON bt.approved_by = u1.id
        LEFT JOIN users u2 ON bt.requested_by = u2.id
        WHERE ${whereClause}
        ORDER BY bt.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);
      const transfersResult = await query(transfersQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM budget_transfers bt
        WHERE ${whereClause}
      `;
      const countResult = await query(countQuery, queryParams.slice(0, paramCount));

      res.json({
        success: true,
        data: {
          transfers: transfersResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].total),
            totalPages: Math.ceil(countResult.rows[0].total / limit)
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnhancedPhase1Controller();

