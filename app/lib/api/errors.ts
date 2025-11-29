/**
 * Standard Error Codes (V3)
 * 
 * Centralized error code definitions for consistent error handling
 */

export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // External Services
  TIMELINE_ERROR: 'TIMELINE_ERROR',
  MEMORY_ERROR: 'MEMORY_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Internal
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SESSION_ERROR: 'SESSION_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
