#!/usr/bin/env python3
"""
PFMT Wizard Diagnostic Script
Comprehensive testing to identify remaining issues after database schema fix
"""

import json
import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a shell command and return the result"""
    print(f"\n🔍 {description}")
    print(f"Command: {command}")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print(f"✅ SUCCESS")
            if result.stdout.strip():
                print(f"Output: {result.stdout.strip()}")
            return True, result.stdout.strip()
        else:
            print(f"❌ FAILED (Exit code: {result.returncode})")
            if result.stderr.strip():
                print(f"Error: {result.stderr.strip()}")
            return False, result.stderr.strip()
    except subprocess.TimeoutExpired:
        print(f"⏰ TIMEOUT (30s)")
        return False, "Command timed out"
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        return False, str(e)

def check_docker_status():
    """Check Docker container status"""
    print("\n" + "="*60)
    print("🐳 DOCKER CONTAINER STATUS")
    print("="*60)
    
    # Check if docker-compose is available
    success, output = run_command("docker-compose --version", "Checking docker-compose availability")
    if not success:
        success, output = run_command("docker compose version", "Checking docker compose plugin")
    
    if not success:
        print("❌ Docker Compose not available - cannot check container status")
        return False
    
    # Check container status
    success, output = run_command("docker-compose ps", "Checking container status")
    if not success:
        success, output = run_command("docker compose ps", "Checking container status (plugin)")
    
    # Check container logs for errors
    containers = ["pfmt-postgres", "pfmt-backend", "pfmt-frontend"]
    for container in containers:
        success, output = run_command(f"docker logs {container} --tail 20", f"Checking {container} logs")
    
    return True

def check_database_connection():
    """Check database connection and user existence"""
    print("\n" + "="*60)
    print("🗄️  DATABASE CONNECTION & USER STATUS")
    print("="*60)
    
    # Test database connection
    db_commands = [
        ("docker exec pfmt-postgres pg_isready -U pfmt_user -d pfmt_integrated", "Testing database readiness"),
        ("docker exec pfmt-postgres psql -U pfmt_user -d pfmt_integrated -c 'SELECT current_user, current_database();'", "Testing user connection"),
        ("docker exec pfmt-postgres psql -U pfmt_user -d pfmt_integrated -c 'SELECT tablename FROM pg_tables WHERE schemaname = \\'public\\' ORDER BY tablename;'", "Listing application tables"),
        ("docker exec pfmt-postgres psql -U pfmt_user -d pfmt_integrated -c 'SELECT COUNT(*) FROM project_templates;'", "Checking project_templates table"),
        ("docker exec pfmt-postgres psql -U pfmt_user -d pfmt_integrated -c 'SELECT COUNT(*) FROM project_wizard_sessions;'", "Checking project_wizard_sessions table"),
    ]
    
    for command, description in db_commands:
        run_command(command, description)
    
    return True

def check_api_endpoints():
    """Check API endpoint availability"""
    print("\n" + "="*60)
    print("🌐 API ENDPOINT TESTING")
    print("="*60)
    
    api_tests = [
        ("curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/health", "Backend health check"),
        ("curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/api/health", "API health check"),
        ("curl -s -X POST -H 'Content-Type: application/json' -o /dev/null -w '%{http_code}' http://localhost:3002/api/wizard/init", "Wizard initialization endpoint"),
        ("curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/api/wizard/templates", "Wizard templates endpoint"),
        ("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000", "Frontend availability"),
    ]
    
    for command, description in api_tests:
        success, output = run_command(command, description)
        if success and output:
            if output == "200":
                print("✅ HTTP 200 - Endpoint working")
            elif output == "404":
                print("❌ HTTP 404 - Endpoint not found")
            elif output == "500":
                print("❌ HTTP 500 - Server error")
            else:
                print(f"⚠️  HTTP {output} - Unexpected response")

def check_environment_config():
    """Check environment configuration"""
    print("\n" + "="*60)
    print("⚙️  ENVIRONMENT CONFIGURATION")
    print("="*60)
    
    # Check if .env file exists and has correct values
    if os.path.exists('.env'):
        print("✅ .env file found")
        try:
            with open('.env', 'r') as f:
                env_content = f.read()
            
            required_vars = ['DB_USER=pfmt_user', 'DB_NAME=pfmt_integrated', 'DB_PASSWORD=']
            for var in required_vars:
                if var in env_content:
                    print(f"✅ {var.split('=')[0]} is configured")
                else:
                    print(f"❌ {var.split('=')[0]} not found or incorrect")
        except Exception as e:
            print(f"❌ Error reading .env file: {e}")
    else:
        print("❌ .env file not found")
    
    # Check docker-compose.yml
    if os.path.exists('docker-compose.yml'):
        print("✅ docker-compose.yml found")
        try:
            with open('docker-compose.yml', 'r') as f:
                compose_content = f.read()
            
            if 'fix_uuid_schema.sql' in compose_content:
                print("❌ CRITICAL: fix_uuid_schema.sql reference still present!")
            else:
                print("✅ No problematic file references found")
                
        except Exception as e:
            print(f"❌ Error reading docker-compose.yml: {e}")
    else:
        print("❌ docker-compose.yml not found")

def check_application_logs():
    """Check application logs for specific errors"""
    print("\n" + "="*60)
    print("📋 APPLICATION LOG ANALYSIS")
    print("="*60)
    
    # Common error patterns to look for
    error_patterns = [
        "role \"pfmt_user\" does not exist",
        "password authentication failed",
        "connection refused",
        "ECONNREFUSED",
        "Error initializing wizard",
        "Failed to initialize project wizard",
        "Cannot connect to database",
        "FATAL:",
        "ERROR:",
    ]
    
    containers = ["pfmt-backend", "pfmt-postgres", "pfmt-frontend"]
    
    for container in containers:
        print(f"\n🔍 Analyzing {container} logs for errors...")
        success, output = run_command(f"docker logs {container} --tail 50", f"Getting {container} logs")
        
        if success and output:
            found_errors = []
            for pattern in error_patterns:
                if pattern.lower() in output.lower():
                    found_errors.append(pattern)
            
            if found_errors:
                print(f"❌ Found error patterns in {container}:")
                for error in found_errors:
                    print(f"   - {error}")
            else:
                print(f"✅ No critical error patterns found in {container}")

def test_wizard_functionality():
    """Test wizard functionality with detailed requests"""
    print("\n" + "="*60)
    print("🧙 WIZARD FUNCTIONALITY TESTING")
    print("="*60)
    
    # Test wizard initialization with detailed output
    print("\n🔍 Testing wizard initialization with full response...")
    success, output = run_command(
        "curl -s -X POST -H 'Content-Type: application/json' http://localhost:3002/api/wizard/init",
        "Wizard init with full response"
    )
    
    if success and output:
        try:
            response = json.loads(output)
            print("📋 Wizard Response:")
            print(json.dumps(response, indent=2))
            
            if response.get('success'):
                print("✅ Wizard initialization successful")
            else:
                print("❌ Wizard initialization failed")
                if 'message' in response:
                    print(f"Error message: {response['message']}")
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response: {output}")
    
    # Test template fetching
    print("\n🔍 Testing template fetching...")
    success, output = run_command(
        "curl -s http://localhost:3002/api/wizard/templates",
        "Fetching wizard templates"
    )
    
    if success and output:
        try:
            response = json.loads(output)
            if response.get('success') and response.get('templates'):
                print(f"✅ Found {len(response['templates'])} templates")
                for template in response['templates'][:3]:  # Show first 3
                    print(f"   - {template.get('name', 'Unknown')} ({template.get('category', 'No category')})")
            else:
                print("❌ No templates found or error occurred")
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response: {output}")

def generate_diagnostic_report():
    """Generate a comprehensive diagnostic report"""
    print("\n" + "="*80)
    print("📊 PFMT WIZARD DIAGNOSTIC REPORT")
    print("="*80)
    
    print("This diagnostic script has tested the following areas:")
    print("1. ✅ Docker container status and logs")
    print("2. ✅ Database connection and user authentication") 
    print("3. ✅ API endpoint availability and responses")
    print("4. ✅ Environment configuration files")
    print("5. ✅ Application log analysis for error patterns")
    print("6. ✅ Wizard functionality end-to-end testing")
    
    print("\n📋 NEXT STEPS:")
    print("1. Review the output above for any ❌ FAILED items")
    print("2. Check specific error messages in the log analysis section")
    print("3. Verify that all containers are running properly")
    print("4. Test API endpoints manually if needed")
    print("5. Provide this diagnostic output to support for further analysis")
    
    print("\n💡 COMMON ISSUES TO CHECK:")
    print("- Are all Docker containers running?")
    print("- Is the database accepting connections?")
    print("- Are API endpoints responding correctly?")
    print("- Are there any authentication/authorization errors?")
    print("- Is the frontend properly configured to call the backend?")

def main():
    """Main diagnostic function"""
    print("🔧 PFMT Project Wizard Diagnostic Tool")
    print("This tool will help identify remaining issues after the database schema fix")
    print("="*80)
    
    # Change to the project directory if it exists
    if os.path.exists('/home/ubuntu/pfmt_complete_application'):
        os.chdir('/home/ubuntu/pfmt_complete_application')
        print(f"📁 Working directory: {os.getcwd()}")
    else:
        print("⚠️  Project directory not found, running from current location")
        print(f"📁 Working directory: {os.getcwd()}")
    
    # Run all diagnostic checks
    try:
        check_docker_status()
        check_database_connection()
        check_api_endpoints()
        check_environment_config()
        check_application_logs()
        test_wizard_functionality()
        generate_diagnostic_report()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Diagnostic interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Diagnostic failed with error: {e}")
        sys.exit(1)
    
    print("\n✅ Diagnostic complete!")

if __name__ == "__main__":
    main()

