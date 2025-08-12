-- Connection Diagnostic Script
-- Run this in pgAdmin to verify user setup and identify connection issues

-- Step 1: Verify pfmt_user exists and has correct attributes
SELECT 
    rolname as username,
    rolcanlogin as can_login,
    rolcreatedb as can_create_db,
    rolsuper as is_superuser,
    rolreplication as can_replicate,
    rolconnlimit as connection_limit,
    rolvaliduntil as password_expiry
FROM pg_roles 
WHERE rolname = 'pfmt_user';

-- Step 2: Check what databases pfmt_user can access
SELECT 
    d.datname as database_name,
    pg_catalog.has_database_privilege('pfmt_user', d.datname, 'CONNECT') as can_connect,
    pg_catalog.has_database_privilege('pfmt_user', d.datname, 'CREATE') as can_create
FROM pg_database d
WHERE d.datname IN ('pfmt_integrated', 'postgres')
ORDER BY d.datname;

-- Step 3: Check current database and user
SELECT 
    current_database() as current_db,
    current_user as current_user,
    session_user as session_user,
    inet_server_addr() as server_ip,
    inet_server_port() as server_port;

-- Step 4: Check if we can connect as pfmt_user (connection test)
-- Note: This shows what would happen if pfmt_user tried to connect
SELECT 
    'pfmt_user' as test_user,
    pg_catalog.has_database_privilege('pfmt_user', 'pfmt_integrated', 'CONNECT') as can_connect_to_pfmt_db,
    EXISTS(SELECT 1 FROM pg_database WHERE datname = 'pfmt_integrated') as pfmt_db_exists;

-- Step 5: Check table permissions for pfmt_user
SELECT 
    schemaname,
    tablename,
    tableowner,
    pg_catalog.has_table_privilege('pfmt_user', schemaname||'.'||tablename, 'SELECT') as can_select,
    pg_catalog.has_table_privilege('pfmt_user', schemaname||'.'||tablename, 'INSERT') as can_insert,
    pg_catalog.has_table_privilege('pfmt_user', schemaname||'.'||tablename, 'UPDATE') as can_update,
    pg_catalog.has_table_privilege('pfmt_user', schemaname||'.'||tablename, 'DELETE') as can_delete
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('project_templates', 'project_wizard_sessions', 'users')
ORDER BY tablename;

-- Step 6: Check active connections to the database
SELECT 
    datname as database,
    usename as username,
    client_addr as client_ip,
    client_port,
    application_name,
    state,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE datname = 'pfmt_integrated'
ORDER BY query_start DESC;

-- Step 7: Test password authentication method
SELECT 
    'Current authentication method check' as info,
    'Check pg_hba.conf for scram-sha-256 or md5' as note;

-- Step 8: Show connection summary
SELECT 
    'DIAGNOSTIC SUMMARY' as section,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'pfmt_user' AND rolcanlogin = true) 
        THEN '✅ pfmt_user exists and can login'
        ELSE '❌ pfmt_user missing or cannot login'
    END as user_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_database WHERE datname = 'pfmt_integrated')
        THEN '✅ pfmt_integrated database exists'
        ELSE '❌ pfmt_integrated database missing'
    END as database_status,
    CASE 
        WHEN pg_catalog.has_database_privilege('pfmt_user', 'pfmt_integrated', 'CONNECT')
        THEN '✅ pfmt_user can connect to pfmt_integrated'
        ELSE '❌ pfmt_user cannot connect to pfmt_integrated'
    END as connection_status;

