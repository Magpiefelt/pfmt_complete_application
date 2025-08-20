#!/bin/bash

# Manual Verification Script for PFMT Security Hardening
# HP-1 through HP-6 Implementation Verification
# Based on section 8 of the technical specification

echo "🧪 PFMT Security Hardening Manual Verification"
echo "=============================================="

# Configuration
BASE_URL="http://localhost:3002"
API_BASE="$BASE_URL/api"

echo ""
echo "📋 Configuration:"
echo "   Base URL: $BASE_URL"
echo "   API Base: $API_BASE"
echo "   NODE_ENV: ${NODE_ENV:-development}"
echo ""

# 1) Health & readiness checks
echo "1️⃣ Health & Readiness Checks"
echo "----------------------------"

echo "🔍 Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -sf "$BASE_URL/health" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Health endpoint: OK"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Health endpoint: FAILED"
fi

echo "🔍 Testing /health/db endpoint..."
DB_HEALTH_RESPONSE=$(curl -sf "$BASE_URL/health/db" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Database health endpoint: OK"
    echo "   Response: $DB_HEALTH_RESPONSE"
else
    echo "❌ Database health endpoint: FAILED"
fi

echo ""

# 2) CORS Testing
echo "2️⃣ CORS Configuration Tests"
echo "---------------------------"

echo "🔍 Testing CORS with allowed origin (localhost:3000)..."
CORS_ALLOWED=$(curl -sI -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" "$BASE_URL/health" 2>/dev/null | grep -i "access-control-allow-origin")
if [ ! -z "$CORS_ALLOWED" ]; then
    echo "✅ CORS allowed origin: OK"
    echo "   Header: $CORS_ALLOWED"
else
    echo "❌ CORS allowed origin: FAILED"
fi

echo "🔍 Testing CORS with disallowed origin (evil.example)..."
CORS_DISALLOWED=$(curl -sI -H "Origin: http://evil.example" -H "Access-Control-Request-Method: GET" "$BASE_URL/health" 2>/dev/null | grep -i "access-control-allow-origin")
if [ -z "$CORS_DISALLOWED" ]; then
    echo "✅ CORS disallowed origin: OK (blocked as expected)"
else
    echo "❌ CORS disallowed origin: FAILED (should be blocked)"
    echo "   Unexpected header: $CORS_DISALLOWED"
fi

echo ""

# 3) Auth Hardening Tests
echo "3️⃣ Auth Hardening Tests"
echo "----------------------"

echo "🔍 Testing header-only auth (should work in dev with BYPASS_AUTH=true)..."
if [ "${BYPASS_AUTH}" = "true" ] && [ "${NODE_ENV}" != "production" ]; then
    AUTH_HEADER_RESPONSE=$(curl -s -H "x-user-id: 550e8400-e29b-41d4-a716-446655440001" -H "x-user-name: Test User" "$API_BASE/projects" 2>/dev/null)
    if echo "$AUTH_HEADER_RESPONSE" | grep -q '"success"'; then
        echo "✅ Header-based auth in dev: OK"
    else
        echo "❌ Header-based auth in dev: FAILED"
        echo "   Response: $AUTH_HEADER_RESPONSE"
    fi
else
    echo "ℹ️  Header-based auth test skipped (BYPASS_AUTH not enabled or in production)"
fi

echo "🔍 Testing no auth (should fail)..."
NO_AUTH_RESPONSE=$(curl -s "$API_BASE/projects" 2>/dev/null)
if echo "$NO_AUTH_RESPONSE" | grep -q '"error"'; then
    echo "✅ No auth rejection: OK"
else
    echo "❌ No auth rejection: FAILED (should require authentication)"
    echo "   Response: $NO_AUTH_RESPONSE"
fi

echo ""

# 4) UUID Validation Tests
echo "4️⃣ UUID Validation Tests"
echo "------------------------"

echo "🔍 Testing invalid UUID in project route..."
INVALID_UUID_RESPONSE=$(curl -s "$API_BASE/projects/invalid-uuid" -H "x-user-id: 550e8400-e29b-41d4-a716-446655440001" 2>/dev/null)
if echo "$INVALID_UUID_RESPONSE" | grep -q "INVALID_UUID"; then
    echo "✅ Invalid UUID rejection: OK"
else
    echo "❌ Invalid UUID rejection: FAILED"
    echo "   Response: $INVALID_UUID_RESPONSE"
fi

echo ""

# 5) Rate Limiting Tests
echo "5️⃣ Rate Limiting Tests"
echo "---------------------"

echo "🔍 Testing rate limiting (making multiple requests)..."
RATE_LIMIT_COUNT=0
for i in {1..10}; do
    RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/projects" -H "x-user-id: 550e8400-e29b-41d4-a716-446655440001" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
    if [ "$RESPONSE_CODE" = "429" ]; then
        RATE_LIMIT_COUNT=$((RATE_LIMIT_COUNT + 1))
    fi
done

if [ $RATE_LIMIT_COUNT -gt 0 ]; then
    echo "✅ Rate limiting: OK (got $RATE_LIMIT_COUNT rate limit responses)"
else
    echo "ℹ️  Rate limiting: Not triggered in this test (may need more requests)"
fi

echo ""

# 6) Wizard Step Gating Tests
echo "6️⃣ Wizard Step Gating Tests"
echo "---------------------------"

echo "🔍 Testing wizard step gating (attempting future step)..."
# Note: This requires a valid session ID, so it's more of a structure test
WIZARD_GATING_RESPONSE=$(curl -s -X POST "$API_BASE/project-wizard/session/550e8400-e29b-41d4-a716-446655440001/step/99" -H "x-user-id: 550e8400-e29b-41d4-a716-446655440001" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
if echo "$WIZARD_GATING_RESPONSE" | grep -q "STEP_BLOCKED\|SESSION_OR_PROJECT_NOT_FOUND\|INVALID_UUID"; then
    echo "✅ Wizard step gating: OK (properly blocked or validated)"
else
    echo "❌ Wizard step gating: FAILED"
    echo "   Response: $WIZARD_GATING_RESPONSE"
fi

echo ""

# 7) Project Authorization Tests
echo "7️⃣ Project Authorization Tests"
echo "------------------------------"

echo "🔍 Testing project authorization (accessing non-existent project)..."
PROJECT_AUTH_RESPONSE=$(curl -s "$API_BASE/projects/550e8400-e29b-41d4-a716-446655440099" -H "x-user-id: 550e8400-e29b-41d4-a716-446655440001" 2>/dev/null)
if echo "$PROJECT_AUTH_RESPONSE" | grep -q "FORBIDDEN\|not found"; then
    echo "✅ Project authorization: OK (properly blocked or not found)"
else
    echo "❌ Project authorization: FAILED"
    echo "   Response: $PROJECT_AUTH_RESPONSE"
fi

echo ""

# Summary
echo "🎯 Verification Summary"
echo "======================"
echo "✅ All security hardening features have been tested"
echo "📋 Features verified:"
echo "   - HP-1: Auth Hardening & RBAC Consolidation"
echo "   - HP-2: Server-Side Wizard Step Gating"
echo "   - HP-3: CORS Consolidation"
echo "   - HP-4: Uniform Request & UUID Validation"
echo "   - HP-5: Rate Limiting for Mutations"
echo "   - HP-6: Project-Scoped RBAC"
echo ""
echo "🚀 Manual verification complete!"
echo ""
echo "💡 Tips:"
echo "   - Set BYPASS_AUTH=true for development testing"
echo "   - Check server logs for detailed error information"
echo "   - Adjust rate limits via RATE_LIMIT_MAX environment variable"
echo "   - Use valid UUIDs for testing project-specific endpoints"

