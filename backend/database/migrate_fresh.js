/**
 * PFMT Fresh Migration Script
 * Simplified migration approach using fresh schema
 * Replaces complex migration chain with single source of truth
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'pfmt_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pfmt_db',
  password: process.env.DB_PASSWORD || 'pfmt_password',
  port: process.env.DB_PORT || 5432,
});

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SCHEMA_FILE = path.join(PROJECT_ROOT, 'database', 'fresh_schema.sql');
const SAMPLE_DATA_FILE = path.join(PROJECT_ROOT, 'database', 'sample_data.sql');

/**
 * Execute SQL file
 */
async function executeSqlFile(filePath, description) {
  console.log(`\n📄 ${description}...`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    await pool.query(sql);
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

/**
 * Check database connection
 */
async function checkConnection() {
  console.log('🔌 Checking database connection...');
  
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    console.log(`✅ Connected to database at ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Get current schema version
 */
async function getCurrentVersion() {
  try {
    const result = await pool.query('SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1');
    return result.rows.length > 0 ? result.rows[0].version : 'none';
  } catch (error) {
    return 'none';
  }
}

/**
 * Verify fresh schema
 */
async function verifySchema() {
  console.log('\n🔍 Verifying schema...');
  
  try {
    // Check essential tables exist
    const tables = ['users', 'projects', 'vendors', 'project_milestones', 'project_vendors', 'notifications', 'audit_log'];
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (!result.rows[0].exists) {
        throw new Error(`Table ${table} does not exist`);
      }
    }
    
    // Check sample data
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const projectCount = await pool.query('SELECT COUNT(*) FROM projects');
    const vendorCount = await pool.query('SELECT COUNT(*) FROM vendors');
    
    console.log(`✅ Schema verified successfully`);
    console.log(`   - Users: ${userCount.rows[0].count}`);
    console.log(`   - Projects: ${projectCount.rows[0].count}`);
    console.log(`   - Vendors: ${vendorCount.rows[0].count}`);
    
    return true;
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
    return false;
  }
}

/**
 * Apply fresh schema
 */
async function applyFreshSchema() {
  console.log('\n🚀 Applying fresh schema...');
  
  try {
    await executeSqlFile(SCHEMA_FILE, 'Applying fresh schema');
    await executeSqlFile(SAMPLE_DATA_FILE, 'Loading sample data');
    
    const version = await getCurrentVersion();
    console.log(`✅ Fresh schema applied successfully (version: ${version})`);
    
    return true;
  } catch (error) {
    console.error('❌ Fresh schema application failed:', error.message);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrate(command = 'apply') {
  console.log('🏗️  PFMT Fresh Migration Tool');
  console.log('================================\n');
  
  try {
    // Check connection
    const connected = await checkConnection();
    if (!connected) {
      process.exit(1);
    }
    
    switch (command) {
      case 'status':
        const currentVersion = await getCurrentVersion();
        console.log(`\n📊 Current schema version: ${currentVersion}`);
        
        if (currentVersion !== 'none') {
          await verifySchema();
        } else {
          console.log('⚠️  No schema version found - database may be empty');
        }
        break;
        
      case 'apply':
      case 'fresh':
        await applyFreshSchema();
        await verifySchema();
        break;
        
      case 'verify':
        await verifySchema();
        break;
        
      default:
        console.log('Usage: node migrate_fresh.js [command]');
        console.log('Commands:');
        console.log('  apply   - Apply fresh schema (default)');
        console.log('  fresh   - Same as apply');
        console.log('  status  - Show current schema status');
        console.log('  verify  - Verify schema integrity');
        break;
    }
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2] || 'apply';
  migrate(command);
}

module.exports = { migrate, checkConnection, verifySchema };

