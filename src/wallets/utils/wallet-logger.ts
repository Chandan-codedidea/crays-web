/**
 * Wallet Logger - Conditional observability logging for wallet operations
 * Only logs when VITE_WALLET_LOGS=true
 */

const WALLET_LOGS_ENABLED = import.meta.env.VITE_WALLET_LOGS === 'true';

/**
 * Format timestamp for log entries
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Log wallet initialization events
 */
export function logWalletInit(details: {
  provider: string;
  network?: string;
  status: 'starting' | 'connected' | 'failed';
  error?: string;
}): void {
  if (!WALLET_LOGS_ENABLED) return;

  console.log(
    `[WALLET-INIT] ${getTimestamp()} - ${details.provider}`,
    {
      network: details.network,
      status: details.status,
      error: details.error,
    }
  );
}

/**
 * Log wallet balance updates
 */
export function logWalletBalance(details: {
  balanceSats: number;
  pendingSats?: number;
  source: string;
}): void {
  if (!WALLET_LOGS_ENABLED) return;

  console.log(
    `[WALLET-BALANCE] ${getTimestamp()}`,
    {
      balanceSats: details.balanceSats,
      pendingSats: details.pendingSats,
      source: details.source,
    }
  );
}

/**
 * Log wallet payment operations
 */
export function logWalletPayment(details: {
  type: 'send' | 'receive';
  amountSats: number;
  status: 'pending' | 'completed' | 'failed';
  bolt11?: string;
  paymentHash?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}): void {
  if (!WALLET_LOGS_ENABLED) return;

  console.log(
    `[WALLET-PAYMENT] ${getTimestamp()} - ${details.type.toUpperCase()}`,
    {
      amountSats: details.amountSats,
      status: details.status,
      paymentHash: details.paymentHash,
      bolt11: details.bolt11 ? `${details.bolt11.substring(0, 20)}...` : undefined,
      error: details.error,
      metadata: details.metadata,
    }
  );
}

/**
 * Log wallet errors
 */
export function logWalletError(details: {
  operation: string;
  error: Error | string;
  code?: string;
  retriable?: boolean;
  context?: Record<string, unknown>;
}): void {
  if (!WALLET_LOGS_ENABLED) return;

  const errorMessage = details.error instanceof Error 
    ? details.error.message 
    : details.error;

  console.error(
    `[WALLET-ERROR] ${getTimestamp()} - ${details.operation}`,
    {
      error: errorMessage,
      code: details.code,
      retriable: details.retriable,
      context: details.context,
      stack: details.error instanceof Error ? details.error.stack : undefined,
    }
  );
}
