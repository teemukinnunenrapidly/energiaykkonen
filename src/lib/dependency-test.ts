/**
 * Simple test script to verify dependency tracking works
 * Run this in the browser console or as part of your testing suite
 */

import { 
  initializeCommonDependencies, 
  storeSessionField, 
  storeSessionCalculation,
  needsRecalculation,
  getDependencyStats,
  discoverDependenciesFromFormula
} from './session-data-table';

export function testDependencyTracking() {
  console.log('🧪 Starting dependency tracking test...');
  
  // Initialize dependencies
  initializeCommonDependencies();
  
  const testSessionId = 'test-session-123';
  
  // Test 1: Store some initial field values
  console.log('\n📝 Test 1: Storing initial field values');
  storeSessionField(testSessionId, 'neliot', 120);
  storeSessionField(testSessionId, 'huonekorkeus', 2.7);
  storeSessionField(testSessionId, 'valitse', 'Öljylämmitys');
  
  // Test 2: Store a calculation result
  console.log('\n📊 Test 2: Storing calculation result');
  storeSessionCalculation(testSessionId, 'Laskennallinen energiantarve (kwh)', 9720, 'kWh');
  
  // Test 3: Check if dependent calculations need recalculation
  console.log('\n🔍 Test 3: Checking recalculation needs');
  const needsRecalc1 = needsRecalculation(testSessionId, 'Öljyn menekki vuodessa');
  console.log('Oil consumption needs recalc after energy calc:', needsRecalc1);
  
  // Test 4: Change a field and see what gets invalidated
  console.log('\n🔄 Test 4: Changing field value to trigger invalidation');
  storeSessionField(testSessionId, 'neliot', 150); // Change square meters
  
  const needsRecalc2 = needsRecalculation(testSessionId, 'Laskennallinen energiantarve (kwh)');
  const needsRecalc3 = needsRecalculation(testSessionId, 'Öljyn menekki vuodessa');
  
  console.log('Energy calculation needs recalc after field change:', needsRecalc2);
  console.log('Oil consumption needs recalc after field change:', needsRecalc3);
  
  // Test 5: Auto-discovery test
  console.log('\n🔍 Test 5: Auto-discovery from formula');
  discoverDependenciesFromFormula(
    'Test Formula', 
    '[field:neliot] * [field:huonekorkeus] * 40 + [calc:base-consumption]'
  );
  
  // Test 6: Get stats
  console.log('\n📈 Test 6: Dependency statistics');
  const stats = getDependencyStats();
  console.log('Dependency stats:', stats);
  
  console.log('✅ Dependency tracking test completed!');
  
  return {
    testPassed: needsRecalc2 && needsRecalc3,
    stats
  };
}

// Example usage in browser console:
// import { testDependencyTracking } from './lib/dependency-test';
// testDependencyTracking();