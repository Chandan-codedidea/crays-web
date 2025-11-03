/**
 * Breez Wallet Adapter
 * 
 * Implements WalletAdapter interface using Breez SDK (Spark/WASM).
 */
import type { WalletAdapter } from './WalletAdapter';
import * as BreezService from '../breez/breez.service';
import type { BreezEvent } from '../breez/breez.types';

export class BreezAdapter implements WalletAdapter {
  private apiKey: string;
  private network: 'bitcoin' | 'testnet' | 'signet' | 'regtest';
  private eventCallbacks: Array<(e: any) => void> = [];
  private _initialized = false;

  constructor(config: { apiKey: string; network?: 'bitcoin' | 'testnet' | 'signet' | 'regtest' }) {
    this.apiKey = config.apiKey;
    this.network = config.network || 'bitcoin';
  }

  async init(): Promise<void> {
    // Idempotency guard: prevent multiple initializations
    if (this._initialized) {
      return;
    }
    try {
      await BreezService.initBreez({
        apiKey: this.apiKey,
        network: this.network,
      });
      // Register event forwarder
      BreezService.addEventListener(this.handleBreezEvent.bind(this));
      // Mark as initialized
      this._initialized = true;
    } catch (error) {
      console.error('BreezAdapter: Failed to initialize', error);
      throw error;
    }
  }

  async getBalance(): Promise<number> {
    const nodeInfo = await BreezService.getNodeInfo();
    return nodeInfo?.maxPayable || 0;
  }

  async createInvoice(amountMsat: number, memo?: string): Promise<{ bolt11: string }> {
    return await BreezService.createInvoice(amountMsat, memo);
  }

async sendBolt11(invoice: string): Promise<{ id: string; status: 'success' | 'failed'; preimage?: string; txId?: string }> {
    const result = await BreezService.payInvoice(invoice);
    return { 
      id: result.id, 
      status: result.status === 'complete' ? 'success' : 'failed',
      preimage: result.paymentHash,
      txId: result.id
    };
  }

  async payLnurlPay(
    url: string,
    amountMsat: number,
    comment?: string,
    zapRequestJson?: string
  ): Promise<{ id: string; status: 'success' | 'failed' }> {
    // TODO: Implement LNURL-pay in breez.service.ts
    throw new Error('LNURL-pay not yet implemented in Breez service');
  }

  async listPayments(): Promise<any> {
    return await BreezService.listPayments();
  }

  onEvents(cb: (e: any) => void): void {
    this.eventCallbacks.push(cb);
  }

  private handleBreezEvent(event: BreezEvent): void {
    // Forward Breez events to registered callbacks
    this.eventCallbacks.forEach(cb => {
      try {
        cb(event);
      } catch (error) {
        console.error('BreezAdapter: Error in event callback', error);
      }
    });
  }
}
