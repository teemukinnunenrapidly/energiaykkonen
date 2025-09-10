/**
 * Widget Form Submitter Component
 * Demonstrates how to collect and submit form data from widget cards
 */

import React from 'react';
import { useWidgetFormSubmission } from '../hooks/useWidgetFormSubmission';

export interface WidgetFormSubmitterProps {
  formData: Record<string, any>;
  sessionId: string;
  widgetId?: string;
  widgetMode?: 'shadow' | 'namespace';
  apiEndpoint?: string;
  onSubmissionSuccess?: (response: any) => void;
  onSubmissionError?: (error: string) => void;
  className?: string;
}

export const WidgetFormSubmitter: React.FC<WidgetFormSubmitterProps> = ({
  formData,
  sessionId,
  widgetId,
  widgetMode = 'namespace',
  apiEndpoint,
  onSubmissionSuccess,
  onSubmissionError,
  className = ''
}) => {
  const {
    collectedFormData,
    isFormValid,
    validationErrors,
    requiredFieldsMissing,
    submissionState,
    submitForm,
    resetSubmission,
    getDebugInfo
  } = useWidgetFormSubmission({
    formData,
    sessionId,
    widgetId,
    widgetMode,
    apiEndpoint
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await submitForm();
    
    if (success) {
      onSubmissionSuccess?.(submissionState.response);
    } else {
      onSubmissionError?.(submissionState.error || 'Unknown error');
    }
  };

  const handleReset = () => {
    resetSubmission();
  };

  const handleDebugLog = () => {
    console.log('🔍 Widget Form Debug Info:', getDebugInfo());
  };

  return (
    <div className={`widget-form-submitter ${className}`}>
      {/* Form Data Summary */}
      <div className="form-data-summary" style={{ marginBottom: '20px' }}>
        <h3>📋 Collected Form Data</h3>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '12px', 
          borderRadius: '6px', 
          fontSize: '14px',
          fontFamily: 'monospace'
        }}>
          <div><strong>Total Fields:</strong> {Object.keys(collectedFormData).length}</div>
          <div><strong>Session ID:</strong> {sessionId}</div>
          {widgetId && <div><strong>Widget ID:</strong> {widgetId}</div>}
          <div><strong>Widget Mode:</strong> {widgetMode}</div>
        </div>
        
        {/* Show collected data fields */}
        <details style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            View Collected Data ({Object.keys(collectedFormData).length} fields)
          </summary>
          <div style={{ 
            marginTop: '8px', 
            padding: '12px', 
            background: '#f8f9fa', 
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'monospace'
          }}>
            {Object.entries(collectedFormData).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '4px' }}>
                <span style={{ color: '#666' }}>{key}:</span>{' '}
                <span style={{ fontWeight: 'bold' }}>{JSON.stringify(value)}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Validation Status */}
      <div className="validation-status" style={{ marginBottom: '20px' }}>
        <h3>🔍 Validation Status</h3>
        <div style={{ 
          background: isFormValid ? '#d4edda' : '#f8d7da', 
          color: isFormValid ? '#155724' : '#721c24',
          padding: '12px', 
          borderRadius: '6px',
          border: `1px solid ${isFormValid ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          <div><strong>Status:</strong> {isFormValid ? '✅ Valid' : '❌ Invalid'}</div>
          
          {validationErrors.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>Errors:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {requiredFieldsMissing.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>Missing Required Fields:</strong> {requiredFieldsMissing.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="submission-form">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={!isFormValid || submissionState.isSubmitting}
            style={{
              background: !isFormValid ? '#6c757d' : submissionState.isSubmitting ? '#ffc107' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: !isFormValid || submissionState.isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {submissionState.isSubmitting 
              ? '⏳ Lähetetään...' 
              : !isFormValid 
                ? '❌ Täytä vaaditut kentät'
                : '📤 Lähetä tiedot'
            }
          </button>

          {(submissionState.error || submissionState.isSuccess) && (
            <button
              type="button"
              onClick={handleReset}
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
          )}

          <button
            type="button"
            onClick={handleDebugLog}
            style={{
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔍 Debug Log
          </button>
        </div>
      </form>

      {/* Submission Status */}
      {(submissionState.error || submissionState.isSuccess) && (
        <div className="submission-status" style={{ marginTop: '20px' }}>
          <h3>📊 Submission Result</h3>
          <div style={{ 
            background: submissionState.isSuccess ? '#d4edda' : '#f8d7da', 
            color: submissionState.isSuccess ? '#155724' : '#721c24',
            padding: '12px', 
            borderRadius: '6px',
            border: `1px solid ${submissionState.isSuccess ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {submissionState.isSuccess ? (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>✅ Submission Successful!</div>
                {submissionState.response && (
                  <details>
                    <summary style={{ cursor: 'pointer' }}>View Response</summary>
                    <pre style={{ 
                      marginTop: '8px', 
                      background: '#f8f9fa', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(submissionState.response, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>❌ Submission Failed</div>
                <div>{submissionState.error}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetFormSubmitter;