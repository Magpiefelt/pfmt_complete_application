const { query } = require('../config/database');
const { 
  AppError, 
  createSuccessResponse, 
  createErrorResponse,
  handleDatabaseError,
  handleNotFoundError,
  asyncHandler 
} = require('../utils/errorHandler');

// Project Versions Management
const getProjectVersions = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  // Check if project exists
  const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [projectId]);
  if (projectCheck.rows.length === 0) {
    throw handleNotFoundError('Project');
  }
  
  const versionsQuery = `
    SELECT 
      pv.*,
      creator.name as created_by_name,
      submitter.name as submitted_by_name,
      approver.name as approved_by_name,
      rejector.name as rejected_by_name
    FROM project_versions pv
    LEFT JOIN users creator ON pv.created_by = creator.id
    LEFT JOIN users submitter ON pv.submitted_by = submitter.id
    LEFT JOIN users approver ON pv.approved_by = approver.id
    LEFT JOIN users rejector ON pv.rejected_by = rejector.id
    WHERE pv.project_id = $1
    ORDER BY pv.created_at DESC
  `;
  
  const versions = await query(versionsQuery, [projectId]);
  
  res.json(createSuccessResponse(
    versions.rows,
    `Found ${versions.rows.length} version(s) for project ${projectId}`,
    { count: versions.rows.length }
  ));
});

const createProjectVersion = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { versionNumber, dataSnapshot, changeSummary } = req.body;
  const userId = req.user.id;
  
  // Check if project exists
  const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [projectId]);
  if (projectCheck.rows.length === 0) {
    throw handleNotFoundError('Project');
  }
  
  // Check if version number already exists
  const versionCheck = await query(
    'SELECT id FROM project_versions WHERE project_id = $1 AND version_number = $2',
    [projectId, versionNumber]
  );
  if (versionCheck.rows.length > 0) {
    throw new AppError(`Version ${versionNumber} already exists for this project`, 409, 'VERSION_EXISTS');
  }
  
  const insertQuery = `
    INSERT INTO project_versions (
      project_id, version_number, status, version_data, 
      created_by, change_summary
    ) VALUES ($1, $2, 'Draft', $3, $4, $5)
    RETURNING *
  `;
  
  const result = await query(insertQuery, [
    projectId, versionNumber, JSON.stringify(dataSnapshot), userId, changeSummary
  ]);
  
  res.status(201).json(createSuccessResponse(
    result.rows[0],
    `Version ${versionNumber} created successfully as draft`,
    { projectId: parseInt(projectId), versionNumber }
  ));
});

const submitVersionForApproval = async (req, res) => {
    try {
        const { versionId } = req.params;
        const userId = req.user.id;
        
        const updateQuery = `
            UPDATE project_versions 
            SET status = 'PendingApproval', submitted_at = CURRENT_TIMESTAMP, submitted_by = $1
            WHERE id = $2 AND status = 'Draft'
            RETURNING *
        `;
        
        const result = await query(updateQuery, [userId, versionId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Version not found or not in draft status'
            });
        }
        
        // Generate guidance notification for approvers
        const projectId = result.rows[0].project_id;
        await generateApprovalNotification(projectId, versionId);
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error submitting version for approval:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit version for approval'
        });
    }
};

const approveVersion = async (req, res) => {
    try {
        const { versionId } = req.params;
        const userId = req.user.id;
        
        // Start transaction
        await query('BEGIN');
        
        try {
            // Get version details
            const versionQuery = `
                SELECT * FROM project_versions WHERE id = $1 AND status = 'PendingApproval'
            `;
            const versionResult = await query(versionQuery, [versionId]);
            
            if (versionResult.rows.length === 0) {
                await query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    error: 'Version not found or not pending approval'
                });
            }
            
            const version = versionResult.rows[0];
            
            // Set current version to false for this project
            await query(
                'UPDATE project_versions SET is_current = FALSE WHERE project_id = $1',
                [version.project_id]
            );
            
            // Approve this version and set as current
            const approveQuery = `
                UPDATE project_versions 
                SET status = 'Approved', approved_at = CURRENT_TIMESTAMP, 
                    approved_by = $1, is_current = TRUE
                WHERE id = $2
                RETURNING *
            `;
            
            const result = await query(approveQuery, [userId, versionId]);
            
            // Update project with approved data
            const dataSnapshot = version.version_data;
            if (dataSnapshot) {
                const updateProjectQuery = `
                    UPDATE projects 
                    SET project_name = $1, description = $2, project_category = $3, 
                        total_budget = $4, current_budget = $5, project_status = $6
                    WHERE id = $7
                `;
                
                await query(updateProjectQuery, [
                    dataSnapshot.name || dataSnapshot.project_name,
                    dataSnapshot.description,
                    dataSnapshot.category || dataSnapshot.project_category,
                    dataSnapshot.total_budget,
                    dataSnapshot.current_budget,
                    dataSnapshot.status || dataSnapshot.project_status,
                    version.project_id
                ]);
            }
            
            await query('COMMIT');
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error approving version:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve version'
        });
    }
};

