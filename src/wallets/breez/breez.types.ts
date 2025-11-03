/**
 * Breez SDK Types
 */

export interface BreezConfig {
  apiKey: string;
  network: 'bitcoin' | 'testnet' | 'signet' | 'regtest';
  workingDir?: string;
}

export interface BreezNodeState {
  id: string;
  blockHeight: number;
  channelsBalanceMsat: number;
  onchainBalanceMsat: number;
  pendingSendMsat: number;
  pendingReceiveMsat: number;
  inboundLiquidityMsats: number;
  maxPayableMsat: number;
  maxReceivableMsat: number;
  connectedPeers: string[];
}

export interface BreezPayment {
  id: string;
  paymentType: 'sent' | 'received';
  paymentTime: number;
  amountMsat: number;
  feeMsat: number;
  status: 'pending' | 'complete' | 'failed';
  description?: string;
  bolt11?: string;
  preimage?: string;
}

export interface BreezInvoice {
  bolt11: string;
  paymentHash: string;
  description?: string;
  amountMsat: number;
  expiry?: number;
}

export type BreezEvent = 
  | { type: 'paymentSucceeded'; payment: BreezPayment }
  | { type: 'paymentFailed'; error: string }
  | { type: 'invoicePaid'; invoice: BreezInvoice }
  | { type: 'synced' }
  | { type: 'balanceChanged'; balance: number };
