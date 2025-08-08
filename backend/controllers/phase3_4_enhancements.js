const pool = require('../config/database');
const { Parser } = require('json2csv');

class Phase34EnhancementsController {
  // Phase 3: Financial Summary and Rollups

  // Get project financial summary with rollups
  async getProjectFinancialSummary(req, res) {
    try {
      const { projectId } = req.params;
      const { includeArchived = false } = req.query;

      // Get project financial summary using the view
      const summaryQuery = `
        SELECT * FROM project_financial_summary 
        WHERE id = $1
      `;
      
      const summaryResult = await pool.query(summaryQuery, [projectId]);
      
      if (summaryResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const summary = summaryResult.rows[0];

      // Get contract rollup for this project
      const contractRollupQuery = `
        SELECT 
          c.id,
          c.contract_number,
          v.name as vendor_name,
          c.original_amount,
          COALESCE(co_summary.total_co_amount, 0) as total_change_orders,
          (c.original_amount + COALESCE(co_summary.total_co_amount, 0)) as revised_amount,
          COALESCE(c.total_paid, 0) as total_paid,
          COALESCE(c.holdback_amount, 0) as holdback_amount,
          COALESCE(c.balance_remaining, 0) as balance_remaining,
          c.status,
          c.start_date,
          c.end_date
        FROM contracts c
        JOIN vendors v ON c.vendor_id = v.id
        LEFT JOIN (
          SELECT 
            contract_id,
            SUM(amount) as total_co_amount,
            COUNT(*) as co_count
          FROM change_orders 
          WHERE status = 'Approved'
          GROUP BY contract_id
        ) co_summary ON c.id = co_summary.contract_id
        WHERE c.project_id = $1 
        ${includeArchived ? '' : 'AND c.archived = false'}
        ORDER BY c.contract_number
      `;

      const contractRollupResult = await pool.query(contractRollupQuery, [projectId]);

      // Get budget breakdown by category
      const budgetBreakdownQuery = `
        SELECT 
          bc.category_name,
          bc.allocated_amount,
          COALESCE(SUM(be.amount), 0) as spent_amount,
          bc.allocated_amount - COALESCE(SUM(be.amount), 0) as remaining_amount,
          COUNT(be.id) as transaction_count
        FROM project_budgets pb
        JOIN budget_categories bc ON pb.id = bc.budget_id
        LEFT JOIN budget_entries be ON bc.id = be.category_id AND be.status != 'Cancelled'
        WHERE pb.project_id = $1
        GROUP BY bc.id, bc.category_name, bc.allocated_amount
        ORDER BY bc.category_name
      `;

      const budgetBreakdownResult = await pool.query(budgetBreakdownQuery, [projectId]);

      // Get recent financial activity
      const recentActivityQuery = `
        SELECT 
          'payment' as activity_type,
          cp.payment_amount,
          cp.payment_date as activity_date,
          c.contract_number as reference,
          v.name as vendor_name
        FROM contract_payments cp
        JOIN contracts c ON cp.contract_id = c.id
        JOIN vendors v ON c.vendor_id = v.id
        WHERE c.project_id = $1
        
        UNION ALL
        
        SELECT 
          'expense' as activity_type,
          be.amount,
          be.created_at as activity_date,
          bc.category_name as reference,
          v.name as vendor_name
        FROM budget_entries be
        JOIN budget_categories bc ON be.category_id = bc.id
        JOIN project_budgets pb ON bc.budget_id = pb.id
        LEFT JOIN vendors v ON be.vendor_id = v.id
        WHERE pb.project_id = $1 AND be.status != 'Cancelled'
        
        ORDER BY activity_date DESC
        LIMIT 20
      `;

      const recentActivityResult = await pool.query(recentActivityQuery, [projectId]);

      res.json({
        success: true,
        data: {
          summary,
          contractRollup: contractRollupResult.rows,
          budgetBreakdown: budgetBreakdownResult.rows,
          recentActivity: recentActivityResult.rows
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

  // Get contract financial rollup
  async getContractFinancialRollup(req, res) {
    try {
      const { contractId } = req.params;

      // Get contract financial summary using the view
      const contractQuery = `
        SELECT * FROM contract_financial_summary 
        WHERE id = $1
      `;
      
      const contractResult = await pool.query(contractQuery, [contractId]);
      
      if (contractResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Contract not found'
        });
      }

      const contract = contractResult.rows[0];

      // Get change orders breakdown
      const changeOrdersQuery = `
        SELECT 
          co.id,
          co.change_order_number,
          co.description,
          co.amount,
          co.status,
          co.requested_date,
          co.approved_date,
          u.first_name || ' ' || u.last_name as approved_by_name
        FROM change_orders co
        LEFT JOIN users u ON co.approved_by = u.id
        WHERE co.contract_id = $1
        ORDER BY co.change_order_number
      `;

      const changeOrdersResult = await pool.query(changeOrdersQuery, [contractId]);

      // Get payment history
      const paymentsQuery = `
        SELECT 
          cp.id,
          cp.payment_amount,
          cp.payment_date,
          cp.status,
          cp.source_ref,
          cp.description
        FROM contract_payments cp
        WHERE cp.contract_id = $1
        ORDER BY cp.payment_date DESC
      `;

      const paymentsResult = await pool.query(paymentsQuery, [contractId]);

      res.json({
        success: true,
        data: {
          contract,
          changeOrders: changeOrdersResult.rows,
          payments: paymentsResult.rows
        }
      });

    } catch (error) {
      console.error('Error fetching contract financial rollup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contract financial rollup'
      });
    }
  }

  // Export data to CSV
  async exportToCSV(req, res) {
    try {
      const { entityType, filters = {}, columns } = req.body;
      const userId = req.user.id;

      // Validate entity type
      const validEntityTypes = ['projects', 'contracts', 'vendors', 'budget_entries', 'payments', 'approvals'];
      if (!validEntityTypes.includes(entityType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type for export'
        });
      }

      let query, queryParams = [];
      let paramCount = 0;

      // Build query based on entity type
      switch (entityType) {
        case 'projects':
          query = `
            SELECT 
              p.id,
              p.project_name,
              p.project_number,
              p.status,
              p.total_budget,
              p.start_date,
              p.end_date,
              p.created_at,
              u.first_name || ' ' || u.last_name as project_manager
            FROM projects p
            LEFT JOIN users u ON p.project_manager_id = u.id
            WHERE p.archived = false
          `;
          break;

        case 'contracts':
          query = `
            SELECT 
              c.id,
              c.contract_number,
              v.name as vendor_name,
              p.project_name,
              c.original_amount,
              c.status,
              c.start_date,
              c.end_date,
              c.created_at
            FROM contracts c
            JOIN vendors v ON c.vendor_id = v.id
            JOIN projects p ON c.project_id = p.id
            WHERE c.archived = false
          `;
          break;

        case 'vendors':
          query = `
            SELECT 
              v.id,
              v.name,
              v.contact_email,
              v.contact_phone,
              v.address,
              v.status,
              v.average_score,
              v.created_at
            FROM vendors v
            WHERE v.archived = false
          `;
          break;

        case 'budget_entries':
          query = `
            SELECT 
              be.id,
              p.project_name,
              bc.category_name,
              be.amount,
              be.entry_type,
              be.description,
              be.status,
              v.name as vendor_name,
              be.created_at
            FROM budget_entries be
            JOIN budget_categories bc ON be.category_id = bc.id
            JOIN project_budgets pb ON bc.budget_id = pb.id
            JOIN projects p ON pb.project_id = p.id
            LEFT JOIN vendors v ON be.vendor_id = v.id
            WHERE be.status != 'Cancelled'
          `;
          break;

        case 'payments':
          query = `
            SELECT 
              cp.id,
              c.contract_number,
              v.name as vendor_name,
              p.project_name,
              cp.payment_amount,
              cp.payment_date,
              cp.status,
              cp.source_ref
            FROM contract_payments cp
            JOIN contracts c ON cp.contract_id = c.id
            JOIN vendors v ON c.vendor_id = v.id
            JOIN projects p ON c.project_id = p.id
          `;
          break;

        case 'approvals':
          query = `
            SELECT 
              a.id,
              a.entity_type,
              a.status,
              a.requested_date,
              a.approved_date,
              u1.first_name || ' ' || u1.last_name as requested_by,
              u2.first_name || ' ' || u2.last_name as approved_by,
              a.comments
            FROM approvals a
            LEFT JOIN users u1 ON a.requested_by = u1.id
            LEFT JOIN users u2 ON a.approved_by = u2.id
          `;
          break;
      }

      // Apply filters
      if (filters.projectId) {
        paramCount++;
        query += ` AND p.id = $${paramCount}`;
        queryParams.push(filters.projectId);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        queryParams.push(filters.status);
      }

      if (filters.startDate) {
        paramCount++;
        query += ` AND created_at >= $${paramCount}`;
        queryParams.push(filters.startDate);
      }

      if (filters.endDate) {
        paramCount++;
        query += ` AND created_at <= $${paramCount}`;
        queryParams.push(filters.endDate);
      }

      // Add ordering and limit
      query += ` ORDER BY created_at DESC LIMIT 10000`;

      const result = await pool.query(query, queryParams);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No data found for export'
        });
      }

      // Convert to CSV
      const fields = columns || Object.keys(result.rows[0]);
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(result.rows);

      // Log export activity
      await pool.query(`
        INSERT INTO export_logs (user_id, export_type, entity_type, filter_criteria, record_count, file_name)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        'csv',
        entityType,
        JSON.stringify(filters),
        result.rows.length,
        `${entityType}_export_${new Date().toISOString().split('T')[0]}.csv`
      ]);

      // Set response headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entityType}_export.csv"`);
      res.send(csv);

    } catch (error) {
      console.error('Error exporting to CSV:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data'
      });
    }
  }

  // Get audit logs (admin only)
  async getAuditLogs(req, res) {
    try {
      const { 
        entityType, 
        entityId, 
        userId, 
        action, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 50 
      } = req.query;

      // Check if user has admin role
      if (req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (entityType) {
        paramCount++;
        whereConditions.push(`entity_type = $${paramCount}`);
        queryParams.push(entityType);
      }

      if (entityId) {
        paramCount++;
        whereConditions.push(`entity_id = $${paramCount}`);
        queryParams.push(entityId);
      }

      if (userId) {
        paramCount++;
        whereConditions.push(`user_id = $${paramCount}`);
        queryParams.push(userId);
      }

      if (action) {
        paramCount++;
        whereConditions.push(`action = $${paramCount}`);
        queryParams.push(action);
      }

      if (startDate) {
        paramCount++;
        whereConditions.push(`timestamp >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`timestamp <= $${paramCount}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs al
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const offset = (page - 1) * limit;
      paramCount++;
      const limitParam = paramCount;
      paramCount++;
      const offsetParam = paramCount;

      const auditQuery = `
        SELECT 
          al.id,
          al.timestamp,
          al.entity_type,
          al.entity_id,
          al.action,
          al.field_name,
          al.old_value,
          al.new_value,
          al.ip_address,
          al.action_batch_id,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email
        FROM audit_logs al
        LEFT JOIN users u ON COALESCE(al.user_id, al.changed_by) = u.id
        ${whereClause}
        ORDER BY COALESCE(al.changed_at, al.timestamp) DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `;

      queryParams.push(limit, offset);
      const auditResult = await pool.query(auditQuery, queryParams);

      res.json({
        success: true,
        data: {
          logs: auditResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs'
      });
    }
  }

  // Phase 4: Bulk Operations and Inline Editing

  // Bulk archive/unarchive entities
  async bulkArchiveEntities(req, res) {
    try {
      const { entityType, entityIds, archive = true } = req.body;
      const userId = req.user.id;

      // Validate inputs
      if (!['projects', 'vendors', 'contracts'].includes(entityType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type'
        });
      }

      if (!Array.isArray(entityIds) || entityIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Entity IDs must be a non-empty array'
        });
      }

      if (entityIds.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Cannot process more than 100 entities at once'
        });
      }

      const batchId = require('crypto').randomUUID();
      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      // Log bulk operation start
      await pool.query(`
        INSERT INTO bulk_operations (id, user_id, operation_type, entity_type, entity_ids, operation_data, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        batchId,
        userId,
        archive ? 'archive' : 'unarchive',
        entityType,
        entityIds,
        JSON.stringify({ archive }),
        'in_progress'
      ]);

      // Process each entity
      for (const entityId of entityIds) {
        try {
          if (archive) {
            const result = await pool.query('SELECT archive_entity($1, $2, $3)', [entityType, entityId, userId]);
            if (result.rows[0].archive_entity) {
              successCount++;
            } else {
              failureCount++;
              errors.push({ entityId, error: 'Entity not found or already archived' });
            }
          } else {
            const result = await pool.query('SELECT unarchive_entity($1, $2, $3)', [entityType, entityId, userId]);
            if (result.rows[0].unarchive_entity) {
              successCount++;
            } else {
              failureCount++;
              errors.push({ entityId, error: 'Entity not found or not archived' });
            }
          }
        } catch (error) {
          failureCount++;
          errors.push({ entityId, error: error.message });
        }
      }

      // Update bulk operation record
      await pool.query(`
        UPDATE bulk_operations 
        SET status = $1, success_count = $2, failure_count = $3, error_details = $4, completed_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, ['completed', successCount, failureCount, JSON.stringify(errors), batchId]);

      res.json({
        success: true,
        data: {
          batchId,
          successCount,
          failureCount,
          errors: errors.length > 0 ? errors : null
        }
      });

    } catch (error) {
      console.error('Error in bulk archive operation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk archive operation'
      });
    }
  }

  // Bulk status update
  async bulkUpdateStatus(req, res) {
    try {
      const { entityType, entityIds, newStatus } = req.body;
      const userId = req.user.id;

      // Validate inputs
      if (!['projects', 'vendors', 'contracts'].includes(entityType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type'
        });
      }

      if (!Array.isArray(entityIds) || entityIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Entity IDs must be a non-empty array'
        });
      }

      if (!newStatus) {
        return res.status(400).json({
          success: false,
          message: 'New status is required'
        });
      }

      // Use the database function for bulk status update
      const result = await pool.query(
        'SELECT * FROM bulk_update_status($1, $2, $3, $4)',
        [entityType, entityIds, newStatus, userId]
      );

      const { success_count, failure_count, batch_id } = result.rows[0];

      res.json({
        success: true,
        data: {
          batchId: batch_id,
          successCount: success_count,
          failureCount: failure_count
        }
      });

    } catch (error) {
      console.error('Error in bulk status update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk status update'
      });
    }
  }

  // Inline edit field
  async inlineEditField(req, res) {
    try {
      const { entityType, entityId, fieldName, newValue, sessionId } = req.body;
      const userId = req.user.id;

      // Validate inputs
      const validEntityTypes = ['projects', 'contracts', 'vendors', 'budget_categories'];
      if (!validEntityTypes.includes(entityType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid entity type for inline editing'
        });
      }

      // Define allowed fields for each entity type
      const allowedFields = {
        projects: ['project_name', 'status', 'start_date', 'end_date', 'description'],
        contracts: ['status', 'end_date', 'description'],
        vendors: ['name', 'contact_email', 'contact_phone', 'status'],
        budget_categories: ['category_name', 'allocated_amount', 'description']
      };

      if (!allowedFields[entityType].includes(fieldName)) {
        return res.status(400).json({
          success: false,
          message: `Field '${fieldName}' is not editable for ${entityType}`
        });
      }

      // Get current value
      const getCurrentValueQuery = `SELECT ${fieldName} FROM ${entityType} WHERE id = $1`;
      const currentResult = await pool.query(getCurrentValueQuery, [entityId]);

      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Entity not found'
        });
      }

      const oldValue = currentResult.rows[0][fieldName];

      // Update the field
      const updateQuery = `UPDATE ${entityType} SET ${fieldName} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`;
      await pool.query(updateQuery, [newValue, entityId]);

      // Log the inline edit
      await pool.query(`
        INSERT INTO inline_edits (user_id, entity_type, entity_id, field_name, old_value, new_value, edit_session_id, confirmed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, entityType, entityId, fieldName, oldValue, newValue, sessionId, true]);

      // Log in audit trail
      await pool.query(`
        INSERT INTO audit_logs (user_id, entity_type, entity_id, action, field_name, old_value, new_value)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [userId, entityType, entityId, 'inline_edit', fieldName, oldValue, newValue]);

      res.json({
        success: true,
        data: {
          entityType,
          entityId,
          fieldName,
          oldValue,
          newValue,
          updatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error in inline edit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform inline edit'
      });
    }
  }

  // Auto-save inline edit
  async autoSaveInlineEdit(req, res) {
    try {
      const { entityType, entityId, fieldName, newValue, sessionId } = req.body;
      const userId = req.user.id;

      // Log the auto-save without actually updating the entity
      await pool.query(`
        INSERT INTO inline_edits (user_id, entity_type, entity_id, field_name, new_value, edit_session_id, auto_saved, confirmed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, entityType, entityId, fieldName, newValue, sessionId, true, false]);

      res.json({
        success: true,
        message: 'Auto-save completed'
      });

    } catch (error) {
      console.error('Error in auto-save:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to auto-save'
      });
    }
  }

  // Get user preferences
  async getUserPreferences(req, res) {
    try {
      const userId = req.user.id;

      const preferencesQuery = `
        SELECT preference_key, preference_value
        FROM user_preferences
        WHERE user_id = $1
      `;

      const result = await pool.query(preferencesQuery, [userId]);

      const preferences = result.rows.reduce((acc, row) => {
        acc[row.preference_key] = row.preference_value;
        return acc;
      }, {});

      res.json({
        success: true,
        data: preferences
      });

    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user preferences'
      });
    }
  }

  // Update user preferences
  async updateUserPreferences(req, res) {
    try {
      const userId = req.user.id;
      const { preferences } = req.body;

      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Preferences must be an object'
        });
      }

      // Update each preference
      for (const [key, value] of Object.entries(preferences)) {
        await pool.query(`
          INSERT INTO user_preferences (user_id, preference_key, preference_value)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, preference_key)
          DO UPDATE SET preference_value = EXCLUDED.preference_value, updated_at = CURRENT_TIMESTAMP
        `, [userId, key, JSON.stringify(value)]);
      }

      res.json({
        success: true,
        message: 'Preferences updated successfully'
      });

    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user preferences'
      });
    }
  }
}

module.exports = new Phase34EnhancementsController();

