/**
 * API Integration Test Script
 * Tests the project workflow API endpoints with fresh database
 * Run with: node test_api_integration.js
 */

const { Pool } = require('pg');
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';
const DB_CONFIG = {
  user: process.env.DB_USER || 'pfmt_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pfmt_db',
  password: process.env.DB_PASSWORD || 'pfmt_password',
  port: process.env.DB_PORT || 5432,
};

// Test users from sample data
const TEST_USERS = {
  pmi: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Sarah Johnson',
    role: 'pmi',
    email: 'sarah.johnson@gov.ab.ca'
  },
  director: {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Jennifer Williams',
    role: 'director',
    email: 'jennifer.williams@gov.ab.ca'
  },
  pm: {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Lisa Anderson',
    role: 'pm',
    email: 'lisa.anderson@gov.ab.ca'
  },
  spm: {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: 'James Wilson',
    role: 'spm',
    email: 'james.wilson@gov.ab.ca'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Make API request with user context
 */
async function apiRequest(endpoint, options = {}, user = TEST_USERS.pmi) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': user.id,
      'X-User-Role': user.role,
      'X-User-Name': user.name,
      ...options.headers
    },
    ...options
  };
  
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error?.message || data.message || response.statusText}`);
    }
    
    return data;
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  log('blue', '\n🔌 Testing database connection...');
  
  const pool = new Pool(DB_CONFIG);
  
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    log('green', `✅ Database connected: ${result.rows[0].current_time}`);
    
    // Check if sample data exists
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const projectCount = await pool.query('SELECT COUNT(*) FROM projects');
    
    log('cyan', `   Users: ${userCount.rows[0].count}`);
    log('cyan', `   Projects: ${projectCount.rows[0].count}`);
    
    if (userCount.rows[0].count === '0') {
      log('yellow', '⚠️  No sample data found. Run: ./scripts/reset_database.sh');
      return false;
    }
    
    return true;
  } catch (error) {
    log('red', `❌ Database connection failed: ${error.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

/**
 * Test API server availability
 */
async function testApiServer() {
  log('blue', '\n🌐 Testing API server...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      log('green', '✅ API server is running');
      return true;
    } else {
      log('yellow', '⚠️  API server responded but health check failed');
      return false;
    }
  } catch (error) {
    log('red', `❌ API server not available: ${error.message}`);
    log('yellow', '   Make sure backend server is running on port 3002');
    return false;
  }
}

/**
 * Test wizard authorization (vendor role should be forbidden)
 */
async function testWizardAuthorization() {
  log('blue', '\n🚫 Testing wizard authorization (vendor role)...');

  try {
    await apiRequest('/api/project-wizard/templates', { method: 'GET' }, {
      id: 'vendor-test-user',
      role: 'vendor',
      name: 'Vendor User',
      email: 'vendor@example.com'
    });
    log('red', '❌ Vendor user was able to access wizard endpoint');
    return false;
  } catch (error) {
    log('green', '✅ Vendor access correctly blocked');
    return true;
  }
}

/**
 * Test project initiation (PMI role)
 */
async function testProjectInitiation() {
  log('blue', '\n🚀 Testing project initiation (PMI role)...');
  
  const projectData = {
    name: 'Test Integration Project',
    description: 'Project created by API integration test',
    estimated_budget: 2500000,
    start_date: '2025-06-01',
    end_date: '2026-05-31',
    project_type: 'new_construction',
    delivery_method: 'design_build',
    project_category: 'infrastructure',
    geographic_region: 'calgary'
  };
  
  try {
    const response = await apiRequest('/api/project-workflow', {
      method: 'POST',
      body: projectData
    }, TEST_USERS.pmi);
    
    if (response.project && response.project.id) {
      log('green', `✅ Project initiated successfully: ${response.project.id}`);
      log('cyan', `   Status: ${response.project.workflow_status}`);
      log('cyan', `   Name: ${response.project.project_name}`);
      return response.project;
    } else {
      throw new Error('No project ID returned');
    }
  } catch (error) {
    log('red', `❌ Project initiation failed: ${error.message}`);
    return null;
  }
}

/**
 * Test team assignment (Director role)
 */
async function testTeamAssignment(project) {
  log('blue', '\n👥 Testing team assignment (Director role)...');
  
  if (!project) {
    log('yellow', '⚠️  Skipping team assignment - no project to assign');
    return null;
  }
  
  const assignmentData = {
    assigned_pm: TEST_USERS.pm.id,
    assigned_spm: TEST_USERS.spm.id
  };
  
  try {
    const response = await apiRequest(`/api/project-workflow/${project.id}/assign`, {
      method: 'POST',
      body: assignmentData
    }, TEST_USERS.director);
    
    if (response.project) {
      log('green', `✅ Team assigned successfully`);
      log('cyan', `   Status: ${response.project.workflow_status}`);
      log('cyan', `   PM: ${response.project.assigned_pm}`);
      log('cyan', `   SPM: ${response.project.assigned_spm}`);
      return response.project;
    } else {
      throw new Error('No project returned');
    }
  } catch (error) {
    log('red', `❌ Team assignment failed: ${error.message}`);
    return project;
  }
}

/**
 * Test project finalization (PM role)
 */
