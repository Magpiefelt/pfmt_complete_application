/**
 * Standardized error handling utilities for the PFMT application
 * Provides consistent error handling patterns across all async operations
 */

export interface ErrorDetails {
  message: string
  code?: string
  statusCode?: number
  details?: any
  timestamp: Date
  context?: string
}

export interface ErrorHandlingOptions {
  showNotification?: boolean
  logToConsole?: boolean
  context?: string
  fallbackMessage?: string
  retryable?: boolean
}

/**
 * Standard error class for application errors
 */
export class AppError extends Error {
  public readonly code?: string
  public readonly statusCode?: number
  public readonly details?: any
  public readonly timestamp: Date
  public readonly context?: string
  public readonly retryable: boolean

  constructor(
    message: string,
    options: {
      code?: string
      statusCode?: number
      details?: any
      context?: string
      retryable?: boolean
    } = {}
  ) {
    super(message)
    this.name = 'AppError'
    this.code = options.code
    this.statusCode = options.statusCode
    this.details = options.details
    this.context = options.context
    this.retryable = options.retryable ?? false
    this.timestamp = new Date()
  }
}

/**
 * Handles errors consistently across the application
 */
export const handleError = (
  error: unknown,
  options: ErrorHandlingOptions = {}
): ErrorDetails => {
  const {
    showNotification = true,
    logToConsole = true,
    context = 'Unknown',
    fallbackMessage = 'An unexpected error occurred',
    retryable = false
  } = options

  let errorDetails: ErrorDetails

  if (error instanceof AppError) {
    errorDetails = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: error.timestamp,
      context: error.context || context
    }
  } else if (error instanceof Error) {
    errorDetails = {
      message: error.message || fallbackMessage,
      timestamp: new Date(),
      context
    }
  } else if (typeof error === 'string') {
    errorDetails = {
      message: error,
      timestamp: new Date(),
      context
    }
  } else {
    errorDetails = {
      message: fallbackMessage,
      details: error,
      timestamp: new Date(),
      context
    }
  }

  // Log to console if enabled
  if (logToConsole) {
    console.error(`[${context}] Error:`, errorDetails)
  }

  // Show notification if enabled (would integrate with notification system)
  if (showNotification) {
    // This would integrate with your notification system
    // For now, we'll just log it
    console.warn('Notification would be shown:', errorDetails.message)
  }

  return errorDetails
}

/**
 * Wraps async operations with standardized error handling
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<{ data?: T; error?: ErrorDetails }> => {
  try {
    const data = await operation()
    return { data }
  } catch (error) {
    const errorDetails = handleError(error, options)
    return { error: errorDetails }
  }
}

/**
 * Creates a retry wrapper for operations that might fail
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    backoff?: boolean
    retryCondition?: (error: unknown) => boolean
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    retryCondition = (error) => {
      if (error instanceof AppError) {
        return error.retryable
      }
      return true
    }
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Check if we should retry this error
      if (!retryCondition(error)) {
        break
      }

      // Calculate delay with optional backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt) : delay
      await new Promise(resolve => setTimeout(resolve, currentDelay))
    }
  }

  throw lastError
}

/**
 * Validates API responses and throws appropriate errors
 */
export const validateApiResponse = (response: any, context: string = 'API'): any => {
  if (!response) {
    throw new AppError('No response received', {
      context,
      code: 'NO_RESPONSE',
      retryable: true
    })
  }

  if (response.success === false) {
    throw new AppError(response.message || 'API request failed', {
      context,
      code: response.code || 'API_ERROR',
      statusCode: response.statusCode,
      details: response.details,
      retryable: response.retryable ?? false
    })
  }

  return response.data || response
}

/**
 * Common error messages for consistency
 */
export const ErrorMessages = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  TIMEOUT: 'The request timed out. Please try again.',
  UNKNOWN: 'An unexpected error occurred. Please try again.'
} as const

/**
 * Maps HTTP status codes to user-friendly messages
 */
export const getErrorMessageFromStatus = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return ErrorMessages.VALIDATION_ERROR
    case 401:
      return ErrorMessages.UNAUTHORIZED
    case 403:
      return ErrorMessages.FORBIDDEN
    case 404:
      return ErrorMessages.NOT_FOUND
    case 408:
      return ErrorMessages.TIMEOUT
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorMessages.SERVER_ERROR
    default:
      return ErrorMessages.UNKNOWN
  }
}

/**
 * Composable for error handling in Vue components
 */
export const useErrorHandling = () => {
  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    options: ErrorHandlingOptions = {}
  ) => {
    return withErrorHandling(operation, options)
  }

  const handleAsyncOperationWithRetry = async <T>(
    operation: () => Promise<T>,
    errorOptions: ErrorHandlingOptions = {},
    retryOptions: Parameters<typeof withRetry>[1] = {}
  ) => {
    return withErrorHandling(
      () => withRetry(operation, retryOptions),
      errorOptions
    )
  }

  return {
    handleAsyncOperation,
    handleAsyncOperationWithRetry,
    handleError,
    AppError,
    ErrorMessages
  }
}