const rejectVersion = async (req, res) => {
    try {
        const { versionId } = req.params;
        const { rejectionReason } = req.body;
        const userId = req.user.id;
        
        const updateQuery = `
            UPDATE project_versions 
            SET status = 'Rejected', rejected_at = CURRENT_TIMESTAMP, 
                rejected_by = $1, rejection_reason = $2
            WHERE id = $3 AND status = 'PendingApproval'
            RETURNING *
        `;
        
        const result = await query(updateQuery, [userId, rejectionReason, versionId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Version not found or not pending approval'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error rejecting version:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject version'
        });
    }
};

const compareVersions = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { currentVersionId, compareVersionId } = req.query;
        
        const versionsQuery = `
            SELECT id, version_number, version_data, status
            FROM project_versions 
            WHERE id IN ($1, $2) AND project_id = $3
        `;
        
        const result = await query(versionsQuery, [currentVersionId, compareVersionId, projectId]);
        
        if (result.rows.length !== 2) {
            return res.status(404).json({
                success: false,
                error: 'One or both versions not found'
            });
        }
        
        const versions = result.rows;
        const currentVersion = versions.find(v => v.id == currentVersionId);
        const compareVersion = versions.find(v => v.id == compareVersionId);
        
        // Generate field-level differences
        const differences = generateVersionDiff(currentVersion.version_data, compareVersion.version_data);
        
        res.json({
            success: true,
            data: {
                currentVersion,
                compareVersion,
                differences
            }
        });
    } catch (error) {
        console.error('Error comparing versions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compare versions'
        });
    }
};

// Calendar Events Management
const getCalendarEvents = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, endDate, type, category } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 0;
        
        if (projectId && projectId !== 'all') {
            whereClause += ` AND project_id = $${++paramCount}`;
            params.push(projectId);
        }
        
        if (startDate) {
            whereClause += ` AND event_date >= $${++paramCount}`;
            params.push(startDate);
        }
        
        if (endDate) {
            whereClause += ` AND event_date <= $${++paramCount}`;
            params.push(endDate);
        }
        
        if (type) {
            whereClause += ` AND type = $${++paramCount}`;
            params.push(type);
        }
        
        if (category) {
            whereClause += ` AND category = $${++paramCount}`;
            params.push(category);
        }
        
        const eventsQuery = `
            SELECT 
                ce.*,
                p.project_name as project_name,
                (u.first_name || ' ' || u.last_name) as created_by_name
            FROM calendar_events ce
            LEFT JOIN projects p ON ce.project_id = p.id
            LEFT JOIN users u ON ce.created_by = u.id
            ${whereClause}
            ORDER BY ce.event_date ASC, ce.title ASC
        `;
        
        const events = await query(eventsQuery, params);
        
        res.json({
            success: true,
            data: events.rows
        });
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch calendar events'
        });
    }
};

