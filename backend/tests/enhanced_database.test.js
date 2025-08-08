const { query } = require('../config/database');

describe('Enhanced Database Tests', () => {
  
  describe('Database Connection', () => {
    test('should connect to database successfully', async () => {
      const result = await query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });
  });

  describe('Table Structure Tests', () => {
    test('should have users table with correct columns', async () => {
      const result = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY column_name
      `);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('username');
      expect(columns).toContain('first_name');
      expect(columns).toContain('last_name');
      expect(columns).toContain('email');
    });

    test('should have projects table with project_name column', async () => {
      const result = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_name'
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

    test('should have audit_logs table (plural)', async () => {
      const result = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'audit_logs'
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
      const result = await query('SELECT uuid_generate_v4() as uuid');
      const uuid = result.rows[0].uuid;
      
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
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

    test('should update updated_at column on user update', async () => {
      // Get a test user
      const userResult = await query('SELECT id, updated_at FROM users LIMIT 1');
      if (userResult.rows.length === 0) {
        throw new Error('No test users found');
      }
      
      const userId = userResult.rows[0].id;
      const originalUpdatedAt = userResult.rows[0].updated_at;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the user
      await query('UPDATE users SET first_name = $1 WHERE id = $2', ['Updated', userId]);
      
      // Check if updated_at changed
      const updatedResult = await query('SELECT updated_at FROM users WHERE id = $1', [userId]);
      const newUpdatedAt = updatedResult.rows[0].updated_at;
      
      expect(new Date(newUpdatedAt)).toBeInstanceOf(Date);
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });

    test('should create audit log entry on user update', async () => {
      // Get initial audit log count
      const initialCount = await query('SELECT COUNT(*) as count FROM audit_logs');
      const initialAuditCount = parseInt(initialCount.rows[0].count);
      
      // Get a test user
      const userResult = await query('SELECT id FROM users LIMIT 1');
      if (userResult.rows.length === 0) {
        throw new Error('No test users found');
      }
      
      const userId = userResult.rows[0].id;
      
      // Update the user
      await query('UPDATE users SET last_name = $1 WHERE id = $2', ['AuditTest', userId]);
      
      // Check if audit log entry was created
      const finalCount = await query('SELECT COUNT(*) as count FROM audit_logs');
      const finalAuditCount = parseInt(finalCount.rows[0].count);
      
      expect(finalAuditCount).toBeGreaterThan(initialAuditCount);
      
      // Verify the audit log entry
      const auditEntry = await query(`
        SELECT * FROM audit_logs 
        WHERE table_name = 'users' AND record_id = $1 
        ORDER BY changed_at DESC LIMIT 1
      `, [userId]);
      
      expect(auditEntry.rows.length).toBe(1);
      expect(auditEntry.rows[0].action).toBe('UPDATE');
    });
  });

  describe('Lookup Data Tests', () => {
    test('should have gate meeting types seeded', async () => {
      const result = await query('SELECT COUNT(*) as count FROM gate_meeting_types');
      const count = parseInt(result.rows[0].count);
      
      expect(count).toBeGreaterThan(0);
    });

    test('should have gate meeting statuses seeded', async () => {
      const result = await query('SELECT COUNT(*) as count FROM gate_meeting_statuses');
      const count = parseInt(result.rows[0].count);
      
      expect(count).toBeGreaterThan(0);
    });

    test('should have organizational roles seeded', async () => {
      const result = await query('SELECT COUNT(*) as count FROM organizational_roles');
      const count = parseInt(result.rows[0].count);
      
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Data Insertion and Retrieval Tests', () => {
    test('should be able to insert and retrieve a user with proper UUID', async () => {
      const testUserId = await query('SELECT uuid_generate_v4() as id');
      const userId = testUserId.rows[0].id;
      
      // Insert test user
      await query(`
        INSERT INTO users (id, username, first_name, last_name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [userId, 'testuser123', 'Test', 'User', 'test123@example.com', 'hash123', 'user']);
      
      // Retrieve the user
      const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
      
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].username).toBe('testuser123');
      expect(result.rows[0].first_name).toBe('Test');
      expect(result.rows[0].last_name).toBe('User');
      
      // Cleanup
      await query('DELETE FROM users WHERE id = $1', [userId]);
    });

    test('should be able to insert and retrieve a project', async () => {
      const testProjectId = await query('SELECT uuid_generate_v4() as id');
      const projectId = testProjectId.rows[0].id;
      
      // Insert test project
      await query(`
        INSERT INTO projects (id, project_name, project_status, project_phase)
        VALUES ($1, $2, $3, $4)
      `, [projectId, 'Test Project Integration', 'active', 'planning']);
      
      // Retrieve the project
      const result = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
      
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].project_name).toBe('Test Project Integration');
      expect(result.rows[0].project_status).toBe('active');
      
      // Cleanup
      await query('DELETE FROM projects WHERE id = $1', [projectId]);
    });

    test('should be able to insert contract payment with payment_amount', async () => {
      // Get existing contract for test
      const contractResult = await query('SELECT id FROM contracts LIMIT 1');
      if (contractResult.rows.length === 0) {
        throw new Error('No test contracts found');
      }
      
      const contractId = contractResult.rows[0].id;
      const paymentId = await query('SELECT uuid_generate_v4() as id');
      const testPaymentId = paymentId.rows[0].id;
      
      // Insert test payment
      await query(`
        INSERT INTO contract_payments (id, contract_id, payment_amount, payment_date, status)
        VALUES ($1, $2, $3, $4, $5)
      `, [testPaymentId, contractId, 15000.00, '2025-01-15', 'pending']);
      
      // Retrieve with amount alias
      const result = await query(`
        SELECT id, payment_amount, payment_amount AS amount 
        FROM contract_payments 
        WHERE id = $1
      `, [testPaymentId]);
      
      expect(result.rows.length).toBe(1);
      expect(parseFloat(result.rows[0].payment_amount)).toBe(15000.00);
      expect(parseFloat(result.rows[0].amount)).toBe(15000.00);
      
      // Cleanup
      await query('DELETE FROM contract_payments WHERE id = $1', [testPaymentId]);
    });
  });

  describe('Foreign Key Relationship Tests', () => {
    test('should enforce foreign key constraints', async () => {
      const nonExistentId = await query('SELECT uuid_generate_v4() as id');
      const fakeId = nonExistentId.rows[0].id;
      
      // Try to insert contract payment with non-existent contract
      await expect(
        query(`
          INSERT INTO contract_payments (id, contract_id, payment_amount, payment_date, status)
          VALUES (uuid_generate_v4(), $1, 1000.00, '2025-01-01', 'pending')
        `, [fakeId])
      ).rejects.toThrow();
    });
  });

  describe('System Configuration Tests', () => {
    test('should have system configs seeded', async () => {
      const result = await query('SELECT COUNT(*) as count FROM system_configs');
      const count = parseInt(result.rows[0].count);
      
      expect(count).toBeGreaterThan(0);
    });

    test('should be able to retrieve system config values', async () => {
      const result = await query(`
        SELECT config_key, config_value 
        FROM system_configs 
        WHERE config_key = 'default_currency'
      `);
      
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].config_value).toBe('CAD');
    });
  });
});

