const pool = require('../config/database');

class ReportingController {
  // Get financial dashboard overview
  async getFinancialDashboard(req, res) {
    try {
      const { projectId, fiscalYear, dateRange } = req.query;
      
      // Build base query conditions
      let whereConditions = ['pb.status = $1'];
      let queryParams = ['Active'];
      let paramCount = 1;

      if (projectId) {
        paramCount++;
        whereConditions.push(`pb.project_id = $${paramCount}`);
        queryParams.push(projectId);
      }

      if (fiscalYear) {
        paramCount++;
        whereConditions.push(`pb.fiscal_year = $${paramCount}`);
        queryParams.push(fiscalYear);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get budget summary
      const budgetSummaryQuery = `
        SELECT 
          COUNT(DISTINCT pb.project_id) as total_projects,
          SUM(pb.total_budget) as total_budget,
          SUM(bc.allocated_amount) as total_allocated,
          COALESCE(SUM(be.amount), 0) as total_spent,
          SUM(bc.allocated_amount) - COALESCE(SUM(be.amount), 0) as remaining_budget
        FROM project_budgets pb
        LEFT JOIN budget_categories bc ON pb.id = bc.budget_id
        LEFT JOIN budget_entries be ON bc.id = be.category_id AND be.status != 'Cancelled'
        WHERE ${whereClause}
      `;

      const budgetSummaryResult = await pool.query(budgetSummaryQuery, queryParams);
      const budgetSummary = budgetSummaryResult.rows[0];

      // Get spending by category
      const categorySpendingQuery = `
        SELECT 
          bc.category_name,
          SUM(bc.allocated_amount) as allocated,
          COALESCE(SUM(be.amount), 0) as spent,
          COUNT(DISTINCT pb.project_id) as project_count
        FROM project_budgets pb
        JOIN budget_categories bc ON pb.id = bc.budget_id
        LEFT JOIN budget_entries be ON bc.id = be.category_id AND be.status != 'Cancelled'
        WHERE ${whereClause}
        GROUP BY bc.category_name
        ORDER BY spent DESC
        LIMIT 10
      `;

      const categorySpendingResult = await pool.query(categorySpendingQuery, queryParams);

      // Get monthly spending trend
      const monthlyTrendQuery = `
        SELECT 
          DATE_TRUNC('month', be.created_at) as month,
          SUM(be.amount) as monthly_spending,
          COUNT(be.id) as transaction_count
        FROM budget_entries be
        JOIN budget_categories bc ON be.category_id = bc.id
        JOIN project_budgets pb ON bc.budget_id = pb.id
        WHERE ${whereClause} AND be.status != 'Cancelled'
          AND be.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', be.created_at)
        ORDER BY month
      `;

      const monthlyTrendResult = await pool.query(monthlyTrendQuery, queryParams);

      // Get top spending projects
      const topProjectsQuery = `
        SELECT 
          p.id,
          p.project_name as project_name,
          pb.total_budget,
          COALESCE(SUM(be.amount), 0) as total_spent,
          CASE 
            WHEN pb.total_budget > 0 
            THEN (COALESCE(SUM(be.amount), 0) / pb.total_budget) * 100 
            ELSE 0 
          END as utilization_percent
        FROM projects p
        JOIN project_budgets pb ON p.id = pb.project_id
        LEFT JOIN budget_categories bc ON pb.id = bc.budget_id
        LEFT JOIN budget_entries be ON bc.id = be.category_id AND be.status != 'Cancelled'
        WHERE ${whereClause}
        GROUP BY p.id, p.project_name, pb.total_budget
        ORDER BY total_spent DESC
        LIMIT 10
      `;

      const topProjectsResult = await pool.query(topProjectsQuery, queryParams);

      // Get vendor spending
      const vendorSpendingQuery = `
        SELECT 
          v.id,
          v.name as vendor_name,
          COUNT(DISTINCT be.id) as transaction_count,
          SUM(be.amount) as total_spent
        FROM vendors v
        JOIN budget_entries be ON v.id = be.vendor_id
        JOIN budget_categories bc ON be.category_id = bc.id
        JOIN project_budgets pb ON bc.budget_id = pb.id
        WHERE ${whereClause} AND be.status != 'Cancelled'
        GROUP BY v.id, v.name
        ORDER BY total_spent DESC
        LIMIT 10
      `;

      const vendorSpendingResult = await pool.query(vendorSpendingQuery, queryParams);

      // Get pending approvals
      const pendingApprovalsQuery = `
        SELECT 
          COUNT(*) as pending_budget_approvals
        FROM budget_approvals ba
        JOIN project_budgets pb ON ba.budget_id = pb.id
        WHERE ba.status = 'Pending' AND ${whereClause}
      `;

      const pendingApprovalsResult = await pool.query(pendingApprovalsQuery, queryParams);

      // Calculate utilization rate
      const utilizationRate = budgetSummary.total_allocated > 0 
        ? (parseFloat(budgetSummary.total_spent) / parseFloat(budgetSummary.total_allocated)) * 100 
        : 0;

      res.json({
        success: true,
        dashboard: {
          summary: {
            ...budgetSummary,
            utilizationRate: utilizationRate.toFixed(2),
            pendingApprovals: parseInt(pendingApprovalsResult.rows[0].pending_budget_approvals)
          },
          categorySpending: categorySpendingResult.rows,
          monthlyTrend: monthlyTrendResult.rows,
          topProjects: topProjectsResult.rows,
          vendorSpending: vendorSpendingResult.rows
        }
      });

    } catch (error) {
      console.error('Error fetching financial dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data'
      });
    }
  }