async function testProjectFinalization(project) {
  log('blue', '\n🏁 Testing project finalization (PM role)...');
  
  if (!project) {
    log('yellow', '⚠️  Skipping finalization - no project to finalize');
    return null;
  }
  
  const finalizationData = {
    vendors: [
      {
        vendor_id: '660e8400-e29b-41d4-a716-446655440001',
        role: 'general_contractor',
        notes: 'Primary construction contractor for test project'
      }
    ],
    budget_breakdown: {
      construction: 1800000,
      design: 300000,
      equipment: 250000,
      contingency: 150000
    },
    detailed_description: 'This is a test project created by the API integration test. It includes all necessary components to validate the workflow system.',
    risk_assessment: 'Low risk test project with standard construction timeline and budget.',
    milestones: [
      {
        title: 'Design Phase Complete',
        type: 'design',
        planned_start: '2025-06-01',
        planned_finish: '2025-08-31'
      }
    ]
  };
  
  try {
    const response = await apiRequest(`/api/project-workflow/${project.id}/finalize`, {
      method: 'POST',
      body: finalizationData
    }, TEST_USERS.pm);
    
    if (response.project) {
      log('green', `✅ Project finalized successfully`);
      log('cyan', `   Status: ${response.project.workflow_status}`);
      log('cyan', `   Finalized by: ${response.project.finalized_by}`);
      return response.project;
    } else {
      throw new Error('No project returned');
    }
  } catch (error) {
    log('red', `❌ Project finalization failed: ${error.message}`);
    return project;
  }
}

/**
 * Test workflow status endpoint
 */
async function testWorkflowStatus(project) {
  log('blue', '\n📊 Testing workflow status endpoint...');
  
  if (!project) {
    log('yellow', '⚠️  Skipping status check - no project to check');
    return;
  }
  
  try {
    const response = await apiRequest(`/api/project-workflow/${project.id}/status`, {
      method: 'GET'
    }, TEST_USERS.pm);
    
    log('green', `✅ Workflow status retrieved successfully`);
    log('cyan', `   Project ID: ${response.id}`);
    log('cyan', `   Status: ${response.workflow_status}`);
    log('cyan', `   Created by: ${response.created_by}`);
    log('cyan', `   Assigned PM: ${response.assigned_pm}`);
    log('cyan', `   Assigned SPM: ${response.assigned_spm}`);
  } catch (error) {
    log('red', `❌ Workflow status check failed: ${error.message}`);
  }
}

/**
 * Test project details endpoint
 */
async function testProjectDetails(project) {
  log('blue', '\n📋 Testing project details endpoint...');
  
  if (!project) {
    log('yellow', '⚠️  Skipping details check - no project to check');
    return;
  }
  
  try {
    const response = await apiRequest(`/api/projects/${project.id}`, {
      method: 'GET'
    }, TEST_USERS.pm);
    
    log('green', `✅ Project details retrieved successfully`);
    log('cyan', `   Name: ${response.project_name || response.name}`);
    log('cyan', `   Budget: $${response.estimated_budget?.toLocaleString()}`);
    log('cyan', `   Category: ${response.project_category}`);
    log('cyan', `   Region: ${response.geographic_region}`);
  } catch (error) {
    log('red', `❌ Project details check failed: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runIntegrationTests() {
  log('magenta', '🧪 PFMT API Integration Tests');
  log('magenta', '============================');
  
  let allTestsPassed = true;
  
  // Test 1: Database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    allTestsPassed = false;
  }
  
  // Test 2: API server availability
  const apiAvailable = await testApiServer();
  if (!apiAvailable) {
    allTestsPassed = false;
  }

  // Test 3: Authorization on wizard endpoints
  const authz = await testWizardAuthorization();
  if (!authz) {
    allTestsPassed = false;
  }

  // If basic infrastructure is not available, skip workflow tests
  if (!dbConnected || !apiAvailable) {
    log('red', '\n❌ Basic infrastructure not available. Skipping workflow tests.');
    log('yellow', '\nTo fix:');
    log('yellow', '1. Reset database: ./scripts/reset_database.sh');
    log('yellow', '2. Start backend: cd backend && npm start');
    process.exit(1);
  }
  
  // Test 3: Full workflow
  log('blue', '\n🔄 Testing complete workflow...');
  
  let project = await testProjectInitiation();
  project = await testTeamAssignment(project);
  project = await testProjectFinalization(project);
  
  // Test 4: Status and details endpoints
  await testWorkflowStatus(project);
  await testProjectDetails(project);
  
  // Summary
  log('magenta', '\n📊 Test Summary');
  log('magenta', '===============');
  
  if (project && project.workflow_status === 'active') {
    log('green', '✅ All workflow tests completed successfully!');
    log('green', '✅ API service layer is working correctly');
    log('cyan', `   Test project created: ${project.id}`);
    log('cyan', `   Final status: ${project.workflow_status}`);
  } else {
    log('yellow', '⚠️  Some workflow tests had issues');
    allTestsPassed = false;
  }
  
  if (allTestsPassed) {
    log('green', '\n🎉 API Integration Tests: PASSED');
    log('green', 'Ready to proceed with Chunk 3: Wizard State Management');
  } else {
    log('red', '\n💥 API Integration Tests: FAILED');
    log('yellow', 'Please fix the issues above before proceeding');
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Run tests if called directly
if (require.main === module) {
  runIntegrationTests().catch(error => {
    log('red', `\n💥 Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runIntegrationTests,
  testDatabaseConnection,
  testApiServer,
  apiRequest,
  TEST_USERS
};

