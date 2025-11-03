/**
 * WalletAdapter Interface
 * 
 * Unified interface for all wallet implementations (Breez, NWC, etc.)
 * Keeps signatures minimal and UI-agnostic.
 */

export interface WalletAdapter {
  /**
   * Initialize the wallet adapter
   */
  init(): Promise<void>;

  /**
   * Get current wallet balance in millisatoshis
   */
  getBalance(): Promise<number>;

  /**
   * Create a Lightning invoice
   * @param amountMsat Amount in millisatoshis
   * @param memo Optional memo/description
   * @returns Invoice object with bolt11 string
   */
  createInvoice(amountMsat: number, memo?: string): Promise<{ bolt11: string }>;

  /**
   * Send payment via bolt11 invoice
   * @param invoice bolt11 invoice string
   * @returns Payment result with id, status, and optional preimage
   */
  sendBolt11(invoice: string): Promise<{ 
    id: string; 
    status: 'success' | 'failed'; 
    preimage?: string 
  }>;

  /**
   * Pay LNURL-pay endpoint
   * @param url LNURL-pay callback URL
   * @param amountMsat Amount in millisatoshis
   * @param comment Optional comment
   * @param zapRequestJson Optional NIP-57 zap request (serialized JSON)
   * @returns Payment result
   */
  payLnurlPay(
    url: string, 
    amountMsat: number, 
    comment?: string, 
    zapRequestJson?: string
  ): Promise<{ 
    id: string; 
    status: 'success' | 'failed' 
  }>;

  /**
   * List payment history
   */
  listPayments(): Promise<any[]>;

  /**
   * Register event listener for wallet events
   * @param cb Callback for wallet events
   */
  onEvents(cb: (e: any) => void): void;
}
