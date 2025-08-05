const pool = require('../config/database');

class BudgetController {
  // Get project budget with detailed breakdown
  async getProjectBudget(req, res) {
    try {
      const { projectId } = req.params;

      // Get main budget information
      const budgetQuery = `
        SELECT 
          pb.*,
          p.name as project_name,
          p.status as project_status
        FROM project_budgets pb
        JOIN projects p ON pb.project_id = p.id
        WHERE pb.project_id = $1
        ORDER BY pb.version DESC
        LIMIT 1
      `;

      const budgetResult = await pool.query(budgetQuery, [projectId]);

      if (budgetResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found for this project'
        });
      }

      const budget = budgetResult.rows[0];

      // Get budget categories breakdown
      const categoriesQuery = `
        SELECT 
          bc.*,
          COALESCE(SUM(be.amount), 0) as spent_amount,
          COALESCE(SUM(CASE WHEN be.status = 'Committed' THEN be.amount ELSE 0 END), 0) as committed_amount
        FROM budget_categories bc
        LEFT JOIN budget_entries be ON bc.id = be.category_id
        WHERE bc.budget_id = $1
        GROUP BY bc.id, bc.category_name, bc.allocated_amount, bc.created_at
        ORDER BY bc.category_name
      `;

      const categoriesResult = await pool.query(categoriesQuery, [budget.id]);

      // Get recent budget entries
      const entriesQuery = `
        SELECT 
          be.*,
          bc.category_name,
          u.name as created_by_name
        FROM budget_entries be
        JOIN budget_categories bc ON be.category_id = bc.id
        LEFT JOIN users u ON be.created_by = u.id
        WHERE be.budget_id = $1
        ORDER BY be.created_at DESC
        LIMIT 20
      `;

      const entriesResult = await pool.query(entriesQuery, [budget.id]);

      // Calculate totals
      const totalAllocated = categoriesResult.rows.reduce((sum, cat) => sum + parseFloat(cat.allocated_amount || 0), 0);
      const totalSpent = categoriesResult.rows.reduce((sum, cat) => sum + parseFloat(cat.spent_amount || 0), 0);
      const totalCommitted = categoriesResult.rows.reduce((sum, cat) => sum + parseFloat(cat.committed_amount || 0), 0);
      const totalAvailable = totalAllocated - totalSpent - totalCommitted;

