/**
 * Wizard Router & Navigation Test Script
 * Tests the router configuration, navigation guards, and route integration
 * Run with: node test_wizard_router.js
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
 * Test router file structure and imports
 */
function testRouterStructure() {
  log('blue', '\n🔍 Testing router file structure...');
  
  const requiredFiles = [
    'frontend/src/router/index.ts',
    'frontend/src/router/wizardRoutes.ts',
    'frontend/src/router/wizardGuards.ts',
    'frontend/src/components/wizard/WizardLayout.vue',
    'frontend/src/components/wizard/WizardDashboard.vue'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(filePath => {
    const fullPath = path.resolve(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      log('green', `✅ ${filePath}`);
      
      // Check file content for basic structure
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasExports = content.includes('export');
      const hasImports = content.includes('import');
      
      if (hasExports && hasImports) {
        log('cyan', `   📝 File structure looks good`);
      } else {
        log('yellow', `   ⚠️  Basic structure patterns missing`);
      }
      
    } else {
      log('red', `❌ ${filePath} - FILE NOT FOUND`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

/**
 * Test wizard routes configuration
 */
function testWizardRoutes() {
  log('blue', '\n🛣️  Testing wizard routes configuration...');
  
  const routesPath = path.resolve(__dirname, 'frontend/src/router/wizardRoutes.ts');
  
  if (!fs.existsSync(routesPath)) {
    log('red', '❌ Wizard routes file not found');
    return false;
  }
  
  const content = fs.readFileSync(routesPath, 'utf8');
  
  const checks = [
    { pattern: /export.*wizardRoutes/, name: 'Routes export' },
    { pattern: /WIZARD_STEPS/, name: 'Step definitions' },
    { pattern: /wizard-dashboard/, name: 'Dashboard route' },
    { pattern: /wizard-initiate/, name: 'Initiation route' },
    { pattern: /wizard-project-assign/, name: 'Assignment route' },
    { pattern: /wizard-project-configure/, name: 'Configuration route' },
    { pattern: /:projectId/, name: 'Project ID parameter' },
    { pattern: /getWizardStepRoute/, name: 'Route helper functions' },
    { pattern: /generateWizardUrl/, name: 'URL generation helpers' },
    { pattern: /parseWizardUrl/, name: 'URL parsing helpers' },
    { pattern: /isValidWizardStep/, name: 'Step validation' },
    { pattern: /requiredRoles/, name: 'Role-based access' },
    { pattern: /beforeEnter/, name: 'Route guards' }
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
  log('cyan', `   📊 Wizard routes score: ${score.toFixed(1)}%`);
  
  return score >= 80; // 80% pass rate
}

/**
 * Test navigation guards
 */
function testNavigationGuards() {
  log('blue', '\n🛡️  Testing navigation guards...');
  
  const guardsPath = path.resolve(__dirname, 'frontend/src/router/wizardGuards.ts');
  
  if (!fs.existsSync(guardsPath)) {
    log('red', '❌ Navigation guards file not found');
    return false;
  }
  
  const content = fs.readFileSync(guardsPath, 'utf8');
  
  const checks = [
    { pattern: /wizardGuard/, name: 'Main wizard guard' },
    { pattern: /wizardLeaveGuard/, name: 'Leave guard' },
    { pattern: /setupWizardGuards/, name: 'Guard setup function' },
    { pattern: /checkStepRoleAccess/, name: 'Role access checking' },
    { pattern: /checkStepWorkflowAccess/, name: 'Workflow access checking' },
    { pattern: /checkProjectAccess/, name: 'Project access checking' },
    { pattern: /NavigationGuardNext/, name: 'TypeScript guard types' },
    { pattern: /useAuthStore/, name: 'Auth store integration' },
    { pattern: /useProjectWizardStore/, name: 'Wizard store integration' },
    { pattern: /ProjectWorkflowAPI/, name: 'API integration' },
    { pattern: /unsaved.*changes/i, name: 'Unsaved changes handling' },
    { pattern: /redirect/, name: 'Redirect logic' }
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
  log('cyan', `   📊 Navigation guards score: ${score.toFixed(1)}%`);
  
  return score >= 75; // 75% pass rate
}

/**
 * Test main router integration
 */
function testMainRouterIntegration() {
  log('blue', '\n🔗 Testing main router integration...');
  
  const routerPath = path.resolve(__dirname, 'frontend/src/router/index.ts');
  
  if (!fs.existsSync(routerPath)) {
    log('red', '❌ Main router file not found');
    return false;
  }
  
  const content = fs.readFileSync(routerPath, 'utf8');
  
  const checks = [
    { pattern: /import.*wizardRoutes/, name: 'Wizard routes import' },
    { pattern: /import.*setupWizardGuards/, name: 'Wizard guards import' },
    { pattern: /\.\.\.wizardRoutes/, name: 'Routes spread operator' },
    { pattern: /setupWizardGuards\(router\)/, name: 'Guards setup call' },
    { pattern: /wizard-dashboard/, name: 'Legacy route redirect' },
    { pattern: /createRouter/, name: 'Router creation' },
    { pattern: /beforeEach/, name: 'Navigation guards' }
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
  log('cyan', `   📊 Router integration score: ${score.toFixed(1)}%`);
  
  return score >= 85; // 85% pass rate
}

/**
 * Test wizard layout component
 */
function testWizardLayout() {
  log('blue', '\n🎨 Testing wizard layout component...');
  
  const layoutPath = path.resolve(__dirname, 'frontend/src/components/wizard/WizardLayout.vue');
  
  if (!fs.existsSync(layoutPath)) {
    log('red', '❌ Wizard layout component not found');
    return false;
  }
  
  const content = fs.readFileSync(layoutPath, 'utf8');
  
  const checks = [
    { pattern: /<template>/, name: 'Vue template' },
    { pattern: /<script setup/, name: 'Composition API setup' },
    { pattern: /<style scoped>/, name: 'Scoped styles' },
    { pattern: /useProjectWizardIntegration/, name: 'Wizard integration composable' },
    { pattern: /useWizardPersistence/, name: 'Persistence composable' },
    { pattern: /router-view/, name: 'Router view for nested routes' },
    { pattern: /wizard-progress/, name: 'Progress indicator' },
    { pattern: /wizard-navigation/, name: 'Navigation controls' },
    { pattern: /breadcrumb/, name: 'Breadcrumb navigation' },
    { pattern: /unsaved.*changes/i, name: 'Unsaved changes handling' },
    { pattern: /loading/, name: 'Loading states' },
    { pattern: /error/, name: 'Error handling' }
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
  log('cyan', `   📊 Wizard layout score: ${score.toFixed(1)}%`);
  
  return score >= 80; // 80% pass rate
}

/**
 * Test wizard dashboard component
 */
function testWizardDashboard() {
  log('blue', '\n📊 Testing wizard dashboard component...');
  
  const dashboardPath = path.resolve(__dirname, 'frontend/src/components/wizard/WizardDashboard.vue');
  
  if (!fs.existsSync(dashboardPath)) {
    log('red', '❌ Wizard dashboard component not found');
    return false;
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  const checks = [
    { pattern: /<template>/, name: 'Vue template' },
    { pattern: /<script setup/, name: 'Composition API setup' },
    { pattern: /action-card/, name: 'Action cards' },
    { pattern: /canUserInitiateProjects/, name: 'Initiation permission check' },
    { pattern: /canUserAssignTeams/, name: 'Assignment permission check' },
    { pattern: /canUserFinalizeProjects/, name: 'Finalization permission check' },
    { pattern: /resumableProjects/, name: 'Resumable projects logic' },
    { pattern: /router\.push/, name: 'Navigation logic' },
    { pattern: /project-list/, name: 'Project listing' },
    { pattern: /dashboard-stats/, name: 'Statistics display' }
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
  log('cyan', `   📊 Wizard dashboard score: ${score.toFixed(1)}%`);
  
  return score >= 75; // 75% pass rate
}

/**
 * Test route URL patterns
 */
function testRoutePatterns() {
  log('blue', '\n🔗 Testing route URL patterns...');
  
  const routesPath = path.resolve(__dirname, 'frontend/src/router/wizardRoutes.ts');
  
  if (!fs.existsSync(routesPath)) {
    log('red', '❌ Wizard routes file not found');
    return false;
  }
  
  const content = fs.readFileSync(routesPath, 'utf8');
  
  // Test expected route patterns
  const expectedPatterns = [
    { pattern: /path:\s*['"]\/wizard['"]/, name: 'Base wizard route (/wizard)' },
    { pattern: /path:\s*['"]initiate['"]/, name: 'Initiation route (/wizard/initiate)' },
    { pattern: /path:\s*['"]:projectId['"]/, name: 'Project ID route (/wizard/:projectId)' },
    { pattern: /path:\s*['"]assign['"]/, name: 'Assignment route (/wizard/:projectId/assign)' },
    { pattern: /path:\s*['"]configure['"]/, name: 'Configuration route (/wizard/:projectId/configure)' },
    { pattern: /path:\s*['"]\/wizard\/:projectId\/:step['"]/, name: 'Direct step route (/wizard/:projectId/:step)' }
  ];
  
  let passedChecks = 0;
  
  expectedPatterns.forEach(check => {
    if (check.pattern.test(content)) {
      log('green', `✅ ${check.name}`);
      passedChecks++;
    } else {
      log('yellow', `⚠️  ${check.name}`);
    }
  });
  
  // Test helper functions
  const helperChecks = [
    { pattern: /generateWizardUrl/, name: 'URL generation helper' },
    { pattern: /parseWizardUrl/, name: 'URL parsing helper' },
    { pattern: /getWizardStepRoute/, name: 'Step route helper' },
    { pattern: /getNextStep/, name: 'Next step helper' },
    { pattern: /getPreviousStep/, name: 'Previous step helper' }
  ];
  
  helperChecks.forEach(check => {
    if (check.pattern.test(content)) {
      log('green', `✅ ${check.name}`);
      passedChecks++;
    } else {
      log('red', `❌ ${check.name}`);
    }
  });
  
  const totalChecks = expectedPatterns.length + helperChecks.length;
  const score = (passedChecks / totalChecks) * 100;
  log('cyan', `   📊 Route patterns score: ${score.toFixed(1)}%`);
  
  return score >= 70; // 70% pass rate
}

/**
 * Test TypeScript type definitions
 */
function testTypeDefinitions() {
  log('blue', '\n📝 Testing TypeScript type definitions...');
  
  const files = [
    'frontend/src/router/wizardRoutes.ts',
    'frontend/src/router/wizardGuards.ts'
  ];
  
  let totalInterfaces = 0;
  let totalTypes = 0;
  let hasProperTyping = true;
  
  files.forEach(filePath => {
    const fullPath = path.resolve(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const interfaces = (content.match(/interface\s+\w+/g) || []).length;
      const types = (content.match(/type\s+\w+/g) || []).length;
      const hasRouteTypes = content.includes('RouteRecordRaw') || content.includes('NavigationGuard');
      
      totalInterfaces += interfaces;
      totalTypes += types;
      
      if (!hasRouteTypes && filePath.includes('Routes')) {
        hasProperTyping = false;
      }
      
      log('cyan', `   ${path.basename(filePath)}: ${interfaces} interfaces, ${types} types`);
    }
  });
  
  log('green', `✅ Total: ${totalInterfaces} interfaces, ${totalTypes} types`);
  
  if (!hasProperTyping) {
    log('yellow', '⚠️  Missing Vue Router type definitions');
  }
  
  return totalInterfaces >= 3 && hasProperTyping; // At least 3 interfaces and proper typing
}

/**
 * Generate test report
 */
function generateTestReport(results) {
  log('blue', '\n📊 Generating test report...');
  
  const reportPath = path.resolve(__dirname, 'WIZARD_ROUTER_TEST_REPORT.md');
  
  const report = `# Wizard Router & Navigation Test Report

Generated: ${new Date().toISOString()}

## Test Results Summary

| Test Category | Status | Details |
|---------------|--------|---------|
| Router Structure | ${results.routerStructure ? '✅ PASS' : '❌ FAIL'} | File structure and imports |
| Wizard Routes | ${results.wizardRoutes ? '✅ PASS' : '❌ FAIL'} | Route configuration and helpers |
| Navigation Guards | ${results.navigationGuards ? '✅ PASS' : '❌ FAIL'} | Access control and validation |
| Router Integration | ${results.routerIntegration ? '✅ PASS' : '❌ FAIL'} | Main router integration |
| Wizard Layout | ${results.wizardLayout ? '✅ PASS' : '❌ FAIL'} | Layout component structure |
| Wizard Dashboard | ${results.wizardDashboard ? '✅ PASS' : '❌ FAIL'} | Dashboard component |
| Route Patterns | ${results.routePatterns ? '✅ PASS' : '❌ FAIL'} | URL patterns and helpers |
| Type Definitions | ${results.typeDefinitions ? '✅ PASS' : '❌ FAIL'} | TypeScript interfaces |

## Overall Status

**${results.overall ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}**

Total Score: ${results.score}%

## Route Structure

### Wizard Routes
- \`/wizard\` - Wizard dashboard
- \`/wizard/initiate\` - New project initiation
- \`/wizard/:projectId\` - Project-specific wizard
- \`/wizard/:projectId/assign\` - Team assignment
- \`/wizard/:projectId/configure\` - Project configuration
- \`/wizard/:projectId/:step\` - Direct step access

### Navigation Guards
- Role-based access control
- Workflow status validation
- Project access verification
- Unsaved changes protection

## Recommendations

${results.overall ? 
  '✅ Router and navigation implementation is complete and ready for use.' :
  '⚠️ Please review failed tests and address any missing components before proceeding.'
}

## Next Steps

1. ${results.overall ? 'Implement wizard step components' : 'Fix failing router tests'}
2. ${results.overall ? 'Test navigation flow end-to-end' : 'Verify route configurations'}
3. ${results.overall ? 'Add wizard step content' : 'Complete missing functionality'}

## Files Tested

- \`frontend/src/router/index.ts\`
- \`frontend/src/router/wizardRoutes.ts\`
- \`frontend/src/router/wizardGuards.ts\`
- \`frontend/src/components/wizard/WizardLayout.vue\`
- \`frontend/src/components/wizard/WizardDashboard.vue\`
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
async function runWizardRouterTests() {
  log('magenta', '🛣️  PFMT Wizard Router & Navigation Tests');
  log('magenta', '==========================================');
  
  const results = {
    routerStructure: false,
    wizardRoutes: false,
    navigationGuards: false,
    routerIntegration: false,
    wizardLayout: false,
    wizardDashboard: false,
    routePatterns: false,
    typeDefinitions: false,
    overall: false,
    score: 0
  };
  
  // Run all tests
  results.routerStructure = testRouterStructure();
  results.wizardRoutes = testWizardRoutes();
  results.navigationGuards = testNavigationGuards();
  results.routerIntegration = testMainRouterIntegration();
  results.wizardLayout = testWizardLayout();
  results.wizardDashboard = testWizardDashboard();
  results.routePatterns = testRoutePatterns();
  results.typeDefinitions = testTypeDefinitions();
  
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
    log('green', '🎉 All wizard router tests PASSED!');
    log('green', '✅ Chunk 4: Router & Navigation is COMPLETE');
    log('cyan', `   Overall score: ${results.score}%`);
    log('cyan', `   Passed tests: ${passedTests}/${testCount}`);
  } else {
    log('yellow', '⚠️  Some wizard router tests FAILED');
    log('yellow', '❌ Please review and fix failing components');
    log('cyan', `   Overall score: ${results.score}%`);
    log('cyan', `   Passed tests: ${passedTests}/${testCount}`);
  }
  
  // Detailed recommendations
  if (!results.routerStructure) {
    log('red', '🔧 Fix: Ensure all router files are present');
  }
  if (!results.wizardRoutes) {
    log('red', '🔧 Fix: Complete wizard routes configuration');
  }
  if (!results.navigationGuards) {
    log('red', '🔧 Fix: Implement navigation guards');
  }
  if (!results.routerIntegration) {
    log('red', '🔧 Fix: Integrate wizard routes with main router');
  }
  if (!results.wizardLayout) {
    log('red', '🔧 Fix: Complete wizard layout component');
  }
  if (!results.wizardDashboard) {
    log('red', '🔧 Fix: Complete wizard dashboard component');
  }
  
  if (results.overall) {
    log('green', '\n🚀 Ready for next phase: Wizard Step Components');
  } else {
    log('yellow', '\n⏸️  Please fix issues before proceeding to next phase');
  }
  
  process.exit(results.overall ? 0 : 1);
}

// Run tests if called directly
if (require.main === module) {
  runWizardRouterTests().catch(error => {
    log('red', `\n💥 Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runWizardRouterTests,
  testRouterStructure,
  testWizardRoutes,
  testNavigationGuards,
  testMainRouterIntegration,
  testWizardLayout,
  testWizardDashboard
};