const createCalendarEvent = async (req, res) => {
    try {
        const { projectId } = req.params;
        const {
            type, title, description, eventDate, endDate, allDay,
            location, referenceTable, referenceId, category, priority
        } = req.body;
        const userId = req.user.id;
        
        const insertQuery = `
            INSERT INTO calendar_events (
                project_id, type, title, description, event_date, end_date,
                all_day, location, reference_table, reference_id, category,
                priority, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;
        
        const result = await query(insertQuery, [
            projectId, type, title, description, eventDate, endDate,
            allDay, location, referenceTable, referenceId, category,
            priority, userId
        ]);
        
        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create calendar event'
        });
    }
};

// Guidance Notifications Management
const getGuidanceNotifications = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const { includeRead = false } = req.query;
        
        let whereClause = 'WHERE gn.user_id = $1';
        const params = [userId];
        let paramCount = 1;
        
        if (projectId && projectId !== 'all') {
            whereClause += ` AND gn.project_id = $${++paramCount}`;
            params.push(projectId);
        }
        
        if (!includeRead) {
            whereClause += ` AND gn.is_read = FALSE`;
        }
        
        whereClause += ` AND (gn.expires_at IS NULL OR gn.expires_at > CURRENT_TIMESTAMP)`;
        
        const notificationsQuery = `
            SELECT 
                gn.*,
                p.project_name as project_name
            FROM guidance_notifications gn
            LEFT JOIN projects p ON gn.project_id = p.id
            ${whereClause}
            ORDER BY gn.priority DESC, gn.created_at DESC
        `;
        
        const notifications = await query(notificationsQuery, params);
        
        res.json({
            success: true,
            data: notifications.rows
        });
    } catch (error) {
        console.error('Error fetching guidance notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch guidance notifications'
        });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const updateQuery = `
            UPDATE guidance_notifications 
            SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        
        const result = await query(updateQuery, [notificationId, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read'
        });
    }
};

const dismissNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const updateQuery = `
            UPDATE guidance_notifications 
            SET is_dismissed = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        
        const result = await query(updateQuery, [notificationId, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error dismissing notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to dismiss notification'
        });
    }
};

// Meeting Agendas Management
const getMeetingAgendas = async (req, res) => {
    try {
        const { gateMeetingId } = req.params;
        
        const agendasQuery = `
            SELECT 
                ma.*,
                creator.name as created_by_name,
                finalizer.name as finalized_by_name
            FROM meeting_agendas ma
            LEFT JOIN users creator ON ma.created_by = creator.id
            LEFT JOIN users finalizer ON ma.finalized_by = finalizer.id
            WHERE ma.gate_meeting_id = $1
            ORDER BY ma.created_at DESC
        `;
        
        const agendas = await query(agendasQuery, [gateMeetingId]);
        
        // Get agenda items for each agenda
        for (let agenda of agendas.rows) {
            const itemsQuery = `
                SELECT * FROM agenda_items 
                WHERE agenda_id = $1 
                ORDER BY item_order ASC
            `;
            const items = await query(itemsQuery, [agenda.id]);
            agenda.items = items.rows;
        }
        
        res.json({
            success: true,
            data: agendas.rows
        });
    } catch (error) {
        console.error('Error fetching meeting agendas:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch meeting agendas'
        });
    }
};

const createMeetingAgenda = async (req, res) => {
    try {
        const { gateMeetingId } = req.params;
        const { title, description, agendaItems, templateUsed } = req.body;
        const userId = req.user.id;
        
        await query('BEGIN');
        
        try {
            // Create agenda
            const agendaQuery = `
                INSERT INTO meeting_agendas (
                    gate_meeting_id, title, description, template_used, created_by
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            
            const agendaResult = await query(agendaQuery, [
                gateMeetingId, title, description, templateUsed, userId
            ]);
            
            const agenda = agendaResult.rows[0];
            
            // Create agenda items
            if (agendaItems && agendaItems.length > 0) {
                for (let i = 0; i < agendaItems.length; i++) {
                    const item = agendaItems[i];
                    const itemQuery = `
                        INSERT INTO agenda_items (
                            agenda_id, item_order, title, description, presenter,
                            duration_minutes, item_type
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `;
                    
                    await query(itemQuery, [
                        agenda.id, i + 1, item.title, item.description,
                        item.presenter, item.duration_minutes || 15, item.item_type || 'discussion'
                    ]);
                }
            }
            
            await query('COMMIT');
            
            res.status(201).json({
                success: true,
                data: agenda
            });
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error creating meeting agenda:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create meeting agenda'
        });
    }
};

