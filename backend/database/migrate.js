const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'pfmt_integrated',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

class DatabaseMigrator {
    constructor() {
        // Look for SQL under the repo-root /database folder (P1-5 fix)
        this.schemaPath = path.resolve(process.cwd(), 'database');
        this.migrationsPath = path.join(this.schemaPath, 'migrations');
        
        console.log('🔧 Database migrator paths:');
        console.log(`   Schema path: ${this.schemaPath}`);
        console.log(`   Migrations path: ${this.migrationsPath}`);
        console.log(`   Current working directory: ${process.cwd()}`);
    }

    /**
     * Initialize migration tracking table
     */
    async initializeMigrationTable() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                checksum VARCHAR(64)
            );
        `;
        
        await pool.query(createTableQuery);
        console.log('✅ Migration tracking table initialized');
    }

    /**
     * Calculate file checksum for change detection
     */
    calculateChecksum(content) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Check if migration has been executed
     */
    async isMigrationExecuted(migrationName) {
        const result = await pool.query(
            'SELECT checksum FROM schema_migrations WHERE migration_name = $1',
            [migrationName]
        );
        return result.rows.length > 0 ? result.rows[0].checksum : null;
    }

    /**
     * Record migration execution
     */
    async recordMigration(migrationName, checksum) {
        await pool.query(
            `INSERT INTO schema_migrations (migration_name, checksum) 
             VALUES ($1, $2) 
             ON CONFLICT (migration_name) 
             DO UPDATE SET checksum = $2, executed_at = CURRENT_TIMESTAMP`,
            [migrationName, checksum]
        );
    }

    /**
     * Execute SQL file
     */
    async executeSqlFile(filePath, fileName) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const checksum = this.calculateChecksum(content);
            
            // Check if already executed with same checksum
            const existingChecksum = await this.isMigrationExecuted(fileName);
            if (existingChecksum === checksum) {
                console.log(`⏭️  Skipping ${fileName} (already executed with same checksum)`);
                return;
            }

            console.log(`🔄 Executing ${fileName}...`);
            
            // Execute the SQL
            await pool.query(content);
            
            // Record the migration
            await this.recordMigration(fileName, checksum);
            
            console.log(`✅ Successfully executed ${fileName}`);
            
        } catch (error) {
            console.error(`❌ Error executing ${fileName}:`, error.message);
            throw error;
        }
    }

    /**
     * Run all pending migrations
     */
    async runMigrations() {
        try {
            console.log('🚀 Starting database migrations...');
            
            // Initialize migration tracking
            await this.initializeMigrationTable();
            
            // Check if main schema needs to be applied
            const schemaFile = path.join(this.schemaPath, 'fresh_schema.sql');
            if (fs.existsSync(schemaFile)) {
                await this.executeSqlFile(schemaFile, 'fresh_schema.sql');
            }
            
            // Check if gate meeting enhancements need to be applied
            const gateMeetingFile = path.join(this.schemaPath, 'gate_meeting_schema_enhancement.sql');
            if (fs.existsSync(gateMeetingFile)) {
                await this.executeSqlFile(gateMeetingFile, 'gate_meeting_schema_enhancement.sql');
            }
            
            // Run migration files in order
            if (fs.existsSync(this.migrationsPath)) {
                const migrationFiles = fs.readdirSync(this.migrationsPath)
                    .filter(file => file.endsWith('.sql'))
                    .sort(); // Execute in alphabetical order
                
                for (const file of migrationFiles) {
                    const filePath = path.join(this.migrationsPath, file);
                    await this.executeSqlFile(filePath, file);
                }
            }
            
            console.log('🎉 All migrations completed successfully!');
            
        } catch (error) {
            console.error('💥 Migration failed:', error);
            throw error;
        }
    }

    /**
     * Create a new migration file
     */
    createMigration(name) {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const fileName = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
        const filePath = path.join(this.migrationsPath, fileName);
        
        const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString().slice(0, 10)}
-- Description: ${name}

-- Add your SQL statements here

`;
        
        // Ensure migrations directory exists
        if (!fs.existsSync(this.migrationsPath)) {
            fs.mkdirSync(this.migrationsPath, { recursive: true });
        }
        
        fs.writeFileSync(filePath, template);
        console.log(`📝 Created migration file: ${fileName}`);
        return filePath;
    }

    /**
     * Show migration status
     */
    async showStatus() {
        try {
            await this.initializeMigrationTable();
            
            const result = await pool.query(
                'SELECT migration_name, executed_at FROM schema_migrations ORDER BY executed_at'
            );
            
            console.log('\n📊 Migration Status:');
            console.log('==================');
            
            if (result.rows.length === 0) {
                console.log('No migrations have been executed yet.');
            } else {
                result.rows.forEach(row => {
                    console.log(`✅ ${row.migration_name} - ${row.executed_at}`);
                });
            }
            
            // Check for pending migrations
            if (fs.existsSync(this.migrationsPath)) {
                const migrationFiles = fs.readdirSync(this.migrationsPath)
                    .filter(file => file.endsWith('.sql'));
                
                const executedMigrations = result.rows.map(row => row.migration_name);
                const pendingMigrations = migrationFiles.filter(file => 
                    !executedMigrations.includes(file)
                );
                
                if (pendingMigrations.length > 0) {
                    console.log('\n⏳ Pending Migrations:');
                    pendingMigrations.forEach(file => {
                        console.log(`⏸️  ${file}`);
                    });
                }
            }
            
        } catch (error) {
            console.error('Error showing migration status:', error);
        }
    }

    /**
     * Close database connection
     */
    async close() {
        await pool.end();
    }
}

// CLI interface
async function main() {
    const migrator = new DatabaseMigrator();
    const command = process.argv[2];
    
    try {
        switch (command) {
            case 'migrate':
                await migrator.runMigrations();
                break;
                
            case 'status':
                await migrator.showStatus();
                break;
                
            case 'create':
                const migrationName = process.argv[3];
                if (!migrationName) {
                    console.error('Please provide a migration name: npm run migrate create "migration name"');
                    process.exit(1);
                }
                migrator.createMigration(migrationName);
                break;
                
            default:
                console.log('Usage:');
                console.log('  node migrate.js migrate  - Run all pending migrations');
                console.log('  node migrate.js status   - Show migration status');
                console.log('  node migrate.js create "name" - Create new migration file');
                break;
        }
    } catch (error) {
        console.error('Migration command failed:', error);
        process.exit(1);
    } finally {
        await migrator.close();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = DatabaseMigrator;

