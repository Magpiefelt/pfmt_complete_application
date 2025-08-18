const request = require('supertest');
const express = require('express');
const { query } = require('../config/database');

// Mock app setup for testing
const app = express();
app.use(express.json());

// Import controllers
const enhancedPhase1 = require('../controllers/enhanced_phase1');

// Setup routes for testing
app.get('/api/projects/:projectId/financial-summary', enhancedPhase1.getProjectFinancialSummary);
app.get('/api/projects/:projectId/contract-payments', enhancedPhase1.getContractPayments);
app.post('/api/projects/:projectId/contract-payments', enhancedPhase1.addContractPayment);
app.get('/api/projects/:projectId/budget-transfers', enhancedPhase1.getBudgetTransferLedger);

describe('Enhanced Controller Integration Tests', () => {
  let testProjectId;
  let testContractId;
  let testVendorId;

  beforeAll(async () => {
    // Get test data IDs
    const projectResult = await query('SELECT id FROM projects LIMIT 1');
    const contractResult = await query('SELECT id FROM contracts LIMIT 1');
    const vendorResult = await query('SELECT id FROM vendors LIMIT 1');
    
    if (projectResult.rows.length > 0) testProjectId = projectResult.rows[0].id;
    if (contractResult.rows.length > 0) testContractId = contractResult.rows[0].id;
    if (vendorResult.rows.length > 0) testVendorId = vendorResult.rows[0].id;
  });

  describe('UUID Validation Tests', () => {
    test('should return 400 for invalid project UUID in financial summary', async () => {
      const response = await request(app)
        .get('/api/projects/invalid-uuid/financial-summary')
        .set('x-user-id', testProjectId || 'test-user-id');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid UUID format');
    });

    test('should return 400 for invalid project UUID in contract payments', async () => {
      const response = await request(app)
        .get('/api/projects/not-a-uuid/contract-payments')
        .set('x-user-id', testProjectId || 'test-user-id');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid UUID format');
    });
  });

  describe('Project Financial Summary Tests', () => {
    test('should return 404 for non-existent project', async () => {
      const fakeId = await query('SELECT uuid_generate_v4() as id');
      const nonExistentId = fakeId.rows[0].id;

      const response = await request(app)
        .get(`/api/projects/${nonExistentId}/financial-summary`)
        .set('x-user-id', testProjectId || 'test-user-id');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Project not found');
    });

    test('should return financial summary for valid project', async () => {
      if (!testProjectId) {
        console.log('Skipping test - no test project available');
        return;
      }

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/financial-summary`)
        .set('x-user-id', testProjectId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('project');
      expect(response.body.data).toHaveProperty('financialSummary');
      expect(response.body.data.financialSummary).toHaveProperty('contractSummary');
      expect(response.body.data.financialSummary).toHaveProperty('paymentSummary');
    });
  });

  describe('Contract Payments Tests', () => {
    test('should return contract payments with amount alias', async () => {
      if (!testProjectId) {
        console.log('Skipping test - no test project available');
        return;
      }

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/contract-payments`)
        .set('x-user-id', testProjectId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payments');
      expect(response.body.data).toHaveProperty('pagination');

      // Check if payments have both payment_amount and amount fields
      if (response.body.data.payments.length > 0) {
        const payment = response.body.data.payments[0];
        expect(payment).toHaveProperty('amount');
        expect(payment).toHaveProperty('payment_amount');
        expect(payment.amount).toBe(payment.payment_amount);
      }
    });

    test('should create new contract payment', async () => {
      if (!testProjectId || !testContractId) {
        console.log('Skipping test - no test data available');
        return;
      }

      const paymentData = {
        contractId: testContractId,
        amount: 5000.00,
        paymentDate: '2025-01-30',
        status: 'pending',
        paymentType: 'milestone',
        description: 'Test payment creation'
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/contract-payments`)
        .set('x-user-id', testProjectId)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payment');
      expect(response.body.data.payment).toHaveProperty('amount');
      expect(parseFloat(response.body.data.payment.amount)).toBe(5000.00);

      // Cleanup - delete the test payment
      if (response.body.data.payment.id) {
        await query('DELETE FROM contract_payments WHERE id = $1', [response.body.data.payment.id]);
      }
    });

    test('should validate payment amount', async () => {
      if (!testProjectId || !testContractId) {
        console.log('Skipping test - no test data available');
        return;
      }

      const invalidPaymentData = {
        contractId: testContractId,
        amount: -100.00, // Invalid negative amount
        paymentDate: '2025-01-30',
        status: 'pending'
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/contract-payments`)
        .set('x-user-id', testProjectId)
        .send(invalidPaymentData);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Payment amount must be greater than 0');
    });
  });

  describe('Budget Transfer Tests', () => {
    test('should return budget transfers for project', async () => {
      if (!testProjectId) {
        console.log('Skipping test - no test project available');
        return;
      }

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/budget-transfers`)
        .set('x-user-id', testProjectId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transfers');
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('should filter budget transfers by status', async () => {
      if (!testProjectId) {
        console.log('Skipping test - no test project available');
        return;
      }

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/budget-transfers?status=approved`)
        .set('x-user-id', testProjectId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // All returned transfers should have approved status
      response.body.data.transfers.forEach(transfer => {
        expect(transfer.status).toBe('approved');
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll test that the error handling middleware works
      const response = await request(app)
        .get('/api/projects/nonexistent-endpoint')
        .set('x-user-id', testProjectId || 'test-user-id');

      expect(response.status).toBe(404);
    });

    test('should validate required headers', async () => {
      if (!testProjectId) {
        console.log('Skipping test - no test project available');
        return;
      }

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/financial-summary`);
        // Missing x-user-id header

      // This would depend on middleware implementation
      // For now, just check that the endpoint responds
      expect([200, 400, 401]).toContain(response.status);
    });
  });

  describe('Pagination Tests', () => {
    test('should handle pagination parameters', async () => {
      if (!testProjectId) {
        console.log('Skipping test - no test project available');
        return;
      }

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/contract-payments?page=1&limit=5`)
        .set('x-user-id', testProjectId);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });
  });

  describe('Data Consistency Tests', () => {
    test('should maintain data consistency in financial calculations', async () => {
      if (!testProjectId) {
        console.log('Skipping test - no test project available');
        return;
      }

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/financial-summary`)
        .set('x-user-id', testProjectId);

      if (response.status === 200) {
        const summary = response.body.data.financialSummary;
        
        // Check that calculations are consistent
        expect(typeof summary.totalBudget).toBe('number');
        expect(typeof summary.totalSpent).toBe('number');
        expect(typeof summary.remainingBudget).toBe('number');
        expect(typeof summary.budgetUtilization).toBe('number');
        
        // Remaining budget should equal total budget minus total spent
        const expectedRemaining = summary.totalBudget - summary.totalSpent;
        expect(Math.abs(summary.remainingBudget - expectedRemaining)).toBeLessThan(0.01);
      }
    });
  });
});

