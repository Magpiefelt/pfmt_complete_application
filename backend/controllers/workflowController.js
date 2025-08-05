const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const workflowController = {
    // Get workflow state for a gate meeting
    async getWorkflowState(req, res) {
        try {
            const { gate_meeting_id } = req.params;

            const query = `
                SELECT 
                    gmws.*,
                    u.first_name || ' ' || u.last_name as entered_by_name
                FROM gate_meeting_workflow_states gmws
                LEFT JOIN users u ON gmws.state_entered_by = u.id
                WHERE gmws.gate_meeting_id = $1
                ORDER BY gmws.state_entered_at DESC
            `;

            const result = await pool.query(query, [gate_meeting_id]);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching workflow state:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching workflow state',
                error: error.message
            });
        }
    },

    // Update workflow state
    async updateWorkflowState(req, res) {
        try {
            const { gate_meeting_id } = req.params;
            const { new_state, state_notes, auto_transition_date, auto_transition_to_state } = req.body;
            const user_id = req.user?.id;

            // Get current state
            const currentStateQuery = `
                SELECT current_state FROM gate_meeting_workflow_states 
                WHERE gate_meeting_id = $1 
                ORDER BY state_entered_at DESC 
                LIMIT 1
            `;
            const currentStateResult = await pool.query(currentStateQuery, [gate_meeting_id]);
            const previous_state = currentStateResult.rows[0]?.current_state || null;

            // Define possible next states based on current state
            const nextStatesMap = {
                'new_project_announced': ['par_approved'],
                'par_approved': ['gate_meeting_scheduled', 'planning_required'],
                'planning_required': ['gate_meeting_scheduled'],
                'gate_meeting_scheduled': ['meeting_in_progress', 'meeting_cancelled', 'meeting_rescheduled'],
                'meeting_in_progress': ['meeting_completed', 'meeting_cancelled'],
                'meeting_completed': ['decision_pending', 'approved', 'rejected', 'conditional_approval'],
                'decision_pending': ['approved', 'rejected', 'conditional_approval', 'deferred'],
                'approved': ['next_milestone_scheduled', 'project_completed'],
                'rejected': ['issues_resolution_required'],
                'conditional_approval': ['conditions_being_addressed'],
                'conditions_being_addressed': ['conditions_met', 'conditions_not_met'],
                'conditions_met': ['approved'],
                'conditions_not_met': ['rejected'],
                'issues_resolution_required': ['issues_resolved'],
                'issues_resolved': ['gate_meeting_scheduled'],
                'meeting_cancelled': ['gate_meeting_scheduled'],
                'meeting_rescheduled': ['gate_meeting_scheduled'],
                'deferred': ['gate_meeting_scheduled'],
                'next_milestone_scheduled': ['milestone_in_progress'],
                'milestone_in_progress': ['milestone_completed'],
                'milestone_completed': ['gate_meeting_scheduled', 'project_completed']
            };

            const next_possible_states = nextStatesMap[new_state] || [];

            // Insert new workflow state
            const workflowStateId = uuidv4();
            const insertQuery = `
                INSERT INTO gate_meeting_workflow_states (
                    id, gate_meeting_id, current_state, previous_state,
                    next_possible_states, state_entered_by, state_notes,
                    auto_transition_date, auto_transition_to_state
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const result = await pool.query(insertQuery, [
                workflowStateId, gate_meeting_id, new_state, previous_state,
                JSON.stringify(next_possible_states), user_id, state_notes,
                auto_transition_date, auto_transition_to_state
            ]);

            res.json({
                success: true,
                message: 'Workflow state updated successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error updating workflow state:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating workflow state',
                error: error.message
            });
        }
    },

    // Get action items for a gate meeting
    async getActionItems(req, res) {
        try {
            const { gate_meeting_id } = req.params;
            const { status, assigned_to } = req.query;

            let query = `
                SELECT 
                    gmai.*,
                    u.first_name || ' ' || u.last_name as assigned_to_name,
                    or_role.name as assigned_role_name,
                    creator.first_name || ' ' || creator.last_name as created_by_name
                FROM gate_meeting_action_items gmai
                LEFT JOIN users u ON gmai.assigned_to = u.id
                LEFT JOIN organizational_roles or_role ON gmai.assigned_role_id = or_role.id
                LEFT JOIN users creator ON gmai.created_by = creator.id
                WHERE gmai.gate_meeting_id = $1
            `;

            const params = [gate_meeting_id];
            let paramCount = 1;

            if (status) {
                paramCount++;
                query += ` AND gmai.status = $${paramCount}`;
                params.push(status);
            }

            if (assigned_to) {
                paramCount++;
                query += ` AND gmai.assigned_to = $${paramCount}`;
                params.push(assigned_to);
            }

            query += ` ORDER BY gmai.priority DESC, gmai.due_date ASC`;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching action items:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching action items',
                error: error.message
            });
        }
    },

    // Create action item
    async createActionItem(req, res) {
        try {
            const { gate_meeting_id } = req.params;
            const {
                title,
                description,
                priority = 'medium',
                assigned_to,
                assigned_role_id,
                due_date
            } = req.body;

            const user_id = req.user?.id;
            const actionItemId = uuidv4();

            const insertQuery = `
                INSERT INTO gate_meeting_action_items (
                    id, gate_meeting_id, title, description, priority,
                    assigned_to, assigned_role_id, due_date, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const result = await pool.query(insertQuery, [
                actionItemId, gate_meeting_id, title, description, priority,
                assigned_to, assigned_role_id, due_date, user_id
            ]);

            res.status(201).json({
                success: true,
                message: 'Action item created successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating action item:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating action item',
                error: error.message
            });
        }
    },

    // Update action item
    async updateActionItem(req, res) {
        try {
            const { action_item_id } = req.params;
            const {
                title,
                description,
                priority,
                status,
                assigned_to,
                assigned_role_id,
                due_date,
                completion_notes
            } = req.body;

            let updateFields = [];
            let params = [];
            let paramCount = 0;

            if (title !== undefined) {
                paramCount++;
                updateFields.push(`title = $${paramCount}`);
                params.push(title);
            }

            if (description !== undefined) {
                paramCount++;
                updateFields.push(`description = $${paramCount}`);
                params.push(description);
            }

            if (priority !== undefined) {
                paramCount++;
                updateFields.push(`priority = $${paramCount}`);
                params.push(priority);
            }

            if (status !== undefined) {
                paramCount++;
                updateFields.push(`status = $${paramCount}`);
                params.push(status);

                if (status === 'completed') {
                    paramCount++;
                    updateFields.push(`completed_date = $${paramCount}`);
                    params.push(new Date().toISOString().split('T')[0]);
                }
            }

            if (assigned_to !== undefined) {
                paramCount++;
                updateFields.push(`assigned_to = $${paramCount}`);
                params.push(assigned_to);
            }

            if (assigned_role_id !== undefined) {
                paramCount++;
                updateFields.push(`assigned_role_id = $${paramCount}`);
                params.push(assigned_role_id);
            }

            if (due_date !== undefined) {
                paramCount++;
                updateFields.push(`due_date = $${paramCount}`);
                params.push(due_date);
            }

            if (completion_notes !== undefined) {
                paramCount++;
                updateFields.push(`completion_notes = $${paramCount}`);
                params.push(completion_notes);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            paramCount++;
            updateFields.push(`updated_at = $${paramCount}`);
            params.push(new Date());

            paramCount++;
            params.push(action_item_id);

            const updateQuery = `
                UPDATE gate_meeting_action_items 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(updateQuery, params);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Action item not found'
                });
            }

            res.json({
                success: true,
                message: 'Action item updated successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error updating action item:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating action item',
                error: error.message
            });
        }
    },

    // Delete action item
    async deleteActionItem(req, res) {
        try {
            const { action_item_id } = req.params;

            const result = await pool.query(
                'DELETE FROM gate_meeting_action_items WHERE id = $1 RETURNING *',
                [action_item_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Action item not found'
                });
            }

            res.json({
                success: true,
                message: 'Action item deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting action item:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting action item',
                error: error.message
            });
        }
    },

    // Get participants for a gate meeting
    async getParticipants(req, res) {
        try {
            const { gate_meeting_id } = req.params;

            const query = `
                SELECT 
                    gmp.*,
                    u.first_name || ' ' || u.last_name as participant_name,
                    u.email,
                    u.phone,
                    or_role.name as role_name,
                    or_role.is_panel_member,
                    or_role.is_support_role
                FROM gate_meeting_participants gmp
                JOIN users u ON gmp.user_id = u.id
                JOIN organizational_roles or_role ON gmp.role_id = or_role.id
                WHERE gmp.gate_meeting_id = $1
                ORDER BY or_role.typical_authority_level ASC, u.last_name ASC
            `;

            const result = await pool.query(query, [gate_meeting_id]);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching participants:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching participants',
                error: error.message
            });
        }
    },

    // Add participant to gate meeting
    async addParticipant(req, res) {
        try {
            const { gate_meeting_id } = req.params;
            const {
                user_id,
                role_id,
                is_required = false,
                is_chair = false,
                is_scribe = false
            } = req.body;

            const participantId = uuidv4();

            const insertQuery = `
                INSERT INTO gate_meeting_participants (
                    id, gate_meeting_id, user_id, role_id,
                    is_required, is_chair, is_scribe
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const result = await pool.query(insertQuery, [
                participantId, gate_meeting_id, user_id, role_id,
                is_required, is_chair, is_scribe
            ]);

            res.status(201).json({
                success: true,
                message: 'Participant added successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error adding participant:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding participant',
                error: error.message
            });
        }
    },

    // Update participant attendance
    async updateParticipantAttendance(req, res) {
        try {
            const { participant_id } = req.params;
            const { attendance_status, participation_notes } = req.body;

            const updateQuery = `
                UPDATE gate_meeting_participants 
                SET 
                    attendance_status = COALESCE($1, attendance_status),
                    participation_notes = COALESCE($2, participation_notes),
                    response_received_at = CASE 
                        WHEN $1 IN ('accepted', 'declined', 'tentative') THEN CURRENT_TIMESTAMP 
                        ELSE response_received_at 
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `;

            const result = await pool.query(updateQuery, [
                attendance_status, participation_notes, participant_id
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Participant not found'
                });
            }

            res.json({
                success: true,
                message: 'Participant attendance updated successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error updating participant attendance:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating participant attendance',
                error: error.message
            });
        }
    },

    // Remove participant from gate meeting
    async removeParticipant(req, res) {
        try {
            const { participant_id } = req.params;

            const result = await pool.query(
                'DELETE FROM gate_meeting_participants WHERE id = $1 RETURNING *',
                [participant_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Participant not found'
                });
            }

            res.json({
                success: true,
                message: 'Participant removed successfully'
            });
        } catch (error) {
            console.error('Error removing participant:', error);
            res.status(500).json({
                success: false,
                message: 'Error removing participant',
                error: error.message
            });
        }
    },

    // Get workflow statistics
    async getWorkflowStatistics(req, res) {
        try {
            const { fiscal_year } = req.query;

            let whereClause = '';
            const params = [];

            if (fiscal_year) {
                whereClause = 'WHERE gm.fiscal_year = $1';
                params.push(fiscal_year);
            }

            const query = `
                SELECT 
                    COUNT(*) as total_meetings,
                    COUNT(CASE WHEN gmws.current_state = 'approved' THEN 1 END) as approved_meetings,
                    COUNT(CASE WHEN gmws.current_state = 'rejected' THEN 1 END) as rejected_meetings,
                    COUNT(CASE WHEN gmws.current_state = 'gate_meeting_scheduled' THEN 1 END) as scheduled_meetings,
                    COUNT(CASE WHEN gmws.current_state = 'meeting_completed' THEN 1 END) as completed_meetings,
                    AVG(EXTRACT(DAYS FROM (gm.actual_date - gm.planned_date))) as avg_schedule_variance_days,
                    COUNT(CASE WHEN gmai.status = 'open' THEN 1 END) as open_action_items,
                    COUNT(CASE WHEN gmai.status = 'completed' THEN 1 END) as completed_action_items
                FROM gate_meetings gm
                LEFT JOIN gate_meeting_workflow_states gmws ON gm.id = gmws.gate_meeting_id
                LEFT JOIN gate_meeting_action_items gmai ON gm.id = gmai.gate_meeting_id
                ${whereClause}
            `;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error fetching workflow statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching workflow statistics',
                error: error.message
            });
        }
    }
};

module.exports = workflowController;

