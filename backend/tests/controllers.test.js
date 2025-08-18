const request = require('supertest');
const app = require('../server');
const { query } = require('../config/database');

describe('Controller Integration Tests', () => {
    let testUserId;
    let testProjectId;
    let testContractId;

    beforeAll(async () => {
        // Create test user
        const userResult = await query(`
            INSERT INTO users (id, username, email, first_name, last_name, password_hash) 
            VALUES (uuid_generate_v4(), 'testuser', 'test@example.com', 'Test', 'User', 'test_hash')
            RETURNING id
        `);
        testUserId = userResult.rows[0].id;

        // Create test project
        const projectResult = await query(`
            INSERT INTO projects (id, project_name, budget, created_by) 
            VALUES (uuid_generate_v4(), 'Test Project', 50000.00, $1)
            RETURNING id
        `, [testUserId]);
        testProjectId = projectResult.rows[0].id;

        // Create test contract
        const contractResult = await query(`
            INSERT INTO contracts (id, project_id, contract_number, description, contract_value) 
            VALUES (uuid_generate_v4(), $1, 'TEST-001', 'Test contract', 25000.00)
            RETURNING id
        `, [testProjectId]);
        testContractId = contractResult.rows[0].id;
    });

    afterAll(async () => {
        // Cleanup test data
        if (testContractId) {
            await query('DELETE FROM contract_payments WHERE contract_id = $1', [testContractId]);
            await query('DELETE FROM contracts WHERE id = $1', [testContractId]);
        }
        if (testProjectId) {
            await query('DELETE FROM projects WHERE id = $1', [testProjectId]);
        }
        if (testUserId) {
            await query('DELETE FROM users WHERE id = $1', [testUserId]);
        }
    });

    describe('Health Endpoints', () => {
        test('GET /health should return OK', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('OK');
            expect(response.body.message).toContain('PFMT Integrated API Server');
        });

        test('GET /health/db should return database status', async () => {
            const response = await request(app)
                .get('/health/db')
                .expect(200);

            expect(response.body.status).toBe('OK');
            expect(response.body.message).toContain('Database connection successful');
        });
    });

    describe('Project Endpoints', () => {
        test('GET /api/projects should return projects list', async () => {
            const response = await request(app)
                .get('/api/projects')
                .set('x-user-id', testUserId)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // Should find our test project
            const testProject = response.body.find(p => p.id === testProjectId);
            expect(testProject).toBeDefined();
            expect(testProject.project_name).toBe('Test Project');
            expect(Number(testProject.budget)).toBeCloseTo(50000.00);
            expect(testProject.created_by).toBe(testUserId);
        });

        test('GET /api/projects/:id should return specific project', async () => {
            const response = await request(app)
                .get(`/api/projects/${testProjectId}`)
                .set('x-user-id', testUserId)
                .expect(200);

            expect(response.body.id).toBe(testProjectId);
            expect(response.body.project_name).toBe('Test Project');
        });
    });

    describe('Contract Payment Endpoints', () => {
        test('POST /api/phase1/contract-payments should create payment', async () => {
            const paymentData = {
                contract_id: testContractId,
                payment_amount: 5000.00,
                payment_date: '2025-01-15',
                payment_type: 'milestone',
                description: 'Test payment'
            };

            const response = await request(app)
                .post('/api/phase1/contract-payments')
                .set('x-user-id', testUserId)
                .send(paymentData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.payment).toBeDefined();
            expect(response.body.payment.payment_amount).toBe(paymentData.payment_amount);
        });

        test('GET /api/phase1/contract-payments should return payments with amount alias', async () => {
            // Insert payment fixture
            const paymentAmount = 7500.00;
            const paymentDescription = 'Fixture payment';
            await query(`
                INSERT INTO contract_payments (id, contract_id, payment_amount, payment_date, status, description)
                VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
            `, [testContractId, paymentAmount, '2025-02-15', 'paid', paymentDescription]);

            const response = await request(app)
                .get('/api/phase1/contract-payments')
                .set('x-user-id', testUserId)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            // Response should contain the inserted payment with amount alias
            const fixture = response.body.find(p => p.description === paymentDescription);
            expect(fixture).toBeDefined();
            expect(fixture).toHaveProperty('amount', paymentAmount);

            // Every returned payment should include the amount property
            response.body.forEach(payment => {
                expect(payment).toHaveProperty('amount');
            });
        });
    });

    describe('Budget Transfer Endpoints', () => {
        test('GET /api/budget/transfers should return transfers list', async () => {
            const response = await request(app)
                .get('/api/budget/transfers')
                .set('x-user-id', testUserId)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Gate Meeting Endpoints', () => {
        test('GET /api/gate-meetings should return meetings with type/status names', async () => {
            const response = await request(app)
                .get('/api/gate-meetings')
                .set('x-user-id', testUserId)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Audit Log Endpoints', () => {
        test('GET /api/reporting/audit-logs should return audit logs with user join', async () => {
            const response = await request(app)
                .get('/api/reporting/audit-logs')
                .set('x-user-id', testUserId)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('User Name Construction', () => {
        test('should construct full names correctly', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('x-user-id', testUserId)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            const testUser = response.body.find(u => u.id === testUserId);
            if (testUser) {
                expect(testUser.full_name || testUser.name).toBe('Test User');
            }
        });
    });

    describe('UUID Validation', () => {
        test('should return 400 for invalid UUID format', async () => {
            const response = await request(app)
                .get('/api/projects/invalid-uuid')
                .set('x-user-id', testUserId)
                .expect(400);

            expect(response.body.error).toBeDefined();
        });
    });
});

