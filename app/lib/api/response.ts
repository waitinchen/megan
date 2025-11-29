/**
 * Unified API Response Format (V3)
 * 
 * All API routes should use these helpers to ensure consistent response format
 */

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Create a success response
 */
export function ok<T = any>(data: T): Response {
  return Response.json({
    success: true,
    data,
  } as SuccessResponse<T>);
}

/**
 * Create an error response
 */
export function fail(code: string, message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code,
        message,
      },
    } as ErrorResponse),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create an unauthorized response
 */
export function unauthorized(message: string = 'Not logged in'): Response {
  return fail('UNAUTHORIZED', message, 401);
}

/**
 * Create a not found response
 */
export function notFound(message: string = 'Resource not found'): Response {
  return fail('NOT_FOUND', message, 404);
}

/**
 * Create an internal server error response
 */
export function serverError(message: string = 'Internal server error'): Response {
  return fail('INTERNAL_ERROR', message, 500);
}