// Workflow States Management
const getProjectWorkflowState = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const stateQuery = `
            SELECT 
                pws.*,
                (u.first_name || ' ' || u.last_name) as entered_by_name,
                (assignee.first_name || ' ' || assignee.last_name) as next_action_assignee_name
            FROM project_workflow_states pws
            LEFT JOIN users u ON pws.entered_by = u.id
            LEFT JOIN users assignee ON pws.next_action_assignee = assignee.id
            WHERE pws.project_id = $1 AND pws.is_current = TRUE
        `;
        
        const result = await query(stateQuery, [projectId]);
        
        res.json({
            success: true,
            data: result.rows[0] || null
        });
    } catch (error) {
        console.error('Error fetching project workflow state:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch project workflow state'
        });
    }
};

const updateProjectWorkflowState = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { 
            currentState, nextRequiredAction, nextActionDueDate, 
            nextActionAssignee, stateMetadata 
        } = req.body;
        const userId = req.user.id;
        
        await query('BEGIN');
        
        try {
            // Get current state
            const currentStateQuery = `
                SELECT current_state FROM project_workflow_states 
                WHERE project_id = $1 AND is_current = TRUE
            `;
            const currentResult = await query(currentStateQuery, [projectId]);
            const previousState = currentResult.rows[0]?.current_state || null;
            
            // Set current state to false
            await query(
                'UPDATE project_workflow_states SET is_current = FALSE WHERE project_id = $1',
                [projectId]
            );
            
            // Insert new state
            const insertQuery = `
                INSERT INTO project_workflow_states (
                    project_id, current_state, previous_state, entered_by,
                    next_required_action, next_action_due_date, next_action_assignee,
                    state_metadata, is_current
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
                RETURNING *
            `;
            
            const result = await query(insertQuery, [
                projectId, currentState, previousState, userId,
                nextRequiredAction, nextActionDueDate, nextActionAssignee,
                JSON.stringify(stateMetadata || {})
            ]);
            
            await query('COMMIT');
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error updating project workflow state:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update project workflow state'
        });
    }
};

// Utility Functions
const generateVersionDiff = (currentData, compareData) => {
    const differences = [];
    const allKeys = new Set([...Object.keys(currentData), ...Object.keys(compareData)]);
    
    for (const key of allKeys) {
        const currentValue = currentData[key];
        const compareValue = compareData[key];
        
        if (currentValue !== compareValue) {
            let changeType = 'modified';
            if (currentValue === undefined) changeType = 'added';
            if (compareValue === undefined) changeType = 'removed';
            
            differences.push({
                field: key,
                fieldLabel: formatFieldLabel(key),
                oldValue: compareValue,
                newValue: currentValue,
                changeType
            });
        }
    }
    
    return differences;
};

const formatFieldLabel = (fieldName) => {
    return fieldName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ');
};

const generateApprovalNotification = async (projectId, versionId) => {
    try {
        // Get project managers and directors who can approve
        const approversQuery = `
            SELECT DISTINCT u.id
            FROM users u
            WHERE u.role IN ('SPM', 'Director', 'Admin')
        `;
        
        const approvers = await query(approversQuery);
        
        for (const approver of approvers.rows) {
            await query(`
                INSERT INTO guidance_notifications (
                    project_id, user_id, type, priority, title, message, action_url, action_label
                ) VALUES ($1, $2, 'approval_needed', 'high', 
                         'Project Version Approval Required',
                         'A new project version has been submitted and requires your approval.',
                         '/projects/' || $1 || '/versions/' || $3,
                         'Review & Approve')
            `, [projectId, approver.id, versionId]);
        }
    } catch (error) {
        console.error('Error generating approval notification:', error);
    }
};

module.exports = {
    // Project Versions
    getProjectVersions,
    createProjectVersion,
    submitVersionForApproval,
    approveVersion,
    rejectVersion,
    compareVersions,
    
    // Calendar Events
    getCalendarEvents,
    createCalendarEvent,
    
    // Guidance Notifications
    getGuidanceNotifications,
    markNotificationRead,
    dismissNotification,
    
    // Meeting Agendas
    getMeetingAgendas,
    createMeetingAgenda,
    
    // Workflow States
    getProjectWorkflowState,
    updateProjectWorkflowState
};

