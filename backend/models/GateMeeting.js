/**
 * GateMeeting Model
 * Handles gate meetings for project governance and milestone meetings for Team A integration
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');

class GateMeeting {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.projectId = data.projectId;
        this.meetingDate = data.meetingDate;
        this.agenda = data.agenda;
        this.attendees = data.attendees || [];
        this.actionItems = data.actionItems || [];
        this.decisions = data.decisions || [];
        this.status = data.status || 'Scheduled';
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Create GateMeeting instance from database row
     */
    static fromDb(row = {}) {
        if (!row) return null;
        return new GateMeeting({
            id: row.id,
            projectId: row.project_id,
            meetingDate: row.meeting_date,
            agenda: row.agenda,
            attendees: row.attendees || [],
            actionItems: row.action_items || [],
            decisions: row.decisions || [],
            status: row.status,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    /**
     * Convert GateMeeting instance to database format
     */
    toDb() {
        return {
            id: this.id,
            project_id: this.projectId,
            meeting_date: this.meetingDate,
            agenda: this.agenda,
            attendees: this.attendees,
            action_items: this.actionItems,
            decisions: this.decisions,
            status: this.status,
            created_by: this.createdBy
        };
    }

    /**
     * Find all gate meetings with optional filtering
     */
    static async findAll(options = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            // Add filters
            if (options.projectId) {
                whereClause += ` AND gm.project_id = $${++paramCount}`;
                params.push(options.projectId);
            }

            if (options.status) {
                whereClause += ` AND gm.status = $${++paramCount}`;
                params.push(options.status);
            }

            if (options.dateFrom) {
                whereClause += ` AND gm.meeting_date >= $${++paramCount}`;
                params.push(options.dateFrom);
            }

            if (options.dateTo) {
                whereClause += ` AND gm.meeting_date <= $${++paramCount}`;
                params.push(options.dateTo);
            }

            if (options.createdBy) {
                whereClause += ` AND gm.created_by = $${++paramCount}`;
                params.push(options.createdBy);
            }

            // Add sorting
            const orderBy = options.orderBy || 'gm.meeting_date DESC';
            
            // Add pagination
            let limitClause = '';
            if (options.limit) {
                limitClause += ` LIMIT $${++paramCount}`;
                params.push(options.limit);
                
                if (options.offset) {
                    limitClause += ` OFFSET $${++paramCount}`;
                    params.push(options.offset);
                }
            }

            const queryText = `
                SELECT 
                    gm.*,
                    p.project_name,
                    u.first_name || ' ' || u.last_name as created_by_name
                FROM gate_meetings gm
                LEFT JOIN projects p ON gm.project_id = p.id
                LEFT JOIN users u ON gm.created_by = u.id
                ${whereClause}
                ORDER BY ${orderBy}
                ${limitClause}
            `;

            const result = await query(queryText, params);
            return result.rows.map(row => ({
                ...GateMeeting.fromDb(row),
                projectName: row.project_name,
                createdByName: row.created_by_name
            }));
        } catch (error) {
            console.error('Error finding gate meetings:', error);
            throw error;
        }
    }

    /**
     * Find gate meeting by ID
     */
    static async findById(id) {
        try {
            const queryText = `
                SELECT 
                    gm.*,
                    p.project_name,
                    u.first_name || ' ' || u.last_name as created_by_name
                FROM gate_meetings gm
                LEFT JOIN projects p ON gm.project_id = p.id
                LEFT JOIN users u ON gm.created_by = u.id
                WHERE gm.id = $1
            `;

            const result = await query(queryText, [id]);
            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                ...GateMeeting.fromDb(row),
                projectName: row.project_name,
                createdByName: row.created_by_name
            };
        } catch (error) {
            console.error('Error finding gate meeting by ID:', error);
            throw error;
        }
    }

    /**
     * Find gate meetings by project ID
     */
    static async findByProject(projectId) {
        return await GateMeeting.findAll({ projectId });
    }

    /**
     * Find upcoming gate meetings
     */
    static async findUpcoming(days = 30) {
        const dateFrom = new Date().toISOString();
        const dateTo = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        
        return await GateMeeting.findAll({ 
            dateFrom, 
            dateTo,
            status: 'Scheduled',
            orderBy: 'gm.meeting_date ASC'
        });
    }

    /**
     * Save gate meeting (create or update)
     */
    async save(userId = null) {
        try {
            const dbData = this.toDb();
            
            if (this.createdAt) {
                // Update existing gate meeting
                const queryText = `
                    UPDATE gate_meetings 
                    SET 
                        project_id = $2,
                        meeting_date = $3,
                        agenda = $4,
                        attendees = $5,
                        action_items = $6,
                        decisions = $7,
                        status = $8,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.project_id,
                    dbData.meeting_date,
                    dbData.agenda,
                    JSON.stringify(dbData.attendees),
                    JSON.stringify(dbData.action_items),
                    JSON.stringify(dbData.decisions),
                    dbData.status
                ];

                const result = await query(queryText, params);
                const updatedMeeting = GateMeeting.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('UPDATE', 'gate_meeting', this.id, userId, {
                        meetingDate: this.meetingDate,
                        status: this.status,
                        attendeeCount: this.attendees.length
                    });
                }

                return updatedMeeting;
            } else {
                // Create new gate meeting
                const queryText = `
                    INSERT INTO gate_meetings (
                        id, project_id, meeting_date, agenda, attendees, 
                        action_items, decisions, status, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.project_id,
                    dbData.meeting_date,
                    dbData.agenda,
                    JSON.stringify(dbData.attendees),
                    JSON.stringify(dbData.action_items),
                    JSON.stringify(dbData.decisions),
                    dbData.status,
                    userId || dbData.created_by
                ];

                const result = await query(queryText, params);
                const newMeeting = GateMeeting.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('CREATE', 'gate_meeting', this.id, userId, {
                        meetingDate: this.meetingDate,
                        projectId: this.projectId
                    });
                }

                return newMeeting;
            }
        } catch (error) {
            console.error('Error saving gate meeting:', error);
            throw error;
        }
    }

    /**
     * Update gate meeting data
     */
    async update(data, userId = null) {
        try {
            // Update instance properties
            Object.keys(data).forEach(key => {
                if (this.hasOwnProperty(key) && key !== 'id') {
                    this[key] = data[key];
                }
            });

            return await this.save(userId);
        } catch (error) {
            console.error('Error updating gate meeting:', error);
            throw error;
        }
    }

    /**
     * Delete gate meeting
     */
    async delete(userId = null) {
        try {
            const queryText = 'DELETE FROM gate_meetings WHERE id = $1 RETURNING *';
            const result = await query(queryText, [this.id]);
            
            if (result.rows.length === 0) {
                throw new Error('Gate meeting not found');
            }

            // Audit log
            if (userId) {
                auditLogger('DELETE', 'gate_meeting', this.id, userId, {
                    meetingDate: this.meetingDate,
                    projectId: this.projectId
                });
            }

            return true;
        } catch (error) {
            console.error('Error deleting gate meeting:', error);
            throw error;
        }
    }

    /**
     * Start gate meeting
     */
    async start(userId) {
        try {
            this.status = 'In Progress';
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('START', 'gate_meeting', this.id, userId, {
                meetingDate: this.meetingDate,
                previousStatus: 'Scheduled',
                newStatus: 'In Progress'
            });

            return result;
        } catch (error) {
            console.error('Error starting gate meeting:', error);
            throw error;
        }
    }

    /**
     * Complete gate meeting
     */
    async complete(userId) {
        try {
            this.status = 'Completed';
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('COMPLETE', 'gate_meeting', this.id, userId, {
                meetingDate: this.meetingDate,
                previousStatus: 'In Progress',
                newStatus: 'Completed',
                actionItemCount: this.actionItems.length,
                decisionCount: this.decisions.length
            });

            return result;
        } catch (error) {
            console.error('Error completing gate meeting:', error);
            throw error;
        }
    }

    /**
     * Cancel gate meeting
     */
    async cancel(userId, reason = null) {
        try {
            this.status = 'Cancelled';
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('CANCEL', 'gate_meeting', this.id, userId, {
                meetingDate: this.meetingDate,
                previousStatus: this.status,
                newStatus: 'Cancelled',
                reason: reason
            });

            return result;
        } catch (error) {
            console.error('Error cancelling gate meeting:', error);
            throw error;
        }
    }

    /**
     * Add attendee to gate meeting
     */
    async addAttendee(attendee, userId = null) {
        try {
            if (!this.attendees.find(a => a.id === attendee.id)) {
                this.attendees.push(attendee);
                await this.save(userId);
                
                // Audit log
                if (userId) {
                    auditLogger('ADD_ATTENDEE', 'gate_meeting', this.id, userId, {
                        attendeeName: attendee.name,
                        attendeeEmail: attendee.email
                    });
                }
            }
            
            return this;
        } catch (error) {
            console.error('Error adding attendee:', error);
            throw error;
        }
    }

    /**
     * Remove attendee from gate meeting
     */
    async removeAttendee(attendeeId, userId = null) {
        try {
            const attendeeIndex = this.attendees.findIndex(a => a.id === attendeeId);
            if (attendeeIndex !== -1) {
                const removedAttendee = this.attendees.splice(attendeeIndex, 1)[0];
                await this.save(userId);
                
                // Audit log
                if (userId) {
                    auditLogger('REMOVE_ATTENDEE', 'gate_meeting', this.id, userId, {
                        attendeeName: removedAttendee.name,
                        attendeeEmail: removedAttendee.email
                    });
                }
            }
            
            return this;
        } catch (error) {
            console.error('Error removing attendee:', error);
            throw error;
        }
    }

    /**
     * Add action item to gate meeting
     */
    async addActionItem(actionItem, userId = null) {
        try {
            actionItem.id = actionItem.id || uuidv4();
            actionItem.createdAt = new Date().toISOString();
            actionItem.status = actionItem.status || 'Open';
            
            this.actionItems.push(actionItem);
            await this.save(userId);
            
            // Audit log
            if (userId) {
                auditLogger('ADD_ACTION_ITEM', 'gate_meeting', this.id, userId, {
                    actionItemTitle: actionItem.title,
                    assignedTo: actionItem.assignedTo
                });
            }
            
            return this;
        } catch (error) {
            console.error('Error adding action item:', error);
            throw error;
        }
    }

    /**
     * Update action item status
     */
    async updateActionItem(actionItemId, updates, userId = null) {
        try {
            const actionItem = this.actionItems.find(ai => ai.id === actionItemId);
            if (actionItem) {
                Object.assign(actionItem, updates);
                actionItem.updatedAt = new Date().toISOString();
                
                await this.save(userId);
                
                // Audit log
                if (userId) {
                    auditLogger('UPDATE_ACTION_ITEM', 'gate_meeting', this.id, userId, {
                        actionItemId: actionItemId,
                        updates: updates
                    });
                }
            }
            
            return this;
        } catch (error) {
            console.error('Error updating action item:', error);
            throw error;
        }
    }

    /**
     * Get gate meeting statistics
     */
    static async getStatistics(options = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            if (options.projectId) {
                whereClause += ` AND project_id = $${++paramCount}`;
                params.push(options.projectId);
            }

            const queryText = `
                SELECT 
                    COUNT(*) as total_meetings,
                    COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) as scheduled_meetings,
                    COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_meetings,
                    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_meetings,
                    COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_meetings,
                    COUNT(CASE WHEN meeting_date > CURRENT_TIMESTAMP THEN 1 END) as upcoming_meetings,
                    COUNT(CASE WHEN meeting_date < CURRENT_TIMESTAMP AND status = 'Scheduled' THEN 1 END) as overdue_meetings
                FROM gate_meetings
                ${whereClause}
            `;

            const result = await query(queryText, params);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting gate meeting statistics:', error);
            throw error;
        }
    }

    /**
     * Validate gate meeting data
     */
    validate() {
        const errors = [];

        if (!this.projectId) errors.push('Project ID is required');
        if (!this.meetingDate) errors.push('Meeting date is required');
        
        const validStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push('Invalid status');
        }

        if (this.meetingDate && new Date(this.meetingDate) < new Date()) {
            if (this.status === 'Scheduled') {
                errors.push('Cannot schedule meeting in the past');
            }
        }

        if (this.attendees && !Array.isArray(this.attendees)) {
            errors.push('Attendees must be an array');
        }

        if (this.actionItems && !Array.isArray(this.actionItems)) {
            errors.push('Action items must be an array');
        }

        if (this.decisions && !Array.isArray(this.decisions)) {
            errors.push('Decisions must be an array');
        }

        return errors;
    }
}

module.exports = GateMeeting;

