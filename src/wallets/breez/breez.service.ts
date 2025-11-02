/**
 * Breez SDK Service
 * 
 * Thin wrapper around Breez SDK (Spark/WASM) for wallet operations.
 * Handles initialization, payments, invoices, and state management.
 */
import type { BreezConfig, BreezNodeState, BreezPayment, BreezInvoice, BreezEvent } from './breez.types';
import { init, connect, defaultConfig, type Seed, nodeInfo, receivePayment, sendPayment, listPayments as sdkListPayments } from '@breeztech/breez-sdk-spark';

let breezSdk: any = null;
let breezInstance: any = null;
let eventListeners: Array<(event: BreezEvent) => void> = [];

/**
 * Initialize Breez SDK
 */
export async function initBreez(config: BreezConfig): Promise<void> {
  try {
    // Dynamically import Breez SDK (WASM)
    if (!breezSdk) {
      breezSdk = await import('@breeztech/breez-sdk-spark');
    }
    
    // Get default configuration
    const sdkConfig = await defaultConfig(
      config.network === 'mainnet' ? 'bitcoin' : 'testnet',
      config.apiKey,
      config.workingDir || 'breez-sdk'
    );
    
    // Initialize SDK instance
    breezInstance = await init({
      ...sdkConfig,
      seed: config.seed as Seed,
    });
    
    // Connect to the Breez node
    await connect({
      config: sdkConfig,
      seed: config.seed as Seed,
    });
    
    console.log('Breez SDK initialized and connected', sdkConfig);
    
    // Register event listeners
    if (breezInstance && breezInstance.addEventListener) {
      breezInstance.addEventListener('payment', handlePaymentEvent);
    }
    
  } catch (error) {
    console.error('Failed to initialize Breez SDK:', error);
    throw new Error(`Breez initialization failed: ${error}`);
  }
}

/**
 * Get wallet balance
 */
export async function getBalance(): Promise<number> {
  if (!breezInstance) {
    throw new Error('Breez SDK not initialized');
  }
  
  try {
    const nodeState = await nodeInfo();
    return nodeState.channelsBalanceMsat;
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw error;
  }
}

/**
 * Create Lightning invoice
 */
export async function createInvoice(amountMsat: number, description?: string): Promise<{ bolt11: string }> {
  if (!breezInstance) {
    throw new Error('Breez SDK not initialized');
  }
  
  try {
    const invoice = await receivePayment({
      amountMsat,
      description: description || '',
    });
    return { bolt11: invoice.bolt11 };
  } catch (error) {
    console.error('Failed to create invoice:', error);
    throw error;
  }
}

/**
 * Send payment via bolt11 invoice
 */
export async function sendBolt11(bolt11: string): Promise<{ id: string; status: 'success' | 'failed'; preimage?: string }> {
  if (!breezInstance) {
    throw new Error('Breez SDK not initialized');
  }
  
  try {
    const payment = await sendPayment({ bolt11 });
    return {
      id: payment.id,
      status: payment.status === 'complete' ? 'success' : 'failed',
      preimage: payment.preimage,
    };
  } catch (error) {
    console.error('Failed to send payment:', error);
    return { id: '', status: 'failed' };
  }
}

/**
 * Pay LNURL-pay endpoint
 */
export async function payLnurl(
  url: string,
  amountMsat: number,
  comment?: string,
  zapRequestJson?: string
): Promise<{ id: string; status: 'success' | 'failed' }> {
  if (!breezInstance) {
    throw new Error('Breez SDK not initialized');
  }
  
  try {
    // Fetch LNURL callback
    const params = new URLSearchParams({
      amount: amountMsat.toString(),
    });
    
    if (comment) {
      params.set('comment', comment);
    }
    
    if (zapRequestJson) {
      params.set('nostr', zapRequestJson);
    }
    
    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json();
    
    if (data.status === 'ERROR') {
      throw new Error(data.reason || 'LNURL-pay failed');
    }
    
    // Pay the invoice
    return await sendBolt11(data.pr);
  } catch (error) {
    console.error('Failed to pay LNURL:', error);
    return { id: '', status: 'failed' };
  }
}

/**
 * List payment history
 */
export async function listPayments(): Promise<BreezPayment[]> {
  if (!breezInstance) {
    throw new Error('Breez SDK not initialized');
  }
  
  try {
    return await sdkListPayments();
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
