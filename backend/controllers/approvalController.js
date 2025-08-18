const pool = require('../config/database');

class ApprovalController {
  // Submit budget for approval
  async submitBudgetApproval(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { budgetId } = req.params;
      const { comments, urgency = 'Normal' } = req.body;
      const userId = req.user.id;

      // Verify budget exists and user has permission
      const budgetQuery = `
        SELECT pb.*, p.project_name as project_name 
        FROM project_budgets pb
        JOIN projects p ON pb.project_id = p.id
        WHERE pb.id = $1
      `;
      
      const budgetResult = await client.query(budgetQuery, [budgetId]);
      
      if (budgetResult.rows.length === 0) {
        throw new Error('Budget not found');
      }

      const budget = budgetResult.rows[0];

      // Check if approval already exists
      const existingApprovalQuery = `
        SELECT id FROM budget_approvals 
        WHERE budget_id = $1 AND status = 'Pending'
      `;
      
      const existingApprovalResult = await client.query(existingApprovalQuery, [budgetId]);
      
      if (existingApprovalResult.rows.length > 0) {
        throw new Error('Budget approval already pending');
      }

      // Determine approval level based on budget amount
      let approvalLevel = 1;
      const totalBudget = parseFloat(budget.total_budget);
      
      if (totalBudget > 1000000) {
        approvalLevel = 3; // Executive approval
      } else if (totalBudget > 100000) {
        approvalLevel = 2; // Director approval
      }

      // Create approval request
      const approvalQuery = `
        INSERT INTO budget_approvals (
          budget_id, approval_level, requested_by, status, comments,
          urgency, requested_at
        ) VALUES ($1, $2, $3, 'Pending', $4, $5, NOW())
        RETURNING *
      `;

      const approvalResult = await client.query(approvalQuery, [
        budgetId, approvalLevel, userId, comments, urgency
      ]);

      // Update budget status
      await client.query(
        'UPDATE project_budgets SET status = $1 WHERE id = $2',
        ['Pending Approval', budgetId]
      );

      // Create audit trail entry
      const auditQuery = `
        INSERT INTO budget_audit_trail (
          budget_id, action_type, action_description, performed_by, performed_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `;

      await client.query(auditQuery, [
        budgetId,
        'Approval Requested',
        `Budget approval requested with ${urgency} urgency: ${comments}`,
        userId
      ]);

      // Notify approvers (in a real system, this would send notifications)
      const notificationQuery = `
        INSERT INTO approval_notifications (
          approval_id, recipient_role, message, created_at
        ) VALUES ($1, $2, $3, NOW())
      `;

      const recipientRole = approvalLevel === 3 ? 'Executive' : approvalLevel === 2 ? 'Director' : 'Manager';
      const message = `Budget approval required for ${budget.project_name} - $${totalBudget.toLocaleString()}`;

      await client.query(notificationQuery, [
        approvalResult.rows[0].id, recipientRole, message
      ]);

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Budget approval request submitted successfully',
        approval: approvalResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error submitting budget approval:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit approval request'
      });
    } finally {
      client.release();
    }
  }

  // Process approval decision
  async processApprovalDecision(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { approvalId } = req.params;
      const { decision, comments } = req.body; // 'Approved', 'Rejected', 'Escalated'
      const userId = req.user.id;

      // Get approval details
      const approvalQuery = `
        SELECT ba.*, pb.project_id, pb.total_budget, p.project_name as project_name
        FROM budget_approvals ba
        JOIN project_budgets pb ON ba.budget_id = pb.id
        JOIN projects p ON pb.project_id = p.id
        WHERE ba.id = $1 AND ba.status = 'Pending'
      `;
      
      const approvalResult = await client.query(approvalQuery, [approvalId]);
      
      if (approvalResult.rows.length === 0) {
        throw new Error('Approval request not found or already processed');
      }

      const approval = approvalResult.rows[0];

      // Update approval record
      const updateApprovalQuery = `
        UPDATE budget_approvals 
        SET 
          status = $1,
          approver_id = $2,
          comments = $3,
          responded_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const updatedApprovalResult = await client.query(updateApprovalQuery, [
        decision, userId, comments, approvalId
      ]);

      // Update budget status based on decision
      let budgetStatus;
      switch (decision) {
        case 'Approved':
          budgetStatus = 'Active';
          break;
        case 'Rejected':
          budgetStatus = 'Rejected';
          break;
        case 'Escalated':
          budgetStatus = 'Pending Approval';
          // Create new approval at higher level
          const escalatedApprovalQuery = `
            INSERT INTO budget_approvals (
              budget_id, approval_level, requested_by, status, comments,
              urgency, requested_at
            ) VALUES ($1, $2, $3, 'Pending', $4, 'High', NOW())
          `;
          
          await client.query(escalatedApprovalQuery, [
            approval.budget_id,
            approval.approval_level + 1,
            approval.requested_by,
            `Escalated from Level ${approval.approval_level}: ${comments}`
          ]);
          break;
        default:
          throw new Error('Invalid decision');
      }

      if (decision !== 'Escalated') {
        await client.query(
          'UPDATE project_budgets SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3',
          [budgetStatus, decision === 'Approved' ? userId : null, approval.budget_id]
        );
      }

      // Create audit trail entry
      const auditQuery = `
        INSERT INTO budget_audit_trail (
          budget_id, action_type, action_description, performed_by, performed_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `;

      await client.query(auditQuery, [
        approval.budget_id,
        `Approval ${decision}`,
        `Budget approval ${decision.toLowerCase()}: ${comments}`,
        userId
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Approval ${decision.toLowerCase()} successfully`,
        approval: updatedApprovalResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing approval decision:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process approval decision'
      });
    } finally {
      client.release();
    }
  }

  // Get pending approvals for user
  async getPendingApprovals(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { limit = 50, offset = 0 } = req.query;

      // Determine what approvals this user can handle based on role
      let roleCondition = '';
      switch (userRole) {
        case 'Executive':
        case 'CEO':
        case 'CFO':
          roleCondition = 'ba.approval_level <= 3';
          break;
        case 'Director':
          roleCondition = 'ba.approval_level <= 2';
          break;
        case 'Manager':
        case 'Project Manager':
          roleCondition = 'ba.approval_level = 1';
          break;
        default:
          roleCondition = '1=0'; // No approvals for other roles
      }

      const approvalsQuery = `
        SELECT 
          ba.*,
          pb.total_budget,
          pb.fiscal_year,
          p.id as project_id,
          p.project_name as project_name,
          (u.first_name || ' ' || u.last_name) as requested_by_name,
          EXTRACT(DAYS FROM (NOW() - ba.requested_at)) as days_pending
        FROM budget_approvals ba
        JOIN project_budgets pb ON ba.budget_id = pb.id
        JOIN projects p ON pb.project_id = p.id
        JOIN users u ON ba.requested_by = u.id
        WHERE ba.status = 'Pending' AND ${roleCondition}
        ORDER BY 
          CASE ba.urgency 
            WHEN 'High' THEN 1 
            WHEN 'Normal' THEN 2 
            WHEN 'Low' THEN 3 
          END,
          ba.requested_at ASC
        LIMIT $1 OFFSET $2
      `;

      const approvalsResult = await pool.query(approvalsQuery, [limit, offset]);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM budget_approvals ba
        WHERE ba.status = 'Pending' AND ${roleCondition}
      `;
      
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        approvals: approvalsResult.rows,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: offset > 0
        }
      });

    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending approvals'
      });
    }
  }

  // Get approval history
  async getApprovalHistory(req, res) {
    try {
      const { budgetId, projectId, userId: filterUserId } = req.query;
      const { limit = 50, offset = 0 } = req.query;

      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramCount = 0;

      if (budgetId) {
        paramCount++;
        whereConditions.push(`ba.budget_id = $${paramCount}`);
        queryParams.push(budgetId);
      }

      if (projectId) {
        paramCount++;
        whereConditions.push(`pb.project_id = $${paramCount}`);
        queryParams.push(projectId);
      }

      if (filterUserId) {
        paramCount++;
        whereConditions.push(`(ba.requested_by = $${paramCount} OR ba.approver_id = $${paramCount})`);
        queryParams.push(filterUserId);
      }

      const whereClause = whereConditions.join(' AND ');

      paramCount++;
      const limitParam = paramCount;
      queryParams.push(limit);

      paramCount++;
      const offsetParam = paramCount;
      queryParams.push(offset);

      const historyQuery = `
        SELECT 
          ba.*,
          pb.total_budget,
          pb.fiscal_year,
          p.id as project_id,
          p.project_name as project_name,
          (u1.first_name || ' ' || u1.last_name) as requested_by_name,
          (u2.first_name || ' ' || u2.last_name) as approver_name,
          EXTRACT(DAYS FROM (COALESCE(ba.responded_at, NOW()) - ba.requested_at)) as processing_days
        FROM budget_approvals ba
        JOIN project_budgets pb ON ba.budget_id = pb.id
        JOIN projects p ON pb.project_id = p.id
        JOIN users u1 ON ba.requested_by = u1.id
        LEFT JOIN users u2 ON ba.approver_id = u2.id
        WHERE ${whereClause}
        ORDER BY ba.requested_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `;

      const historyResult = await pool.query(historyQuery, queryParams);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM budget_approvals ba
        JOIN project_budgets pb ON ba.budget_id = pb.id
        WHERE ${whereClause}
      `;
      
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        history: historyResult.rows,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: offset > 0
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

  // Get audit trail
  async getAuditTrail(req, res) {
    try {
      const { budgetId, projectId, userId: filterUserId, actionType, startDate, endDate } = req.query;
      const { limit = 100, offset = 0 } = req.query;

      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramCount = 0;

      if (budgetId) {
        paramCount++;
        whereConditions.push(`bat.budget_id = $${paramCount}`);
        queryParams.push(budgetId);
      }

      if (projectId) {
        paramCount++;
        whereConditions.push(`pb.project_id = $${paramCount}`);
        queryParams.push(projectId);
      }

      if (filterUserId) {
        paramCount++;
        whereConditions.push(`bat.performed_by = $${paramCount}`);
        queryParams.push(filterUserId);
      }

      if (actionType) {
        paramCount++;
        whereConditions.push(`bat.action_type = $${paramCount}`);
        queryParams.push(actionType);
      }

      if (startDate) {
        paramCount++;
        whereConditions.push(`bat.performed_at >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`bat.performed_at <= $${paramCount}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.join(' AND ');

      paramCount++;
      const limitParam = paramCount;
      queryParams.push(limit);

      paramCount++;
      const offsetParam = paramCount;
      queryParams.push(offset);

      const auditQuery = `
        SELECT 
          bat.*,
          (u.first_name || ' ' || u.last_name) as performed_by_name,
          pb.project_id,
          p.project_name as project_name
        FROM budget_audit_trail bat
        JOIN users u ON bat.performed_by = u.id
        LEFT JOIN project_budgets pb ON bat.budget_id = pb.id
        LEFT JOIN projects p ON pb.project_id = p.id
        WHERE ${whereClause}
        ORDER BY bat.performed_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `;

      const auditResult = await pool.query(auditQuery, queryParams);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM budget_audit_trail bat
        LEFT JOIN project_budgets pb ON bat.budget_id = pb.id
        WHERE ${whereClause}
      `;
      
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        auditTrail: auditResult.rows,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: offset > 0
        }
      });

    } catch (error) {
      console.error('Error fetching audit trail:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit trail'
      });
    }
  }

  // Get approval statistics
  async getApprovalStatistics(req, res) {
    try {
      const { startDate, endDate, projectId } = req.query;

      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        whereConditions.push(`ba.requested_at >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`ba.requested_at <= $${paramCount}`);
        queryParams.push(endDate);
      }

      if (projectId) {
        paramCount++;
        whereConditions.push(`pb.project_id = $${paramCount}`);
        queryParams.push(projectId);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get overall statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN ba.status = 'Approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN ba.status = 'Rejected' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN ba.status = 'Pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN ba.status = 'Escalated' THEN 1 END) as escalated_count,
          AVG(EXTRACT(DAYS FROM (COALESCE(ba.responded_at, NOW()) - ba.requested_at))) as avg_processing_days,
          SUM(pb.total_budget) as total_budget_value
        FROM budget_approvals ba
        JOIN project_budgets pb ON ba.budget_id = pb.id
        WHERE ${whereClause}
      `;

      const statsResult = await pool.query(statsQuery, queryParams);

      // Get approval by level
      const levelStatsQuery = `
        SELECT 
          ba.approval_level,
          COUNT(*) as request_count,
          COUNT(CASE WHEN ba.status = 'Approved' THEN 1 END) as approved_count,
          AVG(EXTRACT(DAYS FROM (COALESCE(ba.responded_at, NOW()) - ba.requested_at))) as avg_processing_days
        FROM budget_approvals ba
        JOIN project_budgets pb ON ba.budget_id = pb.id
        WHERE ${whereClause}
        GROUP BY ba.approval_level
        ORDER BY ba.approval_level
      `;

      const levelStatsResult = await pool.query(levelStatsQuery, queryParams);

      // Get monthly trend
      const trendQuery = `
        SELECT 
          DATE_TRUNC('month', ba.requested_at) as month,
          COUNT(*) as request_count,
          COUNT(CASE WHEN ba.status = 'Approved' THEN 1 END) as approved_count,
          AVG(EXTRACT(DAYS FROM (COALESCE(ba.responded_at, NOW()) - ba.requested_at))) as avg_processing_days
        FROM budget_approvals ba
        JOIN project_budgets pb ON ba.budget_id = pb.id
        WHERE ${whereClause}
        GROUP BY DATE_TRUNC('month', ba.requested_at)
        ORDER BY month
      `;

      const trendResult = await pool.query(trendQuery, queryParams);

      const stats = statsResult.rows[0];
      const approvalRate = stats.total_requests > 0 
        ? (parseFloat(stats.approved_count) / parseFloat(stats.total_requests)) * 100 
        : 0;

      res.json({
        success: true,
        statistics: {
          overall: {
            ...stats,
            approvalRate: approvalRate.toFixed(2)
          },
          byLevel: levelStatsResult.rows,
          monthlyTrend: trendResult.rows
        }
      });

    } catch (error) {
      console.error('Error fetching approval statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch approval statistics'
      });
    }
  }
}

module.exports = new ApprovalController();

