const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const gateMeetingController = {
    // Get all gate meetings with filters
    async getAllGateMeetings(req, res) {
        try {
            const { 
                project_id, 
                fiscal_year, 
                status, 
                meeting_type, 
                start_date, 
                end_date,
                page = 1,
                limit = 50
            } = req.query;

            let query = `
                SELECT 
                    gm.*,
                    p.project_name,
                    p.cpd_number,
                    gmt.name as meeting_type_name,
                    gms.name as status_name,
                    gms.color_code,
                    u1.first_name || ' ' || u1.last_name as created_by_name,
                    u2.first_name || ' ' || u2.last_name as chaired_by_name
                FROM gate_meetings gm
                JOIN projects p ON gm.project_id = p.id
                JOIN gate_meeting_types gmt ON gm.gate_meeting_type_id = gmt.id
                JOIN gate_meeting_statuses gms ON gm.status_id = gms.id
                LEFT JOIN users u1 ON gm.created_by = u1.id
                LEFT JOIN users u2 ON gm.chaired_by = u2.id
                WHERE 1=1
            `;

            const params = [];
            let paramCount = 0;

            if (project_id) {
                paramCount++;
                query += ` AND gm.project_id = $${paramCount}`;
                params.push(project_id);
            }

            if (fiscal_year) {
                paramCount++;
                query += ` AND gm.fiscal_year = $${paramCount}`;
                params.push(fiscal_year);
            }

            if (status) {
                paramCount++;
                query += ` AND gms.name = $${paramCount}`;
                params.push(status);
            }

            if (meeting_type) {
                paramCount++;
                query += ` AND gmt.name = $${paramCount}`;
                params.push(meeting_type);
            }

            if (start_date) {
                paramCount++;
                query += ` AND gm.planned_date >= $${paramCount}`;
                params.push(start_date);
            }

            if (end_date) {
                paramCount++;
                query += ` AND gm.planned_date <= $${paramCount}`;
                params.push(end_date);
            }

            query += ` ORDER BY gm.planned_date DESC`;

            // Add pagination
            const offset = (page - 1) * limit;
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            params.push(limit);
            
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            params.push(offset);

            const result = await pool.query(query, params);

            // Get total count for pagination
            let countQuery = `
                SELECT COUNT(*) 
                FROM gate_meetings gm
                JOIN gate_meeting_statuses gms ON gm.status_id = gms.id
                JOIN gate_meeting_types gmt ON gm.gate_meeting_type_id = gmt.id
                WHERE 1=1
            `;

            const countParams = params.slice(0, -2); // Remove limit and offset
            if (project_id) countQuery += ` AND gm.project_id = $1`;
            if (fiscal_year) countQuery += ` AND gm.fiscal_year = $${countParams.length}`;
            if (status) countQuery += ` AND gms.name = $${countParams.length}`;
            if (meeting_type) countQuery += ` AND gmt.name = $${countParams.length}`;
            if (start_date) countQuery += ` AND gm.planned_date >= $${countParams.length}`;
            if (end_date) countQuery += ` AND gm.planned_date <= $${countParams.length}`;

            const countResult = await pool.query(countQuery, countParams);
            const totalCount = parseInt(countResult.rows[0].count);

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching gate meetings:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching gate meetings',
                error: error.message
            });
        }
    },

    // Get gate meeting by ID
    async getGateMeetingById(req, res) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    gm.*,
                    p.project_name,
                    p.cpd_number,
                    gmt.name as meeting_type_name,
                    gmt.description as meeting_type_description,
                    gms.name as status_name,
                    gms.color_code,
                    u1.first_name || ' ' || u1.last_name as created_by_name,
                    u2.first_name || ' ' || u2.last_name as chaired_by_name,
                    u3.first_name || ' ' || u3.last_name as scribed_by_name
                FROM gate_meetings gm
                JOIN projects p ON gm.project_id = p.id
                JOIN gate_meeting_types gmt ON gm.gate_meeting_type_id = gmt.id
                JOIN gate_meeting_statuses gms ON gm.status_id = gms.id
                LEFT JOIN users u1 ON gm.created_by = u1.id
                LEFT JOIN users u2 ON gm.chaired_by = u2.id
                LEFT JOIN users u3 ON gm.scribed_by = u3.id
                WHERE gm.id = $1
            `;

            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            // Get participants
            const participantsQuery = `
                SELECT 
                    gmp.*,
                    u.first_name || ' ' || u.last_name as participant_name,
                    u.email,
                    or_role.name as role_name
                FROM gate_meeting_participants gmp
                JOIN users u ON gmp.user_id = u.id
                JOIN organizational_roles or_role ON gmp.role_id = or_role.id
                WHERE gmp.gate_meeting_id = $1
                ORDER BY or_role.typical_authority_level ASC
            `;

            const participantsResult = await pool.query(participantsQuery, [id]);

            // Get action items
            const actionItemsQuery = `
                SELECT 
                    gmai.*,
                    u.first_name || ' ' || u.last_name as assigned_to_name,
                    or_role.name as assigned_role_name
                FROM gate_meeting_action_items gmai
                LEFT JOIN users u ON gmai.assigned_to = u.id
                LEFT JOIN organizational_roles or_role ON gmai.assigned_role_id = or_role.id
                WHERE gmai.gate_meeting_id = $1
                ORDER BY gmai.priority DESC, gmai.due_date ASC
            `;

            const actionItemsResult = await pool.query(actionItemsQuery, [id]);

            const gateMeeting = {
                ...result.rows[0],
                participants: participantsResult.rows,
                action_items: actionItemsResult.rows
            };

            res.json({
                success: true,
                data: gateMeeting
            });
        } catch (error) {
            console.error('Error fetching gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching gate meeting',
                error: error.message
            });
        }
    },

    // Create new gate meeting
    async createGateMeeting(req, res) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const {
                project_id,
                gate_meeting_type_id,
                meeting_title,
                meeting_description,
                planned_date,
                start_time,
                end_time,
                location,
                meeting_url,
                requires_adm_attendance,
                requires_ed_attendance,
                participants = [],
                is_mandatory = false
            } = req.body;

            const user_id = req.user?.id; // Assuming auth middleware sets req.user

            // Get default status (Planned)
            const statusQuery = `SELECT id FROM gate_meeting_statuses WHERE name = 'Planned'`;
            const statusResult = await client.query(statusQuery);
            const status_id = statusResult.rows[0].id;

            // Create gate meeting
            const gateMeetingId = uuidv4();
            const insertQuery = `
                INSERT INTO gate_meetings (
                    id, project_id, gate_meeting_type_id, status_id,
                    meeting_title, meeting_description, planned_date,
                    start_time, end_time, location, meeting_url,
                    requires_adm_attendance, requires_ed_attendance,
                    is_mandatory, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `;

            const insertResult = await client.query(insertQuery, [
                gateMeetingId, project_id, gate_meeting_type_id, status_id,
                meeting_title, meeting_description, planned_date,
                start_time, end_time, location, meeting_url,
                requires_adm_attendance, requires_ed_attendance,
                is_mandatory, user_id
            ]);

            // Add participants
            if (participants.length > 0) {
                for (const participant of participants) {
                    const participantId = uuidv4();
                    await client.query(`
                        INSERT INTO gate_meeting_participants (
                            id, gate_meeting_id, user_id, role_id,
                            is_required, is_chair, is_scribe
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `, [
                        participantId, gateMeetingId, participant.user_id,
                        participant.role_id, participant.is_required || false,
                        participant.is_chair || false, participant.is_scribe || false
                    ]);
                }
            }

            // Create fiscal year event
            const eventId = uuidv4();
            await client.query(`
                INSERT INTO fiscal_year_events (
                    id, event_title, event_description, event_type,
                    event_date, project_id, gate_meeting_id,
                    color_code, icon, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                eventId, meeting_title, meeting_description, 'Gate Meeting',
                planned_date, project_id, gateMeetingId,
                '#0066CC', 'fas fa-users', user_id
            ]);

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Gate meeting created successfully',
                data: insertResult.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating gate meeting',
                error: error.message
            });
        } finally {
            client.release();
        }
    },

    // Update gate meeting
    async updateGateMeeting(req, res) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const { id } = req.params;
            const {
                meeting_title,
                meeting_description,
                planned_date,
                actual_date,
                start_time,
                end_time,
                location,
                meeting_url,
                status_id,
                decision,
                decision_rationale,
                key_risks_identified,
                mitigation_strategies,
                escalated_issues,
                next_milestone_date,
                next_gate_meeting_type_id
            } = req.body;

            const user_id = req.user?.id;

            const updateQuery = `
                UPDATE gate_meetings SET
                    meeting_title = COALESCE($1, meeting_title),
                    meeting_description = COALESCE($2, meeting_description),
                    planned_date = COALESCE($3, planned_date),
                    actual_date = COALESCE($4, actual_date),
                    start_time = COALESCE($5, start_time),
                    end_time = COALESCE($6, end_time),
                    location = COALESCE($7, location),
                    meeting_url = COALESCE($8, meeting_url),
                    status_id = COALESCE($9, status_id),
                    decision = COALESCE($10, decision),
                    decision_rationale = COALESCE($11, decision_rationale),
                    key_risks_identified = COALESCE($12, key_risks_identified),
                    mitigation_strategies = COALESCE($13, mitigation_strategies),
                    escalated_issues = COALESCE($14, escalated_issues),
                    next_milestone_date = COALESCE($15, next_milestone_date),
                    next_gate_meeting_type_id = COALESCE($16, next_gate_meeting_type_id),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $17
                RETURNING *
            `;

            const result = await client.query(updateQuery, [
                meeting_title, meeting_description, planned_date, actual_date,
                start_time, end_time, location, meeting_url, status_id,
                decision, decision_rationale, key_risks_identified,
                mitigation_strategies, escalated_issues, next_milestone_date,
                next_gate_meeting_type_id, id
            ]);

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            // Update corresponding fiscal year event
            if (planned_date || meeting_title) {
                await client.query(`
                    UPDATE fiscal_year_events SET
                        event_title = COALESCE($1, event_title),
                        event_date = COALESCE($2, event_date)
                    WHERE gate_meeting_id = $3
                `, [meeting_title, planned_date, id]);
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Gate meeting updated successfully',
                data: result.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating gate meeting',
                error: error.message
            });
        } finally {
            client.release();
        }
    },

    // Delete gate meeting
    async deleteGateMeeting(req, res) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const { id } = req.params;

            // Delete related fiscal year event
            await client.query('DELETE FROM fiscal_year_events WHERE gate_meeting_id = $1', [id]);

            // Delete gate meeting (cascade will handle participants and action items)
            const result = await client.query('DELETE FROM gate_meetings WHERE id = $1 RETURNING *', [id]);

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Gate meeting not found'
                });
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Gate meeting deleted successfully'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error deleting gate meeting:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting gate meeting',
                error: error.message
            });
        } finally {
            client.release();
        }
    },

    // Get gate meeting types
    async getGateMeetingTypes(req, res) {
        try {
            const query = `
                SELECT * FROM gate_meeting_types 
                WHERE is_active = true 
                ORDER BY typical_order ASC
            `;
            
            const result = await pool.query(query);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching gate meeting types:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching gate meeting types',
                error: error.message
            });
        }
    },

    // Get gate meeting statuses
    async getGateMeetingStatuses(req, res) {
        try {
            const query = `SELECT * FROM gate_meeting_statuses ORDER BY name ASC`;
            const result = await pool.query(query);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching gate meeting statuses:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching gate meeting statuses',
                error: error.message
            });
        }
    },

    // Get organizational roles
    async getOrganizationalRoles(req, res) {
        try {
            const query = `
                SELECT * FROM organizational_roles 
                ORDER BY typical_authority_level ASC, name ASC
            `;
            const result = await pool.query(query);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching organizational roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching organizational roles',
                error: error.message
            });
        }
    },

    // Get fiscal year calendar data
    async getFiscalYearCalendar(req, res) {
        try {
            const { fiscal_year, start_date, end_date } = req.query;

            let query = `SELECT * FROM fiscal_year_calendar WHERE 1=1`;
            const params = [];
            let paramCount = 0;

            if (fiscal_year) {
                paramCount++;
                query += ` AND fiscal_year = $${paramCount}`;
                params.push(fiscal_year);
            }

            if (start_date) {
                paramCount++;
                query += ` AND event_date >= $${paramCount}`;
                params.push(start_date);
            }

            if (end_date) {
                paramCount++;
                query += ` AND event_date <= $${paramCount}`;
                params.push(end_date);
            }

            query += ` ORDER BY event_date ASC`;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching fiscal year calendar:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching fiscal year calendar',
                error: error.message
            });
        }
    },

    // Get upcoming gate meetings
    async getUpcomingGateMeetings(req, res) {
        try {
            const { days_ahead = 30 } = req.query;

            const query = `
                SELECT * FROM upcoming_gate_meetings 
                WHERE days_until_meeting <= $1 
                ORDER BY planned_date ASC
                LIMIT 20
            `;

            const result = await pool.query(query, [days_ahead]);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching upcoming gate meetings:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching upcoming gate meetings',
                error: error.message
            });
        }
    },

    // Get gate meeting dashboard data
    async getGateMeetingDashboard(req, res) {
        try {
            const { fiscal_year } = req.query;

            let query = `SELECT * FROM gate_meeting_dashboard`;
            const params = [];

            if (fiscal_year) {
                query += ` WHERE fiscal_year = $1`;
                params.push(fiscal_year);
            }

            query += ` ORDER BY planned_date DESC`;

            const result = await pool.query(query, params);

            // Get summary statistics
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_meetings,
                    COUNT(CASE WHEN gms.name = 'Completed' THEN 1 END) as completed_meetings,
                    COUNT(CASE WHEN gms.name = 'Planned' THEN 1 END) as planned_meetings,
                    COUNT(CASE WHEN gms.name = 'Scheduled' THEN 1 END) as scheduled_meetings,
                    COUNT(CASE WHEN planned_date >= CURRENT_DATE AND planned_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as upcoming_30_days
                FROM gate_meetings gm
                JOIN gate_meeting_statuses gms ON gm.status_id = gms.id
                ${fiscal_year ? 'WHERE gm.fiscal_year = $1' : ''}
            `;

            const statsResult = await pool.query(statsQuery, fiscal_year ? [fiscal_year] : []);

            res.json({
                success: true,
                data: {
                    meetings: result.rows,
                    statistics: statsResult.rows[0]
                }
            });
        } catch (error) {
            console.error('Error fetching gate meeting dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching gate meeting dashboard',
                error: error.message
            });
        }
    }
};

module.exports = gateMeetingController;

