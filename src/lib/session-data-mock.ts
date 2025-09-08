/**
 * Mock session data functions for standalone widget
 * No database operations - just in-memory storage
 */

// In-memory session storage
const sessionStorage: Record<string, any> = {};

export function updateSessionWithFormData(
  sessionId: string,
  formData: Record<string, any>
): void {
  // Just store in memory for widget session
  sessionStorage[sessionId] = {
    ...sessionStorage[sessionId],
    ...formData,
    updatedAt: new Date().toISOString()
  };
  console.log('Session data updated (in-memory):', sessionId, formData);
}

export function getSessionData(sessionId: string): Record<string, any> {
  return sessionStorage[sessionId] || {};
}

export function clearSessionData(sessionId: string): void {
  delete sessionStorage[sessionId];
}

export function initializeCommonDependencies(): void {
  // No-op for widget - no dependencies to initialize
  console.log('Widget mode: No common dependencies to initialize');
}