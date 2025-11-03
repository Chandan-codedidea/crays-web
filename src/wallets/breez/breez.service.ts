/**
 * Breez SDK Service
 * 
 * Thin wrapper around Breez SDK (Spark/WASM) for wallet operations.
 * Handles initialization, payments, invoices, and state management.
 */
import type { BreezConfig, BreezNodeState, BreezPayment, BreezInvoice, BreezEvent } from './breez.types';
import init, { connect, defaultConfig, type Seed } from '@breeztech/breez-sdk-spark';

let _inited = false;
let _sdk: any | null = null;
let eventListeners: Array<(event: BreezEvent) => void> = [];

/**
 * Ensure SDK is initialized (guard pattern for web/WASM)
 */
export async function ensureSdk(opts: { apiKey: string; network: 'mainnet' | 'testnet'; seed: Seed; }) {
  if (!_inited) {
    if (typeof window !== 'undefined') {
      await init();
    }
    _inited = true;
  }
  if (!_sdk) {
    const cfg = defaultConfig(opts.network);
    cfg.apiKey = opts.apiKey;
    _sdk = await connect({
      config: cfg,
      seed: opts.seed,
      storageDir: 'crays-wallet',
    });
  }
  return _sdk;
}

/**
 * Initialize Breez SDK (deprecated - use ensureSdk directly)
 */
export async function initBreez(config: BreezConfig): Promise<void> {
  try {
    const opts = {
      apiKey: config.apiKey,
      network: config.network,
      seed: config.seed as Seed,
    };
    await ensureSdk(opts);
    console.log('Breez SDK initialized and connected');
  } catch (error) {
    console.error('Failed to initialize Breez SDK:', error);
    throw error;
  }
}

/**
 * Disconnect from Breez SDK
 */
export async function disconnectBreez(): Promise<void> {
  if (_sdk) {
    try {
      // Breez SDK may have a disconnect method
      if (_sdk.disconnect) {
        await _sdk.disconnect();
      }
      _sdk = null;
      _inited = false;
      console.log('Breez SDK disconnected');
    } catch (error) {
      console.error('Failed to disconnect Breez SDK:', error);
      throw error;
    }
  }
}

/**
 * Get current node info/state
 */
export async function getNodeInfo(): Promise<BreezNodeState | null> {
  if (!_sdk) {
    throw new Error('Breez SDK not initialized');
  }
  
  try {
    const info = await _sdk.nodeInfo();
    return {
      id: info.id || '',
      alias: info.alias || '',
      color: info.color || '',
      maxReceivable: info.maxReceivableSat || 0,
      maxPayable: info.maxPayableSat || 0,
      channelState: info.channelState || 'unknown',
    };
  } catch (error) {
    console.error('Failed to get node info:', error);
    return null;
  }
}

/**
 * Create a Lightning invoice
 */
export async function createInvoice(amountMsats: number, description: string): Promise<string> {
  if (!_sdk) {
    throw new Error('Breez SDK not initialized');
  }
  
  try {
    const result = await _sdk.receivePayment({
      amountMsat: amountMsats,
      description,
    });
    return result.bolt11 || result.invoice;
  } catch (error) {
    console.error('Failed to create invoice:', error);
    throw error;
  }
}

/**
 * Pay a Lightning invoice
 */
export async function payInvoice(bolt11: string): Promise<BreezPayment> {
  if (!_sdk) {
    throw new Error('Breez SDK not initialized');
  }
  
  try {
    // Optional: prepare payment to check fees
    // const prepared = await _sdk.prepareSendPayment({ bolt11 });
    
    const result = await _sdk.sendPayment({ bolt11 });
    
    return {
      id: result.id || result.paymentHash,
      paymentHash: result.paymentHash,
      destination: result.destination,
      amountMsats: result.amountMsat,
      feeMsats: result.feeMsat || 0,
      status: result.status,
      timestamp: result.paymentTime || Date.now(),
      description: result.description || '',
    };
  } catch (error) {
    console.error('Failed to pay invoice:', error);
    throw error;
  }
}

/**
 * List all payments
 */
export async function listPayments(): Promise<BreezPayment[]> {
  if (!_sdk) {
    throw new Error('Breez SDK not initialized');
  }
  
  try {
    const payments = await _sdk.listPayments();
    return payments.map((p: any) => ({
      id: p.id || p.paymentHash,
      paymentHash: p.paymentHash,
      destination: p.destination,
      amountMsats: p.amountMsat,
      feeMsats: p.feeMsat || 0,
      status: p.status,
      timestamp: p.paymentTime || Date.now(),
      description: p.description || '',
    }));
  } catch (error) {
    console.error('Failed to list payments:', error);
    return [];
  }
}

/**
 * Register event listener
 */
export function addEventListener(callback: (event: BreezEvent) => void): void {
  eventListeners.push(callback);
}

/**
 * Remove event listener
 */
export function removeEventListener(callback: (event: BreezEvent) => void): void {
  eventListeners = eventListeners.filter(cb => cb !== callback);
}

/**
 * Emit event to all listeners
 */
function emitEvent(event: BreezEvent): void {
  eventListeners.forEach(callback => {
    try {
      callback(event);
    } catch (error) {
      console.error('Error in event listener:', error);
    }
  });
}

/**
 * Handle payment events from Breez SDK
 */
function handlePaymentEvent(event: any): void {
  // Map Breez SDK events to our event types
  emitEvent({
    type: 'payment',
    data: event,
  });
  console.log('Payment event:', event);
}
