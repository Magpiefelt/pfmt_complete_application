const { query, testConnection } = require('../config/database');

describe('Database Tests', () => {
    beforeAll(async () => {
        // Ensure database connection is established
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }
    });

    describe('Database Connection', () => {
        test('should connect to database successfully', async () => {
            const connected = await testConnection();
            expect(connected).toBe(true);
        });
    });

    describe('Table Structure Tests', () => {
        test('should have users table with correct columns', async () => {
            const result = await query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position
            `);
            
            expect(result.rows.length).toBeGreaterThan(0);
            const columns = result.rows.map(row => row.column_name);
            expect(columns).toContain('id');
            expect(columns).toContain('username');
            expect(columns).toContain('email');
            expect(columns).toContain('first_name');
            expect(columns).toContain('last_name');
        });

        test('should have projects table with project_name column', async () => {
            const result = await query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'project_name'
            `);
            
            expect(result.rows.length).toBe(1);
        });

        test('should have audit_logs table (plural)', async () => {
            const result = await query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'audit_logs'
            `);
            
            expect(result.rows.length).toBe(1);
        });

        test('should have contract_payments table with payment_amount column', async () => {
            const result = await query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'contract_payments' AND column_name = 'payment_amount'
            `);
            
            expect(result.rows.length).toBe(1);
        });
    });

    describe('UUID Extension Tests', () => {
        test('should have uuid-ossp extension installed', async () => {
            const result = await query(`
                SELECT extname 
                FROM pg_extension 
                WHERE extname = 'uuid-ossp'
            `);
            
            expect(result.rows.length).toBe(1);
        });

        test('should be able to generate UUIDs', async () => {
            const result = await query('SELECT uuid_generate_v4() as test_uuid');
            
            expect(result.rows.length).toBe(1);
            expect(result.rows[0].test_uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });
    });

    describe('Trigger Tests', () => {
        test('should have update_updated_at_column function', async () => {
            const result = await query(`
                SELECT proname 
                FROM pg_proc 
                WHERE proname = 'update_updated_at_column'
            `);
            
            expect(result.rows.length).toBe(1);
        });

        test('should have audit_trigger_function', async () => {
            const result = await query(`
                SELECT proname 
                FROM pg_proc 
                WHERE proname = 'audit_trigger_function'
            `);
            
            expect(result.rows.length).toBe(1);
        });
    });

    describe('Lookup Data Tests', () => {
        test('should have gate meeting types seeded', async () => {
            const result = await query('SELECT COUNT(*) as count FROM gate_meeting_types');
            
            expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
        });

        test('should have gate meeting statuses seeded', async () => {
            const result = await query('SELECT COUNT(*) as count FROM gate_meeting_statuses');
            
            expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
        });

        test('should have organizational roles seeded', async () => {
            const result = await query('SELECT COUNT(*) as count FROM organizational_roles');
            
            expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
        });
    });

    describe('Data Insertion Tests', () => {
        test('should be able to insert and retrieve a user', async () => {
            const testUser = {
                id: 'test-user-id-' + Date.now(),
                username: 'testuser' + Date.now(),
                email: 'test' + Date.now() + '@example.com',
                first_name: 'Test',
                last_name: 'User',
                password_hash: 'test_hash'
            };

            // Insert test user
            await query(`
                INSERT INTO users (id, username, email, first_name, last_name, password_hash) 
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [testUser.id, testUser.username, testUser.email, testUser.first_name, testUser.last_name, testUser.password_hash]);

            // Retrieve test user
            const result = await query('SELECT * FROM users WHERE email = $1', [testUser.email]);
            
            expect(result.rows.length).toBe(1);
            expect(result.rows[0].first_name).toBe(testUser.first_name);
            expect(result.rows[0].last_name).toBe(testUser.last_name);

            // Cleanup
            await query('DELETE FROM users WHERE email = $1', [testUser.email]);
        });

        test('should be able to insert and retrieve a project', async () => {
            const testProject = {
                id: 'test-project-id-' + Date.now(),
                project_name: 'Test Project ' + Date.now(),
                budget: 10000.00
            };

            // Insert test project
            await query(`
                INSERT INTO projects (id, project_name, budget) 
                VALUES ($1, $2, $3)
            `, [testProject.id, testProject.project_name, testProject.budget]);

            // Retrieve test project
            const result = await query('SELECT * FROM projects WHERE id = $1', [testProject.id]);
            
            expect(result.rows.length).toBe(1);
            expect(result.rows[0].project_name).toBe(testProject.project_name);
            expect(parseFloat(result.rows[0].budget)).toBe(testProject.budget);

            // Cleanup
            await query('DELETE FROM projects WHERE id = $1', [testProject.id]);
        });
    });
});

