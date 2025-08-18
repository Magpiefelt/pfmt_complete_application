const request = require('supertest');
const { Pool } = require('pg');
const app = require('../app');

// Test database configuration
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pfmt_integrated_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const testPool = new Pool(testDbConfig);

describe('Workflow E2E Tests', () => {
  let testProjectId;
  let testUserId = '550e8400-e29b-41d4-a716-446655440002';
  let pmUserId = '550e8400-e29b-41d4-a716-446655440003';
  let spmUserId = '550e8400-e29b-41d4-a716-446655440004';
  let directorUserId = '550e8400-e29b-41d4-a716-446655440005';

  beforeAll(async () => {
    // Setup test users
    await testPool.query(`
      INSERT INTO users (id, username, email, first_name, last_name, role, password_hash, is_active)
      VALUES 
        ($1, 'testuser', 'test@gov.ab.ca', 'Test', 'User', 'pmi', '$2b$10$test', true),
        ($2, 'testpm', 'pm@gov.ab.ca', 'Test', 'PM', 'pm', '$2b$10$test', true),
        ($3, 'testspm', 'spm@gov.ab.ca', 'Test', 'SPM', 'spm', '$2b$10$test', true),
        ($4, 'testdirector', 'director@gov.ab.ca', 'Test', 'Director', 'director', '$2b$10$test', true)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        role = EXCLUDED.role
    `, [testUserId, pmUserId, spmUserId, directorUserId]);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testProjectId) {
      await testPool.query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    }
    await testPool.query('DELETE FROM users WHERE id IN ($1, $2, $3, $4)', 
      [testUserId, pmUserId, spmUserId, directorUserId]);
    await testPool.end();
  });

  describe('Complete Workflow: PMI → Director → PM/SPM', () => {
    it('should complete the full dual-wizard workflow', async () => {
      // Step 1: PMI creates project initiation
      const initiationResponse = await request(app)
        .post('/api/projects/workflow/initiate')
        .set('x-user-id', testUserId)
        .set('x-user-name', 'Test User')
        .send({
          name: 'Test Workflow Project',
          description: 'A test project for the dual-wizard workflow',
          estimated_budget: 500000,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          project_type: 'Infrastructure',
          delivery_method: 'Design-Build',
          project_category: 'Transportation',
          geographic_region: 'Central Alberta'
        });

      expect(initiationResponse.status).toBe(201);
      expect(initiationResponse.body.success).toBe(true);
      expect(initiationResponse.body.data.project_id).toBeDefined();
      
      testProjectId = initiationResponse.body.data.project_id;

      // Verify project was created with correct workflow status
      const projectCheck1 = await testPool.query(
        'SELECT workflow_status, lifecycle_status FROM projects WHERE id = $1',
        [testProjectId]
      );
      expect(projectCheck1.rows[0].workflow_status).toBe('initiated');
      expect(projectCheck1.rows[0].lifecycle_status).toBe('planning');

      // Step 2: Director assigns team
      const assignmentResponse = await request(app)
        .post(`/api/projects/${testProjectId}/workflow/assign`)
        .set('x-user-id', directorUserId)
        .set('x-user-name', 'Test Director')
        .send({
          assigned_pm: pmUserId,
          assigned_spm: spmUserId
        });

      expect(assignmentResponse.status).toBe(200);
      expect(assignmentResponse.body.success).toBe(true);

      // Verify project status updated
      const projectCheck2 = await testPool.query(
        'SELECT workflow_status, assigned_pm, assigned_spm FROM projects WHERE id = $1',
        [testProjectId]
      );
      expect(projectCheck2.rows[0].workflow_status).toBe('assigned');
      expect(projectCheck2.rows[0].assigned_pm).toBe(pmUserId);
      expect(projectCheck2.rows[0].assigned_spm).toBe(spmUserId);

      // Step 3: PM/SPM finalizes project
      const finalizationResponse = await request(app)
        .post(`/api/projects/${testProjectId}/workflow/finalize`)
        .set('x-user-id', pmUserId)
        .set('x-user-name', 'Test PM')
        .send({
          detailed_description: 'Detailed project description for finalization',
          risk_assessment: 'Low risk project with standard procedures',
          budget_breakdown: {
            construction: 300000,
            design: 100000,
            contingency: 100000
          },
          vendors: [
            {
              vendor_id: 'vendor-1',
              role: 'General Contractor',
              notes: 'Primary construction vendor'
            }
          ],
          milestone: {
            title: 'Project Completion',
            type: 'Major Milestone',
            planned_start: '2024-01-15',
            planned_finish: '2024-11-30'
          }
        });

      expect(finalizationResponse.status).toBe(200);
      expect(finalizationResponse.body.success).toBe(true);

      // Verify final project status
      const projectCheck3 = await testPool.query(
        'SELECT workflow_status, lifecycle_status, finalized_by, finalized_at FROM projects WHERE id = $1',
        [testProjectId]
      );
      expect(projectCheck3.rows[0].workflow_status).toBe('finalized');
      expect(projectCheck3.rows[0].lifecycle_status).toBe('active');
      expect(projectCheck3.rows[0].finalized_by).toBe(pmUserId);
      expect(projectCheck3.rows[0].finalized_at).toBeTruthy();
    });
  });

  describe('Workflow Status Validation', () => {
    let validationProjectId;

    beforeEach(async () => {
      // Create a test project for validation tests
      const result = await testPool.query(`
        INSERT INTO projects (
          id, project_name, project_description, workflow_status, lifecycle_status,
          created_by, created_at, updated_at, workflow_updated_at
        ) VALUES (
          gen_random_uuid(), 'Validation Test Project', 'Test project for validation',
          'initiated', 'planning', $1, NOW(), NOW(), NOW()
        ) RETURNING id
      `, [testUserId]);
      
      validationProjectId = result.rows[0].id;
    });

    afterEach(async () => {
      if (validationProjectId) {
        await testPool.query('DELETE FROM projects WHERE id = $1', [validationProjectId]);
      }
    });

    it('should prevent assignment by non-director users', async () => {
      const response = await request(app)
        .post(`/api/projects/${validationProjectId}/workflow/assign`)
        .set('x-user-id', pmUserId) // PM trying to assign (should fail)
        .set('x-user-name', 'Test PM')
        .send({
          assigned_pm: pmUserId,
          assigned_spm: spmUserId
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only directors can assign teams');
    });

    it('should prevent finalization of non-assigned projects', async () => {
      const response = await request(app)
        .post(`/api/projects/${validationProjectId}/workflow/finalize`)
        .set('x-user-id', pmUserId)
        .set('x-user-name', 'Test PM')
        .send({
          detailed_description: 'Test description'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Project must be assigned before finalization');
    });

    it('should prevent finalization by non-assigned users', async () => {
      // First assign the project
      await testPool.query(
        'UPDATE projects SET workflow_status = $1, assigned_pm = $2 WHERE id = $3',
        ['assigned', pmUserId, validationProjectId]
      );

      // Try to finalize with different user
      const response = await request(app)
        .post(`/api/projects/${validationProjectId}/workflow/finalize`)
        .set('x-user-id', spmUserId) // Different user than assigned PM
        .set('x-user-name', 'Test SPM')
        .send({
          detailed_description: 'Test description'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only assigned PM/SPM can finalize');
    });
  });

  describe('API Response Format', () => {
    it('should return consistent response format for initiation', async () => {
      const response = await request(app)
        .post('/api/projects/workflow/initiate')
        .set('x-user-id', testUserId)
        .set('x-user-name', 'Test User')
        .send({
          name: 'API Format Test Project',
          description: 'Testing API response format'
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('project_id');
      expect(response.body.data).toHaveProperty('workflow_status');
      expect(response.body.data.workflow_status).toBe('initiated');

      // Cleanup
      await testPool.query('DELETE FROM projects WHERE id = $1', [response.body.data.project_id]);
    });

    it('should include lifecycle_status in project reads', async () => {
      // Create a test project
      const createResponse = await request(app)
        .post('/api/projects/workflow/initiate')
        .set('x-user-id', testUserId)
        .set('x-user-name', 'Test User')
        .send({
          name: 'Lifecycle Status Test',
          description: 'Testing lifecycle status inclusion'
        });

      const projectId = createResponse.body.data.project_id;

      // Read the project
      const readResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('x-user-id', testUserId)
        .set('x-user-name', 'Test User');

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data).toHaveProperty('workflow_status');
      expect(readResponse.body.data).toHaveProperty('lifecycle_status');
      expect(readResponse.body.data.lifecycle_status).toBe('planning');

      // Cleanup
      await testPool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project ID gracefully', async () => {
      const response = await request(app)
        .post('/api/projects/invalid-id/workflow/assign')
        .set('x-user-id', directorUserId)
        .set('x-user-name', 'Test Director')
        .send({
          assigned_pm: pmUserId
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Project not found');
    });

    it('should validate required fields for initiation', async () => {
      const response = await request(app)
        .post('/api/projects/workflow/initiate')
        .set('x-user-id', testUserId)
        .set('x-user-name', 'Test User')
        .send({
          // Missing required name and description
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should validate required fields for assignment', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/workflow/assign`)
        .set('x-user-id', directorUserId)
        .set('x-user-name', 'Test Director')
        .send({
          // Missing required assigned_pm
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('assigned_pm is required');
    });
  });

  describe('Database Consistency', () => {
    it('should maintain referential integrity', async () => {
      // This test ensures that workflow operations maintain database consistency
      const response = await request(app)
        .post('/api/projects/workflow/initiate')
        .set('x-user-id', testUserId)
        .set('x-user-name', 'Test User')
        .send({
          name: 'Integrity Test Project',
          description: 'Testing database integrity'
        });

      const projectId = response.body.data.project_id;

      // Verify all required fields are set
      const projectData = await testPool.query(`
        SELECT 
          id, project_name, project_description, workflow_status, lifecycle_status,
          created_by, created_at, updated_at, workflow_updated_at
        FROM projects 
        WHERE id = $1
      `, [projectId]);

      const project = projectData.rows[0];
      expect(project.id).toBeTruthy();
      expect(project.project_name).toBe('Integrity Test Project');
      expect(project.workflow_status).toBe('initiated');
      expect(project.lifecycle_status).toBe('planning');
      expect(project.created_by).toBe(testUserId);
      expect(project.created_at).toBeTruthy();
      expect(project.updated_at).toBeTruthy();
      expect(project.workflow_updated_at).toBeTruthy();

      // Cleanup
      await testPool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    });
  });
});

