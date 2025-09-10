/**
 * Form Data Collection Example
 * Shows how to use the FormDataCollector in widget context
 */

import { FormDataCollector, createFormDataCollector, collectWidgetFormData } from '../data/FormDataCollector';

// Example 1: Basic usage with sample form data
export function basicUsageExample() {
  console.log('📋 Example 1: Basic Form Data Collection');
  
  // Sample form data that would come from CardContext
  const sampleFormData = {
    neliot: '120',           // Will be converted to number
    huonekorkeus: '2.5',     // Will be converted to number
    rakennusvuosi: '1980',
    henkilomaara: '4',       // Will be converted to number
    lammitysmuoto: 'Öljylämmitys',
    vesikiertoinen: '2500',  // Will be converted to number
    nimi: 'Matti Meikäläinen',
    sahkoposti: 'matti@example.fi',
    puhelinnumero: '040-1234567',
    osoite: 'Esimerkkikatu 1',
    paikkakunta: 'Helsinki',
    
    // These will be filtered out (empty values)
    emptyField: '',
    nullField: null,
    undefinedField: undefined,
  };

  // Quick collection using helper function
  const cleanedData = collectWidgetFormData(sampleFormData);
  
  console.log('✅ Cleaned form data:', cleanedData);
  console.log('📊 Field count: Original =', Object.keys(sampleFormData).length, 'Cleaned =', Object.keys(cleanedData).length);
  
  return cleanedData;
}

// Example 2: Full submission payload preparation
export function submissionPayloadExample() {
  console.log('📦 Example 2: Full Submission Payload');
  
  const formData = {
    neliot: 85,
    huonekorkeus: 2.7,
    henkilomaara: 2,
    lammitysmuoto: 'Kaukolämpö',
    vesikiertoinen: 1800,
    nimi: 'Anna Esimerkki',
    sahkoposti: 'anna@test.fi',
    puhelinnumero: '+358 50 123 4567',
    paikkakunta: 'Tampere'
  };

  const collector = createFormDataCollector(
    formData,
    'widget-session-123',
    'e1-calculator-widget-1',
    'shadow'
  );

  const submissionPayload = collector.createSubmissionPayload();
  
  console.log('📋 Form data:', submissionPayload.formData);
  console.log('🆔 Session ID:', submissionPayload.sessionId);
  console.log('📦 Full payload:', submissionPayload);
  
  return submissionPayload;
}

// Example 3: Validation testing
export function validationExample() {
  console.log('🔍 Example 3: Form Validation');
  
  // Valid form data
  const validFormData = {
    neliot: 100,
    sahkoposti: 'valid@email.com',
    nimi: 'Test User',
    lammitysmuoto: 'Öljylämmitys'
  };

  // Invalid form data
  const invalidFormData = {
    neliot: 0,              // Invalid: must be > 0
    sahkoposti: 'invalid-email', // Invalid email format
    nimi: 'Test User'
    // Missing required sahkoposti
  };

  console.log('✅ Testing valid form data:');
  const validCollector = new FormDataCollector(validFormData, 'test-session');
  const validResult = validCollector.validateForSubmission();
  console.log('Valid result:', validResult);

  console.log('❌ Testing invalid form data:');
  const invalidCollector = new FormDataCollector(invalidFormData, 'test-session');
  const invalidResult = invalidCollector.validateForSubmission();
  console.log('Invalid result:', invalidResult);

  return { validResult, invalidResult };
}

// Example 4: Field categorization and debugging
export function debuggingExample() {
  console.log('🔧 Example 4: Debugging and Field Analysis');
  
  const mixedFormData = {
    // Property fields
    neliot: 150,
    huonekorkeus: 3.0,
    rakennusvuosi: '1995',
    
    // Heating fields
    lammitysmuoto: 'Maalämpö',
    vesikiertoinen: 2200,
    
    // Contact fields
    nimi: 'Debug User',
    sahkoposti: 'debug@example.com',
    
    // Custom fields
    customField1: 'Some custom value',
    customField2: 42,
    
    // Empty fields
    emptyString: '',
    nullValue: null
  };

  const collector = new FormDataCollector(mixedFormData, 'debug-session');
  const summary = collector.getFieldSummary();
  
  console.log('📊 Field Summary:', summary);
  console.log('📋 Fields by category:', summary.fieldsByType);
  console.log('❌ Empty fields:', summary.emptyFields);
  console.log('✅ Validation status:', summary.validationStatus);
  
  return summary;
}

// Example 5: Real widget integration simulation
export function widgetIntegrationSimulation() {
  console.log('🧮 Example 5: Widget Integration Simulation');
  
  // Simulate progressive form filling (like in actual widget)
  let currentFormData: Record<string, any> = {};
  
  // Step 1: Property information card completed
  console.log('📝 Step 1: Property card completed');
  currentFormData = {
    ...currentFormData,
    neliot: 95,
    huonekorkeus: 2.5,
    rakennusvuosi: '1985'
  };
  logCurrentState('Property', currentFormData);
  
  // Step 2: Heating information card completed
  console.log('📝 Step 2: Heating card completed');
  currentFormData = {
    ...currentFormData,
    lammitysmuoto: 'Öljylämmitys',
    vesikiertoinen: 2800
  };
  logCurrentState('Heating', currentFormData);
  
  // Step 3: Contact information card completed
  console.log('📝 Step 3: Contact card completed');
  currentFormData = {
    ...currentFormData,
    nimi: 'Simulation User',
    sahkoposti: 'sim@example.fi',
    puhelinnumero: '050-9876543',
    paikkakunta: 'Oulu'
  };
  logCurrentState('Contact', currentFormData);
  
  // Step 4: Ready for submission
  console.log('📤 Step 4: Ready for submission');
  const finalCollector = createFormDataCollector(currentFormData, 'sim-session-456');
  const validation = finalCollector.validateForSubmission();
  const payload = finalCollector.createSubmissionPayload();
  
  console.log('🔍 Final validation:', validation);
  console.log('📦 Final payload ready:', {
    isValid: validation.isValid,
    fieldCount: Object.keys(payload.formData).length,
    payloadSize: JSON.stringify(payload).length + ' bytes'
  });
  
  return { validation, payload };
}

function logCurrentState(step: string, formData: Record<string, any>) {
  const collector = new FormDataCollector(formData, 'temp-session');
  const cleanedData = collector.collectFormData();
  const validation = collector.validateForSubmission();
  
  console.log(`  ${step} completed:`, {
    totalFields: Object.keys(cleanedData).length,
    isValid: validation.isValid,
    missingRequired: validation.requiredFields
  });
}

// Run all examples
export function runAllExamples() {
  console.log('🚀 Running all Form Data Collection examples...\n');
  
  basicUsageExample();
  console.log('\n' + '='.repeat(50) + '\n');
  
  submissionPayloadExample();
  console.log('\n' + '='.repeat(50) + '\n');
  
  validationExample();
  console.log('\n' + '='.repeat(50) + '\n');
  
  debuggingExample();
  console.log('\n' + '='.repeat(50) + '\n');
  
  widgetIntegrationSimulation();
  
  console.log('\n✅ All examples completed! Check console output for details.');
}

// For testing in browser console
if (typeof window !== 'undefined') {
  (window as any).E1FormDataExamples = {
    basicUsageExample,
    submissionPayloadExample,
    validationExample,
    debuggingExample,
    widgetIntegrationSimulation,
    runAllExamples
  };
  
  console.log('🎯 Form Data Collection examples loaded! Try: E1FormDataExamples.runAllExamples()');
}