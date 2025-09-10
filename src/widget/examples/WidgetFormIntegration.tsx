/**
 * Widget Form Integration Example
 * Shows how to integrate form data collection with the existing CardContext
 */

import React, { useState } from 'react';
import { CardProvider } from '../../components/card-system/CardContext';
import { useCardContext } from '../../components/card-system/CardContext';
import { WidgetFormSubmitter } from '../components/WidgetFormSubmitter';

// Integration component that connects CardContext with form submission
const WidgetFormIntegrationInner: React.FC<{ widgetId?: string }> = ({ widgetId }) => {
  const { formData, sessionId, cards, cardStates, submitData } = useCardContext();
  const [showSubmitter, setShowSubmitter] = useState(false);

  // Calculate submission readiness
  const completedCards = Object.entries(cardStates).filter(
    ([_, state]) => state.status === 'complete'
  ).length;
  
  const totalCards = cards.length;
  const isReadyForSubmission = completedCards >= Math.max(1, totalCards - 1); // At least most cards completed

  const handleSubmissionSuccess = (response: any) => {
    console.log('🎉 Widget submission successful!', response);
    
    // You could also use the existing submitData method
    // submitData().catch(console.error);
    
    // Handle success (show success message, reset form, etc.)
    alert('Form submitted successfully! Check console for details.');
  };

  const handleSubmissionError = (error: string) => {
    console.error('❌ Widget submission failed:', error);
    alert(`Submission failed: ${error}`);
  };

  return (
    <div className="widget-form-integration" style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>🧮 Widget Form Integration Demo</h2>
      
      {/* Card Progress Info */}
      <div style={{ 
        background: '#e3f2fd', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>📊 Card Progress</h3>
        <div>
          <strong>Cards Completed:</strong> {completedCards} / {totalCards}
        </div>
        <div>
          <strong>Form Fields Filled:</strong> {Object.keys(formData).length}
        </div>
        <div>
          <strong>Session ID:</strong> {sessionId}
        </div>
        <div>
          <strong>Ready for Submission:</strong> {isReadyForSubmission ? '✅ Yes' : '⏳ No'}
        </div>
      </div>

      {/* Current Form Data Preview */}
      <div style={{ marginBottom: '20px' }}>
        <h3>📋 Current Form Data</h3>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            View Form Data ({Object.keys(formData).length} fields)
          </summary>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '6px', 
            fontSize: '13px',
            overflow: 'auto',
            marginTop: '8px'
          }}>
            {JSON.stringify(formData, null, 2)}
          </pre>
        </details>
      </div>

      {/* Card States Preview */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🎴 Card States</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '12px' 
        }}>
          {cards.map((card) => {
            const state = cardStates[card.id];
            const statusColor = {
              'active': '#28a745',
              'complete': '#17a2b8',
              'unlocked': '#ffc107',
              'hidden': '#6c757d',
              'locked': '#dc3545'
            }[state?.status || 'hidden'];

            return (
              <div
                key={card.id}
                style={{
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${statusColor}`
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {card.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Status: {state?.status || 'unknown'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Revealed: {state?.isRevealed ? 'Yes' : 'No'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Fields: {card.card_fields?.length || 0}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toggle Form Submitter */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowSubmitter(!showSubmitter)}
          style={{
            background: showSubmitter ? '#dc3545' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {showSubmitter ? '❌ Hide Form Submitter' : '📤 Show Form Submitter'}
        </button>
      </div>

      {/* Form Submitter */}
      {showSubmitter && (
        <div style={{ 
          border: '2px solid #007bff', 
          borderRadius: '8px', 
          padding: '20px',
          background: '#f8f9fd'
        }}>
          <WidgetFormSubmitter
            formData={formData}
            sessionId={sessionId}
            widgetId={widgetId}
            widgetMode="namespace" // or "shadow" depending on your setup
            onSubmissionSuccess={handleSubmissionSuccess}
            onSubmissionError={handleSubmissionError}
          />
        </div>
      )}

      {/* Integration Notes */}
      <div style={{ 
        marginTop: '20px',
        padding: '16px',
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '6px'
      }}>
        <h4>💡 Integration Notes</h4>
        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
          <li><strong>Form Data Collection:</strong> Data is automatically collected from CardContext formData</li>
          <li><strong>Validation:</strong> Checks for required fields (neliot, sahkoposti)</li>
          <li><strong>Submission:</strong> Can submit to WordPress AJAX or direct API endpoint</li>
          <li><strong>Error Handling:</strong> Comprehensive error handling with user feedback</li>
          <li><strong>Debug Info:</strong> Click "Debug Log" to see detailed information in console</li>
        </ul>
      </div>
    </div>
  );
};

// Main integration component with CardProvider wrapper
export const WidgetFormIntegration: React.FC<{ 
  initialData?: any;
  widgetId?: string;
}> = ({ 
  initialData, 
  widgetId 
}) => {
  return (
    <CardProvider initialData={initialData} widgetMode={true}>
      <WidgetFormIntegrationInner widgetId={widgetId} />
    </CardProvider>
  );
};

export default WidgetFormIntegration;