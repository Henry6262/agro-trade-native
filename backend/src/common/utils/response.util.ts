/**
 * Standard API Response Utility
 * 
 * Provides consistent response formatting across all endpoints.
 * All API endpoints should return responses in this format for consistency.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: Record<string, any>;
}

/**
 * Create a successful API response
 * @param data - The response data
 * @param message - Optional success message
 * @param meta - Optional metadata (pagination, counts, etc.)
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, any>
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
}

/**
 * Create an error API response
 * @param error - Error message
 * @param data - Optional error details
 */
export function errorResponse(
  error: string,
  data?: any
): ApiResponse {
  const response: ApiResponse = {
    success: false,
    error,
  };

  if (data) {
    response.data = data;
  }

  return response;
}

/**
 * Create a paginated API response
 * @param data - Array of items
 * @param total - Total count
 * @param page - Current page
 * @param limit - Items per page
 * @param message - Optional message
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): ApiResponse<T[]> {
  return successResponse(
    data,
    message,
    {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      }
    }
  );
}
