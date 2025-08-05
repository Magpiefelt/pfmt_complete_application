const express = require('express');
const router = express.Router();
const { query, transaction, setUserContext } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

// Migration status tracking
let migrationStatus = {
    inProgress: false,
    completed: false,
    errors: [],
    progress: 0,
    totalRecords: 0,
    processedRecords: 0,
    startTime: null,
    endTime: null
};

// Get migration status
router.get('/status', (req, res) => {
    res.json({
        success: true,
        data: migrationStatus
    });
});

// Start migration from LowDB JSON files to PostgreSQL
router.post('/start', async (req, res) => {
    try {
        if (migrationStatus.inProgress) {
            return res.status(400).json({
                success: false,
                error: 'Migration already in progress'
            });
        }

        const { dataPath, userId } = req.body;
        
        if (!dataPath) {
            return res.status(400).json({
                success: false,
                error: 'Data path is required'
            });
        }

        // Reset migration status
        migrationStatus = {
            inProgress: true,
            completed: false,
            errors: [],
            progress: 0,
            totalRecords: 0,
            processedRecords: 0,
            startTime: new Date(),
            endTime: null
        };

        // Start migration process asynchronously
        performMigration(dataPath, userId).catch(error => {
            console.error('Migration failed:', error);
            migrationStatus.inProgress = false;
            migrationStatus.errors.push(error.message);
        });

        res.json({
            success: true,
            message: 'Migration started',
            data: migrationStatus
        });
    } catch (error) {
        console.error('Error starting migration:', error);
        migrationStatus.inProgress = false;
        migrationStatus.errors.push(error.message);
        
        res.status(500).json({
            success: false,
            error: 'Failed to start migration',
            message: error.message
        });
    }
});

// Perform the actual migration
async function performMigration(dataPath, userId) {
    try {
        await setUserContext(userId);

        // Read LowDB data files
        const projectsData = await readJSONFile(path.join(dataPath, 'projects.json'));
        const usersData = await readJSONFile(path.join(dataPath, 'users.json'));
        const companiesData = await readJSONFile(path.join(dataPath, 'companies.json'));
        const vendorsData = await readJSONFile(path.join(dataPath, 'vendors.json'));

        // Calculate total records
        migrationStatus.totalRecords = 
            (projectsData?.length || 0) + 
            (usersData?.length || 0) + 
            (companiesData?.length || 0) + 
            (vendorsData?.length || 0);

        // Migrate data in transaction
        await transaction(async (client) => {
            // Migrate users first (referenced by other tables)
            if (usersData && usersData.length > 0) {
                await migrateUsers(client, usersData);
            }

            // Migrate companies
            if (companiesData && companiesData.length > 0) {
                await migrateCompanies(client, companiesData);
            }

            // Migrate vendors
            if (vendorsData && vendorsData.length > 0) {
                await migrateVendors(client, vendorsData);
            }

            // Migrate projects (references users, companies, vendors)
            if (projectsData && projectsData.length > 0) {
                await migrateProjects(client, projectsData);
            }
        });

        migrationStatus.inProgress = false;
        migrationStatus.completed = true;
        migrationStatus.endTime = new Date();
        migrationStatus.progress = 100;

        console.log('Migration completed successfully');
    } catch (error) {
        migrationStatus.inProgress = false;
        migrationStatus.errors.push(error.message);
        throw error;
    }
}

// Helper function to read JSON files
async function readJSONFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.warn(`Could not read file ${filePath}:`, error.message);
        return null;
    }
}

// Migrate users
async function migrateUsers(client, users) {
    for (const user of users) {
        try {
            const queryText = `
                INSERT INTO users (
                    id, username, email, first_name, last_name, role,
                    password_hash, is_active, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                ) ON CONFLICT (id) DO UPDATE SET
                    username = EXCLUDED.username,
                    email = EXCLUDED.email,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    role = EXCLUDED.role,
                    updated_at = CURRENT_TIMESTAMP
            `;

            const values = [
                user.id || uuidv4(),
                user.username,
                user.email,
                user.firstName || user.first_name,
                user.lastName || user.last_name,
                user.role || 'user',
                user.passwordHash || user.password_hash || '$2a$10$defaulthash',
                user.isActive !== false,
                user.createdAt || user.created_at || new Date(),
                new Date()
            ];

            await client.query(queryText, values);
            migrationStatus.processedRecords++;
            migrationStatus.progress = Math.round((migrationStatus.processedRecords / migrationStatus.totalRecords) * 100);
        } catch (error) {
            console.error('Error migrating user:', user, error);
            migrationStatus.errors.push(`User migration error: ${error.message}`);
        }
    }
}

