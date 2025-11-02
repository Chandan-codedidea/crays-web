import { createContext, useContext, createSignal, onMount, JSX } from 'solid-js';
import type { WalletAdapter } from '../wallets/adapters/WalletAdapter';
import { BreezAdapter } from '../wallets/adapters/BreezAdapter';
import { NwcAdapter } from '../wallets/adapters/NwcAdapter';

interface WalletState {
  initialized: boolean;
  balance: number | null;
  error: string | null;
  disabled: boolean;
}

interface Payment {
  id: string;
  amount: number;
  timestamp: number;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
}

interface CreateInvoiceParams {
  amount: number;
  description?: string;
}

interface PayLnurlPayParams {
  lnurlPay: string;
  amount: number;
  comment?: string;
}

interface WalletContextType {
  state: () => WalletState;
  getBalance: () => Promise<number>;
  createInvoice: (params: CreateInvoiceParams) => Promise<string>;
