/**
 * Normalized error types for wallet operations
 * Provides consistent error handling across different wallet implementations
 */

export interface WalletError {
  code: string;
  message: string;
  retriable: boolean;
  originalError?: any;
}

/**
 * Common error codes for wallet operations
 */
export const WalletErrorCode = {
  INIT_FAILED: 'INIT_FAILED',
  ALREADY_INITIALIZED: 'ALREADY_INITIALIZED',
  NOT_INITIALIZED: 'NOT_INITIALIZED',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INVOICE_INVALID: 'INVOICE_INVALID',
  INVOICE_EXPIRED: 'INVOICE_EXPIRED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  AMOUNT_OUT_OF_RANGE: 'AMOUNT_OUT_OF_RANGE',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
} as const;

/**
 * Normalize Breez SDK errors to a consistent WalletError format
 * @param error - The error from Breez SDK or any other source
 * @returns Normalized WalletError with code, message, and retriable flag
 */
export function normalizeBreezError(error: any): WalletError {
  // Default error structure
  const defaultError: WalletError = {
    code: WalletErrorCode.UNKNOWN,
    message: 'An unknown error occurred',
    retriable: false,
    originalError: error,
  };

  // Handle null/undefined errors
  if (!error) {
    return defaultError;
  }

  // Extract error message
  const errorMessage = 
    error.message || 
    error.error || 
    error.toString?.() || 
    defaultError.message;

  // Detect error type and set appropriate code, message, and retriability
  
  // Connection/Network errors (retriable)
  if (
    errorMessage.toLowerCase().includes('connection') ||
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('timeout')
  ) {
    return {
      code: errorMessage.toLowerCase().includes('timeout')
        ? WalletErrorCode.TIMEOUT
        : WalletErrorCode.NETWORK_ERROR,
      message: errorMessage,
      retriable: true,
      originalError: error,
    };
  }

  // Initialization errors
  if (
    errorMessage.toLowerCase().includes('already initialized') ||
    errorMessage.toLowerCase().includes('already connected')
  ) {
    return {
      code: WalletErrorCode.ALREADY_INITIALIZED,
      message: errorMessage,
      retriable: false,
      originalError: error,
    };
  }

  if (
    errorMessage.toLowerCase().includes('not initialized') ||
    errorMessage.toLowerCase().includes('not connected')
  ) {
    return {
      code: WalletErrorCode.NOT_INITIALIZED,
      message: errorMessage,
      retriable: false,
      originalError: error,
    };
  }

  if (errorMessage.toLowerCase().includes('init')) {
    return {
      code: WalletErrorCode.INIT_FAILED,
      message: errorMessage,
      retriable: true,
      originalError: error,
    };
  }

  // Payment errors
  if (
    errorMessage.toLowerCase().includes('insufficient') ||
    errorMessage.toLowerCase().includes('balance')
  ) {
    return {
      code: WalletErrorCode.INSUFFICIENT_BALANCE,
      message: errorMessage,
      retriable: false,
      originalError: error,
    };
  }

  if (
    errorMessage.toLowerCase().includes('invoice') &&
    (errorMessage.toLowerCase().includes('invalid') ||
     errorMessage.toLowerCase().includes('malformed'))
  ) {
    return {
      code: WalletErrorCode.INVOICE_INVALID,
      message: errorMessage,
      retriable: false,
      originalError: error,
    };
  }

  if (
    errorMessage.toLowerCase().includes('invoice') &&
    errorMessage.toLowerCase().includes('expired')
  ) {
    return {
      code: WalletErrorCode.INVOICE_EXPIRED,
      message: errorMessage,
      retriable: false,
      originalError: error,
    };
  }

  if (
    errorMessage.toLowerCase().includes('amount') &&
    (errorMessage.toLowerCase().includes('too') ||
     errorMessage.toLowerCase().includes('limit') ||
     errorMessage.toLowerCase().includes('range'))
  ) {
    return {
      code: WalletErrorCode.AMOUNT_OUT_OF_RANGE,
      message: errorMessage,
      retriable: false,
      originalError: error,
    };
  }

  if (errorMessage.toLowerCase().includes('payment')) {
    return {
      code: WalletErrorCode.PAYMENT_FAILED,
      message: errorMessage,
      retriable: true,
      originalError: error,
    };
  }

  // Default to unknown error
  return {
    code: WalletErrorCode.UNKNOWN,
    message: errorMessage,
    retriable: false,
    originalError: error,
  };
}