  // Generate budget variance report
  async generateVarianceReport(req, res) {
    try {
      const { projectId, categoryId, fiscalYear, format = 'json' } = req.query;

      let whereConditions = ['pb.status = $1'];
      let queryParams = ['Active'];
      let paramCount = 1;

      if (projectId) {
        paramCount++;
        whereConditions.push(`pb.project_id = $${paramCount}`);
        queryParams.push(projectId);
      }

      if (fiscalYear) {
        paramCount++;
        whereConditions.push(`pb.fiscal_year = $${paramCount}`);
        queryParams.push(fiscalYear);
      }

      if (categoryId) {
        paramCount++;
        whereConditions.push(`bc.id = $${paramCount}`);
        queryParams.push(categoryId);
      }

      const whereClause = whereConditions.join(' AND ');

      const varianceQuery = `
        SELECT 
          p.id as project_id,
          p.project_name as project_name,
          pb.fiscal_year,
          bc.id as category_id,
          bc.category_name,
          bc.allocated_amount,
          COALESCE(SUM(be.amount), 0) as actual_spent,
          bc.allocated_amount - COALESCE(SUM(be.amount), 0) as variance,
          CASE 
            WHEN bc.allocated_amount > 0 
            THEN ((bc.allocated_amount - COALESCE(SUM(be.amount), 0)) / bc.allocated_amount) * 100 
            ELSE 0 
          END as variance_percent,
          COUNT(be.id) as transaction_count
        FROM projects p
        JOIN project_budgets pb ON p.id = pb.project_id
        JOIN budget_categories bc ON pb.id = bc.budget_id
        LEFT JOIN budget_entries be ON bc.id = be.category_id AND be.status != 'Cancelled'
        WHERE ${whereClause}
        GROUP BY p.id, p.project_name, pb.fiscal_year, bc.id, bc.category_name, bc.allocated_amount
        ORDER BY variance_percent ASC
      `;

      const varianceResult = await pool.query(varianceQuery, queryParams);

      // Calculate summary statistics
      const totalAllocated = varianceResult.rows.reduce((sum, row) => sum + parseFloat(row.allocated_amount), 0);
      const totalSpent = varianceResult.rows.reduce((sum, row) => sum + parseFloat(row.actual_spent), 0);
      const totalVariance = totalAllocated - totalSpent;
      const overBudgetCount = varianceResult.rows.filter(row => parseFloat(row.variance) < 0).length;
      const underBudgetCount = varianceResult.rows.filter(row => parseFloat(row.variance) >= 0).length;

      const reportData = {
        success: true,
        report: {
          title: 'Budget Variance Analysis Report',
          generatedAt: new Date().toISOString(),
          parameters: { projectId, categoryId, fiscalYear },
          summary: {
            totalAllocated,
            totalSpent,
            totalVariance,
            overBudgetCount,
            underBudgetCount,
            overallVariancePercent: totalAllocated > 0 ? (totalVariance / totalAllocated) * 100 : 0
          },
          details: varianceResult.rows
        }
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csvHeader = 'Project,Category,Allocated,Spent,Variance,Variance %,Transactions\n';
        const csvData = varianceResult.rows.map(row => 
          `"${row.project_name}","${row.category_name}",${row.allocated_amount},${row.actual_spent},${row.variance},${row.variance_percent},${row.transaction_count}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="variance_report.csv"');
        res.send(csvHeader + csvData);
      } else {
        res.json(reportData);
      }

    } catch (error) {
      console.error('Error generating variance report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate variance report'
      });
    }
  }

  // Generate cash flow report
  async generateCashFlowReport(req, res) {
    try {
      const { projectId, startDate, endDate, period = 'month' } = req.query;

      let whereConditions = ['be.status != $1'];
      let queryParams = ['Cancelled'];
      let paramCount = 1;

      if (projectId) {
        paramCount++;
        whereConditions.push(`pb.project_id = $${paramCount}`);
        queryParams.push(projectId);
      }

      if (startDate) {
        paramCount++;
        whereConditions.push(`be.created_at >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`be.created_at <= $${paramCount}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get historical cash flow
      const cashFlowQuery = `
        SELECT 
          DATE_TRUNC($${paramCount + 1}, be.created_at) as period,
          p.project_name as project_name,
          SUM(CASE WHEN be.entry_type = 'Expense' THEN be.amount ELSE 0 END) as outflow,
          SUM(CASE WHEN be.entry_type = 'Income' THEN be.amount ELSE 0 END) as inflow,
          COUNT(be.id) as transaction_count
        FROM budget_entries be
        JOIN budget_categories bc ON be.category_id = bc.id
        JOIN project_budgets pb ON bc.budget_id = pb.id
        JOIN projects p ON pb.project_id = p.id
        WHERE ${whereClause}
        GROUP BY DATE_TRUNC($${paramCount + 1}, be.created_at), p.project_name
        ORDER BY period, p.project_name
      `;

      queryParams.push(period);
      const cashFlowResult = await pool.query(cashFlowQuery, queryParams);

      // Get projected cash flow
      const projectionQuery = `
        SELECT 
          cfp.projection_date,
          p.project_name as project_name,
          cfp.projected_inflow,
          cfp.projected_outflow,
          cfp.actual_inflow,
          cfp.actual_outflow
        FROM cash_flow_projections cfp
        JOIN projects p ON cfp.project_id = p.id
        WHERE cfp.projection_date >= CURRENT_DATE
        ${projectId ? `AND cfp.project_id = ${projectId}` : ''}
        ORDER BY cfp.projection_date, p.project_name
      `;

      const projectionResult = await pool.query(projectionQuery);

      // Calculate running totals
      let runningBalance = 0;
      const cashFlowWithBalance = cashFlowResult.rows.map(row => {
        const netFlow = parseFloat(row.inflow) - parseFloat(row.outflow);
        runningBalance += netFlow;
        return {
          ...row,
          netFlow,
          runningBalance
        };
      });

      res.json({
        success: true,
        report: {
          title: 'Cash Flow Analysis Report',
          generatedAt: new Date().toISOString(),
          parameters: { projectId, startDate, endDate, period },
          historicalCashFlow: cashFlowWithBalance,
          projectedCashFlow: projectionResult.rows,
          summary: {
            totalInflow: cashFlowResult.rows.reduce((sum, row) => sum + parseFloat(row.inflow), 0),
            totalOutflow: cashFlowResult.rows.reduce((sum, row) => sum + parseFloat(row.outflow), 0),
            netCashFlow: cashFlowResult.rows.reduce((sum, row) => 
              sum + parseFloat(row.inflow) - parseFloat(row.outflow), 0),
            currentBalance: runningBalance
          }
        }
      });

    } catch (error) {
      console.error('Error generating cash flow report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate cash flow report'
      });
    }
  }

  // Generate vendor spending report
  async generateVendorSpendingReport(req, res) {
    try {
      const { vendorId, projectId, startDate, endDate, minAmount } = req.query;

      let whereConditions = ['be.status != $1'];
      let queryParams = ['Cancelled'];
      let paramCount = 1;

      if (vendorId) {
        paramCount++;
        whereConditions.push(`v.id = $${paramCount}`);
        queryParams.push(vendorId);
      }

      if (projectId) {
        paramCount++;
        whereConditions.push(`pb.project_id = $${paramCount}`);
        queryParams.push(projectId);
      }

      if (startDate) {
        paramCount++;
        whereConditions.push(`be.created_at >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`be.created_at <= $${paramCount}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.join(' AND ');

      const vendorSpendingQuery = `
        SELECT 
          v.id as vendor_id,
          v.name as vendor_name,
          v.contact_email,
          p.id as project_id,
          p.project_name as project_name,
          bc.category_name,
          COUNT(be.id) as transaction_count,
          SUM(be.amount) as total_amount,
          AVG(be.amount) as average_amount,
          MIN(be.created_at) as first_transaction,
          MAX(be.created_at) as last_transaction,
          STRING_AGG(DISTINCT be.status, ', ') as transaction_statuses
        FROM vendors v
        JOIN budget_entries be ON v.id = be.vendor_id
        JOIN budget_categories bc ON be.category_id = bc.id
        JOIN project_budgets pb ON bc.budget_id = pb.id
        JOIN projects p ON pb.project_id = p.id
        WHERE ${whereClause}
        ${minAmount ? `HAVING SUM(be.amount) >= ${parseFloat(minAmount)}` : ''}
        GROUP BY v.id, v.name, v.contact_email, p.id, p.project_name, bc.category_name
        ORDER BY total_amount DESC
      `;

      const vendorSpendingResult = await pool.query(vendorSpendingQuery, queryParams);

      // Get vendor performance metrics if available
      const performanceQuery = `
        SELECT 
          v.id as vendor_id,
          AVG(vr.overall_rating) as average_rating,
          COUNT(vr.id) as rating_count
        FROM vendors v
        LEFT JOIN vendor_ratings vr ON v.id = vr.vendor_id
        WHERE v.id IN (${vendorSpendingResult.rows.map(row => row.vendor_id).join(',') || '0'})
        GROUP BY v.id
      `;

      const performanceResult = await pool.query(performanceQuery);
      const performanceMap = performanceResult.rows.reduce((map, row) => {
        map[row.vendor_id] = row;
        return map;
      }, {});

      // Combine spending and performance data
      const enrichedData = vendorSpendingResult.rows.map(row => ({
        ...row,
        performance: performanceMap[row.vendor_id] || null
      }));

      res.json({
        success: true,
        report: {
          title: 'Vendor Spending Analysis Report',
          generatedAt: new Date().toISOString(),
          parameters: { vendorId, projectId, startDate, endDate, minAmount },
          vendorSpending: enrichedData,
          summary: {
            totalVendors: new Set(enrichedData.map(row => row.vendor_id)).size,
            totalSpending: enrichedData.reduce((sum, row) => sum + parseFloat(row.total_amount), 0),
            totalTransactions: enrichedData.reduce((sum, row) => sum + parseInt(row.transaction_count), 0),
            averageTransactionValue: enrichedData.length > 0 
              ? enrichedData.reduce((sum, row) => sum + parseFloat(row.average_amount), 0) / enrichedData.length 
              : 0
          }
        }
      });

    } catch (error) {
      console.error('Error generating vendor spending report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate vendor spending report'
      });
    }
  }

  // Save custom report
  async saveCustomReport(req, res) {
    try {
      const {
        reportName,
        reportType,
        reportParameters,
        isScheduled,
        scheduleFrequency,
        nextRunDate
      } = req.body;
      const userId = req.user.id;

      const reportQuery = `
        INSERT INTO financial_reports (
          report_name, report_type, report_parameters, created_by,
          is_scheduled, schedule_frequency, next_run_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;

      const reportResult = await pool.query(reportQuery, [
        reportName, reportType, JSON.stringify(reportParameters), userId,
        isScheduled, scheduleFrequency, nextRunDate
      ]);

      res.status(201).json({
        success: true,
        message: 'Custom report saved successfully',
        report: reportResult.rows[0]
      });

    } catch (error) {
      console.error('Error saving custom report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save custom report'
      });
    }
  }

  // Get saved reports
  async getSavedReports(req, res) {
    try {
      const userId = req.user.id;
      const { reportType } = req.query;

      let whereConditions = ['fr.created_by = $1'];
      let queryParams = [userId];
      let paramCount = 1;

      if (reportType) {
        paramCount++;
        whereConditions.push(`fr.report_type = $${paramCount}`);
        queryParams.push(reportType);
      }

      const whereClause = whereConditions.join(' AND ');

      const reportsQuery = `
        SELECT 
          fr.*,
          (u.first_name || ' ' || u.last_name) as created_by_name,
          COUNT(rs.id) as subscriber_count
        FROM financial_reports fr
        JOIN users u ON fr.created_by = u.id
        LEFT JOIN report_subscriptions rs ON fr.id = rs.report_id AND rs.is_active = true
        WHERE ${whereClause}
        GROUP BY fr.id, u.first_name, u.last_name
        ORDER BY fr.created_at DESC
      `;

      const reportsResult = await pool.query(reportsQuery, queryParams);

      res.json({
        success: true,
        reports: reportsResult.rows
      });

    } catch (error) {
      console.error('Error fetching saved reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch saved reports'
      });
    }
  }

  // Execute saved report
  async executeSavedReport(req, res) {
    try {
      const { reportId } = req.params;

      // Get report configuration
      const reportQuery = `
        SELECT * FROM financial_reports WHERE id = $1
      `;

      const reportResult = await pool.query(reportQuery, [reportId]);

      if (reportResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      const report = reportResult.rows[0];
      const parameters = report.report_parameters;

      // Execute the appropriate report based on type
      let reportData;
      switch (report.report_type) {
        case 'Variance Analysis':
          // Simulate executing variance report with saved parameters
          req.query = parameters;
          return this.generateVarianceReport(req, res);
        
        case 'Cash Flow':
          req.query = parameters;
          return this.generateCashFlowReport(req, res);
        
        case 'Vendor Spending':
          req.query = parameters;
          return this.generateVendorSpendingReport(req, res);
        
        default:
          return res.status(400).json({
            success: false,
            message: 'Unknown report type'
          });
      }

    } catch (error) {
      console.error('Error executing saved report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute saved report'
      });
    }
  }
}

module.exports = new ReportingController();

