# Database Files

This folder contains the essential database files for the PFMT Integrated Application.

## Current Files

### `schema.sql` - **MAIN SCHEMA FILE**
- **Purpose**: Complete unified database schema for PFMT application
- **Usage**: Apply this file to create the entire database structure
- **Command**: `psql -d pfmt_integrated -f schema.sql`
- **Contains**:
  - All table definitions with UUID primary keys
  - Enhanced audit logging system
  - Gate meeting management tables
  - Vendor qualification system
  - Budget transfer workflows
  - Comprehensive indexes and constraints
  - Triggers for audit logging and updated_at columns

### `minimal_working_seeds.sql` - **SEED DATA**
- **Purpose**: Essential seed data for development and testing
- **Usage**: Apply after schema to populate lookup tables and demo data
- **Command**: `psql -d pfmt_integrated -f minimal_working_seeds.sql`
- **Contains**:
  - Demo users (3 users)
  - Demo vendors (2 vendors)
  - Demo projects (2 projects)
  - Demo contracts and payments
  - System configuration entries
  - Lookup table data (gate meeting types, statuses, roles)

## Deployment Order

1. **First**: Apply the schema
   ```bash
   psql -d pfmt_integrated -f schema.sql
   ```

2. **Second**: Apply the seed data
   ```bash
   psql -d pfmt_integrated -f minimal_working_seeds.sql
   ```

## Removed Files

The following obsolete files have been removed from this repository:

### Obsolete Schema Files (replaced by unified schema.sql):
- `approval_audit_schema.sql`
- `financial_management_schema.sql`
- `fix_uuid_schema.sql`
- `fix_wizard_tables.sql`
- `wizard_schema.sql`
- `wizard_schema_fixed.sql`

### Obsolete Seed Files (replaced by minimal_working_seeds.sql):
- `seed.sql`
- `demo_seeds.sql`
- `corrected_demo_seeds.sql`
- `comprehensive_seeds.sql`
- `corrected_comprehensive_seeds.sql`
- `simple_demo_seeds.sql`

## Migration from Old Schema

If you have an existing database with the old fragmented schema files, you will need to:

1. **Backup your existing data**
2. **Drop the old database** (or create a new one)
3. **Apply the new unified schema**
4. **Migrate your data** (see MIGRATION_NOTES.md for details)

## Schema Features

The unified schema includes:

- **UUID Primary Keys**: All tables use UUID v4 primary keys
- **Comprehensive Audit Logging**: Full change tracking with user attribution
- **Enhanced Gate Meetings**: Structured workflow with types and statuses
- **Vendor Management**: Complete vendor qualification and performance tracking
- **Budget Transfers**: Approval workflows with proper authorization
- **System Configuration**: Centralized configuration management
- **Optimized Indexes**: Performance-optimized database indexes
- **Data Integrity**: Comprehensive foreign key constraints

## Troubleshooting

### UUID Extension Error
If you get an error about uuid-ossp extension:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- OR if uuid-ossp is not available:
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Permission Errors
Ensure your database user has proper permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE pfmt_integrated TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

---

*Last updated: August 8, 2025*  
*Schema version: 2.0.0 (Unified)*