// Migrate companies
async function migrateCompanies(client, companies) {
    for (const company of companies) {
        try {
            const queryText = `
                INSERT INTO companies (
                    id, name, description, industry, size, location,
                    contact_email, contact_phone, website, status,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                ) ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    industry = EXCLUDED.industry,
                    size = EXCLUDED.size,
                    location = EXCLUDED.location,
                    contact_email = EXCLUDED.contact_email,
                    contact_phone = EXCLUDED.contact_phone,
                    website = EXCLUDED.website,
                    status = EXCLUDED.status,
                    updated_at = CURRENT_TIMESTAMP
            `;

            const values = [
                company.id || uuidv4(),
                company.name,
                company.description,
                company.industry,
                company.size,
                company.location,
                company.contactEmail || company.contact_email,
                company.contactPhone || company.contact_phone,
                company.website,
                company.status || 'active',
                company.createdAt || company.created_at || new Date(),
                new Date()
            ];

            await client.query(queryText, values);
            migrationStatus.processedRecords++;
            migrationStatus.progress = Math.round((migrationStatus.processedRecords / migrationStatus.totalRecords) * 100);
        } catch (error) {
            console.error('Error migrating company:', company, error);
            migrationStatus.errors.push(`Company migration error: ${error.message}`);
        }
    }
}

// Migrate vendors
async function migrateVendors(client, vendors) {
    for (const vendor of vendors) {
        try {
            const queryText = `
                INSERT INTO vendors (
                    id, name, description, capabilities, contact_email,
                    contact_phone, website, address, certification_level,
                    performance_rating, status, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                ) ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    capabilities = EXCLUDED.capabilities,
                    contact_email = EXCLUDED.contact_email,
                    contact_phone = EXCLUDED.contact_phone,
                    website = EXCLUDED.website,
                    address = EXCLUDED.address,
                    certification_level = EXCLUDED.certification_level,
                    performance_rating = EXCLUDED.performance_rating,
                    status = EXCLUDED.status,
                    updated_at = CURRENT_TIMESTAMP
            `;

            const values = [
                vendor.id || uuidv4(),
                vendor.name,
                vendor.description,
                Array.isArray(vendor.capabilities) ? vendor.capabilities.join(', ') : vendor.capabilities,
                vendor.contactEmail || vendor.contact_email,
                vendor.contactPhone || vendor.contact_phone,
                vendor.website,
                vendor.address,
                vendor.certificationLevel || vendor.certification_level,
                vendor.performanceRating || vendor.performance_rating,
                vendor.status || 'active',
                vendor.createdAt || vendor.created_at || new Date(),
                new Date()
            ];

            await client.query(queryText, values);
            migrationStatus.processedRecords++;
            migrationStatus.progress = Math.round((migrationStatus.processedRecords / migrationStatus.totalRecords) * 100);
        } catch (error) {
            console.error('Error migrating vendor:', vendor, error);
            migrationStatus.errors.push(`Vendor migration error: ${error.message}`);
        }
    }
}

