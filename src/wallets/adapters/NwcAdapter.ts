/**
 * NWC (Nostr Wallet Connect) Adapter
 * 
 * Implements WalletAdapter interface using NIP-47.
 * This is a stub for future implementation / fallback option.
 */

import type { WalletAdapter } from './WalletAdapter';

export class NwcAdapter implements WalletAdapter {
  private nwcUri: string;
  private relay: string;

  constructor(config: { nwcUri: string; relay?: string }) {
    this.nwcUri = config.nwcUri;
    this.relay = config.relay || 'wss://relay.getalby.com/v1';
  }

  async init(): Promise<void> {
    // TODO: Implement NWC initialization
    console.log('NwcAdapter: init() - not implemented yet');
    throw new Error('NwcAdapter not implemented yet');
  }

  async getBalance(): Promise<number> {
    // TODO: Implement NWC get balance
    throw new Error('NwcAdapter not implemented yet');
  }

  async createInvoice(amountMsat: number, memo?: string): Promise<{ bolt11: string }> {
    // TODO: Implement NWC create invoice
    throw new Error('NwcAdapter not implemented yet');
  }

async sendBolt11(invoice: string): Promise<{ id: string; status: 'success' | 'failed'; preimage?: string; txId?: string }> {
    // TODO: Implement NWC send bolt11
    throw new Error('NwcAdapter not implemented yet');
  }

  async payLnurlPay(
    url: string,
    amountMsat: number,
    comment?: string,
    zapRequestJson?: string
  ): Promise<{ id: string; status: 'success' | 'failed' }> {
    // TODO: Implement NWC LNURL-pay
    throw new Error('NwcAdapter not implemented yet');
  }

  async listPayments(): Promise<any[]> {
    // TODO: Implement NWC list payments
    return [];
  }

  onEvents(cb: (e: any) => void): void {
    // TODO: Implement NWC events
  }
}
