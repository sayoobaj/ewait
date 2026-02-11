// User-friendly error messages

export const ErrorMessages = {
  // Auth errors
  INVALID_CREDENTIALS: 'Email or password is incorrect. Please try again.',
  EMAIL_EXISTS: 'An account with this email already exists. Try logging in instead.',
  WEAK_PASSWORD: 'Password must be at least 6 characters long.',
  UNAUTHORIZED: 'Please log in to continue.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',

  // Queue errors
  QUEUE_NOT_FOUND: 'This queue doesn\'t exist or has been removed.',
  QUEUE_INACTIVE: 'This queue is currently closed. Please try again later.',
  QUEUE_FULL: 'This queue is at capacity. Please try again in a few minutes.',
  ALREADY_IN_QUEUE: 'You\'re already in this queue. Check your ticket status.',
  ENTRY_NOT_FOUND: 'Ticket not found. It may have expired or been cancelled.',

  // Location errors
  LOCATION_NOT_FOUND: 'Location not found.',
  NO_LOCATIONS: 'You haven\'t created any locations yet.',

  // Payment errors
  PAYMENT_FAILED: 'Payment could not be processed. Please try again.',
  PAYMENT_CANCELLED: 'Payment was cancelled.',
  INVALID_PLAN: 'Invalid subscription plan selected.',

  // General errors
  NETWORK_ERROR: 'Connection failed. Please check your internet and try again.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',

  // SMS errors
  SMS_FAILED: 'Could not send SMS notification. You can still track your position online.',
  INVALID_PHONE: 'Please enter a valid Nigerian phone number.',
}

export class AppError extends Error {
  constructor(
    public code: keyof typeof ErrorMessages,
    public statusCode: number = 400
  ) {
    super(ErrorMessages[code])
    this.name = 'AppError'
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code
    }
  }
}

// Helper to create error responses
export function errorResponse(code: keyof typeof ErrorMessages, statusCode = 400) {
  return {
    error: ErrorMessages[code],
    code
  }
}
