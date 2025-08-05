const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Phase1Enhancements {
  // Get project financial summary for Phase 1 Reports tab
  async getProjectFinancialSummary(req, res) {
    try {
      const { projectId } = req.params;

      // Get project basic info
      const projectQuery = `
        SELECT 
          p.*,
          cm.name as client_ministry_name,
          u.first_name || ' ' || u.last_name as modified_by_name
        FROM projects p
        LEFT JOIN client_ministries cm ON p.client_ministry_id = cm.id
        LEFT JOIN users u ON p.modified_by = u.id
        WHERE p.id = $1
      `;
      const projectResult = await pool.query(projectQuery, [projectId]);
      
      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const project = projectResult.rows[0];

      // Get contract summary
      const contractSummaryQuery = `
        SELECT 
          COUNT(*) as total_contracts,
          SUM(original_value) as total_original_value,
          SUM(current_value) as total_current_value,
          SUM(current_value - original_value) as total_change_orders
        FROM contracts
        WHERE project_id = $1 AND status = 'active'
      `;
      const contractSummaryResult = await pool.query(contractSummaryQuery, [projectId]);
      const contractSummary = contractSummaryResult.rows[0];

      // Get payment summary
      const paymentSummaryQuery = `
        SELECT 
          COUNT(*) as total_payments,
          SUM(amount) as total_paid,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid_confirmed,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
        FROM contract_payments
        WHERE project_id = $1
      `;
      const paymentSummaryResult = await pool.query(paymentSummaryQuery, [projectId]);
      const paymentSummary = paymentSummaryResult.rows[0];

      // Get budget transfer summary
      const transferSummaryQuery = `
        SELECT 
          COUNT(*) as total_transfers,
          SUM(amount) as total_transferred,
          SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_approved_transfers
        FROM budget_transfers
        WHERE project_id = $1
      `;
      const transferSummaryResult = await pool.query(transferSummaryQuery, [projectId]);
      const transferSummary = transferSummaryResult.rows[0];

      // Calculate financial metrics
      const totalBudget = parseFloat(contractSummary.total_current_value) || 0;
      const totalSpent = parseFloat(paymentSummary.total_paid_confirmed) || 0;
      const remainingBudget = totalBudget - totalSpent;
      const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      const variance = remainingBudget;
      const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

      // Get spending trend (last 12 months)
      const spendingTrendQuery = `
        SELECT 
          DATE_TRUNC('month', payment_date) as month,
          SUM(amount) as monthly_spending,
          COUNT(*) as payment_count
        FROM contract_payments
        WHERE project_id = $1 
          AND status = 'paid'
          AND payment_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', payment_date)
        ORDER BY month
      `;
      const spendingTrendResult = await pool.query(spendingTrendQuery, [projectId]);

      res.json({
        success: true,
        data: {
          project,
          financialSummary: {
            totalBudget,
            totalSpent,
            remainingBudget,
            budgetUtilization: budgetUtilization.toFixed(2),
            variance,
            variancePercent: variancePercent.toFixed(2),
            contractSummary: {
              ...contractSummary,
              total_original_value: parseFloat(contractSummary.total_original_value) || 0,
              total_current_value: parseFloat(contractSummary.total_current_value) || 0,
              total_change_orders: parseFloat(contractSummary.total_change_orders) || 0
            },
            paymentSummary: {
              ...paymentSummary,
              total_paid: parseFloat(paymentSummary.total_paid) || 0,
              total_paid_confirmed: parseFloat(paymentSummary.total_paid_confirmed) || 0,
              total_pending: parseFloat(paymentSummary.total_pending) || 0
            },
            transferSummary: {
              ...transferSummary,
              total_transferred: parseFloat(transferSummary.total_transferred) || 0,
              total_approved_transfers: parseFloat(transferSummary.total_approved_transfers) || 0
            }
          },
          spendingTrend: spendingTrendResult.rows
        }
      });

    } catch (error) {
      console.error('Error fetching project financial summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project financial summary'
      });
    }
  }

  // Get contract payments for a project
  async getContractPayments(req, res) {
    try {
      const { projectId } = req.params;
      const { contractId, status, startDate, endDate, page = 1, limit = 50 } = req.query;

      let whereConditions = ['cp.project_id = $1'];
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

      const paymentsQuery = `
        SELECT 
          cp.*,
          c.contract_name,
          c.contract_number,
          v.name as vendor_name,
          u1.first_name || ' ' || u1.last_name as approved_by_name,
          u2.first_name || ' ' || u2.last_name as created_by_name
        FROM contract_payments cp
        LEFT JOIN contracts c ON cp.contract_id = c.id
        LEFT JOIN vendors v ON c.vendor_id = v.id
        LEFT JOIN users u1 ON cp.approved_by = u1.id
        LEFT JOIN users u2 ON cp.created_by = u2.id
        WHERE ${whereClause}
        ORDER BY cp.payment_date DESC, cp.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);
      const paymentsResult = await pool.query(paymentsQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM contract_payments cp
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount));

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
      console.error('Error fetching contract payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contract payments'
      });
    }
  }

  // Add a new contract payment
  async addContractPayment(req, res) {
    try {
      const { projectId } = req.params;
      const {
        contractId,
        amount,
        paymentDate,
        status = 'pending',
        sourceRef,
        paymentType,
        description
      } = req.body;

      const userId = req.user?.id; // Assuming user ID is available from auth middleware

      const insertQuery = `
        INSERT INTO contract_payments (
          id, contract_id, project_id, amount, payment_date, status,
          source_ref, payment_type, description, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const paymentId = uuidv4();
      const values = [
        paymentId, contractId, projectId, amount, paymentDate, status,
        sourceRef, paymentType, description, userId
      ];

      const result = await pool.query(insertQuery, values);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Contract payment added successfully'
      });

    } catch (error) {
      console.error('Error adding contract payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add contract payment'
      });
    }
  }

  // Get budget transfer ledger for a project
  async getBudgetTransferLedger(req, res) {
    try {
      const { projectId } = req.params;
      const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

      let whereConditions = ['bt.project_id = $1'];
      let queryParams = [projectId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        whereConditions.push(`bt.status = $${paramCount}`);
        queryParams.push(status);
      }

      if (startDate) {
        paramCount++;
        whereConditions.push(`bt.transfer_date >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`bt.transfer_date <= $${paramCount}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      const transfersQuery = `
        SELECT 
          bt.*,
          u1.first_name || ' ' || u1.last_name as approved_by_name,
          u2.first_name || ' ' || u2.last_name as created_by_name
        FROM budget_transfers bt
        LEFT JOIN users u1 ON bt.approved_by = u1.id
        LEFT JOIN users u2 ON bt.created_by = u2.id
        WHERE ${whereClause}
        ORDER BY bt.transfer_date DESC, bt.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);
      const transfersResult = await pool.query(transfersQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM budget_transfers bt
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount));

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
      console.error('Error fetching budget transfer ledger:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch budget transfer ledger'
      });
    }
  }

  // Get approval history for a project
  async getApprovalHistory(req, res) {
    try {
      const { projectId } = req.params;
      const { entityType, page = 1, limit = 50 } = req.query;

      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      // Build query based on entity type
      if (entityType === 'project') {
        whereConditions.push(`(al.table_name = 'projects' AND al.record_id = $${++paramCount})`);
        queryParams.push(projectId);
      } else if (entityType === 'budget_transfers') {
        whereConditions.push(`(al.table_name = 'budget_transfers' AND al.record_id IN (
          SELECT id FROM budget_transfers WHERE project_id = $${++paramCount}
        ))`);
        queryParams.push(projectId);
      } else if (entityType === 'contract_payments') {
        whereConditions.push(`(al.table_name = 'contract_payments' AND al.record_id IN (
          SELECT id FROM contract_payments WHERE project_id = $${++paramCount}
        ))`);
        queryParams.push(projectId);
      } else {
        // Get all approval-related history for the project
        whereConditions.push(`(
          (al.table_name = 'projects' AND al.record_id = $${++paramCount}) OR
          (al.table_name = 'budget_transfers' AND al.record_id IN (
            SELECT id FROM budget_transfers WHERE project_id = $${paramCount}
          )) OR
          (al.table_name = 'contract_payments' AND al.record_id IN (
            SELECT id FROM contract_payments WHERE project_id = $${paramCount}
          )) OR
          (al.table_name = 'contracts' AND al.record_id IN (
            SELECT id FROM contracts WHERE project_id = $${paramCount}
          ))
        )`);
        queryParams.push(projectId);
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      const historyQuery = `
        SELECT 
          al.*,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE ${whereClause}
          AND al.action IN ('INSERT', 'UPDATE')
        ORDER BY al.timestamp DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      queryParams.push(limit, offset);
      const historyResult = await pool.query(historyQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_log al
        WHERE ${whereClause}
          AND al.action IN ('INSERT', 'UPDATE')
      `;
      const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount));

      // Process the audit log entries to extract approval-related changes
      const processedHistory = historyResult.rows.map(entry => {
        let changeDescription = '';
        let changeType = 'update';

        if (entry.action === 'INSERT') {
          changeType = 'created';
          changeDescription = `${entry.table_name} created`;
        } else if (entry.action === 'UPDATE') {
          const oldValues = entry.old_values || {};
          const newValues = entry.new_values || {};
          
          // Look for approval-related field changes
          if (oldValues.status !== newValues.status) {
            changeDescription = `Status changed from "${oldValues.status}" to "${newValues.status}"`;
            if (newValues.status === 'approved') {
              changeType = 'approved';
            } else if (newValues.status === 'rejected') {
              changeType = 'rejected';
            }
          } else if (oldValues.approved_by !== newValues.approved_by) {
            changeDescription = 'Approver assigned';
            changeType = 'approval_assigned';
          } else {
            changeDescription = 'Record updated';
          }
        }

        return {
          ...entry,
          changeType,
          changeDescription,
          entityType: entry.table_name
        };
      });

      res.json({
        success: true,
        data: {
          history: processedHistory,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].total),
            totalPages: Math.ceil(countResult.rows[0].total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching approval history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch approval history'
      });
    }
  }

  // Get vendor performance scores
  async getVendorPerformance(req, res) {
    try {
      const { vendorId } = req.params;
      const { projectId, limit = 10 } = req.query;

      // Get vendor basic info with average score
      const vendorQuery = `
        SELECT 
          v.*,
          COUNT(vpr.id) as total_reviews
        FROM vendors v
        LEFT JOIN vendor_performance_reviews vpr ON v.id = vpr.vendor_id
        WHERE v.id = $1
        GROUP BY v.id
      `;
      const vendorResult = await pool.query(vendorQuery, [vendorId]);

      if (vendorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const vendor = vendorResult.rows[0];

      // Get recent performance reviews
      let reviewsQuery = `
        SELECT 
          vpr.*,
          p.project_name,
          c.contract_name,
          u.first_name || ' ' || u.last_name as reviewed_by_name
        FROM vendor_performance_reviews vpr
        LEFT JOIN projects p ON vpr.project_id = p.id
        LEFT JOIN contracts c ON vpr.contract_id = c.id
        LEFT JOIN users u ON vpr.reviewed_by = u.id
        WHERE vpr.vendor_id = $1
      `;

      let queryParams = [vendorId];
      let paramCount = 1;

      if (projectId) {
        paramCount++;
        reviewsQuery += ` AND vpr.project_id = $${paramCount}`;
        queryParams.push(projectId);
      }

      reviewsQuery += ` ORDER BY vpr.review_date DESC LIMIT $${paramCount + 1}`;
      queryParams.push(limit);

      const reviewsResult = await pool.query(reviewsQuery, queryParams);

      // Calculate performance metrics
      const reviews = reviewsResult.rows;
      const performanceMetrics = {
        averageOverallRating: vendor.average_score || 0,
        totalReviews: parseInt(vendor.total_reviews),
        averageQualityRating: reviews.length > 0 ? 
          reviews.reduce((sum, r) => sum + (parseFloat(r.quality_rating) || 0), 0) / reviews.length : 0,
        averageScheduleRating: reviews.length > 0 ? 
          reviews.reduce((sum, r) => sum + (parseFloat(r.schedule_rating) || 0), 0) / reviews.length : 0,
        averageCommunicationRating: reviews.length > 0 ? 
          reviews.reduce((sum, r) => sum + (parseFloat(r.communication_rating) || 0), 0) / reviews.length : 0,
        averageCostRating: reviews.length > 0 ? 
          reviews.reduce((sum, r) => sum + (parseFloat(r.cost_rating) || 0), 0) / reviews.length : 0
      };

      // Get project history for this vendor
      const projectHistoryQuery = `
        SELECT 
          p.id,
          p.project_name,
          c.contract_name,
          c.original_value,
          c.current_value,
          c.start_date,
          c.end_date,
          c.status
        FROM contracts c
        JOIN projects p ON c.project_id = p.id
        WHERE c.vendor_id = $1
        ORDER BY c.start_date DESC
        LIMIT 10
      `;
      const projectHistoryResult = await pool.query(projectHistoryQuery, [vendorId]);

      res.json({
        success: true,
        data: {
          vendor,
          performanceMetrics,
          recentReviews: reviews,
          projectHistory: projectHistoryResult.rows
        }
      });

    } catch (error) {
      console.error('Error fetching vendor performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vendor performance'
      });
    }
  }

  // Get enhanced gate meetings for a project
  async getProjectGateMeetings(req, res) {
    try {
      const { projectId } = req.params;
      const { status, upcoming = false, limit = 50 } = req.query;

      let whereConditions = ['gm.project_id = $1'];
      let queryParams = [projectId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        whereConditions.push(`gm.status = $${paramCount}`);
        queryParams.push(status);
      }

      if (upcoming === 'true') {
        paramCount++;
        whereConditions.push(`(gm.scheduled_date >= CURRENT_DATE OR gm.status = 'scheduled')`);
      }

      const whereClause = whereConditions.join(' AND ');

      const meetingsQuery = `
        SELECT 
          gm.*,
          p.project_name,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM gate_meetings gm
        JOIN projects p ON gm.project_id = p.id
        LEFT JOIN users u ON gm.created_by = u.id
        WHERE ${whereClause}
        ORDER BY 
          CASE WHEN gm.scheduled_date IS NOT NULL THEN gm.scheduled_date ELSE gm.actual_date END DESC,
          gm.created_at DESC
        LIMIT $${paramCount + 1}
      `;

      queryParams.push(limit);
      const meetingsResult = await pool.query(meetingsQuery, queryParams);

      res.json({
        success: true,
        data: {
          meetings: meetingsResult.rows
        }
      });

    } catch (error) {
      console.error('Error fetching project gate meetings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project gate meetings'
      });
    }
  }

  // Add a meeting note or decision
  async addMeetingNote(req, res) {
    try {
      const { meetingId } = req.params;
      const { note, decision, actionItems } = req.body;

      const userId = req.user?.id;

      // Get current meeting data
      const currentMeetingQuery = `
        SELECT decisions, action_items, minutes
        FROM gate_meetings
        WHERE id = $1
      `;
      const currentResult = await pool.query(currentMeetingQuery, [meetingId]);

      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      const currentMeeting = currentResult.rows[0];
      
      // Update meeting with new note/decision
      let updateFields = [];
      let updateValues = [];
      let paramCount = 0;

      if (note) {
        paramCount++;
        updateFields.push(`minutes = $${paramCount}`);
        const updatedMinutes = currentMeeting.minutes ? 
          `${currentMeeting.minutes}\n\n[${new Date().toISOString()}] ${note}` : note;
        updateValues.push(updatedMinutes);
      }

      if (decision) {
        paramCount++;
        updateFields.push(`decisions = $${paramCount}`);
        const currentDecisions = currentMeeting.decisions || [];
        const updatedDecisions = [...currentDecisions, {
          decision,
          timestamp: new Date().toISOString(),
          addedBy: userId
        }];
        updateValues.push(JSON.stringify(updatedDecisions));
      }

      if (actionItems) {
        paramCount++;
        updateFields.push(`action_items = $${paramCount}`);
        const currentActionItems = currentMeeting.action_items || [];
        const updatedActionItems = [...currentActionItems, ...actionItems.map(item => ({
          ...item,
          timestamp: new Date().toISOString(),
          addedBy: userId
        }))];
        updateValues.push(JSON.stringify(updatedActionItems));
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(meetingId);

      const updateQuery = `
        UPDATE gate_meetings 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await pool.query(updateQuery, updateValues);

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Meeting updated successfully'
      });

    } catch (error) {
      console.error('Error adding meeting note:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add meeting note'
      });
    }
  }
}

module.exports = new Phase1Enhancements();