// Migrate projects
async function migrateProjects(client, projects) {
    for (const project of projects) {
        try {
            // Insert main project record
            const projectQueryText = `
                INSERT INTO projects (
                    id, report_status, project_status, project_phase,
                    project_name, cpd_number, project_category,
                    project_type, delivery_type, delivery_method,
                    program, geographic_region, project_description,
                    approval_year, funded_to_complete,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
                ) ON CONFLICT (id) DO UPDATE SET
                    report_status = EXCLUDED.report_status,
                    project_status = EXCLUDED.project_status,
                    project_phase = EXCLUDED.project_phase,
                    project_name = EXCLUDED.project_name,
                    cpd_number = EXCLUDED.cpd_number,
                    project_category = EXCLUDED.project_category,
                    project_type = EXCLUDED.project_type,
                    delivery_type = EXCLUDED.delivery_type,
                    delivery_method = EXCLUDED.delivery_method,
                    program = EXCLUDED.program,
                    geographic_region = EXCLUDED.geographic_region,
                    project_description = EXCLUDED.project_description,
                    approval_year = EXCLUDED.approval_year,
                    funded_to_complete = EXCLUDED.funded_to_complete,
                    updated_at = CURRENT_TIMESTAMP
            `;

            const projectValues = [
                project.id || uuidv4(),
                project.reportStatus || project.report_status || 'update_required',
                project.projectStatus || project.project_status,
                project.projectPhase || project.project_phase,
                project.projectName || project.project_name,
                project.cpdNumber || project.cpd_number,
                project.projectCategory || project.project_category,
                project.projectType || project.project_type,
                project.deliveryType || project.delivery_type,
                project.deliveryMethod || project.delivery_method,
                project.program,
                project.geographicRegion || project.geographic_region,
                project.projectDescription || project.project_description,
                project.approvalYear || project.approval_year,
                project.fundedToComplete || project.funded_to_complete,
                project.createdAt || project.created_at || new Date(),
                new Date()
            ];

            await client.query(projectQueryText, projectValues);

            // Migrate project location if exists
            if (project.location) {
                const locationQueryText = `
                    INSERT INTO project_locations (
                        id, project_id, location, municipality, project_address,
                        constituency, building_name, building_type,
                        latitude, longitude
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                    ) ON CONFLICT (project_id) DO UPDATE SET
                        location = EXCLUDED.location,
                        municipality = EXCLUDED.municipality,
                        project_address = EXCLUDED.project_address,
                        constituency = EXCLUDED.constituency,
                        building_name = EXCLUDED.building_name,
                        building_type = EXCLUDED.building_type,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude
                `;

                const locationValues = [
                    uuidv4(),
                    project.id,
                    project.location.location,
                    project.location.municipality,
                    project.location.projectAddress || project.location.project_address,
                    project.location.constituency,
                    project.location.buildingName || project.location.building_name,
                    project.location.buildingType || project.location.building_type,
                    project.location.latitude,
                    project.location.longitude
                ];

                await client.query(locationQueryText, locationValues);
            }

            // Migrate project team if exists
            if (project.team) {
                const teamQueryText = `
                    INSERT INTO project_teams (
                        id, project_id, executive_director_id, director_id,
                        sr_project_manager_id, project_manager_id,
                        project_coordinator_id, contract_services_analyst_id,
                        program_integration_analyst_id
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9
                    ) ON CONFLICT (project_id) DO UPDATE SET
                        executive_director_id = EXCLUDED.executive_director_id,
                        director_id = EXCLUDED.director_id,
                        sr_project_manager_id = EXCLUDED.sr_project_manager_id,
                        project_manager_id = EXCLUDED.project_manager_id,
                        project_coordinator_id = EXCLUDED.project_coordinator_id,
                        contract_services_analyst_id = EXCLUDED.contract_services_analyst_id,
                        program_integration_analyst_id = EXCLUDED.program_integration_analyst_id
                `;

                const teamValues = [
                    uuidv4(),
                    project.id,
                    project.team.executiveDirectorId || project.team.executive_director_id,
                    project.team.directorId || project.team.director_id,
                    project.team.srProjectManagerId || project.team.sr_project_manager_id,
                    project.team.projectManagerId || project.team.project_manager_id,
                    project.team.projectCoordinatorId || project.team.project_coordinator_id,
                    project.team.contractServicesAnalystId || project.team.contract_services_analyst_id,
                    project.team.programIntegrationAnalystId || project.team.program_integration_analyst_id
                ];

                await client.query(teamQueryText, teamValues);
            }

            migrationStatus.processedRecords++;
            migrationStatus.progress = Math.round((migrationStatus.processedRecords / migrationStatus.totalRecords) * 100);
        } catch (error) {
            console.error('Error migrating project:', project, error);
            migrationStatus.errors.push(`Project migration error: ${error.message}`);
        }
    }
}

// Reset migration status
router.post('/reset', (req, res) => {
    migrationStatus = {
        inProgress: false,
        completed: false,
        errors: [],
        progress: 0,
        totalRecords: 0,
        processedRecords: 0,
        startTime: null,
        endTime: null
    };

    res.json({
        success: true,
        message: 'Migration status reset',
        data: migrationStatus
    });
});

module.exports = router;

