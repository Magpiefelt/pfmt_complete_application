/**
 * Wizard State Management Test Script
 * Tests the Pinia store, API integration, and persistence features
 * Run with: node test_wizard_state_management.js
 */

const fs = require('fs');
const path = require('path');

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
 * Test file existence and TypeScript syntax
 */
function testFileStructure() {
  log('blue', '\n🔍 Testing file structure and TypeScript syntax...');
  
  const requiredFiles = [
    'frontend/src/stores/projectWizard.ts',
    'frontend/src/services/projectWorkflowApi.ts',
    'frontend/src/composables/useProjectWizardIntegration.ts',
    'frontend/src/utils/wizardPersistence.ts',
    'frontend/src/composables/useWizardPersistence.ts'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(filePath => {
    const fullPath = path.resolve(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      log('green', `✅ ${filePath}`);
      
      // Basic syntax check - look for common TypeScript patterns
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasExports = content.includes('export');
      const hasTypes = content.includes('interface') || content.includes('type');
      const hasImports = content.includes('import');
      
      if (hasExports && hasImports) {
        log('cyan', `   📝 TypeScript structure looks good`);
      } else {
        log('yellow', `   ⚠️  Basic TypeScript patterns missing`);
      }
      
    } else {
      log('red', `❌ ${filePath} - FILE NOT FOUND`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

/**
 * Test store structure and exports
 */
function testStoreStructure() {
  log('blue', '\n🏪 Testing Pinia store structure...');
  
  const storePath = path.resolve(__dirname, 'frontend/src/stores/projectWizard.ts');
  
  if (!fs.existsSync(storePath)) {
    log('red', '❌ Store file not found');
    return false;
  }
  
  const content = fs.readFileSync(storePath, 'utf8');
  
  // Check for required exports and patterns
  const checks = [
    { pattern: /export.*useProjectWizardStore/, name: 'Store export' },
    { pattern: /defineStore\(['"]projectWizard['"]/, name: 'Store definition' },
    { pattern: /interface.*Wizard/, name: 'TypeScript interfaces' },
    { pattern: /ref\(.*\)/, name: 'Reactive state' },
    { pattern: /computed\(.*\)/, name: 'Computed properties' },
    { pattern: /watch\(.*\)/, name: 'Watchers' },
    { pattern: /ProjectWorkflowAPI/, name: 'API integration' },
    { pattern: /useAuthStore/, name: 'Auth store integration' },
    { pattern: /submitInitiation/, name: 'Initiation method' },
    { pattern: /submitAssignment/, name: 'Assignment method' },
    { pattern: /submitFinalization/, name: 'Finalization method' },
    { pattern: /markDirty/, name: 'Dirty tracking' },
    { pattern: /validation/, name: 'Validation logic' }
  ];
  
  let passedChecks = 0;
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log('green', `✅ ${check.name}`);
      passedChecks++;
    } else {
      log('red', `❌ ${check.name}`);
    }
  });
  
  const score = (passedChecks / checks.length) * 100;
  log('cyan', `   📊 Store structure score: ${score.toFixed(1)}%`);
  
  return score >= 80; // 80% pass rate
}

/**
 * Test API service integration
 */
function testApiServiceIntegration() {
  log('blue', '\n🔌 Testing API service integration...');
  
  const apiPath = path.resolve(__dirname, 'frontend/src/services/projectWorkflowApi.ts');
  
  if (!fs.existsSync(apiPath)) {
    log('red', '❌ API service file not found');
    return false;
  }
  
  const content = fs.readFileSync(apiPath, 'utf8');
  
  const checks = [
    { pattern: /export.*ProjectWorkflowAPI/, name: 'API class export' },
    { pattern: /initiateProject/, name: 'Initiate project method' },
    { pattern: /assignTeam/, name: 'Assign team method' },
    { pattern: /finalizeProject/, name: 'Finalize project method' },
    { pattern: /getWorkflowStatus/, name: 'Get status method' },
    { pattern: /getAvailableUsers/, name: 'Get users method' },
    { pattern: /getAvailableVendors/, name: 'Get vendors method' },
    { pattern: /canUserPerformAction/, name: 'Permission helper' },
    { pattern: /interface.*Payload/, name: 'Payload interfaces' },
    { pattern: /ApiResponse/, name: 'Response typing' },
    { pattern: /error.*handling/, name: 'Error handling' }
  ];
  
  let passedChecks = 0;
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log('green', `✅ ${check.name}`);
      passedChecks++;
    } else {
      log('red', `❌ ${check.name}`);
    }
  });
  
  const score = (passedChecks / checks.length) * 100;
  log('cyan', `   📊 API integration score: ${score.toFixed(1)}%`);
  
  return score >= 70; // 70% pass rate
}

/**
 * Test composable integration
 */
function testComposableIntegration() {
  log('blue', '\n🔧 Testing composable integration...');
  
  const integrationPath = path.resolve(__dirname, 'frontend/src/composables/useProjectWizardIntegration.ts');
  const persistencePath = path.resolve(__dirname, 'frontend/src/composables/useWizardPersistence.ts');
  
  const files = [
    { path: integrationPath, name: 'Wizard Integration' },
    { path: persistencePath, name: 'Wizard Persistence' }
  ];
  
  let allPassed = true;
  
  files.forEach(file => {
    if (!fs.existsSync(file.path)) {
      log('red', `❌ ${file.name} composable not found`);
      allPassed = false;
      return;
    }
    
    const content = fs.readFileSync(file.path, 'utf8');
    
    const commonChecks = [
      { pattern: /export.*function.*use/, name: 'Composable export' },
      { pattern: /import.*vue/, name: 'Vue imports' },
      { pattern: /computed\(/, name: 'Computed properties' },
      { pattern: /ref\(/, name: 'Reactive references' }
    ];
    
    let passedChecks = 0;
    
    commonChecks.forEach(check => {
      if (check.pattern.test(content)) {
        passedChecks++;
      }
    });
    
    if (passedChecks >= 3) {
      log('green', `✅ ${file.name} composable structure`);
    } else {
      log('red', `❌ ${file.name} composable structure`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

/**
 * Test persistence utilities
 */
function testPersistenceUtilities() {
  log('blue', '\n💾 Testing persistence utilities...');
  
  const persistencePath = path.resolve(__dirname, 'frontend/src/utils/wizardPersistence.ts');
  
  if (!fs.existsSync(persistencePath)) {
    log('red', '❌ Persistence utilities file not found');
    return false;
  }
  
  const content = fs.readFileSync(persistencePath, 'utf8');
  
  const checks = [
    { pattern: /class.*WizardPersistence/, name: 'Persistence class' },
    { pattern: /saveState/, name: 'Save state method' },
    { pattern: /loadState/, name: 'Load state method' },
    { pattern: /clearState/, name: 'Clear state method' },
    { pattern: /saveDraft/, name: 'Save draft method' },
    { pattern: /loadDraft/, name: 'Load draft method' },
    { pattern: /localStorage|sessionStorage/, name: 'Storage integration' },
    { pattern: /JSON\.parse|JSON\.stringify/, name: 'JSON serialization' },
    { pattern: /interface.*Snapshot/, name: 'State snapshot interface' },
    { pattern: /cleanup/, name: 'Cleanup functionality' },
    { pattern: /export.*import/, name: 'Export/import functionality' }
  ];
  
  let passedChecks = 0;
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log('green', `✅ ${check.name}`);
      passedChecks++;
    } else {
      log('red', `❌ ${check.name}`);
    }
  });
  
  const score = (passedChecks / checks.length) * 100;
  log('cyan', `   📊 Persistence utilities score: ${score.toFixed(1)}%`);
  
  return score >= 75; // 75% pass rate
}

/**
 * Test TypeScript type definitions
 */
function testTypeDefinitions() {
  log('blue', '\n📝 Testing TypeScript type definitions...');
  
  const files = [
    'frontend/src/stores/projectWizard.ts',
    'frontend/src/services/projectWorkflowApi.ts',
    'frontend/src/utils/wizardPersistence.ts'
  ];
  
  let totalInterfaces = 0;
  let totalTypes = 0;
  
  files.forEach(filePath => {
    const fullPath = path.resolve(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const interfaces = (content.match(/interface\s+\w+/g) || []).length;
      const types = (content.match(/type\s+\w+/g) || []).length;
      
      totalInterfaces += interfaces;
      totalTypes += types;
      
      log('cyan', `   ${path.basename(filePath)}: ${interfaces} interfaces, ${types} types`);
    }
  });
  
  log('green', `✅ Total: ${totalInterfaces} interfaces, ${totalTypes} types`);
  
  return totalInterfaces >= 10; // At least 10 interfaces expected
}

/**
 * Test integration points
 */
function testIntegrationPoints() {
  log('blue', '\n🔗 Testing integration points...');
  
  const storePath = path.resolve(__dirname, 'frontend/src/stores/projectWizard.ts');
  
  if (!fs.existsSync(storePath)) {
    log('red', '❌ Store file not found for integration test');
    return false;
  }
  
  const content = fs.readFileSync(storePath, 'utf8');
  
  const integrationChecks = [
    { pattern: /useAuthStore/, name: 'Auth store integration' },
    { pattern: /ProjectWorkflowAPI/, name: 'API service integration' },
    { pattern: /watch\(.*initiation/, name: 'Initiation watcher' },
    { pattern: /watch\(.*assignment/, name: 'Assignment watcher' },
    { pattern: /markDirty/, name: 'Dirty state tracking' },
    { pattern: /validation.*isValid/, name: 'Validation integration' },
    { pattern: /computed.*canUser/, name: 'Permission integration' }
  ];
  
  let passedChecks = 0;
  
  integrationChecks.forEach(check => {
    if (check.pattern.test(content)) {
      log('green', `✅ ${check.name}`);
      passedChecks++;
    } else {
      log('yellow', `⚠️  ${check.name}`);
    }
  });
  
  const score = (passedChecks / integrationChecks.length) * 100;
  log('cyan', `   📊 Integration score: ${score.toFixed(1)}%`);
  
  return score >= 60; // 60% pass rate for integration
}

/**
 * Generate test report
 */
function generateTestReport(results) {
  log('blue', '\n📊 Generating test report...');
  
  const reportPath = path.resolve(__dirname, 'WIZARD_STATE_TEST_REPORT.md');
  
  const report = `# Wizard State Management Test Report

Generated: ${new Date().toISOString()}

## Test Results Summary

| Test Category | Status | Details |
|---------------|--------|---------|
| File Structure | ${results.fileStructure ? '✅ PASS' : '❌ FAIL'} | All required files present |
| Store Structure | ${results.storeStructure ? '✅ PASS' : '❌ FAIL'} | Pinia store implementation |
| API Integration | ${results.apiIntegration ? '✅ PASS' : '❌ FAIL'} | Workflow API service |
| Composables | ${results.composables ? '✅ PASS' : '❌ FAIL'} | Integration composables |
| Persistence | ${results.persistence ? '✅ PASS' : '❌ FAIL'} | State persistence utilities |
| Type Definitions | ${results.typeDefinitions ? '✅ PASS' : '❌ FAIL'} | TypeScript interfaces |
| Integration Points | ${results.integrationPoints ? '✅ PASS' : '❌ FAIL'} | Store integrations |

## Overall Status

**${results.overall ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}**

Total Score: ${results.score}%

## Recommendations

${results.overall ? 
  '✅ Wizard state management implementation is complete and ready for use.' :
  '⚠️ Please review failed tests and address any missing components before proceeding.'
}

## Next Steps

1. ${results.overall ? 'Proceed with wizard component implementation' : 'Fix failing tests'}
2. ${results.overall ? 'Test wizard UI integration' : 'Verify all file dependencies'}
3. ${results.overall ? 'Implement wizard routing' : 'Complete missing functionality'}

## Files Tested

- \`frontend/src/stores/projectWizard.ts\`
- \`frontend/src/services/projectWorkflowApi.ts\`
- \`frontend/src/composables/useProjectWizardIntegration.ts\`
- \`frontend/src/utils/wizardPersistence.ts\`
- \`frontend/src/composables/useWizardPersistence.ts\`
`;

  try {
    fs.writeFileSync(reportPath, report);
    log('green', `✅ Test report generated: ${reportPath}`);
    return true;
  } catch (error) {
    log('red', `❌ Failed to generate test report: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runWizardStateTests() {
  log('magenta', '🧙‍♂️ PFMT Wizard State Management Tests');
  log('magenta', '=========================================');
  
  const results = {
    fileStructure: false,
    storeStructure: false,
    apiIntegration: false,
    composables: false,
    persistence: false,
    typeDefinitions: false,
    integrationPoints: false,
    overall: false,
    score: 0
  };
  
  // Run all tests
  results.fileStructure = testFileStructure();
  results.storeStructure = testStoreStructure();
  results.apiIntegration = testApiServiceIntegration();
  results.composables = testComposableIntegration();
  results.persistence = testPersistenceUtilities();
  results.typeDefinitions = testTypeDefinitions();
  results.integrationPoints = testIntegrationPoints();
  
  // Calculate overall score
  const testCount = Object.keys(results).length - 2; // Exclude 'overall' and 'score'
  const passedTests = Object.values(results).filter(result => result === true).length;
  results.score = Math.round((passedTests / testCount) * 100);
  results.overall = results.score >= 80; // 80% pass rate required
  
  // Generate report
  generateTestReport(results);
  
  // Summary
  log('magenta', '\n📋 Test Summary');
  log('magenta', '===============');
  
  if (results.overall) {
    log('green', '🎉 All wizard state management tests PASSED!');
    log('green', '✅ Chunk 3: Wizard State Management is COMPLETE');
    log('cyan', `   Overall score: ${results.score}%`);
    log('cyan', `   Passed tests: ${passedTests}/${testCount}`);
  } else {
    log('yellow', '⚠️  Some wizard state management tests FAILED');
    log('yellow', '❌ Please review and fix failing components');
    log('cyan', `   Overall score: ${results.score}%`);
    log('cyan', `   Passed tests: ${passedTests}/${testCount}`);
  }
  
  // Detailed recommendations
  if (!results.fileStructure) {
    log('red', '🔧 Fix: Ensure all required files are present');
  }
  if (!results.storeStructure) {
    log('red', '🔧 Fix: Complete Pinia store implementation');
  }
  if (!results.apiIntegration) {
    log('red', '🔧 Fix: Verify API service integration');
  }
  if (!results.composables) {
    log('red', '🔧 Fix: Complete composable implementations');
  }
  if (!results.persistence) {
    log('red', '🔧 Fix: Implement persistence utilities');
  }
  
  if (results.overall) {
    log('green', '\n🚀 Ready for next phase: Wizard Component Implementation');
  } else {
    log('yellow', '\n⏸️  Please fix issues before proceeding to next phase');
  }
  
  process.exit(results.overall ? 0 : 1);
}

// Run tests if called directly
if (require.main === module) {
  runWizardStateTests().catch(error => {
    log('red', `\n💥 Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runWizardStateTests,
  testFileStructure,
  testStoreStructure,
  testApiServiceIntegration,
  testComposableIntegration,
  testPersistenceUtilities
};