      res.json({
        success: true,
        budget: {
          ...budget,
          categories: categoriesResult.rows,
          recentEntries: entriesResult.rows,
          totals: {
            allocated: totalAllocated,
            spent: totalSpent,
            committed: totalCommitted,
            available: totalAvailable,
            utilizationRate: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0
          }
        }
      });

    } catch (error) {
      console.error('Error fetching project budget:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch budget information'
      });
    }
  }

  // Create or update project budget
  async createOrUpdateBudget(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { projectId } = req.params;
      const {
        totalBudget,
        fiscalYear,
        categories,
        notes,
        approvalRequired
      } = req.body;
      const userId = req.user.id;

      // Check if budget exists
      const existingBudgetQuery = `
        SELECT id, version FROM project_budgets 
        WHERE project_id = $1 
        ORDER BY version DESC 
        LIMIT 1
      `;
      
      const existingBudgetResult = await client.query(existingBudgetQuery, [projectId]);
      
      let budgetId;
      let version = 1;
      
      if (existingBudgetResult.rows.length > 0) {
        version = existingBudgetResult.rows[0].version + 1;
      }

      // Create new budget version
      const budgetQuery = `
        INSERT INTO project_budgets (
          project_id, total_budget, fiscal_year, version, status,
          approval_required, notes, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;

      const budgetResult = await client.query(budgetQuery, [
        projectId, totalBudget, fiscalYear, version,
        approvalRequired ? 'Pending Approval' : 'Active',
        approvalRequired, notes, userId
      ]);

      budgetId = budgetResult.rows[0].id;

      // Create budget categories
      for (const category of categories) {
        const categoryQuery = `
          INSERT INTO budget_categories (
            budget_id, category_name, category_code, allocated_amount,
            description, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
        `;

        await client.query(categoryQuery, [
          budgetId,
          category.name,
          category.code,
          category.amount,
          category.description
        ]);
      }

      // If approval required, create approval request
      if (approvalRequired) {
        const approvalQuery = `
          INSERT INTO budget_approvals (
            budget_id, requested_by, status, requested_at
          ) VALUES ($1, $2, 'Pending', NOW())
        `;

        await client.query(approvalQuery, [budgetId, userId]);
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        budget: budgetResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating budget:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create budget'
      });
    } finally {
      client.release();
    }
  }

  // Add budget entry (expense/commitment)
  async addBudgetEntry(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { projectId } = req.params;
      const {
        categoryId,
        amount,
        description,
        entryType,
        status,
        referenceNumber,
        vendorId,
        dueDate
      } = req.body;
      const userId = req.user.id;

      // Get current budget
      const budgetQuery = `
        SELECT id FROM project_budgets 
        WHERE project_id = $1 AND status = 'Active'
        ORDER BY version DESC 
        LIMIT 1
      `;
      
      const budgetResult = await client.query(budgetQuery, [projectId]);
      
      if (budgetResult.rows.length === 0) {
        throw new Error('No active budget found for this project');
      }

      const budgetId = budgetResult.rows[0].id;

      // Check category availability
      const categoryQuery = `
        SELECT 
          bc.allocated_amount,
          COALESCE(SUM(be.amount), 0) as spent_amount
        FROM budget_categories bc
        LEFT JOIN budget_entries be ON bc.id = be.category_id
        WHERE bc.id = $1 AND bc.budget_id = $2
        GROUP BY bc.id, bc.allocated_amount
      `;

      const categoryResult = await client.query(categoryQuery, [categoryId, budgetId]);
      
      if (categoryResult.rows.length === 0) {
        throw new Error('Budget category not found');
      }

      const category = categoryResult.rows[0];
      const availableAmount = parseFloat(category.allocated_amount) - parseFloat(category.spent_amount);

      if (parseFloat(amount) > availableAmount) {
        throw new Error(`Insufficient budget. Available: $${availableAmount.toFixed(2)}`);
      }

      // Create budget entry
      const entryQuery = `
        INSERT INTO budget_entries (
          budget_id, category_id, amount, description, entry_type,
          status, reference_number, vendor_id, due_date,
          created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *
      `;

      const entryResult = await client.query(entryQuery, [
        budgetId, categoryId, amount, description, entryType,
        status, referenceNumber, vendorId, dueDate, userId
      ]);

      // Create audit trail entry
      const auditQuery = `
        INSERT INTO budget_audit_trail (
          budget_id, action_type, action_description, amount,
          performed_by, performed_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `;

      await client.query(auditQuery, [
        budgetId,
        'Entry Added',
        `${entryType} entry added: ${description}`,
        amount,
        userId
      ]);

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Budget entry added successfully',
        entry: entryResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding budget entry:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add budget entry'
      });
    } finally {
      client.release();
    }
  }

  // Get budget variance analysis
  async getBudgetVarianceAnalysis(req, res) {
    try {
      const { projectId } = req.params;
      const { period } = req.query; // monthly, quarterly, yearly

      // Get budget with categories
      const budgetQuery = `
        SELECT 
          pb.id as budget_id,
          pb.total_budget,
          pb.fiscal_year,
          bc.id as category_id,
          bc.category_name,
          bc.allocated_amount,
          COALESCE(SUM(be.amount), 0) as actual_spent
        FROM project_budgets pb
        JOIN budget_categories bc ON pb.id = bc.budget_id
        LEFT JOIN budget_entries be ON bc.id = be.category_id
        WHERE pb.project_id = $1 AND pb.status = 'Active'
        GROUP BY pb.id, pb.total_budget, pb.fiscal_year, bc.id, bc.category_name, bc.allocated_amount
        ORDER BY bc.category_name
      `;

      const budgetResult = await pool.query(budgetQuery, [projectId]);

      if (budgetResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active budget found for variance analysis'
        });
      }

      // Calculate variances
      const varianceAnalysis = budgetResult.rows.map(row => {
        const allocated = parseFloat(row.allocated_amount);
        const actual = parseFloat(row.actual_spent);
        const variance = allocated - actual;
        const variancePercent = allocated > 0 ? (variance / allocated) * 100 : 0;

        return {
          categoryId: row.category_id,
          categoryName: row.category_name,
          allocated: allocated,
          actual: actual,
          variance: variance,
          variancePercent: variancePercent,
          status: variance >= 0 ? 'Under Budget' : 'Over Budget'
        };
      });

      // Get spending trend data
      const trendQuery = `
        SELECT 
          DATE_TRUNC($1, be.created_at) as period,
          SUM(be.amount) as period_spending
        FROM budget_entries be
        JOIN budget_categories bc ON be.category_id = bc.id
        JOIN project_budgets pb ON bc.budget_id = pb.id
        WHERE pb.project_id = $2 AND pb.status = 'Active'
        GROUP BY DATE_TRUNC($1, be.created_at)
        ORDER BY period
      `;

      const periodType = period || 'month';
      const trendResult = await pool.query(trendQuery, [periodType, projectId]);

      res.json({
        success: true,
        analysis: {
          categories: varianceAnalysis,
          spendingTrend: trendResult.rows,
          summary: {
            totalAllocated: varianceAnalysis.reduce((sum, cat) => sum + cat.allocated, 0),
            totalActual: varianceAnalysis.reduce((sum, cat) => sum + cat.actual, 0),
            totalVariance: varianceAnalysis.reduce((sum, cat) => sum + cat.variance, 0),
            categoriesOverBudget: varianceAnalysis.filter(cat => cat.variance < 0).length,
            categoriesUnderBudget: varianceAnalysis.filter(cat => cat.variance >= 0).length
          }
        }
      });

    } catch (error) {
      console.error('Error generating variance analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate variance analysis'
      });
    }
  }

  // Get budget forecasting
  async getBudgetForecast(req, res) {
    try {
      const { projectId } = req.params;
      const { months = 6 } = req.query;

      // Get historical spending data
      const historicalQuery = `
        SELECT 
          DATE_TRUNC('month', be.created_at) as month,
          SUM(be.amount) as monthly_spending,
          bc.category_name
        FROM budget_entries be
        JOIN budget_categories bc ON be.category_id = bc.id
        JOIN project_budgets pb ON bc.budget_id = pb.id
        WHERE pb.project_id = $1 AND pb.status = 'Active'
          AND be.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', be.created_at), bc.category_name
        ORDER BY month DESC
      `;

      const historicalResult = await pool.query(historicalQuery, [projectId]);

      // Calculate average monthly spending by category
      const categoryAverages = {};
      historicalResult.rows.forEach(row => {
        if (!categoryAverages[row.category_name]) {
          categoryAverages[row.category_name] = [];
        }
        categoryAverages[row.category_name].push(parseFloat(row.monthly_spending));
      });

      // Generate forecast
      const forecast = [];
      const forecastMonths = parseInt(months);
      
      for (let i = 1; i <= forecastMonths; i++) {
        const forecastDate = new Date();
        forecastDate.setMonth(forecastDate.getMonth() + i);
        
        let totalForecast = 0;
        const categoryForecasts = {};

        Object.keys(categoryAverages).forEach(category => {
          const average = categoryAverages[category].reduce((sum, val) => sum + val, 0) / categoryAverages[category].length;
          categoryForecasts[category] = average;
          totalForecast += average;
        });

        forecast.push({
          month: forecastDate.toISOString().substring(0, 7),
          totalForecast: totalForecast,
          categoryForecasts: categoryForecasts
        });
      }

      res.json({
        success: true,
        forecast: {
          projectedSpending: forecast,
          historicalData: historicalResult.rows,
          methodology: 'Based on 12-month historical average'
        }
      });

    } catch (error) {
      console.error('Error generating budget forecast:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate budget forecast'
      });
    }
  }

  // Transfer budget between categories
  async transferBudget(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { projectId } = req.params;
      const {
        fromCategoryId,
        toCategoryId,
        amount,
        reason
      } = req.body;
      const userId = req.user.id;

      // Get current budget
      const budgetQuery = `
        SELECT id FROM project_budgets 
        WHERE project_id = $1 AND status = 'Active'
        ORDER BY version DESC 
        LIMIT 1
      `;
      
      const budgetResult = await client.query(budgetQuery, [projectId]);
      
      if (budgetResult.rows.length === 0) {
        throw new Error('No active budget found');
      }

      const budgetId = budgetResult.rows[0].id;

      // Validate source category has sufficient funds
      const fromCategoryQuery = `
        SELECT 
          bc.allocated_amount,
          COALESCE(SUM(be.amount), 0) as spent_amount
        FROM budget_categories bc
        LEFT JOIN budget_entries be ON bc.id = be.category_id
        WHERE bc.id = $1 AND bc.budget_id = $2
        GROUP BY bc.id, bc.allocated_amount
      `;

      const fromCategoryResult = await client.query(fromCategoryQuery, [fromCategoryId, budgetId]);
      
      if (fromCategoryResult.rows.length === 0) {
        throw new Error('Source category not found');
      }

      const fromCategory = fromCategoryResult.rows[0];
      const availableAmount = parseFloat(fromCategory.allocated_amount) - parseFloat(fromCategory.spent_amount);

      if (parseFloat(amount) > availableAmount) {
        throw new Error(`Insufficient funds in source category. Available: $${availableAmount.toFixed(2)}`);
      }

      // Update source category (decrease allocation)
      await client.query(
        'UPDATE budget_categories SET allocated_amount = allocated_amount - $1 WHERE id = $2',
        [amount, fromCategoryId]
      );

      // Update destination category (increase allocation)
      await client.query(
        'UPDATE budget_categories SET allocated_amount = allocated_amount + $1 WHERE id = $2',
        [amount, toCategoryId]
      );

      // Create transfer record
      const transferQuery = `
        INSERT INTO budget_transfers (
          budget_id, from_category_id, to_category_id, amount,
          reason, transferred_by, transferred_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;

      const transferResult = await client.query(transferQuery, [
        budgetId, fromCategoryId, toCategoryId, amount, reason, userId
      ]);

      // Create audit trail entries
      const auditQuery = `
        INSERT INTO budget_audit_trail (
          budget_id, action_type, action_description, amount,
          performed_by, performed_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `;

      await client.query(auditQuery, [
        budgetId,
        'Budget Transfer',
        `Budget transfer: ${reason}`,
        amount,
        userId
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Budget transfer completed successfully',
        transfer: transferResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error transferring budget:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to transfer budget'
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new BudgetController();

