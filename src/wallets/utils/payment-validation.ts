/**
 * Payment validation and clamping utilities for Lightning invoices
 * Ensures payment amounts fall within acceptable ranges for LNURL and BOLT11
 */

/**
 * Common Lightning Network payment limits
 * Based on typical LNURL-pay constraints and network minimums
 */
export const MIN_SENDABLE_MSAT = 1_000; // 1 sat minimum
export const MAX_SENDABLE_MSAT = 100_000_000_000; // 100k sats (~$50 at $0.0005/sat)
export const DEFAULT_MIN_MSAT = 1_000; // 1 sat
export const DEFAULT_MAX_MSAT = 10_000_000_000; // 10k sats

/**
 * Result of payment amount validation
 */
export interface ValidationResult {
  valid: boolean;
  clampedAmount: number;
  error?: string;
}

/**
 * Validates and clamps a payment amount to specified bounds
 * 
 * @param amountMsat - Amount in millisatoshis to validate
 * @param min - Minimum allowed amount in millisatoshis (default: MIN_SENDABLE_MSAT)
 * @param max - Maximum allowed amount in millisatoshis (default: MAX_SENDABLE_MSAT)
 * @returns ValidationResult with clamped amount and validation status
 * 
 * @example
 * ```ts
 * const result = validateInvoiceAmount(500, 1000, 100000);
 * if (!result.valid) {
 *   console.error(result.error);
 *   // Use result.clampedAmount (1000) instead
 * }
 * ```
 */
export function validateInvoiceAmount(
  amountMsat: number,
  min: number = MIN_SENDABLE_MSAT,
  max: number = MAX_SENDABLE_MSAT
): ValidationResult {
  // Input validation
  if (!Number.isFinite(amountMsat) || amountMsat < 0) {
    return {
      valid: false,
      clampedAmount: min,
      error: 'Amount must be a non-negative finite number',
    };
  }

  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    return {
      valid: false,
      clampedAmount: amountMsat,
      error: 'Invalid min/max bounds',
    };
  }

  // Check if amount is within bounds
  if (amountMsat < min) {
    return {
      valid: false,
      clampedAmount: min,
      error: `Amount ${amountMsat} msat is below minimum ${min} msat`,
    };
  }

  if (amountMsat > max) {
    return {
      valid: false,
      clampedAmount: max,
      error: `Amount ${amountMsat} msat exceeds maximum ${max} msat`,
    };
  }

  // Amount is valid
  return {
    valid: true,
    clampedAmount: amountMsat,
  };
}

/**
 * Clamps an amount to the specified range without validation details
 * Useful when you just need a safe value within bounds
 * 
 * @param amountMsat - Amount in millisatoshis to clamp
 * @param min - Minimum allowed amount (default: MIN_SENDABLE_MSAT)
 * @param max - Maximum allowed amount (default: MAX_SENDABLE_MSAT)
 * @returns Clamped amount within [min, max]
 */
export function clampAmount(
  amountMsat: number,
  min: number = MIN_SENDABLE_MSAT,
  max: number = MAX_SENDABLE_MSAT
): number {
  return Math.min(Math.max(amountMsat, min), max);
}

/**
 * Validates that an amount is above the network minimum
 * 
 * @param amountMsat - Amount in millisatoshis
 * @returns true if amount meets minimum requirement
 */
export function isAboveMinimum(amountMsat: number): boolean {
  return Number.isFinite(amountMsat) && amountMsat >= MIN_SENDABLE_MSAT;
}

/**
 * Converts satoshis to millisatoshis
 * 
 * @param sats - Amount in satoshis
 * @returns Amount in millisatoshis
 */
export function satsToMsat(sats: number): number {
  return sats * 1_000;
}

/**
 * Converts millisatoshis to satoshis (rounded down)
 * 
 * @param msat - Amount in millisatoshis
 * @returns Amount in satoshis
 */
export function msatToSats(msat: number): number {
  return Math.floor(msat / 1_000);
}
