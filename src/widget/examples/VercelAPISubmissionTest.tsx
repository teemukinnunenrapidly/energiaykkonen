/**
 * Vercel API Submission Test Component
 * Tests submitting form data to the Vercel API endpoint using config.json leadApiUrl
 */

import React, { useState } from 'react';
import { useWidgetFormSubmission } from '../hooks/useWidgetFormSubmission';

const VercelAPISubmissionTest: React.FC = () => {
  const [testFormData, setTestFormData] = useState({
    // Required fields
    neliot: 120,
    sahkoposti: 'test@example.fi',
    
    // Additional fields
    huonekorkeus: 2.5,
    rakennusvuosi: '1985',
    henkilomaara: 3,
    lammitysmuoto: 'Öljylämmitys',
    vesikiertoinen: 2400,
    nimi: 'Test User Widget',
    puhelinnumero: '050-1234567',
    paikkakunta: 'Helsinki',
    osoite: 'Testikatu 123'
  });

  const {
    collectedFormData,
    submissionPayload,
    isFormValid,
    validationErrors,
    submissionState,
    submitForm,
    resetSubmission,
    getDebugInfo
  } = useWidgetFormSubmission({
    formData: testFormData,
    sessionId: `widget-test-${Date.now()}`,
    widgetId: 'test-widget-vercel-api',
    widgetMode: 'shadow'
  });

  const handleTestSubmission = async () => {
    console.log('🧪 Starting Vercel API test submission...');
    
    // Mock the widget data global to include leadApiUrl
    (window as any).__E1_WIDGET_DATA = {
      settings: {
        leadApiUrl: 'https://energiaykkonen-calculator.vercel.app/api/submit-lead'
      }
    };
    
    const success = await submitForm();
    
    if (success) {
      console.log('✅ Test submission successful!');
    } else {
      console.error('❌ Test submission failed');
    }
  };

  const updateField = (field: string, value: any) => {
    setTestFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="vercel-api-test" style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      <h2>🚀 Vercel API Submission Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Test Endpoint:</strong> https://energiaykkonen-calculator.vercel.app/api/submit-lead</p>
        <p><strong>Validation Status:</strong> {isFormValid ? '✅ Valid' : '❌ Invalid'}</p>
        {validationErrors.length > 0 && (
          <p><strong>Errors:</strong> {validationErrors.join(', ')}</p>
        )}
      </div>

      {/* Test Form Fields */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Test Form Data</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          
          <div>
            <label>Square Meters (neliot)*:</label>
            <input 
              type="number" 
              value={testFormData.neliot} 
              onChange={(e) => updateField('neliot', parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '4px' }}
            />
          </div>
          
          <div>
            <label>Email (sahkoposti)*:</label>
            <input 
              type="email" 
              value={testFormData.sahkoposti} 
              onChange={(e) => updateField('sahkoposti', e.target.value)}
              style={{ width: '100%', padding: '4px' }}
            />
          </div>
          
          <div>
            <label>Name (nimi):</label>
            <input 
              type="text" 
              value={testFormData.nimi} 
              onChange={(e) => updateField('nimi', e.target.value)}
              style={{ width: '100%', padding: '4px' }}
            />
          </div>
          
          <div>
            <label>Ceiling Height (huonekorkeus):</label>
            <input 
              type="number" 
              step="0.1"
              value={testFormData.huonekorkeus} 
              onChange={(e) => updateField('huonekorkeus', parseFloat(e.target.value) || 0)}
              style={{ width: '100%', padding: '4px' }}
            />
          </div>
          
          <div>
            <label>Heating Type (lammitysmuoto):</label>
            <select 
              value={testFormData.lammitysmuoto} 
              onChange={(e) => updateField('lammitysmuoto', e.target.value)}
              style={{ width: '100%', padding: '4px' }}
            >
              <option value="Öljylämmitys">Öljylämmitys</option>
              <option value="Sähkölämmitys">Sähkölämmitys</option>
              <option value="Kaukolämpö">Kaukolämpö</option>
              <option value="Maalämpö">Maalämpö</option>
            </select>
          </div>
          
          <div>
            <label>Annual Heating Cost (vesikiertoinen):</label>
            <input 
              type="number" 
              value={testFormData.vesikiertoinen} 
              onChange={(e) => updateField('vesikiertoinen', parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '4px' }}
            />
          </div>

        </div>
      </div>

      {/* Submission Payload Preview */}
      <details style={{ marginBottom: '20px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          📦 View Submission Payload
        </summary>
        <pre style={{ 
          background: '#f8f9fa', 
          padding: '12px', 
          borderRadius: '6px', 
          fontSize: '12px',
          overflow: 'auto',
          marginTop: '8px'
        }}>
          {JSON.stringify(submissionPayload, null, 2)}
        </pre>
      </details>

      {/* Submission Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={handleTestSubmission}
          disabled={!isFormValid || submissionState.isSubmitting}
          style={{
            background: !isFormValid ? '#6c757d' : submissionState.isSubmitting ? '#ffc107' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: !isFormValid || submissionState.isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {submissionState.isSubmitting ? '⏳ Submitting...' : '🚀 Test Submit to Vercel'}
        </button>

        {submissionState.error || submissionState.isSuccess ? (
          <button
            onClick={resetSubmission}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 Reset
          </button>
        ) : null}

        <button
          onClick={() => console.log('🔍 Debug Info:', getDebugInfo())}
          style={{
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔍 Debug Log
        </button>
      </div>

      {/* Submission Results */}
      {submissionState.isSuccess && (
        <div style={{ 
          background: '#d4edda', 
          color: '#155724',
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #c3e6cb',
          marginBottom: '20px'
        }}>
          <h3>✅ Submission Successful!</h3>
          {submissionState.response && (
            <div>
              <p><strong>Lead ID:</strong> {submissionState.response.leadId}</p>
              {submissionState.response.calculations && (
                <div>
                  <p><strong>Calculations:</strong></p>
                  <ul>
                    <li>Annual Savings: {submissionState.response.calculations.annualSavings}€</li>
                    <li>5-Year Savings: {submissionState.response.calculations.fiveYearSavings}€</li>
                    <li>Payback Period: {submissionState.response.calculations.paybackPeriod} years</li>
                    <li>CO2 Reduction: {submissionState.response.calculations.co2Reduction} kg/year</li>
                  </ul>
                </div>
              )}
              {submissionState.response.emailResults && (
                <div>
                  <p><strong>Email Results:</strong></p>
                  <ul>
                    <li>Customer Email: {submissionState.response.emailResults.customerEmailSent ? '✅ Sent' : '❌ Failed'}</li>
                    <li>Sales Email: {submissionState.response.emailResults.salesEmailSent ? '✅ Sent' : '❌ Failed'}</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {submissionState.error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24',
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #f5c6cb',
          marginBottom: '20px'
        }}>
          <h3>❌ Submission Failed</h3>
          <p><strong>Error:</strong> {submissionState.error}</p>
          <details>
            <summary style={{ cursor: 'pointer', marginTop: '8px' }}>View Technical Details</summary>
            <div style={{ marginTop: '8px', fontSize: '14px' }}>
              <p><strong>Endpoint:</strong> https://energiaykkonen-calculator.vercel.app/api/submit-lead</p>
              <p><strong>Payload Size:</strong> {JSON.stringify(submissionPayload).length} bytes</p>
              <p><strong>Form Fields:</strong> {Object.keys(collectedFormData).length}</p>
            </div>
          </details>
        </div>
      )}

      {/* API Integration Notes */}
      <div style={{ 
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        padding: '16px',
        borderRadius: '6px',
        marginTop: '20px'
      }}>
        <h4>📋 API Integration Notes</h4>
        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
          <li><strong>Endpoint:</strong> Uses leadApiUrl from config.json</li>
          <li><strong>Format:</strong> POST request with JSON payload</li>
          <li><strong>Headers:</strong> Content-Type: application/json, Accept: application/json</li>
          <li><strong>CORS:</strong> Configured with credentials: 'omit'</li>
          <li><strong>Payload:</strong> Converts widget format to Next.js API expected format</li>
          <li><strong>Error Handling:</strong> Network errors, CORS errors, and API errors handled</li>
        </ul>
      </div>
    </div>
  );
};

export default VercelAPISubmissionTest;