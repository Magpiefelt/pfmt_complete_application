const { query, transaction, setUserContext } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Project {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.reportStatus = data.reportStatus || 'update_required';
        this.projectStatus = data.projectStatus;
        this.projectPhase = data.projectPhase;
        this.modifiedBy = data.modifiedBy;
        this.modifiedDate = data.modifiedDate || new Date();
        this.reportingAsOfDate = data.reportingAsOfDate;
        this.directorReviewDate = data.directorReviewDate;
        this.pfmtDataDate = data.pfmtDataDate;
        this.archivedDate = data.archivedDate;
        
        // Project Details
        this.projectName = data.projectName;
        this.capitalPlanLineId = data.capitalPlanLineId;
        this.approvalYear = data.approvalYear;
        this.cpdNumber = data.cpdNumber;
        this.projectCategory = data.projectCategory;
        this.fundedToComplete = data.fundedToComplete;
        this.clientMinistryId = data.clientMinistryId;
        this.schoolJurisdictionId = data.schoolJurisdictionId;
        this.pfmtFileId = data.pfmtFileId;
        this.projectType = data.projectType;
        this.deliveryType = data.deliveryType;
        this.specificDeliveryType = data.specificDeliveryType;
        this.deliveryMethod = data.deliveryMethod;
        this.program = data.program;
        this.geographicRegion = data.geographicRegion;
        this.projectDescription = data.projectDescription;
        
        // Facility-specific fields
        this.numberOfBeds = data.numberOfBeds;
        this.totalOpeningCapacity = data.totalOpeningCapacity;
        this.capacityAtFullBuildOut = data.capacityAtFullBuildOut;
        this.isCharterSchool = data.isCharterSchool || false;
        this.gradesFrom = data.gradesFrom;
        this.gradesTo = data.gradesTo;
        this.squareMeters = data.squareMeters;
        this.numberOfJobs = data.numberOfJobs;
        
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    // Map a DB row (snake_case) to a Project instance (camelCase)
    static fromDb(row = {}) {
        if (!row) return null;
        const mapped = {
            id: row.id,
            reportStatus: row.report_status,
            projectStatus: row.project_status,
            projectPhase: row.project_phase,
            workflowStatus: row.workflow_status,
            lifecycleStatus: row.lifecycle_status,
            modifiedBy: row.modified_by,
            modifiedDate: row.modified_date || row.updated_at,
            reportingAsOfDate: row.reporting_as_of_date,
            directorReviewDate: row.director_review_date,
            pfmtDataDate: row.pfmt_data_date,
            archivedDate: row.archived_date,
            projectName: row.project_name,
            capitalPlanLineId: row.capital_plan_line_id,
            approvalYear: row.approval_year,
            cpdNumber: row.cpd_number,
            projectCategory: row.project_category,
            fundedToComplete: row.funded_to_complete,
            clientMinistryId: row.client_ministry_id,
            schoolJurisdictionId: row.school_jurisdiction_id,
            pfmtFileId: row.pfmt_file_id,
            projectType: row.project_type,
            deliveryType: row.delivery_type,
            specificDeliveryType: row.specific_delivery_type,
            deliveryMethod: row.delivery_method,
            program: row.program,
            geographicRegion: row.geographic_region,
            projectDescription: row.project_description,
            numberOfBeds: row.number_of_beds,
            totalOpeningCapacity: row.total_opening_capacity,
            capacityAtFullBuildOut: row.capacity_at_full_build_out,
            isCharterSchool: row.is_charter_school,
            gradesFrom: row.grades_from,
            gradesTo: row.grades_to,
            squareMeters: row.square_meters,
            numberOfJobs: row.number_of_jobs,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
        return new Project(mapped);
    }

    // Get all projects with related data
    static async findAll(options = {}) {
        const { 
            limit = 50, 
            offset = 0, 
            status, 
            phase, 
            search,
            program,
            region,
            ownerId,
            userId,
            userRole,
            reportStatus,
            approvedOnly,
            includePendingDrafts,
            includeVersions
        } = options;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            whereClause += ` AND p.project_status = $${paramCount}`;
            params.push(status);
        }

        if (phase) {
            paramCount++;
            whereClause += ` AND p.project_phase = $${paramCount}`;
            params.push(phase);
        }

        if (search) {
            paramCount++;
            whereClause += ` AND (p.project_name ILIKE $${paramCount} OR p.cpd_number ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (program) {
            paramCount++;
            whereClause += ` AND p.program = $${paramCount}`;
            params.push(program);
        }

        if (region) {
            paramCount++;
            whereClause += ` AND p.geographic_region = $${paramCount}`;
            params.push(region);
        }

        if (reportStatus) {
            paramCount++;
            whereClause += ` AND p.report_status = $${paramCount}`;
            params.push(reportStatus);
        }

        // Handle approvedOnly filter
        if (approvedOnly === true) {
            paramCount++;
            whereClause += ` AND p.report_status = $${paramCount}`;
            params.push('approved');
        }

        // Handle includePendingDrafts filter
        if (includePendingDrafts === false) {
            whereClause += ` AND p.report_status NOT IN ('draft', 'update_required')`;
        }

        // User-based filtering for "My Projects"
        if (ownerId || userId) {
            paramCount++;
            // Filter by modified_by field only (UUID comparison)
            // Note: There's no created_by column in the schema, only modified_by
            whereClause += ` AND p.modified_by = $${paramCount}`;
            params.push(ownerId || userId);
        }

        // Role-based filtering
        if (userRole === 'Project Manager' && (ownerId || userId)) {
            // Project Managers see only their projects (already handled above)
        } else if (userRole === 'Director' || userRole === 'Senior Project Manager') {
            // Directors and SPMs see all projects (no additional filtering)
        }

        paramCount++;
        const limitClause = `LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        const offsetClause = `OFFSET $${paramCount}`;
        params.push(offset);

        const queryText = `
            SELECT 
                p.*,
                COALESCE(p.workflow_status, 'initiated') as workflow_status,
                COALESCE(p.lifecycle_status, 'active') as lifecycle_status,
                cpl.name as capital_plan_line_name,
                cm.name as client_ministry_name,
                sj.name as school_jurisdiction_name,
                pf.project_name as pfmt_file_name,
                pl.location,
                pl.municipality,
                pl.building_name,
                pl.building_type,
                u.first_name || ' ' || u.last_name as modified_by_name
            FROM projects p
            LEFT JOIN capital_plan_lines cpl ON p.capital_plan_line_id = cpl.id
            LEFT JOIN client_ministries cm ON p.client_ministry_id = cm.id
            LEFT JOIN school_jurisdictions sj ON p.school_jurisdiction_id = sj.id
            LEFT JOIN pfmt_files pf ON p.pfmt_file_id = pf.id
            LEFT JOIN project_locations pl ON p.id = pl.project_id
            LEFT JOIN users u ON p.modified_by = u.id
            ${whereClause}
            ORDER BY p.created_at DESC
            ${limitClause} ${offsetClause}
        `;

        const result = await query(queryText, params);
        return result.rows.map(row => Project.fromDb(row));
    }

    // Get project by ID with all related data
    static async findById(id) {
        const queryText = `
            SELECT 
                p.*,
                COALESCE(p.workflow_status, 'initiated') as workflow_status,
                COALESCE(p.lifecycle_status, 'active') as lifecycle_status,
                cpl.name as capital_plan_line_name,
                cm.name as client_ministry_name,
                sj.name as school_jurisdiction_name,
                pf.project_name as pfmt_file_name,
                u.first_name || ' ' || u.last_name as modified_by_name
            FROM projects p
            LEFT JOIN capital_plan_lines cpl ON p.capital_plan_line_id = cpl.id
            LEFT JOIN client_ministries cm ON p.client_ministry_id = cm.id
            LEFT JOIN school_jurisdictions sj ON p.school_jurisdiction_id = sj.id
            LEFT JOIN pfmt_files pf ON p.pfmt_file_id = pf.id
            LEFT JOIN users u ON p.modified_by = u.id
            WHERE p.id = $1
        `;

        const result = await query(queryText, [id]);
        if (result.rows.length === 0) {
            return null;
        }

        return Project.fromDb(result.rows[0]);
    }

    // Get project with location and team data
    static async findByIdWithDetails(id) {
        const project = await Project.findById(id);
        if (!project) return null;

        // Get location data
        const locationResult = await query(
            'SELECT * FROM project_locations WHERE project_id = $1',
            [id]
        );
        const loc = locationResult.rows[0];
        project.location = loc
            ? {
                location: loc.location,
                municipality: loc.municipality,
                urbanRural: loc.urban_rural,
                projectAddress: loc.project_address,
                address: loc.project_address, // alias for UI
                constituency: loc.constituency,
                buildingName: loc.building_name,
                buildingType: loc.building_type,
                buildingId: loc.building_id,
                buildingOwner: loc.building_owner,
                mla: loc.mla,
                plan: loc.plan,
                block: loc.block,
                lot: loc.lot,
                latitude: loc.latitude,
                longitude: loc.longitude
            }
            : null;

        // Get team data
        const teamResult = await query(`
            SELECT 
                pt.*,
                ed.first_name || ' ' || ed.last_name as executive_director_name,
                d.first_name || ' ' || d.last_name as director_name,
                spm.first_name || ' ' || spm.last_name as sr_project_manager_name,
                pm.first_name || ' ' || pm.last_name as project_manager_name,
                pc.first_name || ' ' || pc.last_name as project_coordinator_name,
                csa.first_name || ' ' || csa.last_name as contract_services_analyst_name,
                pia.first_name || ' ' || pia.last_name as program_integration_analyst_name
            FROM project_teams pt
            LEFT JOIN users ed ON pt.executive_director_id = ed.id
            LEFT JOIN users d ON pt.director_id = d.id
            LEFT JOIN users spm ON pt.sr_project_manager_id = spm.id
            LEFT JOIN users pm ON pt.project_manager_id = pm.id
            LEFT JOIN users pc ON pt.project_coordinator_id = pc.id
            LEFT JOIN users csa ON pt.contract_services_analyst_id = csa.id
            LEFT JOIN users pia ON pt.program_integration_analyst_id = pia.id
            WHERE pt.project_id = $1
        `, [id]);
        const team = teamResult.rows[0];
        project.team = team
            ? {
                executiveDirectorId: team.executive_director_id,
                executiveDirectorName: team.executive_director_name,
                directorId: team.director_id,
                directorName: team.director_name,
                srProjectManagerId: team.sr_project_manager_id,
                srProjectManagerName: team.sr_project_manager_name,
                projectManagerId: team.project_manager_id,
                projectManagerName: team.project_manager_name,
                projectCoordinatorId: team.project_coordinator_id,
                projectCoordinatorName: team.project_coordinator_name,
                contractServicesAnalystId: team.contract_services_analyst_id,
                contractServicesAnalystName: team.contract_services_analyst_name,
                programIntegrationAnalystId: team.program_integration_analyst_id,
                programIntegrationAnalystName: team.program_integration_analyst_name,
                additionalMembers: team.additional_members,
                historicalMembers: team.historical_members
            }
            : null;

        return project;
    }

    // Create new project with location and team data
    async save(userId) {
        return await transaction(async (client) => {
            // Set user context for audit logging
            await setUserContext(userId);

            // Insert project
            const projectQuery = `
                INSERT INTO projects (
                    id, report_status, project_status, project_phase, modified_by,
                    project_name, capital_plan_line_id, approval_year, cpd_number,
                    project_category, funded_to_complete, client_ministry_id,
                    school_jurisdiction_id, pfmt_file_id, project_type, delivery_type,
                    specific_delivery_type, delivery_method, program, geographic_region,
                    project_description, number_of_beds, total_opening_capacity,
                    capacity_at_full_build_out, is_charter_school, grades_from,
                    grades_to, square_meters, number_of_jobs
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                    $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
                ) RETURNING *
            `;

            const projectValues = [
                this.id, this.reportStatus, this.projectStatus, this.projectPhase,
                userId, this.projectName, this.capitalPlanLineId, this.approvalYear,
                this.cpdNumber, this.projectCategory, this.fundedToComplete,
                this.clientMinistryId, this.schoolJurisdictionId, this.pfmtFileId,
                this.projectType, this.deliveryType, this.specificDeliveryType,
                this.deliveryMethod, this.program, this.geographicRegion,
                this.projectDescription, this.numberOfBeds, this.totalOpeningCapacity,
                this.capacityAtFullBuildOut, this.isCharterSchool, this.gradesFrom,
                this.gradesTo, this.squareMeters, this.numberOfJobs
            ];

            const projectResult = await client.query(projectQuery, projectValues);
            const savedProject = projectResult.rows[0];

            // Insert location if provided
            if (this.location) {
                const locationQuery = `
                    INSERT INTO project_locations (
                        id, project_id, location, municipality, urban_rural,
                        project_address, constituency, building_name, building_type,
                        building_id, building_owner, mla, plan, block, lot,
                        latitude, longitude
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
                    )
                `;

                const locationValues = [
                    uuidv4(), this.id, this.location.location, this.location.municipality,
                    this.location.urbanRural, this.location.projectAddress,
                    this.location.constituency, this.location.buildingName,
                    this.location.buildingType, this.location.buildingId,
                    this.location.buildingOwner, this.location.mla, this.location.plan,
                    this.location.block, this.location.lot, this.location.latitude,
                    this.location.longitude
                ];

                await client.query(locationQuery, locationValues);
            }

            // Insert team if provided
            if (this.team) {
                const teamQuery = `
                    INSERT INTO project_teams (
                        id, project_id, executive_director_id, director_id,
                        sr_project_manager_id, project_manager_id, project_coordinator_id,
                        contract_services_analyst_id, program_integration_analyst_id,
                        additional_members, historical_members
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
                    )
                `;

                const teamValues = [
                    uuidv4(), this.id, this.team.executiveDirectorId,
                    this.team.directorId, this.team.srProjectManagerId,
                    this.team.projectManagerId, this.team.projectCoordinatorId,
                    this.team.contractServicesAnalystId, this.team.programIntegrationAnalystId,
                    this.team.additionalMembers, this.team.historicalMembers
                ];

                await client.query(teamQuery, teamValues);
            }

            return Project.fromDb(savedProject);
        });
    }

    // Update project
    async update(userId, updates) {
        await setUserContext(userId);

        const updateFields = [];
        const values = [];
        let paramCount = 0;

        // Build dynamic update query
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== 'id') {
                paramCount++;
                updateFields.push(`${this.camelToSnake(key)} = $${paramCount}`);
                values.push(updates[key]);
            }
        });

        if (updateFields.length === 0) {
            throw new Error('No fields to update');
        }

        paramCount++;
        values.push(userId); // modified_by
        paramCount++;
        values.push(this.id); // WHERE condition

        const queryText = `
            UPDATE projects 
            SET ${updateFields.join(', ')}, modified_by = $${paramCount - 1}, modified_date = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await query(queryText, values);
        return Project.fromDb(result.rows[0]);
    }

    // Delete project
    static async delete(id, userId) {
        await setUserContext(userId);
        
        const result = await query(
            'DELETE FROM projects WHERE id = $1 RETURNING *',
            [id]
        );

        return result.rowCount > 0;
    }

    // Get project statistics
    static async getStatistics() {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_projects,
                COUNT(CASE WHEN project_status = 'underway' THEN 1 END) as active_projects,
                COUNT(CASE WHEN project_status = 'complete' THEN 1 END) as completed_projects,
                COUNT(CASE WHEN project_status = 'on_hold' THEN 1 END) as on_hold_projects,
                COUNT(CASE WHEN project_status = 'cancelled' THEN 1 END) as cancelled_projects,
                COUNT(CASE WHEN project_phase = 'planning' THEN 1 END) as planning_phase,
                COUNT(CASE WHEN project_phase = 'design' THEN 1 END) as design_phase,
                COUNT(CASE WHEN project_phase = 'construction' THEN 1 END) as construction_phase,
                COUNT(CASE WHEN report_status = 'update_required' THEN 1 END) as pending_updates
            FROM projects
        `;

        const result = await query(statsQuery);
        return result.rows[0];
    }

    // Helper method to convert camelCase to snake_case
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    // Convert to JSON
    toJSON() {
        return {
            id: this.id,
            reportStatus: this.reportStatus,
            projectStatus: this.projectStatus,
            projectPhase: this.projectPhase,
            modifiedBy: this.modifiedBy,
            modifiedDate: this.modifiedDate,
            reportingAsOfDate: this.reportingAsOfDate,
            directorReviewDate: this.directorReviewDate,
            pfmtDataDate: this.pfmtDataDate,
            archivedDate: this.archivedDate,
            projectName: this.projectName,
            capitalPlanLineId: this.capitalPlanLineId,
            approvalYear: this.approvalYear,
            cpdNumber: this.cpdNumber,
            projectCategory: this.projectCategory,
            fundedToComplete: this.fundedToComplete,
            clientMinistryId: this.clientMinistryId,
            schoolJurisdictionId: this.schoolJurisdictionId,
            pfmtFileId: this.pfmtFileId,
            projectType: this.projectType,
            deliveryType: this.deliveryType,
            specificDeliveryType: this.specificDeliveryType,
            deliveryMethod: this.deliveryMethod,
            program: this.program,
            geographicRegion: this.geographicRegion,
            projectDescription: this.projectDescription,
            numberOfBeds: this.numberOfBeds,
            totalOpeningCapacity: this.totalOpeningCapacity,
            capacityAtFullBuildOut: this.capacityAtFullBuildOut,
            isCharterSchool: this.isCharterSchool,
            gradesFrom: this.gradesFrom,
            gradesTo: this.gradesTo,
            squareMeters: this.squareMeters,
            numberOfJobs: this.numberOfJobs,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            location: this.location,
            team: this.team
        };
    }
}

module.exports = Project;

