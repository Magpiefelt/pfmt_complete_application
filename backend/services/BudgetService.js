/**
 * Budget Service
 * Business logic for budget management functionality
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');

class BudgetService {
    /**
     * Get project budget overview
     */
    static async getProjectBudgetOverview(projectId, userId = null) {
        try {
            const queryText = `
                SELECT 
                    p.id,
                    p.project_name,
                    p.project_code,
                    p.estimated_budget,
                    p.actual_cost,
                    p.budget_variance,
                    p.budget_status,
                    COALESCE(SUM(be.amount), 0) as total_expenses,
                    COALESCE(SUM(CASE WHEN be.status = 'approved' THEN be.amount ELSE 0 END), 0) as approved_expenses,
                    COALESCE(SUM(CASE WHEN be.status = 'pending' THEN be.amount ELSE 0 END), 0) as pending_expenses,
                    COUNT(be.id) as expense_count
                FROM projects p
                LEFT JOIN budget_expenses be ON p.id = be.project_id
                WHERE p.id = $1
                GROUP BY p.id, p.project_name, p.project_code, p.estimated_budget, p.actual_cost, p.budget_variance, p.budget_status
            `;
            
            const result = await query(queryText, [projectId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const budget = result.rows[0];
            
            // Calculate additional metrics
            budget.remaining_budget = budget.estimated_budget - budget.actual_cost;
            budget.budget_utilization = budget.estimated_budget > 0 ? 
                (budget.actual_cost / budget.estimated_budget * 100).toFixed(2) : 0;
            budget.variance_percentage = budget.estimated_budget > 0 ? 
                (budget.budget_variance / budget.estimated_budget * 100).toFixed(2) : 0;
            
            return budget;
        } catch (error) {
            console.error('Error getting project budget overview:', error);
            throw error;
        }
    }

    /**
     * Get budget expenses for a project
     */
    static async getBudgetExpenses(projectId, filters = {}) {
        try {
            let queryText = `
                SELECT 
                    be.*,
                    bc.category_name,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    au.first_name || ' ' || au.last_name as approved_by_name
                FROM budget_expenses be
                LEFT JOIN budget_categories bc ON be.category_id = bc.id
                LEFT JOIN users u ON be.created_by = u.id
                LEFT JOIN users au ON be.approved_by = au.id
                WHERE be.project_id = $1
            `;
            
            const params = [projectId];
            let paramCount = 1;
            
            // Apply filters
            if (filters.category) {
                paramCount++;
                queryText += ` AND be.category_id = $${paramCount}`;
                params.push(filters.category);
            }
            
            if (filters.status) {
                paramCount++;
                queryText += ` AND be.status = $${paramCount}`;
                params.push(filters.status);
            }
            
            if (filters.startDate) {
                paramCount++;
                queryText += ` AND be.expense_date >= $${paramCount}`;
                params.push(filters.startDate);
            }
            
            if (filters.endDate) {
                paramCount++;
                queryText += ` AND be.expense_date <= $${paramCount}`;
                params.push(filters.endDate);
            }
            
            if (filters.minAmount) {
                paramCount++;
                queryText += ` AND be.amount >= $${paramCount}`;
                params.push(filters.minAmount);
            }
            
            if (filters.maxAmount) {
                paramCount++;
                queryText += ` AND be.amount <= $${paramCount}`;
                params.push(filters.maxAmount);
            }
            
            // Pagination
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const offset = (page - 1) * limit;
            
            queryText += ` ORDER BY be.expense_date DESC, be.created_at DESC`;
            queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            params.push(limit, offset);
            
            const result = await query(queryText, params);
            
            // Get total count for pagination
            let countQuery = `
                SELECT COUNT(*) as total
                FROM budget_expenses be
                WHERE be.project_id = $1
            `;
            const countParams = [projectId];
            let countParamCount = 1;
            
            if (filters.category) {
                countParamCount++;
                countQuery += ` AND be.category_id = $${countParamCount}`;
                countParams.push(filters.category);
            }
            
            if (filters.status) {
                countParamCount++;
                countQuery += ` AND be.status = $${countParamCount}`;
                countParams.push(filters.status);
            }
            
            const countResult = await query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);
            
            return {
                expenses: result.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting budget expenses:', error);
            throw error;
        }
    }

    /**
     * Create budget expense
     */
    static async createBudgetExpense(projectId, expenseData, userId) {
        try {
            // Validate project exists and user has access
            const projectCheck = await query(
                'SELECT id FROM projects WHERE id = $1',
                [projectId]
            );
            
            if (projectCheck.rows.length === 0) {
                throw new Error('Project not found');
            }
            
            const expenseId = uuidv4();
            
            const queryText = `
                INSERT INTO budget_expenses (
                    id, project_id, category_id, description, amount, 
                    expense_date, vendor, receipt_number, status, 
                    created_by, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                RETURNING *
            `;
            
            const params = [
                expenseId,
                projectId,
                expenseData.categoryId,
                expenseData.description,
                expenseData.amount,
                expenseData.expenseDate,
                expenseData.vendor || null,
                expenseData.receiptNumber || null,
                'pending',
                userId
            ];
            
            const result = await query(queryText, params);
            
            // Update project actual cost if expense is approved
            if (expenseData.status === 'approved') {
                await this.updateProjectActualCost(projectId);
            }
            
            // Audit log
            auditLogger('EXPENSE_CREATE', 'budget_expense', expenseId, userId, {
                projectId,
                amount: expenseData.amount,
                category: expenseData.categoryId
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating budget expense:', error);
            throw error;
        }
    }

    /**
     * Update budget expense
     */
    static async updateBudgetExpense(expenseId, updateData, userId) {
        try {
            // Check if expense exists and get current data
            const currentExpense = await query(
                'SELECT * FROM budget_expenses WHERE id = $1',
                [expenseId]
            );
            
            if (currentExpense.rows.length === 0) {
                throw new Error('Budget expense not found');
            }
            
            const expense = currentExpense.rows[0];
            
            // Build update query dynamically
            const updateFields = [];
            const params = [];
            let paramCount = 0;
            
            const allowedFields = [
                'category_id', 'description', 'amount', 'expense_date', 
                'vendor', 'receipt_number', 'notes'
            ];
            
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    paramCount++;
                    updateFields.push(`${field} = $${paramCount}`);
                    params.push(updateData[field]);
                }
            });
            
            if (updateFields.length === 0) {
                return expense;
            }
            
            // Add updated_at and updated_by
            paramCount++;
            updateFields.push(`updated_at = NOW()`);
            updateFields.push(`updated_by = $${paramCount}`);
            params.push(userId);
            
            // Add WHERE clause
            paramCount++;
            params.push(expenseId);
            
            const queryText = `
                UPDATE budget_expenses 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;
            
            const result = await query(queryText, params);
            
            // Update project actual cost if amount changed
            if (updateData.amount !== undefined && updateData.amount !== expense.amount) {
                await this.updateProjectActualCost(expense.project_id);
            }
            
            // Audit log
            auditLogger('EXPENSE_UPDATE', 'budget_expense', expenseId, userId, {
                projectId: expense.project_id,
                changes: Object.keys(updateData)
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating budget expense:', error);
            throw error;
        }
    }

    /**
     * Approve budget expense
     */
    static async approveBudgetExpense(expenseId, userId, notes = null) {
        try {
            const expense = await query(
                'SELECT * FROM budget_expenses WHERE id = $1',
                [expenseId]
            );
            
            if (expense.rows.length === 0) {
                throw new Error('Budget expense not found');
            }
            
            const expenseData = expense.rows[0];
            
            if (expenseData.status === 'approved') {
                throw new Error('Expense is already approved');
            }
            
            const queryText = `
                UPDATE budget_expenses 
                SET 
                    status = 'approved',
                    approved_by = $1,
                    approved_at = NOW(),
                    approval_notes = $2,
                    updated_at = NOW()
                WHERE id = $3
                RETURNING *
            `;
            
            const result = await query(queryText, [userId, notes, expenseId]);
            
            // Update project actual cost
            await this.updateProjectActualCost(expenseData.project_id);
            
            // Audit log
            auditLogger('EXPENSE_APPROVE', 'budget_expense', expenseId, userId, {
                projectId: expenseData.project_id,
                amount: expenseData.amount
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error approving budget expense:', error);
            throw error;
        }
    }

    /**
     * Reject budget expense
     */
    static async rejectBudgetExpense(expenseId, userId, reason) {
        try {
            const expense = await query(
                'SELECT * FROM budget_expenses WHERE id = $1',
                [expenseId]
            );
            
            if (expense.rows.length === 0) {
                throw new Error('Budget expense not found');
            }
            
            const expenseData = expense.rows[0];
            
            const queryText = `
                UPDATE budget_expenses 
                SET 
                    status = 'rejected',
                    rejected_by = $1,
                    rejected_at = NOW(),
                    rejection_reason = $2,
                    updated_at = NOW()
                WHERE id = $3
                RETURNING *
            `;
            
            const result = await query(queryText, [userId, reason, expenseId]);
            
            // Audit log
            auditLogger('EXPENSE_REJECT', 'budget_expense', expenseId, userId, {
                projectId: expenseData.project_id,
                reason
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error rejecting budget expense:', error);
            throw error;
        }
    }

    /**
     * Delete budget expense
     */
    static async deleteBudgetExpense(expenseId, userId) {
        try {
            const expense = await query(
                'SELECT * FROM budget_expenses WHERE id = $1',
                [expenseId]
            );
            
            if (expense.rows.length === 0) {
                throw new Error('Budget expense not found');
            }
            
            const expenseData = expense.rows[0];
            
            // Soft delete
            const queryText = `
                UPDATE budget_expenses 
                SET 
                    is_deleted = true,
                    deleted_by = $1,
                    deleted_at = NOW(),
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `;
            
            const result = await query(queryText, [userId, expenseId]);
            
            // Update project actual cost if expense was approved
            if (expenseData.status === 'approved') {
                await this.updateProjectActualCost(expenseData.project_id);
            }
            
            // Audit log
            auditLogger('EXPENSE_DELETE', 'budget_expense', expenseId, userId, {
                projectId: expenseData.project_id,
                amount: expenseData.amount
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error deleting budget expense:', error);
            throw error;
        }
    }

    /**
     * Update project actual cost based on approved expenses
     */
    static async updateProjectActualCost(projectId) {
        try {
            const queryText = `
                UPDATE projects 
                SET 
                    actual_cost = (
                        SELECT COALESCE(SUM(amount), 0) 
                        FROM budget_expenses 
                        WHERE project_id = $1 
                        AND status = 'approved' 
                        AND is_deleted = false
                    ),
                    budget_variance = estimated_budget - (
                        SELECT COALESCE(SUM(amount), 0) 
                        FROM budget_expenses 
                        WHERE project_id = $1 
                        AND status = 'approved' 
                        AND is_deleted = false
                    ),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            `;
            
            const result = await query(queryText, [projectId]);
            
            // Update budget status based on variance
            if (result.rows.length > 0) {
                const project = result.rows[0];
                let budgetStatus = 'on_track';
                
                if (project.budget_variance < 0) {
                    budgetStatus = 'over_budget';
                } else if (project.budget_variance < project.estimated_budget * 0.1) {
                    budgetStatus = 'at_risk';
                }
                
                await query(
                    'UPDATE projects SET budget_status = $1 WHERE id = $2',
                    [budgetStatus, projectId]
                );
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating project actual cost:', error);
            throw error;
        }
    }

    /**
     * Get budget categories
     */
    static async getBudgetCategories(isActive = true) {
        try {
            let queryText = `
                SELECT id, category_name, description, is_active, created_at
                FROM budget_categories
            `;
            const params = [];
            
            if (isActive !== null) {
                queryText += ` WHERE is_active = $1`;
                params.push(isActive);
            }
            
            queryText += ` ORDER BY category_name`;
            
            const result = await query(queryText, params);
            return result.rows;
        } catch (error) {
            console.error('Error getting budget categories:', error);
            throw error;
        }
    }

    /**
     * Get budget statistics for a project
     */
    static async getBudgetStatistics(projectId) {
        try {
            const queryText = `
                SELECT 
                    COUNT(*) as total_expenses,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_expenses,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_expenses,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_expenses,
                    COALESCE(SUM(amount), 0) as total_amount,
                    COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as approved_amount,
                    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
                    COALESCE(AVG(CASE WHEN status = 'approved' THEN amount END), 0) as avg_expense_amount,
                    COALESCE(MAX(CASE WHEN status = 'approved' THEN amount END), 0) as max_expense_amount,
                    COALESCE(MIN(CASE WHEN status = 'approved' THEN amount END), 0) as min_expense_amount
                FROM budget_expenses
                WHERE project_id = $1 AND is_deleted = false
            `;
            
            const result = await query(queryText, [projectId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting budget statistics:', error);
            throw error;
        }
    }

    /**
     * Get budget forecast for a project
     */
    static async getBudgetForecast(projectId) {
        try {
            // Get project details
            const project = await query(
                'SELECT * FROM projects WHERE id = $1',
                [projectId]
            );
            
            if (project.rows.length === 0) {
                throw new Error('Project not found');
            }
            
            const projectData = project.rows[0];
            
            // Get monthly expense trends
            const trendQuery = `
                SELECT 
                    DATE_TRUNC('month', expense_date) as month,
                    SUM(amount) as monthly_total,
                    COUNT(*) as expense_count
                FROM budget_expenses
                WHERE project_id = $1 
                AND status = 'approved' 
                AND is_deleted = false
                GROUP BY DATE_TRUNC('month', expense_date)
                ORDER BY month
            `;
            
            const trendResult = await query(trendQuery, [projectId]);
            
            // Calculate forecast
            const monthlyTrends = trendResult.rows;
            let forecast = {
                projected_total_cost: projectData.actual_cost,
                projected_variance: projectData.budget_variance,
                forecast_accuracy: 'medium',
                monthly_trends: monthlyTrends
            };
            
            if (monthlyTrends.length >= 3) {
                // Calculate average monthly spend
                const totalMonthlySpend = monthlyTrends.reduce((sum, month) => sum + parseFloat(month.monthly_total), 0);
                const avgMonthlySpend = totalMonthlySpend / monthlyTrends.length;
                
                // Project remaining months
                const projectStart = new Date(projectData.start_date);
                const projectEnd = new Date(projectData.end_date);
                const now = new Date();
                
                const totalMonths = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24 * 30));
                const elapsedMonths = Math.ceil((now - projectStart) / (1000 * 60 * 60 * 24 * 30));
                const remainingMonths = Math.max(0, totalMonths - elapsedMonths);
                
                forecast.projected_total_cost = projectData.actual_cost + (avgMonthlySpend * remainingMonths);
                forecast.projected_variance = projectData.estimated_budget - forecast.projected_total_cost;
                forecast.forecast_accuracy = remainingMonths <= 3 ? 'high' : remainingMonths <= 6 ? 'medium' : 'low';
            }
            
            return forecast;
        } catch (error) {
            console.error('Error getting budget forecast:', error);
            throw error;
        }
    }
}

module.exports = BudgetService;

