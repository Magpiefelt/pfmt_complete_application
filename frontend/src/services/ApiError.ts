/**
 * Custom error class for API-related errors
 * Provides consistent error handling across all services
 */
export class ApiError extends Error {
  public status: number
  public statusText: string
  public data?: any

  constructor(
    message: string,
    status: number = 500,
    statusText: string = 'Internal Server Error',
    data?: any
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.data = data
  }

  /**
   * Create ApiError from fetch Response
   */
  static async fromResponse(response: Response): Promise<ApiError> {
    let data: any
    let message = response.statusText || 'Unknown error'

    try {
      data = await response.json()
      if (data.message) {
        message = data.message
      } else if (data.error?.message) {
        message = data.error.message
      }
    } catch {
      // If response is not JSON, use status text
    }

    return new ApiError(message, response.status, response.statusText, data)
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(): boolean {
    return this.status === 0 || this.status >= 500
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }

  /**
   * Check if error is unauthorized
   */
  isUnauthorized(): boolean {
    return this.status === 401
  }

  /**
   * Check if error is forbidden
   */
  isForbidden(): boolean {
    return this.status === 403
  }

  /**
   * Check if error is not found
   */
  isNotFound(): boolean {
    return this.status === 404
  }
}

